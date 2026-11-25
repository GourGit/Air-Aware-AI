"""Mobility Agent: Computes transit emissions and provides guidance using LLM."""

from __future__ import annotations

import re
from app.agents.state import AgentState
from app.agents.schemas import MobilityAgentOutput, MobilityComparison
from app.agents.tools import get_emission_comparison_tool
from app.services.llm import LLMClient


MOBILITY_AGENT_SYSTEM_PROMPT = """You are the AirAware AI Mobility Agent. Provide sustainable 
transport guidance with deterministic emission calculations.

Key principles:
- Use tools for deterministic emission calculations (ARAI/CEA factors)
- Interpret results in context of user's trip and air quality
- Explain trade-offs: time vs emissions vs exposure
- Don't equate CO2e savings with guaranteed local AQI improvement
- Document emission factors and assumptions
- Active modes (walking, cycling) have health benefits but higher exposure in polluted areas
- Metro/rail typically lowest emissions and lowest street-level exposure

Return structured output matching MobilityAgentOutput schema."""


async def mobility_agent_node(state: AgentState) -> dict:
    """Generate mobility guidance with emission calculations."""
    env = state.environmental_context
    aqi = env.get("air_quality", {}).get("aqi")
    category = env.get("air_quality", {}).get("category", "Unknown")
    
    # Extract trip details from user message or use defaults
    user_msg = state.user_message.lower()
    
    # Try to extract distance from message
    distance_match = re.search(r'(\d+(?:\.\d+)?)\s*km', user_msg)
    distance_km = float(distance_match.group(1)) if distance_match else 10.0
    
    origin = state.selected_location.get("city", "Current Location")
    destination = "Destination"
    
    # Get deterministic comparisons
    comparisons_data = await get_emission_comparison_tool(
        distance_km=distance_km,
        origin=origin,
        destination=destination,
        passengers=1,
    )
    
    comparisons = [
        MobilityComparison(**c) for c in comparisons_data
    ]
    
    top_choice = comparisons[0] if comparisons else None
    
    # Use LLM to interpret and add context
    messages = [
        {"role": "system", "content": MOBILITY_AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": f"""
Current outdoor AQI: {aqi} ({category})
Trip: {distance_km} km from {origin} to {destination}
Emission comparisons: {comparisons_data}

Provide interpretation and recommendations.
"""},
    ]
    
    try:
        async with LLMClient() as client:
            # Get interpretation but keep deterministic calculations
            interpretation = await client.complete(messages)
        
        return {
            "mobility_agent_output": MobilityAgentOutput(
                comparisons=comparisons,
                top_sustainable_choice=top_choice.mode if top_choice else "metro",
                co2e_saved_potential_kg=top_choice.co2e_saved_vs_car_kg if top_choice else 0,
                distance_analyzed_km=distance_km,
            ).model_dump(),
            "executed_agents": state.executed_agents + ["mobility_agent"],
        }
    except Exception:
        # Fallback to deterministic only
        return mobility_agent_node_sync(state)


def mobility_agent_node_sync(state: AgentState) -> dict:
    """Synchronous deterministic fallback mobility guidance."""
    from app.agents.tools import get_emission_comparison_tool
    
    env = state.environmental_context
    aqi = env.get("air_quality", {}).get("aqi")
    category = env.get("air_quality", {}).get("category", "Unknown")
    
    user_msg = state.user_message.lower()
    distance_match = re.search(r'(\d+(?:\.\d+)?)\s*km', user_msg)
    distance_km = float(distance_match.group(1)) if distance_match else 10.0
    
    origin = state.selected_location.get("city", "Current Location")
    destination = "Destination"
    
    # Get deterministic comparisons (sync call)
    import asyncio
    comparisons_data = asyncio.run(get_emission_comparison_tool(
        distance_km=distance_km,
        origin=origin,
        destination=destination,
        passengers=1,
    ))
    
    comparisons = [MobilityComparison(**c) for c in comparisons_data]
    top_choice = comparisons[0] if comparisons else None
    
    return {
        "mobility_agent_output": MobilityAgentOutput(
            comparisons=comparisons,
            top_sustainable_choice=top_choice.mode if top_choice else "metro",
            co2e_saved_potential_kg=top_choice.co2e_saved_vs_car_kg if top_choice else 0,
            distance_analyzed_km=distance_km,
        ).model_dump(),
        "executed_agents": state.executed_agents + ["mobility_agent"],
    }