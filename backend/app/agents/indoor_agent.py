"""Indoor Air Quality Agent: Provides practical indoor air guidance using LLM."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.schemas import IndoorAgentOutput
from app.services.llm import LLMClient


INDOOR_AGENT_SYSTEM_PROMPT = """You are the AirAware AI Indoor Air Quality Agent. Provide practical, 
evidence-based guidance for indoor air quality management.

Key principles:
- Outdoor AQI drives infiltration - when outdoor is poor, keep windows closed
- Cooking (especially frying, spices) generates significant PM2.5 and VOCs - always use exhaust
- HEPA filtration is effective for particles; activated carbon for VOCs/odors
- Humidity 40-60% optimal - too low = respiratory irritation, too high = mold
- Dust with damp cloths, not dry sweeping
- Plants have minimal effect on indoor AQI - don't suggest as primary filtration
- Ventilation timing matters: best when outdoor AQI is good (often midday)
- Never claim opening windows is always beneficial

Distinguish clearly between:
- Generic guidance (based on outdoor AQI)
- Specific recommendations (if user has purifier, sensors, etc.)

Return structured output matching IndoorAgentOutput schema."""


async def indoor_agent_node(state: AgentState) -> dict:
    """Generate indoor air quality guidance using LLM."""
    env = state.environmental_context
    outdoor_aqi = env.get("air_quality", {}).get("aqi")
    outdoor_category = env.get("air_quality", {}).get("category", "Unknown")
    
    user_context = state.user_profile_context
    
    messages = [
        {"role": "system", "content": INDOOR_AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": f"""
Outdoor AQI: {outdoor_aqi} ({outdoor_category})
User context: {user_context}
User query: {state.user_message}

Provide indoor air guidance including ventilation, purifier, cooking, dust, humidity, and filtration advice.
"""},
    ]
    
    try:
        async with LLMClient() as client:
            indoor = await client.complete(messages, IndoorAgentOutput)
        
        return {
            "indoor_agent_output": indoor.model_dump(),
            "executed_agents": state.executed_agents + ["indoor_agent"],
        }
    except Exception:
        # Fallback to deterministic
        return indoor_agent_node_sync(state)


def indoor_agent_node_sync(state: AgentState) -> dict:
    """Synchronous deterministic fallback indoor guidance."""
    env = state.environmental_context
    aqi = env.get("air_quality", {}).get("aqi", 150)
    
    if aqi > 200:
        vent_advice = "Keep windows and external doors closed. Outdoor air contains elevated particulates."
        purifier_advice = "Run HEPA air purifier on continuous auto/medium mode in bedrooms and living rooms."
    else:
        vent_advice = "Natural ventilation recommended between 12:00 PM and 3:00 PM when outdoor dispersion is highest."
        purifier_advice = "Air purifier can be kept on eco mode or standby."
    
    cooking_advice = "Always use an exhaust hood or chimney while frying or using spices to prevent VOC and ultrafine PM accumulation."
    
    return {
        "indoor_agent_output": {
            "ventilation_status": "Restricted" if aqi > 200 else "Recommended",
            "ventilation_advice": vent_advice,
            "purifier_guidance": purifier_advice,
            "cooking_advice": cooking_advice,
            "dust_advice": "Use damp microfiber cloths for dusting rather than dry brooms to avoid re-suspending particulate matter.",
            "humidity_advice": "Maintain indoor humidity between 40-60% to prevent mold growth and respiratory irritation.",
            "filtration_advice": "HEPA filters capture >99.97% of particles ≥0.3µm; activated carbon removes VOCs and odors.",
            "data_source": "General guidance based on outdoor AQI; not from indoor sensors",
        },
        "executed_agents": state.executed_agents + ["indoor_agent"],
    }