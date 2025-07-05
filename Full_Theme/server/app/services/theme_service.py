from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.core.permissions import PermissionChecker
from app.core.validators import ValidationUtils
from app.models.theme import Theme
from app.models.user import User


class ThemeService:
    """Service for theme management and operations"""

    @staticmethod
    def create_theme(
        db: Session,
        name: str,
        project_id: int,
        user_id: int,
        description: Optional[str] = None
    ) -> Theme:
        """Create a new theme with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            raise ValueError("Project not found or access denied")

        # Check for duplicate theme name in project
        existing_theme = db.query(Theme).filter(
            Theme.name == name,
            Theme.project_id == project_id
        ).first()
        if existing_theme:
            raise ValueError(
                f"Theme with name '{name}' already exists in this project")

        # Create theme
        db_theme = Theme(
            name=name,
            description=description,
            project_id=project_id,
            user_id=user_id
        )

        db.add(db_theme)
        db.commit()
        db.refresh(db_theme)

        return db_theme

    @staticmethod
    def update_theme(
        db: Session,
        theme_id: int,
        user_id: int,
        **update_data
    ) -> Theme:
        """Update a theme with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get theme and check access
        theme = db.query(Theme).filter(Theme.id == theme_id).first()
        if not theme:
            raise ValueError("Theme not found")

        # Check if user has access to the project
        project = PermissionChecker.check_project_access(
            db, theme.project_id, user, raise_exception=False  # type: ignore
        )
        if not project:
            raise ValueError("Project not found or access denied")

        # Check for duplicate name if name is being updated
        if 'name' in update_data and update_data['name'] != theme.name:
            existing_theme = db.query(Theme).filter(
                Theme.name == update_data['name'],
                Theme.project_id == theme.project_id,
                Theme.id != theme_id
            ).first()
            if existing_theme:
                raise ValueError(
                    f"Theme with name '{update_data['name']}' already exists in this project")

        # Update fields
        for field, value in update_data.items():
            if value is not None and hasattr(theme, field):
                setattr(theme, field, value)

        db.commit()
        db.refresh(theme)

        return theme

    @staticmethod
    def delete_theme(
        db: Session,
        theme_id: int,
        user_id: int
    ) -> bool:
        """Delete a theme with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get theme and check access
        theme = db.query(Theme).filter(Theme.id == theme_id).first()
        if not theme:
            raise ValueError("Theme not found")

        # Check if user has access to the project
        project = PermissionChecker.check_project_access(
            db, theme.project_id, user, raise_exception=False  # type: ignore
        )
        if not project:
            raise ValueError("Project not found or access denied")

        # Check if theme has associated codes
        if theme.codes:
            raise ValueError(
                f"Cannot delete theme '{theme.name}' because it has {len(theme.codes)} associated codes. Please reassign or remove the codes first.")

        db.delete(theme)
        db.commit()

        return True

    @staticmethod
    def get_project_themes(
        db: Session,
        project_id: int,
        user_id: int
    ) -> List[Theme]:
        """Get all themes for a project"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return []

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            return []

        # Get themes for the project
        themes = db.query(Theme).filter(
            Theme.project_id == project_id
        ).order_by(Theme.name).all()

        return themes

    @staticmethod
    def get_theme(
        db: Session,
        theme_id: int,
        user_id: int
    ) -> Optional[Theme]:
        """Get a specific theme"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Get theme
        theme = db.query(Theme).filter(Theme.id == theme_id).first()
        if not theme:
            return None

        # Check if user has access to the project
        project = PermissionChecker.check_project_access(
            db, theme.project_id, user, raise_exception=False  # type: ignore
        )
        if not project:
            return None

        return theme

    @staticmethod
    def get_theme_codes(
        db: Session,
        theme_id: int,
        user_id: int
    ) -> List:
        """Get all codes assigned to a theme"""

        theme = ThemeService.get_theme(db, theme_id, user_id)
        if not theme:
            raise ValueError("Theme not found or access denied")

        return theme.codes
