from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.core.permissions import PermissionChecker
from app.models.user import User
from app.models.document import Document
from app.services.ai.llm_service import LLMService
from app.services.codebook_service import CodebookService
from app.services.project_service import ProjectService
from typing import Optional, Tuple


class AICodingValidators:

    @staticmethod
    def get_and_validate_documents(db: Session, document_ids: list[int], user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        documents = db.query(Document).filter(
            Document.id.in_(document_ids)).all()
        found_ids = {doc.id for doc in documents}  # type: ignore

        missing_ids = set(document_ids) - found_ids  # type: ignore
        if missing_ids:
            raise ValueError(f"Documents not found: {missing_ids}")

        # Check access to each document
        for doc in documents:
            try:
                PermissionChecker.check_document_access(
                    db, doc.id, user, raise_exception=True)  # type: ignore
            except HTTPException as e:
                if e.status_code == 404:
                    raise ValueError(f"Document {doc.id} not found")
                elif e.status_code == 403:
                    raise ValueError(
                        f"Access denied: You don't have permission to access document {doc.id}")
                else:
                    raise ValueError(
                        f"Permission error for document {doc.id}: {e.detail}")

        return documents

    @staticmethod
    def get_project_and_research_context(db: Session, project_id, user_id: int) -> Tuple[Optional[object], str]:
        project = ProjectService.get_project(
            db, project_id, user_id)  # type: ignore
        if not project:
            print("Project not found or access denied.")
            return None, ""

        research_context = "No specific research context provided."
        if project.research_details is not None:
            context_parts = []
            if isinstance(project.research_details, dict):
                for key, value in project.research_details.items():
                    if isinstance(value, list):
                        context_parts.append(f"{key}: {', '.join(value)}")
                    else:
                        context_parts.append(f"{key}: {value}")
            research_context = "; ".join(
                context_parts) if context_parts else research_context

        return project, research_context

    @staticmethod
    def get_and_validate_codebook(db: Session, codebook_id: int, user_id: int):
        codebook = CodebookService.get_codebook_with_codes(
            db, codebook_id, user_id)
        if not codebook:
            print("Codebook not found or access denied.")
            return None

        if not codebook.codes:
            print("No codes found in the codebook.")
            return None

        return codebook

    @staticmethod
    def get_existing_codes(db: Session, project_id: int, user_id: int):
        from app.services.code_service import CodeService
        return CodeService.get_project_codes(db, project_id, user_id)

    @staticmethod
    def validate_llm_service(llm_service: LLMService, service_type: str) -> bool:
        service_mapping = {
            "initial_coding": llm_service.initial_coding_llm,
            "theme_generation": llm_service.theme_generation_llm,
            "deductive_coding": llm_service.deductive_coding_llm,
            "code_refinement": llm_service.code_refinement_llm
        }

        if not service_mapping.get(service_type):
            print("LLM service is not initialized or model is not available.")
            return False
        return True
