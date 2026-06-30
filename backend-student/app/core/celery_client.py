from celery import Celery

from app.core.config import get_settings


settings = get_settings()

celery_client = Celery(
    "student_lms_api",
    broker=settings.redis_url,
    backend=settings.redis_url,
)
