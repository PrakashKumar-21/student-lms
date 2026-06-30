"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision | comma,n}
Create Date: ${create_date}
"""

from alembic import op
import sqlalchemy as sa

revision = "${up_revision}"
down_revision = ${repr(down_revision) if down_revision not in (None, "None") else None}
branch_labels = ${repr(branch_labels) if branch_labels not in (None, "None") else None}
depends_on = ${repr(depends_on) if depends_on not in (None, "None") else None}


def upgrade() -> None:
    ${upgrades if upgrades else "pass"}


def downgrade() -> None:
    ${downgrades if downgrades else "pass"}
