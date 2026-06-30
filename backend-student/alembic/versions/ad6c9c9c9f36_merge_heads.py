"""merge heads

Revision ID: ad6c9c9c9f36
Revises: e1d2c3b4a5f6, f1a2b3c4d5e6
Create Date: 2026-02-03 14:49:15.222921
"""

from alembic import op
import sqlalchemy as sa

revision = "ad6c9c9c9f36"
down_revision = ('e1d2c3b4a5f6', 'f1a2b3c4d5e6')
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
