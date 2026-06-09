"""Product Catalog — Backend API (FastAPI)."""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

router = APIRouter()

PRODUCTS_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "products.json"


def _load_products() -> list[dict]:
    with open(PRODUCTS_PATH) as f:
        return json.load(f)


@router.get("/api/products")
def list_products():
    """Return the full product catalogue."""
    return _load_products()


@router.get("/api/products/{product_id:int}")
def get_product(product_id: int):
    """Return a single product by id, or 404."""
    products = _load_products()
    for p in products:
        if p["id"] == product_id:
            return p
    return JSONResponse(status_code=404, content={"detail": "Product not found"})


@router.get("/health")
def health():
    return {"status": "healthy"}


app = FastAPI(title="Product Catalog API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)