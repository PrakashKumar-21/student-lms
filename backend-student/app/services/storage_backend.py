from __future__ import annotations

import logging
import os
import shutil
import tempfile
from pathlib import Path
from typing import BinaryIO

import boto3

from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


def use_spaces_backend() -> bool:
    backend = settings.storage_backend.lower()
    if backend == "local":
        if settings.environment != "development":
            raise RuntimeError("Local storage is allowed only in development.")
        return False
    if backend == "spaces":
        return True
    if settings.environment != "development":
        raise RuntimeError("Production requires object storage backend.")
    return bool(settings.do_spaces_endpoint and settings.do_spaces_bucket)


def _get_spaces_client():
    if not settings.do_spaces_endpoint:
        raise ValueError("DO_SPACES_ENDPOINT is not configured.")
    if not settings.do_spaces_bucket:
        raise ValueError("DO_SPACES_BUCKET is not configured.")
    client = boto3.client(
        "s3",
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
        region_name=settings.do_spaces_region or None,
    )
    return client


def save_upload(
    subject_id: str,
    filename: str,
    file_obj: BinaryIO | None,
    content_type: str | None,
    tmp_path: Path,
    local_path: Path,
) -> tuple[str, str]:
    """
    Save an upload and return (storage_backend, storage_path).
    If Spaces is configured, upload to Spaces and return ("spaces", object_key).
    Otherwise, keep local and return ("local", local_path).
    """
    if use_spaces_backend():
        if file_obj is None:
            raise ValueError("file_obj required for object storage upload")
        client = _get_spaces_client()
        object_key = f"{subject_id}/{filename}"
        extra_args = {}
        if content_type:
            extra_args["ContentType"] = content_type
        file_obj.seek(0)
        client.upload_fileobj(
            file_obj,
            settings.do_spaces_bucket,
            object_key,
            ExtraArgs=extra_args or None,
        )
        return "spaces", object_key

    local_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(tmp_path), str(local_path))
    return "local", str(local_path)


def open_for_processing(storage_backend: str, storage_path: str) -> str:
    """
    Return a local file path that the worker can read.
    If storage backend is spaces, download to a temp file.
    """
    if storage_backend == "local":
        return storage_path

    if storage_backend == "spaces":
        client = _get_spaces_client()
        tmp_dir = Path(settings.upload_tmp_dir)
        tmp_dir.mkdir(parents=True, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(prefix="ingest_", dir=str(tmp_dir))
        os.close(fd)
        with open(tmp_path, "wb") as out:
            client.download_fileobj(settings.do_spaces_bucket, storage_path, out)
        return tmp_path

    raise ValueError(f"Unknown storage backend: {storage_backend}")


def cleanup_source(storage_backend: str, storage_path: str) -> None:
    if storage_backend == "local":
        try:
            Path(storage_path).unlink(missing_ok=True)
        except Exception as exc:
            logger.warning("Failed to delete local file: %s", exc)
        return

    if storage_backend == "spaces":
        if not settings.storage_delete_source_after_ingest:
            return
        try:
            client = _get_spaces_client()
            client.delete_object(Bucket=settings.do_spaces_bucket, Key=storage_path)
        except Exception as exc:
            logger.warning("Failed to delete object from Spaces: %s", exc)
        return

    raise ValueError(f"Unknown storage backend: {storage_backend}")


def cleanup_temp_file(path: str) -> None:
    try:
        Path(path).unlink(missing_ok=True)
    except Exception:
        pass
