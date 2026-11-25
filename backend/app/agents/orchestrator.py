"""Orchestrator Agent: Classifies intent and routes to specialists using LLM."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.schemas import IntentClassification
from app.services.llm import LLMClient, create_llm_client


ORCHESTRATOR_SYSTEM_PROMPT = """You are the AirAware AI Orchestrator. Classify the user's environmental query into one of these intents:

1. air_quality_inquiry - User wants current AQI, pollution levels, or air quality status
2. routine_planning - User wants a daily schedule, exercise timing, or activity planning based on air quality
3. indoor_air_advice - User asks about indoor air quality, purifiers, ventilation, cooking emissions, dust
4. mobility_guidance - User wants commute advice, transport emissions comparison, travel planning
5. impact_inquiry - User asks about their carbon footprint, emissions saved, sustainability impact
6. general_environmental_query - General questions about environment, pollution, climate

Respond with structured output matching the IntentClassification schema.
Consider the user's location context and any specific details they mention.
Be precise - only route to agents that are actually needed."""


async def orchestrator_node(state: AgentState) -> dict:
    """Classify user intent using LLM with structured output."""
    # Build context for classification
    location_info = ""
    if state.selected_location:
        city = state.selected_location.get("city")
        if city:
            location_info = f"User location: {city}. "
    
    messages = [
        {"role": "system", "content": ORCHESTRATOR_SYSTEM_PROMPT},
        {"role": "user", "content": f"{location_info}Query: {state.user_message}"},
    ]
    
    try:
        async with LLMClient() as client:
            classification = await client.complete(messages, IntentClassification)
        
        return {
            "classified_intent": classification.intent,
            "required_agents": classification.required_agents,
            "execution_status": "orchestrated",
        }
    except Exception:
        # Fallback to keyword-based classification
        return orchestrator_node_sync(state)


def orchestrator_node_sync(state: AgentState) -> dict:
    """Synchronous keyword-based classification for tests and fallback."""
    msg = state.user_message.lower()

    required_agents = []
    intent = "general_query"

    if any(k in msg for k in ["routine", "schedule", "daily plan", "plan my day", "jog", "exercise", "run"]):
        intent = "routine_planning"
        required_agents = ["aqi_agent", "routine_agent"]
    elif any(k in msg for k in ["indoor", "purifier", "filter", "cooking", "window", "ventilat", "room"]):
        intent = "indoor_air_advice"
        required_agents = ["aqi_agent", "indoor_agent"]
    elif any(k in msg for k in ["commute", "travel", "transport", "bus", "metro", "car", "bike", "drive"]):
        intent = "mobility_guidance"
        required_agents = ["aqi_agent", "mobility_agent"]
    elif any(k in msg for k in ["impact", "carbon", "co2", "footprint", "saved", "emission"]):
        intent = "impact_inquiry"
        required_agents = ["impact_agent"]
    elif any(k in msg for k in ["aqi", "pollution", "air quality", "pm2.5", "pm10", "smog", "smoke"]):
        intent = "air_quality_inquiry"
        required_agents = ["aqi_agent"]
    else:
        intent = "general_environmental_query"
        required_agents = ["aqi_agent"]

    return {
        "classified_intent": intent,
        "required_agents": required_agents,
        "execution_status": "orchestrated",
    }