"""Routine Planning Agent: Creates pollution-aware daily schedules using LLM."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.schemas import RoutineAgentOutput, RoutineItem
from app.services.llm import LLMClient


ROUTINE_AGENT_SYSTEM_PROMPT = """You are the AirAware AI Routine Planning Agent. Create a personalized daily schedule 
that minimizes air pollution exposure based on the current AQI and user context.

Guidelines:
- Morning (6-9 AM): Often worst AQI due to thermal inversion - recommend indoor activities if AQI > 150
- Commute (8-10 AM, 5-7 PM): Suggest sustainable transport, masks if AQI > 100
- Work/Study (9 AM-5 PM): Indoor air quality advice if relevant
- Afternoon (12-4 PM): Often best dispersion window - recommend outdoor activities if AQI permits
- Evening (5-8 PM): Variable - check current trends
- Night (8 PM+): Generally better but check local conditions

Always explain the environmental reasoning for each recommendation.
Be practical and specific, not generic.
Include a disclaimer that recommendations are based on ambient outdoor AQI, not personal exposure monitoring."""


async def routine_agent_node(state: AgentState) -> dict:
    """Generate pollution-aware daily routine using LLM."""
    env = state.environmental_context
    aqi = env.get("air_quality", {}).get("aqi")
    category = env.get("air_quality", {}).get("category", "Unknown")
    station = env.get("location", {}).get("name", "nearby station")
    
    # Get user profile context
    user_profile = state.user_profile_context
    
    messages = [
        {"role": "system", "content": ROUTINE_AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": f"""
Current AQI: {aqi} ({category}) at {station}
User location: {state.selected_location.get('city', 'Unknown')}
User preferences: {user_profile}
User query: {state.user_message}

Create a structured daily routine with morning, commute, work, afternoon, evening, and night periods.
"""},
    ]
    
    try:
        async with LLMClient() as client:
            routine = await client.complete(messages, RoutineAgentOutput)
        
        return {
            "routine_agent_output": routine.model_dump(),
            "executed_agents": state.executed_agents + ["routine_agent"],
        }
    except Exception:
        # Fallback to deterministic routine
        return routine_agent_node_sync(state)


def routine_agent_node_sync(state: AgentState) -> dict:
    """Synchronous deterministic fallback routine."""
    env = state.environmental_context
    aqi = env.get("air_quality", {}).get("aqi", 150)
    cat = env.get("air_quality", {}).get("category", "Moderate")
    
    if aqi > 250:
        morning_rec = "Avoid early morning outdoor runs due to surface thermal inversion trapping PM2.5. Do indoor stretching or yoga."
        travel_rec = "Keep vehicle windows rolled up; use metro or bus with N95 mask protection during peak congestion."
        evening_rec = "Limit outdoor leisure. Ensure indoor living areas are sealed and air purifier runs on medium setting."
    elif aqi > 100:
        morning_rec = "Moderate outdoor exercise is permissible after 8:30 AM once surface sun warms and disperses ground-level smog."
        travel_rec = "Public transit or cycling feasible; sensitive groups should consider light mask protection."
        evening_rec = "Good time for a walk between 4 PM and 6 PM before night temperature drops."
    else:
        morning_rec = "Excellent air quality for morning running, cycling, or outdoor sports."
        travel_rec = "Great weather for walking or active cycling commute."
        evening_rec = "Ideal conditions for outdoor social activities and open ventilation."
    
    items = [
        {"period": "morning", "title": "Morning Routine", "recommendation": morning_rec, "reason": f"AQI is {aqi} ({cat})"},
        {"period": "commute", "title": "Commute Guidance", "recommendation": travel_rec, "reason": "Exposure minimization"},
        {"period": "work", "title": "Work/Study Hours", "recommendation": "Maintain indoor air quality with purifier if available.", "reason": "Indoor protection"},
        {"period": "afternoon", "title": "Afternoon Activity", "recommendation": "If AQI permits, good window for outdoor movement.", "reason": "Atmospheric dispersion"},
        {"period": "evening", "title": "Evening Outdoor Activity", "recommendation": evening_rec, "reason": "Dispersion patterns"},
        {"period": "night", "title": "Night Routine", "recommendation": "Keep bedroom windows closed if outdoor AQI remains elevated.", "reason": "Overnight exposure"},
    ]
    
    return {
        "routine_agent_output": {
            "headline": f"Daily Plan for {cat} Air ({aqi} AQI)",
            "schedule": items,
        },
        "executed_agents": state.executed_agents + ["routine_agent"],
    }