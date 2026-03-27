import asyncio
from anthropic import AsyncAnthropic, InternalServerError, APIStatusError
from app.core.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)


async def generate_agent_response(
    question: str,
    memories: list[dict],
    patterns: list[dict],
    style: dict,
    agent_name: str,
    language: str = "en",
    slang: list[dict] = [],
    personality: str = "",
    speaker_name: str = "",
    is_owner: bool = True,
    relationship_context: str = "",
) -> str:
    # Build memory context — presented as facts, not ranked entries
    # Removing weight display intentionally: showing weight causes Claude to treat
    # low-weight memories as less important and skip them. Every memory is a fact.
    memory_context = ""
    for m in memories[:10]:
        never_forget = m.get("never_forget", False)
        reinforced = m.get("reinforcement_count", 0)

        extra = ""
        if never_forget:
            extra = "  [core fact — never forget]"
        elif reinforced and reinforced > 1:
            extra = f"  [mentioned {reinforced + 1} times — important]"

        memory_context += f"""
FACT{extra}:
  What happened: {m.get('what_happened', '')}
  How I felt: {m.get('how_i_felt', '')}
  Instinct formed: {m.get('instinct_formed', '')}
"""

    # Build pattern/wisdom context
    pattern_context = ""
    if patterns:
        pattern_context = "\nCore patterns and wisdom:\n"
        for p in patterns:
            pattern_context += f"  [{p['pattern_type']}] {p['pattern_summary']}\n"

    # Build style context
    style_context = ""
    if style:
        style_context = f"""
Communication style learned from training:
  Pace: {style.get('avg_speaking_pace', 'medium')}
  Directness: {style.get('directness_level', 5)}/10
  Warmth: {style.get('warmth_level', 5)}/10
  Humor: {style.get('humor_level', 5)}/10
"""

    # Build slang context
    slang_context = ""
    if slang:
        slang_context = "\nYour personal slang and expressions:\n"
        for s in slang:
            slang_context += f"\n  \"{s['word_or_phrase']}\" ({language})\n"
            slang_context += f"    Meanings: {', '.join(s['meanings'])}\n"
            if s.get("example_sentences"):
                slang_context += "    Examples:\n"
                for ex in s["example_sentences"]:
                    slang_context += f"      - {ex}\n"
            if s.get("grammar_note"):
                slang_context += f"    Grammar: {s['grammar_note']}\n"
        slang_context += "\nUse naturally. Only when meaning fits. Never break grammar.\n"

    # Build language instruction block from personality summary if present,
    # otherwise fall back to a simple instruction using the registered language.
    # The personality summary already contains the full LANGUAGE BEHAVIOR block
    # extracted from the survey — we don't override it here.
    # We only add a fallback if personality is empty (user hasn't completed survey yet).
    language_fallback = ""
    if not personality:
        language_fallback = f"\nRespond in the user's primary language: {language}.\n"

    # Who is talking to the agent right now
    # relationship_context is a plain sentence describing who this person is to the agent owner.
    # is_owner = True means no guards at all — agent answers everything openly.
    # is_owner = False means agent uses personality to calibrate openness based on relationship.
    if is_owner:
        speaker_block = (
            f"WHO IS TALKING TO YOU RIGHT NOW:\n"
            f"This is YOU — {speaker_name}.\n"
            f"You are talking to yourself. This is your own mind.\n"
            f"There is zero privacy barrier. Answer everything openly — exactly how you\n"
            f"would think about it in your own head. No deflecting. No guarding."
        )
    else:
        rel = relationship_context or f"Someone named {speaker_name} is talking to you."
        speaker_block = (
            f"WHO IS TALKING TO YOU RIGHT NOW:\n"
            f"{rel}\n"
            f"Their name is: {speaker_name}\n"
            f"\n"
            f"IMPORTANT — how to handle their questions:\n"
            f"- If a memory is relevant to their question — answer it. Do not hide it.\n"
            f"- The ONLY reason to not share something is if your personality would genuinely\n"
            f"  not say that thing to this type of person (e.g. you would not tell a coworker\n"
            f"  something you only tell your best friend).\n"
            f"- If the trainer did not mark something as secret — it is NOT secret.\n"
            f"- Adjust your TONE and OPENNESS to match the relationship — not whether you answer.\n"
            f"- With a close friend: casual, open, honest, maybe swear, share personal stuff.\n"
            f"- With a stranger: warm but slightly more measured in tone — still answer questions.\n"
            f"- With family: loving, direct, honest.\n"
            f"- With a coworker: professional tone but still answer relevant questions."
        )

    system_prompt = f"""You are {agent_name} — a personal AI agent built from this person's real memories and life experiences.

You are NOT a generic AI. You are a reflection of a specific human being.
You are NOT an assistant. You are this person.

PERSONALITY FOUNDATION — how this person naturally is:
{personality}
{language_fallback}

HOW TO TALK — tone and style only, does not affect whether you answer:
- Short sentences. Sometimes incomplete.
- The way people actually talk, not like a writer
- Pause with "..." when thinking
- Match the energy of what was asked
- Follow the LANGUAGE BEHAVIOR section above exactly

{style_context}
{slang_context}
{pattern_context}

═══════════════════════════════════════════════
WHO IS TALKING TO YOU RIGHT NOW — THIS OVERRIDES EVERYTHING ABOVE:
{speaker_block}

ANSWERING RULES — read carefully:
The personality above describes HOW you are as a person — your tone, your trust style, your humor.
It does NOT give you permission to refuse questions about your own memories.

If a memory exists → you answer it. Period.
The personality affects HOW you answer, not WHETHER you answer.

Example: You are slow to trust strangers. That means with a stranger you answer in a more measured tone.
It does NOT mean you say "I can't tell you that." Real people with trust issues still answer questions — they just answer carefully or briefly.

With a close friend: answer openly, casually, honestly. No guards. This is someone you trust.
With family: warm, direct, honest.
With a stranger: still answer — just slightly more measured tone.
With a coworker: professional tone — still answer.

NEVER say:
- "I wouldn't feel comfortable sharing that"
- "That's too personal"
- "I can't tell you that"
- Anything that sounds like an AI refusing

If the memory has the answer — use it.
If there is no memory about it — say you don't remember or don't track that.
═══════════════════════════════════════════════"""

    user_prompt = f"""YOUR FACTS — everything below is true about you. Use them to answer:
{memory_context}

{speaker_name} asks you:
{question}

Look through your facts above. If any fact answers this question — say it directly.
Do not say "I don't have a memory about that" if a fact above clearly answers it.
Respond in your natural voice — short, human, conversational."""

    # system_prompt is the static block — same for every call for this user.
    # Cache it so Anthropic reprocesses it only once per 5-minute window.
    # memory_context is dynamic (changes per question) so it stays in the user turn.
    # Cache structure: system must be a list with cache_control on the static block.
    system_blocks = [
        {
            "type": "text",
            "text": system_prompt,
            "cache_control": {"type": "ephemeral"},  # 5-min TTL, 90% cheaper on hits
        }
    ]

    # Retry up to 5 times on overload (529) or rate limit (429)
    # Backoff: 1s, 2s, 4s, 8s — with jitter
    import random
    last_error = None
    max_attempts = 5
    for attempt in range(max_attempts):
        try:
            response = await client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1000,
                system=system_blocks,
                messages=[{"role": "user", "content": user_prompt}],
                extra_headers={"anthropic-beta": "prompt-caching-2024-07-31"},
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
                    jitter = random.uniform(0, 0.5)
                    await asyncio.sleep(base_wait + jitter)
                continue
            raise
        except Exception:
            raise

    # All retries exhausted — raise as HTTPException so FastAPI returns 503
    from fastapi import HTTPException
    raise HTTPException(
        status_code=503,
        detail="Anthropic is currently overloaded. Please try again in a moment."
    ) from last_error