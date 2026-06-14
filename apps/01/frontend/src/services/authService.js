/**
 * Authentication service — handles JWT token storage and API calls
 * for login and registration.
 *
 * Uses relative API paths by default so CRA's proxy (package.json) can
 * forward requests to the backend in development.
 * Override with REACT_APP_API_URL for production or standalone use.
 */

const API_URL = process.env.REACT_APP_API_URL || '';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** ------------------------------------------------------------------ */
/*  Token helpers                                                       */
/** ------------------------------------------------------------------ */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** ------------------------------------------------------------------ */
/*  API helpers                                                         */
/** ------------------------------------------------------------------ */

async function request(method, path, body = null) {
  const url = `${API_URL}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, options);
  } catch (err) {
    // Network error (server unreachable, DNS failure, etc.)
    throw new Error(
      'Could not reach the server. Ensure the backend is running at ' +
        (API_URL || 'the proxy target') +
        ' and try again.'
    );
  }

  // Try parsing JSON; fall back to text for empty responses
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    data = text || null;
  }

  if (!response.ok) {
    const message =
      (data && data.detail) ||
      (data && data.message) ||
      (data && typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

/** ------------------------------------------------------------------ */
/*  Public API                                                          */
/** ------------------------------------------------------------------ */

/**
 * Register a new account.
 * @param {{ email: string, password: string }} credentials
 * @returns {{ access_token: string, user: object }}
 */
export async function register(credentials) {
  const data = await request('POST', '/auth/register', credentials);
  if (data.access_token) {
    setToken(data.access_token);
    setStoredUser(data.user || { email: credentials.email });
  }
  return data;
}

/**
 * Log in with existing account.
 * @param {{ email: string, password: string }} credentials
 * @returns {{ access_token: string, user: object }}
 */
export async function login(credentials) {
  const data = await request('POST', '/auth/login', credentials);
  if (data.access_token) {
    setToken(data.access_token);
    setStoredUser(data.user || { email: credentials.email });
  }
  return data;
}

/**
 * Log out — clear stored token and user info.
 */
export function logout() {
  removeToken();
}

/**
 * Check if a token is currently stored (does NOT validate expiry).
 */
export function isAuthenticated() {
  return !!getToken();
}