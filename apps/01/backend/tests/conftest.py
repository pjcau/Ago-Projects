"""Pytest fixtures for the API test suite.

Uses an in-memory SQLite database to avoid file-based conflicts between
test modules.
"""
from __future__ import annotations

from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db

# Import models so they are registered on Base.metadata before table creation
import app.models  # noqa: F401

TEST_DATABASE_URL = "sqlite://"  # in-memory
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


def recreate_tables() -> None:
    """Drop and recreate all tables (idempotent, clean slate)."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)


def clear_all_tables() -> None:
    """Delete all rows from every table (without dropping the tables)."""
    db = TestSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def _global_setup() -> Generator[None, None, None]:
    """Create tables once at the start of the test session."""
    recreate_tables()
    yield


@pytest.fixture(autouse=True)
def _clean_tables() -> Generator[None, None, None]:
    """Clean all tables before each test so tests are isolated."""
    clear_all_tables()
    yield


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


@pytest.fixture
def db_session() -> Generator[sessionmaker, None, None]:
    """Provide a fresh SQLAlchemy session for direct DB queries in tests."""
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()