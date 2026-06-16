/**
 * @jest-environment jsdom
 */

import {
  login,
  register,
  logout,
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  getStoredUser,
} from './authService';

beforeEach(() => {
  localStorage.clear();
  jest.resetAllMocks();
});

describe('token helpers', () => {
  it('setToken/getToken round-trip', () => {
    setToken('test-token-123');
    expect(getToken()).toBe('test-token-123');
  });

  it('removeToken clears token and user', () => {
    setToken('some-token');
    localStorage.setItem('auth_user', JSON.stringify({ email: 'test@test.com' }));
    removeToken();
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('isAuthenticated returns false when no token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when token exists', () => {
    setToken('valid-token');
    expect(isAuthenticated()).toBe(true);
  });
});

describe('getStoredUser', () => {
  it('returns parsed user when stored', () => {
    const user = { email: 'alice@example.com' };
    localStorage.setItem('auth_user', JSON.stringify(user));
    expect(getStoredUser()).toEqual(user);
  });

  it('returns null when no user stored', () => {
    expect(getStoredUser()).toBeNull();
  });

  it('returns null on corrupt JSON', () => {
    localStorage.setItem('auth_user', '{bad json}');
    expect(getStoredUser()).toBeNull();
  });
});

describe('login', () => {
  const credentials = { email: 'alice@example.com', password: 'secret123' };

  it('stores token and user on success', async () => {
    const mockResponse = {
      access_token: 'jwt-token',
      user: { email: 'alice@example.com', id: 1 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse),
    });

    const result = await login(credentials);
    expect(result).toEqual(mockResponse);
    expect(getToken()).toBe('jwt-token');
    expect(getStoredUser()).toEqual({ email: 'alice@example.com', id: 1 });
  });

  it('throws on server error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ detail: 'Invalid credentials' }),
    });

    await expect(login(credentials)).rejects.toThrow('Invalid credentials');
    expect(getToken()).toBeNull();
  });

  it('throws on network failure', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(login(credentials)).rejects.toThrow(
      /Could not reach the server/
    );
  });
});

describe('register', () => {
  const credentials = { email: 'bob@example.com', password: 'mypassword' };

  it('stores token and user on success', async () => {
    const mockResponse = {
      access_token: 'reg-jwt',
      user: { email: 'bob@example.com', id: 2 },
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve(mockResponse),
    });

    const result = await register(credentials);
    expect(result).toEqual(mockResponse);
    expect(getToken()).toBe('reg-jwt');
    expect(getStoredUser()).toEqual({ email: 'bob@example.com', id: 2 });
  });

  it('throws on server error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ detail: 'Email already registered' }),
    });

    await expect(register(credentials)).rejects.toThrow(
      'Email already registered'
    );
  });
});

describe('logout', () => {
  it('clears token and user', () => {
    setToken('some-token');
    localStorage.setItem('auth_user', JSON.stringify({ email: 'test@test.com' }));
    logout();
    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('does not throw if nothing stored', () => {
    expect(() => logout()).not.toThrow();
  });
});