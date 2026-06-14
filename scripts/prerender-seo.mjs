#!/usr/bin/env node
import express from 'express';
import { chromium } from '@playwright/test';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const spaDir = join(projectRoot, 'dist', 'spa');
const outDir = join(projectRoot, 'dist', 'prerender');
const appRootSelector = '#q-app';

const SEO_ROUTES = [
  '/',
  '/about',
  '/products/custom',
  '/products/designer',
  '/products/specialty',
  '/event-calendar',
  '/photo-upload',
  '/contact-us',
  '/shipping-info',
  '/returns',
  '/faq',
  '/newsletter-signup',
  '/leave-review',
];

function routeToOutputPath(route) {
  if (route === '/') return join(outDir, 'index.html');
  return join(outDir, route.replace(/^\//, ''), 'index.html');
}

async function startLocalServer() {
  const app = express();
  app.use(express.static(spaDir));
  app.get('*', (_req, res) => {
    res.sendFile(join(spaDir, 'index.html'));
  });

  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to determine local prerender server address'));
        return;
      }
      resolve({ server, port: addr.port });
    });
  });
}

async function main() {
  if (!existsSync(spaDir)) {
    throw new Error(`Missing SPA build output at ${spaDir}. Run "npm run build" first.`);
  }

  rmSync(outDir, { recursive: true, force: true });
  cpSync(spaDir, outDir, { recursive: true });

  const { server, port } = await startLocalServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const rendered = [];

  try {
    for (const route of SEO_ROUTES) {
      const url = `${baseUrl}${route}`;
      console.log(`Prerendering ${route}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForSelector(appRootSelector, { timeout: 10000 });
      await page.waitForTimeout(250);
      const html = await page.content();
      const outPath = routeToOutputPath(route);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, `<!DOCTYPE html>\n${html}`);
      rendered.push({ route, output: outPath.replace(`${projectRoot}/`, '') });
    }
  } finally {
    await context.close();
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  writeFileSync(
    join(outDir, 'prerender-routes.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        routeCount: rendered.length,
        routes: rendered.map((r) => r.route),
      },
      null,
      2
    )
  );

  console.log(`\nPrerendered ${rendered.length} routes to ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

