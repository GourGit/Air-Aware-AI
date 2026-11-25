"""AI Assistant route powered by LangGraph multi-agent flow with conversation persistence."""

from __future__ import annotations

import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.assistant import AssistantChatRequest, AssistantChatResponse
from app.agents.graph import run_multi_agent_flow
from app.services.conversation import get_or_create_conversation, save_conversation_turn, get_conversation_history
from app.api.dependencies import DBSession, CurrentUser

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])


@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    req: AssistantChatRequest,
    user: CurrentUser,
    db: DBSession,
):
    """Interact with the multi-agent environmental reasoning system."""
    location_ctx = {}
    if req.latitude and req.longitude:
        location_ctx = {"latitude": req.latitude, "longitude": req.longitude, "city": req.city}
    elif req.city:
        location_ctx = {"city": req.city}
    
    # Get or create conversation
    conversation = await get_or_create_conversation(
        db, str(user.id), str(req.conversation_id) if req.conversation_id else None
    )
    
    # Run multi-agent flow
    res = await run_multi_agent_flow(
        user_message=req.message,
        location=location_ctx,
        user_id=str(user.id),
        conversation_id=str(conversation.id),
    )
    
    # Persist the conversation turn
    await save_conversation_turn(
        db=db,
        session_id=conversation.id,
        user_message=req.message,
        assistant_response=res,
        agent_outputs={},  # Could pass individual agent outputs here
        request_id=res.get("request_id", str(uuid.uuid4())),
    )
    
    return AssistantChatResponse(
        conversation_id=conversation.id,
        **res,
    )


@router.get("/conversations")
async def list_conversations(
    user: CurrentUser,
    db: DBSession,
    limit: int = 20,
):
    """List user's conversation sessions."""
    from sqlalchemy import select, desc
    from app.models.chat import ChatSession
    
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == user.id)
        .order_by(desc(ChatSession.updated_at))
        .limit(limit)
    )
    sessions = result.scalars().all()
    
    return {
        "success": True,
        "data": [
            {
                "id": str(s.id),
                "title": s.title,
                "status": s.status,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in sessions
        ],
    }


@router.get("/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user: CurrentUser,
    db: DBSession,
):
    """Get full conversation history."""
    from app.services.conversation import get_conversation_history
    
    history = await get_conversation_history(db, str(user.id), conversation_id)
    
    return {
        "success": True,
        "data": {
            "conversation_id": conversation_id,
            "messages": history,
        },
    }


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user: CurrentUser,
    db: DBSession,
):
    """Delete a conversation."""
    from app.services.conversation import delete_conversation as delete_conv
    
    success = await delete_conv(db, str(user.id), conversation_id)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    return {"success": True, "message": "Conversation deleted"}