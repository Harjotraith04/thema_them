from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.code_assignment import CodeAssignment, CodeAssignmentInDB, CodeAssignmentOut
from app.services.code_assignment_service import CodeAssignmentService

router = APIRouter()


@router.post("/assign", response_model=Dict[str, Any])
def code_assignment(
    request: CodeAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Code assignment: find or create code and assign to text selection"""
    try:
        result = CodeAssignmentService.assign_code(
            db=db,
            request=request,
            user_id=current_user.id,  # type: ignore
            is_auto_generated=False
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/bulk", response_model=Dict[str, Any])
def bulk_code_assignment(
    requests: List[CodeAssignment],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Bulk code assignment"""
    try:
        result = CodeAssignmentService.bulk_code_assignment(
            db=db,
            requests=requests,
            user_id=current_user.id,  # type: ignore
            is_auto_generated=False
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/document/{document_id}", response_model=List[CodeAssignmentOut])
def get_document_code_assignments(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all code assignments for a document"""
    try:
        assignments = CodeAssignmentService.get_code_assignments_for_document(
            db=db,
            document_id=document_id,
            user_id=current_user.id  # type: ignore
        )
        return assignments
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{assignment_id}")
def delete_code_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a code assignment"""
    try:
        success = CodeAssignmentService.delete_code_assignment(
            db=db,
            assignment_id=assignment_id,
            user_id=current_user.id  # type: ignore
        )
        if not success:
            raise HTTPException(
                status_code=404, detail="Code assignment not found")
        return {"message": "Code assignment deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")
