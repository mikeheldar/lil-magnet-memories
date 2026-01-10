# Deploy Cloudflare Worker for Apple Pay File

## What is a Cloudflare Worker?

A Cloudflare Worker is a JavaScript function that runs at Cloudflare's edge (close to users) and can intercept and modify HTTP requests/responses. In this case, it will serve the Apple Pay file directly without compression.

## Manual Deployment Steps

### Step 1: Go to Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your zone: `lilmagnetmemories.com`
3. Go to **Workers & Pages** in the left sidebar

### Step 2: Create a New Worker

1. Click **Create** → **Create Worker**
2. Name it: `apple-pay-file`
3. Click **Deploy**

### Step 3: Replace the Default Code

1. In the code editor, delete all the default code
2. Copy the entire contents of `api/cloudflare-worker-apple-pay.js` from this project
3. Paste it into the editor
4. Click **Save and deploy**

### Step 4: Add a Route

1. Go to **Workers & Pages** → **apple-pay-file**
2. Click **Triggers** tab
3. Under **Routes**, click **Add route**
4. Enter the route pattern:
   ```
   *.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association
   ```
5. Click **Add route**

### Step 5: Verify

Test the file:
```bash
curl -s https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association | head -c 50
```

You should see the file content starting with `7B227073704964223A22423836424637463839333737353532...` (not garbled binary).

The file should be **9099 bytes** (not 2026 bytes).

## How It Works

The Worker:
- Intercepts requests to `/.well-known/apple-developer-merchantid-domain-association`
- Serves the file content directly (embedded in the Worker code)
- Sets correct headers (`Content-Type: text/plain`, `Content-Encoding: identity`)
- Bypasses Cloudflare's automatic compression since the content is embedded

## Troubleshooting

- **Still seeing compressed content?** Make sure the route pattern matches exactly
- **404 error?** Check that the route is active in the Triggers tab
- **Wrong file size?** The Worker might not be active - check the route configuration

