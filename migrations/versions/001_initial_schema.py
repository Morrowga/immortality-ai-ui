"""initial schema — all tables from scratch

Revision ID: 001
Revises:
Create Date: 2026-03-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from pgvector.sqlalchemy import Vector

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # ── users ──────────────────────────────────────────────────────────────
    op.create_table('users',
        sa.Column('id',                UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('email',             sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('name',              sa.String(255), nullable=False),
        sa.Column('hashed_password',   sa.String(255), nullable=False),
        sa.Column('language',          sa.String(10),  server_default='en'),
        sa.Column('subscription_tier', sa.String(50),  server_default='free'),
        sa.Column('created_at',        sa.DateTime,    server_default=sa.text('NOW()')),
        sa.Column('updated_at',        sa.DateTime,    server_default=sa.text('NOW()')),
    )

    # ── agent_profiles ─────────────────────────────────────────────────────
    op.create_table('agent_profiles',
        sa.Column('id',                   UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',              UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('agent_name',           sa.String(255), nullable=False),
        sa.Column('total_memories',       sa.Integer,  server_default='0'),
        sa.Column('wisdom_score',         sa.Float,    server_default='0.0'),
        sa.Column('dominant_pattern_tags',ARRAY(sa.String), server_default='{}'),
        sa.Column('personality_summary',  sa.Text,     nullable=True),
        sa.Column('survey_completed',     sa.Boolean,  server_default='false'),
        sa.Column('created_at',           sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('last_updated_at',      sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── agent_lifecycle ────────────────────────────────────────────────────
    op.create_table('agent_lifecycle',
        sa.Column('id',                    UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id',              UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('user_id',               UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False),
        sa.Column('birth_date',            sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('current_age',           sa.Integer,  server_default='0'),
        sa.Column('interaction_count',     sa.Integer,  server_default='0'),
        sa.Column('training_session_count',sa.Integer,  server_default='0'),
        sa.Column('current_wisdom_score',  sa.Float,    server_default='0.0'),
        sa.Column('max_age_limit',         sa.Integer,  server_default='365'),
        sa.Column('status',                sa.String(50), server_default='living'),
        sa.Column('generation_number',     sa.Integer,  server_default='1'),
        sa.Column('parent_agent_id',       UUID(as_uuid=True), nullable=True),
        sa.Column('last_active_at',        sa.DateTime, server_default=sa.text('NOW()')),
    )

    # ── style_profiles ─────────────────────────────────────────────────────
    op.create_table('style_profiles',
        sa.Column('id',                         UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',                    UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False, unique=True),
        sa.Column('agent_id',                   UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False, unique=True),
        sa.Column('avg_speaking_pace',          sa.String(50), server_default='medium'),
        sa.Column('avg_sentence_length',        sa.Float,      server_default='15.0'),
        sa.Column('dominant_emotions',          ARRAY(sa.String), server_default='{}'),
        sa.Column('humor_level',                sa.Float, server_default='5.0'),
        sa.Column('directness_level',           sa.Float, server_default='5.0'),
        sa.Column('warmth_level',               sa.Float, server_default='5.0'),
        sa.Column('cultural_expression_patterns', JSONB,  nullable=True),
        sa.Column('language_primary',           sa.String(10), server_default='en'),
        sa.Column('total_training_minutes',     sa.Float,  server_default='0.0'),
        sa.Column('last_trained_at',            sa.DateTime, nullable=True),
    )

    # ── training_sessions ──────────────────────────────────────────────────
    op.create_table('training_sessions',
        sa.Column('id',                  UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',             UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False),
        sa.Column('agent_id',            UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('mode',                sa.String(50), nullable=False),
        sa.Column('section_covered',     sa.String(50), nullable=True),
        sa.Column('duration_minutes',    sa.Float,      server_default='0.0'),
        sa.Column('memories_captured',   sa.Integer,    server_default='0'),
        sa.Column('avg_weight_of_session', sa.Float,   server_default='0.0'),
        sa.Column('created_at',          sa.DateTime,   server_default=sa.text('NOW()')),
    )

    # ── memories ───────────────────────────────────────────────────────────
    op.create_table('memories',
        sa.Column('id',         UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',    UUID(as_uuid=True), sa.ForeignKey('users.id'),              nullable=False),
        sa.Column('agent_id',   UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'),     nullable=False),
        sa.Column('session_id', UUID(as_uuid=True), sa.ForeignKey('training_sessions.id'),  nullable=True),

        sa.Column('section',        sa.String(20), nullable=False),
        sa.Column('cross_sections', ARRAY(sa.String), server_default='{}'),
        sa.Column('is_core_memory', sa.Boolean, server_default='false'),

        sa.Column('transcript_text',     sa.Text, nullable=False),
        sa.Column('transcript_original', sa.Text, nullable=True),
        sa.Column('transcript_language', sa.String(10), server_default='en'),
        sa.Column('audio_file_ref',      sa.String(500), nullable=True),

        sa.Column('what_happened',    sa.Text, nullable=True),
        sa.Column('context',          sa.Text, nullable=True),
        sa.Column('how_i_felt',       sa.Text, nullable=True),
        sa.Column('why_it_mattered',  sa.Text, nullable=True),
        sa.Column('what_i_learned',   sa.Text, nullable=True),
        sa.Column('instinct_formed',  sa.Text, nullable=True),
        sa.Column('cultural_expression_notes', sa.Text, nullable=True),

        sa.Column('what_happened_original',   sa.Text, nullable=True),
        sa.Column('how_i_felt_original',      sa.Text, nullable=True),
        sa.Column('why_it_mattered_original', sa.Text, nullable=True),
        sa.Column('what_i_learned_original',  sa.Text, nullable=True),
        sa.Column('instinct_formed_original', sa.Text, nullable=True),

        sa.Column('feeling_weight', sa.Float,   server_default='5.0'),
        sa.Column('never_forget',   sa.Boolean, server_default='false'),

        sa.Column('primary_emotion',    sa.String(100), nullable=True),
        sa.Column('secondary_emotion',  sa.String(100), nullable=True),
        sa.Column('emotion_intensity',  sa.Float,       nullable=True),
        sa.Column('voice_pace',         sa.String(50),  nullable=True),
        sa.Column('voice_tone',         sa.String(50),  nullable=True),
        sa.Column('hesitation_moments', JSONB,          nullable=True),

        sa.Column('pattern_tags', ARRAY(sa.String), server_default='{}'),
        sa.Column('embedding',    Vector(1536),      nullable=True),

        sa.Column('training_mode',       sa.String(50), nullable=True),
        sa.Column('agent_age_at_capture',sa.Integer,    server_default='0'),
        sa.Column('created_at',          sa.DateTime,   server_default=sa.text('NOW()')),
        sa.Column('last_reinforced_at',  sa.DateTime,   nullable=True),
        sa.Column('reinforcement_count', sa.Integer,    server_default='0'),
        sa.Column('is_active',           sa.Boolean,    server_default='true'),
    )

    # ── agent_responses ────────────────────────────────────────────────────
    op.create_table('agent_responses',
        sa.Column('id',              UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',         UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False),
        sa.Column('agent_id',        UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('memory_id',       UUID(as_uuid=True), sa.ForeignKey('memories.id'),       nullable=True),
        sa.Column('response_text',   sa.Text,        nullable=False),
        sa.Column('response_type',   sa.String(100), nullable=False),
        sa.Column('user_feedback',   sa.String(50),  nullable=True),
        sa.Column('correction_text', sa.Text,        nullable=True),
        sa.Column('created_at',      sa.DateTime,    server_default=sa.text('NOW()')),
    )

    # ── pattern_abstractions ───────────────────────────────────────────────
    op.create_table('pattern_abstractions',
        sa.Column('id',               UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id',         UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('pattern_summary',          sa.Text,      nullable=False),
        sa.Column('pattern_summary_original', sa.Text,      nullable=True),
        sa.Column('source_memory_ids',        ARRAY(UUID(as_uuid=True)), server_default='{}'),
        sa.Column('pattern_type',     sa.String(50), nullable=False),
        sa.Column('abstraction_weight', sa.Float,    server_default='5.0'),
        sa.Column('created_at',       sa.DateTime,   server_default=sa.text('NOW()')),
    )

    # ── voice_samples ──────────────────────────────────────────────────────
    op.create_table('voice_samples',
        sa.Column('id',                  UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',             UUID(as_uuid=True), sa.ForeignKey('users.id'),             nullable=False),
        sa.Column('session_id',          UUID(as_uuid=True), sa.ForeignKey('training_sessions.id'), nullable=True),
        sa.Column('audio_file_ref',      sa.String(500), nullable=False),
        sa.Column('duration_seconds',    sa.Float,       nullable=False),
        sa.Column('language_detected',   sa.String(10),  nullable=True),
        sa.Column('elevenlabs_voice_id', sa.String(255), nullable=True),
        sa.Column('created_at',          sa.DateTime,    server_default=sa.text('NOW()')),
    )

    # ── wisdom_inheritance ─────────────────────────────────────────────────
    op.create_table('wisdom_inheritance',
        sa.Column('id',                UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('from_agent_id',     UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('to_agent_id',       UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('inherited_patterns',ARRAY(UUID(as_uuid=True)), server_default='{}'),
        sa.Column('inherited_at',      sa.DateTime, server_default=sa.text('NOW()')),
        sa.Column('generation_number', sa.Integer,  nullable=False),
    )

    # ── agent_access ───────────────────────────────────────────────────────
    op.create_table('agent_access',
        sa.Column('id',                  UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('agent_id',            UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('owner_user_id',       UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False),
        sa.Column('granted_to_user_id',  UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False),
        sa.Column('access_level',        sa.String(50), server_default='view'),
        sa.Column('granted_at',          sa.DateTime,   server_default=sa.text('NOW()')),
        sa.Column('expires_at',          sa.DateTime,   nullable=True),
    )

    # ── slang_dictionary ───────────────────────────────────────────────────
    op.create_table('slang_dictionary',
        sa.Column('id',              UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',         UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False),
        sa.Column('agent_id',        UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False),
        sa.Column('word_or_phrase',  sa.String(255), nullable=False),
        sa.Column('meanings',        ARRAY(sa.Text),     server_default='{}'),
        sa.Column('example_sentences', ARRAY(sa.Text),  server_default='{}'),
        sa.Column('grammar_note',    sa.Text,        nullable=True),
        sa.Column('usage_context',   sa.Text,        nullable=True),
        sa.Column('language',        sa.String(10),  nullable=False),
        sa.Column('is_active',       sa.Boolean,     server_default='true'),
        sa.Column('created_at',      sa.DateTime,    server_default=sa.text('NOW()')),
    )

    # ── personality_survey ─────────────────────────────────────────────────
    op.create_table('personality_survey',
        sa.Column('id',       UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('user_id',  UUID(as_uuid=True), sa.ForeignKey('users.id'),          nullable=False, unique=True),
        sa.Column('agent_id', UUID(as_uuid=True), sa.ForeignKey('agent_profiles.id'), nullable=False, unique=True),

        # Basic info
        sa.Column('full_name',        sa.Text, nullable=True),
        sa.Column('birth_and_origin', sa.Text, nullable=True),
        sa.Column('family',           sa.Text, nullable=True),
        sa.Column('work_or_study',    sa.Text, nullable=True),
        sa.Column('current_life',     sa.Text, nullable=True),
        sa.Column('self_description', sa.Text, nullable=True),
        sa.Column('hardest_thing',    sa.Text, nullable=True),
        sa.Column('future_goals',     sa.Text, nullable=True),

        # Talking style
        sa.Column('stranger_formality',       sa.String(100), nullable=True),
        sa.Column('disagreement_style',       sa.String(100), nullable=True),
        sa.Column('response_length',          sa.String(100), nullable=True),
        sa.Column('close_friends_talking_style', sa.Text,     nullable=True),

        # Emotions
        sa.Column('anger_expression', sa.String(100), nullable=True),
        sa.Column('conflict_handling',sa.Text,        nullable=True),
        sa.Column('stress_behaviour', sa.String(100), nullable=True),

        # Social
        sa.Column('stranger_first_instinct', sa.String(100), nullable=True),
        sa.Column('trust_speed',             sa.String(100), nullable=True),
        sa.Column('misunderstood_trait',     sa.Text,        nullable=True),

        # Language habits (no language_mixing or language_mix_frequency)
        sa.Column('slang_frequency',   sa.String(100), nullable=True),
        sa.Column('humor_style',       sa.String(100), nullable=True),
        sa.Column('swearing_frequency',sa.String(100), nullable=True),

        # Thinking
        sa.Column('decision_style',     sa.String(100), nullable=True),
        sa.Column('advice_style',       sa.String(100), nullable=True),
        sa.Column('worldview',          sa.String(100), nullable=True),
        sa.Column('core_thinking_trait',sa.Text,        nullable=True),

        # Language preferences (no mix_frequency)
        sa.Column('daily_language_style', sa.String(100), nullable=True),
        sa.Column('other_languages',      sa.Text,        nullable=True),

        # Personal identity
        sa.Column('gender',           sa.String(50), nullable=True),
        sa.Column('birthdate',        sa.String(50), nullable=True),
        sa.Column('blood_type',       sa.String(10), nullable=True),
        sa.Column('zodiac_sign',      sa.String(50), nullable=True),
        sa.Column('special_features', sa.Text,       nullable=True),

        # Pronouns by relationship
        sa.Column('pronoun_lover',       sa.Text, nullable=True),
        sa.Column('pronoun_family',      sa.Text, nullable=True),
        sa.Column('pronoun_close_friend',sa.Text, nullable=True),
        sa.Column('pronoun_friend',      sa.Text, nullable=True),
        sa.Column('pronoun_coworker',    sa.Text, nullable=True),
        sa.Column('pronoun_stranger',    sa.Text, nullable=True),
        sa.Column('pronoun_older',       sa.Text, nullable=True),
        sa.Column('pronoun_younger',     sa.Text, nullable=True),

        # Extracted
        sa.Column('extracted_profile',   JSONB,      nullable=True),
        sa.Column('personality_summary', sa.Text,    nullable=True),
        sa.Column('is_completed',        sa.Boolean, server_default='false'),
        sa.Column('completed_at',        sa.DateTime,nullable=True),
        sa.Column('created_at',          sa.DateTime,server_default=sa.text('NOW()')),
        sa.Column('updated_at',          sa.DateTime,server_default=sa.text('NOW()')),
    )


def downgrade():
    op.drop_table('personality_survey')
    op.drop_table('slang_dictionary')
    op.drop_table('agent_access')
    op.drop_table('wisdom_inheritance')
    op.drop_table('voice_samples')
    op.drop_table('pattern_abstractions')
    op.drop_table('agent_responses')
    op.drop_table('memories')
    op.drop_table('training_sessions')
    op.drop_table('style_profiles')
    op.drop_table('agent_lifecycle')
    op.drop_table('agent_profiles')
    op.drop_table('users')