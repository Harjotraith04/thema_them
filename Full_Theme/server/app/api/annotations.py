from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.annotation import AnnotationOut, AnnotationCreate, AnnotationUpdate, AnnotationWithDetails, AnnotationFilter
from app.services.annotation_service import AnnotationService

router = APIRouter()


@router.post("/", response_model=AnnotationOut, status_code=201)
def create_annotation(
    annotation: AnnotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new annotation with direct document content reference"""
    try:
        db_annotation = AnnotationService.create_annotation(
            db=db,
            content=annotation.content,
            annotation_type=annotation.annotation_type,
            user_id=getattr(current_user, 'id'),
            document_id=annotation.document_id,
            code_id=annotation.code_id,
            project_id=annotation.project_id,
            start_char=annotation.start_char,
            end_char=annotation.end_char,
            text_snapshot=annotation.text_snapshot
        )
        return db_annotation
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/project/{project_id}", response_model=List[AnnotationWithDetails])
def get_project_annotations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a project"""
    annotations = AnnotationService.get_project_annotations(
        db=db,
        project_id=project_id,
        user_id=getattr(current_user, 'id')
    )
    return annotations


@router.get("/{annotation_id}", response_model=AnnotationWithDetails)
def get_annotation(
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a single annotation by ID"""
    # Use filter_annotations with specific ID to get a single annotation
    try:
        annotations = AnnotationService.filter_annotations(
            db=db,
            user_id=getattr(current_user, 'id'),
            annotation_id=annotation_id  # We're missing this parameter in the service
        )
        if not annotations:
            raise HTTPException(status_code=404, detail="Annotation not found")
        return annotations[0]
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/", response_model=List[AnnotationWithDetails])
def filter_annotations(
    project_id: Optional[int] = None,
    document_id: Optional[int] = None,
    code_id: Optional[int] = None,
    created_by_id: Optional[int] = None,
    annotation_type: Optional[str] = None,
    search_text: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Filter annotations based on various criteria"""
    try:
        annotations = AnnotationService.filter_annotations(
            db=db,
            user_id=getattr(current_user, 'id'),
            project_id=project_id,
            document_id=document_id,
            code_id=code_id,
            created_by_id=created_by_id,
            annotation_type=annotation_type,
            search_text=search_text
        )
        return annotations
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.put("/{annotation_id}", response_model=AnnotationOut)
def update_annotation(
    annotation_id: int,
    annotation_update: AnnotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an annotation"""
    try:
        updated_annotation = AnnotationService.update_annotation(
            db=db,
            annotation_id=annotation_id,
            user_id=getattr(current_user, 'id'),
            **annotation_update.model_dump(exclude_unset=True)
        )
        return updated_annotation
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{annotation_id}")
def delete_annotation(
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an annotation"""
    try:
        AnnotationService.delete_annotation(
            db=db,
            annotation_id=annotation_id,
            user_id=getattr(current_user, 'id')
        )
        return {"message": "Annotation deleted successfully"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/document/{document_id}", response_model=List[AnnotationWithDetails])
def get_document_annotations(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a specific document"""
    try:
        annotations = AnnotationService.filter_annotations(
            db=db,
            user_id=getattr(current_user, 'id'),
            document_id=document_id
        )
        return annotations
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))


@router.get("/code/{code_id}", response_model=List[AnnotationWithDetails])
def get_code_annotations(
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all annotations for a specific code"""
    try:
        annotations = AnnotationService.filter_annotations(
            db=db,
            user_id=getattr(current_user, 'id'),
            code_id=code_id
        )
        return annotations
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        else:
            raise HTTPException(status_code=403, detail=str(e))
