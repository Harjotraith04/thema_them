from sqlalchemy.orm import Session
from collections import defaultdict
from app.schemas.ai_services import CodeGroupingOutput
from app.services.ai.llm_service import LLMService
from app.services.ai.ai_coding_utils import AICodingUtils


class AICodeGroupingService:
    """Service for grouping AI-generated codes using in-memory processing"""

    @staticmethod
    def perform_code_grouping_in_memory(
        codes_dict: dict,
        assignments: list,
        llm_service: LLMService,
        provider: str
    ) -> dict:
        """Perform code grouping in memory without database operations"""
        print(
            f"🔄 Starting in-memory code grouping for {len(codes_dict)} codes")

        if len(codes_dict) < 2:
            print("⏭️ Not enough codes for grouping (need at least 2)")
            return codes_dict

        # Build code assignments map
        code_assignments = defaultdict(list)
        for assignment in assignments:
            if assignment.get("status") != "deleted":
                code_name = assignment.get("code_name")
                if code_name:
                    text = assignment.get("text", "")
                    if text:
                        code_assignments[code_name].append(text)

        # Prepare LLM input
        codes_info = {}
        for code_name, code_data in codes_dict.items():
            if code_data.get("status") != "deleted":
                codes_info[code_name] = {
                    "name": code_name,
                    "description": code_data.get("description", ""),
                }

        codes_summary, assignments_sample = AICodeGroupingService._prepare_llm_input(
            codes_info, code_assignments
        )

        try:
            grouping_response: CodeGroupingOutput = AICodingUtils.make_rate_limited_llm_call(
                llm_service=llm_service,
                service_type="code_grouping",
                input_data={
                    "codes_summary": codes_summary,
                    "assignments_sample": assignments_sample
                },
                provider=provider
            )

            # Apply grouping to in-memory codes
            groups_applied = 0
            for group in grouping_response.groups:
                print(
                    f"📋 Applying group '{group.group_name}' to codes: {group.code_names}")

                for code_name in group.code_names:
                    if code_name in codes_dict:
                        codes_dict[code_name]["group_name"] = group.group_name
                        groups_applied += 1
                        print(
                            f"✅ Applied group '{group.group_name}' to code '{code_name}'")
                    else:
                        print(f"⚠️ Code '{code_name}' not found in codes_dict")

            if grouping_response.ungrouped_codes:
                print(
                    f"📝 Ungrouped codes: {grouping_response.ungrouped_codes}")

            print(
                f"✅ In-memory grouping complete: {groups_applied} codes grouped")

        except Exception as e:
            print(f"❌ Error in code grouping: {str(e)}")
            # Continue without grouping

        return codes_dict

    @staticmethod
    def _prepare_llm_input(codes_info: dict, code_assignments: dict) -> tuple[str, str]:
        """Prepare input for the LLM grouping call"""
        codes_summary = ""
        assignments_sample = ""

        for code_name, code_info in codes_info.items():
            codes_summary += f"Code: {code_name}\n"
            codes_summary += f"Description: {code_info['description']}\n"
            codes_summary += f"Number of assignments: {len(code_assignments[code_name])}\n\n"

            # Add sample assignments (max 3 per code)
            assignments_sample += f"Sample assignments for '{code_name}':\n"
            sample_texts = code_assignments[code_name][:3]
            for i, text in enumerate(sample_texts, 1):
                assignments_sample += f"  {i}. \"{text[:100]}...\"\n"
            assignments_sample += "\n"

        return codes_summary, assignments_sample
