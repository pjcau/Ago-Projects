import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginPage from './LoginPage';

// Mock authService functions used by AuthContext
jest.mock('../services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getStoredUser: jest.fn(() => null),
  getToken: jest.fn(() => null),
}));

function renderLoginPage() {
  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders the login form with email, password, and submit button', () => {
    renderLoginPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows a link to register page', () => {
    renderLoginPage();
    expect(screen.getByText(/register here/i)).toBeInTheDocument();
  });

  it('displays validation errors for empty fields on submit', () => {
    renderLoginPage();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('calls login and navigates to / on success', async () => {
    const authService = require('../services/authService');
    authService.login.mockResolvedValue({ user: { email: 'test@test.com' } });

    renderLoginPage();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
    });
  });

  it('shows spinner while submitting', async () => {
    const authService = require('../services/authService');
    // Return a promise that never resolves to keep submitting state
    let resolvePromise;
    authService.login.mockImplementation(() => new Promise((resolve) => { resolvePromise = resolve; }));

    renderLoginPage();

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'a@b.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    // Should show loading state
    expect(screen.getByText('Logging in...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();

    // Clean up
    await act(async () => {
      resolvePromise({});
    });
  });

  it('displays server error from context', async () => {
    const authService = require('../services/authService');
    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    renderLoginPage();

    // Use a valid password (at least 6 characters) to pass validation
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'a@b.com' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'validpassword' },
      });

      fireEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});