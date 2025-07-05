from sqlalchemy.orm import Session
from collections import defaultdict
from app.schemas.ai_services import CodeRefinementOutput
from app.services.ai.llm_service import LLMService
from app.services.ai.ai_coding_utils import AICodingUtils


class AICodingRefinement:
    """Service for refining AI-generated codes using in-memory processing"""

    @staticmethod
    def refine_codes_in_memory(
        codes_dict: dict,
        assignments: list,
        llm_service: LLMService,
        ai_session_codebook,
        user_id: int,
        provider: str
    ) -> tuple[dict, list]:
        """Refine codes in memory without database operations"""
        print(
            f"🔄 Starting in-memory code refinement for {len(codes_dict)} codes")

        # Group assignments by code name
        code_assignments = defaultdict(list)
        for assignment in assignments:
            if assignment.get("status") != "deleted":
                code_name = assignment.get("code_name")
                if code_name:
                    code_assignments[code_name].append(assignment)

        codes_to_delete = set()
        codes_to_modify = {}

        for code_name, code_data in codes_dict.items():
            if code_data.get("status") == "deleted":
                continue

            code_assignments_for_code = code_assignments.get(code_name, [])
            if not code_assignments_for_code:
                continue

            # Prepare assignments text for LLM
            assignments_text = ""
            for i, assignment in enumerate(code_assignments_for_code, 1):
                text = assignment.get('text', '')
                assignments_text += f"{i}. \"{text}\"\n\n"

            try:
                refinement_response: CodeRefinementOutput = AICodingUtils.make_rate_limited_llm_call(
                    llm_service=llm_service,
                    service_type="code_refinement",
                    input_data={
                        "code_name": code_name,
                        "code_description": code_data.get("description", ""),
                        "assignments_text": assignments_text,
                        "assignment_count": len(code_assignments_for_code)
                    },
                    provider=provider
                )

                if refinement_response.action.lower() == "delete":
                    print(
                        f"🗑️ Deleting code '{code_name}': {refinement_response.reasoning}")
                    codes_to_delete.add(code_name)

                elif refinement_response.action.lower() == "modify":
                    print(
                        f"✏️ Modifying code '{code_name}' -> '{refinement_response.refined_code_name}': {refinement_response.reasoning}")
                    codes_to_modify[code_name] = {
                        "new_name": refinement_response.refined_code_name,
                        "new_description": refinement_response.refined_code_description,
                        "reasoning": refinement_response.reasoning
                    }

                else:  # keep
                    print(
                        f"✅ Keeping code '{code_name}': {refinement_response.reasoning}")

            except Exception as e:
                error_msg = str(e)
                print(f"❌ Error refining code '{code_name}': {error_msg}")

                # Check if this is a rate limit error
                is_rate_limit_error = any(keyword in error_msg.lower() for keyword in [
                    'quota', 'exceeded', 'limit', 'rate', '429', 'billing', 'max attempts'
                ])

                if is_rate_limit_error:
                    print(
                        f"⚠️ Rate limit hit for code '{code_name}' - keeping unchanged")
                else:
                    print(
                        f"⚠️ Processing error for code '{code_name}' - keeping unchanged")

        # Apply changes to in-memory structures
        new_codes_dict = {}
        new_assignments = []

        for code_name, code_data in codes_dict.items():
            if code_name in codes_to_delete:
                # Mark code as deleted - don't add to new_codes_dict
                continue

            elif code_name in codes_to_modify:
                # Modify code
                modification = codes_to_modify[code_name]
                new_code_name = modification["new_name"]

                new_code_data = code_data.copy()
                new_code_data["name"] = new_code_name
                new_code_data["description"] = modification["new_description"]
                new_code_data["was_modified"] = True
                new_code_data["refinement_reasoning"] = modification["reasoning"]
                new_code_data["original_name"] = code_name

                new_codes_dict[new_code_name] = new_code_data

            else:
                # Keep unchanged
                code_data["refinement_reasoning"] = "Code kept unchanged during refinement"
                new_codes_dict[code_name] = code_data

        # Update assignments based on code changes
        for assignment in assignments:
            if assignment.get("status") == "deleted":
                continue

            code_name = assignment.get("code_name")

            if code_name in codes_to_delete:
                # Mark assignment as deleted - don't add to new_assignments
                continue

            elif code_name in codes_to_modify:
                # Update assignment with new code name
                new_assignment = assignment.copy()
                new_assignment["code_name"] = codes_to_modify[code_name]["new_name"]
                new_assignment["refined_status"] = "modified"
                new_assignment["original_code_name"] = code_name
                new_assignment["refinement_reasoning"] = codes_to_modify[code_name]["reasoning"]
                new_assignments.append(new_assignment)

            else:
                # Keep unchanged
                assignment["refined_status"] = "kept"
                new_assignments.append(assignment)

        print(
            f"✅ In-memory refinement complete: {len(new_codes_dict)} codes, {len(new_assignments)} assignments")
        return new_codes_dict, new_assignments
