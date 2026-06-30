import re
from uuid import UUID

from pydantic import BaseModel, validator

EMAIL_REGEX = re.compile(
    r"^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|\""
    r"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|"
    r"\\[\x01-\x09\x0b\x0c\x0e-\x7f])*\")@(?:(?:[a-zA-Z0-9]"
    r"(?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|\[(?:(?:25[0-5]|2[0-4]"
    r"[0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|"
    r"[a-zA-Z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a"
    r"\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)])$"
)


class OtpRequest(BaseModel):
    phone_or_email: str

    @validator("phone_or_email")
    def validate_identifier(cls, value: str) -> str:
        normalized = value.strip()
        if normalized.isdigit():
            if len(normalized) != 10:
                raise ValueError("Please enter a valid 10-digit phone number")
            return normalized
        if not EMAIL_REGEX.fullmatch(normalized):
            raise ValueError("Please enter a valid email address")
        return normalized


class OtpResponse(BaseModel):
    otp_token: str
    message: str


class OtpVerify(BaseModel):
    otp_token: str
    code: str

    @validator("code")
    def validate_code(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized.isdigit() or len(normalized) != 6:
            raise ValueError("Invalid OTP format")
        return normalized


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenWithUser(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    is_new_user: bool


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    role: str


class AdminProfile(BaseModel):
    user_id: UUID
    email: str
    role: str
