# Lil Magnet Memories — Pencil designs

## `lil_pencil_v3.pen`

Full-fidelity artboards built from **production screenshots** of [lilmagnetmemories.com](https://www.lilmagnetmemories.com) at three breakpoints:

| Size | Viewport width |
|------|----------------|
| LG   | 1440px         |
| MD   | 768px          |
| SM   | 375px          |

20 public pages × 3 sizes × 2 states (default + drawer open) = **120 frames**.

Drawer-open captures use **viewport screenshots** (not full-page), because Playwright full-page shots omit the fixed left navigation drawer.

### Refresh screenshots + pen file

```bash
# Requires: npx playwright install chromium (once)
npm run design:capture
npm run design:pen
```

Or against a local dev server:

```bash
BASE_URL=http://localhost:9000 npm run design:capture
npm run design:pen
```

### Files

- `lil_pencil_v3.pen` — open in [Pencil](https://pencil.dev)
- `screenshots/` — PNG captures (referenced by the `.pen` file)
- `screenshots-manifest.json` — capture metadata
- `capture-screenshots.mjs` / `generate-lil-pencil-v3.mjs` — automation scripts
