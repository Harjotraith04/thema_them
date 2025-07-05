from sqlalchemy.orm import Session
from typing import Dict, List
from app.models.codebook import Codebook
from app.models.code import Code
from app.core.permissions import PermissionChecker


class MasterCodebookService:
    """Service for creating master codebooks from collaborator selections"""

    @staticmethod
    def create_master_codebook(
        db: Session,
        project_id: int,
        owner_id: int,
        selected_codes: Dict[int, List[int]],  # {codebook_id: [code_ids]}
        master_name: str = "Master Codebook"
    ) -> Codebook:
        """
        Create a master codebook by selecting codes from multiple collaborator codebooks.
        Only project owners can call this.
        """

        # Verify owner permissions
        user = db.query(User).filter(User.id == owner_id).first() # type: ignore
        project = PermissionChecker.check_project_access(db, project_id, user) # type: ignore
        if not project or project.owner_id != owner_id: # type: ignore
            raise ValueError("Only project owners can create master codebooks")

        # Create master codebook
        master_codebook = Codebook(
            name=master_name,
            description="Master codebook created from collaborator selections",
            project_id=project_id,
            user_id=owner_id,
            is_ai_generated=False,
            finalized=False
        )
        db.add(master_codebook)
        db.flush()

        # Copy selected codes to master codebook
        total_codes_copied = 0
        for codebook_id, code_ids in selected_codes.items():
            codes_to_copy = db.query(Code).filter(
                Code.id.in_(code_ids),
                Code.codebook_id == codebook_id
            ).all()

            for original_code in codes_to_copy:
                # Create copy in master codebook
                new_code = Code(
                    name=original_code.name,
                    description=original_code.description,
                    color=original_code.color,
                    project_id=project_id,
                    codebook_id=master_codebook.id,
                    created_by_id=owner_id,
                    is_auto_generated=False
                )
                db.add(new_code)
                total_codes_copied += 1

        db.commit()
        db.refresh(master_codebook)

        return {
            "master_codebook": master_codebook, # type: ignore
            "codes_copied": total_codes_copied 
        }

    @staticmethod
    def detect_code_conflicts(
        db: Session,
        project_id: int
    ) -> List[Dict]:
        """
        Detect potentially conflicting codes across finalized codebooks.
        Returns groups of similar codes for owner review.
        """

        # Get all codes from finalized codebooks
        finalized_codes = db.query(Code).join(Codebook).filter(
            Codebook.project_id == project_id,
            Codebook.finalized == True
        ).all()

        conflicts = []

        # Simple conflict detection based on exact name matches
        # (You could enhance this with fuzzy matching)
        code_groups = {}
        for code in finalized_codes:
            name_key = code.name.lower().strip()
            if name_key not in code_groups:
                code_groups[name_key] = []
            code_groups[name_key].append({
                "id": code.id,
                "name": code.name,
                "description": code.description,
                "codebook_id": code.codebook_id,
                "user_id": code.codebook.user_id
            })

        # Return groups with conflicts (more than 1 code with same name)
        for name, codes in code_groups.items():
            if len(codes) > 1:
                conflicts.append({
                    "conflicting_name": name,
                    "codes": codes,
                    "conflict_count": len(codes)
                })

        return conflicts
