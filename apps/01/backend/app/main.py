"""Re-export the FastAPI application from the root ``main`` module.

This allows ``from app.main import app`` to work, which is the
conventional import path expected by Docker / uvicorn configs.
"""
from __future__ import annotations

from main import app  # noqa: F401 — imported for re-export