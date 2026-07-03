#!/usr/bin/env bash
# Export sanitized Cursor conversations and push to the conversation-logs branch.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="${CONVERSATION_LOG_WORKTREE:-$REPO_ROOT/../lil-magnet-memories-conversation-logs}"
BRANCH="${CONVERSATION_LOG_BRANCH:-conversation-logs}"
LOG_DIR="${CONVERSATION_LOG_LOG_DIR:-$REPO_ROOT/scripts/logs}"
LOG_FILE="$LOG_DIR/conversation-export.log"

mkdir -p "$LOG_DIR"

{
  echo "===== $(date -Iseconds) daily conversation export ====="

  python3 "$REPO_ROOT/scripts/export-cursor-conversations.py" --output "$REPO_ROOT/docs/conversation-logs"

  if [ ! -e "$WORKTREE/.git" ]; then
    echo "Worktree missing at $WORKTREE — run scripts/install-daily-conversation-export.sh first"
    exit 1
  fi

  mkdir -p "$WORKTREE/docs/conversation-logs"
  rsync -a "$REPO_ROOT/docs/conversation-logs/" "$WORKTREE/docs/conversation-logs/"

  cd "$WORKTREE"
  git add docs/conversation-logs

  if git diff --cached --quiet; then
    echo "No conversation changes to commit."
    exit 0
  fi

  git commit -m "chore: conversation log export $(date +%Y-%m-%d)"
  git push origin "$BRANCH"
  echo "Pushed to origin/$BRANCH"
} >>"$LOG_FILE" 2>&1
