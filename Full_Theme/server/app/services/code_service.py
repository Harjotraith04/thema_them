from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.core.permissions import PermissionChecker
from app.core.validators import ValidationUtils
from app.models.code import Code
from app.models.user import User
from app.models.codebook import Codebook


class CodeService:
    """Service for code management and operations"""

    @staticmethod
    def create_code(
        db: Session,
        name: str,
        project_id: int,
        created_by_id: int,
        description: Optional[str] = None,
        color: Optional[str] = "#3B82F6",
        group_name: Optional[str] = None,
        theme_id: Optional[int] = None,
        is_auto_generated: bool = False,
        codebook_id: Optional[int] = None
    ) -> Code:
        """Create a new code with validation"""
        print(
            f"DEBUG: CodeService.create_code called for '{name}' in project {project_id}")

        # Get user object
        user = db.query(User).filter(User.id == created_by_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False
        )
        if not project:
            raise ValueError("Project not found or access denied")

        # Validate theme if provided
        if theme_id:
            from app.models.theme import Theme
            theme = db.query(Theme).filter(
                Theme.id == theme_id,
                Theme.project_id == project_id
            ).first()
            if not theme:
                raise ValueError("Theme not found in this project")

        # Validate unique code name
        ValidationUtils.validate_unique_code_name(
            db, name, project_id, None
        )  # Determine the appropriate Codebook
        if codebook_id:
            # Use explicitly provided codebook_id
            print(f"DEBUG: Using provided codebook_id: {codebook_id}")
            codebook = db.query(Codebook).filter(
                Codebook.id == codebook_id,
                Codebook.project_id == project_id
            ).first()
            if not codebook:
                raise ValueError(
                    "Specified codebook not found in this project")
        else:
            # Use default codebook for manual codes or when no specific codebook is provided
            print(f"DEBUG: Getting default codebook for project {project_id}")
            from app.services.codebook_service import CodebookService
            codebook = CodebookService.get_or_create_default_codebook(
                db=db,
                user_id=created_by_id,
                project_id=project_id
            )

        # Create code
        print(
            f"DEBUG: Creating Code object for '{name}' in codebook {codebook.id}")
        db_code = Code(
            name=name,
            description=description,
            color=color,
            group_name=group_name,
            theme_id=theme_id,
            project_id=project_id,
            created_by_id=created_by_id,
            is_auto_generated=is_auto_generated,
            codebook_id=codebook.id
        )

        db.add(db_code)
        db.commit()
        db.refresh(db_code)
        print(
            f"DEBUG: Code '{name}' created successfully with ID: {db_code.id}")

        return db_code

    @staticmethod
    def update_code(
        db: Session,
        code_id: int,
        user_id: int,
        **update_data
    ) -> Code:
        """Update a code with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        # Check if name change would create duplicate
        if 'name' in update_data and update_data['name'] != code.name:
            ValidationUtils.validate_unique_code_name(
                db, update_data['name'], code.project_id, None, exclude_id=code.id) # type: ignore

        # Update fields (excluding None values)
        for field, value in update_data.items():
            if value is not None and hasattr(code, field):
                setattr(code, field, value)

        code.updated_at = datetime.datetime.now(datetime.timezone.utc)  # type: ignore
        db.commit()
        db.refresh(code)

        return code

    @staticmethod
    def delete_code(
        db: Session,
        code_id: int,
        user_id: int
    ) -> bool:
        """Delete a code with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        db.delete(code)
        db.commit()

        return True

    @staticmethod
    def get_project_codes(
        db: Session,
        project_id: int,
        user_id: int
    ) -> List[Code]:
        """Get all codes for a project"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to project - raise exception for unauthorized access
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=True
        )

        # Build query
        query = db.query(Code).filter(Code.project_id == project_id)

        codes = query.order_by(Code.name).all()
        return codes

    @staticmethod
    def get_code(
        db: Session,
        code_id: int,
        user_id: int
    ) -> Optional[Code]:
        """Get a specific code"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        return code

    @staticmethod
    def get_code_quotes(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List:
        """Get all quotes assigned to a code"""
        from app.core.permissions import PermissionChecker
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        return code.quotes

    @staticmethod
    def get_code_segments(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List:
        """Get all segments assigned to a code"""
        from app.core.permissions import PermissionChecker
        from app.models.user import User

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if user has access to the code
        code = PermissionChecker.check_code_access(
            db, code_id, user, raise_exception=False
        )
        if not code:
            raise ValueError("Code not found or access denied")

        return code.segments

    @staticmethod
    def get_codebook_codes(
        db: Session,
        codebook_id: int,
        user_id: int
    ) -> List[Code]:
        """Get all codes for a specific codebook"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if codebook exists and user has access
        codebook = db.query(Codebook).filter(
            Codebook.id == codebook_id,
            Codebook.user_id == user_id
        ).first()

        if not codebook:
            raise ValueError("Codebook not found or access denied")

        # Get codes for the codebook
        codes = db.query(Code).filter(
            Code.codebook_id == codebook_id
        ).order_by(Code.created_at.desc()).all()

        return codes

    @staticmethod
    def assign_group_to_codes(
        db: Session,
        code_ids: List[int],
        group_name: Optional[str],
        user_id: int
    ) -> List[Code]:
        """Assign a common group_name to multiple codes"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Validate all codes exist and user has access
        codes = []
        for code_id in code_ids:
            code = PermissionChecker.check_code_access(
                db, code_id, user, raise_exception=False
            )
            if not code:
                raise ValueError(
                    f"Code with id {code_id} not found or access denied")
            codes.append(code)

        # Update all codes with the new group_name
        for code in codes:
            code.group_name = group_name
            code.updated_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()

        # Refresh all codes
        for code in codes:
            db.refresh(code)

        return codes

    @staticmethod
    def get_codes_by_group(
        db: Session,
        group_name: str,
        project_id: int,
        user_id: int
    ) -> List[Code]:
        """Get all codes in a specific group for a project"""

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

        # Query codes by group name and project
        codes = db.query(Code).filter(
            Code.project_id == project_id,
            Code.group_name == group_name
        ).order_by(Code.name).all()

        return codes

    @staticmethod
    def get_project_groups(
        db: Session,
        project_id: int,
        user_id: int
    ) -> List[str]:
        """Get all unique group names for a project"""

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

        # Query unique group names (excluding None/null values)
        groups = db.query(Code.group_name).filter(
            Code.project_id == project_id,
            Code.group_name.isnot(None),
            Code.group_name != ""
        ).distinct().all()

        # Extract group names from tuples and return as list
        return [group[0] for group in groups if group[0]]

    @staticmethod
    def assign_codes_to_theme(
        db: Session,
        code_ids: List[int],
        theme_id: Optional[int],
        user_id: int
    ) -> List[Code]:
        """Assign multiple codes to a theme"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Validate theme if provided
        if theme_id:
            from app.models.theme import Theme
            theme = db.query(Theme).filter(Theme.id == theme_id).first()
            if not theme:
                raise ValueError("Theme not found")

            # Check if user has access to the theme's project
            project = PermissionChecker.check_project_access(
                db, theme.project_id, user, raise_exception=False  # type: ignore
            )
            if not project:
                raise ValueError("Theme not found or access denied")

        # Validate all codes exist and user has access
        codes = []
        for code_id in code_ids:
            code = PermissionChecker.check_code_access(
                db, code_id, user, raise_exception=False
            )
            if not code:
                raise ValueError(
                    f"Code with id {code_id} not found or access denied")

            # If theme_id is provided, ensure code is in same project as theme
            if theme_id and code.project_id != theme.project_id:  # type: ignore
                raise ValueError(
                    f"Code {code_id} is not in the same project as the theme")

            codes.append(code)

        # Update all codes with the new theme_id
        for code in codes:
            code.theme_id = theme_id
            code.updated_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()

        # Refresh all codes
        for code in codes:
            db.refresh(code)

        return codes
