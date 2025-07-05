from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
import datetime

from app.core.permissions import PermissionChecker
from app.models.codebook import Codebook
from app.models.code import Code
from app.models.user import User


class CodebookService:
    """Service for codebook management and operations"""

    @staticmethod
    def create_codebook(
        db: Session,
        name: str,
        project_id: int,
        user_id: int,
        description: Optional[str] = None,
        is_ai_generated: bool = False
    ) -> Codebook:
        """Create a new codebook with validation"""

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

        # Check for duplicate names within the same project and user
        existing_codebook = db.query(Codebook).filter(
            Codebook.name == name,
            Codebook.project_id == project_id,
            Codebook.user_id == user_id
        ).first()

        if existing_codebook:
            raise ValueError(
                f"Codebook with name '{name}' already exists for this user in this project")

        # Create codebook
        db_codebook = Codebook(
            name=name,
            description=description,
            project_id=project_id,
            user_id=user_id,
            is_ai_generated=is_ai_generated
        )

        db.add(db_codebook)
        db.commit()
        db.refresh(db_codebook)

        return db_codebook

    @staticmethod
    def get_project_codebooks(
        db: Session,
        project_id: int,
        user_id: int,
        include_collaborator_finalized: bool = False
    ) -> List[Codebook]:
        """Get all codebooks for a project that the user has access to"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to project - raise exception for unauthorized access
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=True
        )

        # Get user's own codebooks
        user_codebooks = db.query(Codebook).filter(
            Codebook.project_id == project_id,
            Codebook.user_id == user_id
        ).order_by(Codebook.created_at.desc()).all()

        # If user is project owner and wants to include collaborator finalized codebooks
        if include_collaborator_finalized and project and project.owner_id == user_id:  # type: ignore
            # Get finalized codebooks from collaborators
            collaborator_finalized = db.query(Codebook).filter(
                Codebook.project_id == project_id,
                Codebook.user_id != user_id,
                Codebook.finalized == True
            ).order_by(Codebook.created_at.desc()).all()

            # Combine user's codebooks with collaborator finalized ones
            return user_codebooks + collaborator_finalized

        return user_codebooks

    @staticmethod
    def get_codebook_with_codes(
        db: Session,
        codebook_id: int,
        user_id: int
    ) -> Optional[Codebook]:
        """Get a specific codebook with its codes"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get codebook with codes
        codebook = PermissionChecker.check_codebook_access(
            db=db,
            codebook_id=codebook_id,
            user=user,
            raise_exception=True,
            allow_finalized_access=True
        )

        if codebook:
            # Load codes for the codebook
            db.refresh(codebook)
            codebook = db.query(Codebook).options(
                selectinload(Codebook.codes)
            ).filter(Codebook.id == codebook_id).first()

        return codebook

    @staticmethod
    def update_codebook(
        db: Session,
        codebook_id: int,
        user_id: int,
        **update_data
    ) -> Codebook:
        """Update a codebook with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get codebook
        codebook = db.query(Codebook).filter(
            Codebook.id == codebook_id,
            Codebook.user_id == user_id
        ).first()

        if not codebook:
            raise ValueError("Codebook not found or access denied")

        # Check for name conflicts if name is being updated
        if 'name' in update_data and update_data['name'] != codebook.name:
            existing_codebook = db.query(Codebook).filter(
                Codebook.name == update_data['name'],
                Codebook.project_id == codebook.project_id,
                Codebook.user_id == user_id,
                Codebook.id != codebook_id
            ).first()

            if existing_codebook:
                raise ValueError(
                    f"Codebook with name '{update_data['name']}' already exists")

        # Update fields
        for field, value in update_data.items():
            if value is not None and hasattr(codebook, field):
                setattr(codebook, field, value)

        db.commit()
        db.refresh(codebook)

        return codebook

    @staticmethod
    def delete_codebook(
        db: Session,
        codebook_id: int,
        user_id: int
    ) -> bool:
        """Delete a codebook with validation"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get codebook
        codebook = db.query(Codebook).filter(
            Codebook.id == codebook_id,
            Codebook.user_id == user_id
        ).first()

        if not codebook:
            raise ValueError("Codebook not found or access denied")

        # Check if codebook has codes
        codes_count = db.query(Code).filter(
            Code.codebook_id == codebook_id).count()
        if codes_count > 0:
            raise ValueError(
                "Cannot delete codebook that contains codes. Please move or delete the codes first.")

        db.delete(codebook)
        db.commit()

        return True

    @staticmethod
    def get_or_create_default_codebook(
        db: Session,
        user_id: int,
        project_id: int
    ) -> Codebook:
        """Get or create the default codebook for a user in a project"""

        # Try to get existing default codebook
        default_codebook = db.query(Codebook).filter(
            Codebook.user_id == user_id,
            Codebook.project_id == project_id,
            Codebook.is_ai_generated == False
        ).first()

        if not default_codebook:
            # Create default codebook
            default_codebook = Codebook(
                name="Default Codebook",
                user_id=user_id,
                project_id=project_id,
                is_ai_generated=False,
                description="Default codebook for user-created codes."
            )
            db.add(default_codebook)
            db.commit()
            db.refresh(default_codebook)

        return default_codebook

    @staticmethod
    def finalize_codebook(
        db: Session,
        codebook_id: int,
        user_id: int
    ) -> Codebook:
        """Mark a codebook as finalized"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get codebook
        codebook = db.query(Codebook).filter(
            Codebook.id == codebook_id,
            Codebook.user_id == user_id
        ).first()

        if not codebook:
            raise ValueError("Codebook not found or access denied")

        # Check if already finalized
        if codebook.finalized is True:  # type: ignore
            raise ValueError("Codebook is already finalized")

        # Mark as finalized
        setattr(codebook, 'finalized', True)
        db.commit()
        db.refresh(codebook)

        return codebook

    @staticmethod
    def merge_codes_to_default(
        db: Session,
        code_ids: List[int],
        project_id: int,
        user_id: int
    ) -> dict:
        """Move specified codes from source codebook to user's default codebook"""

        # Get or create default codebook
        default_codebook = CodebookService.get_or_create_default_codebook(
            db=db,
            user_id=user_id,
            project_id=project_id
        )

        # Get codes to move
        codes_to_move = db.query(Code).filter(
            Code.id.in_(code_ids)
        ).all()

        if len(codes_to_move) != len(code_ids):
            raise ValueError("Some codes not found in source codebook")

        # Move codes to default codebook
        for code in codes_to_move:
            code.codebook_id = default_codebook.id

        db.commit()

        return {
            "default_codebook_id": default_codebook.id,
            "moved_codes_count": len(codes_to_move)
        }

    @staticmethod
    def get_or_create_ai_session_codebook(
        db: Session,
        user_id: int,
        project_id: int,
        session_type: str = "AI_generated"
    ) -> Codebook:
        """Create a new AI session codebook with incremental naming (AI_generated_1, AI_generated_2, etc.)"""

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

        # Find the next available number for AI session codebooks
        existing_ai_codebooks = db.query(Codebook).filter(
            Codebook.user_id == user_id,
            Codebook.project_id == project_id,
            Codebook.is_ai_generated == True,
            Codebook.name.like(f"{session_type}_%")
        ).all()

        # Extract numbers from existing codebooks and find the next available
        used_numbers = set()
        for codebook in existing_ai_codebooks:
            try:
                # Extract number from names like "AI_generated_1", "AI_generated_2"
                parts = codebook.name.split('_')
                if len(parts) >= 3 and parts[-1].isdigit():
                    used_numbers.add(int(parts[-1]))
            except (ValueError, IndexError):
                continue

        # Find the next available number
        next_number = 1
        while next_number in used_numbers:
            next_number += 1

        # Create new AI session codebook
        ai_codebook_name = f"{session_type}_{next_number}"
        ai_codebook = Codebook(
            name=ai_codebook_name,
            user_id=user_id,
            project_id=project_id,
            is_ai_generated=True,
            description=f"Codebook for {session_type.replace('_', ' ').lower()} codes - Session {next_number}"
        )

        db.add(ai_codebook)
        db.commit()
        db.refresh(ai_codebook)

        return ai_codebook

    @staticmethod
    def get_project_finalized_codebooks(
        db: Session,
        project_id: int,
        user_id: int
    ) -> List[Codebook]:
        """Get all finalized codebooks for a project (owner can access all, collaborators only their own)"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check user access to project
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=True
        )

        if not project:
            return []

        # If user is project owner, get all finalized codebooks
        if project.owner_id == user_id:  # type: ignore
            finalized_codebooks = db.query(Codebook).filter(
                Codebook.project_id == project_id,
                Codebook.finalized == True
            ).options(
                selectinload(Codebook.user),
                selectinload(Codebook.codes)
            ).order_by(Codebook.created_at.desc()).all()
        else:
            # If user is collaborator, only get their own finalized codebooks
            finalized_codebooks = db.query(Codebook).filter(
                Codebook.project_id == project_id,
                Codebook.user_id == user_id,
                Codebook.finalized == True
            ).options(
                selectinload(Codebook.user),
                selectinload(Codebook.codes)
            ).order_by(Codebook.created_at.desc()).all()

        return finalized_codebooks
