from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import PatternAbstraction, StyleProfile
from app.services.embeddings import generate_embedding
import uuid


async def find_relevant_memories(
    question: str,
    agent_id: str,
    db: AsyncSession,
    limit: int = 10,
) -> list[dict]:
    question_embedding = await generate_embedding(question)
    embedding_str = "[" + ",".join(str(x) for x in question_embedding) + "]"

    raw_conn = await db.connection()
    asyncpg_conn = await raw_conn.get_raw_connection()
    native_conn = asyncpg_conn.driver_connection

    # FIX: hybrid score — combines semantic similarity + feeling weight
    # never_forget / is_core_memory get a bonus so they surface for relevant topics,
    # but a high-weight off-topic memory won't beat a highly relevant one.
    # Formula: (similarity * 0.5) + (feeling_weight / 10 * 0.3) + (never_forget * 0.15) + (is_core_memory * 0.05)
    rows = await native_conn.fetch("""
        SELECT
            id::text,
            what_happened,
            what_happened_original,
            how_i_felt,
            how_i_felt_original,
            why_it_mattered,
            why_it_mattered_original,
            what_i_learned,
            what_i_learned_original,
            instinct_formed,
            instinct_formed_original,
            cultural_expression_notes,
            feeling_weight,
            never_forget,
            is_core_memory,
            pattern_tags,
            section,
            transcript_language,
            reinforcement_count,
            1 - (embedding <=> $1::vector) AS similarity,
            (
                (1 - (embedding <=> $1::vector)) * 0.5
                + (feeling_weight / 10.0) * 0.3
                + (CASE WHEN never_forget THEN 0.15 ELSE 0.0 END)
                + (CASE WHEN is_core_memory THEN 0.05 ELSE 0.0 END)
            ) AS hybrid_score
        FROM memories
        WHERE
            agent_id = $2::uuid
            AND is_active = true
            AND embedding IS NOT NULL
        ORDER BY hybrid_score DESC
        LIMIT $3
    """, embedding_str, agent_id, limit)

    return [dict(row) for row in rows]


async def find_relevant_patterns(
    question: str,
    agent_id: str,
    db: AsyncSession,
    limit: int = 3,
) -> list[dict]:
    # Returns top patterns by weight — patterns don't have embeddings yet
    # so we fetch all and return top by weight (acceptable — patterns are few)
    result = await db.execute(
        select(PatternAbstraction)
        .where(PatternAbstraction.agent_id == uuid.UUID(agent_id))
        .order_by(PatternAbstraction.abstraction_weight.desc())
        .limit(limit)
    )
    patterns = result.scalars().all()

    return [
        {
            "pattern_summary": p.pattern_summary,
            "pattern_summary_original": p.pattern_summary_original,
            "pattern_type": p.pattern_type,
            "abstraction_weight": p.abstraction_weight,
        }
        for p in patterns
    ]


async def get_style_profile(
    user_id: str,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(StyleProfile).where(StyleProfile.user_id == uuid.UUID(user_id))
    )
    style = result.scalar_one_or_none()
    if not style:
        return {}

    return {
        "avg_speaking_pace": style.avg_speaking_pace,
        "avg_sentence_length": style.avg_sentence_length,
        "humor_level": style.humor_level,
        "directness_level": style.directness_level,
        "warmth_level": style.warmth_level,
        "language_primary": style.language_primary,
        "cultural_expression_patterns": style.cultural_expression_patterns,
    }


async def get_slang_for_language(
    user_id: str,
    language: str,
    db: AsyncSession,
) -> list[dict]:
    from app.models.user import SlangDictionary
    result = await db.execute(
        select(SlangDictionary).where(
            SlangDictionary.user_id == uuid.UUID(user_id),
            SlangDictionary.language == language,
            SlangDictionary.is_active == True,
        )
    )
    slang_list = result.scalars().all()

    return [
        {
            "word_or_phrase": s.word_or_phrase,
            "meanings": s.meanings,
            "example_sentences": s.example_sentences,
            "grammar_note": s.grammar_note,
            "usage_context": s.usage_context,
        }
        for s in slang_list
    ]


async def get_personality_summary(
    user_id: str,
    db: AsyncSession,
) -> str:
    from app.models.user import PersonalitySurvey
    result = await db.execute(
        select(PersonalitySurvey).where(
            PersonalitySurvey.user_id == uuid.UUID(user_id),
            PersonalitySurvey.is_completed == True,
        )
    )
    survey = result.scalar_one_or_none()
    if not survey:
        return ""
    return survey.personality_summary or ""