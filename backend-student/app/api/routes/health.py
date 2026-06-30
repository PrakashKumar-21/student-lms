from fastapi import APIRouter, HTTPException, status
from redis import Redis
from sqlalchemy import text

from app.core.celery_client import celery_client
from app.core.config import get_settings
from app.core.database import SessionLocal


router = APIRouter(prefix="/health", tags=["health"])
settings = get_settings()


@router.get("")
def health() -> dict:
    return {
        "status": "ok",
        "db": _db_ok(),
        "redis": _redis_ok(),
        "worker": _worker_ok(),
    }


@router.get("/db")
def health_db() -> dict:
    if not _db_ok():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="db")
    return {"status": "ok"}


@router.get("/redis")
def health_redis() -> dict:
    if not _redis_ok():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="redis")
    return {"status": "ok"}


@router.get("/worker")
def health_worker() -> dict:
    if not _worker_ok():
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="worker")
    return {"status": "ok"}


def _db_ok() -> bool:
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        try:
            db.close()
        except Exception:
            pass


def _redis_ok() -> bool:
    try:
        client = Redis.from_url(settings.redis_url, socket_timeout=1)
        return client.ping()
    except Exception:
        return False


def _worker_ok() -> bool:
    try:
        replies = celery_client.control.ping(timeout=1)
        return bool(replies)
    except Exception:
        return False
