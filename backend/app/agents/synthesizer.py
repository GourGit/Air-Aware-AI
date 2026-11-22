"""Response Synthesizer: Combines specialist outputs into clean, unified response schema."""
from __future__ import annotations

from datetime import datetime, timezone
from app.agents.state import AgentState


def synthesizer_node(state: AgentState) -> dict:
    intent = state.classified_intent
    env = state.environmental_context
    aqi_out = state.aqi_agent_output
    routine_out = state.routine_agent_output
    indoor_out = state.indoor_agent_output
    mobility_out = state.mobility_agent_output

    aqi_val = aqi_out.get("aqi", "unknown")
    cat_val = aqi_out.get("category", "unspecified")
    station_val = aqi_out.get("station", "nearby station")

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
        answer_parts.append(aqi_out.get("health_summary", ""))
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
