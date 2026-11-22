"""Orchestrator Agent: Understands query, classifies intent, determines required specialists."""
from __future__ import annotations

import re
from app.agents.state import AgentState


def orchestrator_node(state: AgentState) -> dict:
    """Classify user intent using robust keyword pattern heuristics (fast & deterministic)."""
    msg = state.user_message.lower()

    required_agents = []
    intent = "general_query"

    if any(k in msg for k in ["routine", "schedule", "daily plan", "plan my day", "jog", "exercise", "run"]):
        intent = "routine_planning"
        required_agents = ["aqi_agent", "routine_agent"]
    elif any(k in msg for k in ["indoor", "purifier", "filter", "cooking", "window", "ventilat", "room"]):
        intent = "indoor_air_advice"
        required_agents = ["aqi_agent", "indoor_agent"]
    elif any(k in msg for k in ["commute", "travel", "transport", "bus", "metro", "car", "bike", "drive"]):
        intent = "mobility_guidance"
        required_agents = ["aqi_agent", "mobility_agent"]
    elif any(k in msg for k in ["impact", "carbon", "co2", "footprint", "saved", "emission"]):
        intent = "impact_inquiry"
        required_agents = ["impact_agent"]
    elif any(k in msg for k in ["aqi", "pollution", "air quality", "pm2.5", "pm10", "smog", "smoke"]):
        intent = "air_quality_inquiry"
        required_agents = ["aqi_agent"]
    else:
        intent = "general_environmental_query"
        required_agents = ["aqi_agent"]

    return {
        "classified_intent": intent,
        "required_agents": required_agents,
        "execution_status": "orchestrated",
    }
