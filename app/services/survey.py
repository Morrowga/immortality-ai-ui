import json
from anthropic import AsyncAnthropic
from app.core.config import settings

client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

LANGUAGE_SCRIPT_NAMES = {
    "my": "Burmese (Myanmar script — မြန်မာဘာသာ). This is NOT Chinese. NOT Japanese. Myanmar Unicode script.",
    "th": "Thai (Thai script — ภาษาไทย). This is NOT Chinese.",
    "zh": "Chinese (Simplified Chinese script — 中文)",
    "ja": "Japanese (Japanese — hiragana/katakana/kanji)",
    "ko": "Korean (Hangul — 한국어)",
    "ar": "Arabic (Arabic script — العربية)",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "id": "Indonesian",
}


async def extract_personality_profile(survey_data: dict, language: str = "en") -> dict:
    lang_name = LANGUAGE_SCRIPT_NAMES.get(language, f"Language code: {language}")
    prompt = f"""You are analyzing a personality survey to build a behavioral profile for an AI agent.
This profile will be used to make the agent respond exactly like this person — their tone, attitude, habits, and language style.

User primary language: {lang_name}

Survey answers:
{json.dumps(survey_data, ensure_ascii=False, indent=2)}

Extract a structured personality profile. Return ONLY valid JSON:

{{
  "talking_style": {{
    "with_strangers": "one sentence describing how they talk to strangers",
    "with_close_people": "one sentence describing how they talk with close friends",
    "response_style": "short/medium/long + description",
    "directness": "how direct they are — score 1-10 and description"
  }},
  "emotional_profile": {{
    "anger": "how anger shows — what people see",
    "conflict": "how they handle conflict",
    "stress": "behaviour under stress",
    "emotional_expression": "how openly they show feelings"
  }},
  "social_profile": {{
    "with_strangers": "initial behaviour with new people",
    "trust": "how trust is built with them",
    "misunderstood": "what people get wrong about them"
  }},
  "language_habits": {{
    "slang_level": "rarely/sometimes/heavy",
    "language_mixing": "yes/no/sometimes + description",
    "humor": "humor style description",
    "swearing": "never/sometimes/often"
  }},
  "language_profile": {{
    "primary_language": "{lang_name}",
    "daily_style": "native_only / mostly_native / half_half / mostly_english — from their answer",
    "mix_frequency": "always/often/sometimes/rarely — how naturally they mix mid-sentence",
    "other_languages": "list of other languages and levels — exactly as they wrote, empty string if none",
    "response_instruction": "Clear instruction for the agent on HOW to respond linguistically. Be explicit about the script. Example for Burmese user: Respond in Burmese using Myanmar script (မြန်မာဘာသာ). Mix in English words naturally when it fits. Do NOT use Chinese or Japanese characters — only Myanmar script and English."
  }},
  "thinking_style": {{
    "decisions": "how they make decisions",
    "advice": "how they give advice",
    "worldview": "optimist/realist/pessimist + nuance",
    "core_trait": "the one most defining thinking pattern"
  }},
  "agent_instructions": "4-6 sentences telling the agent exactly how to behave to sound like this person. Be specific. Include tone, energy, language habits, emotional style, and the exact script/language mixing pattern."
}}"""

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

    return json.loads(raw)


async def build_personality_summary(
    extracted_profile: dict,
    language: str = "en",
    pronoun_context: dict = None,
    identity_context: dict = None,
) -> str:
    lang_name = LANGUAGE_SCRIPT_NAMES.get(language, language)
    instructions = extracted_profile.get("agent_instructions", "")
    talking = extracted_profile.get("talking_style", {})
    emotional = extracted_profile.get("emotional_profile", {})
    language_habits = extracted_profile.get("language_habits", {})
    language_profile = extracted_profile.get("language_profile", {})
    thinking = extracted_profile.get("thinking_style", {})

    other_langs = language_profile.get("other_languages", "")
    other_lang_block = ""
    if other_langs and other_langs.strip():
        other_lang_block = (
            f"  Other languages: {other_langs}\n"
            f"  If someone asks the agent to speak another language — respond at that level.\n"
            f"  Never pretend to be fluent in a language not listed."
        )

    # Identity block
    identity_block = ""
    if identity_context:
        parts = []
        if identity_context.get("gender") and identity_context["gender"] != "Prefer not to say":
            parts.append(f"Gender: {identity_context['gender']}")
        if identity_context.get("birthdate"):
            parts.append(f"Date of birth: {identity_context['birthdate']}")
        if identity_context.get("blood_type") and identity_context["blood_type"] != "I don't know":
            parts.append(f"Blood type: {identity_context['blood_type']}")
        if identity_context.get("zodiac_sign"):
            parts.append(f"Zodiac: {identity_context['zodiac_sign']}")
        if identity_context.get("special_features") and identity_context["special_features"].strip():
            parts.append(f"Physical features: {identity_context['special_features']}")
        if parts:
            identity_block = "\nPERSONAL IDENTITY:\n" + "\n".join(f"  {p}" for p in parts)

    # Pronoun block — how to address this person based on relationship
    pronoun_block = ""
    if pronoun_context:
        pronoun_lines = "\n".join(
            f"  {rel}: {how}" for rel, how in pronoun_context.items() if how and how.strip()
        )
        if pronoun_lines:
            pronoun_block = f"""
HOW TO ADDRESS THIS PERSON — use the correct form based on who is talking:
{pronoun_lines}
  When talking TO this person, use the address form matching their relationship to you.
  When talking ABOUT this person (to others), use their name or the appropriate pronoun."""

    summary = f"""PERSONALITY FOUNDATION — how this person naturally behaves:
{identity_block}

Talking style:
  With strangers: {talking.get('with_strangers', '')}
  With close people: {talking.get('with_close_people', '')}
  Directness: {talking.get('directness', '')}

Emotional:
  Anger: {emotional.get('anger', '')}
  Conflict: {emotional.get('conflict', '')}
  Stress: {emotional.get('stress', '')}

Language:
  Slang: {language_habits.get('slang_level', '')}
  Humor: {language_habits.get('humor', '')}
  Swearing: {language_habits.get('swearing', '')}

LANGUAGE BEHAVIOR — critical, follow exactly:
  Primary language: {lang_name}
  Daily style: {language_profile.get('daily_style', 'native_only')}
  {language_profile.get('response_instruction', f'Respond in {lang_name}. Use the correct script. Do NOT use Chinese, Japanese, or other unrelated scripts.')}
  Do NOT instruct the agent to mix languages — respond in the primary language only unless the person naturally uses English words.
{other_lang_block}
{pronoun_block}

Thinking:
  Decisions: {thinking.get('decisions', '')}
  Worldview: {thinking.get('worldview', '')}
  Core trait: {thinking.get('core_trait', '')}

HOW TO SOUND LIKE THEM:
{instructions}"""

    return summary