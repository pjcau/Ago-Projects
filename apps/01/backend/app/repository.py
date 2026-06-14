"""Product repository — reads from database with optional JSON fallback."""
from __future__ import annotations

import json
from pathlib import Path
from typing import List, Optional

from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Product
from app.schemas import ProductListParams, ProductOut

# Resolve products.json — works both in Docker (volume mounted at /frontend/src/data)
# and when running locally outside Docker
_POSSIBLE_PATHS = [
    Path("/frontend/src/data/products.json"),                    # Docker mount
    Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "data" / "products.json",  # old root frontend/
    Path(__file__).resolve().parent.parent.parent / "apps" / "frontend" / "src" / "data" / "products.json",  # apps/frontend/
]

PRODUCTS_PATH: Path | None = None
for p in _POSSIBLE_PATHS:
    if p.exists():
        PRODUCTS_PATH = p
        break


class ProductRepository:
    """Provides query methods backed by the database (with JSON fallback)."""

    def __init__(self, db: Session | None = None) -> None:
        self._db = db

    # ── Internal helpers ──────────────────────────────────────────────

    def _get_db(self) -> Session:
        """Return the injected session or create a new one."""
        if self._db is not None:
            return self._db
        return SessionLocal()

    @staticmethod
    def _load_from_json() -> list[dict]:
        """Load raw products from the JSON file (legacy fallback)."""
        if PRODUCTS_PATH is None:
            raise FileNotFoundError(
                f"products.json not found. Tried: {[str(p) for p in _POSSIBLE_PATHS]}"
            )
        with open(PRODUCTS_PATH) as f:
            return json.load(f)

    # ── Public query methods ──────────────────────────────────────────

    def list_all(self, params: ProductListParams | None = None) -> list[ProductOut]:
        """Return filtered / sorted / paginated products from DB."""
        db = self._get_db()
        try:
            query = db.query(Product)

            if params:
                if params.search:
                    q = f"%{params.search}%"
                    query = query.filter(
                        Product.name.ilike(q) | Product.description.ilike(q)
                    )
                if params.min_price is not None:
                    query = query.filter(Product.price >= params.min_price)
                if params.max_price is not None:
                    query = query.filter(Product.price <= params.max_price)

                if params.sort_by:
                    col = getattr(Product, params.sort_by, Product.id)
                    order_fn = desc if params.sort_order == "desc" else asc
                    query = query.order_by(order_fn(col))
                else:
                    query = query.order_by(Product.id)

                query = query.offset(params.offset).limit(params.limit)
            else:
                query = query.order_by(Product.id)

            products = query.all()
            return [ProductOut.model_validate(p) for p in products]
        finally:
            if self._db is None:
                db.close()

    def get_by_id(self, product_id: int) -> ProductOut | None:
        """Return a single product by id, or None."""
        db = self._get_db()
        try:
            product = db.query(Product).filter(Product.id == product_id).first()
            if product is None:
                return None
            return ProductOut.model_validate(product)
        finally:
            if self._db is None:
                db.close()

    # ── Seeding helper (ETL / migration) ──────────────────────────────

    def seed_from_json(self, db: Session | None = None) -> int:
        """Load products from the JSON file into the database.

        Returns the number of rows inserted.
        """
        session = db or SessionLocal()
        try:
            raw_list = self._load_from_json()
            count = 0
            for item in raw_list:
                existing = session.query(Product).filter(Product.id == item["id"]).first()
                if existing:
                    continue  # skip duplicates
                product = Product(
                    id=item["id"],
                    name=item["name"],
                    price=item["price"],
                    description=item.get("description", ""),
                    image=item.get("image"),
                )
                session.add(product)
                count += 1
            session.commit()
            return count
        finally:
            if db is None:
                session.close()

    def is_empty(self) -> bool:
        """Return True if the products table has no rows."""
        db = self._get_db()
        try:
            return db.query(Product).count() == 0
        finally:
            if self._db is None:
                db.close()


# Singleton (sessionless — creates its own session per call for backward compat)
repo = ProductRepository()