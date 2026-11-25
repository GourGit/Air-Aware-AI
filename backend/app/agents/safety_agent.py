"""Safety and Validation Agent: Validates outputs, checks data quality, applies disclaimers."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.schemas import SafetyAgentOutput, SafetyValidation
from app.services.llm import LLMClient


SAFETY_AGENT_SYSTEM_PROMPT = """You are the AirAware AI Safety & Validation Agent. Validate the agent outputs 
for safety, accuracy, and compliance.

Checks to perform:
1. Medical claims - Flag any language suggesting diagnosis, treatment, cure, or medical advice
2. Data provenance - Verify sources are cited, timestamps present, freshness assessed
3. Forecast vs observation - Ensure forecasts are clearly labeled as predictions
4. Missing data - Flag when data is unavailable or estimated
5. Numerical consistency - Check AQI calculations, sub-indices
6. Unsupported claims - Identify assertions not backed by data
7. Health disclaimer - Ensure appropriate disclaimer is included

Return structured SafetyValidation and the standard disclaimer."""


async def safety_agent_node(state: AgentState) -> dict:
    """Validate all agent outputs for safety and accuracy."""
    # Collect all agent outputs
    agent_outputs = {
        "aqi": state.aqi_agent_output,
        "routine": state.routine_agent_output,
        "indoor": state.indoor_agent_output,
        "mobility": state.mobility_agent_output,
        "impact": state.impact_agent_output,
    }
    
    # Remove empty outputs
    agent_outputs = {k: v for k, v in agent_outputs.items() if v}
    
    # Quick deterministic checks
    has_medical_query = any(
        term in state.user_message.lower()
        for term in ["cure", "diagnose", "medicine", "pill", "lung cancer", "treatment", "prescribe"]
    )
    
    # Check data freshness
    env = state.environmental_context
    data_freshness = env.get("metadata", {}).get("data_freshness", "unknown")
    data_freshness_ok = data_freshness in ("fresh", "recent")
    
    # Check data provenance
    data_provenance_verified = bool(state.source_references)
    
    # Check for numerical consistency in AQI
    numerical_consistency_ok = True
    if state.aqi_agent_output:
        aqi = state.aqi_agent_output.get("aqi")
        pollutants = state.aqi_agent_output.get("pollutants", {})
        if aqi and pollutants:
            sub_indices = [p.get("sub_index") for p in pollutants.values() if p.get("sub_index") is not None]
            if sub_indices:
                max_sub = max(sub_indices)
                if abs(aqi - max_sub) > 5:  # Allow small rounding differences
                    numerical_consistency_ok = False
    
    # LLM-based validation for complex checks
    messages = [
        {"role": "system", "content": SAFETY_AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": f"""
User message: {state.user_message}
Agent outputs: {agent_outputs}
Environmental context: {env}
"""},
    ]
    
    warnings = []
    unsupported_claims = []
    
    try:
        async with LLMClient() as client:
            validation_result = await client.complete(messages, SafetyValidation)
        
        validation = validation_result
    except Exception:
        # Fallback deterministic validation
        validation = SafetyValidation(
            is_safe=not has_medical_query,
            contains_medical_query=has_medical_query,
            disclaimer_applied=True,
            data_provenance_verified=data_provenance_verified,
            data_freshness_ok=data_freshness_ok,
            numerical_consistency_ok=numerical_consistency_ok,
            unsupported_claims=[],
            warnings=[],
        )
    
    disclaimer = (
        "AirAware AI provides general environmental quality guidance based on ambient monitoring stations. "
        "It is not a substitute for clinical medical advice, diagnosis, or personalized treatment. "
        "AQI values represent outdoor ambient conditions and may not reflect personal exposure or indoor levels."
    )
    
    return {
        "validation_results": validation.model_dump(),
        "executed_agents": state.executed_agents + ["safety_agent"],
    }


def safety_agent_node_sync(state: AgentState) -> dict:
    """Synchronous deterministic fallback validation."""
    agent_outputs = {
        "aqi": state.aqi_agent_output,
        "routine": state.routine_agent_output,
        "indoor": state.indoor_agent_output,
        "mobility": state.mobility_agent_output,
        "impact": state.impact_agent_output,
    }
    agent_outputs = {k: v for k, v in agent_outputs.items() if v}
    
    has_medical_query = any(
        term in state.user_message.lower()
        for term in ["cure", "diagnose", "medicine", "pill", "lung cancer", "treatment", "prescribe"]
    )
    
    env = state.environmental_context
    data_freshness = env.get("metadata", {}).get("data_freshness", "unknown")
    data_freshness_ok = data_freshness in ("fresh", "recent")
    data_provenance_verified = bool(state.source_references)
    
    numerical_consistency_ok = True
    if state.aqi_agent_output:
        aqi = state.aqi_agent_output.get("aqi")
        pollutants = state.aqi_agent_output.get("pollutants", {})
        if aqi and pollutants:
            sub_indices = [p.get("sub_index") for p in pollutants.values() if p.get("sub_index") is not None]
            if sub_indices:
                max_sub = max(sub_indices)
                if abs(aqi - max_sub) > 5:
                    numerical_consistency_ok = False
    
    validation = SafetyValidation(
        is_safe=not has_medical_query,
        contains_medical_query=has_medical_query,
        disclaimer_applied=True,
        data_provenance_verified=data_provenance_verified,
        data_freshness_ok=data_freshness_ok,
        numerical_consistency_ok=numerical_consistency_ok,
        unsupported_claims=[],
        warnings=[],
    )
    
    disclaimer = (
        "AirAware AI provides general environmental quality guidance based on ambient monitoring stations. "
        "It is not a substitute for clinical medical advice, diagnosis, or personalized treatment. "
        "AQI values represent outdoor ambient conditions and may not reflect personal exposure or indoor levels."
    )
    
    return {
        "validation_results": validation.model_dump(),
        "executed_agents": state.executed_agents + ["safety_agent"],
    }