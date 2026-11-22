"""Mobility Agent: Computes transit emissions comparison and route suggestions."""
from __future__ import annotations

from app.agents.state import AgentState
from app.services.emission_service import compare_transport_modes


def mobility_agent_node(state: AgentState) -> dict:
    # Default 10km comparison if distance not specified in query
    comparisons = compare_transport_modes(10.0, origin="Current Location", destination="City Center")

    return {
        "mobility_agent_output": {
            "comparisons": comparisons,
            "top_sustainable_choice": "metro",
            "co2e_saved_potential_kg": comparisons[0]["co2e_saved_vs_car_kg"] if comparisons else 1.5,
        },
        "executed_agents": state.executed_agents + ["mobility_agent"],
    }
