from sqlalchemy.orm import Session, selectinload
from typing import List, Dict, Any, Optional
from fastapi import HTTPException

from app.models.code_assignments import CodeAssignment as CodeAssignmentModel
from app.models.codebook import Codebook
from app.models.code import Code
from app.models.user import User
from app.core.permissions import PermissionChecker


class CodeReviewService:
    """Simplified service for AI code assignment review workflow"""

    @staticmethod
    def get_ai_codebook_assignments(
        db: Session,
        codebook_id: int,
        user_id: int,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get code assignments from an AI codebook with optional status filtering"""

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Check codebook access
        codebook = PermissionChecker.check_codebook_access(
            db=db,
            codebook_id=codebook_id,
            user=user,
            raise_exception=True
        )

        if not codebook or not codebook.is_ai_generated:  # type: ignore
            raise ValueError(
                "AI-generated codebook not found or access denied")

        # Get all assignments for codes in this codebook
        query = db.query(CodeAssignmentModel).join(
            Code, CodeAssignmentModel.code_id == Code.id
        ).filter(
            Code.codebook_id == codebook_id,
            CodeAssignmentModel.created_by_id == user_id  # Only user's own assignments
        ).options(
            selectinload(CodeAssignmentModel.code),
            selectinload(CodeAssignmentModel.document)
        )

        # Apply status filter if provided
        if status_filter:
            if status_filter not in ["pending", "accepted", "rejected"]:
                raise ValueError(
                    "Invalid status filter. Must be 'pending', 'accepted', or 'rejected'")
            query = query.filter(CodeAssignmentModel.status == status_filter)

        assignments = query.all()

        # Group by status for summary
        all_assignments = db.query(CodeAssignmentModel).join(
            Code, CodeAssignmentModel.code_id == Code.id
        ).filter(
            Code.codebook_id == codebook_id,
            CodeAssignmentModel.created_by_id == user_id
        ).all()

        status_counts = {
            "pending": len([a for a in all_assignments if a.status == "pending"]), # type: ignore
            "accepted": len([a for a in all_assignments if a.status == "accepted"]), # type: ignore
            "rejected": len([a for a in all_assignments if a.status == "rejected"]) # type: ignore

        }

        return {
            "codebook": {
                "id": codebook.id,  # type: ignore
                "name": codebook.name,  # type: ignore
                "description": codebook.description,  # type: ignore
                "is_ai_generated": codebook.is_ai_generated,  # type: ignore
                "finalized": codebook.finalized  # type: ignore
            },
            "assignments": [
                {
                    "id": a.id,
                    "text": a.text_snapshot,
                    "start_char": a.start_char,
                    "end_char": a.end_char,
                    "confidence": a.confidence,
                    "status": a.status,
                    "document_id": a.document_id,
                    "document_name": a.document.name if a.document else None,  # type: ignore
                    "code": {
                        "id": a.code.id,
                        "name": a.code.name,
                        "description": a.code.description,
                        "color": a.code.color
                    },
                    "created_at": a.created_at
                } for a in assignments
            ],
            "summary": {
                "total": len(all_assignments),
                **status_counts,
                "review_complete": status_counts["pending"] == 0
            }
        }

    @staticmethod
    def bulk_review_assignments(
        db: Session,
        accepted_assignment_ids: List[int],
        rejected_assignment_ids: List[int],
        user_id: int
    ) -> Dict[str, Any]:
        """
        Bulk review assignments with automatic code management.
        This is the new simplified workflow that replaces manual merging.
        """

        results: Dict[str, Optional[Dict[str, Any]]] = {
            "accepted": None, "rejected": None}
        total_codes_moved = 0

        # Process accepted assignments (auto-moves codes to default codebook)
        if accepted_assignment_ids:
            accepted_result = CodeReviewService.review_assignments_and_auto_manage_codes(
                db=db,
                assignment_ids=accepted_assignment_ids,
                status="accepted",
                user_id=user_id
            )
            results["accepted"] = accepted_result
            total_codes_moved += len(
                accepted_result.get("codes_moved_to_default", []))

        # Process rejected assignments (codes stay in AI session codebook)
        if rejected_assignment_ids:
            rejected_result = CodeReviewService.review_assignments_and_auto_manage_codes(
                db=db,
                assignment_ids=rejected_assignment_ids,
                status="rejected",
                user_id=user_id
            )
            results["rejected"] = rejected_result

        total_updated = 0
        if results["accepted"]:
            total_updated += results["accepted"]["updated_count"]
        if results["rejected"]:
            total_updated += results["rejected"]["updated_count"]

        return {
            "total_updated": total_updated,
            "accepted_count": len(accepted_assignment_ids),
            "rejected_count": len(rejected_assignment_ids),
            "codes_moved_to_default": total_codes_moved,
            "details": results,
            "workflow_note": "Accepted codes automatically moved to your default codebook!"
        }

    @staticmethod
    def review_assignments_and_auto_manage_codes(
        db: Session,
        assignment_ids: List[int],
        status: str,
        user_id: int
    ) -> Dict[str, Any]:
        """
        SIMPLIFIED WORKFLOW: Update assignment status and automatically manage codes.

        - Accept assignment → Code moves to user's default codebook automatically
        - Reject assignment → Code stays in AI session codebook (ignored)

        This eliminates the need for manual merging steps!
        """

        if status not in ["pending", "accepted", "rejected"]:
            raise ValueError(
                "Invalid status. Must be 'pending', 'accepted', or 'rejected'")

        # Get user object
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")

        # Get assignments with codes and codebooks
        assignments = db.query(CodeAssignmentModel).options(
            selectinload(CodeAssignmentModel.code).selectinload(Code.codebook)
        ).filter(
            CodeAssignmentModel.id.in_(assignment_ids),
            CodeAssignmentModel.created_by_id == user_id
        ).all()

        if len(assignments) != len(assignment_ids):
            found_ids = [a.id for a in assignments]
            missing_ids = [
                aid for aid in assignment_ids if aid not in found_ids]
            raise ValueError(
                f"Assignments not found or access denied: {missing_ids}")

        # Track code movements for response
        codes_moved_to_default = []
        default_codebook = None

        # Update status and handle automatic code movement
        for assignment in assignments:
            # Update assignment status
            setattr(assignment, 'status', status)

            # AUTO-MANAGE CODES: Move accepted codes to default codebook
            if status == "accepted":
                code = assignment.code
                current_codebook = code.codebook

                # Only move codes from AI session codebooks to avoid confusion
                if current_codebook.is_ai_generated and not current_codebook.finalized:
                    # Get or create user's default codebook (lazy loading)
                    if not default_codebook:
                        from app.services.codebook_service import CodebookService
                        default_codebook = CodebookService.get_or_create_default_codebook(
                            db=db,
                            user_id=user_id,
                            project_id=current_codebook.project_id
                        )

                    # Check if code with same name already exists in default codebook
                    existing_code = db.query(Code).filter(
                        Code.name == code.name,
                        Code.codebook_id == default_codebook.id
                    ).first()

                    if not existing_code:
                        # Move code to default codebook
                        code.codebook_id = default_codebook.id
                        codes_moved_to_default.append({
                            "code_id": code.id,
                            "code_name": code.name,
                            "from_codebook": current_codebook.name,
                            "to_codebook": default_codebook.name
                        })
                    else:
                        # Code already exists, just update the assignment to point to existing code
                        assignment.code_id = existing_code.id

        db.commit()

        return {
            "updated_count": len(assignments),
            "status": status,
            "assignment_ids": assignment_ids,
            "codes_moved_to_default": codes_moved_to_default,
            "default_codebook": {
                "id": default_codebook.id if default_codebook else None,
                "name": default_codebook.name if default_codebook else None
            } if default_codebook else None,
            "message": f"Successfully updated {len(assignments)} assignments to '{status}'" +
            (f" and moved {len(codes_moved_to_default)} codes to default codebook" if codes_moved_to_default else "")
        }
