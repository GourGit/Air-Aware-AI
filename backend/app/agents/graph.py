"""LangGraph StateGraph compiler and fallback runner for the AirAware AI Multi-Agent System."""
from __future__ import annotations

import uuid
from typing import Any
from app.agents.state import AgentState
from app.agents.orchestrator import orchestrator_node
from app.agents.aqi_agent import aqi_agent_node
from app.agents.routine_agent import routine_agent_node
from app.agents.indoor_agent import indoor_agent_node
from app.agents.mobility_agent import mobility_agent_node
from app.agents.impact_agent import impact_agent_node
from app.agents.safety_agent import safety_agent_node
from app.agents.synthesizer import synthesizer_node

# Try importing LangGraph if installed in environment
try:
    from langgraph.graph import StateGraph, END
    HAS_LANGGRAPH = True
except ImportError:
    HAS_LANGGRAPH = False
    StateGraph = None
    END = None


def route_to_specialists(state: AgentState) -> str:
    """Conditional routing based on classified user intent."""
    intent = state.classified_intent
    if intent == "routine_planning":
        return "routine_agent"
    elif intent == "indoor_air_advice":
        return "indoor_agent"
    elif intent == "mobility_guidance":
        return "mobility_agent"
    elif intent == "impact_inquiry":
        return "impact_agent"
    else:
        return "safety_agent"


def build_agent_graph():
    """Construct and compile the multi-agent execution workflow using LangGraph."""
    if not HAS_LANGGRAPH:
        return None

    workflow = StateGraph(AgentState)

    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("aqi_agent", aqi_agent_node)
    workflow.add_node("routine_agent", routine_agent_node)
    workflow.add_node("indoor_agent", indoor_agent_node)
    workflow.add_node("mobility_agent", mobility_agent_node)
    workflow.add_node("impact_agent", impact_agent_node)
    workflow.add_node("safety_agent", safety_agent_node)
    workflow.add_node("synthesizer", synthesizer_node)

    workflow.set_entry_point("orchestrator")
    workflow.add_edge("orchestrator", "aqi_agent")

    workflow.add_conditional_edges(
        "aqi_agent",
        route_to_specialists,
        {
            "routine_agent": "routine_agent",
            "indoor_agent": "indoor_agent",
            "mobility_agent": "mobility_agent",
            "impact_agent": "impact_agent",
            "safety_agent": "safety_agent",
        },
    )

    workflow.add_edge("routine_agent", "safety_agent")
    workflow.add_edge("indoor_agent", "safety_agent")
    workflow.add_edge("mobility_agent", "safety_agent")
    workflow.add_edge("impact_agent", "safety_agent")
    workflow.add_edge("safety_agent", "synthesizer")
    workflow.add_edge("synthesizer", END)

    return workflow.compile()


agent_graph = build_agent_graph()


async def _run_sequential_flow(state: AgentState) -> dict:
    """Direct execution following the exact LangGraph conditional DAG edges."""
    # 1. Orchestrator
    o_update = orchestrator_node(state)
    for k, v in o_update.items():
        setattr(state, k, v)

    # 2. AQI Agent (Baseline)
    a_update = aqi_agent_node(state)
    for k, v in a_update.items():
        setattr(state, k, v)

    # 3. Conditional Specialist Branch
    branch = route_to_specialists(state)
    if branch == "routine_agent":
        s_update = routine_agent_node(state)
    elif branch == "indoor_agent":
        s_update = indoor_agent_node(state)
    elif branch == "mobility_agent":
        s_update = mobility_agent_node(state)
    elif branch == "impact_agent":
        s_update = impact_agent_node(state)
    else:
        s_update = {}
    for k, v in s_update.items():
        setattr(state, k, v)

    # 4. Safety Agent
    sf_update = safety_agent_node(state)
    for k, v in sf_update.items():
        setattr(state, k, v)

    # 5. Synthesizer
    syn_update = synthesizer_node(state)
    return syn_update["final_response"]


async def run_multi_agent_flow(
    user_message: str,
    location: dict | None = None,
    user_id: str | None = None,
    conversation_id: str | None = None,
) -> dict:
    """Execute multi-agent graph asynchronously and return synthesized response."""
    initial_state = AgentState(
        request_id=str(uuid.uuid4()),
        user_id=user_id,
        conversation_id=conversation_id or str(uuid.uuid4()),
        user_message=user_message,
        selected_location=location or {},
    )

    if agent_graph is not None:
        result = await agent_graph.ainvoke(initial_state)
        return result["final_response"]
    else:
        return await _run_sequential_flow(initial_state)
