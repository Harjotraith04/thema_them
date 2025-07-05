from sqlalchemy.orm import Session
from app.services.ai.llm_service import LLMService
from app.utils.rate_limiter import with_exponential_backoff, get_rate_limiter
from typing import Tuple


class AICodingUtils:

    @staticmethod
    def format_codes_for_llm(codes, include_descriptions: bool = True) -> str:
        if not codes:
            return "No codes available."

        codes_list = []
        for code in codes:
            if include_descriptions:
                codes_list.append(
                    f"- {code.name}: {code.description or 'No description provided'}")
            else:
                codes_list.append(f"- {code.name}")

        return "\n".join(codes_list)

    @staticmethod
    def find_quote_position(doc_content: str, chunk: str, quote: str, chunk_start: int) -> Tuple[int, int]:

        quote_start_in_chunk = chunk.find(quote)
        if quote_start_in_chunk != -1:
            start_idx = chunk_start + quote_start_in_chunk
            end_idx = start_idx + len(quote)
        else:
            start_idx = chunk_start
            end_idx = chunk_start + len(chunk)

        return start_idx, end_idx

    @staticmethod
    def make_rate_limited_llm_call(llm_service, service_type: str, input_data: dict, provider: str):
        """Make an LLM call with rate limiting - same retry strategy for all services"""
        service_mapping = {
            "initial_coding": llm_service.initial_coding_llm,
            "theme_generation": llm_service.theme_generation_llm,
            "deductive_coding": llm_service.deductive_coding_llm,
            "code_refinement": llm_service.code_refinement_llm,
            "code_grouping": llm_service.code_grouping_llm
        }

        llm_method = service_mapping.get(service_type)
        if not llm_method:
            raise ValueError(f"Unknown service type: {service_type}")

        # Apply consistent rate limiting to all services
        @with_exponential_backoff(provider)
        def make_call():
            return llm_method.invoke(input_data)

        return make_call()

    @staticmethod
    def get_rate_limit_status(provider: str) -> dict:
        """Get rate limit status for a provider"""
        rate_limiter = get_rate_limiter()
        return rate_limiter.get_status(provider)
