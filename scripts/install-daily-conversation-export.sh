#!/usr/bin/env bash
# Install a macOS LaunchAgent that exports Cursor conversations daily.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKTREE="$REPO_ROOT/../lil-magnet-memories-conversation-logs"
BRANCH="conversation-logs"
PLIST_LABEL="com.lilmagnetmemories.daily-conversation-export"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
HOUR="${CONVERSATION_EXPORT_HOUR:-23}"
MINUTE="${CONVERSATION_EXPORT_MINUTE:-30}"

cd "$REPO_ROOT"

if [ ! -e "$WORKTREE/.git" ]; then
  echo "Creating git worktree at $WORKTREE on branch $BRANCH"
  git fetch origin "$BRANCH" 2>/dev/null || true
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git worktree add "$WORKTREE" "$BRANCH"
  elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    git worktree add -B "$BRANCH" "$WORKTREE" "origin/$BRANCH"
  else
    git worktree add -B "$BRANCH" "$WORKTREE"
    mkdir -p "$WORKTREE/docs/conversation-logs"
    cp "$REPO_ROOT/docs/conversation-logs/README.md" "$WORKTREE/docs/conversation-logs/README.md" 2>/dev/null || true
    cd "$WORKTREE"
    git add docs/conversation-logs || true
    if ! git diff --cached --quiet; then
      git commit -m "chore: initialize conversation log archive"
    fi
    git push -u origin "$BRANCH" || true
    cd "$REPO_ROOT"
  fi
fi

chmod +x "$REPO_ROOT/scripts/daily-conversation-export.sh"
chmod +x "$REPO_ROOT/scripts/export-cursor-conversations.py"

mkdir -p "$HOME/Library/LaunchAgents"

cat >"$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${REPO_ROOT}/scripts/daily-conversation-export.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>${HOUR}</integer>
    <key>Minute</key>
    <integer>${MINUTE}</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${REPO_ROOT}/scripts/logs/conversation-export.launchd.log</string>
  <key>StandardErrorPath</key>
  <string>${REPO_ROOT}/scripts/logs/conversation-export.launchd.err.log</string>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
EOF

launchctl bootout "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
launchctl enable "gui/$(id -u)/${PLIST_LABEL}" 2>/dev/null || true

echo "Installed LaunchAgent: $PLIST_PATH"
echo "Runs daily at ${HOUR}:$(printf '%02d' "$MINUTE")"
echo "Logs: $REPO_ROOT/scripts/logs/conversation-export.log"
echo "Git branch: $BRANCH (worktree: $WORKTREE)"
