#!/usr/bin/env python3
"""
Tests for authentication endpoints and user management using pytest
"""
import pytest
from app.schemas.user import UserCreate, UserLogin
from app.services.user_service import get_or_create_oauth_user


def test_register(client):
    """Test user registration"""
    user_data = {
        "email": "test_register@example.com",
        "password": "testpassword123"
    }

    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_data["email"]
    assert "id" in data
    assert "password" not in data  # Password should not be returned


def test_register_with_name(client):
    """Test user registration with name"""
    user_data = {
        "email": "test_register_name@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }

    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["name"] == user_data["name"]
    assert "id" in data
    assert "password" not in data  # Password should not be returned


def test_register_duplicate_email(client):
    """Test registration with duplicate email fails"""
    user_data = {
        "email": "test_duplicate@example.com",
        "password": "testpassword123"
    }

    # First registration should succeed
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200

    # Second registration with same email should fail
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_login_success(client):
    """Test successful login"""
    # Register a user first
    user_data = {
        "email": "test_login@example.com",
        "password": "testpassword123"
    }
    client.post("/api/v1/auth/register", json=user_data)

    # Login
    login_data = {
        "email": user_data["email"],
        "password": user_data["password"]
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    """Test login with incorrect password"""
    # Register a user first
    user_data = {
        "email": "test_wrong_pwd@example.com",
        "password": "testpassword123"
    }
    client.post("/api/v1/auth/register", json=user_data)

    # Login with wrong password
    login_data = {
        "email": user_data["email"],
        "password": "wrongpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_login_nonexistent_user(client):
    """Test login with non-existent user"""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "testpassword"
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


def test_protected_route(client, auth_headers):
    """Test accessing a protected route with valid authentication"""
    # This tests that our auth_headers fixture works correctly
    response = client.get("/api/v1/users/profile", headers=auth_headers)
    assert response.status_code == 200


def test_protected_route_no_auth(client):
    """Test accessing a protected route without authentication"""
    response = client.get("/api/v1/users/profile")
    # Should return 401 Unauthorized when no auth provided
    assert response.status_code == 401


# User Profile Tests
def test_update_user_profile(client, auth_headers):
    """Test updating user profile with name"""
    update_data = {
        "name": "Updated User Name"
    }

    response = client.put("/api/v1/users/profile",
                          json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]


def test_update_user_profile_email(client, auth_headers):
    """Test updating user profile email"""
    update_data = {
        "email": "updated@example.com"
    }

    response = client.put("/api/v1/users/profile",
                          json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == update_data["email"]


def test_update_user_profile_multiple_fields(client, auth_headers):
    """Test updating multiple user profile fields"""
    update_data = {
        "name": "Multi Field User",
        "email": "multifield@example.com"
    }

    response = client.put("/api/v1/users/profile",
                          json=update_data, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == update_data["name"]
    assert data["email"] == update_data["email"]


# OAuth Tests
def test_oauth_user_google_with_name(db):
    """Test creating OAuth user from Google with name"""
    google_user_info = {
        "id": "google123",
        "email": "google.user@example.com",
        "name": "Google User"
    }

    user = get_or_create_oauth_user(db, google_user_info, provider="google")
    assert user.email == google_user_info["email"]
    assert user.name == google_user_info["name"]
    assert user.oauth_provider == "google"
    assert user.oauth_id == google_user_info["id"]


def test_oauth_user_github_with_name(db):
    """Test creating OAuth user from GitHub with name"""
    github_user_info = {
        "id": 123456,
        "login": "githubuser",
        "email": "github.user@example.com",
        "name": "GitHub User"
    }

    user = get_or_create_oauth_user(db, github_user_info, provider="github")
    assert user.email == github_user_info["email"]
    assert user.name == github_user_info["name"]
    assert user.oauth_provider == "github"
    assert user.oauth_id == github_user_info["login"]


def test_oauth_user_github_without_name_uses_login(db):
    """Test creating OAuth user from GitHub without name uses login"""
    github_user_info = {
        "id": 123456,
        "login": "githubuser",
        "email": "github.user@example.com"
        # No 'name' field
    }

    user = get_or_create_oauth_user(db, github_user_info, provider="github")
    assert user.email == github_user_info["email"]
    assert user.name == github_user_info["login"]
    assert user.oauth_provider == "github"


def test_oauth_user_github_fallback_to_email_prefix(db):
    """Test creating OAuth user from GitHub with email prefix fallback"""
    github_user_info = {
        "id": 123456,
        "email": "github.user@example.com"
        # No 'name' or 'login' field
    }

    user = get_or_create_oauth_user(db, github_user_info, provider="github")
    assert user.email == github_user_info["email"]
    assert user.name == "github.user"  # Email prefix
    assert user.oauth_provider == "github"
