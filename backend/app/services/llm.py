"""Central LLM Provider Abstraction for AirAware AI.

Supports multiple providers through a unified interface with configurable
timeouts, retries, and structured output.
"""

from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod
from typing import Any, Optional, TypeVar, Generic, Type
from dataclasses import dataclass
from enum import Enum

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class LLMProvider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OPENROUTER = "openrouter"


class LLMError(Exception):
    """Base exception for LLM errors."""
    pass


class LLMTimeoutError(LLMError):
    pass


class LLMRateLimitError(LLMError):
    pass


class LLMInvalidResponseError(LLMError):
    pass


@dataclass
class LLMConfig:
    """Configuration for LLM client."""
    provider: LLMProvider
    model: str
    api_key: str
    temperature: float = 0.3
    max_tokens: int = 2000
    timeout: float = 30.0
    max_retries: int = 3
    base_url: Optional[str] = None


class LLMClientBase(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, config: LLMConfig):
        self.config = config

    @abstractmethod
    async def complete(
        self,
        messages: list[dict[str, str]],
        response_model: Optional[Type[T]] = None,
        **kwargs: Any,
    ) -> Any:
        """Complete a chat conversation, optionally with structured output."""
        pass

    @abstractmethod
    async def close(self) -> None:
        """Close any open connections."""
        pass


class OpenAIClient(LLMClientBase):
    """OpenAI / OpenRouter compatible client."""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        try:
            from openai import AsyncOpenAI
        except ImportError:
            raise LLMError("openai package not installed. Run: pip install openai")
        
        self.client = AsyncOpenAI(
            api_key=config.api_key,
            base_url=config.base_url,
            timeout=config.timeout,
            max_retries=0,  # We handle retries ourselves
        )

    async def complete(
        self,
        messages: list[dict[str, str]],
        response_model: Optional[Type[T]] = None,
        **kwargs: Any,
    ) -> Any:
        import asyncio
        from openai import RateLimitError, APITimeoutError, APIError
        
        last_error = None
        for attempt in range(self.config.max_retries + 1):
            try:
                if response_model:
                    # Use structured output if available (OpenAI beta)
                    completion = await self.client.beta.chat.completions.parse(
                        model=self.config.model,
                        messages=messages,
                        response_format=response_model,
                        temperature=self.config.temperature,
                        max_tokens=self.config.max_tokens,
                    )
                    return completion.choices[0].message.parsed
                else:
                    completion = await self.client.chat.completions.create(
                        model=self.config.model,
                        messages=messages,
                        temperature=self.config.temperature,
                        max_tokens=self.config.max_tokens,
                    )
                    return completion.choices[0].message.content
                    
            except RateLimitError as e:
                last_error = LLMRateLimitError(f"Rate limit exceeded: {e}")
                if attempt < self.config.max_retries:
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
            except APITimeoutError as e:
                last_error = LLMTimeoutError(f"Request timeout: {e}")
                if attempt < self.config.max_retries:
                    await asyncio.sleep(2 ** attempt)
            except APIError as e:
                last_error = LLMError(f"API error: {e}")
                if attempt < self.config.max_retries:
                    await asyncio.sleep(2 ** attempt)
            except Exception as e:
                last_error = LLMError(f"Unexpected error: {e}")
                break
        
        raise last_error or LLMError("Max retries exceeded")

    async def close(self) -> None:
        await self.client.close()


class AnthropicClient(LLMClientBase):
    """Anthropic Claude client."""

    def __init__(self, config: LLMConfig):
        super().__init__(config)
        try:
            from anthropic import AsyncAnthropic
        except ImportError:
            raise LLMError("anthropic package not installed. Run: pip install anthropic")
        
        self.client = AsyncAnthropic(
            api_key=config.api_key,
            timeout=config.timeout,
            max_retries=0,
        )

    async def complete(
        self,
        messages: list[dict[str, str]],
        response_model: Optional[Type[T]] = None,
        **kwargs: Any,
    ) -> Any:
        import asyncio
        from anthropic import RateLimitError, APITimeoutError, APIError
        
        # Convert messages format for Anthropic
        system_prompt = None
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_prompt = msg["content"]
            else:
                anthropic_messages.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })
        
        last_error = None
        for attempt in range(self.config.max_retries + 1):
            try:
                if response_model:
                    # Anthropic doesn't have native structured output yet
                    # We'll use tool calling approach or JSON mode
                    import json
                    schema = response_model.model_json_schema()
                    tool = {
                        "name": "structured_output",
                        "description": "Return structured output",
                        "input_schema": schema,
                    }
                    response = await self.client.messages.create(
                        model=self.config.model,
                        system=system_prompt,
                        messages=anthropic_messages,
                        max_tokens=self.config.max_tokens,
                        temperature=self.config.temperature,
                        tools=[tool],
                        tool_choice={"type": "tool", "name": "structured_output"},
                    )
                    # Extract tool use result
                    for content in response.content:
                        if content.type == "tool_use":
                            return response_model(**content.input)
                    raise LLMInvalidResponseError("No tool use in response")
                else:
                    response = await self.client.messages.create(
                        model=self.config.model,
                        system=system_prompt,
                        messages=anthropic_messages,
                        max_tokens=self.config.max_tokens,
                        temperature=self.config.temperature,
                    )
                    return response.content[0].text
                    
            except RateLimitError as e:
                last_error = LLMRateLimitError(f"Rate limit exceeded: {e}")
                if attempt < self.config.max_retries:
                    await asyncio.sleep(2 ** attempt)
            except APITimeoutError as e:
                last_error = LLMTimeoutError(f"Request timeout: {e}")
                if attempt < self.config.max_retries:
                    await asyncio.sleep(2 ** attempt)
            except APIError as e:
                last_error = LLMError(f"API error: {e}")
                if attempt < self.config.max_retries:
                    await asyncio.sleep(2 ** attempt)
            except Exception as e:
                last_error = LLMError(f"Unexpected error: {e}")
                break
        
        raise last_error or LLMError("Max retries exceeded")

    async def close(self) -> None:
        await self.client.close()


def create_llm_client(config: Optional[LLMConfig] = None) -> LLMClientBase:
    """Factory function to create LLM client from config or environment."""
    from app.config import get_settings
    
    settings = get_settings()
    
    if config is None:
        provider_str = settings.LLM_PROVIDER.lower()
        try:
            provider = LLMProvider(provider_str)
        except ValueError:
            raise LLMError(f"Unknown LLM provider: {provider_str}. Supported: {[p.value for p in LLMProvider]}")
        
        api_key = settings.LLM_API_KEY
        if not api_key:
            raise LLMError("LLM_API_KEY not configured in environment")
        
        config = LLMConfig(
            provider=provider,
            model=settings.LLM_MODEL,
            api_key=api_key,
        )
    
    if config.provider in (LLMProvider.OPENAI, LLMProvider.OPENROUTER):
        if config.provider == LLMProvider.OPENROUTER:
            config.base_url = "https://openrouter.ai/api/v1"
        return OpenAIClient(config)
    elif config.provider == LLMProvider.ANTHROPIC:
        return AnthropicClient(config)
    else:
        raise LLMError(f"Provider {config.provider} not implemented")


class LLMClient:
    """High-level LLM client with context management."""
    
    def __init__(self, client: Optional[LLMClientBase] = None):
        self._client = client
        self._owned = client is None
    
    async def __aenter__(self) -> "LLMClient":
        if self._client is None:
            self._client = create_llm_client()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if self._owned and self._client:
            await self._client.close()
    
    async def complete(
        self,
        messages: list[dict[str, str]],
        response_model: Optional[Type[T]] = None,
        **kwargs: Any,
    ) -> Any:
        if not self._client:
            raise LLMError("LLM client not initialized")
        return await self._client.complete(messages, response_model, **kwargs)
    
    @property
    def client(self) -> LLMClientBase:
        if not self._client:
            raise LLMError("LLM client not initialized")
        return self._client