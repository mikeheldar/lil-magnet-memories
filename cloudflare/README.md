# Cloudflare prerender worker

Routes crawler user-agents to Prerender.io; humans hit the SPA directly.
**Deploys via Cloudflare (dashboard or wrangler), NOT via git pushes / Vercel.**

## Incident 2026-07-04 → : crawlers get 503
Prerender.io rejects the worker's `PRERENDER_TOKEN`
(`x-prerender-reject-reason: invalid-x-prerender-token-provided`) and the
live worker passes the 503 through — the site is invisible to Google.

### Option A — fastest (≈2 min, no prerender.io login)
Cloudflare dashboard → Workers & Pages → `lilmagnet-prerender` → Settings →
Domains & Routes → **remove/disable both routes**. Crawlers immediately get
the normal SPA (200). Googlebot renders JS fine; prerendering can come back later.

### Option B — full fix (≈10 min, restores prerendering)
1. Copy a valid token from the prerender.io dashboard.
2. From this directory (on the `dev` branch — it has the fail-open worker):
   `export CLOUDFLARE_API_TOKEN=<cf token>` then
   `PRERENDER_TOKEN=<prerender token> ./deploy.sh`
   (or paste `prerender.worker.js` + set the secret in the dashboard).

### Verify (either option)
`./check_seo.sh` — or `curl -A Googlebot -I https://www.lilmagnetmemories.com/` → expect 200.

## ⚠️ Branch warning
The `staging` branch's copy of `prerender.worker.js` had the fail-open fix
**reverted** by the 2026-07-05 staging-init commit (`8946097`). Always deploy
the worker from `dev` (fail-open: Prerender 5xx/errors fall back to the origin
SPA so crawlers never see a 503 again).
