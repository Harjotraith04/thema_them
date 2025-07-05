from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.codebook import CodebookOut, CodebookCreate, CodebookUpdate, CodebookWithCodes, MergeCodesToDefaultRequest
from app.services.codebook_service import CodebookService

router = APIRouter()


@router.post("/", response_model=CodebookOut, status_code=201)
def create_codebook(
    codebook: CodebookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_codebook = CodebookService.create_codebook(
            db=db,
            name=codebook.name,
            project_id=codebook.project_id,
            user_id=getattr(current_user, 'id'),
            description=codebook.description,
            is_ai_generated=codebook.is_ai_generated  # type: ignore
        )
        return new_codebook
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create codebook: {str(e)}")


@router.get("/project/{project_id}", response_model=List[CodebookOut])
def get_project_codebooks(
    project_id: int,
    include_collaborator_finalized: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codebooks for a project. If include_collaborator_finalized=True and user is owner, includes finalized codebooks from collaborators"""
    try:
        codebooks = CodebookService.get_project_codebooks(
            db=db,
            project_id=project_id,
            user_id=getattr(current_user, 'id'),
            include_collaborator_finalized=include_collaborator_finalized
        )
        return codebooks
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        # Convert HTTPException (from permission checker) to appropriate status
        if e.status_code == 403:
            raise HTTPException(status_code=404, detail="Project not found")
        raise e


@router.get("/{codebook_id}", response_model=CodebookWithCodes)
def get_codebook(
    codebook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        codebook = CodebookService.get_codebook_with_codes(
            db=db,
            codebook_id=codebook_id,
            user_id=getattr(current_user, 'id')
        )
        return codebook
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get codebook: {str(e)}")


@router.put("/{codebook_id}", response_model=CodebookOut)
def update_codebook(
    codebook_id: int,
    codebook_update: CodebookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        updated_codebook = CodebookService.update_codebook(
            db=db,
            codebook_id=codebook_id,
            user_id=getattr(current_user, 'id'),
            **codebook_update.model_dump(exclude_unset=True)
        )
        return updated_codebook
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update codebook: {str(e)}")


@router.delete("/{codebook_id}")
def delete_codebook(
    codebook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        CodebookService.delete_codebook(
            db=db,
            codebook_id=codebook_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Codebook deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete codebook: {str(e)}")


@router.get("/user/{user_id}/default", response_model=CodebookOut)
def get_user_default_codebook(
    user_id: int,
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's default codebook for a project"""
    try:
        if getattr(current_user, 'id') != user_id:
            raise HTTPException(status_code=403, detail="Access denied")

        codebook = CodebookService.get_or_create_default_codebook(
            db=db,
            user_id=user_id,
            project_id=project_id
        )
        return codebook
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get default codebook: {str(e)}")


@router.patch("/{codebook_id}/finalize", response_model=CodebookOut)
def finalize_codebook(
    codebook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        finalized_codebook = CodebookService.finalize_codebook(
            db=db,
            codebook_id=codebook_id,
            user_id=getattr(current_user, 'id')
        )
        return finalized_codebook
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to finalize codebook: {str(e)}")


@router.post("/merge-codes-to-default", response_model=dict)
def merge_codes_to_default(
    request: MergeCodesToDefaultRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Merge selected codes from a codebook into the user's default codebook"""
    try:
        result = CodebookService.merge_codes_to_default(
            db=db,
            code_ids=request.code_ids,
            project_id=request.project_id,
            user_id=getattr(current_user, 'id')
        )
        return {
            "message": f"Successfully merged {len(request.code_ids)} codes to default codebook",
            "moved_codes": len(request.code_ids),
            "default_codebook_id": result.get("default_codebook_id")
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to merge codes: {str(e)}")


@router.get("/project/{project_id}/finalized", response_model=List[CodebookWithCodes])
def get_project_finalized_codebooks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        codebooks = CodebookService.get_project_finalized_codebooks(
            db=db,
            project_id=project_id,
            user_id=getattr(current_user, 'id')
        )

        # Convert to response format with codes
        result = []
        for codebook in codebooks:
            result.append({
                "id": codebook.id,
                "name": codebook.name,
                "description": codebook.description,
                "project_id": codebook.project_id,
                "user_id": codebook.user_id,
                "is_ai_generated": codebook.is_ai_generated,
                "finalized": codebook.finalized,
                "created_at": codebook.created_at,
                "codes": [
                    {
                        "id": code.id,
                        "name": code.name,
                        "description": code.description,
                        "color": code.color,
                        "project_id": code.project_id,
                        "codebook_id": code.codebook_id,
                        "created_by_id": code.created_by_id,
                        "created_at": code.created_at,
                        "updated_at": code.updated_at
                    } for code in codebook.codes
                ],
                "codes_count": len(codebook.codes)
            })

        return result
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException as e:
        if e.status_code == 403:
            raise HTTPException(status_code=404, detail="Project not found")
        raise e
