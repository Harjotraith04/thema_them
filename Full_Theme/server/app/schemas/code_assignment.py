from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.schemas.code import CodeOut


class CodeAssignmentBase(BaseModel):
    document_id: int
    start_char: int
    end_char: int
    text_snapshot: Optional[str] = None
    note: Optional[str] = None
    confidence: Optional[int] = None
    status: Optional[str] = "pending"  # pending, accepted, rejected


class CodeAssignmentCreate(CodeAssignmentBase):
    code_id: int


class CodeAssignmentOut(CodeAssignmentBase):
    """Response model for code assignments"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    code_id: int
    created_by_id: int
    created_at: datetime
    updated_at: datetime
    code: Optional[CodeOut] = None


# For backward compatibility, alias the old name
CodeAssignmentInDB = CodeAssignmentOut


class CodeAssignment(BaseModel):
    """Request model for code assignment with auto code creation"""
    document_id: int
    text: str  # Used as text_snapshot in the database model
    start_char: int
    end_char: int
    code_name: str
    code_description: Optional[str] = None
    code_color: Optional[str] = "#3B82F6"
    confidence: Optional[int] = None
