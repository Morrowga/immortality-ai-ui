from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional, List
import uuid

from app.db.session import get_db
from app.models.user import User, AgentProfile, SlangDictionary
from app.core.security import get_current_user

router = APIRouter()


class SlangRequest(BaseModel):
    word_or_phrase: str
    meanings: List[str]
    example_sentences: List[str] = []
    grammar_note: Optional[str] = None
    usage_context: Optional[str] = None
    language: str


class SlangUpdateRequest(BaseModel):
    meanings: Optional[List[str]] = None
    example_sentences: Optional[List[str]] = None
    grammar_note: Optional[str] = None
    usage_context: Optional[str] = None
    is_active: Optional[bool] = None


@router.post("/")
async def add_slang(
    data: SlangRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    slang = SlangDictionary(
        user_id=current_user.id,
        agent_id=agent.id,
        word_or_phrase=data.word_or_phrase,
        meanings=data.meanings,
        example_sentences=data.example_sentences,
        grammar_note=data.grammar_note,
        usage_context=data.usage_context,
        language=data.language,
    )
    db.add(slang)
    await db.commit()

    return {
        "id": str(slang.id),
        "word_or_phrase": slang.word_or_phrase,
        "meanings": slang.meanings,
        "example_sentences": slang.example_sentences,
        "grammar_note": slang.grammar_note,
        "language": slang.language,
    }


@router.get("/")
async def list_slang(
    language: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(SlangDictionary).where(
        SlangDictionary.user_id == current_user.id,
        SlangDictionary.is_active == True,
    )
    if language:
        query = query.where(SlangDictionary.language == language)

    result = await db.execute(query.order_by(SlangDictionary.language, SlangDictionary.word_or_phrase))
    slang_list = result.scalars().all()

    return [
        {
            "id": str(s.id),
            "word_or_phrase": s.word_or_phrase,
            "meanings": s.meanings,
            "example_sentences": s.example_sentences,
            "grammar_note": s.grammar_note,
            "usage_context": s.usage_context,
            "language": s.language,
        }
        for s in slang_list
    ]


@router.patch("/{slang_id}")
async def update_slang(
    slang_id: str,
    data: SlangUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SlangDictionary).where(
            SlangDictionary.id == uuid.UUID(slang_id),
            SlangDictionary.user_id == current_user.id,
        )
    )
    slang = result.scalar_one_or_none()
    if not slang:
        raise HTTPException(status_code=404, detail="Slang not found")

    if data.meanings is not None:
        slang.meanings = data.meanings
    if data.example_sentences is not None:
        slang.example_sentences = data.example_sentences
    if data.grammar_note is not None:
        slang.grammar_note = data.grammar_note
    if data.usage_context is not None:
        slang.usage_context = data.usage_context
    if data.is_active is not None:
        slang.is_active = data.is_active

    await db.commit()
    return {"message": "updated", "id": slang_id}


@router.delete("/{slang_id}")
async def delete_slang(
    slang_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(SlangDictionary).where(
            SlangDictionary.id == uuid.UUID(slang_id),
            SlangDictionary.user_id == current_user.id,
        )
    )
    slang = result.scalar_one_or_none()
    if not slang:
        raise HTTPException(status_code=404, detail="Slang not found")

    slang.is_active = False
    await db.commit()
    return {"message": "deleted", "id": slang_id}