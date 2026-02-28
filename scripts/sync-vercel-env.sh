#!/usr/bin/env bash
# Sync VITE_* from .env/.env.local to Vercel via CLI (Quasar test-environment + Nuxt).
# Prerequisites: Run `npx vercel link` once from repo root.
# Usage: ./scripts/sync-vercel-env.sh [target] [branch]
#   target: preview (default), production, or development
#   branch: for preview only, e.g. test-environment (default)

set -e

TARGET="${1:-preview}"
BRANCH="${2:-test-environment}"

# Read VAR from .env.local then .env (.env.local wins)
get_value() {
  local var="$1"
  for f in .env.local .env; do
    [[ -f "$f" ]] || continue
    local val
    val=$(grep -E "^${var}=" "$f" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
    [[ -n "$val" ]] && echo -n "$val" && return
  done
}

# VITE_* vars used by Quasar (test-environment) and by Nuxt if present
VARS=(
  VITE_IS_TEST_ENVIRONMENT
  VITE_FIREBASE_API_KEY
  VITE_FIREBASE_AUTH_DOMAIN
  VITE_FIREBASE_PROJECT_ID
  VITE_FIREBASE_STORAGE_BUCKET
  VITE_FIREBASE_MESSAGING_SENDER_ID
  VITE_FIREBASE_APP_ID
  VITE_FIREBASE_API_KEY_TEST
  VITE_FIREBASE_AUTH_DOMAIN_TEST
  VITE_FIREBASE_PROJECT_ID_TEST
  VITE_FIREBASE_STORAGE_BUCKET_TEST
  VITE_FIREBASE_MESSAGING_SENDER_ID_TEST
  VITE_FIREBASE_APP_ID_TEST
  VITE_SQUARE_APPLICATION_ID
  VITE_SQUARE_LOCATION_ID
  VITE_GOOGLE_PLACES_API_KEY
  VITE_GOOGLE_PLACE_ID
  VITE_GOOGLE_REVIEW_URL
  VITE_EMAILJS_SERVICE_ID
  VITE_EMAILJS_TEMPLATE_ID
  VITE_EMAILJS_PUBLIC_KEY
  VITE_FIREBASE_APPCHECK_SITE_KEY
)

[[ "$TARGET" == "preview" ]] && IS_TEST_DEFAULT="true" || IS_TEST_DEFAULT="false"

echo "Syncing env vars to Vercel via CLI ($TARGET)..."
echo "  (Run from repo root; run 'npx vercel link' first if needed.)"
echo ""

for VAR in "${VARS[@]}"; do
  if [[ "$VAR" == "VITE_IS_TEST_ENVIRONMENT" ]]; then
    VALUE=$(get_value "$VAR")
    VALUE="${VALUE:-$IS_TEST_DEFAULT}"
  else
    VALUE=$(get_value "$VAR")
  fi
  if [[ -n "$VALUE" ]]; then
    echo "Adding $VAR..."
    if [[ "$TARGET" == "preview" ]]; then
      npx vercel env add "$VAR" preview "$BRANCH" --value "$VALUE" --yes 2>/dev/null || echo "  (skip - may already exist)"
    else
      npx vercel env add "$VAR" "$TARGET" --value "$VALUE" --yes 2>/dev/null || echo "  (skip - may already exist)"
    fi
  fi
done

echo ""
echo "Done. Run 'npx vercel env ls' to verify."
