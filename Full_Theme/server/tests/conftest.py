#!/usr/bin/env python3
"""
Configuration and fixtures for pytest
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from typing import Dict, Generator, Any

from app.main import app
from app.db.session import get_db
from app.core.security import create_access_token
from app.db.session import Base
from app.services.user_service import create_user, get_user_by_email
from app.schemas.user import UserCreate
import random
import string

# Setup in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)


def random_email():
    """Generate a random email for testing"""
    random_string = ''.join(random.choices(
        string.ascii_lowercase + string.digits, k=8))
    return f"test_{random_string}@example.com"


@pytest.fixture(scope="function")
def db():
    """Create fresh database for each test"""
    Base.metadata.create_all(bind=engine)  # Create tables
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)  # Clean up after test


@pytest.fixture(scope="function")
def client(db):
    """Get test client with database dependency overridden"""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db) -> Dict[str, Any]:
    """Create a test user and return user data with auth token"""
    user_data = UserCreate(
        email=random_email(),
        password="testpassword123"
    )
    user = create_user(db, user_data)

    access_token = create_access_token(data={"sub": user.email})

    return {
        "id": user.id,
        "email": user.email,
        "token": access_token
    }


@pytest.fixture(scope="function")
def auth_headers(test_user) -> Dict[str, str]:
    """Get headers with authorization token"""
    return {"Authorization": f"Bearer {test_user['token']}"}
