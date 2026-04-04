from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User, AgentProfile, AgentResponse, AgentLifecycle
from app.core.security import get_current_user
from app.services.agent import generate_agent_response
from app.services.retrieval import find_relevant_memories, find_relevant_patterns, get_style_profile, get_slang_for_language, get_personality_summary
from datetime import datetime

router = APIRouter()


# Relationship types — determines how open/casual the agent is
RELATIONSHIP_TYPES = {
    "owner":      "This is YOU — the person whose memories this agent is built from.",
    "close_friend": "This is a close friend — someone you trust deeply, speak casually with, share private things with.",
    "friend":     "This is a friend — someone you like and are comfortable with, but not your inner circle.",
    "family":     "This is a family member — someone you love and are close to.",
    "partner":    "This is your romantic partner — the person closest to you.",
    "coworker":   "This is a coworker — someone you are professional with, friendly but not personal.",
    "stranger":   "This is a stranger — someone you just met, be warm but guard personal details.",
}

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    speaker_name: str = ""
    relationship: str = "stranger"  # one of the RELATIONSHIP_TYPES keys


@router.post("/")
async def chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Get agent first — everything else depends on it
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Gate — survey must be completed before chat
    if not agent.survey_completed:
        raise HTTPException(
            status_code=403,
            detail="Complete your personality survey first before chatting."
        )

    if agent.total_memories == 0:
        return {
            "response": "I don't have any memories yet. Train me first by sharing your experiences.",
            "memories_used": 0,
        }

    response_language = data.language or current_user.language

    # Retrieve everything needed
    memories = await find_relevant_memories(
        question=data.message,
        agent_id=str(agent.id),
        db=db,
    )

    patterns = await find_relevant_patterns(
        question=data.message,
        agent_id=str(agent.id),
        db=db,
    )

    style = await get_style_profile(
        user_id=str(current_user.id),
        db=db,
    )

    slang = await get_slang_for_language(
        user_id=str(current_user.id),
        language=response_language,
        db=db,
    )

    personality = await get_personality_summary(
        user_id=str(current_user.id),
        db=db,
    )

    # Resolve relationship context
    relationship = data.relationship if data.relationship in RELATIONSHIP_TYPES else "stranger"
    is_owner = relationship == "owner"
    speaker_name = data.speaker_name.strip() or ("You" if is_owner else "Someone")
    relationship_context = RELATIONSHIP_TYPES[relationship]

    # Generate response — HTTPException(503) raised internally on persistent overload
    response_text = await generate_agent_response(
        question=data.message,
        memories=memories,
        patterns=patterns,
        style=style,
        agent_name=agent.agent_name,
        language=response_language,
        slang=slang,
        personality=personality,
        speaker_name=speaker_name,
        is_owner=is_owner,
        relationship_context=relationship_context,
    )

    # Save response
    agent_response = AgentResponse(
        user_id=current_user.id,
        agent_id=agent.id,
        response_text=response_text,
        response_type="chat",
    )
    db.add(agent_response)

    await db.flush()  # get ID without committing
    response_id = str(agent_response.id)

    # Update lifecycle
    result = await db.execute(
        select(AgentLifecycle).where(AgentLifecycle.agent_id == agent.id)
    )
    lifecycle = result.scalar_one_or_none()
    if lifecycle:
        lifecycle.interaction_count = (lifecycle.interaction_count or 0) + 1
        lifecycle.last_active_at = datetime.utcnow()

    await db.commit()

    return {
        "response": response_text,
        "memories_used": len(memories),
        "patterns_used": len(patterns),
        "response_id": response_id,
    }