from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, AgentProfile, Memory, TrainingSession, AgentResponse, StyleProfile, AgentLifecycle
from app.core.security import get_current_user
from app.services.embeddings import generate_embedding
from app.services.patterns import should_run_abstraction, run_pattern_abstraction
from app.services.extraction import extract_memory, generate_acknowledgment, check_duplicate_memory, reinforce_memory

router = APIRouter()


class TrainRequest(BaseModel):
    text: str
    mode: str = "free"


class ConfirmMemoryRequest(BaseModel):
    extracted: dict
    feeling_weight: float
    session_id: str


@router.post("/submit")
async def submit_training(
    data: TrainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if not agent.survey_completed:
        raise HTTPException(
            status_code=403,
            detail="Complete your personality survey first before training."
        )

    result = await db.execute(
        select(StyleProfile).where(StyleProfile.user_id == current_user.id)
    )
    style = result.scalar_one_or_none()
    style_context = ""
    if style:
        style_context = f"Speaking pace: {style.avg_speaking_pace}, Directness: {style.directness_level}/10, Warmth: {style.warmth_level}/10"

    session = TrainingSession(
        user_id=current_user.id,
        agent_id=agent.id,
        mode=data.mode,
    )
    db.add(session)
    await db.flush()

    try:
        extracted = await extract_memory(
            text=data.text,
            language=current_user.language,
            style_context=style_context,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return {
        "session_id": str(session.id),
        "extracted": extracted,
        "original_text": data.text,
    }


@router.post("/confirm")
async def confirm_memory(
    data: ConfirmMemoryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    embed_text = (
        f"{data.extracted.get('what_happened', '')} "
        f"{data.extracted.get('how_i_felt', '')} "
        f"{data.extracted.get('instinct_formed', '')}"
    )
    embedding = await generate_embedding(embed_text)

    # ← FIX: was str(embedding) which can produce scientific notation on small floats
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

    duplicate = await check_duplicate_memory(
        embedding=embedding,
        agent_id=str(agent.id),
        db=db,
    )

    if duplicate:
        reinforced = await reinforce_memory(
            memory_id=duplicate["memory_id"],
            db=db,
        )
        return {
            "duplicate": True,
            "message": "You have shared something similar before. Memory reinforced.",
            "existing_memory": duplicate["what_happened"],
            "new_weight": reinforced["feeling_weight"],
            "reinforcement_count": reinforced["reinforcement_count"],
        }

    memory = Memory(
        user_id=current_user.id,
        agent_id=agent.id,
        session_id=uuid.UUID(data.session_id),
        section=data.extracted.get("section", "PAST"),
        cross_sections=data.extracted.get("cross_sections", []),
        is_core_memory=data.extracted.get("is_core_memory", False),
        transcript_text=data.extracted.get("what_happened", ""),
        transcript_original=data.extracted.get("what_happened_original", ""),
        transcript_language=current_user.language,
        what_happened=data.extracted.get("what_happened"),
        what_happened_original=data.extracted.get("what_happened_original"),
        context=data.extracted.get("context"),
        how_i_felt=data.extracted.get("how_i_felt"),
        how_i_felt_original=data.extracted.get("how_i_felt_original"),
        why_it_mattered=data.extracted.get("why_it_mattered"),
        why_it_mattered_original=data.extracted.get("why_it_mattered_original"),
        what_i_learned=data.extracted.get("what_i_learned"),
        what_i_learned_original=data.extracted.get("what_i_learned_original"),
        instinct_formed=data.extracted.get("instinct_formed"),
        instinct_formed_original=data.extracted.get("instinct_formed_original"),
        cultural_expression_notes=data.extracted.get("cultural_expression_notes"),
        feeling_weight=data.feeling_weight,
        never_forget=data.feeling_weight >= 8.5,
        pattern_tags=data.extracted.get("pattern_tags", []),
        training_mode="free",
    )
    db.add(memory)
    await db.flush()

    # Correct embedding string format — consistent with feedback.py and extraction.py
    await db.execute(
        text("UPDATE memories SET embedding = :embedding WHERE id = :id"),
        {"embedding": embedding_str, "id": str(memory.id)}
    )

    agent.total_memories = (agent.total_memories or 0) + 1
    agent.last_updated_at = datetime.utcnow()

    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == uuid.UUID(data.session_id))
    )
    session = result.scalar_one_or_none()
    if session:
        session.memories_captured = 1
        session.avg_weight_of_session = data.feeling_weight

    # Increment lifecycle training session count
    result = await db.execute(
        select(AgentLifecycle).where(AgentLifecycle.agent_id == agent.id)
    )
    lifecycle = result.scalar_one_or_none()
    if lifecycle:
        lifecycle.training_session_count = (lifecycle.training_session_count or 0) + 1
        lifecycle.last_active_at = datetime.utcnow()

    await db.flush()

    try:
        acknowledgment = await generate_acknowledgment(
            memory=data.extracted,
            user_name=current_user.name,
            language=current_user.language,
        )
    except RuntimeError as e:
        acknowledgment = "Memory saved."  # fallback if overloaded

    response = AgentResponse(
        user_id=current_user.id,
        agent_id=agent.id,
        memory_id=memory.id,
        response_text=acknowledgment,
        response_type="acknowledgment",
    )
    db.add(response)
    await db.commit()

    try:
        if await should_run_abstraction(str(agent.id), db):
            await run_pattern_abstraction(str(agent.id), db)
    except Exception:
        pass

    return {
        "memory_id": str(memory.id),
        "feeling_weight": data.feeling_weight,
        "never_forget": memory.never_forget,
        "acknowledgment": acknowledgment,
        "pattern_tags": memory.pattern_tags,
        "section": memory.section,
    }


@router.get("/progress")
async def training_progress(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    sections = ["BASIC", "PAST", "PRESENT", "FUTURE"]
    section_counts = {}
    for section in sections:
        result = await db.execute(
            select(func.count(Memory.id)).where(
                Memory.agent_id == agent.id,
                Memory.section == section,
                Memory.is_active == True,
            )
        )
        section_counts[section] = result.scalar() or 0

    total = sum(section_counts.values())

    return {
        "sections": section_counts,
        "total_memories": total,
        "wisdom_score": agent.wisdom_score,
        "estimated_accuracy": min(40 + (total * 2), 95),
    }