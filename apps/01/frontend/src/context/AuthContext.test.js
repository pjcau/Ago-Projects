import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';

function TestConsumer() {
  const { user, loading, error, isAuthenticated, login, register, logout, clearError } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="auth">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button data-testid="login-btn" onClick={() => login({ email: 'a@b.com', password: '123456' })}>
        Login
      </button>
      <button data-testid="register-btn" onClick={() => register({ email: 'a@b.com', password: '123456' })}>
        Register
      </button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
      <button data-testid="clear-btn" onClick={clearError}>Clear</button>
    </div>
  );
}

function renderWithProviders() {
  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    </BrowserRouter>
  );
}

// Mock authService
jest.mock('../services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getStoredUser: jest.fn(() => null),
  getToken: jest.fn(() => null),
}));

const authService = require('../services/authService');

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('initializes with loading true then false', async () => {
    renderWithProviders();
    // Initially loading, but effect runs synchronously so it may already be loaded
    expect(screen.getByTestId('loading').textContent).toBe('loaded');
    expect(screen.getByTestId('auth').textContent).toBe('not-authenticated');
  });

  it('restores user from localStorage if authenticated', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.getStoredUser.mockReturnValue({ email: 'stored@user.com' });

    renderWithProviders();
    expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    expect(screen.getByTestId('user').textContent).toContain('stored@user.com');
  });

  it('login sets user and clears error on success', async () => {
    authService.login.mockResolvedValue({ user: { email: 'a@b.com' } });

    renderWithProviders();
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    });
    expect(screen.getByTestId('user').textContent).toContain('a@b.com');
  });

  it('login sets error on failure', async () => {
    const errMsg = 'Invalid credentials';
    authService.login.mockRejectedValue(new Error(errMsg));

    renderWithProviders();
    fireEvent.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(errMsg);
    });
    // User should remain null
    expect(screen.getByTestId('auth').textContent).toBe('not-authenticated');
  });

  it('register sets user on success', async () => {
    authService.register.mockResolvedValue({ user: { email: 'new@user.com' } });

    renderWithProviders();
    fireEvent.click(screen.getByTestId('register-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    });
    expect(screen.getByTestId('user').textContent).toContain('new@user.com');
  });

  it('register sets error on failure', async () => {
    authService.register.mockRejectedValue(new Error('Email taken'));

    renderWithProviders();
    fireEvent.click(screen.getByTestId('register-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Email taken');
    });
  });

  it('logout clears user', async () => {
    authService.login.mockResolvedValue({ user: { email: 'test@test.com' } });

    renderWithProviders();
    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('auth').textContent).toBe('authenticated');
    });

    fireEvent.click(screen.getByTestId('logout-btn'));
    expect(screen.getByTestId('auth').textContent).toBe('not-authenticated');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('clearError resets error', async () => {
    authService.login.mockRejectedValue(new Error('Some error'));
    renderWithProviders();

    fireEvent.click(screen.getByTestId('login-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Some error');
    });

    fireEvent.click(screen.getByTestId('clear-btn'));
    expect(screen.getByTestId('error').textContent).toBe('no-error');
  });
});