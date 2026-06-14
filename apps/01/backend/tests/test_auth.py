"""Unit tests for the auth API endpoints."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.auth import hash_password, create_access_token, decode_access_token
from app.database import Base, get_db

# Use the SAME database URL and engine as conftest so tables are shared
TEST_DB_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test and drop all data afterwards."""
    # Ensure all tables exist (idempotent)
    Base.metadata.create_all(bind=engine)

    # Clear all rows before each test
    db = TestSession()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()

    yield

    # Drop all tables after test
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """TestClient with overridden DB dependency using the auth-test engine."""
    from main import app

    def _get_test_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ── Registration tests ──────────────────────────────────────────────


def test_register_success(client: TestClient):
    resp = client.post("/auth/register", json={
        "email": "alice@example.com",
        "password": "secret123",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "alice@example.com"
    assert "id" in data["user"]
    assert "access_token" in data
    # token should be decodable
    payload = decode_access_token(data["access_token"])
    assert payload["email"] == "alice@example.com"


def test_register_duplicate_email(client: TestClient):
    # First registration
    client.post("/auth/register", json={
        "email": "bob@example.com",
        "password": "secret123",
    })
    # Duplicate
    resp = client.post("/auth/register", json={
        "email": "bob@example.com",
        "password": "otherpass",
    })
    assert resp.status_code == 409
    assert "already registered" in resp.json()["detail"]


def test_register_invalid_email(client: TestClient):
    resp = client.post("/auth/register", json={
        "email": "not-an-email",
        "password": "secret123",
    })
    assert resp.status_code == 422  # validation error


def test_register_short_password(client: TestClient):
    resp = client.post("/auth/register", json={
        "email": "short@example.com",
        "password": "12",
    })
    assert resp.status_code == 422


# ── Login tests ─────────────────────────────────────────────────────


def test_login_success(client: TestClient):
    # Register first
    client.post("/auth/register", json={
        "email": "carol@example.com",
        "password": "strongpass",
    })
    # Login
    resp = client.post("/auth/login", json={
        "email": "carol@example.com",
        "password": "strongpass",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "carol@example.com"
    assert "access_token" in data


def test_login_wrong_password(client: TestClient):
    client.post("/auth/register", json={
        "email": "dave@example.com",
        "password": "correctpass",
    })
    resp = client.post("/auth/login", json={
        "email": "dave@example.com",
        "password": "wrongpass",
    })
    assert resp.status_code == 401


def test_login_nonexistent_user(client: TestClient):
    resp = client.post("/auth/login", json={
        "email": "nobody@example.com",
        "password": "anypass",
    })
    assert resp.status_code == 401


# ── Protected endpoint (/auth/me) tests ────────────────────────────


def test_me_authenticated(client: TestClient):
    # Register and login
    reg_resp = client.post("/auth/register", json={
        "email": "eve@example.com",
        "password": "pass1234",
    })
    token = reg_resp.json()["access_token"]

    resp = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "eve@example.com"


def test_me_no_token(client: TestClient):
    resp = client.get("/auth/me")
    assert resp.status_code == 401


def test_me_invalid_token(client: TestClient):
    resp = client.get("/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert resp.status_code == 401


# ── Password hashing unit tests ─────────────────────────────────────


def test_hash_and_verify():
    pw = "my_secure_password"
    hashed = hash_password(pw)
    assert hashed != pw
    assert hash_password(pw) != hashed  # different salt each time
    from app.auth import verify_password
    assert verify_password(pw, hashed) is True
    assert verify_password("wrong", hashed) is False


# ── JWT unit tests ──────────────────────────────────────────────────


def test_create_and_decode_token():
    token = create_access_token(user_id=42, email="test@example.com")
    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["email"] == "test@example.com"
    assert "exp" in payload


def test_decode_invalid_token():
    with pytest.raises(Exception):
        decode_access_token("not.a.real.token")