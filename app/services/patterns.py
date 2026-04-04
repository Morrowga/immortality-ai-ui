import json
from anthropic import AsyncAnthropic
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.config import settings
from app.models.user import Memory, PatternAbstraction, AgentProfile, AgentLifecycle

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def should_run_abstraction(agent_id: str, db: AsyncSession) -> bool:
    """Check if enough sessions have passed to run pattern abstraction."""
    result = await db.execute(
        select(AgentLifecycle).where(
            AgentLifecycle.agent_id == agent_id
        )
    )
    lifecycle = result.scalar_one_or_none()
    if not lifecycle:
        return False

    # Run every 10 training sessions
    return (lifecycle.training_session_count or 0) % 10 == 0 \
        and (lifecycle.training_session_count or 0) > 0


async def run_pattern_abstraction(agent_id: str, db: AsyncSession) -> dict | None:
    """
    Takes the last 10 memories and extracts patterns — the wisdom layer.
    What instincts are forming? What values are becoming clear?
    """
    # Get last 10 memories by weight — most impactful ones
    result = await db.execute(
        select(Memory)
        .where(
            Memory.agent_id == agent_id,
            Memory.is_active == True,
            Memory.feeling_weight >= 5.0,
        )
        .order_by(Memory.feeling_weight.desc(), Memory.created_at.desc())
        .limit(10)
    )
    memories = result.scalars().all()

    if len(memories) < 3:
        return None  # Not enough memories yet

    # Build memory summary for Claude
    memory_summaries = []
    memory_ids = []
    for m in memories:
        memory_ids.append(str(m.id))
        memory_summaries.append({
            "what_happened": m.what_happened,
            "how_i_felt": m.how_i_felt,
            "what_i_learned": m.what_i_learned,
            "instinct_formed": m.instinct_formed,
            "feeling_weight": m.feeling_weight,
            "section": m.section,
            "pattern_tags": m.pattern_tags,
        })

    prompt = f"""You are analyzing a person's memories to extract emerging patterns and wisdom.
These are their most significant memories. Look across all of them.

What patterns are forming? What instincts are being built? What values are becoming clear?

Memories:
{json.dumps(memory_summaries, ensure_ascii=False, indent=2)}

Extract 2-4 patterns. Return ONLY valid JSON as a list:

[
  {{
    "pattern_summary": "English description of the pattern or wisdom",
    "pattern_summary_original": "Same pattern described naturally — keep same language as the memories",
    "pattern_type": "value OR instinct OR belief OR reaction",
    "abstraction_weight": 7.5
  }}
]

Rules:
- pattern_type: value = what they care about, instinct = automatic behavior, belief = how they see the world, reaction = how they respond to situations
- abstraction_weight = average weight of memories that formed this pattern
- Be specific — not generic wisdom. This person's actual patterns.
- Keep it conversational — not philosophical"""

    response = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    patterns = json.loads(raw)

    import uuid
    saved_patterns = []
    for p in patterns:
        pattern = PatternAbstraction(
            agent_id=uuid.UUID(agent_id),
            pattern_summary=p["pattern_summary"],
            pattern_summary_original=p.get("pattern_summary_original"),
            source_memory_ids=[uuid.UUID(mid) for mid in memory_ids],
            pattern_type=p["pattern_type"],
            abstraction_weight=p.get("abstraction_weight", 7.0),
        )
        db.add(pattern)
        saved_patterns.append(p)

    # Update agent wisdom score — average of all pattern weights
    result = await db.execute(
        select(func.avg(PatternAbstraction.abstraction_weight)).where(
            PatternAbstraction.agent_id == uuid.UUID(agent_id)
        )
    )
    avg_wisdom = result.scalar() or 0.0

    result = await db.execute(
        select(AgentProfile).where(AgentProfile.id == uuid.UUID(agent_id))
    )
    agent = result.scalar_one_or_none()
    if agent:
        agent.wisdom_score = round(float(avg_wisdom), 2)

    await db.commit()

    return {"patterns_extracted": len(saved_patterns), "patterns": saved_patterns}