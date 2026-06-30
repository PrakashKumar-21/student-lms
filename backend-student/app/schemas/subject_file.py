from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SubjectFileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    subject_id: UUID
    original_name: str
    stored_name: str
    content_type: str | None = None
    size_bytes: int
    storage_path: str


class SubjectFileUploadOut(BaseModel):
    job_id: UUID
    file: SubjectFileOut
