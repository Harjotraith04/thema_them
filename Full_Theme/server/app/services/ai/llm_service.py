from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.runnables import Runnable
from app.schemas.ai_services import CodeOutput, MultipleCodesOutput, ThemeOutput, DeductiveCodingOutput, CodeRefinementOutput, CodeGroupingOutput
from app.prompts.initial_coding import system_message
from app.prompts.theme_generation import system_message as theme_system_message
from app.prompts.deductive_coding import system_message as deductive_system_message
from app.prompts.code_refinement import system_message as refinement_system_message
from app.prompts.code_grouping import system_message as grouping_system_message
from app.utils.llm_provider_api_key import get_llm_provider_api_key


class LLMService:
    def __init__(self, model_name: str, provider: str = "google_genai"):
        self.model_name = model_name
        self.provider = provider
        self.llm = init_chat_model(
            model=self.model_name,
            model_provider=self.provider,
            api_key=get_llm_provider_api_key(self.provider),
        )

        # Initial coding prompt with enhanced context
        initial_coding_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(system_message),
                HumanMessagePromptTemplate.from_template("""
Research Context:
{research_context}

Existing Codes (use these if they fit, or create new ones):
{existing_codes}

Text to Analyze:
{text}
"""),
            ]
        )
        self.initial_coding_llm: Runnable = (
            initial_coding_prompt |
            self.llm.with_structured_output(MultipleCodesOutput)
        )

        # Theme generation prompt
        theme_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(
                    theme_system_message),
                HumanMessagePromptTemplate.from_template("{codes_text}"),
            ]
        )
        self.theme_generation_llm: Runnable = (
            theme_prompt |
            self.llm.with_structured_output(ThemeOutput)
        )

        # Deductive coding prompt
        deductive_coding_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(
                    deductive_system_message),
                HumanMessagePromptTemplate.from_template("""
Research Context:
{research_context}

Available Codes from Codebook:
{available_codes}

Text to Analyze:
{text}
"""),
            ]
        )
        self.deductive_coding_llm: Runnable = (
            deductive_coding_prompt |
            self.llm.with_structured_output(DeductiveCodingOutput)
        )

        # Code refinement prompt
        refinement_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(
                    refinement_system_message),
                HumanMessagePromptTemplate.from_template("""
Code to Review:
Name: {code_name}
Description: {code_description}

All Text Assignments for this Code:
{assignments_text}

Total number of assignments: {assignment_count}
"""),
            ]
        )
        self.code_refinement_llm: Runnable = (
            refinement_prompt |
            self.llm.with_structured_output(CodeRefinementOutput)
        )

        # Code grouping prompt
        grouping_prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(
                    grouping_system_message),
                HumanMessagePromptTemplate.from_template("""
Codes to Group:
{codes_summary}

Sample assignments for context:
{assignments_sample}
"""),
            ]
        )
        self.code_grouping_llm: Runnable = (
            grouping_prompt |
            self.llm.with_structured_output(CodeGroupingOutput)
        )
