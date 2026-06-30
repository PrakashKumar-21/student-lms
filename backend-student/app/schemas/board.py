from uuid import UUID

from pydantic import BaseModel, ConfigDict


class BoardCreate(BaseModel):
    name: str


class BoardStatusUpdate(BaseModel):
    status: str


class BoardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    status: str
