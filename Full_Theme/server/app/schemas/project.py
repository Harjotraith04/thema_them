from pydantic import BaseModel, ConfigDict
from typing import List, Optional, TYPE_CHECKING, Dict, Any, Union
from datetime import datetime
from app.schemas.user import UserOut
from app.schemas.document import DocumentOut
from app.schemas.code import CodeOut
from app.schemas.codebook import CodebookOut, FinalizedCodebook
from app.schemas.code_assignment import CodeAssignmentOut
from app.schemas.annotation import AnnotationOut, AnnotationWithDetails

if TYPE_CHECKING:
    from app.schemas.code import CodeWithQuotesAndSegments
    from app.schemas.annotation import AnnotationWithAllDetails


class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    research_details: Optional[Dict[str, Union[str, List[str]]]] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    research_details: Optional[Dict[str, Union[str, List[str]]]] = None


class ResearchDetailsUpdate(BaseModel):
    research_details: Dict[str, Union[str, List[str]]]


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int

    documents: Optional[List[DocumentOut]] = None
    codes: Optional[List[CodeOut]] = None
    codebooks: Optional[List[CodebookOut]] = None
    # quotes: Optional[List[QuoteOut]] = None
    annotations: Optional[List[AnnotationOut]] = None

    created_at: datetime
    updated_at: datetime


class ProjectWithDetails(ProjectOut):
    owner: UserOut
    collaborators: List[UserOut] = []


class ProjectSummary(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    owner_id: int
    document_count: int
    collaborator_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Extension schemas for additional fields needed in project context
class CodeAssignmentWithContext(CodeAssignmentOut):
    """Code assignment with additional context for project views"""
    document_name: Optional[str] = None
    code_name: Optional[str] = None
    code_color: Optional[str] = None


class ProjectComprehensive(ProjectBase):
    """Comprehensive project schema that loads all related data at once"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    # Owner and collaborator information
    owner: UserOut
    collaborators: List[UserOut] = []

    documents: List[DocumentOut] = []
    codes: List[CodeOut] = []
    code_assignments: List[CodeAssignmentWithContext] = []
    annotations: List[AnnotationWithDetails] = []
    codebooks: List[CodebookOut] = []
    finalized_codebooks: List[FinalizedCodebook] = []
