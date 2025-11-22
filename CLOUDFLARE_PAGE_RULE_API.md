# Cloudflare API Page Rule Setup for Apple Pay File

## Quick Setup

### Step 1: Get Your Credentials

1. **Get Zone ID:**
   - Go to Cloudflare Dashboard → `lilmagnetmemories.com` → Overview
   - Zone ID is shown at the bottom right
   - Or run: `curl -X GET "https://api.cloudflare.com/client/v4/zones?name=lilmagnetmemories.com" -H "Authorization: Bearer YOUR_API_TOKEN"`

2. **Get API Token:**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use "Edit zone DNS" template OR create custom token with:
     - **Zone** → **Page Rules** → **Edit**
     - **Zone** → **Zone** → **Read**

### Step 2: Create Page Rule

**Option A: Use the script**
```bash
./scripts/create-cloudflare-page-rule.sh YOUR_API_TOKEN YOUR_ZONE_ID
```

**Option B: Manual API call**
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/pagerules" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "targets": [
      {
        "target": "url",
        "constraint": {
          "operator": "matches",
          "value": "*.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association"
        }
      }
    ],
    "actions": [
      {
        "id": "cache_level",
        "value": "bypass"
      },
      {
        "id": "edge_cache_ttl",
        "value": 7200
      }
    ],
    "priority": 1,
    "status": "active"
  }'
```

## Available Page Rule Actions

Common action IDs you can use:
- `cache_level` - Values: `bypass`, `basic`, `simplified`, `aggressive`, `cache_everything`
- `edge_cache_ttl` - Value: number of seconds (minimum 7200 = 2 hours)
- `browser_cache_ttl` - Value: number of seconds
- `disable_security` - Value: `on` or `off`
- `disable_apps` - Value: `on` or `off`
- `disable_zaraz` - Value: `on` or `off`

**Note:** Unfortunately, Cloudflare Page Rules don't have a direct "disable Brotli" action. The `cache_level: bypass` should help, but if Brotli is still applied, you'll need to use a Cloudflare Worker instead.

## List Existing Page Rules

```bash
curl -X GET "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/pagerules" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.'
```

## Delete a Page Rule

```bash
curl -X DELETE "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/pagerules/RULE_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

## Test After Creating Rule

Wait 2-3 minutes, then test:

```bash
curl -s -D - https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association -o /dev/null | grep -E "(content-encoding|content-length|cf-cache-status)" -i
```

Look for:
- `cf-cache-status: BYPASS` (confirms rule is active)
- No `content-encoding: br` header
- `content-length: 9099` (not 2026)

## If Page Rule Doesn't Disable Brotli

If the Page Rule doesn't prevent Brotli compression, you'll need to use a **Cloudflare Worker** to strip the `content-encoding` header. See the Worker code example provided earlier.

