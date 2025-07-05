from sqlalchemy.orm import Session
from app.services.ai.ai_code_generation import AICodeGenerationService
from app.services.ai.ai_theme_generation import AIThemeGenerationService
from app.services.ai.ai_code_grouping import AICodeGroupingService
from app.services.ai.ai_coding_refinement import AICodingRefinement
from app.services.ai.ai_coding_utils import AICodingUtils
from app.services.ai.llm_service import LLMService
from app.models.code import Code


class AICodingService:
    """Main AI coding service orchestrating the in-memory pipeline"""

    @staticmethod
    def generate_code(
        document_ids: list[int],
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> dict:
        print(
            f"🚀 Starting AI code generation for {len(document_ids)} documents")

        # Step 1: Generate initial codes and assignments (in-memory only)
        response = AICodeGenerationService.generate_initial_codes_in_memory(
            document_ids=document_ids,
            db=db,
            user_id=user_id,
            model_name=model_name,
            provider=provider
        )

        # Check if initial generation failed
        if not response.get("results") or response.get("summary", {}).get("quota_exhausted"):
            print("❌ Initial code generation failed or quota exhausted")
            return response

        # In-memory structures
        codes_dict = response["codes_dict"]  # code_name -> code_data
        assignments = response["assignments"]  # list of assignment_data
        ai_session_codebook = response["ai_session_codebook"]

        print(
            f"✅ Initial coding complete: {len(assignments)} assignments, {len(codes_dict)} codes (in-memory)")

        # Step 2: Refinement phase (modify in-memory structures)
        print("🔄 Starting code refinement phase...")

        quota_status = AICodingUtils.get_rate_limit_status(provider)
        if not quota_status.get("quota_exhausted", False):
            llm_service = LLMService(model_name=model_name, provider=provider)
            codes_dict, assignments = AICodingRefinement.refine_codes_in_memory(
                codes_dict=codes_dict,
                assignments=assignments,
                llm_service=llm_service,
                ai_session_codebook=ai_session_codebook,
                user_id=user_id,
                provider=provider
            )
            print("✅ Code refinement complete (in-memory)")
        else:
            print("⚠️ Quota exhausted - skipping refinement phase")

        # Step 3: Code grouping phase (modify in-memory structures)
        if len(codes_dict) > 2:
            print(
                f"🔄 Starting code grouping phase for {len(codes_dict)} codes...")
            llm_service = LLMService(model_name=model_name, provider=provider)

            codes_dict = AICodeGroupingService.perform_code_grouping_in_memory(
                codes_dict=codes_dict,
                assignments=assignments,
                llm_service=llm_service,
                provider=provider
            )
            print("✅ Code grouping complete (in-memory)")
        else:
            print(
                f"⏭️ Skipping code grouping ({len(codes_dict)} codes - need more than 2)")

        # Step 4: Apply all changes to database at once
        print("🔄 Applying all changes to database...")

        final_codes, final_assignments = AICodingService._apply_changes_to_database(
            db=db,
            codes_dict=codes_dict,
            assignments=assignments,
            ai_session_codebook=ai_session_codebook,
            user_id=user_id
        )

        print(
            f"✅ Database update complete: {len(final_codes)} codes, {len(final_assignments)} assignments")

        # Step 5: Format final response
        final_response = {
            "ai_session_codebook": {
                "id": ai_session_codebook.id,
                "name": ai_session_codebook.name,
                "description": ai_session_codebook.description,
                "is_ai_generated": ai_session_codebook.is_ai_generated,
                "finalized": ai_session_codebook.finalized,
            },
            "results": final_assignments,
            "summary": {
                "total_codes": len(final_codes),
                "total_assignments": len(final_assignments),
                "codes_created": len([c for c in final_codes if c.get("was_created", False)]),
                "codes_modified": len([c for c in final_codes if c.get("was_modified", False)]),
                "codes_grouped": len([c for c in final_codes if c.get("group_name")])
            }
        }

        print(
            f"🎉 AI coding pipeline complete: {len(final_assignments)} final assignments, {len(final_codes)} codes")
        return final_response

    @staticmethod
    def deductive_coding(
        document_ids: list[int],
        codebook_id: int,
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> dict:
        print(f"🚀 Starting deductive coding for {len(document_ids)} documents")

        # Step 1: Generate deductive codes and assignments (in-memory only)
        response = AICodeGenerationService.generate_deductive_codes_in_memory(
            document_ids=document_ids,
            codebook_id=codebook_id,
            db=db,
            user_id=user_id,
            model_name=model_name,
            provider=provider
        )

        # Check if initial generation failed
        if not response.get("assignments") or response.get("summary", {}).get("quota_exhausted"):
            print("❌ Deductive coding failed or quota exhausted")
            return response

        # In-memory structures
        codes_dict = response["codes_dict"]  # code_name -> code_data
        assignments = response["assignments"]  # list of assignment_data
        ai_session_codebook = response["ai_session_codebook"]

        print(
            f"✅ Deductive coding complete: {len(assignments)} assignments (in-memory)")

        # Step 2: Apply all changes to database at once
        print("🔄 Applying all changes to database...")

        final_codes, final_assignments = AICodingService._apply_changes_to_database(
            db=db,
            codes_dict=codes_dict,
            assignments=assignments,
            ai_session_codebook=ai_session_codebook,
            user_id=user_id
        )

        print(
            f"✅ Database update complete: {len(final_codes)} codes, {len(final_assignments)} assignments")

        # Step 3: Format final response
        final_response = {
            "ai_session_codebook": {
                "id": ai_session_codebook.id,
                "name": ai_session_codebook.name,
                "description": ai_session_codebook.description,
                "is_ai_generated": ai_session_codebook.is_ai_generated,
                "finalized": ai_session_codebook.finalized,
            },
            "results": final_assignments,
            "summary": {
                "total_codes": len(final_codes),
                "total_assignments": len(final_assignments),
                "codes_created": len([c for c in final_codes if c.get("was_created", False)]),
                "codes_modified": len([c for c in final_codes if c.get("was_modified", False)]),
                "codes_grouped": len([c for c in final_codes if c.get("group_name")])
            }
        }

        print(
            f"🎉 Deductive coding pipeline complete: {len(final_assignments)} final assignments, {len(final_codes)} codes")
        return final_response

    @staticmethod
    def generate_themes(
        codebook_id: int,
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> list[dict]:
        print(f"🚀 Starting theme generation for codebook {codebook_id}")

        themes = AIThemeGenerationService.generate_themes_in_memory(
            codebook_id=codebook_id,
            db=db,
            user_id=user_id,
            model_name=model_name,
            provider=provider
        )

        if themes:
            print(f"✅ Theme generation complete: {len(themes)} themes created")
        else:
            print("❌ Theme generation failed or no themes generated")

        return themes

    @staticmethod
    def get_rate_limit_status(provider: str) -> dict:
        return AICodingUtils.get_rate_limit_status(provider)

    @staticmethod
    def _apply_changes_to_database(
        db: Session,
        codes_dict: dict,
        assignments: list,
        ai_session_codebook,
        user_id: int
    ) -> tuple[list, list]:
        """Apply all in-memory changes to the database in a single transaction"""
        from app.services.code_service import CodeService
        from app.models.code import Code
        import datetime

        # Create all codes first (only for new codes)
        created_codes = {}  # code_name -> database_code

        for code_name, code_data in codes_dict.items():
            if code_data.get("status") == "deleted":
                continue

            # Check if code already exists in database
            existing_code = db.query(Code).filter(
                Code.name == code_name,
                Code.project_id == code_data["project_id"]
            ).first()

            if existing_code:
                # Code already exists - use the existing one
                print(
                    f"DEBUG: Code '{code_name}' already exists in database with ID {existing_code.id}")
                created_codes[code_name] = existing_code
                continue

            # Create new codes only if they don't exist
            try:
                code = CodeService.create_code(
                    db=db,
                    name=code_data["name"],
                    project_id=code_data["project_id"],
                    created_by_id=user_id,
                    description=code_data["description"],
                    color=code_data.get("color", "#3B82F6"),
                    is_auto_generated=code_data.get("is_auto_generated", True),
                    codebook_id=ai_session_codebook.id,
                    group_name=code_data.get("group_name")
                )
                created_codes[code_name] = code
            except Exception as e:
                print(f"ERROR: Failed to create code '{code_name}': {str(e)}")
                # If code creation fails (e.g., duplicate name), try to get existing code
                existing_code = db.query(Code).filter(
                    Code.name == code_name,
                    Code.project_id == code_data["project_id"]
                ).first()
                if existing_code:
                    created_codes[code_name] = existing_code
                else:
                    print(
                        f"ERROR: Could not create or find code '{code_name}' - skipping")
                    continue

        # Create all assignments using bulk insert for efficiency
        from app.models.code_assignments import CodeAssignment
        import datetime

        assignment_mappings = []
        assignment_data_list = []  # Keep track of assignment data for later matching

        for assignment_data in assignments:
            if assignment_data.get("status") == "deleted":
                continue

            code_name = assignment_data["code_name"]
            if code_name not in created_codes:
                continue

            code = created_codes[code_name]

            assignment_mappings.append({
                "document_id": assignment_data["document_id"],
                "code_id": code.id,
                "start_char": assignment_data["start_char"],
                "end_char": assignment_data["end_char"],
                "text_snapshot": assignment_data["text"],
                "created_by_id": user_id,
                "confidence": assignment_data.get("confidence", 75),
                "created_at": datetime.datetime.now(datetime.timezone.utc)
            })
            assignment_data_list.append(assignment_data)

        # Bulk insert assignments
        if assignment_mappings:
            db.bulk_insert_mappings(
                CodeAssignment.__mapper__, assignment_mappings)

        # Commit all changes
        db.commit()

        # Query back the created assignments to get their IDs
        created_assignments = []
        if assignment_mappings:
            # Query assignments that were just created by matching on document_id, code_id, and start_char
            for i, assignment_data in enumerate(assignment_data_list):
                code_name = assignment_data["code_name"]
                code = created_codes[code_name]

                assignment = db.query(CodeAssignment).filter(
                    CodeAssignment.document_id == assignment_data["document_id"],
                    CodeAssignment.code_id == code.id,
                    CodeAssignment.start_char == assignment_data["start_char"],
                    CodeAssignment.end_char == assignment_data["end_char"]
                ).order_by(CodeAssignment.created_at.desc()).first()

                if assignment:
                    created_assignments.append((assignment, assignment_data))
                else:
                    print(
                        f"WARNING: Could not find created assignment for code '{code_name}'")
                    # Create a dummy assignment object for response formatting
                    dummy_assignment = type('Assignment', (), {
                        'id': None,
                        'document_id': assignment_data["document_id"],
                        'start_char': assignment_data["start_char"],
                        'end_char': assignment_data["end_char"],
                        'text_snapshot': assignment_data["text"],
                        'confidence': assignment_data.get("confidence", 75),
                        'created_at': datetime.datetime.now(datetime.timezone.utc)
                    })()
                    created_assignments.append(
                        (dummy_assignment, assignment_data))

        # Format final codes for response
        final_codes = []
        for code_name, code in created_codes.items():
            code_data = codes_dict[code_name]
            final_codes.append({
                "id": code.id,
                "name": code.name,
                "description": code.description,
                "color": code.color,
                "project_id": code.project_id,
                "codebook_id": code.codebook_id,
                "created_at": code.created_at,
                "is_auto_generated": code.is_auto_generated,
                "group_name": code.group_name,
                "was_created": code_data.get("status") != "existing",
                "was_modified": code_data.get("was_modified", False)
            })

        # Format final assignments for response using actual assignment IDs
        final_assignments = []
        for assignment, assignment_data in created_assignments:
            code_name = assignment_data["code_name"]
            code = created_codes[code_name]

            final_assignments.append({
                "code_assignment": {
                    "id": assignment.id,
                    "text": assignment.text_snapshot,
                    "start_char": assignment.start_char,
                    "end_char": assignment.end_char,
                    "document_id": assignment.document_id,
                    "confidence": assignment.confidence,
                    "created_at": assignment.created_at
                },
                "code": {
                    "id": code.id,
                    "name": code.name,
                    "description": code.description,
                    "color": code.color,
                    "project_id": code.project_id,
                    "created_at": code.created_at,
                    "is_auto_generated": code.is_auto_generated,
                    "group_name": code.group_name,
                    "was_created": codes_dict[code_name].get("status") != "existing"
                },
                "assignment_status": "success",
                "message": f"Successfully assigned code '{code.name}' to text selection",
                "refined_status": assignment_data.get("refined_status", "kept")
            })

        return final_codes, final_assignments
