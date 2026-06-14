"""Pytest fixtures for the API test suite."""
from __future__ import annotations

from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db

# Use a single shared SQLite database for all tests
TEST_DATABASE_URL = "sqlite:///./test.db"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)

# Ensure all tables exist before any test runs
Base.metadata.create_all(bind=test_engine)


def clear_all_tables() -> None:
    """Delete all rows from every table (without dropping the tables)."""
    db = TestSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()


@pytest.fixture
def override_get_db() -> Generator[None, None, None]:
    """Override the ``get_db`` dependency so tests use the test session."""
    from main import app as fastapi_app

    def _get_test_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    fastapi_app.dependency_overrides[get_db] = _get_test_db
    yield
    fastapi_app.dependency_overrides.clear()


@pytest.fixture
def client(override_get_db: None) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient pointing at the real app."""
    from main import app

    with TestClient(app) as c:
        yield c