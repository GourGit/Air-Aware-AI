"""Typed state model for LangGraph Multi-Agent Environmental Workflow."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field


class AgentState(BaseModel):
    request_id: str
    user_id: Optional[str] = None
    conversation_id: Optional[str] = None
    user_message: str

    # Context
    selected_location: dict[str, Any] = Field(default_factory=dict)
    user_profile_context: dict[str, Any] = Field(default_factory=dict)
    environmental_context: dict[str, Any] = Field(default_factory=dict)

    # Orchestration & Routing
    classified_intent: str = "general_query"
    required_agents: list[str] = Field(default_factory=list)
    executed_agents: list[str] = Field(default_factory=list)

    # Sub-agent outputs
    aqi_agent_output: dict[str, Any] = Field(default_factory=dict)
    routine_agent_output: dict[str, Any] = Field(default_factory=dict)
    indoor_agent_output: dict[str, Any] = Field(default_factory=dict)
    mobility_agent_output: dict[str, Any] = Field(default_factory=dict)
    impact_agent_output: dict[str, Any] = Field(default_factory=dict)

    # Validation & Final Output
    validation_results: dict[str, Any] = Field(default_factory=dict)
    source_references: list[str] = Field(default_factory=list)
    final_response: dict[str, Any] = Field(default_factory=dict)
    execution_status: str = "initialized"
    error_details: Optional[str] = None
