"""Product Catalog — Backend API (FastAPI).

Provides CRUD-like endpoints for the product catalogue backed by
a database (with automatic seed from JSON for backward compatibility),
plus auth endpoints.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db, init_db
from app.repository import ProductRepository
from app.routes.auth import router as auth_router
from app.schemas import ErrorResponse, ProductListParams, ProductOut

from etl_migrate_products import run_etl

router = APIRouter()


# ---------------------------------------------------------------------------
# Lifespan: initialise tables + seed data (backward compatibility)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start-up: create tables and seed from JSON if the DB is empty
    init_db()
    repo = ProductRepository()
    if repo.is_empty():
        count = run_etl()
        if count > 0:
            print(f"Seeded {count} product(s) from products.json into the database.")
    yield


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/api/products",
    response_model=list[ProductOut],
    summary="List products",
    description="Return all products with optional filtering, sorting, and pagination.",
)
def list_products(
    search: str | None = Query(
        default=None, description="Filter by name or description (case-insensitive)"
    ),
    min_price: float | None = Query(default=None, ge=0, description="Minimum price"),
    max_price: float | None = Query(default=None, ge=0, description="Maximum price"),
    sort_by: str | None = Query(
        default=None,
        pattern="^(name|price|id)$",
        description="Field to sort by",
    ),
    sort_order: str = Query(
        default="asc",
        pattern="^(asc|desc)$",
        description="Sort direction",
    ),
    limit: int = Query(default=100, ge=1, le=500, description="Max items"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db),
):
    params = ProductListParams(
        search=search,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order,
        limit=limit,
        offset=offset,
    )
    try:
        repo = ProductRepository(db=db)
        return repo.list_all(params)
    except FileNotFoundError:
        return JSONResponse(
            status_code=500,
            content={"detail": "Products data file not found."},
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {exc}"},
        )


@router.get(
    "/api/products/{product_id:int}",
    response_model=ProductOut,
    responses={404: {"model": ErrorResponse}},
    summary="Get product by ID",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    try:
        repo = ProductRepository(db=db)
        product = repo.get_by_id(product_id)
        if product is None:
            return JSONResponse(status_code=404, content={"detail": "Product not found"})
        return product
    except FileNotFoundError:
        return JSONResponse(
            status_code=500,
            content={"detail": "Products data file not found."},
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"detail": f"Internal server error: {exc}"},
        )


@router.get(
    "/health",
    summary="Health check",
    description="Returns 200 OK when the service is alive.",
)
def health():
    return {"status": "healthy"}


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Product Catalog API",
    version="0.3.0",
    description="REST API for the Product Catalog application.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Entry point (when run directly)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)