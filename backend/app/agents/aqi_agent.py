"""AQI Intelligence Agent: Fetches environmental data and interprets using LLM."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.schemas import AQIAgentOutput, AQIAgentInput
from app.agents.tools import get_current_aqi_tool, get_historical_aqi_tool, get_forecast_aqi_tool, find_station_tool
from app.services.llm import LLMClient
from app.database.session import get_db
from app.services.station_service import get_current_air_quality_sync


AQI_AGENT_SYSTEM_PROMPT = """You are the AirAware AI AQI Intelligence Agent. Your role is to:

1. Fetch current air quality data using available tools
2. Optionally fetch historical data and forecasts when requested
3. Interpret the data in context of CPCB standards
4. Return structured output with all relevant measurements, source attribution, and health context

Key principles:
- Always use tools to get actual data - never invent measurements
- Distinguish clearly between observed, forecast, and demo data
- Include source, timestamps, and data freshness in your output
- If data is unavailable, return status="unavailable" with clear explanation
- CPCB standard requires minimum 3 pollutants with at least one particulate (PM2.5 or PM10)"""


async def aqi_agent_node(state: AgentState) -> dict:
    """Fetch and interpret air quality data."""
    # Parse input from state
    loc = state.selected_location
    latitude = loc.get("latitude")
    longitude = loc.get("longitude")
    city = loc.get("city") or loc.get("name")
    
    # Check if user requested historical or forecast
    user_msg = state.user_message.lower()
    include_historical = any(k in user_msg for k in ["history", "historical", "past", "trend", "24 hour", "yesterday"])
    include_forecast = any(k in user_msg for k in ["forecast", "predict", "tomorrow", "next", "future", "will be"])
    
    # Get database session
    db_gen = get_db()
    db = await anext(db_gen)
    
    try:
        # Get current AQI
        current_data = await get_current_aqi_tool(
            db=db,
            latitude=latitude,
            longitude=longitude,
            city=city,
        )
        
        # Get historical if requested
        historical_data = None
        if include_historical and current_data.get("location", {}).get("station_id"):
            station_id = current_data["location"]["station_id"]
            if station_id and not current_data.get("metadata", {}).get("is_demo"):
                historical_data = await get_historical_aqi_tool(db, station_id, 24)
        
        # Get forecast if requested
        forecast_data = None
        if include_forecast and latitude and longitude:
            forecast_data = await get_forecast_aqi_tool(latitude, longitude, 3)
        
        # Build structured output
        output = AQIAgentOutput(
            aqi=current_data.get("air_quality", {}).get("aqi"),
            category=current_data.get("air_quality", {}).get("category", "Unknown"),
            color=current_data.get("air_quality", {}).get("color", "#71818A"),
            prominent_pollutant=current_data.get("air_quality", {}).get("prominent_pollutant"),
            station_name=current_data.get("location", {}).get("name", "Unknown"),
            station_distance_km=current_data.get("metadata", {}).get("station_distance_km"),
            is_standard_met=current_data.get("air_quality", {}).get("is_standard_met", False),
            status=current_data.get("air_quality", {}).get("status", "unavailable"),
            health_summary=current_data.get("health_advisory", {}).get("summary", ""),
            pollutants={
                k: {"value": v.get("value"), "unit": v.get("unit"), "sub_index": v.get("sub_index")}
                for k, v in current_data.get("pollutants", {}).items()
            },
            data_source=current_data.get("metadata", {}).get("source", "Unknown"),
            observed_at=current_data.get("metadata", {}).get("observed_at"),
            retrieved_at=current_data.get("metadata", {}).get("retrieved_at"),
            data_freshness=current_data.get("metadata", {}).get("data_freshness", "unknown"),
            is_demo=current_data.get("metadata", {}).get("is_demo", False),
            historical_data=historical_data,
            forecast_data=forecast_data,
        )
        
        return {
            "environmental_context": current_data,
            "aqi_agent_output": output.model_dump(),
            "source_references": [current_data.get("metadata", {}).get("source", "CPCB")],
            "executed_agents": state.executed_agents + ["aqi_agent"],
        }
        
    finally:
        await db.close()


def aqi_agent_node_sync(state: AgentState) -> dict:
    """Synchronous fallback using demo data."""
    loc = state.selected_location
    latitude = loc.get("latitude")
    longitude = loc.get("longitude")
    city = loc.get("city") or loc.get("name")
    
    current_data = get_current_air_quality_sync(latitude=latitude, longitude=longitude, city=city)
    
    output = AQIAgentOutput(
        aqi=current_data.get("air_quality", {}).get("aqi"),
        category=current_data.get("air_quality", {}).get("category", "Unknown"),
        color=current_data.get("air_quality", {}).get("color", "#71818A"),
        prominent_pollutant=current_data.get("air_quality", {}).get("prominent_pollutant"),
        station_name=current_data.get("location", {}).get("name", "Unknown"),
        station_distance_km=current_data.get("metadata", {}).get("station_distance_km"),
        is_standard_met=current_data.get("air_quality", {}).get("is_standard_met", False),
        status=current_data.get("air_quality", {}).get("status", "unavailable"),
        health_summary=current_data.get("health_advisory", {}).get("summary", ""),
        pollutants={
            k: {"value": v.get("value"), "unit": v.get("unit"), "sub_index": v.get("sub_index")}
            for k, v in current_data.get("pollutants", {}).items()
        },
        data_source=current_data.get("metadata", {}).get("source", "Unknown"),
        observed_at=current_data.get("metadata", {}).get("observed_at"),
        retrieved_at=current_data.get("metadata", {}).get("retrieved_at"),
        data_freshness=current_data.get("metadata", {}).get("data_freshness", "unknown"),
        is_demo=current_data.get("metadata", {}).get("is_demo", False),
        historical_data=None,
        forecast_data=None,
    )
    
    return {
        "environmental_context": current_data,
        "aqi_agent_output": output.model_dump(),
        "source_references": [current_data.get("metadata", {}).get("source", "CPCB")],
        "executed_agents": state.executed_agents + ["aqi_agent"],
    }