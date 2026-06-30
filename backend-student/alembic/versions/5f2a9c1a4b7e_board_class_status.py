"""add status to boards and classes

Revision ID: 5f2a9c1a4b7e
Revises: 7b2b3f6e2a1c
Create Date: 2026-01-18 16:20:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "5f2a9c1a4b7e"
down_revision = "7b2b3f6e2a1c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "boards",
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="inactive",
            nullable=False,
        ),
    )
    op.add_column(
        "class_levels",
        sa.Column(
            "status",
            sa.String(length=20),
            server_default="inactive",
            nullable=False,
        ),
    )
    op.execute("UPDATE boards SET status = 'active' WHERE status = 'inactive'")
    op.execute("UPDATE class_levels SET status = 'active' WHERE status = 'inactive'")
    op.alter_column("boards", "status", server_default=None)
    op.alter_column("class_levels", "status", server_default=None)


def downgrade() -> None:
    op.drop_column("class_levels", "status")
    op.drop_column("boards", "status")
