import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Boolean, Integer,
    DateTime, Text, ForeignKey, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    language = Column(String(10), default="en")
    subscription_tier = Column(String(50), default="free")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    agents = relationship("AgentProfile", back_populates="user", cascade="all, delete-orphan")
    style_profile = relationship("StyleProfile", back_populates="user", uselist=False)
    voice_samples = relationship("VoiceSample", back_populates="user")
    personality_survey = relationship("PersonalitySurvey", back_populates="user", uselist=False)
    slang_dictionary = relationship("SlangDictionary", back_populates="user")


class AgentProfile(Base):
    __tablename__ = "agent_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agent_name = Column(String(255), nullable=False)
    total_memories = Column(Integer, default=0)
    wisdom_score = Column(Float, default=0.0)
    dominant_pattern_tags = Column(ARRAY(String), default=[])
    personality_summary = Column(Text, nullable=True)
    survey_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="agents")
    lifecycle = relationship("AgentLifecycle", back_populates="agent", uselist=False)
    style_profile = relationship("StyleProfile", back_populates="agent", uselist=False)


class AgentLifecycle(Base):
    __tablename__ = "agent_lifecycle"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    birth_date = Column(DateTime, default=datetime.utcnow)
    current_age = Column(Integer, default=0)
    interaction_count = Column(Integer, default=0)
    training_session_count = Column(Integer, default=0)
    current_wisdom_score = Column(Float, default=0.0)
    max_age_limit = Column(Integer, default=365)
    status = Column(String(50), default="living")
    generation_number = Column(Integer, default=1)
    parent_agent_id = Column(UUID(as_uuid=True), nullable=True)
    last_active_at = Column(DateTime, default=datetime.utcnow)

    agent = relationship("AgentProfile", foreign_keys=[agent_id], back_populates="lifecycle")


class StyleProfile(Base):
    __tablename__ = "style_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False, unique=True)
    avg_speaking_pace = Column(String(50), default="medium")
    avg_sentence_length = Column(Float, default=15.0)
    dominant_emotions = Column(ARRAY(String), default=[])
    humor_level = Column(Float, default=5.0)
    directness_level = Column(Float, default=5.0)
    warmth_level = Column(Float, default=5.0)
    cultural_expression_patterns = Column(JSONB, nullable=True)
    language_primary = Column(String(10), default="en")
    total_training_minutes = Column(Float, default=0.0)
    last_trained_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="style_profile")
    agent = relationship("AgentProfile", back_populates="style_profile")


class Memory(Base):
    __tablename__ = "memories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("training_sessions.id"), nullable=True)

    section = Column(String(20), nullable=False)
    cross_sections = Column(ARRAY(String), default=[])
    is_core_memory = Column(Boolean, default=False)

    transcript_text = Column(Text, nullable=False)
    transcript_original = Column(Text, nullable=True)
    transcript_language = Column(String(10), default="en")
    audio_file_ref = Column(String(500), nullable=True)

    what_happened = Column(Text, nullable=True)
    context = Column(Text, nullable=True)
    how_i_felt = Column(Text, nullable=True)
    why_it_mattered = Column(Text, nullable=True)
    what_i_learned = Column(Text, nullable=True)
    instinct_formed = Column(Text, nullable=True)
    cultural_expression_notes = Column(Text, nullable=True)

    what_happened_original = Column(Text, nullable=True)
    how_i_felt_original = Column(Text, nullable=True)
    why_it_mattered_original = Column(Text, nullable=True)
    what_i_learned_original = Column(Text, nullable=True)
    instinct_formed_original = Column(Text, nullable=True)

    feeling_weight = Column(Float, default=5.0)
    never_forget = Column(Boolean, default=False)

    primary_emotion = Column(String(100), nullable=True)
    secondary_emotion = Column(String(100), nullable=True)
    emotion_intensity = Column(Float, nullable=True)
    voice_pace = Column(String(50), nullable=True)
    voice_tone = Column(String(50), nullable=True)
    hesitation_moments = Column(JSONB, nullable=True)

    pattern_tags = Column(ARRAY(String), default=[])
    embedding = Column(Vector(1536), nullable=True)

    training_mode = Column(String(50), nullable=True)
    agent_age_at_capture = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_reinforced_at = Column(DateTime, nullable=True)
    reinforcement_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    agent_responses = relationship("AgentResponse", back_populates="memory")


class PatternAbstraction(Base):
    __tablename__ = "pattern_abstractions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    pattern_summary = Column(Text, nullable=False)
    pattern_summary_original = Column(Text, nullable=True)
    source_memory_ids = Column(ARRAY(UUID(as_uuid=True)), default=[])
    pattern_type = Column(String(50), nullable=False)
    abstraction_weight = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class VoiceSample(Base):
    __tablename__ = "voice_samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    session_id = Column(UUID(as_uuid=True), ForeignKey("training_sessions.id"), nullable=True)
    audio_file_ref = Column(String(500), nullable=False)
    duration_seconds = Column(Float, nullable=False)
    language_detected = Column(String(10), nullable=True)
    elevenlabs_voice_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="voice_samples")


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    mode = Column(String(50), nullable=False)
    section_covered = Column(String(50), nullable=True)
    duration_minutes = Column(Float, default=0.0)
    memories_captured = Column(Integer, default=0)
    avg_weight_of_session = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentResponse(Base):
    __tablename__ = "agent_responses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    memory_id = Column(UUID(as_uuid=True), ForeignKey("memories.id"), nullable=True)
    response_text = Column(Text, nullable=False)
    response_type = Column(String(100), nullable=False)
    user_feedback = Column(String(50), nullable=True)
    correction_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    memory = relationship("Memory", back_populates="agent_responses")


class WisdomInheritance(Base):
    __tablename__ = "wisdom_inheritance"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    to_agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    inherited_patterns = Column(ARRAY(UUID(as_uuid=True)), default=[])
    inherited_at = Column(DateTime, default=datetime.utcnow)
    generation_number = Column(Integer, nullable=False)


class AgentAccess(Base):
    __tablename__ = "agent_access"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    granted_to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    access_level = Column(String(50), default="view")
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class SlangDictionary(Base):
    __tablename__ = "slang_dictionary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False)
    word_or_phrase = Column(String(255), nullable=False)
    meanings = Column(ARRAY(Text), default=[])
    example_sentences = Column(ARRAY(Text), default=[])
    grammar_note = Column(Text, nullable=True)
    usage_context = Column(Text, nullable=True)
    language = Column(String(10), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="slang_dictionary")


class PersonalitySurvey(Base):
    __tablename__ = "personality_survey"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agent_profiles.id"), nullable=False, unique=True)

    # Section 1 — Basic Info (new)
    full_name = Column(Text, nullable=True)
    birth_and_origin = Column(Text, nullable=True)
    family = Column(Text, nullable=True)
    work_or_study = Column(Text, nullable=True)
    current_life = Column(Text, nullable=True)
    self_description = Column(Text, nullable=True)
    hardest_thing = Column(Text, nullable=True)
    future_goals = Column(Text, nullable=True)

    # Section 2 — Talking style
    stranger_formality = Column(String(100), nullable=True)
    disagreement_style = Column(String(100), nullable=True)
    response_length = Column(String(100), nullable=True)
    close_friends_talking_style = Column(Text, nullable=True)

    # Section 3 — Emotions
    anger_expression = Column(String(100), nullable=True)
    conflict_handling = Column(Text, nullable=True)
    stress_behaviour = Column(String(100), nullable=True)

    # Section 4 — Social
    stranger_first_instinct = Column(String(100), nullable=True)
    trust_speed = Column(String(100), nullable=True)
    misunderstood_trait = Column(Text, nullable=True)

    # Section 5 — Language habits (language_mixing removed)
    slang_frequency = Column(String(100), nullable=True)
    humor_style = Column(String(100), nullable=True)
    swearing_frequency = Column(String(100), nullable=True)

    # Section 6 — Thinking
    decision_style = Column(String(100), nullable=True)
    advice_style = Column(String(100), nullable=True)
    worldview = Column(String(100), nullable=True)
    core_thinking_trait = Column(Text, nullable=True)

    # Section 7 — Language preferences (mix_frequency removed)
    daily_language_style = Column(String(100), nullable=True)
    other_languages = Column(Text, nullable=True)

    # Section 8 — Personal Identity (new)
    gender = Column(String(50), nullable=True)
    birthdate = Column(String(50), nullable=True)
    blood_type = Column(String(10), nullable=True)
    zodiac_sign = Column(String(50), nullable=True)
    special_features = Column(Text, nullable=True)

    # Section 9 — Pronouns by relationship (new)
    pronoun_lover = Column(Text, nullable=True)
    pronoun_family = Column(Text, nullable=True)
    pronoun_close_friend = Column(Text, nullable=True)
    pronoun_friend = Column(Text, nullable=True)
    pronoun_coworker = Column(Text, nullable=True)
    pronoun_stranger = Column(Text, nullable=True)
    pronoun_older = Column(Text, nullable=True)
    pronoun_younger = Column(Text, nullable=True)

    # Extracted by Claude
    extracted_profile = Column(JSONB, nullable=True)
    personality_summary = Column(Text, nullable=True)

    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="personality_survey")