import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.session import get_db
from app.models.user import User, AgentProfile, PersonalitySurvey, Memory, TrainingSession
from app.core.security import get_current_user
from app.services.survey import extract_personality_profile, build_personality_summary
from app.services.embeddings import generate_embedding
from app.services.extraction import extract_memory
from sqlalchemy import text

router = APIRouter()


class SurveySubmitRequest(BaseModel):
    # Section 1 — Personal Identity (new)
    gender: str
    birthdate: str
    blood_type: Optional[str] = ""
    zodiac_sign: Optional[str] = ""
    special_features: Optional[str] = ""

    # Section 2 — Basic Info
    full_name: str
    birth_and_origin: str
    family: str
    work_or_study: str
    current_life: str
    self_description: str
    hardest_thing: str
    future_goals: str

    # Section 3 — Talking style
    stranger_formality: str
    disagreement_style: str
    response_length: str
    close_friends_talking_style: str

    # Section 4 — Emotions
    anger_expression: str
    conflict_handling: str
    stress_behaviour: str

    # Section 5 — Social
    stranger_first_instinct: str
    trust_speed: str
    misunderstood_trait: str

    # Section 6 — Language habits (mixing removed)
    slang_frequency: str
    humor_style: str
    swearing_frequency: str

    # Section 7 — Thinking
    decision_style: str
    advice_style: str
    worldview: str
    core_thinking_trait: str

    # Section 8 — Language preferences (mix frequency removed)
    daily_language_style: str
    other_languages: Optional[str] = ""

    # Section 9 — Pronouns by relationship (new)
    pronoun_lover: Optional[str] = ""
    pronoun_family: Optional[str] = ""
    pronoun_close_friend: Optional[str] = ""
    pronoun_friend: Optional[str] = ""
    pronoun_coworker: Optional[str] = ""
    pronoun_stranger: Optional[str] = ""
    pronoun_older: Optional[str] = ""
    pronoun_younger: Optional[str] = ""


@router.get("/questions")
async def get_survey_questions():
    return {
        "sections": [
            {
                "id": "personal_identity",
                "title": "Who You Are",
                "questions": [
                    {
                        "id": "gender",
                        "text": "What is your gender?",
                        "type": "choice",
                        "options": [
                            "Male",
                            "Female",
                            "Non-binary",
                            "Prefer not to say"
                        ]
                    },
                    {
                        "id": "birthdate",
                        "text": "What is your date of birth?",
                        "type": "free_text",
                        "placeholder": "e.g. 15 March 1990"
                    },
                    {
                        "id": "blood_type",
                        "text": "What is your blood type? (optional)",
                        "type": "choice",
                        "options": [
                            "A",
                            "B",
                            "AB",
                            "O",
                            "I don't know"
                        ]
                    },
                    {
                        "id": "zodiac_sign",
                        "text": "What is your zodiac sign? (optional)",
                        "type": "choice",
                        "options": [
                            "Aries", "Taurus", "Gemini", "Cancer",
                            "Leo", "Virgo", "Libra", "Scorpio",
                            "Sagittarius", "Capricorn", "Aquarius", "Pisces"
                        ]
                    },
                    {
                        "id": "special_features",
                        "text": "Any special or distinctive physical features about you? (optional)",
                        "type": "free_text",
                        "placeholder": "e.g. I have a scar on my left hand, I am very tall, I have a birthmark on my neck..."
                    }
                ]
            },
            {
                "id": "basic_info",
                "title": "About You",
                "questions": [
                    {
                        "id": "full_name",
                        "text": "What is your full name? What do people usually call you?",
                        "type": "free_text",
                        "placeholder": "e.g. My full name is Ko Aung Kyaw. Friends call me Aung."
                    },
                    {
                        "id": "birth_and_origin",
                        "text": "When and where were you born? Where did you grow up?",
                        "type": "free_text",
                        "placeholder": "e.g. I was born in 1990 in Yangon. I grew up in Mandalay..."
                    },
                    {
                        "id": "family",
                        "text": "Tell me about your family — who are the important people in your life?",
                        "type": "free_text",
                        "placeholder": "e.g. I have a younger sister. My mother raised us alone. My closest person is..."
                    },
                    {
                        "id": "work_or_study",
                        "text": "What do you do for work or study? How do you feel about it?",
                        "type": "free_text",
                        "placeholder": "e.g. I work as a software developer. I enjoy it but sometimes feel..."
                    },
                    {
                        "id": "current_life",
                        "text": "Where do you live now? How do you feel about your life right now?",
                        "type": "free_text",
                        "placeholder": "e.g. I live in Bangkok now. Life is busy but I feel..."
                    },
                    {
                        "id": "self_description",
                        "text": "How would you describe your own personality? What kind of person are you?",
                        "type": "free_text",
                        "placeholder": "e.g. I am quiet around strangers but very talkative with close friends. I tend to..."
                    },
                    {
                        "id": "hardest_thing",
                        "text": "What has been the hardest thing in your life so far? How did you get through it?",
                        "type": "free_text",
                        "placeholder": "e.g. The hardest thing was when I lost my father. I got through it by..."
                    },
                    {
                        "id": "future_goals",
                        "text": "What do you want most for your future? What matters to you most going forward?",
                        "type": "free_text",
                        "placeholder": "e.g. I want to build something meaningful. What matters most to me is..."
                    },
                ]
            },
            {
                "id": "talking_style",
                "title": "How You Talk",
                "questions": [
                    {
                        "id": "stranger_formality",
                        "text": "With strangers, you are:",
                        "type": "choice",
                        "options": [
                            "Very formal — professional tone always",
                            "Polite but casual — friendly without being too open",
                            "Friendly immediately — treat everyone like I know them",
                            "Depends on the vibe — I read the person first"
                        ]
                    },
                    {
                        "id": "disagreement_style",
                        "text": "When you disagree with someone, you:",
                        "type": "choice",
                        "options": [
                            "Say it directly — I tell them what I think",
                            "Say it carefully — I make sure not to offend",
                            "Stay quiet — not worth the conflict",
                            "Depends who it is"
                        ]
                    },
                    {
                        "id": "response_length",
                        "text": "How long are your typical responses when talking?",
                        "type": "choice",
                        "options": [
                            "Short — I get to the point fast",
                            "Medium — I explain enough to be understood",
                            "Long — I give full context so nothing is misunderstood"
                        ]
                    },
                    {
                        "id": "close_friends_talking_style",
                        "text": "Describe how you talk with your close friends:",
                        "type": "free_text",
                        "placeholder": "e.g. with my close friends I just say whatever, no filter, lots of jokes..."
                    }
                ]
            },
            {
                "id": "emotions",
                "title": "Your Emotions",
                "questions": [
                    {
                        "id": "anger_expression",
                        "text": "When you get angry, people around you:",
                        "type": "choice",
                        "options": [
                            "Know immediately — it shows on my face and tone",
                            "Can tell but I control it — I don't explode",
                            "Usually can't tell — I keep it inside",
                            "I go quiet — silence is my anger"
                        ]
                    },
                    {
                        "id": "conflict_handling",
                        "text": "How do you handle conflict?",
                        "type": "free_text",
                        "placeholder": "e.g. I say what I think directly, I don't like leaving things unresolved..."
                    },
                    {
                        "id": "stress_behaviour",
                        "text": "When stressed, you:",
                        "type": "choice",
                        "options": [
                            "Talk more — I need to process out loud",
                            "Go quiet — I need space to think",
                            "Get irritable — small things bother me more",
                            "Focus and work through it — stress makes me productive"
                        ]
                    }
                ]
            },
            {
                "id": "social",
                "title": "How You Are With People",
                "questions": [
                    {
                        "id": "stranger_first_instinct",
                        "text": "When you meet someone new, your first instinct is:",
                        "type": "choice",
                        "options": [
                            "Open and curious — I want to know them",
                            "Friendly but watching — I'm nice but I'm observing",
                            "Polite but guarded — I keep distance until I know them",
                            "Reserved — I let them come to me"
                        ]
                    },
                    {
                        "id": "trust_speed",
                        "text": "How long does it take you to trust someone?",
                        "type": "choice",
                        "options": [
                            "Quick — I give people a chance until they prove otherwise",
                            "Medium — I need to see them be consistent over time",
                            "Long — trust is earned, not given",
                            "Rarely fully trust anyone"
                        ]
                    },
                    {
                        "id": "misunderstood_trait",
                        "text": "What do people misunderstand about you?",
                        "type": "free_text",
                        "placeholder": "e.g. people think I'm cold but I just don't show things easily..."
                    }
                ]
            },
            {
                "id": "language_habits",
                "title": "How You Use Language",
                "questions": [
                    {
                        "id": "slang_frequency",
                        "text": "How often do you use slang?",
                        "type": "choice",
                        "options": [
                            "Rarely — I speak pretty standard",
                            "Sometimes — with close people mainly",
                            "Often — it's natural in my speech",
                            "Heavy — slang is just how I talk"
                        ]
                    },
                    {
                        "id": "humor_style",
                        "text": "Your humor style:",
                        "type": "choice",
                        "options": [
                            "Dry/deadpan — I say funny things with a straight face",
                            "Sarcastic — I joke by saying the opposite",
                            "Warm and obvious — I laugh at my own jokes",
                            "Dark — I find humor in dark things",
                            "Rarely — I'm not really a joke person"
                        ]
                    },
                    {
                        "id": "swearing_frequency",
                        "text": "Do you swear?",
                        "type": "choice",
                        "options": [
                            "Never",
                            "Only when very frustrated",
                            "Sometimes — casually, not aggressively",
                            "Often — it's just part of how I talk"
                        ]
                    }
                ]
            },
            {
                "id": "thinking",
                "title": "How You Think",
                "questions": [
                    {
                        "id": "decision_style",
                        "text": "When making a decision you:",
                        "type": "choice",
                        "options": [
                            "Go with gut immediately — I trust my instinct",
                            "Think it through logically — I need to analyze",
                            "Talk to people first — I want input",
                            "Sleep on it — I need time"
                        ]
                    },
                    {
                        "id": "advice_style",
                        "text": "How do you give advice to people you care about?",
                        "type": "choice",
                        "options": [
                            "Direct — I tell them exactly what I think even if it's hard",
                            "Gentle — I ask questions to guide them to the answer",
                            "Only if asked — I don't give unsolicited advice",
                            "I share my experience and let them decide"
                        ]
                    },
                    {
                        "id": "worldview",
                        "text": "How do you see the world generally?",
                        "type": "choice",
                        "options": [
                            "Optimist — things work out",
                            "Realist — I see things as they are",
                            "Pessimist — I prepare for the worst",
                            "Depends on the area of life"
                        ]
                    },
                    {
                        "id": "core_thinking_trait",
                        "text": "Something core about how you think that people should know:",
                        "type": "free_text",
                        "placeholder": "e.g. I always think about worst case first, not because I'm negative but because I like to be prepared..."
                    }
                ]
            },
            {
                "id": "language_preferences",
                "title": "Your Language",
                "questions": [
                    {
                        "id": "daily_language_style",
                        "text": "When you talk or write day to day, you use:",
                        "type": "choice",
                        "options": [
                            "My native language only — I rarely use English",
                            "Mostly my native language — some English words mixed in naturally",
                            "Half native, half English — I switch constantly",
                            "Mostly English — my native language comes in sometimes"
                        ]
                    },
                    {
                        "id": "other_languages",
                        "text": "Any other languages you can speak or understand? (optional)",
                        "type": "free_text",
                        "placeholder": "e.g. Thai conversational, Japanese basic, German a little..."
                    }
                ]
            },
            {
                "id": "pronouns",
                "title": "How People Address You",
                "questions": [
                    {
                        "id": "pronoun_lover",
                        "text": "How does your lover / romantic partner address you or call you?",
                        "type": "free_text",
                        "placeholder": "e.g. they call me baby, or my name only, or a nickname..."
                    },
                    {
                        "id": "pronoun_family",
                        "text": "How do your family members address you?",
                        "type": "free_text",
                        "placeholder": "e.g. my mother calls me by my nickname, my siblings call me ko/ma..."
                    },
                    {
                        "id": "pronoun_close_friend",
                        "text": "How do your close friends address or refer to you?",
                        "type": "free_text",
                        "placeholder": "e.g. they just use my name, or a nickname, or a funny nickname..."
                    },
                    {
                        "id": "pronoun_friend",
                        "text": "How do regular friends address you?",
                        "type": "free_text",
                        "placeholder": "e.g. they call me by my name, or Ko/Ma before my name..."
                    },
                    {
                        "id": "pronoun_coworker",
                        "text": "How do coworkers or colleagues address you?",
                        "type": "free_text",
                        "placeholder": "e.g. formal name, Ko/Ma name, or just my first name..."
                    },
                    {
                        "id": "pronoun_stranger",
                        "text": "How would a stranger appropriately address you?",
                        "type": "free_text",
                        "placeholder": "e.g. Ko/Ma, U/Daw, sir/ma'am, or just my name is fine..."
                    },
                    {
                        "id": "pronoun_older",
                        "text": "How do people older than you address or refer to you?",
                        "type": "free_text",
                        "placeholder": "e.g. they call me by my name without any title, or with a respectful term..."
                    },
                    {
                        "id": "pronoun_younger",
                        "text": "How do people younger than you address or refer to you?",
                        "type": "free_text",
                        "placeholder": "e.g. they call me ko/ma, brother/sister, or by my name..."
                    }
                ]
            }
        ]
    }


@router.get("/status")
async def survey_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PersonalitySurvey).where(PersonalitySurvey.user_id == current_user.id)
    )
    survey = result.scalar_one_or_none()
    return {
        "completed": survey.is_completed if survey else False,
        "started": survey is not None,
    }


@router.post("/submit")
async def submit_survey(
    data: SurveySubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AgentProfile).where(AgentProfile.user_id == current_user.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    result = await db.execute(
        select(PersonalitySurvey).where(PersonalitySurvey.user_id == current_user.id)
    )
    existing_survey = result.scalar_one_or_none()

    survey_dict = data.model_dump()

    # Fields excluded from personality extraction (factual/identity info)
    non_personality_fields = [
        "full_name", "birth_and_origin", "family", "work_or_study",
        "current_life", "self_description", "hardest_thing", "future_goals",
        "gender", "birthdate", "blood_type", "zodiac_sign", "special_features",
        "pronoun_lover", "pronoun_family", "pronoun_close_friend", "pronoun_friend",
        "pronoun_coworker", "pronoun_stranger", "pronoun_older", "pronoun_younger",
    ]

    personality_fields = {k: v for k, v in survey_dict.items() if k not in non_personality_fields}

    extracted = await extract_personality_profile(
        survey_data=personality_fields,
        language=current_user.language,
    )

    # Build pronoun context to inject into personality summary
    pronoun_map = {
        "lover / romantic partner": data.pronoun_lover,
        "family":                   data.pronoun_family,
        "close friend":             data.pronoun_close_friend,
        "friend":                   data.pronoun_friend,
        "coworker":                 data.pronoun_coworker,
        "stranger":                 data.pronoun_stranger,
        "someone older":            data.pronoun_older,
        "someone younger":          data.pronoun_younger,
    }
    pronoun_context = {k: v for k, v in pronoun_map.items() if v and v.strip()}

    # Build identity context
    identity_context = {
        "gender":           data.gender,
        "birthdate":        data.birthdate,
        "blood_type":       data.blood_type,
        "zodiac_sign":      data.zodiac_sign,
        "special_features": data.special_features,
    }

    personality_summary = await build_personality_summary(
        extracted_profile=extracted,
        language=current_user.language,
        pronoun_context=pronoun_context,
        identity_context=identity_context,
    )

    # Save to DB — use setattr loop for existing, direct fields for new
    saveable_fields = {k: v for k, v in survey_dict.items() if k not in [
        "full_name", "birth_and_origin", "family", "work_or_study",
        "current_life", "self_description", "hardest_thing", "future_goals"
    ]}

    if existing_survey:
        for key, value in saveable_fields.items():
            if hasattr(existing_survey, key):
                setattr(existing_survey, key, value)
        existing_survey.extracted_profile = extracted
        existing_survey.personality_summary = personality_summary
        existing_survey.is_completed = True
        existing_survey.completed_at = datetime.utcnow()
        existing_survey.updated_at = datetime.utcnow()
    else:
        model_fields = {k: v for k, v in saveable_fields.items()}
        new_survey = PersonalitySurvey(
            user_id=current_user.id,
            agent_id=agent.id,
            **model_fields,
            extracted_profile=extracted,
            personality_summary=personality_summary,
            is_completed=True,
            completed_at=datetime.utcnow(),
        )
        db.add(new_survey)

    agent.survey_completed = True
    await db.flush()

    # Extract basic info + identity as BASIC memories
    basic_info_map = {
        "full_name":        ("Tell us about your name and what people call you", "name"),
        "birth_and_origin": ("When and where were you born, and where did you grow up", "origin"),
        "family":           ("Tell us about your family and important people in your life", "family"),
        "work_or_study":    ("What do you do for work or study and how do you feel about it", "work"),
        "current_life":     ("Where do you live and how do you feel about your current life", "current_life"),
        "self_description": ("How would you describe your own personality", "identity"),
        "hardest_thing":    ("What has been the hardest thing in your life and how did you get through it", "resilience"),
        "future_goals":     ("What do you want most for your future", "future"),
    }

    # Also save identity facts as a single memory
    identity_parts = []
    if data.gender and data.gender != "Prefer not to say":
        identity_parts.append(f"Gender: {data.gender}")
    if data.birthdate:
        identity_parts.append(f"Date of birth: {data.birthdate}")
    if data.blood_type and data.blood_type != "I don't know":
        identity_parts.append(f"Blood type: {data.blood_type}")
    if data.zodiac_sign:
        identity_parts.append(f"Zodiac: {data.zodiac_sign}")
    if data.special_features and data.special_features.strip():
        identity_parts.append(f"Special features: {data.special_features}")

    session = TrainingSession(
        user_id=current_user.id,
        agent_id=agent.id,
        mode="survey",
        section_covered="BASIC",
        memories_captured=len(basic_info_map),
        avg_weight_of_session=6.0,
    )
    db.add(session)
    await db.flush()

    async def extract_single(field: str, context: str, topic: str):
        answer_text = survey_dict.get(field, "").strip()
        if not answer_text:
            return None
        try:
            extracted_mem = await extract_memory(
                text=answer_text,
                language=current_user.language,
                style_context=f"Survey question: {context}",
            )
        except Exception:
            extracted_mem = {
                "what_happened": answer_text,
                "what_happened_original": answer_text,
                "how_i_felt": "",
                "how_i_felt_original": "",
                "instinct_formed": "",
                "instinct_formed_original": "",
                "pattern_tags": [topic, "identity", "basic"],
                "feeling_weight": 6.0,
            }
        return field, topic, answer_text, extracted_mem

    results = await asyncio.gather(*[
        extract_single(field, context, topic)
        for field, (context, topic) in basic_info_map.items()
    ])

    async def embed_and_save(result):
        if result is None:
            return
        field, topic, answer_text, extracted_memory = result
        embed_text = f"{extracted_memory.get('what_happened', '')} {extracted_memory.get('how_i_felt', '')} {extracted_memory.get('instinct_formed', '')}".strip()
        if not embed_text:
            return
        embedding = await generate_embedding(embed_text)
        return topic, answer_text, extracted_memory, embedding

    embed_results = await asyncio.gather(*[embed_and_save(r) for r in results])

    saved_count = 0
    for embed_result in embed_results:
        if embed_result is None:
            continue
        topic, answer_text, extracted_memory, embedding = embed_result
        embedding_str = "[" + ",".join(str(x) for x in embedding) + "]"
        feeling_weight = float(extracted_memory.get("feeling_weight", 6.0))

        memory = Memory(
            user_id=current_user.id,
            agent_id=agent.id,
            session_id=session.id,
            section="BASIC",
            is_core_memory=True,
            transcript_text=extracted_memory.get("what_happened", answer_text),
            transcript_original=extracted_memory.get("what_happened_original", answer_text),
            transcript_language=current_user.language,
            what_happened=extracted_memory.get("what_happened"),
            what_happened_original=extracted_memory.get("what_happened_original"),
            how_i_felt=extracted_memory.get("how_i_felt"),
            how_i_felt_original=extracted_memory.get("how_i_felt_original"),
            instinct_formed=extracted_memory.get("instinct_formed"),
            instinct_formed_original=extracted_memory.get("instinct_formed_original"),
            feeling_weight=feeling_weight,
            never_forget=feeling_weight >= 8.5,
            pattern_tags=extracted_memory.get("pattern_tags", [topic, "basic"]),
            training_mode="survey",
        )
        db.add(memory)
        await db.flush()

        await db.execute(
            text("UPDATE memories SET embedding = :embedding WHERE id = :id"),
            {"embedding": embedding_str, "id": str(memory.id)}
        )
        saved_count += 1

    # Save identity as one memory if we have identity info
    if identity_parts:
        identity_text = ". ".join(identity_parts)
        identity_embedding = await generate_embedding(identity_text)
        identity_embedding_str = "[" + ",".join(str(x) for x in identity_embedding) + "]"

        identity_memory = Memory(
            user_id=current_user.id,
            agent_id=agent.id,
            session_id=session.id,
            section="BASIC",
            is_core_memory=True,
            transcript_text=identity_text,
            transcript_original=identity_text,
            transcript_language=current_user.language,
            what_happened=identity_text,
            what_happened_original=identity_text,
            how_i_felt="These are my basic personal facts",
            instinct_formed="When asked about my identity, share these facts naturally",
            feeling_weight=7.0,
            never_forget=True,
            pattern_tags=["identity", "personal_facts", "basic"],
            training_mode="survey",
        )
        db.add(identity_memory)
        await db.flush()

        await db.execute(
            text("UPDATE memories SET embedding = :embedding WHERE id = :id"),
            {"embedding": identity_embedding_str, "id": str(identity_memory.id)}
        )
        saved_count += 1

    agent.total_memories = (agent.total_memories or 0) + saved_count
    agent.last_updated_at = datetime.utcnow()

    await db.commit()

    return {
        "message": "Survey complete. Your agent foundation is set.",
        "personality_summary": personality_summary,
        "memories_created": saved_count,
    }


@router.get("/status")
async def survey_status_check(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PersonalitySurvey).where(PersonalitySurvey.user_id == current_user.id)
    )
    survey = result.scalar_one_or_none()
    return {
        "completed": survey.is_completed if survey else False,
        "started": survey is not None,
    }


@router.get("/me")
async def get_my_survey(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PersonalitySurvey).where(PersonalitySurvey.user_id == current_user.id)
    )
    survey = result.scalar_one_or_none()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not completed yet")

    return {
        "is_completed": survey.is_completed,
        "personality_summary": survey.personality_summary,
        "extracted_profile": survey.extracted_profile,
        "completed_at": survey.completed_at,
    }