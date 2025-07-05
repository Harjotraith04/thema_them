"""
Common validation utilities for data validation across the application.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.models.project import Project
from app.models.document import Document
from app.models.code import Code
from app.models.user import User


class ValidationUtils:
    """Utility class for common validation operations"""

    @staticmethod
    def validate_unique_code_name(
        db: Session,
        name: str,
        project_id: int,
        parent_id: Optional[int] = None,
        exclude_id: Optional[int] = None
    ):
        """
        Validate that a code name is unique within a project.

        Args:
            db: Database session
            name: Name to validate
            project_id: ID of the project
            parent_id: Not used (kept for backward compatibility)
            exclude_id: ID to exclude from check (for updates)

        Raises:
            HTTPException: If name already exists
        """
        query = db.query(Code).filter(
            Code.name == name,
            Code.project_id == project_id
        )

        if exclude_id:
            query = query.filter(Code.id != exclude_id)

        existing_code = query.first()

        if existing_code:
            raise HTTPException(
                status_code=400,
                detail=f"Code name '{name}' already exists in this project"
            )

    @staticmethod
    def validate_collaborator_email(
        db: Session,
        email: str,
        project_id: int
    ) -> User:
        """
        Validate collaborator email and check if user exists.

        Args:
            db: Database session
            email: Email to validate
            project_id: ID of the project

        Returns:
            User object if found

        Raises:
            HTTPException: If user not found or already a collaborator
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=404,
                detail=f"User with email {email} not found"
            )

        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=404,
                detail="Project not found"
            )

        if user in project.collaborators:
            raise HTTPException(
                status_code=400,
                detail=f"User {email} is already a collaborator"
            )

        if project.owner_id == user.id:  # type: ignore
            raise HTTPException(
                status_code=400,
                detail="Project owner cannot be added as collaborator"
            )

        return user

    @staticmethod
    def validate_position_range(
        start_position: Optional[int],
        end_position: Optional[int]
    ):
        """
        Validate that position range is valid.

        Args:
            start_position: Start position (optional)
            end_position: End position (optional)

        Raises:
            HTTPException: If range is invalid
        """
        if start_position is not None and end_position is not None:
            if start_position >= end_position:
                raise HTTPException(
                    status_code=400,
                    detail="Start position must be less than end position"
                )
            if start_position < 0:
                raise HTTPException(
                    status_code=400,
                    detail="Position cannot be negative"
                )
