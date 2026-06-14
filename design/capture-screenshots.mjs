#!/usr/bin/env node
/**
 * Capture screenshots for lil_pencil_v3.pen
 * Usage: BASE_URL=https://www.lilmagnetmemories.com node design/capture-screenshots.mjs
 *        DRAWER_ONLY=1 node design/capture-screenshots.mjs
 *        PAGES_ONLY=1 node design/capture-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

function pngDimensions(filePath) {
  const buf = readFileSync(filePath);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'screenshots');
const MANIFEST_PATH = join(__dirname, 'screenshots-manifest.json');
const BASE_URL = (process.env.BASE_URL || 'https://www.lilmagnetmemories.com').replace(/\/$/, '');
const DRAWER_ONLY = process.env.DRAWER_ONLY === '1';
const PAGES_ONLY = process.env.PAGES_ONLY === '1';

const PAGES = [
  { key: 'landing', path: '/' },
  { key: 'photo-upload', path: '/photo-upload' },
  { key: 'photo-upload-market', path: '/photo-upload-market' },
  { key: 'cart', path: '/cart' },
  { key: 'checkout', path: '/checkout' },
  { key: 'thank-you', path: '/thank-you' },
  { key: 'about', path: '/about' },
  { key: 'custom-products', path: '/products/custom' },
  { key: 'designer-products', path: '/products/designer' },
  { key: 'specialty-products', path: '/products/specialty' },
  { key: 'product-detail', path: null },
  { key: 'contact-us', path: '/contact-us' },
  { key: 'shipping-info', path: '/shipping-info' },
  { key: 'returns', path: '/returns' },
  { key: 'faq', path: '/faq' },
  { key: 'event-calendar', path: '/event-calendar' },
  { key: 'newsletter-signup', path: '/newsletter-signup' },
  { key: 'leave-review', path: '/leave-review' },
  { key: 'my-orders', path: '/my-orders' },
  { key: 'not-found', path: '/__design-404-preview__' },
];

const VIEWPORTS = [
  { suffix: 'lg', label: 'LG', width: 1440, height: 1024, deviceScaleFactor: 1 },
  { suffix: 'md', label: 'MD', width: 768, height: 1024, deviceScaleFactor: 2 },
  { suffix: 'sm', label: 'SM', width: 375, height: 812, deviceScaleFactor: 2 },
];

async function resolveProductDetailPath(page) {
  await page.goto(`${BASE_URL}/products/custom`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(1500);
  await page.waitForSelector('.product-card-row, .q-card, .products-list', { timeout: 30000 }).catch(() => {});

  const fallback = await page.evaluate(() => {
    const a = document.querySelector('a[href*="/product/"]');
    return a ? a.getAttribute('href') : null;
  });
  if (fallback) return fallback.startsWith('http') ? new URL(fallback).pathname : fallback;

  const viewBtn = page.getByRole('button', { name: /view details/i }).first();
  if (await viewBtn.count()) {
    await viewBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(2000);
    return new URL(page.url()).pathname;
  }

  return '/products/custom';
}

async function dismissOverlays(page) {
  const cookie = page.getByRole('button', { name: /accept|agree|close|dismiss/i });
  if (await cookie.count()) {
    await cookie.first().click({ timeout: 2000 }).catch(() => {});
  }
}

/** Full-page screenshots omit fixed-position drawer UI — use viewport capture for drawer states. */
async function openDrawerAndExpandMenu(page) {
  const menuBtn = page.locator('.site-header button[aria-label="Menu"], .site-header .hamburger-btn').first();
  await menuBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  const hasMenu = await menuBtn.isVisible().catch(() => false);
  if (!hasMenu) return;
  const isDrawerOpen = async () => page.locator('.drawer-panel.translate-x-0').isVisible().catch(() => false);

  if (!(await isDrawerOpen())) {
    await menuBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(250);
  }
  if (!(await isDrawerOpen())) {
    await page.evaluate(() => {
      const btn = document.querySelector('.site-header button[aria-label="Menu"], .site-header .hamburger-btn');
      if (btn instanceof HTMLElement) btn.click();
    });
    await page.waitForTimeout(300);
  }
  if (!(await isDrawerOpen())) {
    await menuBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(300);
  }
  await page.locator('.drawer-panel.translate-x-0').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await page.getByText('Navigation', { exact: true }).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

  await page.waitForTimeout(1200);

  const ensureExpanded = async (sectionText, childText) => {
    const childVisible = await page.getByText(childText, { exact: true }).isVisible().catch(() => false);
    if (childVisible) return;
    const sectionRow = page.locator('button.section-header').filter({ hasText: sectionText }).first();
    if (await sectionRow.count()) {
      const hasChevronDown = await sectionRow
        .locator('.i-heroicons-chevron-down,[class*="i-heroicons-chevron-down"]')
        .count()
        .then((n) => n > 0)
        .catch(() => false);
      if (hasChevronDown) {
        await sectionRow.click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
      }
    }
  };

  await ensureExpanded('Shop', 'Custom Photo Magnets');
  await ensureExpanded('Operator', 'Order List');
  await ensureExpanded('Admin', 'Admin Settings');
  const accountHasContent =
    (await page.getByText('Sign In', { exact: true }).isVisible().catch(() => false)) ||
    (await page.getByText('My Orders', { exact: true }).isVisible().catch(() => false));
  if (!accountHasContent) {
    const accountRow = page.locator('button.section-header').filter({ hasText: 'Account' }).first();
    if (await accountRow.count()) {
      await accountRow.click({ force: true });
      await page.waitForTimeout(450);
    }
  }

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const menu = document.querySelector('.drawer-menu, .drawer-menu-container');
    if (menu) menu.scrollTop = 0;
  });
  await page.waitForTimeout(300);
}

async function capturePage(browser, pageDef, viewport, productDetailPath, drawerOpen) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    colorScheme: 'light',
  });
  const page = await context.newPage();

  let path = pageDef.path;
  if (pageDef.key === 'product-detail') path = productDetailPath;
  if (pageDef.key === 'not-found') path = '/page-not-found-design-capture-404';

  const captureKey = drawerOpen ? `${pageDef.key}-drawer` : pageDef.key;
  const filename = `${captureKey}-${viewport.suffix}.png`;
  const filepath = join(OUT_DIR, filename);

  try {
    const response = await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await dismissOverlays(page);

    if (drawerOpen) {
      await openDrawerAndExpandMenu(page);
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
    }

    await page.screenshot({
      path: filepath,
      fullPage: !drawerOpen,
      animations: 'disabled',
    });

    const dims = pngDimensions(filepath);
    const kind = drawerOpen ? 'drawer' : 'page';
    console.log(`  ✓ ${filename} (${dims.width}×${dims.height}) [${kind}] status=${response?.status()}`);

    return {
      key: captureKey,
      suffix: viewport.suffix,
      label: viewport.label,
      width: viewport.width,
      drawerOpen,
      file: `screenshots/${filename}`,
      imageWidth: dims.width,
      imageHeight: dims.height,
    };
  } catch (err) {
    console.error(`  ✗ ${filename}: ${err.message}`);
    return null;
  } finally {
    await context.close();
  }
}

function loadExistingManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { baseUrl: BASE_URL, productDetailPath: null, captures: [] };
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Capturing from ${BASE_URL} → ${OUT_DIR}`);
  if (DRAWER_ONLY) console.log('Mode: DRAWER_ONLY');
  if (PAGES_ONLY) console.log('Mode: PAGES_ONLY');
  console.log('');

  const browser = await chromium.launch({ headless: true });
  const existing = loadExistingManifest();
  const meta = [...existing.captures];

  const probe = await browser.newContext();
  const probePage = await probe.newPage();
  const productDetailPath =
    existing.productDetailPath || (await resolveProductDetailPath(probePage));
  console.log(`Product detail path: ${productDetailPath}\n`);
  await probe.close();

  const captureDrawer = !PAGES_ONLY;
  const capturePages = !DRAWER_ONLY;

  for (const pageDef of PAGES) {
    for (const drawerOpen of [false, true]) {
      if (drawerOpen && !captureDrawer) continue;
      if (!drawerOpen && !capturePages) continue;

      const label = drawerOpen ? `${pageDef.key}-drawer` : pageDef.key;
      console.log(label);

      for (const vp of VIEWPORTS) {
        const result = await capturePage(browser, pageDef, vp, productDetailPath, drawerOpen);
        if (!result) continue;

        const idx = meta.findIndex((c) => c.key === result.key && c.suffix === result.suffix);
        if (idx >= 0) meta[idx] = result;
        else meta.push(result);
      }
    }
  }

  await browser.close();

  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({ baseUrl: BASE_URL, productDetailPath, captures: meta }, null, 2)
  );
  console.log(`\nWrote ${MANIFEST_PATH} (${meta.length} images)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
