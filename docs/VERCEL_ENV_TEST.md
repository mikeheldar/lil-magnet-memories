# Vercel environment variables for test site (test.lilmagnetmemories.com)

The **test-environment** branch (Quasar SPA) uses **VITE_**-prefixed variables. Set these in the Vercel project for **Preview** (or for the `test-environment` branch) so the test site works.

## Required for test deployment

| Variable | Description |
|----------|-------------|
| `VITE_IS_TEST_ENVIRONMENT` | Set to `true` for test previews |
| `VITE_FIREBASE_API_KEY_TEST` | Firebase Web API key (test project) |
| `VITE_FIREBASE_AUTH_DOMAIN_TEST` | e.g. `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID_TEST` | Firebase project ID (e.g. `lil-magnet-memories`) |
| `VITE_FIREBASE_STORAGE_BUCKET_TEST` | e.g. `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID_TEST` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID_TEST` | Firebase app ID |

## Also used (production + test)

- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_SQUARE_APPLICATION_ID`, `VITE_SQUARE_LOCATION_ID`
- `VITE_GOOGLE_PLACES_API_KEY`, `VITE_GOOGLE_PLACE_ID`, `VITE_GOOGLE_REVIEW_URL`
- `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`

**Where to set:** Vercel → Project → Settings → Environment Variables. Add for **Preview** (or limit to branch `test-environment`).

**List current vars (API):** `VERCEL_TOKEN=xxx ./scripts/vercel-env-ls.sh --decrypt`
