"""Conversation persistence for AI Assistant."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatSession, ChatMessage, AgentRun, AgentRunStep
from app.database.session import get_db


async def get_or_create_conversation(
    db: AsyncSession,
    user_id: str,
    conversation_id: str | None = None,
) -> ChatSession:
    """Get existing conversation or create new one."""
    if conversation_id:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.id == uuid.UUID(conversation_id),
                ChatSession.user_id == uuid.UUID(user_id),
            )
        )
        session = result.scalar_one_or_none()
        if session:
            return session
    
    # Create new conversation
    session = ChatSession(
        user_id=uuid.UUID(user_id),
        title=await generate_conversation_title("New Conversation"),
        status="active",
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


async def save_conversation_turn(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_message: str,
    assistant_response: dict[str, Any],
    agent_outputs: dict[str, Any],
    request_id: str,
) -> None:
    """Persist a conversation turn with agent execution details."""
    # Save user message
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=user_message,
        message_type="text",
        metadata_json={"request_id": request_id},
    )
    db.add(user_msg)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=assistant_response.get("answer", ""),
        message_type="agent_response",
        metadata_json={
            "request_id": request_id,
            "intent": assistant_response.get("intent"),
            "supporting_data": assistant_response.get("supporting_data"),
            "recommendations": assistant_response.get("recommendations"),
            "limitations": assistant_response.get("limitations"),
            "sources": assistant_response.get("sources"),
            "observed_at": assistant_response.get("observed_at"),
            "agents_used": assistant_response.get("agents_used"),
        },
    )
    db.add(assistant_msg)
    
    # Save agent run
    agent_run = AgentRun(
        session_id=session_id,
        status="completed",
        agent_type="multi_agent",
        input_data={"user_message": user_message, "request_id": request_id},
        output_data=assistant_response,
    )
    db.add(agent_run)
    await db.flush()
    await db.refresh(agent_run)
    
    # Save individual agent steps
    for agent_name, output in agent_outputs.items():
        if output:
            step = AgentRunStep(
                agent_run_id=agent_run.id,
                step_number=len(agent_outputs),  # approximate
                step_type=agent_name,
                tool_name=None,
                input_data={},
                output_data=output,
                status="completed",
            )
            db.add(step)
    
    await db.commit()


async def generate_conversation_title(first_message: str) -> str:
    """Generate a concise title from the first user message."""
    # Simple truncation for now; could use LLM in future
    title = first_message[:80].strip()
    if len(first_message) > 80:
        title += "..."
    return title


async def get_conversation_history(
    db: AsyncSession,
    user_id: str,
    conversation_id: str | None = None,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Retrieve conversation history for a user."""
    query = select(ChatSession).where(ChatSession.user_id == uuid.UUID(user_id))
    
    if conversation_id:
        query = query.where(ChatSession.id == uuid.UUID(conversation_id))
    else:
        query = query.order_by(ChatSession.created_at.desc()).limit(1)
    
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    if not sessions:
        return []
    
    # Get messages for the session
    session = sessions[0]
    msg_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at)
        .limit(limit)
    )
    messages = msg_result.scalars().all()
    
    return [
        {
            "role": m.role,
            "content": m.content,
            "metadata": m.metadata_json,
            "created_at": m.created_at.isoformat(),
        }
        for m in messages
    ]


async def delete_conversation(
    db: AsyncSession,
    user_id: str,
    conversation_id: str,
) -> bool:
    """Delete a conversation and all its messages."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == uuid.UUID(conversation_id),
            ChatSession.user_id == uuid.UUID(user_id),
        )
    )
    session = result.scalar_one_or_none()
    
    if not session:
        return False
    
    await db.delete(session)
    await db.commit()
    return True