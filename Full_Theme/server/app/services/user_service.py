from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password, verify_password


def create_user(db: Session, user: UserCreate):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise ValueError("Email already registered")

    db_user = User(email=user.email,
                   name=user.name,
                   hashed_password=hash_password(user.password)) # type: ignore
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return False
    if not user.hashed_password:  # type: ignore
        return False
    if not verify_password(password, user.hashed_password):  # type: ignore
        return False
    return user


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def get_or_create_oauth_user(db: Session, user_info, provider="google"):
    email = user_info["email"]

    # Extract name and oauth_id based on provider
    name = None
    oauth_id = None

    if provider == "google":
        name = user_info.get("name")
        oauth_id = str(user_info.get("id"))
    elif provider == "github":
        name = user_info.get("name")
        if not name:
            name = user_info.get("login")
            if not name:
                name = email.split("@")[0]

        oauth_id = user_info.get("login") or str(user_info.get("id"))

    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.oauth_provider:  # type: ignore
            user.oauth_provider = provider  # type: ignore
            user.oauth_id = oauth_id # type: ignore
            if name and not user.name:  # type: ignore
                user.name = name  # type: ignore
            db.commit()
        return user

    new_user = User(
        email=email,
        name=name,
        oauth_provider=provider,
        oauth_id=oauth_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def update_user(db: Session, user_id: int, user_update: UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)

    if "password" in update_data:
        update_data["hashed_password"] = hash_password(
            update_data.pop("password"))

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user
