from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ClassLevelCreate(BaseModel):
    name: str
    board_id: UUID


class ClassLevelStatusUpdate(BaseModel):
    status: str


class ClassLevelOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    board_id: UUID
    status: str
