"""AI Assistant chat schemas."""
from __future__ import annotations

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender: str
    content: str
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[ChatMessageResponse] = []


class AssistantChatRequest(BaseModel):
    conversation_id: uuid.UUID | None = None
    message: str
    latitude: float | None = None
    longitude: float | None = None
    city: str | None = None


class AssistantChatResponse(BaseModel):
    conversation_id: uuid.UUID
    answer: str
    intent: str
    supporting_data: dict = Field(default_factory=dict)
    recommendations: list[str] = Field(default_factory=list)
    limitations: str | None = None
    sources: list[str] = Field(default_factory=list)
    observed_at: datetime | None = None
    agents_used: list[str] = Field(default_factory=list)
