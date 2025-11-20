# Apple Pay Domain Association File - Cache Fix Guide

## Problem Summary
The Apple Pay domain association file is being served incorrectly:
- **Expected**: 9099 bytes (hex-encoded string)
- **Actual**: 2026 bytes (binary garbage from old cached deployment)

## Root Cause
Vercel/Cloudflare is serving a cached version of an old file from a previous deployment. The static file serving takes precedence over API routes, so the rewrite isn't working.

## Solutions

### Option 1: Manual Cache Purge (Recommended)

#### Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your project: `lil-magnet-memories`
3. Go to **Deployments** tab
4. Find the latest deployment
5. Click **"..."** menu → **"Redeploy"** (this forces a fresh deployment)
6. OR go to **Settings** → **Edge Network** → **Purge Cache**

#### Cloudflare Dashboard (if using Cloudflare):
1. Go to https://dash.cloudflare.com
2. Select your domain: `lilmagnetmemories.com`
3. Go to **Caching** → **Configuration**
4. Click **"Purge Everything"** or **"Custom Purge"**
5. Enter: `/.well-known/apple-developer-merchantid-domain-association`
6. Click **"Purge"**

#### Via Vercel CLI:
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Purge cache for specific path
vercel --prod --force

# Or redeploy
vercel --prod
```

### Option 2: Alternative Path (Temporary Workaround)

We've set up an alternative path that should bypass cache:
- **New path**: `/apple-pay-domain-association`
- **Original path**: `/.well-known/apple-developer-merchantid-domain-association`

**Note**: Square/Apple needs the file at the exact path `/.well-known/apple-developer-merchantid-domain-association`, so this is only useful for testing. Once cache is purged, the original path should work.

### Option 3: Force Cache Invalidation via Headers

The `vercel.json` is already configured with:
```json
"Cache-Control": "no-cache, no-store, must-revalidate, proxy-revalidate"
```

However, if the file was cached before these headers were set, they won't help until the cache is manually purged.

### Option 4: API Route Override

We've created an API route at `/api/apple-pay-domain-association` that:
- Reads the correct file from the build
- Serves it with proper headers
- Should bypass static file cache

**Current Status**: The rewrite isn't working because static files are served before rewrites are checked.

## Verification Steps

After purging cache, verify the file is correct:

```bash
# Check file size (should be 9099 bytes)
curl -s https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association | wc -c

# Check file content (should start with: 7B22707370496422...)
curl -s https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association | head -c 50

# Compare with source file
diff <(curl -s https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association) public/.well-known/apple-developer-merchantid-domain-association
```

## Next Steps

1. **Immediate**: Purge cache via Vercel dashboard
2. **Verify**: Test the file after cache purge
3. **If still failing**: Check Vercel deployment logs to see if API route is being called
4. **Long-term**: Consider using a versioned path or query parameter to force cache invalidation

## File Locations

- **Source**: `public/.well-known/apple-developer-merchantid-domain-association` (9099 bytes)
- **Build output**: `dist/spa/.well-known/apple-developer-merchantid-domain-association` (9099 bytes)
- **API route**: `api/apple-pay-domain-association.js`
- **Vercel config**: `vercel.json`

## Current Configuration

The `vercel.json` has:
- Rewrite rule to route `/.well-known/apple-developer-merchantid-domain-association` → `/api/apple-pay-domain-association`
- Headers configured for correct Content-Type and no-cache
- Static build from `dist/spa/`

The issue is that Vercel serves static files directly from edge cache before checking rewrites.

