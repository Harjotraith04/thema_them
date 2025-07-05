from typing import Dict, Any, List
from sqlalchemy.orm import Session, selectinload
from app.models.code import Code
from app.models.codebook import Codebook
from app.models.code_assignments import CodeAssignment


class ProjectSerializer:
    """Handles serialization of project-related data"""

    @staticmethod
    def serialize_user_data(user) -> Dict[str, Any]:
        """Serialize user data"""
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active,
            "oauth_provider": user.oauth_provider
        }

    @staticmethod
    def serialize_document(doc) -> Dict[str, Any]:
        """Serialize document data"""
        return {
            "id": doc.id,
            "name": doc.name,
            "description": doc.description,
            "document_type": doc.document_type.value,
            "project_id": doc.project_id,
            "uploaded_by_id": doc.uploaded_by_id,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "file_size": doc.file_size,
            "content": doc.content,
        }

    @staticmethod
    def serialize_code_assignment(assignment) -> Dict[str, Any]:
        """Serialize code assignment data"""
        return {
            "id": assignment.id,
            "document_id": assignment.document_id,
            "code_id": assignment.code_id,
            "created_by_id": assignment.created_by_id,
            "start_char": assignment.start_char,
            "end_char": assignment.end_char,
            "text_snapshot": assignment.text_snapshot,
            "created_at": assignment.created_at,
            "updated_at": assignment.updated_at,
            "document_name": assignment.document.name if assignment.document else None,
            "code_name": assignment.code.name if assignment.code else None,
            "code_color": assignment.code.color if assignment.code else None
        }

    @staticmethod
    def serialize_annotation(ann) -> Dict[str, Any]:
        """Serialize annotation data"""
        return {
            "id": ann.id,
            "content": ann.content,
            "annotation_type": ann.annotation_type.value,
            "document_id": ann.document_id,
            "code_id": ann.code_id,
            "project_id": ann.project_id,
            "created_by_id": ann.created_by_id,
            "start_char": ann.start_char,
            "end_char": ann.end_char,
            "text_snapshot": ann.text_snapshot,
            "created_at": ann.created_at,
            "updated_at": ann.updated_at,
            "document_name": ann.document.name if ann.document else None,
            "code_name": ann.code.name if ann.code else None,
            "created_by_email": ann.created_by.email if ann.created_by else None,
            "created_by_name": ann.created_by.name if ann.created_by else None
        }

    @staticmethod
    def serialize_code(code, user_id: int) -> Dict[str, Any]:
        """Serialize code data"""
        return {
            "id": code.id,
            "name": code.name,
            "description": code.description,
            "color": code.color,
            "project_id": code.project_id,
            "codebook_id": code.codebook_id,
            "created_by_id": code.created_by_id,
            "created_at": code.created_at,
            "updated_at": code.updated_at,
            "assignments_count": len([a for a in code.code_assignments if a.created_by_id == user_id])
        }

    @staticmethod
    def get_user_codebooks(db: Session, user_codes: List[Code], user_id: int, project_id: int) -> List[Dict[str, Any]]:
        """Get codebooks used by user's codes"""
        # Collect unique codebook IDs
        codebook_ids = set()
        for code in user_codes:
            if code.codebook_id:  # type: ignore
                codebook_ids.add(code.codebook_id)
            else:
                # Handle codes without codebook_id
                default_codebook = Code.get_default_codebook(
                    user_id=user_id, project_id=project_id, db=db
                )
                code.codebook_id = default_codebook.id
                db.commit()
                codebook_ids.add(default_codebook.id)

        if not codebook_ids:
            return []

        # Get codebook details
        codebooks = db.query(Codebook).filter(
            Codebook.id.in_(codebook_ids)
        ).options(
            selectinload(Codebook.user),
            selectinload(Codebook.codes)
        ).all()

        result = []
        for codebook in codebooks:
            user_codes_in_codebook = [
                c for c in codebook.codes
                if c.created_by_id == user_id and c.project_id == project_id
            ]

            result.append({
                "id": codebook.id,
                "name": codebook.name,
                "description": codebook.description,
                "user_id": codebook.user_id,
                "user_email": codebook.user.email if codebook.user else None,
                "user_name": codebook.user.name if codebook.user else None,
                "project_id": codebook.project_id,
                "is_ai_generated": codebook.is_ai_generated,
                "finalized": codebook.finalized,
                "created_at": codebook.created_at,
                "codes_count": len(user_codes_in_codebook),
                "total_codes_count": len([c for c in codebook.codes if c.project_id == project_id])
            })

        return result

    @staticmethod
    def get_finalized_codebooks(db: Session, project_codebooks: List[Codebook]) -> List[Dict[str, Any]]:
        """Get finalized codebooks with their assignments and user information"""
        finalized_codebooks = [
            cb for cb in project_codebooks if cb.finalized]  # type: ignore
        result = []

        for codebook in finalized_codebooks:
            codebook_code_ids = [code.id for code in codebook.codes]
            codebook_assignments = []

            if codebook_code_ids:
                codebook_assignments = db.query(CodeAssignment).filter(
                    CodeAssignment.code_id.in_(codebook_code_ids)
                ).options(
                    selectinload(CodeAssignment.code),
                    selectinload(CodeAssignment.document),
                    selectinload(CodeAssignment.created_by)
                ).all()

            result.append({
                "id": codebook.id,
                "name": codebook.name,
                "description": codebook.description,
                "user_id": codebook.user_id,
                "user_email": codebook.user.email if codebook.user else None,
                "user_name": codebook.user.name if codebook.user else None,
                "is_ai_generated": codebook.is_ai_generated,
                "finalized": codebook.finalized,
                "created_at": codebook.created_at,
                "codes_count": len(codebook.codes),
                "assignments_count": len(codebook_assignments),
                "codes": [
                    {
                        "id": code.id,
                        "name": code.name,
                        "description": code.description,
                        "color": code.color,
                        "project_id": code.project_id,
                        "codebook_id": code.codebook_id,
                        "created_by_id": code.created_by_id,
                        "created_at": code.created_at,
                        "updated_at": code.updated_at,
                        "assignments_count": len([a for a in codebook_assignments if a.code_id == code.id])
                    } for code in codebook.codes
                ],
                "code_assignments": [
                    {
                        "id": assignment.id,
                        "document_id": assignment.document_id,
                        "code_id": assignment.code_id,
                        "created_by_id": assignment.created_by_id,
                        "start_char": assignment.start_char,
                        "end_char": assignment.end_char,
                        "text_snapshot": assignment.text_snapshot,
                        "created_at": assignment.created_at,
                        "updated_at": assignment.updated_at,
                        "document_name": assignment.document.name if assignment.document else None,
                        "code_name": assignment.code.name if assignment.code else None,
                        "code_color": assignment.code.color if assignment.code else None,
                        "created_by_email": assignment.created_by.email if assignment.created_by else None,
                        "created_by_name": assignment.created_by.name if assignment.created_by else None
                    } for assignment in codebook_assignments
                ]
            })

        return result
