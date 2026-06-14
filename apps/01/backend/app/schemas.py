"""Pydantic schemas for the Product Catalog API."""
from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


# ── Product schemas ──────────────────────────────────────────────────

class ProductOut(BaseModel):
    """Schema returned for product responses."""

    id: int
    name: str
    price: float = Field(ge=0)
    description: str

    model_config = {"from_attributes": True}


class ProductListParams(BaseModel):
    """Query parameters for filtering / sorting products."""

    search: str | None = Field(
        default=None, description="Full-text search on name and description"
    )
    min_price: float | None = Field(default=None, ge=0)
    max_price: float | None = Field(default=None, ge=0)
    sort_by: str | None = Field(
        default=None,
        pattern="^(name|price|id)$",
        description="Sort field",
    )
    sort_order: str = Field(
        default="asc",
        pattern="^(asc|desc)$",
        description="Sort direction",
    )
    limit: int = Field(default=100, ge=1, le=500)
    offset: int = Field(default=0, ge=0)


class ErrorResponse(BaseModel):
    """Standard error response body."""

    detail: str


# ── Auth schemas ────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    """Request body for user registration."""

    email: EmailStr
    password: str = Field(min_length=3)


class UserLoginRequest(BaseModel):
    """Request body for user login."""

    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Public user profile returned in API responses."""

    id: int
    email: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT token response returned after login / register."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse