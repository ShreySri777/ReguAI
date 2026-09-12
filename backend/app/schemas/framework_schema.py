# ==========================================================
# REGUAI - FRAMEWORK SCHEMAS
# ==========================================================

from pydantic import BaseModel


class FrameworkCreate(BaseModel):
    name: str
    description: str | None = None
    status: str = "active"


class FrameworkResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    status: str