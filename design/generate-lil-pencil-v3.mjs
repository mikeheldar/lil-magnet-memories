#!/usr/bin/env node
/**
 * Builds design/lil_pencil_v3.pen from design/screenshots/ (run capture-screenshots.mjs first).
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST = join(__dirname, 'screenshots-manifest.json');
const OUT = join(__dirname, 'lil_pencil_v3.pen');

const BASE_PAGES = [
  { key: 'landing', title: 'Landing' },
  { key: 'photo-upload', title: 'Photo Upload' },
  { key: 'photo-upload-market', title: 'Photo Upload (Market)' },
  { key: 'cart', title: 'Cart' },
  { key: 'checkout', title: 'Checkout' },
  { key: 'thank-you', title: 'Thank You' },
  { key: 'about', title: 'About' },
  { key: 'custom-products', title: 'Custom Products' },
  { key: 'designer-products', title: 'Designer Products' },
  { key: 'specialty-products', title: 'Specialty Products' },
  { key: 'product-detail', title: 'Product Detail' },
  { key: 'contact-us', title: 'Contact Us' },
  { key: 'shipping-info', title: 'Shipping Info' },
  { key: 'returns', title: 'Returns' },
  { key: 'faq', title: 'FAQ' },
  { key: 'event-calendar', title: 'Event Calendar' },
  { key: 'newsletter-signup', title: 'Newsletter Signup' },
  { key: 'leave-review', title: 'Leave a Review' },
  { key: 'my-orders', title: 'My Orders' },
  { key: 'not-found', title: '404 Not Found' },
];

const PAGE_ROWS = BASE_PAGES.flatMap((p) => [
  { key: p.key, title: p.title },
  { key: `${p.key}-drawer`, title: `${p.title} — Drawer Open` },
]);

const SIZE_X = { lg: 0, md: 1600, sm: 2520 };
const ROW_GAP = 140;

function id(seed) {
  return createHash('md5').update(seed).digest('hex').slice(0, 5);
}

function buildFrame(capture, yOffset) {
  const row = PAGE_ROWS.find((r) => r.key === capture.key);
  const title = row?.title || capture.key;
  const frameWidth = capture.width;
  const scale = capture.imageWidth / frameWidth;
  const frameHeight = Math.round(capture.imageHeight / scale);
  const seed = `${capture.key}-${capture.suffix}`;

  return {
    type: 'frame',
    id: id(seed),
    x: SIZE_X[capture.suffix] ?? 0,
    y: yOffset,
    name: `${title} — ${capture.label} (${frameWidth})`,
    width: frameWidth,
    height: frameHeight,
    fill: '#FFFFFF',
    clip: true,
    layout: 'vertical',
    children: [
      {
        type: 'frame',
        id: id(`${seed}-shot`),
        name: 'Page screenshot',
        width: 'fill_container',
        height: frameHeight,
        clip: true,
        fill: {
          type: 'image',
          enabled: true,
          url: capture.file,
          mode: 'fill',
        },
        layout: 'vertical',
      },
    ],
  };
}

function main() {
  if (!existsSync(MANIFEST)) {
    console.error(
      `Missing ${MANIFEST}. Run: BASE_URL=https://www.lilmagnetmemories.com node design/capture-screenshots.mjs`
    );
    process.exit(1);
  }

  const { captures, baseUrl } = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const byKey = new Map();
  for (const c of captures) {
    if (!byKey.has(c.key)) byKey.set(c.key, []);
    byKey.get(c.key).push(c);
  }

  const children = [];
  let yOffset = 0;

  for (const row of PAGE_ROWS) {
    const group = byKey.get(row.key);
    if (!group?.length) continue;

    const sorted = group.sort(
      (a, b) => ['lg', 'md', 'sm'].indexOf(a.suffix) - ['lg', 'md', 'sm'].indexOf(b.suffix)
    );

    const rowHeight = Math.max(
      ...sorted.map((c) => Math.round(c.imageHeight / (c.imageWidth / c.width)))
    );

    for (const capture of sorted) {
      children.push(buildFrame(capture, yOffset));
    }

    yOffset += rowHeight + ROW_GAP;
  }

  writeFileSync(OUT, JSON.stringify({ version: '2.11', children }, null, 2) + '\n');
  console.log(`Wrote ${OUT}`);
  console.log(`Frames: ${children.length} (source: ${baseUrl})`);
  console.log(`Rows: ${PAGE_ROWS.filter((r) => byKey.has(r.key)).length}`);
}

main();
