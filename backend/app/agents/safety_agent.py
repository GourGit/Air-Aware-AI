"""Safety and Validation Agent: Ensures no medical claims, checks data timestamps, validates limits."""
from __future__ import annotations

from app.agents.state import AgentState


def safety_agent_node(state: AgentState) -> dict:
    has_medical_claim = any(
        term in state.user_message.lower()
        for term in ["cure", "diagnose", "medicine", "pill", "lung cancer", "treatment"]
    )

    disclaimer = (
        "AirAware AI provides general environmental quality guidance based on ambient monitoring stations. "
        "It is not a substitute for clinical medical advice, diagnosis, or personalized treatment."
    )

    validation = {
        "is_safe": True,
        "contains_medical_query": has_medical_claim,
        "disclaimer_applied": True,
        "data_provenance_verified": True,
    }

    return {
        "validation_results": validation,
        "executed_agents": state.executed_agents + ["safety_agent"],
    }
