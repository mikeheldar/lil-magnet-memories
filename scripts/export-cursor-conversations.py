#!/usr/bin/env python3
"""Export Cursor agent transcripts to sanitized markdown (secrets redacted)."""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_TRANSCRIPTS = Path.home() / (
    '.cursor/projects/Users-michaelhelman-darley-projects/agent-transcripts'
)
DEFAULT_REPO = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = DEFAULT_REPO / 'docs/conversation-logs'
DEFAULT_STATE = DEFAULT_REPO / 'scripts/.conversation-export-state.json'
DEFAULT_PROJECT_KEYWORDS = ('lil-magnet-memories', "li'l magnet")

REDACTIONS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r'AIza[0-9A-Za-z\-_]{20,}'), '[REDACTED_FIREBASE_API_KEY]'),
    (re.compile(r'sk-[a-zA-Z0-9]{20,}'), '[REDACTED_API_KEY]'),
    (re.compile(r'xox[baprs]-[0-9A-Za-z-]{10,}'), '[REDACTED_SLACK_TOKEN]'),
    (re.compile(r'ghp_[0-9A-Za-z]{20,}'), '[REDACTED_GITHUB_TOKEN]'),
    (re.compile(r'gho_[0-9A-Za-z]{20,}'), '[REDACTED_GITHUB_TOKEN]'),
    (
        re.compile(
            r'-----BEGIN[A-Z ]*PRIVATE KEY-----[\s\S]*?-----END[A-Z ]*PRIVATE KEY-----'
        ),
        '[REDACTED_PRIVATE_KEY]',
    ),
    (re.compile(r'Bearer\s+[A-Za-z0-9\-._~+/]+=*'), 'Bearer [REDACTED_TOKEN]'),
    (re.compile(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+'), '[REDACTED_JWT]'),
    (
        re.compile(
            r'(?i)((?:password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|private[_-]?key)\s*[:=]\s*)["\']?[^"\'\s,}\]]{4,}',
        ),
        r'\1[REDACTED]',
    ),
]


def redact(text: str) -> str:
    for pattern, repl in REDACTIONS:
        text = pattern.sub(repl, text)
    return text


def parse_jsonl(path: Path) -> list[dict]:
    entries: list[dict] = []
    with path.open(encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return entries


def extract_text(entry: dict) -> tuple[str, str]:
    role = entry.get('role', 'unknown')
    message = entry.get('message', {})
    content = message.get('content', [])
    parts: list[str] = []

    if isinstance(content, str):
        parts.append(content)
    elif isinstance(content, list):
        for block in content:
            if not isinstance(block, dict):
                continue
            block_type = block.get('type')
            if block_type == 'text':
                parts.append(str(block.get('text', '')))
            elif block_type == 'tool_use':
                name = block.get('name', 'unknown')
                parts.append(f'\n*[Assistant used tool: {name}]*\n')
            elif block_type == 'image':
                parts.append('\n*[image omitted]*\n')

    return role, '\n'.join(parts)


def conversation_text(entries: list[dict]) -> str:
    chunks: list[str] = []
    for entry in entries:
        _, text = extract_text(entry)
        if text.strip():
            chunks.append(text)
    return '\n'.join(chunks)


def matches_project(entries: list[dict], keywords: tuple[str, ...]) -> bool:
    if not keywords:
        return True
    haystack = conversation_text(entries).lower()
    return any(keyword.lower() in haystack for keyword in keywords)


def to_markdown(conversation_id: str, entries: list[dict]) -> str:
    exported_at = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    lines = [
        f'# Cursor conversation `{conversation_id}`',
        '',
        f'_Exported {exported_at}. Secrets redacted automatically._',
        '',
    ]

    for entry in entries:
        role, text = extract_text(entry)
        text = text.strip()
        if not text:
            continue
        text = redact(text)
        if len(text) > 80_000:
            text = text[:80_000] + '\n\n...[truncated for size]...\n'

        heading = '## User' if role == 'user' else '## Assistant'
        lines.extend([heading, '', text, ''])

    return '\n'.join(lines).rstrip() + '\n'


def fingerprint(path: Path) -> dict[str, float | int]:
    stat = path.stat()
    return {'mtime': stat.st_mtime, 'size': stat.st_size}


def load_state(path: Path) -> dict:
    if not path.exists():
        return {'files': {}}
    return json.loads(path.read_text(encoding='utf-8'))


def save_state(path: Path, state: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2) + '\n', encoding='utf-8')


def export_conversations(
    transcripts_dir: Path,
    output_root: Path,
    state_file: Path,
    *,
    include_subagents: bool = False,
    force: bool = False,
    project_keywords: tuple[str, ...] = DEFAULT_PROJECT_KEYWORDS,
) -> int:
    if not transcripts_dir.exists():
        print(f'Transcripts directory not found: {transcripts_dir}', file=sys.stderr)
        return 0

    today = datetime.now().strftime('%Y-%m-%d')
    out_dir = output_root / today
    out_dir.mkdir(parents=True, exist_ok=True)

    state = load_state(state_file)
    known = state.setdefault('files', {})
    exported_ids: list[str] = []

    for jsonl in sorted(transcripts_dir.glob('*/*.jsonl')):
        if not include_subagents and '/subagents/' in jsonl.as_posix():
            continue

        conversation_id = jsonl.parent.name
        entries = parse_jsonl(jsonl)
        if not matches_project(entries, project_keywords):
            continue

        key = str(jsonl)
        fp = fingerprint(jsonl)
        if not force and known.get(key) == fp:
            continue

        markdown = to_markdown(conversation_id, entries)
        (out_dir / f'{conversation_id}.md').write_text(markdown, encoding='utf-8')
        known[key] = fp
        exported_ids.append(conversation_id)

    if exported_ids:
        index_path = out_dir / 'README.md'
        existing_lines = index_path.read_text(encoding='utf-8').splitlines() if index_path.exists() else []
        if not existing_lines:
            existing_lines = [f'# Conversation exports — {today}', '']
        existing = set(existing_lines)
        for conversation_id in exported_ids:
            line = f'- [{conversation_id}](./{conversation_id}.md)'
            if line not in existing:
                existing_lines.append(line)
        index_path.write_text('\n'.join(existing_lines).rstrip() + '\n', encoding='utf-8')

    state['last_run'] = datetime.now(timezone.utc).isoformat()
    save_state(state_file, state)

    print(f'Exported {len(exported_ids)} conversation(s) to {out_dir}')
    return len(exported_ids)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--transcripts-dir', type=Path, default=DEFAULT_TRANSCRIPTS)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--state-file', type=Path, default=DEFAULT_STATE)
    parser.add_argument('--include-subagents', action='store_true')
    parser.add_argument('--force', action='store_true', help='Re-export even if unchanged')
    parser.add_argument(
        '--project-keyword',
        action='append',
        dest='project_keywords',
        help='Only export chats mentioning this keyword (repeatable). Default: lil-magnet-memories',
    )
    parser.add_argument(
        '--all-projects',
        action='store_true',
        help='Export every parent transcript (no project keyword filter)',
    )
    args = parser.parse_args()

    keywords: tuple[str, ...] = ()
    if not args.all_projects:
        keywords = tuple(args.project_keywords or DEFAULT_PROJECT_KEYWORDS)

    count = export_conversations(
        args.transcripts_dir,
        args.output,
        args.state_file,
        include_subagents=args.include_subagents,
        force=args.force,
        project_keywords=keywords,
    )
    return 0 if count >= 0 else 1


if __name__ == '__main__':
    raise SystemExit(main())
