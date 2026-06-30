"""add otp attempts remaining

Revision ID: 4f2d1b3a7c21
Revises: 0c0138f1db27
Create Date: 2026-01-16 18:05:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "4f2d1b3a7c21"
down_revision = "0c0138f1db27"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "otps",
        sa.Column("attempts_remaining", sa.Integer(), server_default=sa.text("3"), nullable=False),
    )
    op.alter_column("otps", "attempts_remaining", server_default=None)


def downgrade() -> None:
    op.drop_column("otps", "attempts_remaining")
