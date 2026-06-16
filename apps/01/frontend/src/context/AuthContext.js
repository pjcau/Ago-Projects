import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  isAuthenticated,
  getStoredUser,
} from '../services/authService';

const AuthContext = createContext(null);

/**
 * Provides authentication state and methods across the component tree.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // On mount, restore user from localStorage if token exists
  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser());
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (credentials) => {
    setError('');
    try {
      const data = await apiLogin(credentials);
      setUser(data.user || { email: credentials.email });
      return data;
    } catch (err) {
      setError(err.message);
      // Don't re-throw the error to prevent unhandled promise rejections
      // The error is already stored in state for the UI to display
    }
  }, []);

  const register = useCallback(async (credentials) => {
    setError('');
    try {
      const data = await apiRegister(credentials);
      setUser(data.user || { email: credentials.email });
      return data;
    } catch (err) {
      setError(err.message);
      // Don't re-throw the error to prevent unhandled promise rejections
      // The error is already stored in state for the UI to display
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    setError('');
  }, []);

  const clearError = useCallback(() => setError(''), []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;