# Custom border frames

Add square PNG border images here. Each PNG should have a **transparent center** (where the photo shows through) and an opaque border/frame.

1. Add your `.png` file to this directory.
2. Edit `list.json`. Prefer the object form so browsers/CDNs pick up **updated PNGs** that keep the same filename:

   ```json
   { "v": "1", "frames": ["mitzvah_house.png", "other_frame.png"] }
   ```

   **Bump `v`** (any string, e.g. `2`, `20260125`) whenever you replace a PNG without renaming it—otherwise cached images may stick around after deploy.

   Legacy: a plain JSON array of filenames still works (no cache-bust query param).

Frames appear in the Print Template under "Custom border frame" and apply to all magnet squares when selected.
