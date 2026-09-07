# Admin_Web - Build & Health Status

_Full pass for production readiness._

## ✅ It builds and runs

- `rm -rf node_modules package-lock.json && npm install` → **184 packages, 0 vulnerabilities**.
- `npm run build` → **succeeds** (2146 modules, ~1s, clean `dist/`).
- The earlier blocker (missing Linux `rolldown` native binary) was purely a
  packaging artifact from a cross-OS zip - fixed by reinstalling on this machine.
  **Never ship the zipped `node_modules`; always `npm install` on the target.**

## ✅ Real bugs found & fixed

1. **`BASE_URL is not defined` (runtime crash)** - `services/adminWsService.js`.
   My earlier central-config refactor removed `BASE_URL` but the token-refresh
   `fetch()` still referenced it → the WS refresh path would throw. Fixed to use
   `API_BASE_URL` from `config/env.js`.
2. **Conditional `useMemo` / Rules-of-Hooks (React crash)** -
   `features/bridge/pages/BridgeEmployeeDetailPage.jsx`. An `if (!staffId) return null;`
   sat *before* a `useMemo`, so hook order changed between renders. Moved the
   guard to after all hooks.
3. **React Query v5 misuse (offers didn't refresh)** - fixed earlier in
   `features/offers/hooks/useOffers.js` (`invalidateQueries({ queryKey })` +
   `placeholderData`).
4. **Support status-filter over-matching** + **missing pagination** - fixed
   earlier in the support module.
5. Nearly-introduced-then-caught: a too-broad `sed` deleted `import React` from
   `main.jsx` (which uses `React.StrictMode`) - restored before it shipped. Lint
   + build caught it. (Lesson: verify mechanical edits with a build.)

## Cleanup done

- Removed ~17 dead imports/vars (unused `React` imports, unused icons, unused
  helpers) across ~12 files.
- Build config: `sourcemap: false` (explicit) and moved console-drop to the
  Vite-8 `oxc` block (the old `esbuild.drop` was ignored by the oxc pipeline).

## Remaining lint (59) - intentionally left, NOT bugs

All remaining items are ESLint-10 / React-19 **style** rules that flag valid,
working patterns this codebase was written with:

| Rule | Count | Why left |
|---|---|---|
| `react-hooks/set-state-in-effect` | ~18 | The standard "sync fetched data into state" effect pattern. All have correct deps → no render loops. Not a bug. |
| `react-hooks/static-components` | ~19 | Prefers hoisting nested component definitions. Cosmetic. |
| `react-hooks/exhaustive-deps` | ~8 | Mostly intentional deps. Case-by-case; none observed to misbehave. |
| `no-unused-vars` | 7 | Harmless dead destructure params (e.g. KycCard number-input props). Removing risks touching working forms; left for a calm cleanup. |
| misc (`no-empty`, `preserve-caught-error`, …) | few | Style. |

**Crash-class rules (`no-undef`, `rules-of-hooks`) are at ZERO.**

Chasing these 59 to zero is a large mechanical refactor across ~20 files with
real regression risk for no behavioral gain - deliberately deferred to after
launch (or relax the over-strict rules in `eslint.config.js`).

## Security (from earlier audit - still holds)

No XSS, no hardcoded secrets, fail-closed RBAC, tokens out of URLs (WS auth
frames), no backend URL hardcoded (central `config/env.js`). See `SECURITY.md`.

## Deploy checklist

1. **Clean install on the deploy host:** `rm -rf node_modules package-lock.json && npm install` (do NOT copy node_modules from another OS).

2. **Set `VITE_API_URL` at build time (required):** The production backend URL must be explicitly set as an environment variable during the build. Do NOT rely on the committed `.env` file. Example:
   ```bash
   VITE_API_URL=https://production-backend.com/api/v1 npm run build
   ```
   If `VITE_API_URL` is not set, the build will fail with an early error message.

3. **Serve the built frontend:** After build succeeds, serve `dist/` over HTTPS with SPA fallback (all non-file routes redirect to `index.html`).

4. **WebSocket configuration:** Verify the backend supports the auth-frame handshake (see `app/core/websocket_auth.py`) for chat/notifications real-time features.

5. **Backend deployment:** Backend `bmd` must be deployed for: analytics CSV export, OTP email/mobile change, and the RBAC/thumbnail fixes.

**Important:** Never commit production secrets, URLs, or tokens to `.env` or any configuration file. Use environment variables at deploy time only.

