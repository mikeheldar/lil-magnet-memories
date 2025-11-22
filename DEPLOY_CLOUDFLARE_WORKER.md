# Deploy Cloudflare Worker to Fix Apple Pay File Compression

## The Problem

Cloudflare Page Rules cannot disable Brotli compression. We need a Worker to intercept the response and strip the `content-encoding` header.

## Deploy via Cloudflare Dashboard

1. **Go to Workers & Pages:**
   - Cloudflare Dashboard → Workers & Pages → Create → Create Worker

2. **Name the Worker:**
   - Name: `apple-pay-fix`

3. **Paste the Worker Code:**
   - Copy the contents of `cloudflare-worker-apple-pay.js`
   - Paste into the Worker editor
   - Click "Save and Deploy"

4. **Add Route:**
   - Go to Workers & Pages → `apple-pay-fix` → Settings → Triggers
   - Click "Add Route"
   - Route: `*.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association`
   - Click "Save"

## Deploy via API (Alternative)

```bash
# 1. Create the Worker
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/workers/scripts/apple-pay-fix" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @cloudflare-worker-apple-pay.js

# 2. Add route (you'll need your Account ID)
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/workers/routes" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "pattern": "*.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association",
    "script": "apple-pay-fix"
  }'
```

## Test After Deployment

Wait 1-2 minutes, then test:

```bash
curl -s -D - https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association -o /dev/null | grep -E "(content-encoding|content-length|cf-cache-status)" -i
```

You should see:
- ✅ No `content-encoding: br` header
- ✅ `content-length: 9099` (not 2026)
- ✅ `content-type: text/plain; charset=utf-8`

## How It Works

The Worker:
1. Intercepts requests to the Apple Pay file
2. Fetches the original response from Vercel
3. Strips all compression headers (`content-encoding`, etc.)
4. Sets correct headers for Apple Pay verification
5. Returns the uncompressed file

This ensures Apple Pay receives the file exactly as stored, without any Cloudflare modifications.

