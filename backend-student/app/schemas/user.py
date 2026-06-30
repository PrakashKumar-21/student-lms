from uuid import UUID

from pydantic import BaseModel


class UserOut(BaseModel):
    id: UUID
    phone_or_email: str
    full_name: str | None = None
