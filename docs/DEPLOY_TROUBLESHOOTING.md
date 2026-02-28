# Deploy troubleshooting (test.lilmagnetmemories.com)

## Blank page / "Expected JavaScript but got text/html"

This usually means the browser requested a `.js` file (e.g. `/assets/index.xxxxx.js`) but the server returned HTML (often the SPA `index.html` or a 404 page). So the script never runs and the page stays blank.

### 1. Check the build on Vercel

- Open the project on [Vercel](https://vercel.com) → **Deployments** → latest deployment → **Building** tab.
- Confirm the build **succeeds** and that the **Output** (or build logs) shows `dist/spa` with an `assets/` folder and `.js` files.
- If the build fails or `dist/spa/assets/` is missing, fix the build (e.g. Node version, `npm install`, or build errors).

### 2. Confirm build settings

In Vercel → **Project** → **Settings** → **General**:

- **Framework Preset:** "Other" (or leave as detected; `vercel.json` sets `framework: null` and overrides).
- **Build Command:** `npm run build` (or leave empty to use `vercel.json`).
- **Output Directory:** `dist/spa` (must match Quasar SPA output).
- **Install Command:** `npm install` (or leave empty to use `vercel.json`).

If any of these are wrong, correct them or remove overrides so `vercel.json` is used.

### 3. Redeploy with a clean build

- **Deployments** → three dots on the latest deployment → **Redeploy**.
- Enable **Clear build cache and redeploy** so the full build runs again and assets are produced.

### 4. Environment variables for the test site

Preview (and branch `test-environment`) need the right env vars so the app can run after the JS loads:

- In Vercel → **Settings** → **Environment Variables**, add for **Preview** (and optionally limit to branch `test-environment`):
  - `VITE_IS_TEST_ENVIRONMENT` = `true`
  - All `VITE_FIREBASE_*_TEST` (and other `VITE_*`) as in `docs/VERCEL_ENV_TEST.md`.

Sync from local: from repo root, run `./scripts/sync-vercel-env.sh` (after `npx vercel link`).

### 5. Verify assets in the deployment

After a successful deploy, open:

- `https://test.lilmagnetmemories.com/assets/`  
  (or the exact path from the failed request in the browser Network tab).

If you get 404 or HTML instead of a directory listing or a `.js` file, the build output is wrong or the Output Directory is misconfigured.
