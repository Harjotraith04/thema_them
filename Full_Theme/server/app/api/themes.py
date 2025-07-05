from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.schemas.theme import ThemeOut, ThemeCreate, ThemeUpdate, ThemeWithCodes
from app.services.theme_service import ThemeService

router = APIRouter()


@router.post("/", response_model=ThemeOut, status_code=201)
def create_theme(
    theme: ThemeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new theme"""
    try:
        new_theme = ThemeService.create_theme(
            db=db,
            name=theme.name,
            project_id=theme.project_id,
            user_id=getattr(current_user, 'id'),
            description=theme.description
        )
        return new_theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create theme: {str(e)}")


@router.get("/project/{project_id}", response_model=List[ThemeOut])
def get_project_themes(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all themes for a project"""
    themes = ThemeService.get_project_themes(
        db=db,
        project_id=project_id,
        user_id=getattr(current_user, 'id')
    )
    return themes


@router.get("/{theme_id}", response_model=ThemeOut)
def get_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific theme"""
    theme = ThemeService.get_theme(
        db=db,
        theme_id=theme_id,
        user_id=getattr(current_user, 'id')
    )
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")
    return theme


@router.get("/{theme_id}/with-codes", response_model=ThemeWithCodes)
def get_theme_with_codes(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a theme with its associated codes"""
    theme = ThemeService.get_theme(
        db=db,
        theme_id=theme_id,
        user_id=getattr(current_user, 'id')
    )
    if not theme:
        raise HTTPException(status_code=404, detail="Theme not found")

    # Convert to ThemeWithCodes format
    theme_dict = {
        "id": theme.id,
        "name": theme.name,
        "description": theme.description,
        "project_id": theme.project_id,
        "user_id": theme.user_id,
        "created_at": theme.created_at,
        "codes": theme.codes,
        "codes_count": len(theme.codes)
    }
    return theme_dict


@router.put("/{theme_id}", response_model=ThemeOut)
def update_theme(
    theme_id: int,
    theme_update: ThemeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a theme"""
    try:
        # Convert Pydantic model to dict, excluding None values
        update_data = theme_update.model_dump(exclude_none=True)

        updated_theme = ThemeService.update_theme(
            db=db,
            theme_id=theme_id,
            user_id=getattr(current_user, 'id'),
            **update_data
        )
        return updated_theme
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to update theme: {str(e)}")


@router.delete("/{theme_id}")
def delete_theme(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a theme"""
    try:
        success = ThemeService.delete_theme(
            db=db,
            theme_id=theme_id,
            user_id=getattr(current_user, 'id')
        )
        if success:
            return {"message": "Theme deleted successfully"}
        else:
            raise HTTPException(
                status_code=400, detail="Failed to delete theme")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete theme: {str(e)}")


@router.get("/{theme_id}/codes", response_model=List[dict])
def get_theme_codes(
    theme_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all codes assigned to a theme"""
    try:
        codes = ThemeService.get_theme_codes(
            db=db,
            theme_id=theme_id,
            user_id=getattr(current_user, 'id')
        )
        return codes
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to get theme codes: {str(e)}")
