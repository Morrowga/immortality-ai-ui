from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import uuid

from app.db.session import get_db
from app.models.user import User, AgentProfile, AgentResponse, Memory, TrainingSession
from app.core.security import get_current_user
from app.services.embeddings import generate_embedding
from sqlalchemy import text
from datetime import datetime

router = APIRouter()


class FeedbackRequest(BaseModel):
    response_id: str
    feedback: str  # "like" / "dislike" / "corrected"
    correction_text: Optional[str] = None  # how they would actually say it


@router.post("/")
async def submit_feedback(
    data: FeedbackRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.feedback not in ["like", "dislike", "corrected"]:
        raise HTTPException(status_code=400, detail="feedback must be like, dislike, or corrected")

    # Get the response
    result = await db.execute(
        select(AgentResponse).where(
            AgentResponse.id == uuid.UUID(data.response_id),
            AgentResponse.user_id == current_user.id,
        )
    )
    response = result.scalar_one_or_none()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    # Save feedback
    response.user_feedback = data.feedback
    response.correction_text = data.correction_text
    await db.flush()

    # If corrected — store correction as a high-weight memory
    # This is how the agent learns what NOT to do
    if data.feedback == "corrected" and data.correction_text:
        result = await db.execute(
            select(AgentProfile).where(AgentProfile.user_id == current_user.id)
        )
        agent = result.scalar_one_or_none()

        # Build correction memory text
        correction_text = f"""CORRECTION: The agent said something that did not sound like me.
Agent said: {response.response_text[:300]}
How I would actually say it: {data.correction_text}"""

        # Generate embedding for the correction
        embedding = await generate_embedding(correction_text)
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

        # Create a training session for this correction
        session = TrainingSession(
            user_id=current_user.id,
            agent_id=agent.id,
            mode="reinforcement",
            section_covered="CORRECTION",
            memories_captured=1,
            avg_weight_of_session=9.0,
        )
        db.add(session)
        await db.flush()

        # Store as high-weight memory so agent never makes this mistake again
        memory = Memory(
            user_id=current_user.id,
            agent_id=agent.id,
            session_id=session.id,
            section="BASIC",
            transcript_text=correction_text,
            transcript_language=current_user.language,
            what_happened="Agent responded incorrectly — did not sound like me",
            how_i_felt="This is not how I talk or think",
            instinct_formed=f"When asked something similar, respond like this: {data.correction_text}",
            instinct_formed_original=data.correction_text,
            feeling_weight=9.0,
            never_forget=True,
            pattern_tags=["correction", "voice", "style"],
            training_mode="reinforcement",
            is_core_memory=True,
        )
        db.add(memory)
        await db.flush()

        # Insert embedding
        await db.execute(
            text("UPDATE memories SET embedding = :embedding WHERE id = :id"),
            {"embedding": embedding_str, "id": str(memory.id)}
        )

        # Update agent memory count
        agent.total_memories = (agent.total_memories or 0) + 1
        agent.last_updated_at = datetime.utcnow()

        await db.commit()

        return {
            "message": "Correction saved. Agent will learn from this.",
            "correction_memory_id": str(memory.id),
            "weight": 9.0,
            "never_forget": True,
        }

    # Like — reinforce the memory that was used
    if data.feedback == "like" and response.memory_id:
        result = await db.execute(
            select(Memory).where(Memory.id == response.memory_id)
        )
        memory = result.scalar_one_or_none()
        if memory:
            memory.reinforcement_count = (memory.reinforcement_count or 0) + 1
            memory.last_reinforced_at = datetime.utcnow()

    await db.commit()

    return {
        "message": "Feedback saved.",
        "feedback": data.feedback,
    }


@router.get("/history")
async def feedback_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """See all corrections made — what the agent got wrong and how to fix it."""
    result = await db.execute(
        select(AgentResponse).where(
            AgentResponse.user_id == current_user.id,
            AgentResponse.user_feedback == "corrected",
        ).order_by(AgentResponse.created_at.desc()).limit(20)
    )
    responses = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "agent_said": r.response_text[:200],
            "correction": r.correction_text,
            "created_at": str(r.created_at),
        }
        for r in responses
    ]