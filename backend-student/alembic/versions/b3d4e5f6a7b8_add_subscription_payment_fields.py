"""add subscription payment fields

Revision ID: b3d4e5f6a7b8
Revises: a2b3c4d5e6f7
Create Date: 2026-01-20 13:00:00.000000
"""

from alembic import op

revision = "b3d4e5f6a7b8"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS amount_paise INTEGER NOT NULL DEFAULT 0;")
    op.execute("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';")
    op.execute("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS interval VARCHAR(20) NOT NULL DEFAULT 'month';")
    op.execute("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();")
    op.execute("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();")
    op.execute("ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;")

    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS price_at_purchase VARCHAR(40);")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS payment_ref_id VARCHAR(120);")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS provider VARCHAR(40);")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(120);")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();")
    op.execute("ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();")


def downgrade() -> None:
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS updated_at;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS created_at;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS provider_subscription_id;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS provider;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS payment_ref_id;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS payment_method;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS price_at_purchase;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS cancelled_at;")
    op.execute("ALTER TABLE user_subscriptions DROP COLUMN IF EXISTS expires_at;")

    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS features;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS updated_at;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS created_at;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS interval;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS currency;")
    op.execute("ALTER TABLE subscription_plans DROP COLUMN IF EXISTS amount_paise;")
