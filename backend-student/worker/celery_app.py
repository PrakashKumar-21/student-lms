from celery import Celery

from app.core.config import get_settings


settings = get_settings()

celery_app = Celery(
    "student_lms_worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["worker.tasks"],
)

celery_app.conf.update(
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_soft_time_limit=settings.celery_task_soft_time_limit,
    task_time_limit=settings.celery_task_time_limit,
    task_default_queue=settings.celery_task_queue,
    task_routes={
        "ingest_subject_file": {"queue": settings.celery_task_queue},
    },
    broker_connection_retry_on_startup=True,
)
