import React, { useState, useEffect, useMemo } from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/products`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let detail;
          try {
            detail = JSON.parse(text).detail;
          } catch {
            detail = text || `Server error: ${res.status}`;
          }
          throw new Error(detail);
        }
        const data = await res.json();
        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          // Differentiate network errors from server errors
          if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
            setError(
              'Could not reach the server. Make sure the backend is running (http://localhost:8000) and try again.'
            );
          } else {
            setError(err.message);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // --- Loading state ---
  if (loading) {
    return (
      <main className="status-container">
        <div className="loading-spinner" />
        <p className="status-text">Loading products…</p>
      </main>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <main className="status-container">
        <div className="error-icon">⚠</div>
        <p className="status-text error-text">Failed to load products</p>
        <p className="error-detail">{error}</p>
        <button
          className="retry-btn"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </main>
    );
  }

  // --- Empty / filtered-empty state ---
  if (filteredProducts.length === 0) {
    return (
      <main className="product-container">
        <header className="catalog-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, category, or description…"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </header>
        <div className="status-container">
          <p className="status-text">
            {searchQuery
              ? 'No products match your search.'
              : 'No products available.'}
          </p>
          {searchQuery && (
            <button className="retry-btn" onClick={() => setSearchQuery('')}>
              Clear search
            </button>
          )}
        </div>
      </main>
    );
  }

  // --- Data view ---
  return (
    <main className="product-container">
      <header className="catalog-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, category, or description…"
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search products"
        />
        {searchQuery && (
          <button
            className="clear-btn"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </header>

      <section className="product-grid">
        {filteredProducts.map((product) => (
          <div key={product.id} className="product-card">
            <span className="product-id">#{product.id}</span>
            <h3 className="product-name">{product.name}</h3>
            {product.category && (
              <span className="product-category">{product.category}</span>
            )}
            <div className="product-price">
              ${Number(product.price).toFixed(2)}
            </div>
            <p className="product-description">{product.description}</p>
          </div>
        ))}
      </section>

      <section className="product-table-container">
        <h2>All Products ({filteredProducts.length})</h2>
        <div className="table-wrapper">
          <table className="product-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td>{product.name}</td>
                  <td>{product.category || '—'}</td>
                  <td>${Number(product.price).toFixed(2)}</td>
                  <td>{product.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}