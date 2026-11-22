"""Initial PostgreSQL 18 frozen schema for AirAware AI.

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-11-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('email', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True, nullable=False),
    )

    # 2. user_profiles
    op.create_table(
        'user_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('preferred_location_lat', sa.Float(), nullable=True),
        sa.Column('preferred_location_lng', sa.Float(), nullable=True),
        sa.Column('occupation', sa.String(100), nullable=True),
        sa.Column('commute_type', sa.String(50), nullable=True),
        sa.Column('commute_duration', sa.Integer(), nullable=True),
        sa.Column('outdoor_activity', sa.String(100), nullable=True),
        sa.Column('notification_prefs', postgresql.JSON(), nullable=True),
        sa.Column('household_context', postgresql.JSON(), nullable=True),
    )

    # 3. locations
    op.create_table(
        'locations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(200), nullable=False, index=True),
        sa.Column('city', sa.String(100), nullable=False, index=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('country', sa.String(100), server_default='India', nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
    )

    # 4. monitoring_stations
    op.create_table(
        'monitoring_stations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('locations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(200), nullable=False, index=True),
        sa.Column('station_code', sa.String(50), unique=True, nullable=True),
        sa.Column('city', sa.String(100), nullable=False, index=True),
        sa.Column('state', sa.String(100), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('source', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
    )

    # 5. environmental_data_sources
    op.create_table(
        'environmental_data_sources',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('name', sa.String(200), unique=True, nullable=False),
        sa.Column('source_type', sa.String(50), nullable=False),
        sa.Column('base_url', sa.String(500), nullable=True),
        sa.Column('api_key_name', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('metadata_json', postgresql.JSON(), nullable=True),
    )

    # 6. air_measurements
    op.create_table(
        'air_measurements',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('station_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('monitoring_stations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('aqi', sa.Integer(), nullable=False, index=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('dominant_pollutant', sa.String(20), nullable=True),
        sa.Column('pm25', sa.Float(), nullable=True),
        sa.Column('pm10', sa.Float(), nullable=True),
        sa.Column('no2', sa.Float(), nullable=True),
        sa.Column('so2', sa.Float(), nullable=True),
        sa.Column('o3', sa.Float(), nullable=True),
        sa.Column('co', sa.Float(), nullable=True),
        sa.Column('nh3', sa.Float(), nullable=True),
        sa.Column('pb', sa.Float(), nullable=True),
        sa.Column('pollutant_data', postgresql.JSON(), nullable=True),
        sa.Column('measured_at', sa.DateTime(timezone=True), nullable=False, index=True),
    )

    # 7. air_quality_summaries
    op.create_table(
        'air_quality_summaries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('locations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('period_type', sa.String(20), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('avg_aqi', sa.Integer(), nullable=False),
        sa.Column('min_aqi', sa.Integer(), nullable=True),
        sa.Column('max_aqi', sa.Integer(), nullable=True),
        sa.Column('dominant_pollutant', sa.String(20), nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('summary_data', postgresql.JSON(), nullable=True),
    )

    # 8. air_forecasts
    op.create_table(
        'air_forecasts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('location_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('locations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('forecast_date', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('predicted_aqi', sa.Integer(), nullable=False),
        sa.Column('predicted_category', sa.String(50), nullable=False),
        sa.Column('confidence', sa.Float(), default=0.0, nullable=False),
        sa.Column('model_version', sa.String(50), nullable=True),
        sa.Column('forecast_data', postgresql.JSON(), nullable=True),
    )

    # 9. daily_routines
    op.create_table(
        'daily_routines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('metadata_json', postgresql.JSON(), nullable=True),
    )

    # 10. routine_items
    op.create_table(
        'routine_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('routine_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('daily_routines.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('activity', sa.String(200), nullable=False),
        sa.Column('location_type', sa.String(50), nullable=True),
        sa.Column('start_time', sa.String(10), nullable=True),
        sa.Column('end_time', sa.String(10), nullable=True),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('sort_order', sa.Integer(), default=0, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
    )

    # 11. chat_sessions
    op.create_table(
        'chat_sessions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(300), nullable=True),
        sa.Column('status', sa.String(20), server_default='active', nullable=False),
        sa.Column('metadata_json', postgresql.JSON(), nullable=True),
    )

    # 12. chat_messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(30), server_default='text', nullable=False),
        sa.Column('metadata_json', postgresql.JSON(), nullable=True),
    )

    # 13. agent_runs
    op.create_table(
        'agent_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chat_sessions.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('agent_type', sa.String(50), nullable=True),
        sa.Column('input_data', postgresql.JSON(), nullable=True),
        sa.Column('output_data', postgresql.JSON(), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('token_usage', postgresql.JSON(), nullable=True),
    )

    # 14. agent_run_steps
    op.create_table(
        'agent_run_steps',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('agent_run_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('agent_runs.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('step_number', sa.Integer(), nullable=False),
        sa.Column('step_type', sa.String(50), nullable=False),
        sa.Column('tool_name', sa.String(100), nullable=True),
        sa.Column('input_data', postgresql.JSON(), nullable=True),
        sa.Column('output_data', postgresql.JSON(), nullable=True),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('error', sa.Text(), nullable=True),
    )

    # 15. emission_factors
    op.create_table(
        'emission_factors',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('transport_mode', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('co2_per_km', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(20), server_default='g/km', nullable=False),
        sa.Column('source', sa.String(200), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
    )

    # 16. mobility_records
    op.create_table(
        'mobility_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('transport_mode', sa.String(50), nullable=False),
        sa.Column('distance_km', sa.Float(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('origin', sa.String(200), nullable=True),
        sa.Column('destination', sa.String(200), nullable=True),
        sa.Column('origin_lat', sa.Float(), nullable=True),
        sa.Column('origin_lng', sa.Float(), nullable=True),
        sa.Column('dest_lat', sa.Float(), nullable=True),
        sa.Column('dest_lng', sa.Float(), nullable=True),
        sa.Column('co2_grams', sa.Float(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=True),
    )

    # 17. sustainability_actions
    op.create_table(
        'sustainability_actions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('difficulty', sa.String(20), server_default='easy', nullable=False),
        sa.Column('impact_points', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # 18. impact_records
    op.create_table(
        'impact_records',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('period_type', sa.String(20), nullable=False),
        sa.Column('period_start', sa.DateTime(timezone=True), nullable=False, index=True),
        sa.Column('period_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_co2_grams', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('total_distance_km', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('green_trips', sa.Integer(), server_default='0', nullable=False),
        sa.Column('total_trips', sa.Integer(), server_default='0', nullable=False),
        sa.Column('score', sa.Float(), nullable=True),
        sa.Column('impact_data', postgresql.JSON(), nullable=True),
    )

    # 19. community_reports
    op.create_table(
        'community_reports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('report_type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('severity', sa.Integer(), server_default='1', nullable=False),
        sa.Column('status', sa.String(20), server_default='pending', nullable=False),
        sa.Column('upvotes', sa.Integer(), server_default='0', nullable=False),
        sa.Column('image_urls', postgresql.JSON(), nullable=True),
        sa.Column('reported_at', sa.DateTime(timezone=True), nullable=False, index=True),
    )

    # 20. report_moderations
    op.create_table(
        'report_moderations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('report_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('community_reports.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('moderator_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(30), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('metadata_json', postgresql.JSON(), nullable=True),
    )

    # 21. notifications
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('channel', sa.String(30), server_default='in_app', nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('payload', postgresql.JSON(), nullable=True),
    )

    # 22. notification_preferences
    op.create_table(
        'notification_preferences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('channel', sa.String(30), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('settings', postgresql.JSON(), nullable=True),
    )


def downgrade() -> None:
    # Drop tables in exact reverse dependency order
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
    op.drop_table('report_moderations')
    op.drop_table('community_reports')
    op.drop_table('impact_records')
    op.drop_table('sustainability_actions')
    op.drop_table('mobility_records')
    op.drop_table('emission_factors')
    op.drop_table('agent_run_steps')
    op.drop_table('agent_runs')
    op.drop_table('chat_messages')
    op.drop_table('chat_sessions')
    op.drop_table('routine_items')
    op.drop_table('daily_routines')
    op.drop_table('air_forecasts')
    op.drop_table('air_quality_summaries')
    op.drop_table('air_measurements')
    op.drop_table('environmental_data_sources')
    op.drop_table('monitoring_stations')
    op.drop_table('locations')
    op.drop_table('user_profiles')
    op.drop_table('users')
