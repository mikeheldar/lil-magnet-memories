# Path A: Firebase Hosting + Prerender.io (Li'l Magnet Memories)

This app is a **Quasar SPA** on **Firebase Hosting** (`dist/spa`, history mode). Crawlers that only see `index.html` get weak SEO. **Prerender.io** renders JavaScript pages and caches HTML for bots.

Firebase Hosting cannot branch on User-Agent. Prerender’s **supported** setup is:

1. Keep **Firebase Hosting** as the site origin (unchanged deploy flow).
2. Put **Cloudflare** in front of your **custom domain** (orange-cloud proxy).
3. Run Prerender’s **Cloudflare Worker** so bot traffic goes to `service.prerender.io`, while humans hit Firebase normally.

Official reference: [Prerender — Firebase integration](https://docs.prerender.io/docs/firebase).

## Prerequisites

- [Prerender.io](https://prerender.io) account and **paid plan** (production traffic).
- **Prerender token**: Dashboard → **Security and Access** → **Prerender token** ([direct link](https://dashboard.prerender.io/security/prerender-token)).
- Domain **DNS** managed in **Cloudflare** (nameservers pointed to Cloudflare).
- Custom domain already connected to **Firebase Hosting** (Build → Hosting).

## 1. Cloudflare + Firebase DNS

1. In **Firebase Console** → your project → **Hosting** → **Add custom domain** (e.g. `lilmagnetmemories.com`, `www`).
2. Firebase shows **A** / **TXT** records (and **CNAME** for `www` if applicable).
3. In **Cloudflare** → **DNS**, add those records.
4. For records that should reach Firebase through Cloudflare’s proxy, set **Proxy status** to **Proxied** (orange cloud) as Prerender’s guide describes for the main **A** record (and **CNAME** for `www` if used).
5. In Firebase, complete **Verify** once DNS has propagated.

Repeat for **test** hostnames (e.g. `test.lilmagnetmemories.com`) if you want Prerender there too—you’ll add another Worker **route** later.

## 2. Deploy the Worker

The worker source lives in this repo:

`cloudflare/prerender.worker.js`

### Option A — Cloudflare Dashboard (no CLI)

1. Cloudflare → **Workers & Pages** → **Create** → **Create Worker**.
2. Name it (e.g. `lilmagnet-prerender`).
3. **Edit code** → replace the default script with the contents of `cloudflare/prerender.worker.js`.
4. **Save and deploy**.
5. Worker → **Settings** → **Domains & Routes** → **Add** → **Route**:
   - Example: `lilmagnetmemories.com/*` and `www.lilmagnetmemories.com/*` (or `*.lilmagnetmemories.com/*` if you use a single worker for apex + subdomains—match your DNS setup).
6. **Variables** (or **Secrets**):
   - Add **`PRERENDER_TOKEN`** with your token from the Prerender dashboard (use **Encrypt** / secret type if offered).
7. Deploy again if needed.

### Option B — Wrangler CLI

1. `cd cloudflare`
2. Copy `wrangler.toml.example` → `wrangler.toml` and set `[[routes]]` to your zone/patterns.
3. `npx wrangler login`
4. `npx wrangler secret put PRERENDER_TOKEN` (paste token when prompted).
5. `npx wrangler deploy`

Do **not** commit `wrangler.toml` if it contains secrets; the example file is safe to commit.

## 3. Add your domain in Prerender.io

In the Prerender dashboard, **add** the same hostname(s) you serve publicly (production, and test if applicable). Recache important URLs after major releases (`/`, `/pricing`, key product pages).

## 4. Verify

- [Prerender — test your integration](https://docs.prerender.io/docs/how-to-test-your-site-after-you-have-successfully-validated-your-prerender-integration)
- Prerender looks for **`x-prerender-request-id`** (or similar) on bot responses. See [integration not detected](https://docs.prerender.io/docs/what-should-i-do-if-i-receive-a-prerender-integration-not-detected-error).

### Apex **and** `www`

Add **two** routes on the same Worker if both hostnames serve the site:

- `lilmagnetmemories.com/*`
- `www.lilmagnetmemories.com/*`

Routing only the apex is a common cause of **integration failed** in Domain Manager.

### Quick checks (replace host)

```bash
curl -sI -A "Googlebot" "https://lilmagnetmemories.com/" | tr -d '\r' | grep -i prerender
curl -sI -A "Googlebot" "https://www.lilmagnetmemories.com/" | tr -d '\r' | grep -i prerender
```

### Security

Use an **encrypted** Worker secret for **`PRERENDER_TOKEN`**. If the token was exposed (screenshot, chat, git), **rotate** it in Prerender and update Cloudflare.

- **Google Search Console** → URL Inspection → **Test live URL** (uses Google inspection user-agent, listed in the worker as `google-inspectiontool` / `googlebot`).

## 5. Optional: “See users” (separate from Prerender)

Prerender does not show visitors. Add one of:

- **Microsoft Clarity** (free session replay / heatmaps) — snippet in `index.html` or a Quasar boot file.
- **Plausible** / **Fathom** / **GA4** for traffic and realtime counts.

## Troubleshooting

- **403/404 after integration**: See [Prerender troubleshooting](https://docs.prerender.io/docs/4-troubleshooting) — ensure Prerender can reach your **public** HTTPS URL (Firebase custom domain live, SSL valid).
- **Loop or empty pages**: Worker skips requests with header `X-Prerender`; Prerender’s fetch should not recurse if configured correctly.
- **Assets 404 for bots**: Static files (`.js`, `.css`, images) are **not** sent to Prerender in this worker—they use `fetch(request)` to origin. If something breaks, check Cloudflare cache rules vs. Firebase Hosting.

## Repo layout

| Path | Purpose |
|------|---------|
| `cloudflare/prerender.worker.js` | Worker script (Prerender official logic + missing-token guard) |
| `cloudflare/wrangler.toml.example` | Template for CLI deploy |
| `firebase.json` | Unchanged: still serves SPA from `dist/spa` |

No application code changes are **required** for Path A; deploy stays:

```bash
quasar build
firebase deploy --only hosting
```
