"""Response Synthesizer: Combines specialist outputs into unified response using LLM."""

from __future__ import annotations

from datetime import datetime, timezone
from app.agents.state import AgentState
from app.agents.schemas import SynthesizerOutput
from app.services.llm import LLMClient


SYNTHESIZER_SYSTEM_PROMPT = """You are the AirAware AI Response Synthesizer. Combine specialist agent outputs 
into a clear, actionable user response.

Principles:
- Start with a direct answer to the user's question
- Include environmental context (AQI, category, station, data source)
- Present practical recommendations from relevant agents
- Include supporting measurements and data
- Clearly state limitations and uncertainties
- Cite sources with timestamps
- Never invent data to fill gaps
- If data is unavailable, say so clearly
- Distinguish observations from forecasts

Output must match the SynthesizerOutput schema exactly."""


async def synthesizer_node(state: AgentState) -> dict:
    """Synthesize final response from all agent outputs."""
    intent = state.classified_intent
    env = state.environmental_context
    aqi_out = state.aqi_agent_output
    routine_out = state.routine_agent_output
    indoor_out = state.indoor_agent_output
    mobility_out = state.mobility_agent_output
    impact_out = state.impact_agent_output
    safety_out = state.validation_results
    
    aqi_val = aqi_out.get("aqi") if aqi_out else None
    cat_val = aqi_out.get("category") if aqi_out else "Unknown"
    station_val = aqi_out.get("station_name") if aqi_out else "nearby station"
    is_demo = aqi_out.get("is_demo", False) if aqi_out else False
    data_source = aqi_out.get("data_source") if aqi_out else "Unknown"
    observed_at = aqi_out.get("observed_at") if aqi_out else None
    data_freshness = aqi_out.get("data_freshness") if aqi_out else "unknown"
    
    messages = [
        {"role": "system", "content": SYNTHESIZER_SYSTEM_PROMPT},
        {"role": "user", "content": f"""
User intent: {intent}
User message: {state.user_message}
AQI: {aqi_val} ({cat_val}) at {station_val} {'[DEMO DATA]' if is_demo else ''}
Data source: {data_source}
Observed at: {observed_at}
Data freshness: {data_freshness}
Is demo: {is_demo}

AQI agent output: {aqi_out}
Routine agent output: {routine_out}
Indoor agent output: {indoor_out}
Mobility agent output: {mobility_out}
Impact agent output: {impact_out}
Safety validation: {safety_out}
Executed agents: {state.executed_agents}
Source references: {state.source_references}

Synthesize a complete response following the schema.
"""},
    ]
    
    try:
        async with LLMClient() as client:
            synthesis = await client.complete(messages, SynthesizerOutput)
        
        final_response = synthesis.model_dump()
        
        # Ensure observed_at is set
        if not final_response.get("observed_at"):
            final_response["observed_at"] = datetime.now(timezone.utc).isoformat()
        
        return {
            "final_response": final_response,
            "execution_status": "completed",
        }
    except Exception:
        # Fallback deterministic synthesis
        return synthesizer_node_sync(state)


def synthesizer_node_sync(state: AgentState) -> dict:
    """Synchronous deterministic fallback synthesis."""
    intent = state.classified_intent
    env = state.environmental_context
    aqi_out = state.aqi_agent_output
    routine_out = state.routine_agent_output
    indoor_out = state.indoor_agent_output
    mobility_out = state.mobility_agent_output
    impact_out = state.impact_agent_output
    safety_out = state.validation_results
    
    aqi_val = aqi_out.get("aqi", "unknown") if aqi_out else "unknown"
    cat_val = aqi_out.get("category", "unspecified") if aqi_out else "unspecified"
    station_val = aqi_out.get("station", "nearby station") if aqi_out else "nearby station"
    
    answer_parts = []
    recommendations = []
    
    if intent == "routine_planning" and routine_out:
        answer_parts.append(f"Here is your pollution-aware routine for today. Ambient AQI at {station_val} is {aqi_val} ({cat_val}).")
        for item in routine_out.get("schedule", []):
            recommendations.append(f"{item['title']}: {item['recommendation']}")
    elif intent == "indoor_air_advice" and indoor_out:
        answer_parts.append(f"For indoor air management, outdoor AQI is currently {aqi_val} ({cat_val}).")
        answer_parts.append(indoor_out.get("ventilation_advice", ""))
        recommendations.append(indoor_out.get("purifier_guidance", ""))
        recommendations.append(indoor_out.get("cooking_advice", ""))
    elif intent == "mobility_guidance" and mobility_out:
        answer_parts.append(f"Taking sustainable transit can save substantial greenhouse emissions. Current outdoor AQI is {aqi_val}.")
        recommendations.append("Choose metro rail or electric buses for lowest emissions and lower street-level particulate exposure.")
    else:
        answer_parts.append(f"Current air quality at {station_val} is {cat_val} with an AQI of {aqi_val}.")
        answer_parts.append(aqi_out.get("health_summary", "") if aqi_out else "")
        recommendations.append("Check local AQI before undertaking strenuous outdoor aerobic exercise.")
        if aqi_val != "unknown" and int(aqi_val) > 200:
            recommendations.append("Wear an N95 certified respirator mask when commuting in congested traffic corridors.")
    
    final_dict = {
        "answer": " ".join(answer_parts),
        "intent": intent,
        "supporting_data": {
            "aqi": aqi_val,
            "category": cat_val,
            "station": station_val,
            "pollutants": env.get("pollutants", {}),
        },
        "recommendations": recommendations,
        "limitations": "Air quality is measured at outdoor ambient monitoring stations and may vary at micro-local street levels.",
        "sources": state.source_references or ["Central Pollution Control Board (CPCB)"],
        "observed_at": datetime.now(timezone.utc).isoformat(),
        "agents_used": state.executed_agents + ["synthesizer"],
    }
    
    return {
        "final_response": final_dict,
        "execution_status": "completed",
    }