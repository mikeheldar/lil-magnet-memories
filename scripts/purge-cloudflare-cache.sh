#!/bin/bash

# Cloudflare Cache Purge Script
# Usage: ./purge-cloudflare-cache.sh [file-url] or "everything"

API_TOKEN="QSM_2rYAfezfF2p8tgCbtlYKcl5v4wCbohHQv3R_"
ZONE_ID="399f1301795d4348b3e3785eeee94656"

if [ "$1" = "everything" ]; then
  echo "Purging entire Cloudflare cache..."
  RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything": true}')
else
  FILE_URL="${1:-https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association}"
  echo "Purging cache for: $FILE_URL"
  RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data "{\"files\": [\"${FILE_URL}\"]}")
fi

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Cache purged successfully!"
  echo "$RESPONSE" | jq '.result'
else
  echo "❌ Failed to purge cache"
  echo "$RESPONSE" | jq '.errors'
  exit 1
fi

