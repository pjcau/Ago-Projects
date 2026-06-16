import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';

/**
 * Helper to render components wrapped in AuthProvider + BrowserRouter.
 */
function renderWithProviders(ui, { initialUser = null } = {}) {
  // We use a wrapper component to pre-set the auth state
  function Wrapper({ children }) {
    return (
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    );
  }

  // For controlled auth state, we render a test harness
  if (initialUser) {
    // Set the localStorage before rendering so AuthProvider picks it up
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('auth_user', JSON.stringify(initialUser));
  }

  return render(ui, { wrapper: Wrapper });
}

export { renderWithProviders, screen, fireEvent };