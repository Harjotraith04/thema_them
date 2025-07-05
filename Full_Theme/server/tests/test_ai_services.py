#!/usr/bin/env python3
"""
Tests for AI services API endpoints
"""
import pytest
from unittest.mock import patch, MagicMock


class TestAIServicesAPI:
    """Test class for AI services API endpoints"""

    @pytest.fixture
    def test_project(self, client, auth_headers):
        """Create a test project for AI service operations"""
        project_data = {
            "title": "AI Services Test Project",
            "description": "A project for testing AI functionality",
            "research_details": {
                "research_question": "How do users interact with AI systems?",
                "methodology": "qualitative interviews",
                "participants": "20 adults"
            }
        }

        response = client.post("/api/v1/projects/",
                               json=project_data, headers=auth_headers)
        assert response.status_code == 201
        return response.json()

    @pytest.fixture
    def test_document(self, client, auth_headers, test_project):
        """Create a test document for AI service operations"""
        project_id = test_project["id"]

        # Create document content
        content = """This is a sample document for AI analysis.
The participants expressed frustration with the current healthcare system.
Many mentioned difficulties in communicating with their doctors.
Some felt that their concerns were not being heard.
The emotional impact of these experiences was significant.
Patients reported feeling anxious and stressed.
Support from family and friends was crucial during difficult times.
Access to healthcare services remained a major challenge.
Trust in healthcare providers varied greatly among participants.
Overall, the healthcare experience was described as overwhelming."""

        # Upload as text file
        import io
        file_obj = io.BytesIO(content.encode())

        response = client.post(
            "/api/v1/documents/",
            files={"file": ("test_document.txt", file_obj, "text/plain")},
            data={"project_id": project_id, "name": "Test Document for AI"},
            headers=auth_headers
        )
        assert response.status_code == 201
        return response.json()

    @pytest.fixture
    def test_codebook(self, client, auth_headers, test_project):
        """Create a test codebook with codes"""
        project_id = test_project["id"]

        # Create codebook
        codebook_data = {
            "name": "Test Codebook",
            "description": "Codebook for testing AI services",
            "project_id": project_id
        }

        response = client.post("/api/v1/codebooks/",
                               json=codebook_data, headers=auth_headers)
        assert response.status_code == 201
        codebook = response.json()

        # Add some codes to the codebook
        code_data_list = [
            {
                "name": "Communication Issues",
                "description": "Problems with provider-patient communication",
                "project_id": project_id,
                "codebook_id": codebook["id"]
            },
            {
                "name": "Emotional Response",
                "description": "Patient emotional reactions to healthcare experiences",
                "project_id": project_id,
                "codebook_id": codebook["id"]
            },
            {
                "name": "Support Systems",
                "description": "References to family, friends, or community support",
                "project_id": project_id,
                "codebook_id": codebook["id"]
            },
            {
                "name": "Access Barriers",
                "description": "Difficulties accessing healthcare services",
                "project_id": project_id,
                "codebook_id": codebook["id"]
            }
        ]

        for code_data in code_data_list:
            response = client.post("/api/v1/codes/",
                                   json=code_data, headers=auth_headers)
            assert response.status_code == 201

        return codebook

    @patch('app.services.ai.llm_service.LLMService')
    def test_initial_coding_endpoint(self, mock_llm_service, client, auth_headers, test_document, test_project):
        """Test the initial coding API endpoint"""
        # Mock the LLM service
        mock_llm_instance = MagicMock()
        mock_llm_service.return_value = mock_llm_instance
        mock_llm_instance.initial_coding_llm = MagicMock()

        # Mock the LLM response
        mock_response = MagicMock()
        mock_response.reasoning = "This text discusses communication problems"
        mock_response.code = "Communication Issues"
        mock_response.quote = "difficulties in communicating with their doctors"
        mock_response.code_description = "Problems with provider-patient communication"
        mock_response.is_new_code = True
        mock_response.existing_code_rationale = ""

        mock_llm_instance.initial_coding_llm.invoke.return_value = mock_response

        # Mock the bulk_code_assignment service
        with patch('app.services.code_assignment_service.CodeAssignmentService.bulk_code_assignment') as mock_bulk_assignment:
            mock_bulk_assignment.return_value = {
                "results": [{"id": 1, "code_name": "Communication Issues"}],
                "summary": "1 code assignment created"
            }

            # Mock the codebook service for AI session codebook
            with patch('app.services.codebook_service.CodebookService.get_or_create_ai_session_codebook') as mock_codebook:
                mock_ai_codebook = MagicMock()
                mock_ai_codebook.id = 123
                mock_ai_codebook.name = "AI Session - Initial Coding"
                mock_ai_codebook.description = "AI-generated codes from initial coding session"
                mock_ai_codebook.is_ai_generated = True
                mock_ai_codebook.finalized = False
                mock_ai_codebook.project_id = test_project["id"]
                mock_ai_codebook.created_at.isoformat.return_value = "2025-07-02T10:30:00Z"
                mock_codebook.return_value = mock_ai_codebook

                # Mock the code service to bypass database validation
                with patch('app.services.code_service.CodeService.create_code') as mock_create_code:
                    mock_code = MagicMock()
                    mock_code.id = 1
                    mock_code.name = "Test Code"
                    mock_code.description = "Test Description"
                    mock_code.color = "#3B82F6"
                    mock_code.project_id = test_project["id"]
                    mock_code.codebook_id = 123
                    mock_code.is_auto_generated = True
                    mock_code.group_name = None
                    mock_code.created_at = "2025-07-02T10:30:00Z"
                    mock_create_code.return_value = mock_code

                    # Mock bulk insert for assignments
                    with patch('sqlalchemy.orm.Session.bulk_insert_mappings') as mock_bulk_insert:
                        mock_bulk_insert.return_value = None

                        # Test the endpoint
                        request_data = {
                            "document_ids": [test_document["id"]]
                        }

                        response = client.post("/api/v1/ai/initial-coding",
                                               json=request_data, headers=auth_headers)

                        if response.status_code != 200:
                            print(f"Response status: {response.status_code}")
                            print(f"Response body: {response.text}")

                        assert response.status_code == 200
                        result = response.json()

                        # Updated assertions for new response structure
                        assert isinstance(result, dict)
                        assert "ai_session_codebook" in result
                        assert "results" in result
                        assert "summary" in result

                        # Check codebook details
                        codebook = result["ai_session_codebook"]
                        assert codebook["id"] == 123
                        assert codebook["is_ai_generated"] == True
                        assert codebook["finalized"] == False

                        print(f"Initial coding result: {result}")

    @patch('app.services.ai.llm_service.LLMService')
    def test_deductive_coding_endpoint(self, mock_llm_service, client, auth_headers, test_document, test_codebook, test_project):
        """Test the deductive coding API endpoint"""
        # Mock the LLM service
        mock_llm_instance = MagicMock()
        mock_llm_service.return_value = mock_llm_instance
        mock_llm_instance.deductive_coding_llm = MagicMock()

        # Mock the LLM response
        mock_response = MagicMock()
        mock_response.reasoning = "The text mentions communication difficulties and emotional impact"
        mock_response.assigned_codes = [
            "Communication Issues", "Emotional Response"]
        mock_response.quote = "expressed frustration with the current healthcare system"
        mock_response.confidence_scores = [0.9, 0.8]
        mock_response.rationale = "Text clearly indicates both communication problems and emotional reactions"

        mock_llm_instance.deductive_coding_llm.invoke.return_value = mock_response

        # Mock the bulk_code_assignment service
        with patch('app.services.code_assignment_service.CodeAssignmentService.bulk_code_assignment') as mock_bulk_assignment:
            mock_bulk_assignment.return_value = {
                "results": [
                    {"id": 1, "code_name": "Communication Issues"},
                    {"id": 2, "code_name": "Emotional Response"}
                ],
                "summary": "2 code assignments created"
            }

            # Mock the codebook service for AI session codebook
            with patch('app.services.codebook_service.CodebookService.get_or_create_ai_session_codebook') as mock_codebook:
                mock_ai_codebook = MagicMock()
                mock_ai_codebook.id = 124
                mock_ai_codebook.name = "AI Session - Deductive Coding"
                mock_ai_codebook.description = "AI-generated codes from deductive coding session"
                mock_ai_codebook.is_ai_generated = True
                mock_ai_codebook.finalized = False
                mock_ai_codebook.project_id = test_project["id"]
                mock_ai_codebook.created_at.isoformat.return_value = "2025-07-02T10:30:00Z"
                mock_codebook.return_value = mock_ai_codebook

                # Test the endpoint
                request_data = {
                    "document_ids": [test_document["id"]],
                    "codebook_id": test_codebook["id"]
                }

                response = client.post("/api/v1/ai/deductive-coding",
                                       json=request_data, headers=auth_headers)

                if response.status_code != 200:
                    print(f"Response status: {response.status_code}")
                    print(f"Response body: {response.text}")

                assert response.status_code == 200
                result = response.json()

                # Updated assertions for new response structure
                assert isinstance(result, dict)
                assert "ai_session_codebook" in result
                assert "results" in result
                assert "summary" in result

                # Check codebook details
                codebook = result["ai_session_codebook"]
                assert codebook["id"] == 124
                assert codebook["is_ai_generated"] == True
                assert codebook["finalized"] == False

                print(f"Deductive coding result: {result}")

    @patch('app.services.ai.llm_service.LLMService')
    def test_generate_themes_endpoint(self, mock_llm_service, client, auth_headers, test_codebook):
        """Test the theme generation API endpoint"""
        # Mock the LLM service
        mock_llm_instance = MagicMock()
        mock_llm_service.return_value = mock_llm_instance
        mock_llm_instance.theme_generation_llm = MagicMock()

        # Mock the LLM response
        mock_response = MagicMock()
        mock_response.reasoning = "These codes relate to healthcare challenges"
        mock_response.theme_name = "Healthcare System Challenges"
        mock_response.theme_description = "Overarching challenges in healthcare delivery and patient experience"
        mock_response.related_codes = [
            "Communication Issues", "Emotional Response", "Access Barriers"]

        mock_llm_instance.theme_generation_llm.invoke.return_value = mock_response

        # Mock the theme service
        with patch('app.services.theme_service.ThemeService.create_theme') as mock_create_theme:
            mock_theme = MagicMock()
            mock_theme.id = 1
            mock_theme.name = "Healthcare System Challenges"
            mock_theme.description = "Overarching challenges in healthcare delivery and patient experience"
            mock_theme.project_id = test_codebook["project_id"]
            mock_theme.user_id = 1
            mock_theme.created_at.isoformat.return_value = "2025-06-29T12:00:00"

            mock_create_theme.return_value = mock_theme

            # Test the endpoint
            request_data = {
                "codebook_id": test_codebook["id"]
            }

            response = client.post("/api/v1/ai/generate-themes",
                                   json=request_data, headers=auth_headers)

            assert response.status_code == 200
            result = response.json()
            assert isinstance(result, list)
            assert len(result) == 1
            assert result[0]["name"] == "Healthcare System Challenges"
            print(f"Theme generation result: {result}")

    def test_ai_endpoints_authentication(self, client):
        """Test that AI endpoints require authentication"""
        endpoints = [
            ("/api/v1/ai/initial-coding", {"document_ids": [1]}),
            ("/api/v1/ai/deductive-coding",
             {"document_ids": [1], "codebook_id": 1}),
            ("/api/v1/ai/generate-themes", {"codebook_id": 1})
        ]

        for endpoint, data in endpoints:
            response = client.post(endpoint, json=data)
            assert response.status_code == 401  # Unauthorized
            print(f"Authentication test passed for {endpoint}")

    def test_ai_endpoints_validation(self, client, auth_headers):
        """Test that AI endpoints validate input data"""
        # Test missing required fields
        test_cases = [
            ("/api/v1/ai/initial-coding", {}),  # Missing document_ids
            # Missing codebook_id
            ("/api/v1/ai/deductive-coding", {"document_ids": [1]}),
            ("/api/v1/ai/generate-themes", {}),  # Missing codebook_id
        ]

        for endpoint, data in test_cases:
            response = client.post(endpoint, json=data, headers=auth_headers)
            assert response.status_code == 422  # Validation error
            print(f"Validation test passed for {endpoint}")
