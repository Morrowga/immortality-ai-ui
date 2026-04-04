from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import uuid
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, AgentProfile, Memory
from app.core.security import get_current_user

router = APIRouter()


@router.get("/")
async def list_memories(
    section: Optional[str] = Query(None, description="Filter by section: BASIC, PAST, PRESENT, FUTURE"),
    never_forget: Optional[bool] = Query(None, description="Filter to never_forget memories only"),
    min_weight: Optional[float] = Query(None, description="Minimum feeling weight (0-10)"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all memories for the current user's agent.
    Supports filtering by section, never_forget flag, and minimum weight.
    Returns most impactful memories first (feeling_weight DESC, then newest).
    """
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    query = select(Memory).where(
        Memory.agent_id == agent.id,
        Memory.is_active == True,
    )

    if section:
        section_upper = section.upper()
        if section_upper not in ["BASIC", "PAST", "PRESENT", "FUTURE"]:
            raise HTTPException(status_code=400, detail="Section must be one of: BASIC, PAST, PRESENT, FUTURE")
        query = query.where(Memory.section == section_upper)

    if never_forget is not None:
        query = query.where(Memory.never_forget == never_forget)

    if min_weight is not None:
        query = query.where(Memory.feeling_weight >= min_weight)

    # Count total for pagination
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get memories — highest weight first, then newest
    query = query.order_by(
        Memory.never_forget.desc(),
        Memory.feeling_weight.desc(),
        Memory.created_at.desc(),
    ).limit(limit).offset(offset)

    result = await db.execute(query)
    memories = result.scalars().all()

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "memories": [
            {
                "id": str(m.id),
                "section": m.section,
                "what_happened": m.what_happened,
                "how_i_felt": m.how_i_felt,
                "why_it_mattered": m.why_it_mattered,
                "what_i_learned": m.what_i_learned,
                "instinct_formed": m.instinct_formed,
                "feeling_weight": m.feeling_weight,
                "never_forget": m.never_forget,
                "is_core_memory": m.is_core_memory,
                "pattern_tags": m.pattern_tags or [],
                "reinforcement_count": m.reinforcement_count or 0,
                "training_mode": m.training_mode,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "last_reinforced_at": m.last_reinforced_at.isoformat() if m.last_reinforced_at else None,
            }
            for m in memories
        ],
    }


@router.get("/stats")
async def memory_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Summary stats for the memories page header —
    total, by section, never_forget count, avg weight.
    """
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    sections = ["BASIC", "PAST", "PRESENT", "FUTURE"]
    section_counts = {}
    for section in sections:
        r = await db.execute(
            select(func.count(Memory.id)).where(
                Memory.agent_id == agent.id,
                Memory.section == section,
                Memory.is_active == True,
            )
        )
        section_counts[section] = r.scalar() or 0

    never_forget_count = await db.execute(
        select(func.count(Memory.id)).where(
            Memory.agent_id == agent.id,
            Memory.never_forget == True,
            Memory.is_active == True,
        )
    )

    avg_weight = await db.execute(
        select(func.avg(Memory.feeling_weight)).where(
            Memory.agent_id == agent.id,
            Memory.is_active == True,
        )
    )

    return {
        "total": sum(section_counts.values()),
        "by_section": section_counts,
        "never_forget_count": never_forget_count.scalar() or 0,
        "avg_weight": round(float(avg_weight.scalar() or 0), 2),
        "wisdom_score": agent.wisdom_score,
    }


@router.get("/{memory_id}")
async def get_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full detail of a single memory — including original language fields."""
    try:
        mid = uuid.UUID(memory_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid memory ID")

    result = await db.execute(
        select(Memory).where(
            Memory.id == mid,
            Memory.user_id == current_user.id,
            Memory.is_active == True,
        )
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    return {
        "id": str(memory.id),
        "section": memory.section,
        "cross_sections": memory.cross_sections or [],

        # English fields
        "what_happened": memory.what_happened,
        "context": memory.context,
        "how_i_felt": memory.how_i_felt,
        "why_it_mattered": memory.why_it_mattered,
        "what_i_learned": memory.what_i_learned,
        "instinct_formed": memory.instinct_formed,
        "cultural_expression_notes": memory.cultural_expression_notes,

        # Original language fields
        "what_happened_original": memory.what_happened_original,
        "how_i_felt_original": memory.how_i_felt_original,
        "why_it_mattered_original": memory.why_it_mattered_original,
        "what_i_learned_original": memory.what_i_learned_original,
        "instinct_formed_original": memory.instinct_formed_original,

        # Weight
        "feeling_weight": memory.feeling_weight,
        "never_forget": memory.never_forget,
        "is_core_memory": memory.is_core_memory,

        # Meta
        "pattern_tags": memory.pattern_tags or [],
        "reinforcement_count": memory.reinforcement_count or 0,
        "training_mode": memory.training_mode,
        "transcript_language": memory.transcript_language,
        "created_at": memory.created_at.isoformat() if memory.created_at else None,
        "last_reinforced_at": memory.last_reinforced_at.isoformat() if memory.last_reinforced_at else None,
    }


@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Soft delete a memory — sets is_active=False.
    Also decrements agent total_memories count.
    """
    try:
        mid = uuid.UUID(memory_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid memory ID")

    result = await db.execute(
        select(Memory).where(
            Memory.id == mid,
            Memory.user_id == current_user.id,
            Memory.is_active == True,
        )
    )
    memory = result.scalar_one_or_none()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    memory.is_active = False

    # Keep agent count accurate
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if agent and agent.total_memories and agent.total_memories > 0:
        agent.total_memories -= 1
        agent.last_updated_at = datetime.utcnow()

    await db.commit()

    return {"message": "Memory removed.", "id": memory_id}