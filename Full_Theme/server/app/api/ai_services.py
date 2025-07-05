from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from app.db.session import get_db
from app.core.auth import get_current_user
from app.services.ai.ai_coding_service import AICodingService
from app.schemas.ai_services import InitialCodingRequest, ThemeGenerationRequest, DeductiveCodingRequest

router = APIRouter()


@router.post("/initial-coding", response_model=Dict[str, Any])
def ai_initial_coding(
    request: InitialCodingRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    try:
        return AICodingService.generate_code(
            document_ids=request.document_ids,
            db=db,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/deductive-coding", response_model=Dict[str, Any])
def ai_deductive_coding(
    request: DeductiveCodingRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Perform deductive coding using existing codes from a codebook"""
    try:
        return AICodingService.deductive_coding(
            document_ids=request.document_ids,
            codebook_id=request.codebook_id,
            db=db,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/generate-themes", response_model=List[Dict[str, Any]])
def ai_generate_themes(
    request: ThemeGenerationRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Generate themes from codes in a codebook using AI"""
    try:
        return AICodingService.generate_themes(
            codebook_id=request.codebook_id,
            db=db,
            user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")
