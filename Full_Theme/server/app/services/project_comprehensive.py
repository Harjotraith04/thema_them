from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session, selectinload
from app.models.project import Project
from app.models.user import User
from app.models.code import Code
from app.models.codebook import Codebook
from app.models.code_assignments import CodeAssignment
from app.models.annotation import Annotation
from app.services.project_serializer import ProjectSerializer


class ProjectComprehensiveService:
    """Handles comprehensive project data loading"""

    @staticmethod
    def load_project_with_relations(db: Session, project_id: int) -> Optional[Project]:
        """Load project with all necessary relationships"""
        return db.query(Project).options(
            selectinload(Project.owner),
            selectinload(Project.collaborators),
            selectinload(Project.documents),
            selectinload(Project.codes),
            selectinload(Project.codes).selectinload(Code.code_assignments),
            selectinload(Project.annotations).selectinload(
                Annotation.document),
            selectinload(Project.annotations).selectinload(Annotation.code),
            selectinload(Project.annotations).selectinload(
                Annotation.created_by),
            selectinload(Project.codebooks).selectinload(Codebook.codes),
            selectinload(Project.codebooks).selectinload(Codebook.user)
        ).filter(Project.id == project_id).first()

    @staticmethod
    def get_user_code_assignments(db: Session, project_id: int, user_id: int) -> List[CodeAssignment]:
        """Get all code assignments for a user in a project"""
        return db.query(CodeAssignment).join(
            Code, CodeAssignment.code_id == Code.id
        ).filter(
            Code.project_id == project_id,
            CodeAssignment.created_by_id == user_id
        ).options(
            selectinload(CodeAssignment.code),
            selectinload(CodeAssignment.document)
        ).all()

    @staticmethod
    def get_comprehensive_data(db: Session, project_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        """Get comprehensive project data"""
        # Load project with all relationships
        project = ProjectComprehensiveService.load_project_with_relations(
            db, project_id)
        if not project:
            return None

        # Filter user-specific data
        user_codes = [
            code for code in project.codes if code.created_by_id == user_id]
        user_annotations = [
            ann for ann in project.annotations if ann.created_by_id == user_id]
        user_code_assignments = ProjectComprehensiveService.get_user_code_assignments(
            db, project_id, user_id)

        # Get codebooks data
        user_codebooks = ProjectSerializer.get_user_codebooks(
            db, user_codes, user_id, project_id)

        # Get finalized codebooks (all for owner, own for collaborators)
        if project.owner_id == user_id:  # type: ignore
            # Project owner sees all finalized codebooks
            finalized_codebooks = ProjectSerializer.get_finalized_codebooks(
                db, project.codebooks)
        else:
            # Collaborators only see their own finalized codebooks
            user_finalized_codebooks = [
                cb for cb in project.codebooks
                if cb.user_id == user_id and cb.finalized  # type: ignore
            ]
            finalized_codebooks = ProjectSerializer.get_finalized_codebooks(
                db, user_finalized_codebooks)

        # Build response
        return {
            "id": project.id,
            "title": project.title,
            "description": project.description,
            "owner_id": project.owner_id,
            "created_at": project.created_at,
            "updated_at": project.updated_at,
            "research_details": project.research_details,
            "owner": ProjectSerializer.serialize_user_data(project.owner),
            "collaborators": [ProjectSerializer.serialize_user_data(c) for c in project.collaborators],
            "documents": [ProjectSerializer.serialize_document(doc) for doc in project.documents],
            "codes": [ProjectSerializer.serialize_code(code, user_id) for code in user_codes],
            "code_assignments": [ProjectSerializer.serialize_code_assignment(a) for a in user_code_assignments],
            "annotations": [ProjectSerializer.serialize_annotation(ann) for ann in user_annotations],
            "codebooks": user_codebooks,
            "finalized_codebooks": finalized_codebooks
        }
