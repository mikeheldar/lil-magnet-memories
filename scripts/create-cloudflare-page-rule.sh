#!/bin/bash

# Cloudflare API script to create Page Rule for Apple Pay file
# Usage: ./create-cloudflare-page-rule.sh YOUR_API_TOKEN YOUR_ZONE_ID

set -e

API_TOKEN="${1}"
ZONE_ID="${2}"

if [ -z "$API_TOKEN" ] || [ -z "$ZONE_ID" ]; then
  echo "Usage: $0 YOUR_API_TOKEN YOUR_ZONE_ID"
  echo ""
  echo "Get your Zone ID from Cloudflare Dashboard → Your Domain → Overview"
  echo "Get API Token from: https://dash.cloudflare.com/profile/api-tokens"
  echo "  - Create token with permissions: Zone:Page Rules:Edit, Zone:Zone:Read"
  exit 1
fi

# URL pattern - matches the Apple Pay file on any subdomain
URL_PATTERN="*.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association"

echo "Creating Page Rule for: $URL_PATTERN"
echo ""

# Create the Page Rule
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/pagerules" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{
    \"targets\": [
      {
        \"target\": \"url\",
        \"constraint\": {
          \"operator\": \"matches\",
          \"value\": \"${URL_PATTERN}\"
        }
      }
    ],
    \"actions\": [
      {
        \"id\": \"cache_level\",
        \"value\": \"bypass\"
      },
      {
        \"id\": \"edge_cache_ttl\",
        \"value\": 7200
      }
    ],
    \"priority\": 1,
    \"status\": \"active\"
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo ""
  echo "✅ Page Rule created successfully!"
  RULE_ID=$(echo "$RESPONSE" | jq -r '.result.id')
  echo "Rule ID: $RULE_ID"
  echo ""
  echo "Wait 2-3 minutes for the rule to take effect, then test with:"
  echo "curl -s -D - https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association -o /dev/null | grep -E '(content-encoding|content-length|cf-cache-status)' -i"
else
  echo ""
  echo "❌ Failed to create Page Rule"
  ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message // "Unknown error"')
  echo "Error: $ERROR"
  exit 1
fi

