import pytest
import io
from tests.conftest import client, auth_headers, test_user


@pytest.fixture
def test_project(client, auth_headers):
    """Create a test project for annotation tests"""
    project_data = {
        "title": "Test Project for Annotations",
        "description": "A test project for annotation testing"
    }
    response = client.post("/api/v1/projects/",
                           json=project_data, headers=auth_headers)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def test_document(client, auth_headers, test_project):
    """Create a test document for annotation tests"""
    project_id = test_project["id"]

    # Create a simple text file for upload
    test_content = "This is a test document for annotation testing. It needs to be long enough to create meaningful annotations."
    file_data = io.BytesIO(test_content.encode())

    files = {"file": ("test_annotation_doc.txt", file_data, "text/plain")}
    data = {"project_id": project_id}

    response = client.post("/api/v1/documents/", files=files,
                           data=data, headers=auth_headers)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def test_code(client, auth_headers, test_project):
    """Create a test code for annotation tests"""
    project_id = test_project["id"]

    code_data = {
        "name": "Test Code",
        "description": "A test code for annotations",
        "color": "#FF5733",
        "project_id": project_id
    }
    response = client.post(
        "/api/v1/codes/", json=code_data, headers=auth_headers)
    assert response.status_code == 201
    return response.json()


def test_create_annotation(client, auth_headers, test_document, test_code):
    """Test creating an annotation"""
    document_id = test_document["id"]
    code_id = test_code["id"]

    annotation_data = {
        "content": "This is a test annotation",
        "annotation_type": "COMMENT",
        "document_id": document_id,
        "code_id": code_id,
        "start_char": 8,
        "end_char": 21,
        "text_snapshot": "sample content"
    }

    response = client.post("/api/v1/annotations/",
                           json=annotation_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["document_id"] == document_id
    assert data["content"] == annotation_data["content"]
    assert data["start_char"] == annotation_data["start_char"]
    assert data["end_char"] == annotation_data["end_char"]
    assert data["text_snapshot"] == annotation_data["text_snapshot"]
    assert data["code_id"] == code_id
    assert "id" in data
    assert "created_at" in data


def test_get_annotation_list_by_document(client, auth_headers, test_document, test_code):
    """Test getting a list of annotations for a document"""
    document_id = test_document["id"]
    code_id = test_code["id"]

    # Add a couple of annotations
    annotation1 = {
        "content": "First test annotation",
        "annotation_type": "COMMENT",
        "document_id": document_id,
        "code_id": code_id,
        "start_char": 8,
        "end_char": 14,
        "text_snapshot": "sample"
    }

    annotation2 = {
        "content": "Second test annotation",
        "annotation_type": "MEMO",
        "document_id": document_id,
        "code_id": code_id,
        "start_char": 15,
        "end_char": 22,
        "text_snapshot": "content"
    }

    client.post("/api/v1/annotations/", json=annotation1, headers=auth_headers)
    client.post("/api/v1/annotations/", json=annotation2, headers=auth_headers)

    # Get the annotation list for the document using filter endpoint
    response = client.get(
        f"/api/v1/annotations/?document_id={document_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

    # Check that our annotations are in the list
    annotation_contents = [a["content"] for a in data]
    assert "First test annotation" in annotation_contents
    assert "Second test annotation" in annotation_contents


def test_get_annotation_list_by_code(client, auth_headers, test_document, test_code):
    """Test getting a list of annotations for a code"""
    document_id = test_document["id"]
    code_id = test_code["id"]

    # Add annotations
    annotation_data = {
        "content": "Test annotation for code",
        "annotation_type": "QUESTION",
        "document_id": document_id,
        "code_id": code_id,
        "start_char": 8,
        "end_char": 21,
        "text_snapshot": "sample content"
    }

    client.post("/api/v1/annotations/",
                json=annotation_data, headers=auth_headers)

    # Get annotations by code using filter endpoint
    response = client.get(
        f"/api/v1/annotations/?code_id={code_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

    # Verify the annotation is for our code
    assert data[0]["code_id"] == code_id


def test_update_annotation(client, auth_headers, test_document, test_code):
    """Test updating an annotation"""
    document_id = test_document["id"]
    code_id = test_code["id"]

    # Create an annotation first
    annotation_data = {
        "content": "Original comment",
        "annotation_type": "INSIGHT",
        "document_id": document_id,
        "code_id": code_id,
        "start_char": 8,
        "end_char": 21,
        "text_snapshot": "sample content"
    }

    create_response = client.post(
        "/api/v1/annotations/", json=annotation_data, headers=auth_headers)
    annotation_id = create_response.json()["id"]

    # Update the annotation
    update_data = {
        "content": "Updated comment",
        "annotation_type": "TODO"
    }

    response = client.put(
        f"/api/v1/annotations/{annotation_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == update_data["content"]

    # Verify the update persisted
    get_response = client.get(
        f"/api/v1/annotations/?document_id={document_id}", headers=auth_headers)
    annotations = [a for a in get_response.json() if a["id"] == annotation_id]
    assert len(annotations) == 1
    assert annotations[0]["content"] == update_data["content"]


def test_delete_annotation(client, auth_headers, test_document, test_code):
    """Test deleting an annotation"""
    document_id = test_document["id"]
    code_id = test_code["id"]

    # Create an annotation first
    annotation_data = {
        "content": "Annotation to delete",
        "annotation_type": "REVIEW",
        "document_id": document_id,
        "code_id": code_id,
        "start_char": 8,
        "end_char": 21,
        "text_snapshot": "sample content"
    }

    create_response = client.post(
        "/api/v1/annotations/", json=annotation_data, headers=auth_headers)
    annotation_id = create_response.json()["id"]

    # Count annotations before deletion
    before_response = client.get(
        f"/api/v1/annotations/?document_id={document_id}", headers=auth_headers)
    count_before = len(before_response.json())

    # Delete the annotation
    response = client.delete(
        f"/api/v1/annotations/{annotation_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify it's gone
    after_response = client.get(
        f"/api/v1/annotations/?document_id={document_id}", headers=auth_headers)
    count_after = len(after_response.json())
    assert count_after == count_before - 1

    # Make sure the specific annotation is gone
    annotation_ids = [a["id"] for a in after_response.json()]
    assert annotation_id not in annotation_ids
