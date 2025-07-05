from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.code import CodeOut, CodeCreate, CodeUpdate, CodeGroupAssignment
from app.services.code_service import CodeService

router = APIRouter()


@router.post("/", response_model=CodeOut, status_code=201)  # Changed to 201
def create_code(
    code: CodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new code"""
    try:
        new_code = CodeService.create_code(
            db=db,
            name=code.name,
            project_id=code.project_id,
            created_by_id=getattr(current_user, 'id'),
            description=code.description,
            color=code.color,
            group_name=code.group_name,
            theme_id=code.theme_id,
            codebook_id=code.codebook_id
        )
        return new_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create code: {str(e)}")


@router.get("/project/{project_id}", response_model=List[CodeOut])
def get_project_codes(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes for a project"""
    try:
        codes = CodeService.get_project_codes(
            db=db,
            project_id=project_id,
            user_id=getattr(current_user, 'id')
        )
        return codes
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        # Convert HTTPException (from permission checker) to appropriate status
        if e.status_code == 403:
            raise HTTPException(status_code=404, detail="Project not found")
        raise e


@router.put("/{code_id}", response_model=CodeOut)
def update_code(
    code_id: int,
    code_update: CodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a code"""
    try:
        updated_code = CodeService.update_code(
            db=db,
            code_id=code_id,
            user_id=getattr(current_user, 'id'),
            **code_update.model_dump(exclude_unset=True)
        )
        return updated_code
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update code: {str(e)}")


@router.delete("/{code_id}")
def delete_code(
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a code"""
    try:
        CodeService.delete_code(
            db=db,
            code_id=code_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Code deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete code: {str(e)}")


@router.get("/{code_id}/assignments", response_model=List[dict])
def get_code_assignments(
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all code assignments for a code"""
    try:
        from app.models.code import Code
        from app.models.code_assignments import CodeAssignment

        # Check access to this code
        code = db.query(Code).filter(Code.id == code_id).first()
        if not code:
            raise ValueError("Code not found")

        from app.core.permissions import PermissionChecker
        PermissionChecker.check_project_access(
            db, code.project_id, current_user)  # type: ignore

        # Get assignments for this code
        assignments = db.query(CodeAssignment).filter(
            CodeAssignment.code_id == code_id
        ).all()

        results = []
        for assignment in assignments:
            snapshot = str(assignment.text_snapshot or "")
            if snapshot and len(snapshot) > 100:
                snapshot = snapshot[:100] + "..."

            results.append({
                "id": assignment.id,
                "text_snapshot": snapshot,
                "document_id": assignment.document_id,
                "start_char": assignment.start_char,
                "end_char": assignment.end_char,
                "created_at": assignment.created_at
            })

        return results
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/codebook/{codebook_id}", response_model=List[CodeOut])
def get_codebook_codes(
    codebook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes for a specific codebook"""
    try:
        codes = CodeService.get_codebook_codes(
            db=db,
            codebook_id=codebook_id,
            user_id=getattr(current_user, 'id')
        )
        return codes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get codebook codes: {str(e)}")


@router.put("/assign-group", response_model=List[CodeOut])
def assign_group_to_codes(
    group_assignment: CodeGroupAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign a common group_name to multiple codes"""
    try:
        updated_codes = CodeService.assign_group_to_codes(
            db=db,
            code_ids=group_assignment.code_ids,
            group_name=group_assignment.group_name,
            user_id=getattr(current_user, 'id')
        )
        return updated_codes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to assign group to codes: {str(e)}")


@router.get("/by-group/{group_name}", response_model=List[CodeOut])
def get_codes_by_group(
    group_name: str,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes in a specific group for a project"""
    try:
        codes = CodeService.get_codes_by_group(
            db=db,
            group_name=group_name,
            project_id=project_id,
            user_id=getattr(current_user, 'id')
        )
        return codes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get codes by group: {str(e)}")


@router.get("/groups/project/{project_id}", response_model=List[str])
def get_project_groups(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all unique group names for a project"""
    try:
        groups = CodeService.get_project_groups(
            db=db,
            project_id=project_id,
            user_id=getattr(current_user, 'id')
        )
        return groups
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get project groups: {str(e)}")


@router.put("/assign-to-theme", response_model=List[CodeOut])
def assign_codes_to_theme(
    assignment: dict,  # {"code_ids": [1,2,3], "theme_id": 5}
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign multiple codes to a theme"""
    try:
        code_ids = assignment.get("code_ids", [])
        theme_id = assignment.get("theme_id")

        updated_codes = CodeService.assign_codes_to_theme(
            db=db,
            code_ids=code_ids,
            theme_id=theme_id,
            user_id=getattr(current_user, 'id')
        )
        return updated_codes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to assign codes to theme: {str(e)}")
