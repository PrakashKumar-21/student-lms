"""add usage tracking and plan limits

Revision ID: c4d5e6f7a8b9
Revises: b3d4e5f6a7b8
Create Date: 2026-01-20 13:30:00.000000
"""

from alembic import op

revision = "c4d5e6f7a8b9"
down_revision = "b3d4e5f6a7b8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_queries_per_day INTEGER;"
    )
    op.execute(
        "ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_queries_per_month INTEGER;"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_usage (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id),
            period_date DATE NOT NULL,
            queries_used INTEGER NOT NULL DEFAULT 0,
            updated_at TIMESTAMPTZ DEFAULT now()
        );
        """
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS ux_user_usage_user_date ON user_usage (user_id, period_date);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ux_user_usage_user_date;")
    op.execute("DROP TABLE IF EXISTS user_usage CASCADE;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS max_queries_per_month;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS max_queries_per_day;")
