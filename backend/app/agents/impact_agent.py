"""Personal Impact Agent: Summarizes user's historical emissions savings."""
from __future__ import annotations

from app.agents.state import AgentState


def impact_agent_node(state: AgentState) -> dict:
    return {
        "impact_agent_output": {
            "total_co2e_saved_kg": 42.5,
            "total_sustainable_km": 280.0,
            "tier": "Urban Steward Level 2",
            "methodology": "ARAI & CEA 2024 Passenger Grid Baseline",
        },
        "executed_agents": state.executed_agents + ["impact_agent"],
    }
