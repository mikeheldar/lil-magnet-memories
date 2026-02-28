#!/usr/bin/env bash
# Set Vercel env vars from .env/.env.local via API (Preview + test-environment branch).
# Requires VERCEL_TOKEN. Usage: VERCEL_TOKEN=xxx ./scripts/vercel-env-set.sh
# Options: --production to set for production; --branch NAME to set preview branch.

set -e
cd "$(dirname "$0")/.."
node scripts/vercel-env-set.js "$@"
