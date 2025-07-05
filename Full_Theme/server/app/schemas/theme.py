from typing import TYPE_CHECKING
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class ThemeBase(BaseModel):
    name: str
    description: Optional[str] = None


class ThemeCreate(ThemeBase):
    project_id: int


class ThemeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ThemeOut(ThemeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    user_id: int
    created_at: datetime


class ThemeWithCodes(ThemeOut):
    """Theme with its associated codes"""
    codes: List["CodeOut"] = []
    codes_count: int = 0


class ThemeFilter(BaseModel):
    project_id: Optional[int] = None
    user_id: Optional[int] = None
    search_text: Optional[str] = None


# Forward reference for CodeOut
if TYPE_CHECKING:
    from app.schemas.code import CodeOut
