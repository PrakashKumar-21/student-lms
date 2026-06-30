from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SubjectCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    board_id: UUID
    class_id: UUID
    status: str = "Draft"


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    name: str
    status: str
    board_id: UUID
    class_level_id: UUID
    file_count: int = 0
    total_size_bytes: int = 0


class SubjectStatusUpdate(BaseModel):
    status: str


class SubjectNameUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
