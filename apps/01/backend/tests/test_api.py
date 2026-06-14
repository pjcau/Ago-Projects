"""Integration tests for the Product Catalog API endpoints."""
from __future__ import annotations

from typing import Generator

import pytest
from fastapi.testclient import TestClient

from app.models import Product
from tests.conftest import TestSessionLocal, clear_all_tables


SAMPLE_PRODUCTS = [
    {"id": 1, "name": "Alpha Widget", "price": 10.0, "description": "The first widget"},
    {"id": 2, "name": "Beta Gadget", "price": 25.0, "description": "A handy gadget"},
    {"id": 3, "name": "Gamma Tool", "price": 5.0, "description": "Small but useful"},
]


@pytest.fixture(autouse=True)
def _seed_test_db() -> Generator[None, None, None]:
    """Clear all tables and seed test products before every test."""
    clear_all_tables()

    db = TestSessionLocal()
    try:
        for item in SAMPLE_PRODUCTS:
            product = Product(
                id=item["id"],
                name=item["name"],
                price=item["price"],
                description=item["description"],
            )
            db.add(product)
        db.commit()
    finally:
        db.close()

    yield

    clear_all_tables()


class TestHealth:
    def test_health_returns_ok(self, client: TestClient) -> None:
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json() == {"status": "healthy"}


class TestListProducts:
    def test_list_all_default(self, client: TestClient) -> None:
        resp = client.get("/api/products")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    def test_search_by_name(self, client: TestClient) -> None:
        resp = client.get("/api/products?search=widget")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == 1
        assert data[0]["name"] == "Alpha Widget"

    def test_search_by_description(self, client: TestClient) -> None:
        resp = client.get("/api/products?search=gadget")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Beta Gadget"

    def test_filter_min_price(self, client: TestClient) -> None:
        resp = client.get("/api/products?min_price=10")
        assert resp.status_code == 200
        data = resp.json()
        assert all(p["price"] >= 10 for p in data)

    def test_filter_max_price(self, client: TestClient) -> None:
        resp = client.get("/api/products?max_price=10")
        assert resp.status_code == 200
        data = resp.json()
        assert all(p["price"] <= 10 for p in data)

    def test_filter_price_range(self, client: TestClient) -> None:
        resp = client.get("/api/products?min_price=8&max_price=20")
        assert resp.status_code == 200
        data = resp.json()
        assert all(8 <= p["price"] <= 20 for p in data)

    def test_sort_by_price_asc(self, client: TestClient) -> None:
        resp = client.get("/api/products?sort_by=price&sort_order=asc")
        assert resp.status_code == 200
        data = resp.json()
        prices = [p["price"] for p in data]
        assert prices == sorted(prices)

    def test_sort_by_price_desc(self, client: TestClient) -> None:
        resp = client.get("/api/products?sort_by=price&sort_order=desc")
        assert resp.status_code == 200
        data = resp.json()
        prices = [p["price"] for p in data]
        assert prices == sorted(prices, reverse=True)

    def test_sort_by_name_asc(self, client: TestClient) -> None:
        resp = client.get("/api/products?sort_by=name&sort_order=asc")
        assert resp.status_code == 200
        data = resp.json()
        names = [p["name"] for p in data]
        assert names == sorted(names)

    def test_pagination_limit(self, client: TestClient) -> None:
        resp = client.get("/api/products?limit=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2

    def test_pagination_offset(self, client: TestClient) -> None:
        resp = client.get("/api/products?offset=2")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1

    def test_pagination_offset_beyond(self, client: TestClient) -> None:
        resp = client.get("/api/products?offset=100")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 0

    def test_search_ignore_case(self, client: TestClient) -> None:
        resp = client.get("/api/products?search=ALPHA")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["name"] == "Alpha Widget"

    def test_search_no_match(self, client: TestClient) -> None:
        resp = client.get("/api/products?search=nonexistent")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 0


class TestGetProduct:
    def test_get_existing(self, client: TestClient) -> None:
        resp = client.get("/api/products/1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == 1
        assert data["name"] == "Alpha Widget"
        assert data["price"] == 10.0
        assert data["description"] == "The first widget"

    def test_get_nonexistent(self, client: TestClient) -> None:
        resp = client.get("/api/products/999")
        assert resp.status_code == 404
        assert resp.json() == {"detail": "Product not found"}

    def test_get_invalid_id_type(self, client: TestClient) -> None:
        resp = client.get("/api/products/abc")
        assert resp.status_code == 404


class TestRepository:
    """Unit-level tests for the repository directly against the database."""

    def test_seed_from_json(self) -> None:
        from app.repository import ProductRepository

        db = TestSessionLocal()
        try:
            db.query(Product).delete()
            db.commit()

            repo = ProductRepository()
            count = repo.seed_from_json(db)
            assert count > 0

            products = db.query(Product).order_by(Product.id).all()
            assert len(products) == count
        finally:
            db.close()

    def test_get_by_id_nonexistent(self) -> None:
        from app.repository import ProductRepository

        db = TestSessionLocal()
        try:
            repo = ProductRepository(db=db)
            assert repo.get_by_id(999) is None
        finally:
            db.close()

    def test_is_empty(self) -> None:
        from app.repository import ProductRepository

        db = TestSessionLocal()
        try:
            repo = ProductRepository(db=db)
            assert not repo.is_empty()

            db.query(Product).delete()
            db.commit()
            assert repo.is_empty()
        finally:
            db.close()