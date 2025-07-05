#!/usr/bin/env python3
"""
Tests for codes API endpoints using pytest
"""
import pytest


@pytest.fixture
def test_project(client, auth_headers):
    """Create a test project for code operations"""
    project_data = {
        "title": "Code Test Project",
        "description": "A project for testing code functionality"
    }

    response = client.post("/api/v1/projects/",
                           json=project_data, headers=auth_headers)
    return response.json()


def test_create_code(client, auth_headers, test_project):
    """Test creating a code"""
    project_id = test_project["id"]

    code_data = {
        "name": "Test Code",
        "description": "A test code for pytest",
        "project_id": project_id,        "color": "#FF5733"
    }

    response = client.post(
        "/api/v1/codes/", json=code_data, headers=auth_headers)
    assert response.status_code == 201  # API correctly returns 201 for creation
    data = response.json()
    assert data["name"] == code_data["name"]
    assert data["description"] == code_data["description"]
    assert data["project_id"] == project_id
    assert data["color"] == code_data["color"]
    assert "id" in data
    assert "created_at" in data


def test_get_code_list(client, auth_headers, test_project):
    """Test getting a list of codes for a project"""
    project_id = test_project["id"]

    # Add a couple of codes
    code1 = {
        "name": "Code 1",
        "description": "First test code",
        "project_id": project_id,
        "color": "#FF5733"
    }

    code2 = {
        "name": "Code 2",
        "description": "Second test code",
        "project_id": project_id,
        "color": "#33FF57"
    }

    client.post("/api/v1/codes/", json=code1, headers=auth_headers)
    client.post("/api/v1/codes/", json=code2, headers=auth_headers)

    # Get the code list
    response = client.get(
        f"/api/v1/codes/project/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

    # Check that our codes are in the list
    code_names = [c["name"] for c in data]
    assert "Code 1" in code_names
    assert "Code 2" in code_names


def test_code_appears_in_project_list(client, auth_headers, test_project):
    """Test that created codes appear in the project's code list"""
    project_id = test_project["id"]

    # Create a code first
    code_data = {
        "name": "Detailed Code",
        "description": "A code with details",
        "project_id": project_id,
        "color": "#3357FF"
    }

    create_response = client.post(
        "/api/v1/codes/", json=code_data, headers=auth_headers)
    code_id = create_response.json()["id"]

    # Get the project's codes
    response = client.get(
        f"/api/v1/codes/project/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    codes = response.json()

    # Find our code in the list
    created_code = next((c for c in codes if c["id"] == code_id), None)
    assert created_code is not None
    assert created_code["name"] == code_data["name"]
    assert created_code["description"] == code_data["description"]
    assert created_code["project_id"] == project_id
    assert created_code["color"] == code_data["color"]


def test_update_code(client, auth_headers, test_project):
    """Test updating a code"""
    project_id = test_project["id"]

    # Create a code first
    code_data = {
        "name": "Original Code Name",
        "description": "Original code description",
        "project_id": project_id,
        "color": "#FFFFFF"
    }

    create_response = client.post(
        "/api/v1/codes/", json=code_data, headers=auth_headers)
    code_id = create_response.json()["id"]

    # Update the code
    update_data = {
        "name": "Updated Code Name",
        "description": "Updated code description",
        "color": "#000000"}

    response = client.put(
        f"/api/v1/codes/{code_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["description"] == update_data["description"]
    assert data["color"] == update_data["color"]

    # Verify the update persisted by checking the project's code list
    project_codes_response = client.get(
        f"/api/v1/codes/project/{project_id}", headers=auth_headers)
    codes = project_codes_response.json()
    updated_code = next((c for c in codes if c["id"] == code_id), None)
    assert updated_code is not None
    assert updated_code["name"] == update_data["name"]
    assert updated_code["color"] == update_data["color"]


def test_delete_code(client, auth_headers, test_project):
    """Test deleting a code"""
    project_id = test_project["id"]

    # Create a code first
    code_data = {
        "name": "Code to Delete",
        "description": "This code will be deleted",
        "project_id": project_id,
        "color": "#FF0000"
    }

    create_response = client.post(
        "/api/v1/codes/", json=code_data, headers=auth_headers)
    code_id = create_response.json()["id"]    # Delete the code
    response = client.delete(f"/api/v1/codes/{code_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify it's gone by checking the project's code list
    project_codes_response = client.get(
        f"/api/v1/codes/project/{project_id}", headers=auth_headers)
    codes = project_codes_response.json()
    deleted_code = next((c for c in codes if c["id"] == code_id), None)
    assert deleted_code is None  # Code should not be in the list anymore


def test_empty_project_codes(client, auth_headers, test_project):
    """Test getting codes for a project with no codes"""
    project_id = test_project["id"]

    response = client.get(
        f"/api/v1/codes/project/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # Should be empty initially
    assert len(data) == 0
