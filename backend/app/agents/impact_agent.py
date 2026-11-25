"""Impact Agent: Calculates user's actual environmental impact from logged activities."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.schemas import ImpactAgentOutput
from app.agents.tools import calculate_user_impact_tool
from app.database.session import get_db


async def impact_agent_node(state: AgentState) -> dict:
    """Calculate actual user impact from persisted data."""
    user_id = state.user_id
    
    if not user_id:
        return {
            "impact_agent_output": ImpactAgentOutput(
                total_co2e_saved_kg=0.0,
                total_sustainable_km=0.0,
                total_trips_logged=0,
                tier="No Data",
                methodology="ARAI & CEA 2024 Passenger Grid Baseline",
                data_coverage="Requires authenticated user with logged activities",
                assumptions=["User must log sustainable trips via mobility tracking"],
            ).model_dump(),
            "executed_agents": state.executed_agents + ["impact_agent"],
        }
    
    db_gen = get_db()
    db = await anext(db_gen)
    
    try:
        impact_data = await calculate_user_impact_tool(db, user_id)
        
        return {
            "impact_agent_output": ImpactAgentOutput(**impact_data).model_dump(),
            "executed_agents": state.executed_agents + ["impact_agent"],
        }
    finally:
        await db.close()


def impact_agent_node_sync(state: AgentState) -> dict:
    """Synchronous fallback impact (demo data)."""
    return {
        "impact_agent_output": ImpactAgentOutput(
            total_co2e_saved_kg=42.5,
            total_sustainable_km=280.0,
            total_trips_logged=28,
            tier="Urban Steward Level 2",
            methodology="ARAI & CEA 2024 Passenger Grid Baseline",
            data_coverage="Demo data - requires authenticated user with logged activities",
            assumptions=["User must log sustainable trips via mobility tracking"],
        ).model_dump(),
        "executed_agents": state.executed_agents + ["impact_agent"],
    }