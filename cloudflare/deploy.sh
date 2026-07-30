#!/usr/bin/env bash
# One-command deploy of the prerender worker (fail-open version on dev).
# Needs CLOUDFLARE_API_TOKEN in the environment (Workers Scripts:Edit + Workers Routes:Edit).
set -euo pipefail
cd "$(dirname "$0")"
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || { echo "Set CLOUDFLARE_API_TOKEN first"; exit 1; }
npx wrangler@latest deploy
if [ -n "${PRERENDER_TOKEN:-}" ]; then
  echo "$PRERENDER_TOKEN" | npx wrangler@latest secret put PRERENDER_TOKEN
else
  echo "NOTE: PRERENDER_TOKEN env not set — worker secret unchanged."
fi
echo "Verify with: ./check_seo.sh"
