"""create uuid core tables if missing

Revision ID: a2b3c4d5e6f7
Revises: 9d2f0c7a8f01
Create Date: 2026-01-20 12:30:00.000000
"""

from alembic import op

revision = "a2b3c4d5e6f7"
down_revision = "9d2f0c7a8f01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            phone_or_email VARCHAR(255) NOT NULL UNIQUE,
            full_name VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS otps (
            id UUID PRIMARY KEY,
            otp_token VARCHAR UNIQUE,
            identifier VARCHAR,
            otp_hash VARCHAR,
            expires_at TIMESTAMP,
            is_used BOOLEAN,
            attempts_remaining INTEGER NOT NULL DEFAULT 3,
            created_at TIMESTAMP
        );
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_otps_identifier ON otps (identifier);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_otps_otp_token ON otps (otp_token);")

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id UUID PRIMARY KEY,
            name VARCHAR(80) NOT NULL UNIQUE,
            price VARCHAR(40) NOT NULL,
            description VARCHAR(255),
            features JSONB NOT NULL DEFAULT '[]'::jsonb
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS user_subscriptions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id),
            plan_id UUID NOT NULL REFERENCES subscription_plans(id),
            status VARCHAR(40) DEFAULT 'active',
            started_at TIMESTAMPTZ DEFAULT now()
        );
        """
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id UUID PRIMARY KEY,
            user_id UUID REFERENCES users(id),
            board VARCHAR(80),
            class_level VARCHAR(80),
            subject VARCHAR(120),
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS chat_messages (
            id UUID PRIMARY KEY,
            session_id UUID NOT NULL REFERENCES chat_sessions(id),
            sender VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS chat_messages CASCADE;")
    op.execute("DROP TABLE IF EXISTS chat_sessions CASCADE;")
    op.execute("DROP TABLE IF EXISTS user_subscriptions CASCADE;")
    op.execute("DROP TABLE IF EXISTS subscription_plans CASCADE;")
    op.execute("DROP TABLE IF EXISTS otps CASCADE;")
    op.execute("DROP TABLE IF EXISTS users CASCADE;")
