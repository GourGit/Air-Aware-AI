"""Indoor Air Quality Agent: Advises on ventilation, HEPA filtration, and household sources."""
from __future__ import annotations

from app.agents.state import AgentState


def indoor_agent_node(state: AgentState) -> dict:
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
        },
        "executed_agents": state.executed_agents + ["indoor_agent"],
    }
