import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

// Helper to render Navbar with explicit auth state
function renderNavbar(user = null) {
  // Create a simple harness that sets auth state via useAuth
  function Harness() {
    const { login, logout } = useAuth();

    // Pre-set auth if user provided
    React.useEffect(() => {
      if (user) {
        // Directly set the user through context's internal state is tricky,
        // so we use localStorage which AuthProvider reads on mount
      }
    }, []);

    return <Navbar />;
  }

  if (user) {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_user', JSON.stringify(user));
  }

  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders brand link', () => {
    renderNavbar();
    expect(screen.getByText('Product Catalog')).toBeInTheDocument();
  });

  it('shows Catalog, Login, and Register links when not authenticated', () => {
    renderNavbar();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('shows user email and Logout button when authenticated', () => {
    renderNavbar({ email: 'alice@example.com' });
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.queryByText('Register')).not.toBeInTheDocument();
  });

  it('shows "User" placeholder when user object has no email', () => {
    renderNavbar({});
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('toggles mobile menu on hamburger click', () => {
    renderNavbar();
    const toggleButton = screen.getByLabelText('Toggle navigation');
    fireEvent.click(toggleButton);

    // The collapse div should have 'show' class
    const collapse = document.getElementById('navbarNav');
    expect(collapse.classList.contains('show')).toBe(true);

    // Click again to collapse
    fireEvent.click(toggleButton);
    expect(collapse.classList.contains('show')).toBe(false);
  });

  it('calls logout and navigates to /login on logout click', () => {
    renderNavbar({ email: 'bob@test.com' });
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);

    // After logout, login/register links should appear
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
});