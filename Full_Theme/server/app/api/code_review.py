from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.code_review_service import CodeReviewService

router = APIRouter()


class CodeAssignmentStatusUpdate(BaseModel):
    assignment_ids: List[int]
    status: str  # 'pending', 'accepted', or 'rejected'


class BulkCodeAssignmentReview(BaseModel):
    accepted_assignment_ids: List[int] = []
    rejected_assignment_ids: List[int] = []


@router.get("/codebooks/{codebook_id}/assignments")
def get_ai_codebook_assignments(
    codebook_id: int,
    status: Optional[str] = Query(
        None, description="Filter by status: pending, accepted, rejected"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeReviewService.get_ai_codebook_assignments(
            db=db,
            codebook_id=codebook_id,
            user_id=getattr(current_user, 'id'),
            status_filter=status
        )
        return result
    except ValueError as e:
        if "not found" in str(e).lower() or "access denied" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get assignments: {str(e)}")


@router.post("/assignments/update-status")
def update_assignment_status(
    request: CodeAssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeReviewService.review_assignments_and_auto_manage_codes(
            db=db,
            assignment_ids=request.assignment_ids,
            status=request.status,
            user_id=getattr(current_user, 'id')
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update status: {str(e)}")


@router.post("/assignments/bulk-update")
async def bulk_update_assignment_status(
    request: "BulkCodeAssignmentReview",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeReviewService.bulk_review_assignments(
            db=db,
            accepted_assignment_ids=request.accepted_assignment_ids,
            rejected_assignment_ids=request.rejected_assignment_ids,
            user_id=getattr(current_user, 'id')
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to bulk update assignments: {str(e)}")


@router.get("/projects/{project_id}/ai-codebooks")
def get_project_ai_codebooks(
    project_id: int,
    unfinalized_only: bool = Query(
        False, description="Only show unfinalized codebooks needing review"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        from app.services.codebook_service import CodebookService

        codebooks = CodebookService.get_project_codebooks(
            db=db,
            project_id=project_id,
            user_id=getattr(current_user, 'id')
        )
        ai_codebooks = [cb for cb in codebooks if cb.is_ai_generated] # type: ignore

        if unfinalized_only:
            ai_codebooks = [cb for cb in ai_codebooks if not cb.finalized] # type: ignore

        result = []
        for codebook in ai_codebooks:
            assignment_summary = CodeReviewService.get_ai_codebook_assignments(
                db=db,
                codebook_id=codebook.id,  # type: ignore
                user_id=getattr(current_user, 'id')
            )

            result.append({
                "id": codebook.id,  # type: ignore
                "name": codebook.name,  # type: ignore
                "description": codebook.description,  # type: ignore
                "is_ai_generated": codebook.is_ai_generated,  # type: ignore
                "finalized": codebook.finalized,  # type: ignore
                "created_at": codebook.created_at,  # type: ignore
                "assignment_summary": assignment_summary["summary"]
            })

        return {
            "ai_codebooks": result,
            "total_count": len(result)
        }

    except ValueError as e:
        if "not found" in str(e).lower() or "access denied" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get AI codebooks: {str(e)}")


@router.post("/assignments/review-and-finalize")
def review_and_auto_finalize(
    request: CodeAssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = CodeReviewService.review_assignments_and_auto_manage_codes(
            db=db,
            assignment_ids=request.assignment_ids,
            status=request.status,
            user_id=getattr(current_user, 'id')
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to review and finalize: {str(e)}")
