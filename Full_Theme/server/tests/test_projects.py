#!/usr/bin/env python3
"""
Tests for projects API endpoints using pytest
"""
import pytest


def test_create_project(client, auth_headers):
    """Test creating a project"""
    project_data = {
        "title": "Test Project",
        "description": "A test project for pytest"
    }

    response = client.post("/api/v1/projects/",
                           json=project_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == project_data["title"]
    assert data["description"] == project_data["description"]
    assert "id" in data
    assert "created_at" in data
    assert "owner_id" in data  # Changed from user_id to owner_id


def test_get_project_list(client, auth_headers):
    """Test getting a list of projects"""
    # Create a couple of projects first
    project1 = {
        "title": "Test Project 1",
        "description": "First test project"
    }
    project2 = {
        "title": "Test Project 2",
        "description": "Second test project"
    }

    client.post("/api/v1/projects/", json=project1, headers=auth_headers)
    client.post("/api/v1/projects/", json=project2, headers=auth_headers)

    # Get the project list
    response = client.get("/api/v1/projects/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2

    # Check that our projects are in the list
    project_titles = [p["title"] for p in data]
    assert "Test Project 1" in project_titles
    assert "Test Project 2" in project_titles


def test_get_project_detail(client, auth_headers):
    """Test getting project details"""
    # Create a project first
    project_data = {
        "title": "Detailed Project",
        "description": "A project with details"
    }

    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    project_id = create_response.json()["id"]

    # Get the project details
    response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == project_data["title"]
    assert data["description"] == project_data["description"]
    assert data["id"] == project_id
    assert "created_at" in data
    assert "documents" in data
    assert "codes" in data


def test_update_project(client, auth_headers):
    """Test updating a project"""
    # Create a project first
    project_data = {
        "title": "Original Title",
        "description": "Original description"
    }

    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    project_id = create_response.json()["id"]

    # Update the project
    update_data = {
        "title": "Updated Title",
        "description": "Updated description"
    }

    response = client.put(
        f"/api/v1/projects/{project_id}", json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == update_data["title"]
    assert data["description"] == update_data["description"]

    # Verify the update persisted
    get_response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_response.json()["title"] == update_data["title"]


def test_delete_project(client, auth_headers):
    """Test deleting a project"""
    # Create a project first
    project_data = {
        "title": "Project to Delete",
        "description": "This project will be deleted"
    }

    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    project_id = create_response.json()["id"]

    # Delete the project
    response = client.delete(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert response.status_code == 200

    # Verify it's gone
    get_response = client.get(
        f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_response.status_code == 404


def test_get_nonexistent_project(client, auth_headers):
    """Test getting a project that doesn't exist"""
    response = client.get("/api/v1/projects/999999", headers=auth_headers)
    assert response.status_code == 404


def test_unauthorized_project_access(client, test_user):
    """Test that a user can't access another user's projects"""
    # Create a project for the first user
    project_data = {
        "title": "Secret Project",
        "description": "This should be private"
    }
    auth_headers = {"Authorization": f"Bearer {test_user['token']}"}
    create_response = client.post(
        "/api/v1/projects/", json=project_data, headers=auth_headers)
    project_id = create_response.json()["id"]

    # Create a second user
    second_user = {
        "email": "second_user@example.com",
        "password": "password123",
        "full_name": "Second User"
    }
    client.post("/api/v1/auth/register", json=second_user)

    # Login as second user
    login_response = client.post("/api/v1/auth/login",
                                 json={"email": second_user["email"], "password": second_user["password"]})
    second_token = login_response.json()["access_token"]
    second_headers = {"Authorization": f"Bearer {second_token}"}

    # Try to access first user's project
    response = client.get(
        f"/api/v1/projects/{project_id}", headers=second_headers)
    # Should return 404 rather than revealing project exists
    assert response.status_code == 404
