#!/usr/bin/env bash
# List environment variables for this project via Vercel REST API.
# Requires VERCEL_TOKEN (create at https://vercel.com/account/tokens).
# Usage: VERCEL_TOKEN=xxx ./scripts/vercel-env-ls.sh [projectName] [--decrypt]
#   projectName: default from .vercel/project.json or lil-magnet-memories
#   --decrypt: show decrypted values (default: keys + targets only)

set -e

PROJECT_NAME=""
DECRYPT="false"
for arg in "$@"; do
  if [[ "$arg" == "--decrypt" ]]; then
    DECRYPT="true"
  elif [[ -n "$arg" && -z "$PROJECT_NAME" ]]; then
    PROJECT_NAME="$arg"
  fi
done

if [[ -z "$VERCEL_TOKEN" ]]; then
  echo "Error: Set VERCEL_TOKEN (create at https://vercel.com/account/tokens)" >&2
  exit 1
fi

if [[ -z "$PROJECT_NAME" ]]; then
  if [[ -f .vercel/project.json ]]; then
    PROJECT_NAME=$(node -e "const p=require('./.vercel/project.json'); console.log(p.projectId || p.name || '')" 2>/dev/null || true)
  fi
  [[ -z "$PROJECT_NAME" ]] && PROJECT_NAME="lil-magnet-memories"
fi

URL="https://api.vercel.com/v10/projects/${PROJECT_NAME}/env?decrypt=${DECRYPT}"
[[ -n "$VERCEL_TEAM_ID" ]] && URL="${URL}&teamId=${VERCEL_TEAM_ID}"

echo "Project: $PROJECT_NAME (decrypt=$DECRYPT)"
echo "---"
RESP=$(curl -sS -H "Authorization: Bearer $VERCEL_TOKEN" "$URL")

if echo "$RESP" | head -1 | grep -q '"error"'; then
  echo "$RESP" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.error(d.error?.message || JSON.stringify(d)); process.exit(1)"
  exit 1
fi

echo "$RESP" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const envs = d.envs && Array.isArray(d.envs) ? d.envs : [];
if (!envs.length) { console.log('(no env vars)'); process.exit(0); }
envs.forEach(e => {
  const key = e.key;
  const val = e.value;
  const target = Array.isArray(e.target) ? e.target.join(',') : (e.target || '?');
  console.log(key + ' [' + target + ']');
  if (val != null && val !== '') console.log('  ' + val);
});
"
