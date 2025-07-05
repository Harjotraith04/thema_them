from app.schemas.code import CodeOut
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class CodebookBase(BaseModel):
    name: str
    description: Optional[str] = None


class CodebookCreate(CodebookBase):
    project_id: int
    is_ai_generated: Optional[bool] = False


class CodebookUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class MergeCodesToDefaultRequest(BaseModel):
    code_ids: List[int]
    project_id: int


class CodebookOut(CodebookBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    user_id: int
    is_ai_generated: bool
    finalized: Optional[bool] = False
    created_at: datetime


class CodebookWithCodes(CodebookOut):
    """Codebook with its associated codes"""
    codes: List["CodeOut"] = []
    codes_count: Optional[int] = None


class CodeAssignmentWithCodebookContext(BaseModel):
    """Code assignment with additional context for codebook views"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    code_id: int
    created_by_id: int
    start_char: Optional[int] = None
    end_char: Optional[int] = None
    text_snapshot: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    document_name: Optional[str] = None
    code_name: Optional[str] = None
    code_color: Optional[str] = None
    created_by_email: Optional[str] = None


class CodeWithAssignments(CodeOut):
    """Code with assignment count"""
    assignments_count: int


class FinalizedCodebook(BaseModel):
    """Finalized codebook with all codes and assignments"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: Optional[str] = None
    user_id: int
    user_email: Optional[str] = None
    is_ai_generated: bool
    finalized: bool
    created_at: datetime
    codes: List[CodeWithAssignments] = []
    code_assignments: List[CodeAssignmentWithCodebookContext] = []


# Import here to avoid circular imports
CodebookWithCodes.model_rebuild()
