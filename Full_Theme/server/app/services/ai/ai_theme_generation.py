from sqlalchemy.orm import Session
from app.schemas.ai_services import ThemeOutput
from app.services.ai.llm_service import LLMService
from app.services.theme_service import ThemeService
from app.services.ai.ai_coding_validators import AICodingValidators
from app.services.ai.ai_coding_utils import AICodingUtils


class AIThemeGenerationService:
    """Service for generating themes using in-memory processing"""

    @staticmethod
    def generate_themes_in_memory(
        codebook_id: int,
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> list[dict]:
        """Generate themes in memory and immediately apply to database"""
        print(f"🚀 Starting theme generation for codebook {codebook_id}")

        llm_service = LLMService(model_name=model_name, provider=provider)

        # Validation
        if not AICodingValidators.validate_llm_service(llm_service, "theme_generation"):
            return []

        codebook = AICodingValidators.get_and_validate_codebook(
            db, codebook_id, user_id)
        if not codebook:
            return []

        # Format codes for LLM
        codes_text = AIThemeGenerationService._format_codes_for_theme_generation(
            codebook.codes)

        try:
            # Make rate-limited LLM call
            llm_response: ThemeOutput = AICodingUtils.make_rate_limited_llm_call(
                llm_service=llm_service,
                service_type="theme_generation",
                input_data={"codes_text": codes_text},
                provider=provider
            )

            # Create theme in database
            theme = ThemeService.create_theme(
                db=db,
                name=llm_response.theme_name,
                project_id=codebook.project_id,  # type: ignore
                user_id=user_id,
                description=llm_response.theme_description
            )

            # Format response
            result = {
                "id": theme.id,
                "name": theme.name,
                "description": theme.description,
                "project_id": theme.project_id,
                "user_id": theme.user_id,
                "created_at": theme.created_at.isoformat(),
                "reasoning": llm_response.reasoning,
                "related_codes": llm_response.related_codes,
                "source_codebook_id": codebook_id
            }

            print(f"✅ Successfully generated and created theme: {theme.name}")
            return [result]

        except Exception as e:
            print(f"❌ Error generating theme: {str(e)}")
            return []

    @staticmethod
    def _format_codes_for_theme_generation(codes) -> str:
        """Format codes for theme generation LLM input"""
        if not codes:
            return "No codes available for theme generation."

        codes_text = "List of codes from the codebook:\n\n"
        for code in codes:
            codes_text += f"Code: {code.name}\n"
            codes_text += f"Description: {code.description or 'No description provided'}\n\n"

        return codes_text
