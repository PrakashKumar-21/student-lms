from functools import lru_cache
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ================== APP ==================
    app_name: str = "student-backend"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    # ================== DATABASE ==================
    database_url: str = Field(..., alias="DATABASE_URL")
    db_pool_size: int = Field(default=5, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=5, alias="DB_MAX_OVERFLOW")
    db_pool_timeout: int = Field(default=30, alias="DB_POOL_TIMEOUT")
    db_pool_recycle: int = Field(default=1800, alias="DB_POOL_RECYCLE")

    # ================== JWT ==================
    jwt_secret: str = Field(default="dev-secret-change", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60, alias="ACCESS_TOKEN_EXPIRE_MINUTES"
    )

    # ================== ADMIN ==================
    admin_email: str | None = Field(default=None, alias="ADMIN_EMAIL")
    admin_password: str | None = Field(default=None, alias="ADMIN_PASSWORD")

    # ================== CORS ==================
    # Frontend runs on 8080 (Vite)
    cors_origins: str = Field(
        default="http://localhost:8080,http://127.0.0.1:8080",
        alias="CORS_ORIGINS"
    )


    rag_api_url: str = Field(default="https://example.com/rag", alias="RAG_API_URL")
    rag_api_key: str = Field(default="dummy-rag-key", alias="RAG_API_KEY")
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    upload_max_bytes: int = Field(default=20 * 1024 * 1024, alias="UPLOAD_MAX_BYTES")
    upload_allowed_mime: str = Field(
        default="application/pdf,image/png,image/jpeg,image/webp",
        alias="UPLOAD_ALLOWED_MIME",
    )
    upload_allowed_ext: str = Field(
        default=".pdf,.png,.jpg,.jpeg,.webp",
        alias="UPLOAD_ALLOWED_EXT",
    )
    upload_tmp_dir: str = Field(default="uploads/tmp", alias="UPLOAD_TMP_DIR")
    storage_backend: str = Field(default="auto", alias="STORAGE_BACKEND")
    storage_delete_source_after_ingest: bool = Field(
        default=True, alias="STORAGE_DELETE_SOURCE_AFTER_INGEST"
    )

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_embed_model: str = Field(
        default="text-embedding-3-small", alias="OPENAI_EMBED_MODEL"
    )
    openai_chat_model: str = Field(default="gpt-4o-mini", alias="OPENAI_CHAT_MODEL")

    do_spaces_key: str = Field(default="", alias="DO_SPACES_KEY")
    do_spaces_secret: str = Field(default="", alias="DO_SPACES_SECRET")
    do_spaces_endpoint: str = Field(default="", alias="DO_SPACES_ENDPOINT")
    do_spaces_bucket: str = Field(default="", alias="DO_SPACES_BUCKET")
    do_spaces_region: str = Field(default="", alias="DO_SPACES_REGION")

    # ================== RAG ==================
    rag_api_url: str = Field(
        default="https://example.com/rag", alias="RAG_API_URL"
    )
    rag_api_key: str = Field(
        default="dummy-rag-key", alias="RAG_API_KEY"
    )

    # ================== TWILIO (PHONE OTP) ==================
    twilio_account_sid: str | None = Field(
        default=None, alias="TWILIO_ACCOUNT_SID"
    )
    twilio_auth_token: str | None = Field(
        default=None, alias="TWILIO_AUTH_TOKEN"
    )
    twilio_phone_number: str | None = Field(
        default=None, alias="TWILIO_PHONE_NUMBER"
    )

    # ================== EMAIL OTP (GMAIL SMTP) ==================
    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int | None = Field(default=None, alias="SMTP_PORT")
    smtp_user: str | None = Field(default=None, alias="SMTP_USER")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")


    # ================== RAZORPAY ==================
    razorpay_key_id: str | None = Field(default=None, alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str | None = Field(default=None, alias="RAZORPAY_KEY_SECRET")

    # ================== DEV FLAGS ==================
    allow_chat_without_subscription: bool = Field(
        default=False, alias="ALLOW_CHAT_WITHOUT_SUBSCRIPTION"
    )
    allow_admin_readonly: bool = Field(
        default=False, alias="ALLOW_ADMIN_READONLY"
    )

    # ================== EMAIL OTP (SENDGRID) ==================
    sendgrid_api_key: str | None = Field(default=None, alias="SENDGRID_API_KEY")
    sendgrid_from_email: str | None = Field(default=None, alias="SENDGRID_FROM_EMAIL")
    sendgrid_from_name: str | None = Field(default=None, alias="SENDGRID_FROM_NAME")

    # ================== REDIS / CELERY ==================
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")
    celery_task_soft_time_limit: int = Field(default=300, alias="CELERY_TASK_SOFT_TIME_LIMIT")
    celery_task_time_limit: int = Field(default=360, alias="CELERY_TASK_TIME_LIMIT")
    celery_task_max_retries: int = Field(default=3, alias="CELERY_TASK_MAX_RETRIES")
    celery_task_retry_backoff_base: int = Field(
        default=2, alias="CELERY_TASK_RETRY_BACKOFF_BASE"
    )
    celery_task_retry_backoff_max: int = Field(
        default=60, alias="CELERY_TASK_RETRY_BACKOFF_MAX"
    )
    celery_task_retry_jitter: bool = Field(
        default=True, alias="CELERY_TASK_RETRY_JITTER"
    )
    celery_task_queue: str = Field(default="ingestion", alias="CELERY_TASK_QUEUE")



    class Config:
        env_file = Path(__file__).resolve().parents[2] / ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
