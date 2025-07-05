#!/usr/bin/env python3
"""
Tests for code assignments API endpoints using pytest
"""
import pytest
import io


@pytest.fixture
def test_project(client, auth_headers):
    """Create a test project for code assignment operations"""
    project_data = {
        "title": "Code Assignment Test Project",
        "description": "A project for testing code assignment functionality"
    }

    response = client.post("/api/v1/projects/",
                           json=project_data, headers=auth_headers)
    return response.json()


@pytest.fixture
def test_document(client, auth_headers, test_project):
    """Create a test document for code assignment operations"""
    project_id = test_project["id"]

    # Create a simple text file for upload
    test_content = "This is sample content for code assignment testing."
    file_data = io.BytesIO(test_content.encode())

    files = {"file": ("test_code_assignment_doc.txt", file_data, "text/plain")}
    data = {"project_id": project_id}

    response = client.post("/api/v1/documents/", files=files,
                           data=data, headers=auth_headers)
    return response.json()


@pytest.fixture
def test_code(client, auth_headers, test_project):
    """Create a test code for code assignment operations"""
    project_id = test_project["id"]

    code_data = {
        "name": "Test Code",
        "description": "A test code for code assignments",
        "project_id": project_id,
        "color": "#FF5733"
    }

    response = client.post(
        "/api/v1/codes/", json=code_data, headers=auth_headers)
    return response.json()


def test_create_code_assignment(client, auth_headers, test_document, test_code):
    """Test creating a code assignment"""
    document_id = test_document["id"]

    assignment_data = {
        "document_id": document_id,
        "text": "sample content",
        "start_char": 8,
        "end_char": 21,
        "code_name": "Test Assignment Code",
        "code_description": "A code created through assignment",
        "code_color": "#FF5733"
    }

    response = client.post("/api/v1/code-assignments/assign",
                           json=assignment_data, headers=auth_headers)
    assert response.status_code == 200  # API returns 200, not 201
    data = response.json()
    assert "code_assignment" in data
    assert "code" in data
    assert data["assignment_status"] == "success"
    code_assignment = data["code_assignment"]
    assert code_assignment["document_id"] == document_id
    assert code_assignment["text"] == assignment_data["text"]
    assert code_assignment["start_char"] == assignment_data["start_char"]
    assert code_assignment["end_char"] == assignment_data["end_char"]


def test_get_code_assignments_by_document(client, auth_headers, test_project, test_document):
    """Test getting code assignments for a document"""
    project_id = test_project["id"]
    document_id = test_document["id"]

    # Create a code assignment first
    assignment_data = {
        "document_id": document_id,
        "text": "test content",
        "start_char": 0,
        "end_char": 12,
        "code_name": "Document Test Code",
        "code_description": "A code for document testing",
        "code_color": "#00FF00"
    }

    client.post("/api/v1/code-assignments/assign",
                json=assignment_data, headers=auth_headers)

    # Get code assignments for the document
    response = client.get(
        f"/api/v1/code-assignments/document/{document_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["document_id"] == document_id


def test_get_code_assignments_by_code(client, auth_headers, test_project, test_code):
    """Test that multiple code assignments can use the same code"""
    project_id = test_project["id"]
    code_name = test_code["name"]

    # Create a couple of documents
    doc1_content = "Content for document 1"
    doc1_file = io.BytesIO(doc1_content.encode())
    doc1_files = {"file": ("document1.txt", doc1_file, "text/plain")}
    doc1_data = {"project_id": project_id}

    doc2_content = "Content for document 2"
    doc2_file = io.BytesIO(doc2_content.encode())
    doc2_files = {"file": ("document2.txt", doc2_file, "text/plain")}
    doc2_data = {"project_id": project_id}

    doc1_response = client.post(
        "/api/v1/documents/", files=doc1_files, data=doc1_data, headers=auth_headers)
    doc1_id = doc1_response.json()["id"]

    doc2_response = client.post(
        "/api/v1/documents/", files=doc2_files, data=doc2_data, headers=auth_headers)
    doc2_id = doc2_response.json()["id"]

    # Create code assignments using the same code name
    assignment1_data = {
        "document_id": doc1_id,
        "text": "Content for",
        "start_char": 0,
        "end_char": 11,
        "code_name": code_name,
        "code_description": "Using existing code"
    }

    assignment2_data = {
        "document_id": doc2_id,
        "text": "Content for",
        "start_char": 0,
        "end_char": 11,
        "code_name": code_name,
        "code_description": "Using existing code"
    }

    resp1 = client.post("/api/v1/code-assignments/assign",
                        json=assignment1_data, headers=auth_headers)
    resp2 = client.post("/api/v1/code-assignments/assign",
                        json=assignment2_data, headers=auth_headers)

    # Verify both assignments were created successfully
    assert resp1.status_code == 200
    # Check that both assignments reference the same code
    assert resp2.status_code == 200
    code1_id = resp1.json()["code"]["id"]
    code2_id = resp2.json()["code"]["id"]
    assert code1_id == code2_id  # Should be the same code since same name used


def test_delete_code_assignment(client, auth_headers, test_document, test_code):
    """Test deleting a code assignment"""
    document_id = test_document["id"]

    # Create a code assignment
    assignment_data = {
        "document_id": document_id,
        "text": "sample text",
        "start_char": 5,
        "end_char": 16,
        "code_name": "Delete Test Code",
        "code_description": "A code for delete testing"
    }

    create_response = client.post(
        "/api/v1/code-assignments/assign", json=assignment_data, headers=auth_headers)
    assignment_id = create_response.json()["code_assignment"]["id"]

    # Delete the code assignment
    response = client.delete(
        f"/api/v1/code-assignments/{assignment_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify it's gone by checking the document's code assignments
    get_response = client.get(
        f"/api/v1/code-assignments/document/{document_id}", headers=auth_headers)
    assignment_ids = [a["id"] for a in get_response.json()]
    assert assignment_id not in assignment_ids
