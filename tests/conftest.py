"""
Test configuration and shared fixtures.

Uses an in-memory SQLite database so tests run fast
and don't touch the real PostgreSQL instance.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database_models import Base
from database import get_db
from main import app


# In-memory SQLite for isolated, fast tests
SQLALCHEMY_TEST_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """FastAPI test client."""
    return TestClient(app)


@pytest.fixture
def sample_product(client):
    """Create and return a sample product."""
    payload = {
        "name": "Test Widget",
        "description": "A widget for testing",
        "category": "Electronics",
        "price": 29.99,
        "quantity": 100,
    }
    res = client.post("/products/", json=payload)
    assert res.status_code == 200
    return res.json()["product"]
