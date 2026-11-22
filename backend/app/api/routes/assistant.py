"""AI Assistant route powered by LangGraph multi-agent flow."""
from __future__ import annotations

import uuid
from fastapi import APIRouter
from app.schemas.assistant import AssistantChatRequest
from app.agents.graph import run_multi_agent_flow

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


@router.post("/chat")
async def chat_with_assistant(req: AssistantChatRequest):
    """Interact with the multi-agent environmental reasoning system."""
    location_ctx = {}
    if req.latitude and req.longitude:
        location_ctx = {"latitude": req.latitude, "longitude": req.longitude, "city": req.city}
    elif req.city:
        location_ctx = {"city": req.city}

    res = await run_multi_agent_flow(
        user_message=req.message,
        location=location_ctx,
        conversation_id=str(req.conversation_id) if req.conversation_id else None,
    )

    return {
        "success": True,
        "data": {
            "conversation_id": req.conversation_id or str(uuid.uuid4()),
            **res,
        },
    }
