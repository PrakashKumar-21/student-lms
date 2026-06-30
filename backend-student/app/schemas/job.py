from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class JobOut(BaseModel):
    id: UUID
    subject_id: UUID
    file_id: UUID
    status: str
    error: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class JobCreateOut(BaseModel):
    job_id: UUID
    file_id: UUID
    subject_id: UUID
