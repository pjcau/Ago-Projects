#!/usr/bin/env python3
"""ETL script — migrate products from JSON to the database.

Usage:
    python etl_migrate_products.py

Idempotent:  re-running upserts existing rows (matched on ``id``)
and inserts new ones.  No data is duplicated.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Iterator

from sqlalchemy import Engine
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine as _engine, init_db
from app.models import Product

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
log = logging.getLogger("etl")

# Resolve products.json — works both in Docker (volume mounted at /frontend/src/data)
# and when running locally outside Docker
_POSSIBLE_PATHS = [
    Path("/frontend/src/data/products.json"),                    # Docker mount
    Path(__file__).resolve().parent.parent / "frontend" / "src" / "data" / "products.json",  # old root frontend/
    Path(__file__).resolve().parent.parent / "apps" / "frontend" / "src" / "data" / "products.json",  # apps/frontend/
]

PRODUCTS_JSON: Path | None = None
for p in _POSSIBLE_PATHS:
    if p.exists():
        PRODUCTS_JSON = p
        break

# ---------------------------------------------------------------------------
# 1.  Extract
# ---------------------------------------------------------------------------


def extract_products(path: Path) -> list[dict]:
    """Read and parse the JSON file.  Raises on I/O or parse error."""
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")
    with open(path, encoding="utf-8") as f:
        raw = json.load(f)
    if not isinstance(raw, list):
        raise ValueError(f"Expected a JSON array, got {type(raw).__name__}")
    log.info("Extracted %d raw records from %s", len(raw), path)
    return raw


# ---------------------------------------------------------------------------
# 2.  Validate & Transform
# ---------------------------------------------------------------------------

_REQUIRED = {"id", "name", "price", "description"}
_FLOAT_FIELDS = {"price"}
_INT_FIELDS = {"id"}


def validate_record(rec: dict, index: int) -> dict:
    """Validate a single JSON record and return a cleaned dict.

    Raises ``ValueError`` with a descriptive message on failure.
    """
    # --- required keys ---
    missing = _REQUIRED - rec.keys()
    if missing:
        raise ValueError(f"Record #{index}: missing keys {sorted(missing)}")

    # --- type coercion ---
    cleaned: dict = {}

    for field in _INT_FIELDS:
        try:
            cleaned[field] = int(rec[field])
        except (ValueError, TypeError):
            raise ValueError(
                f"Record #{index}: field '{field}'={rec[field]!r} is not a valid integer"
            )

    for field in _FLOAT_FIELDS:
        try:
            cleaned[field] = float(rec[field])
        except (ValueError, TypeError):
            raise ValueError(
                f"Record #{index}: field '{field}'={rec[field]!r} is not a valid number"
            )

    # --- string fields ---
    for field in ("name", "description"):
        val = rec.get(field, "")
        if not isinstance(val, str):
            raise ValueError(
                f"Record #{index}: field '{field}' must be a string, got {type(val).__name__}"
            )
        cleaned[field] = val.strip()

    # --- optional image field (passthrough) ---
    if "image" in rec and rec["image"] is not None:
        cleaned["image"] = str(rec["image"])

    # --- business rules ---
    if cleaned["price"] < 0:
        raise ValueError(
            f"Record #{index}: price ({cleaned['price']}) must be non-negative"
        )
    if not cleaned["name"]:
        raise ValueError(f"Record #{index}: name must not be empty")
    if cleaned["id"] <= 0:
        raise ValueError(f"Record #{index}: id ({cleaned['id']}) must be positive")

    return cleaned


def transform(records: list[dict]) -> Iterator[dict]:
    """Yield cleaned, validated records.  Abort the whole ETL on any error."""
    for i, rec in enumerate(records):
        yield validate_record(rec, i)


# ---------------------------------------------------------------------------
# 3.  Load
# ---------------------------------------------------------------------------

def load_products(engine: Engine, products: list[dict]) -> int:
    """Upsert products into the database.  Returns the total row count after load."""
    count = 0
    with Session(engine) as session:
        for rec in products:
            # Merge — SQLAlchemy will INSERT if id is new, UPDATE otherwise.
            product = Product(**rec)
            session.merge(product)
            count += 1

        session.commit()
        log.info("Committed %d products to database", count)

    # Verify total rows
    with Session(engine) as session:
        total = session.query(Product).count()
    log.info("Total products in database after migration: %d", total)
    return total


# ---------------------------------------------------------------------------
# 4.  Orchestration
# ---------------------------------------------------------------------------

def run_etl(engine: Engine | None = None) -> int:
    """Run the full ETL pipeline.  Returns the number of products loaded.

    Args:
        engine:  Optional pre-existing engine.  If ``None``, a new one is
                 created from ``settings.database_url``.
    """
    # --- Ensure tables exist ---
    init_db()
    log.info("Database URL: %s", settings.database_url)

    # --- Resolve products.json path ---
    if PRODUCTS_JSON is None:
        log.error("Could not locate products.json. Checked paths: %s", _POSSIBLE_PATHS)
        raise FileNotFoundError(
            f"products.json not found. Tried: {[str(p) for p in _POSSIBLE_PATHS]}"
        )

    # --- Extract ---
    raw = extract_products(PRODUCTS_JSON)

    # --- Validate & Transform ---
    cleaned = list(transform(raw))
    log.info("Validated %d records (all passed)", len(cleaned))

    # --- Load ---
    eng = engine or _engine
    total = load_products(eng, cleaned)
    return total


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> int:
    try:
        total = run_etl()
        print(f"\n✅  ETL complete.  {total} products in the database.")
        return 0
    except Exception:
        log.exception("ETL failed")
        print("\n❌  ETL failed — see log above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())