"""Integration tests for LangGraph multi-agent flow."""
import pytest
from app.agents.orchestrator import orchestrator_node_sync
from app.agents.aqi_agent import aqi_agent_node_sync
from app.agents.synthesizer import synthesizer_node_sync
from app.agents.state import AgentState


def test_intent_classification():
    state1 = AgentState(request_id="1", user_message="What should my jogging routine be today?")
    res1 = orchestrator_node_sync(state1)
    assert res1["classified_intent"] == "routine_planning"
    assert "routine_agent" in res1["required_agents"]

    state2 = AgentState(request_id="2", user_message="Should I open windows or use air purifier?")
    res2 = orchestrator_node_sync(state2)
    assert res2["classified_intent"] == "indoor_air_advice"
    assert "indoor_agent" in res2["required_agents"]


def test_aqi_agent_execution():
    state = AgentState(
        request_id="3",
        user_message="Check Delhi air",
        selected_location={"city": "Delhi"},
    )
    res = aqi_agent_node_sync(state)
    assert "environmental_context" in res
    assert res["aqi_agent_output"]["aqi"] > 0
    assert res["aqi_agent_output"]["category"] in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]


def test_synthesizer_output():
    state = AgentState(
        request_id="4",
        user_message="Is air clean in Delhi?",
        selected_location={"city": "Delhi"},
        classified_intent="general_environmental_query",
    )
    aqi_res = aqi_agent_node_sync(state)
    state.environmental_context = aqi_res["environmental_context"]
    state.aqi_agent_output = aqi_res["aqi_agent_output"]
    res = synthesizer_node_sync(state)

    final = res["final_response"]
    assert "answer" in final
    assert "supporting_data" in final
    assert len(final["recommendations"]) > 0
    assert "sources" in final
