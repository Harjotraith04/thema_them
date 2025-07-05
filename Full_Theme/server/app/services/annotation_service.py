from sqlalchemy.orm import Session
from typing import List, Optional
from sqlalchemy import or_, and_

from app.core.permissions import PermissionChecker
from app.models.annotation import Annotation
from app.models.document import Document
from app.models.code import Code
from app.models.user import User
from app.models.project import Project
from app.schemas.annotation import AnnotationWithDetails


class AnnotationService:
    """Service for annotation management and operations"""
    @staticmethod
    def create_annotation(
        db: Session,
        content: str,
        annotation_type: str,
        user_id: int,
        document_id: Optional[int] = None,
        code_id: Optional[int] = None,
        project_id: Optional[int] = None,
        start_char: Optional[int] = None,
        end_char: Optional[int] = None,
        text_snapshot: Optional[str] = None
    ) -> Annotation:
        """
        Create a new annotation linked to a document, code, or both.
        If project_id is not provided, it will be derived from the document or code.
        """
        # Validate that at least one target is provided
        if not any([document_id, code_id]):
            raise ValueError(
                "At least one target (document or code) must be specified")

        # Validate user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Determine project_id and validate access
        if document_id:
            # Validate document exists and get its project
            document = db.query(Document).filter(
                Document.id == document_id).first()
            if not document:
                raise ValueError("Document not found")

            # Check user access to the document
            PermissionChecker.check_project_access(
                db, document.project_id, user, raise_exception=False)  # type: ignore

            # If no explicit project_id provided, use the document's
            if not project_id:
                project_id = document.project_id  # type: ignore

        if code_id:
            # Validate code exists and get its project
            code = db.query(Code).filter(Code.id == code_id).first()
            if not code:
                raise ValueError("Code not found")

            # Check user access to the code's project
            PermissionChecker.check_project_access(
                db, code.project_id, user, raise_exception=False)  # type: ignore

            # If no explicit project_id provided, use the code's
            if not project_id:
                project_id = code.project_id  # type: ignore        # Create the annotation
        annotation = Annotation(
            content=content,
            annotation_type=annotation_type,
            document_id=document_id,
            code_id=code_id,
            project_id=project_id,
            created_by_id=user_id,
            start_char=start_char,
            end_char=end_char,
            text_snapshot=text_snapshot
        )

        db.add(annotation)
        db.commit()
        db.refresh(annotation)
        return annotation

    @staticmethod
    def get_document_annotations(
        db: Session,
        document_id: int,
        user_id: int
    ) -> List[Annotation]:
        """Get all annotations for a document"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if document exists and user has access
        document = PermissionChecker.check_document_access(
            db, document_id, user, raise_exception=False)

        if not document:
            raise ValueError("Document not found or access denied")

        return db.query(Annotation).filter(Annotation.document_id == document_id).all()

    @staticmethod
    def get_code_annotations(
        db: Session,
        code_id: int,
        user_id: int
    ) -> List[Annotation]:
        """Get all annotations for a code"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if code exists and user has access
        code = db.query(Code).filter(Code.id == code_id).first()
        if not code:
            raise ValueError("Code not found")

        # Check user access to the code's project
        project = PermissionChecker.check_project_access(
            db, code.project_id, user, raise_exception=False)  # type: ignore

        if not project:
            raise ValueError("Access denied")

        return db.query(Annotation).filter(Annotation.code_id == code_id).all()

    @staticmethod
    def get_project_annotations(
        db: Session,
        project_id: int,
        user_id: int
    ) -> List[AnnotationWithDetails]:
        """Get all annotations for a project with details"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check if project exists and user has access
        project = PermissionChecker.check_project_access(
            db, project_id, user, raise_exception=False)

        if not project:
            raise ValueError("Project not found or access denied")

        annotations = db.query(Annotation).filter(
            Annotation.project_id == project_id).all()

        results = []
        for annotation in annotations:
            creator = db.query(User).filter(
                User.id == annotation.created_by_id).first()

            results.append(AnnotationWithDetails(
                id=annotation.id,  # type: ignore
                content=annotation.content,  # type: ignore
                annotation_type=annotation.annotation_type,  # type: ignore
                document_id=annotation.document_id,  # type: ignore
                code_id=annotation.code_id,  # type: ignore
                project_id=annotation.project_id,  # type: ignore
                created_by_id=annotation.created_by_id,  # type: ignore
                created_at=annotation.created_at,  # type: ignore
                updated_at=annotation.updated_at,  # type: ignore
                created_by_email=creator.email if creator else None  # type: ignore
            ))

        return results

    @staticmethod
    def update_annotation(
        db: Session,
        annotation_id: int,
        user_id: int,
        content: Optional[str] = None,
        annotation_type: Optional[str] = None
    ) -> Annotation:
        """Update an annotation"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        annotation = db.query(Annotation).filter(
            Annotation.id == annotation_id).first()
        if not annotation:
            raise ValueError("Annotation not found")

        # Check user access to the annotation's project
        project = PermissionChecker.check_project_access(
            db, annotation.project_id, user, raise_exception=False)  # type: ignore

        if not project:
            raise ValueError("Access denied")

        # Only the creator can edit the annotation
        if annotation.created_by_id != user_id:  # type: ignore
            raise ValueError("You can only edit your own annotations")

        # Update provided fields
        if content is not None:
            annotation.content = content  # type: ignore

        if annotation_type is not None:
            annotation.annotation_type = annotation_type  # type: ignore

        db.commit()
        db.refresh(annotation)
        return annotation

    @staticmethod
    def delete_annotation(
        db: Session,
        annotation_id: int,
        user_id: int
    ) -> bool:
        """Delete an annotation"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        annotation = db.query(Annotation).filter(
            Annotation.id == annotation_id).first()
        if not annotation:
            return False

        # Check user access to the annotation's project
        project = PermissionChecker.check_project_access(
            db, annotation.project_id, user, raise_exception=False)  # type: ignore

        if not project:
            raise ValueError("Access denied")

        # Only the creator can delete the annotation
        if annotation.created_by_id != user_id:  # type: ignore
            raise ValueError("You can only delete your own annotations")

        db.delete(annotation)
        db.commit()
        return True

    @staticmethod
    def filter_annotations(
        db: Session,
        user_id: int,
        project_id: Optional[int] = None,
        document_id: Optional[int] = None,
        code_id: Optional[int] = None,
        created_by_id: Optional[int] = None,
        annotation_type: Optional[str] = None,
        search_text: Optional[str] = None,
        annotation_id: Optional[int] = None
    ) -> List[AnnotationWithDetails]:
        """Filter annotations based on various criteria"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Start with base query
        query = db.query(Annotation)

        # Apply filters
        filters = []

        if project_id:
            # Check user access to the project
            project = PermissionChecker.check_project_access(
                db, project_id, user, raise_exception=False)

            if not project:
                raise ValueError("Project not found or access denied")

            filters.append(Annotation.project_id == project_id)
        else:            # If no specific project, limit to projects user has access to
            # Get projects where user is owner or collaborator
            accessible_projects = db.query(Project).filter(
                or_(
                    Project.owner_id == user.id,
                    Project.collaborators.any(User.id == user.id)
                )
            ).all()
            project_ids = [p.id for p in accessible_projects]
            if project_ids:
                filters.append(Annotation.project_id.in_(
                    project_ids))  # type: ignore
            else:
                # If user has no projects, return empty result set
                return []

        if document_id:
            filters.append(Annotation.document_id == document_id)

        if code_id:
            filters.append(Annotation.code_id == code_id)

        if created_by_id:
            filters.append(Annotation.created_by_id == created_by_id)

        if annotation_type:
            filters.append(Annotation.annotation_type == annotation_type)

        if search_text:
            filters.append(Annotation.content.ilike(
                f"%{search_text}%"))  # type: ignore

        if annotation_id:
            filters.append(Annotation.id == annotation_id)

        # Apply all filters
        if filters:
            query = query.filter(and_(*filters))

        # Execute query
        annotations = query.all()

        # Build detailed response
        results = []
        for annotation in annotations:
            creator = db.query(User).filter(
                User.id == annotation.created_by_id).first()

            # Get document name if available
            document_name = None
            if annotation.document_id:  # type: ignore
                document = db.query(Document).filter(
                    Document.id == annotation.document_id).first()
                if document:
                    document_name = document.name

            # Get code name if available
            code_name = None
            if annotation.code_id:  # type: ignore
                code = db.query(Code).filter(
                    Code.id == annotation.code_id).first()
                if code:
                    code_name = code.name

            results.append(AnnotationWithDetails(
                id=annotation.id,  # type: ignore
                content=annotation.content,  # type: ignore
                annotation_type=annotation.annotation_type,  # type: ignore
                document_id=annotation.document_id,  # type: ignore
                code_id=annotation.code_id,  # type: ignore
                project_id=annotation.project_id,  # type: ignore
                start_char=annotation.start_char,  # type: ignore
                end_char=annotation.end_char,  # type: ignore
                text_snapshot=annotation.text_snapshot,  # type: ignore
                created_by_id=annotation.created_by_id,  # type: ignore
                created_at=annotation.created_at,  # type: ignore
                updated_at=annotation.updated_at,  # type: ignore
                created_by_email=creator.email if creator else None,  # type: ignore
                document_name=document_name,  # type: ignore
                code_name=code_name  # type: ignore
            ))

        return results
