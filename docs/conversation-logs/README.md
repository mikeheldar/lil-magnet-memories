# Cursor conversation archive — Li'l Magnet Memories

Sanitized exports of Cursor agent chats for this project.

## What gets saved

- Parent chat transcripts from Cursor (`agent-transcripts/`)
- Only conversations that mention **lil-magnet-memories** (or Li'l Magnet)
- User and assistant messages as readable Markdown
- Tool use is summarized (tool names only, not full payloads)
- Images are omitted

## What is redacted

Before export, the script redacts common secret patterns:

- API keys (Firebase, OpenAI-style `sk-…`, GitHub tokens, Slack tokens)
- JWTs and Bearer tokens
- Private keys
- `password`, `secret`, `token`, and similar key/value pairs

Emails, names, and project paths are kept so the log stays useful for debugging.

## Manual export

```bash
python3 scripts/export-cursor-conversations.py
```

Force a full re-export:

```bash
python3 scripts/export-cursor-conversations.py --force
```

## Daily GitHub backup

Install the macOS LaunchAgent (runs daily at 11:30 PM by default):

```bash
./scripts/install-daily-conversation-export.sh
```

This pushes to the **`conversation-logs`** branch (separate from **`test`** app deploys) so daily archives do not clutter deploy history.

Logs: `scripts/logs/conversation-export.log`

Uninstall:

```bash
launchctl bootout gui/$(id -u)/com.lilmagnetmemories.daily-conversation-export
rm ~/Library/LaunchAgents/com.lilmagnetmemories.daily-conversation-export.plist
```
