from sqlalchemy.orm import Session
from app.schemas.ai_services import MultipleCodesOutput, DeductiveCodingOutput
from app.services.ai.llm_service import LLMService
from app.services.codebook_service import CodebookService
from app.services.ai.ai_coding_validators import AICodingValidators
from app.services.ai.ai_coding_utils import AICodingUtils
from app.utils.chunks import create_chunks


class AICodeGenerationService:
    """Service for generating AI-based code assignments using in-memory processing"""

    @staticmethod
    def generate_initial_codes_in_memory(
        document_ids: list[int],
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> dict:
        """Generate initial codes and assignments, keeping everything in memory"""
        print(
            f"🚀 Starting AI code generation for {len(document_ids)} documents (in-memory)")

        llm_service = LLMService(model_name=model_name, provider=provider)

        # Validation (still need to read from DB)
        try:
            documents = AICodingValidators.get_and_validate_documents(
                db, document_ids, user_id)
            if not AICodingValidators.validate_llm_service(llm_service, "initial_coding"):
                return AICodeGenerationService._create_empty_response(None)

            # Get project and research context
            project, research_context = AICodingValidators.get_project_and_research_context(
                db, documents[0].project_id, user_id
            )
            if not project:
                return AICodeGenerationService._create_empty_response(None)

            # Create AI session codebook (this needs to be in DB)
            ai_session_codebook = CodebookService.get_or_create_ai_session_codebook(
                db=db,
                user_id=user_id,
                project_id=documents[0].project_id,  # type: ignore
                session_type="AI_initial_coding"
            )

            # Get existing codes context
            existing_codes = AICodingValidators.get_existing_codes(
                db, documents[0].project_id, user_id)  # type: ignore
            existing_codes_text = AICodingUtils.format_codes_for_llm(
                existing_codes)

            # Process documents and generate code requests (in-memory)
            codes_dict = {}  # code_name -> code_data
            assignments = []  # list of assignment_data

            for document in documents:
                print(f"Processing document ID: {document.id}")

                chunks = create_chunks(str(document.content), chunk_size=4000)
                print(
                    f"Created {len(chunks)} chunks for document {document.id}")

                for chunk_idx, chunk in enumerate(chunks):
                    chunk_num = chunk_idx + 1
                    print(
                        f"Processing chunk {chunk_num}/{len(chunks)} for document {document.id}")

                    try:
                        coding_response: MultipleCodesOutput = AICodingUtils.make_rate_limited_llm_call(
                            llm_service=llm_service,
                            service_type="initial_coding",
                            input_data={
                                "text": chunk,
                                "research_context": research_context,
                                "existing_codes": existing_codes_text
                            },
                            provider=provider
                        )

                        print(f"✅ Chunk {chunk_num} succeeded")
                        print(
                            f"LLM Response - Found {len(coding_response.codes)} codes in chunk")

                        # Process each code (in-memory)
                        for code_output in coding_response.codes:
                            code_name = code_output.code

                            # Add code to in-memory dict
                            if code_name not in codes_dict:
                                codes_dict[code_name] = {
                                    "name": code_name,
                                    "description": code_output.code_description or f"Auto-created code: {code_name}",
                                    "color": "#3B82F6",
                                    "project_id": document.project_id,
                                    "is_auto_generated": True,
                                    "status": "created"
                                }
                                print(f"Code: {code_name}, Is new: True")
                            else:
                                print(f"Code: {code_name}, Is new: False")

                            # Add assignment to in-memory list
                            quote = code_output.quote
                            start_char = chunk.find(quote) if quote else 0
                            end_char = start_char + \
                                len(quote) if quote else len(chunk)

                            assignments.append({
                                "document_id": document.id,
                                "code_name": code_name,
                                "start_char": start_char,
                                "end_char": end_char,
                                "text": quote or chunk[:100] + "...",
                                "confidence": code_output.confidence,
                                "status": "created"
                            })

                    except Exception as e:
                        print(
                            f"❌ Error processing chunk {chunk_num}: {str(e)}")
                        continue

            print(
                f"Generated {len(assignments)} assignments for {len(codes_dict)} unique codes (in-memory)")

            return {
                "results": assignments,  # For compatibility with main service
                "codes_dict": codes_dict,
                "assignments": assignments,
                "ai_session_codebook": ai_session_codebook,
                "summary": {
                    "total_requests": len(assignments),
                    "total_codes": len(codes_dict),
                    "successful_assignments": len(assignments),
                    "codes_created": len(codes_dict),
                    "errors": []
                }
            }

        except Exception as e:
            print(f"Error in in-memory code generation: {str(e)}")
            return AICodeGenerationService._create_empty_response(ai_session_codebook)

    @staticmethod
    def generate_deductive_codes_in_memory(
        document_ids: list[int],
        codebook_id: int,
        db: Session,
        user_id: int,
        model_name: str = "gemini-2.0-flash",
        provider: str = "google_genai"
    ) -> dict:
        """Generate deductive codes and assignments, keeping everything in memory"""
        print(
            f"🚀 Starting deductive coding for {len(document_ids)} documents (in-memory)")

        llm_service = LLMService(model_name=model_name, provider=provider)

        # Validation
        documents = AICodingValidators.get_and_validate_documents(
            db, document_ids, user_id)
        if not AICodingValidators.validate_llm_service(llm_service, "deductive_coding"):
            return AICodeGenerationService._create_empty_response(None)

        codebook = AICodingValidators.get_and_validate_codebook(
            db, codebook_id, user_id)
        if not codebook:
            return AICodeGenerationService._create_empty_response(None)

        # Get project and research context
        project, research_context = AICodingValidators.get_project_and_research_context(
            db, documents[0].project_id, user_id  # type: ignore
        )
        if not project:
            return AICodeGenerationService._create_empty_response(None)

        # Create AI session codebook (this needs to be in DB)
        ai_session_codebook = CodebookService.get_or_create_ai_session_codebook(
            db=db,
            user_id=user_id,
            project_id=documents[0].project_id,  # type: ignore
            session_type="AI_deductive_coding"
        )

        # Process documents for deductive coding (in-memory)
        codes_dict = {}  # code_name -> code_data
        assignments = []  # list of assignment_data

        # Pre-populate codes_dict with existing codes from the codebook
        for code in codebook.codes:
            codes_dict[code.name] = {
                "name": code.name,
                "description": code.description,
                "color": code.color,
                "project_id": code.project_id,
                "is_auto_generated": False,  # These are existing codes
                "status": "existing"
            }

        for document in documents:
            print(f"Processing document ID: {document.id}")

            chunks = create_chunks(str(document.content), chunk_size=4000)
            print(f"Created {len(chunks)} chunks for document {document.id}")

            for chunk_idx, chunk in enumerate(chunks):
                chunk_num = chunk_idx + 1
                print(
                    f"Processing chunk {chunk_num}/{len(chunks)} for document {document.id}")

                try:
                    # Format codes for LLM
                    codes_text = "\n".join(
                        [f"- {code.name}: {code.description}" for code in codebook.codes])

                    deductive_response: DeductiveCodingOutput = AICodingUtils.make_rate_limited_llm_call(
                        llm_service=llm_service,
                        service_type="deductive_coding",
                        input_data={
                            "text": chunk,
                            "research_context": research_context,
                            "available_codes": codes_text
                        },
                        provider=provider
                    )

                    print(f"✅ Chunk {chunk_num} succeeded")
                    print(
                        f"LLM Response - Found {len(deductive_response.assigned_codes)} code assignments in chunk")

                    # Process each assigned code (in-memory)
                    for i, code_name in enumerate(deductive_response.assigned_codes):
                        if code_name in codes_dict:
                            # Calculate character positions
                            quote = deductive_response.quote
                            start_char = chunk.find(quote) if quote else 0
                            end_char = start_char + \
                                len(quote) if quote else len(chunk)

                            # Get confidence score if available
                            confidence = 75  # default
                            if (hasattr(deductive_response, 'confidence_scores') and
                                deductive_response.confidence_scores and
                                    i < len(deductive_response.confidence_scores)):
                                confidence = int(
                                    deductive_response.confidence_scores[i] * 100)

                            assignments.append({
                                "document_id": document.id,
                                "code_name": code_name,
                                "start_char": start_char,
                                "end_char": end_char,
                                "text": quote or chunk[:100] + "...",
                                "confidence": confidence,
                                "status": "created"
                            })

                            print(f"Added assignment for code: {code_name}")

                except Exception as e:
                    print(f"❌ Error processing chunk {chunk_num}: {str(e)}")
                    continue

        print(
            f"Generated {len(assignments)} assignments for {len(codes_dict)} codes (in-memory)")

        return {
            "results": assignments,  # For compatibility
            "codes_dict": codes_dict,
            "assignments": assignments,
            "ai_session_codebook": ai_session_codebook,
            "summary": {
                "total_requests": len(assignments),
                "total_codes": len(codes_dict),
                "successful_assignments": len(assignments),
                "codes_created": 0,  # No new codes created in deductive coding
                "errors": []
            }
        }

    # Helper methods
    @staticmethod
    def _create_empty_response(ai_session_codebook) -> dict:
        if ai_session_codebook is None:
            return {"ai_session_codebook": None, "results": [], "summary": {}}

        return {
            "ai_session_codebook": {
                "id": ai_session_codebook.id,
                "name": ai_session_codebook.name,
                "description": ai_session_codebook.description,
                "is_ai_generated": ai_session_codebook.is_ai_generated,
                "finalized": ai_session_codebook.finalized,
                "project_id": ai_session_codebook.project_id,
                "created_at": ai_session_codebook.created_at.isoformat() if hasattr(ai_session_codebook.created_at, 'isoformat') else str(ai_session_codebook.created_at)
            },
            "results": [],
            "summary": {}
        }
