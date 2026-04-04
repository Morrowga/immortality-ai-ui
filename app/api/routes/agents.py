from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.models.user import User, AgentProfile
from app.core.security import get_current_user

router = APIRouter()


@router.get("/me")
async def get_my_agent(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    return {
        "agent_id": str(agent.id),
        "agent_name": agent.agent_name,
        "total_memories": agent.total_memories,
        "wisdom_score": agent.wisdom_score,
        "survey_completed": agent.survey_completed,
        "dominant_pattern_tags": agent.dominant_pattern_tags,
        "language": current_user.language,
    }