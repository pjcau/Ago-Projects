# docker:test:unit — Run Results & Analysis

## Command Executed

```bash
docker compose run --rm --no-deps frontend-test
```

## Summary

| Metric       | Count |
|-------------|-------|
| Test Suites | **3 failed**, 4 passed, 7 total |
| Tests       | **15 failed**, 45 passed, 60 total |
| Snapshots   | 0 total |
| Exit Code   | 1 |

---

## Failed Test Suites & Root Causes

### 1. `src/context/AuthContext.test.js` — 3 tests failing

**Failing tests:**
- `AuthContext › login sets error on failure`
- `AuthContext › register sets error on failure`
- `AuthContext › clearError resets error`

**Root cause:** In `src/context/AuthContext.js`, the `login()` and `register()` callbacks **re-throw** the error after calling `setError()`:

```javascript
catch (err) {
  setError(err.message);
  throw err;   // <-- this causes unhandled promise rejection in tests
}
```

When the test clicks the login/register button, the rejected promise is unhandled (the `onClick={() => login(...)}` doesn't catch it), causing the test to fail before the DOM assertion runs. The `clearError` test fails because it depends on the same login-with-error flow.

**Fix:** Remove the `throw err;` in the `login` and `register` callbacks (or wrap it in a condition). The error is already stored in state via `setError` — the consumer can check `error` without needing the re-throw.

---

### 2. `src/pages/LoginPage.test.js` — 5 tests failing

**Failing tests:**
- `LoginPage › renders the login form with email, password, and submit button`
- `LoginPage › displays validation errors for empty fields on submit`
- `LoginPage › calls login and navigates to / on success`
- `LoginPage › shows spinner while submitting`
- `LoginPage › displays server error from context`

**Root cause:** The `LoginPage` component renders both an `<h2>Login</h2>` heading AND a `<button>Login</button>` submit button. Tests use `screen.getByText('Login')` which matches multiple elements (ambiguous query). React Testing Library throws when `getByText` finds more than one match.

**Fix:** Use more specific selectors in tests, e.g.:
- `screen.getByRole('button', { name: /login/i })` for the button
- `screen.getByRole('heading', { name: /login/i })` for the heading
- Or `screen.getAllByText('Login')` if both are needed

---

### 3. `src/pages/CatalogPage.test.js` — 7 tests failing

**Failing tests:**
- `CatalogPage › renders products after successful fetch`
- `CatalogPage › filters products by search query`
- `CatalogPage › shows "no products match" when search has no results`
- `CatalogPage › clears search when clear button is clicked`
- `CatalogPage › shows server error message on non-ok response`
- `CatalogPage › filters by category as well`
- `CatalogPage › filters by description`

**Root cause A (6 tests):** The `CatalogPage` component renders each product **twice** — once in cards (`<div class="product-card">`) and once in a table (`<tr>`). Tests use `screen.getByText('Classic Leather Backpack')` which finds 2 matches.

**Fix:** Use `screen.getAllByText('Classic Leather Backpack')` or scope queries to a specific container, or use `screen.getByRole('cell', { name: 'Classic Leather Backpack' })`.

**Root cause B (1 test — "server error message"):** The `global.fetch` mock provides `json()` but **not** `text()`. The component's error-handling code calls `await res.text()` first, which throws `TypeError` (since `.text` is not a function). This `TypeError` propagates to the outer catch which then shows the **network error** message ("Could not reach the server…") instead of the server error detail. The test expects to see `"Internal server error"` but the DOM shows the network error message.

**Fix:** Add `text: () => Promise.resolve(JSON.stringify({ detail: 'Internal server error' }))` to the mock, OR change the test to expect the actual message that would appear with the current code.

---

## Passing Test Suites (4)

- `src/utils/validators.test.js`
- `src/services/authService.test.js`
- `src/components/Navbar.test.js`
- `src/pages/RegisterPage.test.js`

---

## Console Warnings (non-blocking)

React Router v6 deprecation warnings about `v7_startTransition` future flag. These are informational and do not cause test failures.

---

## Recommended Actions

1. **AuthContext:** Remove `throw err;` from the `catch` blocks in `login()` and `register()` (or add a flag to control re-throwing).
2. **LoginPage test:** Replace ambiguous `getByText('Login')` with `getByRole('button', { name: /login/i })` etc.
3. **CatalogPage test:** Replace `getByText('Classic Leather Backpack')` with `getAllByText(...)` or role-based queries. Add `text()` method to the fetch mock.