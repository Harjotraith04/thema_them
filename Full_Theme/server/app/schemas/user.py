from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    password: Optional[str] = None
    oauth_provider: Optional[str] = None
    oauth_id: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    is_active: bool
    oauth_provider: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfile(UserOut):
    owned_projects_count: Optional[int] = None
    collaborated_projects_count: Optional[int] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
