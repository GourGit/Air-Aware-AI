"""Routine Planning Agent: Constructs pollution-aware day schedule."""
from __future__ import annotations

from app.agents.state import AgentState


def routine_agent_node(state: AgentState) -> dict:
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
        {"period": "travel", "title": "Commute Guidance", "recommendation": travel_rec, "reason": "Exposure minimization"},
        {"period": "evening", "title": "Evening Outdoor Activity", "recommendation": evening_rec, "reason": "Atmospheric dispersion"},
    ]

    return {
        "routine_agent_output": {
            "headline": f"Daily Plan for {cat} Air ({aqi} AQI)",
            "schedule": items,
        },
        "executed_agents": state.executed_agents + ["routine_agent"],
    }
