import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import RegisterPage from './RegisterPage';

jest.mock('../services/authService', () => ({
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: jest.fn(() => false),
  getStoredUser: jest.fn(() => null),
  getToken: jest.fn(() => null),
}));

function renderRegisterPage() {
  return render(
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <AuthProvider>
        <RegisterPage />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('renders the registration form with all fields', () => {
    renderRegisterPage();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });

  it('shows a link to login page', () => {
    renderRegisterPage();
    expect(screen.getByText(/login here/i)).toBeInTheDocument();
  });

  it('displays validation errors for empty fields on submit', () => {
    renderRegisterPage();
    fireEvent.click(screen.getByText('Register'));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
  });

  it('displays password mismatch error', () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'different' },
    });

    fireEvent.click(screen.getByText('Register'));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });

  it('calls register when form is valid', async () => {
    const authService = require('../services/authService');
    authService.register.mockResolvedValue({ user: { email: 'new@user.com' } });

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'new@user.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        email: 'new@user.com',
        password: '123456',
      });
    });
  });

  it('shows submitting state', async () => {
    const authService = require('../services/authService');
    let resolvePromise;
    authService.register.mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByText('Register'));

    expect(screen.getByText('Creating account...')).toBeInTheDocument();

    // Clean up
    resolvePromise({});
  });

  it('displays server error from context', async () => {
    const authService = require('../services/authService');
    authService.register.mockRejectedValue(new Error('Email already registered'));

    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'existing@test.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: '123456' },
    });

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });
});