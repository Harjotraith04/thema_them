#!/usr/bin/env python3
"""
Tests for documents API endpoints using pytest
"""
import pytest
import io
import base64


@pytest.fixture
def test_project(client, auth_headers):
    """Create a test project for document operations"""
    project_data = {
        "title": "Document Test Project",
        "description": "A project for testing document functionality"
    }

    response = client.post("/api/v1/projects/",
                           json=project_data, headers=auth_headers)
    return response.json()


def test_upload_text_document(client, auth_headers, test_project):
    """Test uploading a text document"""
    project_id = test_project["id"]

    # Create a simple text file for upload
    file_content = "This is a test document content."
    file_obj = io.BytesIO(file_content.encode())
    response = client.post(
        "/api/v1/documents/",
        files={"file": ("test_document.txt", file_obj, "text/plain")},
        data={"project_id": project_id, "name": "Test Text Document"},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Text Document"
    assert "content" in data
    assert data["id"] is not None
    assert "upload_status" in data
    assert data["upload_status"] == "success"


def test_upload_file_document(client, auth_headers, test_project):
    """Test uploading a file document"""
    project_id = test_project["id"]

    # Create a simple text file for upload
    file_content = "This is a test file content."
    file_obj = io.BytesIO(file_content.encode())

    response = client.post(
        "/api/v1/documents/",
        files={"file": ("test_document.txt", file_obj, "text/plain")},
        data={"project_id": project_id, "name": "test_document.txt"},
        headers=auth_headers
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "test_document.txt"
    assert "content" in data
    assert data["id"] is not None
    assert "upload_status" in data
    assert data["upload_status"] == "success"


def test_get_document_list(client, auth_headers, test_project):
    """Test getting a list of documents for a project"""
    project_id = test_project["id"]

    # Add a couple of documents
    file_content1 = "Content for document 1"
    file_obj1 = io.BytesIO(file_content1.encode())

    file_content2 = "Content for document 2"
    file_obj2 = io.BytesIO(file_content2.encode())

    client.post(
        "/api/v1/documents/",
        files={"file": ("document1.txt", file_obj1, "text/plain")},
        data={"project_id": project_id, "name": "Document 1"},
        headers=auth_headers
    )

    client.post(
        "/api/v1/documents/",
        files={"file": ("document2.txt", file_obj2, "text/plain")},
        data={"project_id": project_id, "name": "Document 2"},
        headers=auth_headers
    )

    # Get the document list
    response = client.get(
        f"/api/v1/documents/project/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

    # Check that our documents are in the list
    doc_names = [d["name"] for d in data]
    assert "Document 1" in doc_names
    assert "Document 2" in doc_names


def test_get_document_detail(client, auth_headers, test_project):
    """Test getting document details"""
    project_id = test_project["id"]

    # Create a document first
    file_content = "This document has detailed content"
    file_obj = io.BytesIO(file_content.encode())

    create_response = client.post(
        "/api/v1/documents/",
        files={"file": ("detailed_document.txt", file_obj, "text/plain")},
        data={"project_id": project_id, "name": "Detailed Document"},
        headers=auth_headers
    )
    document_id = create_response.json()["id"]

    # Get the document details
    response = client.get(
        f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Detailed Document"
    assert "content" in data
    assert data["id"] == document_id
    assert "created_at" in data


def test_update_document(client, auth_headers, test_project):
    """Test updating a document"""
    project_id = test_project["id"]

    # Create a document first
    file_content = "Original document content"
    file_obj = io.BytesIO(file_content.encode())

    create_response = client.post(
        "/api/v1/documents/",
        files={"file": ("original_document.txt", file_obj, "text/plain")},
        data={"project_id": project_id, "name": "Original Document Title"},
        headers=auth_headers
    )
    document_id = create_response.json()["id"]

    # Update the document
    update_data = {
        "name": "Updated Document Title",
        "description": "Updated document description"
    }

    response = client.put(
        f"/api/v1/documents/{document_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]

    # Verify the update persisted
    get_response = client.get(
        f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert get_response.json()["name"] == update_data["name"]
    assert get_response.json()["description"] == update_data["description"]


def test_delete_document(client, auth_headers, test_project):
    """Test deleting a document"""
    project_id = test_project["id"]

    # Create a document first
    file_content = "This document will be deleted"
    file_obj = io.BytesIO(file_content.encode())

    create_response = client.post(
        "/api/v1/documents/",
        files={"file": ("document_to_delete.txt", file_obj, "text/plain")},
        data={"project_id": project_id, "name": "Document to Delete"},
        headers=auth_headers
    )
    document_id = create_response.json()["id"]

    # Delete the document
    response = client.delete(
        f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify it's gone
    get_response = client.get(
        f"/api/v1/documents/{document_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_get_nonexistent_document(client, auth_headers):
    """Test getting a document that doesn't exist"""
    response = client.get("/api/v1/documents/999999", headers=auth_headers)
    assert response.status_code == 404
