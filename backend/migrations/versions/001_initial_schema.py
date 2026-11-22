"""Initial PostgreSQL 18 schema for AirAware AI.

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-11-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from app.database.base import Base
import app.models  # Ensure all models are registered on metadata

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create all 22 database tables defined in Base.metadata."""
    bind = op.get_bind()
    Base.metadata.create_all(bind=bind)


def downgrade() -> None:
    """Drop all tables defined in Base.metadata in reverse dependency order."""
    bind = op.get_bind()
    Base.metadata.drop_all(bind=bind)
