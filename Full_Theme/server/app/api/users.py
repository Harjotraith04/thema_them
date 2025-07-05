from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.user import UserOut, UserUpdate
from app.core.auth import get_current_user
from app.db.session import get_db
from app.services.user_service import update_user

router = APIRouter()


@router.get("/profile", response_model=UserOut)
def get_user_profile(current_user: UserOut = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserOut)
def update_user_profile(
    user_update: UserUpdate,
    current_user: UserOut = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    updated_user = update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user
