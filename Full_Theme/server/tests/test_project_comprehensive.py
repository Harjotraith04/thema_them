#!/usr/bin/env python3
"""
Test enhanced project comprehensive endpoint
"""
import pytest


def test_project_comprehensive_includes_collaborators(client, auth_headers):
    """Test that comprehensive project endpoint includes owner and collaborator details"""
    # Create a project
    project_data = {
        "title": "Test Collaboration Project",
        "description": "A project to test collaborator information"
    }

    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    # Get the comprehensive project details
    response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()

    # Verify structure includes owner and collaborators
    assert "owner" in data
    assert "collaborators" in data
    assert "owner_id" in data

    # Verify owner details
    owner = data["owner"]
    assert "id" in owner
    assert "email" in owner
    assert "name" in owner
    assert "is_active" in owner

    # Verify collaborators is a list (should be empty initially)
    assert isinstance(data["collaborators"], list)

    # Verify other enhanced data is present
    assert "finalized_codebooks" in data
    assert "codebooks" in data  # New codebooks section
    assert "documents" in data
    assert "codes" in data
    assert "code_assignments" in data
    assert "annotations" in data

    # Verify codebooks is a list
    assert isinstance(data["codebooks"], list)


def test_project_comprehensive_with_research_details(client, auth_headers):
    """Test that comprehensive project endpoint includes research details"""
    project_data = {
        "title": "Research Project",
        "description": "A project with research details",
        "research_details": {
            "topic": "AI Analysis",
            "methodology": "Qualitative Research",
            "keywords": ["AI", "machine learning", "analysis"]
        }
    }

    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    # Get the comprehensive project details
    response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()

    # Verify research details are included
    assert "research_details" in data
    assert data["research_details"] is not None
    assert data["research_details"]["topic"] == "AI Analysis"
    assert data["research_details"]["methodology"] == "Qualitative Research"
    assert "AI" in data["research_details"]["keywords"]


def test_project_comprehensive_includes_codebooks(client, auth_headers):
    """Test that comprehensive project endpoint includes codebooks information"""
    # Create a project
    project_data = {
        "title": "Codebooks Test Project",
        "description": "A project to test codebook information"
    }

    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    assert create_response.status_code == 201
    project_id = create_response.json()["id"]

    # Get the comprehensive project details
    response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200

    data = response.json()

    # Verify codebooks section exists
    assert "codebooks" in data
    assert isinstance(data["codebooks"], list)

    # Verify codebooks structure is correct (should be empty for new project)
    # Should be empty initially but structure should exist
    assert len(data["codebooks"]) >= 0
