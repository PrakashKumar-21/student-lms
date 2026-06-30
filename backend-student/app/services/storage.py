from typing import BinaryIO, Iterable
from uuid import UUID

import boto3

import logging

from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")


def _get_client():
    settings = get_settings()
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
    return client, settings


def upload_to_spaces(
    subject_id: UUID, filename: str, file_obj: BinaryIO, content_type: str | None
) -> str:
    client, settings = _get_client()
    object_key = f"{subject_id}/{filename}"
    extra_args = {}
    if content_type:
        extra_args["ContentType"] = content_type
    client.upload_fileobj(
        file_obj,
        settings.do_spaces_bucket,
        object_key,
        ExtraArgs=extra_args or None,
    )
    return object_key


def delete_from_spaces(object_key: str) -> None:
    client, settings = _get_client()
    logger.info("Spaces delete_object bucket=%s key=%s", settings.do_spaces_bucket, object_key)
    client.delete_object(Bucket=settings.do_spaces_bucket, Key=object_key)


def delete_many_from_spaces(object_keys: Iterable[str]) -> None:
    keys = [key for key in object_keys if key]
    if not keys:
        return
    client, settings = _get_client()
    # S3 delete_objects supports max 1000 keys per call
    for idx in range(0, len(keys), 1000):
        batch = [{"Key": key} for key in keys[idx : idx + 1000]]
        logger.info(
            "Spaces delete_objects bucket=%s count=%s",
            settings.do_spaces_bucket,
            len(batch),
        )
        client.delete_objects(Bucket=settings.do_spaces_bucket, Delete={"Objects": batch})
