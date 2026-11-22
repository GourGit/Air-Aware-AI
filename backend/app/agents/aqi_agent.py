"""AQI Intelligence Agent: Fetches station observations and interprets CPCB status."""
from __future__ import annotations

from app.agents.state import AgentState
from app.services.station_service import get_current_air_quality


def aqi_agent_node(state: AgentState) -> dict:
    loc = state.selected_location
    lat = loc.get("latitude")
    lng = loc.get("longitude")
    city = loc.get("city") or loc.get("name")

    aqi_data = get_current_air_quality(latitude=lat, longitude=lng, city=city)

    return {
        "environmental_context": aqi_data,
        "aqi_agent_output": {
            "aqi": aqi_data["air_quality"]["aqi"],
            "category": aqi_data["air_quality"]["category"],
            "prominent_pollutant": aqi_data["air_quality"]["prominent_pollutant"],
            "station": aqi_data["location"]["name"],
            "health_summary": aqi_data["health_advisory"]["summary"],
        },
        "source_references": [aqi_data["metadata"]["source"]],
        "executed_agents": state.executed_agents + ["aqi_agent"],
    }
