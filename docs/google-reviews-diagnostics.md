# Google Reviews API — diagnostics (local & Cloud Shell)

Use these steps **outside the website** to see exactly what Google returns for your Place ID. The site uses the same calls via [`api/google-reviews.js`](../api/google-reviews.js) (Vercel serverless).

## What you need

1. **Place ID** for the business (e.g. from [Place ID Finder](https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder)).  
   - The app reads `VITE_GOOGLE_PLACE_ID`; a common typo (`I` vs `l`) is corrected in [`src/utils/googlePlaceId.js`](../src/utils/googlePlaceId.js).
2. **API key** with:
   - **Places API** (legacy) enabled — for `place/details/json`
   - **Places API (New)** enabled — for `places.googleapis.com/v1/places/...`
   - **Billing** enabled on the Google Cloud project (Maps Platform requires it).
3. **Key restrictions**: For server-side / Cloud Shell tests, temporarily use **IP unrestricted** or **none** for debugging; browser keys with HTTP referrer restrictions **will not work** from Cloud Shell or `curl`.

## Quick test (project repo)

From the repo root (loads `.env` / `.env.local`):

```bash
npm run check:place-reviews -- YOUR_PLACE_ID_HERE
```

Default Place ID in the script is the one in `check-place-reviews.mjs` if you omit the argument.

## Cloud Shell / `curl` (no repo required)

Set variables (do not commit keys):

```bash
export PLACE_ID='ChIJ...'   # your place id
export API_KEY='AIza...'    # same key you use server-side (GOOGLE_PLACES_API_KEY)
```

### A) Legacy Place Details (atmosphere: reviews)

Returns **at most 5** reviews per request (`reviews_sort` affects order).

```bash
curl -sS "https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=name,rating,user_ratings_total,reviews,place_id&reviews_sort=newest&language=en&key=${API_KEY}" | jq .
```

Interpret `status`:

| `status`        | Typical cause |
|-----------------|---------------|
| `OK`            | Request accepted; check `result.reviews` length (0–5). |
| `REQUEST_DENIED` | Key restriction, wrong API, or billing off — read `error_message`. |
| `INVALID_REQUEST` | Bad `place_id` or missing params. |
| `NOT_FOUND`     | Place ID wrong or deprecated. |

### B) Places API (New) — Place Details

Same data model the new stack uses; field mask controls cost/SKU. Reviews need the appropriate **Places API (New)** product enabled and billing.

```bash
curl -sS -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: ${API_KEY}" \
  -H "X-Goog-FieldMask: displayName,rating,userRatingCount,reviews,reviewSummary,googleMapsUri" \
  "https://places.googleapis.com/v1/places/${PLACE_ID}" | jq .
```

If HTTP `403` / `400`, print the JSON body: it often explains SKU, disabled API, or invalid field mask.

### C) Hit your deployed proxy (optional)

After deploy, Vercel serves:

```bash
curl -sS "https://YOUR_DOMAIN/api/google-reviews?placeId=${PLACE_ID}" | jq .
```

Expect `{ "status": "OK", "result": { "reviews": [...], ... } }`.

## Smoke test: what `npm run check:place-reviews` should show

For **legacy Place Details**, expand the JSON and look at **`resultFieldKeys`** (added by the script):

- If you only see **`name`** and **`place_id`** — Google **did not return** `rating`, `user_ratings_total`, or `reviews` even though we asked for them. That almost always means the Maps Platform project **does not have billing/SKU access** for Place Details **atmosphere** (reviews/rating) fields, or the wrong product is enabled. Fix in GCP: enable billing, enable **Places API**, and confirm [usage & billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) for the fields you need.
- If you see **`reviews`** in the keys and `reviewCount` > 0, the API path is working; any gap is then delay, sort, or the 5-review cap.

## Why `reviews` can be empty even when you have Google reviews

1. **Legacy Place Details** only returns **up to five** reviews; newer ones may not all appear depending on sort and what Google selects.
2. **Places API (New)** billing / enablement: if `reviews` is never populated, check [Places API usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing) and that the **Places API (New)** is enabled for the project.
3. **Key restrictions**: server calls must use a key allowed for those APIs (often “IP restriction” for backend, or none while testing).
4. **Propagation delay**: a review you just submitted may take **hours or longer** before it appears in API responses (differs from the public Maps UI).
5. **Wrong Place ID**: confirm with Place ID Finder that the ID matches the listing where you left the review.

## GCP Console checks

- [APIs & Services → Enabled APIs](https://console.cloud.google.com/apis/dashboard): **Places API**, **Places API (New)** (name may show as `places.googleapis.com`).
- [Billing](https://console.cloud.google.com/billing): project linked.
- [Credentials](https://console.cloud.google.com/apis/credentials): key has access to the APIs above; relax restrictions while debugging.
- [Maps Platform → Metrics](https://console.cloud.google.com/google/maps-apis/metrics): failed requests and error codes.

## App wiring (reminder)

| Piece | Role |
|-------|------|
| `VITE_GOOGLE_PLACE_ID` | Frontend: which place to fetch. |
| `GOOGLE_PLACES_API_KEY` or `VITE_GOOGLE_PLACES_API_KEY` | **Server** (`api/google-reviews.js`) — must be set on Vercel for production. |
| `/api/google-reviews` | Proxies to Google; avoids browser CORS. |

Local `quasar dev` does not run Vercel functions unless you use `vercel dev` or point the client at a deployed URL — use `npm run check:place-reviews` or `curl` for raw API debugging.
