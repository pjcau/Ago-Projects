import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CatalogPage from './CatalogPage';

const dummyProducts = [
  {
    id: 1,
    name: 'Classic Leather Backpack',
    price: 89.99,
    description: 'Handcrafted full-grain leather backpack.',
    category: 'Accessories',
  },
  {
    id: 2,
    name: 'Wireless Headphones',
    price: 249.99,
    description: 'Premium noise-cancelling headphones.',
    category: 'Electronics',
  },
  {
    id: 3,
    name: 'Organic Cotton T-Shirt',
    price: 34.99,
    description: 'Soft organic cotton tee.',
    category: 'Clothing',
  },
];

function renderCatalogPage() {
  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <CatalogPage />
    </BrowserRouter>
  );
}

describe('CatalogPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows loading state initially', () => {
    // Keep fetch pending to test loading state
    global.fetch = jest.fn(() => new Promise(() => {}));

    renderCatalogPage();
    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('renders products after successful fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(dummyProducts),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    });

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('$89.99')).toBeInTheDocument();
    expect(screen.getByText('$249.99')).toBeInTheDocument();

    // Table should also be rendered
    expect(screen.getByText('All Products (3)')).toBeInTheDocument();
  });

  it('filters products by search query', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(dummyProducts),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'backpack' } });

    // Should show matching product
    expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    // Non-matching should NOT be in the document
    expect(screen.queryByText('Wireless Headphones')).not.toBeInTheDocument();
    // Table count should update
    expect(screen.getByText('All Products (1)')).toBeInTheDocument();
  });

  it('shows "no products match" when search has no results', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(dummyProducts),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } });

    expect(screen.getByText(/no products match/i)).toBeInTheDocument();
  });

  it('clears search when clear button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(dummyProducts),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'backpack' } });

    // Clear button should appear
    const clearBtn = screen.getByLabelText(/clear search/i);
    fireEvent.click(clearBtn);

    // All products should be visible again
    expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Organic Cotton T-Shirt')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
    });

    expect(
      screen.getByText(/could not reach the server/i)
    ).toBeInTheDocument();
  });

  it('shows server error message on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ detail: 'Internal server error' }),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Internal server error')).toBeInTheDocument();
  });

  it('shows retry button on error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load products/i)).toBeInTheDocument();
    });

    // There's a retry button
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('filters by category as well', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(dummyProducts),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'electronics' } });

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.queryByText('Organic Cotton T-Shirt')).not.toBeInTheDocument();
  });

  it('filters by description', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(dummyProducts),
    });

    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Classic Leather Backpack')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/search products/i);
    fireEvent.change(searchInput, { target: { value: 'organic cotton' } });

    expect(screen.getByText('Organic Cotton T-Shirt')).toBeInTheDocument();
    expect(screen.queryByText('Wireless Headphones')).not.toBeInTheDocument();
  });
});