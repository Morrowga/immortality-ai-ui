import json
import asyncio
from anthropic import AsyncAnthropic, InternalServerError, APIStatusError
from app.core.config import settings
from sqlalchemy.ext.asyncio import AsyncSession

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


EXTRACTION_PROMPT = """You are a deep memory extraction system for a personal AI agent.
Your job is to extract the feeling layer from what this person shared.
Not just what happened — but how it felt, why it mattered, what instinct it formed.

You must return ONLY valid JSON. No explanation. No markdown. Just JSON.

LANGUAGE RULES — critical:
- The *_original fields must preserve EXACTLY how the person said it.
  If they mixed languages (e.g. Burmese + English mid-sentence), keep the mix exactly as-is.
  Do NOT clean it up. Do NOT translate it. Do NOT make it "proper".
  The original field is their authentic voice. Preserve it.
- The base fields (what_happened, how_i_felt, etc.) must always be clean English.
  Translate fully. Rephrase naturally. These are for semantic search — clarity matters.
- If the input is already pure English, both fields will be identical.

Return this exact structure:
{{
  "what_happened": "Clean English — what happened",
  "what_happened_original": "Exact original — preserve any language mix as-is",
  "context": "When, where, who was involved — English",
  "how_i_felt": "Clean English — exact emotional state",
  "how_i_felt_original": "Exact original — preserve any language mix",
  "why_it_mattered": "Clean English — the weight and significance",
  "why_it_mattered_original": "Exact original — preserve any language mix",
  "what_i_learned": "Clean English — lesson formed",
  "what_i_learned_original": "Exact original — preserve any language mix",
  "instinct_formed": "Clean English — future behavior this created",
  "instinct_formed_original": "Exact original — preserve any language mix",
  "cultural_expression_notes": "How their culture or language shapes how they express this",
  "suggested_weight": 0.0,
  "never_forget": false,
  "pattern_tags": [],
  "section": "PAST",
  "cross_sections": [],
  "is_core_memory": false
}}

Rules for suggested_weight (0-10):
  9-10 = life-defining moment, permanent instinct formed
  7-8  = significant experience, clear lesson learned
  5-6  = meaningful but not defining
  3-4  = minor experience, some reflection
  1-2  = passing thought, low impact

Rules for section:
  BASIC   = identity, personality, values, who they are
  PAST    = history, childhood, turning points, lessons
  PRESENT = current life, current feelings, current struggles
  FUTURE  = dreams, goals, legacy, what they want for loved ones

Rules for never_forget:
  true only if suggested_weight >= 8.5

Rules for pattern_tags:
  3-7 tags that describe life areas this touches
  examples: family, money, trust, resilience, career, love, loss, identity"""


async def extract_memory(
    text: str,
    language: str = "en",
    style_context: str = "",
) -> dict:
    user_prompt = f"""User's primary language: {language}
Style context: {style_context if style_context else "No prior style data yet"}

What the person shared (may be in {language}, English, or a mix — handle all cases):
{text}

Extract the felt memory. Preserve original voice exactly. Return only JSON."""

    import random
    last_error = None
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=2000,
                system=EXTRACTION_PROMPT,
                messages=[{"role": "user", "content": user_prompt}]
            )
            break
        except (InternalServerError, APIStatusError) as e:
            status = getattr(e, "status_code", None)
            err_str = str(e).lower()
            is_overload = status == 529 or "overloaded" in err_str or "overload" in err_str
            is_rate_limit = status == 429
            if is_overload or is_rate_limit:
                last_error = e
                if attempt < max_attempts - 1:
                    base_wait = 5 * (attempt + 1) if is_rate_limit else (2 ** attempt)
                    await asyncio.sleep(base_wait + random.uniform(0, 0.5))
                continue
            raise
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Anthropic is currently overloaded. Please try again in a moment.") from last_error

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    return json.loads(raw)


async def generate_acknowledgment(
    memory: dict,
    user_name: str,
    language: str = "en",
) -> str:
    prompt = f"""The user just shared a memory with their personal AI agent.
The agent should acknowledge it — show it understood the feeling, not just the facts.

User's name: {user_name}
User's primary language: {language}
Memory weight: {memory.get('suggested_weight', 5)}/10
Never forget: {memory.get('never_forget', False)}

What happened: {memory.get('what_happened', '')}
How they felt: {memory.get('how_i_felt', '')}
Instinct formed: {memory.get('instinct_formed', '')}

Write a response that:
- Is 2-4 sentences only
- Shows you felt the weight of what they shared
- Mentions the instinct or lesson formed
- Does NOT say "I have saved this" or "I will remember this" — show don't tell
- Responds in {language} — if the person naturally mixes languages, you can too
- Feels warm and human, not robotic"""

    import random
    last_error = None
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()
        except (InternalServerError, APIStatusError) as e:
            status = getattr(e, "status_code", None)
            err_str = str(e).lower()
            is_overload = status == 529 or "overloaded" in err_str or "overload" in err_str
            is_rate_limit = status == 429
            if is_overload or is_rate_limit:
                last_error = e
                if attempt < max_attempts - 1:
                    base_wait = 5 * (attempt + 1) if is_rate_limit else (2 ** attempt)
                    await asyncio.sleep(base_wait + random.uniform(0, 0.5))
                continue
            raise
    from fastapi import HTTPException
    raise HTTPException(status_code=503, detail="Anthropic is currently overloaded. Please try again in a moment.") from last_error


async def check_duplicate_memory(
    embedding: list[float],
    agent_id: str,
    db: AsyncSession,
    threshold: float = 0.85,
) -> dict | None:
    embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"

    raw_conn = await db.connection()
    asyncpg_conn = await raw_conn.get_raw_connection()
    native_conn = asyncpg_conn.driver_connection

    rows = await native_conn.fetch("""
        SELECT
            id::text AS memory_id,
            what_happened,
            how_i_felt,
            feeling_weight,
            reinforcement_count,
            never_forget,
            section,
            1 - (embedding <=> $1::vector) AS similarity
        FROM memories
        WHERE
            agent_id = $2::uuid
            AND is_active = true
            AND embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT 1
    """, embedding_str, agent_id)

    if not rows:
        return None

    top = dict(rows[0])
    if top["similarity"] >= threshold:
        return top

    return None


async def reinforce_memory(
    memory_id: str,
    db: AsyncSession,
) -> dict:
    from sqlalchemy import select
    from app.models.user import Memory
    from datetime import datetime
    import uuid

    result = await db.execute(
        select(Memory).where(Memory.id == uuid.UUID(memory_id))
    )
    memory = result.scalar_one_or_none()
    if not memory:
        return {}

    memory.reinforcement_count = (memory.reinforcement_count or 0) + 1
    memory.last_reinforced_at = datetime.utcnow()
    memory.feeling_weight = min(10.0, (memory.feeling_weight or 5.0) + 0.2)
    memory.never_forget = memory.feeling_weight >= 8.5

    await db.commit()

    return {
        "memory_id": str(memory.id),
        "what_happened": memory.what_happened,
        "feeling_weight": memory.feeling_weight,
        "reinforcement_count": memory.reinforcement_count,
    }