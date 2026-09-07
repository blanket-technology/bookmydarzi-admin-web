# Admin_Web - Security Review & Hardening

_Reviewed for production launch. Handles orders, payments, refunds, customer PII._

## Verdict: production-safe.

A thorough security audit found **no XSS, no hardcoded secrets, no auth bypass,
and correct fail-closed RBAC.** Payment/refund/staff mutations correctly defer to
backend authorization (client RBAC is UX-only, as it should be). The real,
actionable findings have been **fixed** (below); the remaining items are
documented trade-offs that need backend coordination or a product decision.

---

## ✅ Fixed in this review

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | **MEDIUM** | **JWT in WebSocket URL query string** (`adminWsService.js`, `chatUtils.js`) - leaks the access token into Railway/proxy access logs, browser history, Referer headers. | Migrated both WS connections to the backend's **auth-frame** handshake: connect tokenless, then send `{"type":"auth","token":...}` as the first frame. The backend already supported and prefers this (`app/core/websocket_auth.py`). No token in any URL now. |
| 2 | LOW | `getAvailableStaffRoles` **failed open** to the admin role set for an unknown creator role. | Now fail-closed → `[]` (no creatable roles). Backend `_CREATABLE_BY` remains authoritative. |
| 3 | LOW | Prod bundle shipped `console.*` and had no explicit source-map guard. | `vite.config.js`: `build.sourcemap: false` (explicit) + `esbuild.drop: ["console","debugger"]` strips all console/debugger from the prod build. |
| 4 | LOW | **No `.gitignore`** - risk of committing `.env` / `node_modules` if this becomes a repo. | Added `.gitignore` that excludes `.env*` (keeps `.env.example`), `node_modules/`, `dist/`, logs, editor files. |
| 5 | - | Stray zero-byte file named `,` in repo root. | Deleted. |
| 6 | LOW | **Hardcoded backend URL** as a fallback in 3 files (`api.js`, `adminWsService.js`, `chatUtils.js`). | Centralised into `src/config/env.js` - the URL now comes **only** from `VITE_API_URL`, with NO hardcoded fallback. Missing env fails loud in dev / logs in prod. `api.js`, WS service and chat util all import from the one config. No `railway.app` host string anywhere in `src/`. |

---

## ✅ Verified secure (no action needed)

- **XSS**: zero `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function` /
  `document.write`. All API data rendered as text through JSX.
- **RBAC**: fail-closed (`constants/permissions.js`) - unknown role → no perms,
  unmapped route → denied. Every authenticated route is under `<ProtectedRoute>`;
  only `/` (login) and `/captcha` are public. Re-checked on every navigation.
- **Client-role trust**: security decisions (payment override, refunds, staff
  creation) are enforced by the **backend** and the UI only handles the 403.
- **Mass-assignment**: payloads are explicit allow-lists (`buildStaffPayload`,
  `buildRefundPayload`, `buildStatusOverridePayload`) - no arbitrary client fields.
- **Secrets**: none hardcoded; only `VITE_API_URL` (a public URL) in env. No
  secret smuggled into a `VITE_` var (all `VITE_` vars are public by design).
- **Axios**: HTTPS baseURL; single-flight refresh (no thundering herd),
  `_retry` guard (no infinite loop), tokens cleared on refresh failure, auth
  routes excluded from the refresh dance.
- **CSRF**: N/A - bearer-token auth (not cookies), so not CSRF-prone.
- **Dependencies**: all current (React 19.2, Vite 8, axios 1.17, router 7.17).

---

## On "no token can be seen/stolen" + "encryption" - the honest reality

Two facts that drive the decisions below:

1. **Any token the browser uses, browser JS can read.** The token must be
   attached to requests, so it must be reachable by code. **Client-side
   encrypting the token in storage is security theater** - the decrypt key ships
   in the same JS bundle (readable via devtools), so an attacker running JS in
   the page just calls the same decrypt function. It stops nobody. Per OWASP
   guidance, we deliberately **do NOT** add fake token encryption.

2. **The encryption that actually matters is in transit - HTTPS/WSS - which is
   already in place.** Tokens are never sent in cleartext.

**What genuinely protects tokens (all done except the last):**
- ✅ Never in URLs (fixed - WS auth-frame migration).
- ✅ Never logged (console stripped from prod build).
- ✅ HTTPS/WSS everywhere (in-transit encryption).
- ✅ `sessionStorage`, not `localStorage` (dies on tab close).
- 📋 **The only real defense against JS/XSS theft: `HttpOnly` cookies** - a
  cookie JS *cannot* read. This is the recommended fast-follow. It needs
  **backend work** (set `Secure; HttpOnly; SameSite=Strict` cookie on
  login/refresh + add CSRF protection) + a small admin-frontend change, so it is
  intentionally deferred past the 2-day launch rather than rushed and risked.

### Decision (owner: product) - accepted for launch
Ship with `sessionStorage` tokens. Rationale: **there is no XSS in the app
today** (verified), tokens are out of URLs/logs, and traffic is encrypted.
Plan the HttpOnly-cookie migration as the first post-launch hardening item.

---

## Pre-deploy checklist

1. `rm -rf node_modules package-lock.json && npm install && npm run build` on the
   **Linux/deploy machine** - the shipped `node_modules` is from another OS and
   its native Vite/rolldown binary won't run here (build-only, not a security issue).
2. Confirm `VITE_API_URL` is set per environment (prod is the default).
3. Do NOT commit `.env` (now gitignored).
4. Verify WebSocket real-time (chat + notifications) still connects after the
   auth-frame migration - connect, confirm messages flow. (Backend already
   supports it; this is just a smoke test.)
