#!/usr/bin/env node
import express from 'express';
import { chromium } from '@playwright/test';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
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
  '/products/novelty',
  '/products/specialty',
  '/event-calendar',
  '/photo-upload',
  '/contact-us',
  '/shipping-info',
  '/returns',
  '/faq',
  '/blog',
  '/newsletter-signup',
  '/leave-review',
];

function routeToOutputPath(route) {
  if (route === '/') return join(outDir, 'index.html');
  return join(outDir, route.replace(/^\//, ''), 'index.html');
}

// Canonical origin — keep in sync with SITE_ORIGIN in src/composables/useSiteSeo.js
const SITE_ORIGIN = 'https://www.lilmagnetmemories.com';

// changefreq/priority per curated route (mirrors the previous static public/sitemap.xml
// so no prior crawl signal regresses). Any /blog/:slug post uses BLOG_POST_META.
const SITEMAP_META = {
  '/': { priority: '1.0', changefreq: 'weekly' },
  '/products/custom': { priority: '0.9', changefreq: 'weekly' },
  '/products/novelty': { priority: '0.8', changefreq: 'weekly' },
  '/products/specialty': { priority: '0.8', changefreq: 'weekly' },
  '/photo-upload': { priority: '0.8', changefreq: 'monthly' },
  '/photo-upload-market': { priority: '0.7', changefreq: 'monthly' },
  '/about': { priority: '0.6', changefreq: 'monthly' },
  '/contact-us': { priority: '0.5', changefreq: 'monthly' },
  '/event-calendar': { priority: '0.7', changefreq: 'weekly' },
  '/blog': { priority: '0.8', changefreq: 'weekly' },
  '/leave-review': { priority: '0.5', changefreq: 'monthly' },
  '/shipping-info': { priority: '0.4', changefreq: 'monthly' },
  '/returns': { priority: '0.4', changefreq: 'monthly' },
  '/faq': { priority: '0.5', changefreq: 'monthly' },
  '/newsletter-signup': { priority: '0.4', changefreq: 'monthly' },
};
const BLOG_POST_META = { priority: '0.6', changefreq: 'monthly' };

// Build a complete sitemap.xml from the curated pages + every discovered blog post.
// Unknown routes (admin/debug/utility) are skipped by design.
function buildSitemapXml(routes) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map((route) => {
      const meta = route.startsWith('/blog/')
        ? BLOG_POST_META
        : SITEMAP_META[route];
      if (!meta) return null;
      const loc = `${SITE_ORIGIN}${route}`;
      return (
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>\n  </url>`
      );
    })
    .filter(Boolean);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls.join('\n')}\n</urlset>\n`
  );
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
  const spaIndexHtml = readFileSync(join(spaDir, 'index.html'), 'utf8');

  const { server, port } = await startLocalServer();
  const baseUrl = `http://127.0.0.1:${port}`;
  const rendered = [];
  const fallbackRoutes = [];
  let browser;
  let context;
  let page;

  const writeFallbackRoute = (route) => {
    const outPath = routeToOutputPath(route);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `<!DOCTYPE html>\n${spaIndexHtml}`);
    fallbackRoutes.push(route);
    console.warn(`Fallback copy for ${route}`);
  };

  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    const renderRoute = async (route) => {
      try {
        const url = `${baseUrl}${route}`;
        console.log(`Prerendering ${route}`);
        // networkidle can hang on SPAs that keep background requests open.
        // Prefer DOM readiness + app mount, then try a short idle wait.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForSelector(appRootSelector, { timeout: 15000 });
        await page
          .waitForLoadState('networkidle', { timeout: 5000 })
          .catch(() => undefined);
        await page.waitForTimeout(500);
        const html = await page.content();
        const outPath = routeToOutputPath(route);
        mkdirSync(dirname(outPath), { recursive: true });
        writeFileSync(outPath, `<!DOCTYPE html>\n${html}`);
        rendered.push({ route, output: outPath.replace(`${projectRoot}/`, '') });
        return true;
      } catch (routeErr) {
        console.warn(`Failed to prerender ${route}: ${routeErr.message}`);
        writeFallbackRoute(route);
        return false;
      }
    };

    for (const route of SEO_ROUTES) {
      await renderRoute(route);
    }

    // Discover individual blog posts from the rendered /blog listing and
    // prerender each so posts are crawlable HTML with their Article/Breadcrumb
    // JSON-LD baked in. Uses the live SPA (client-side Firestore) — no creds.
    try {
      await page.goto(`${baseUrl}/blog`, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForSelector(appRootSelector, { timeout: 15000 });
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => undefined);
      await page.waitForTimeout(1000);
      const postRoutes = await page.$$eval('a[href*="/blog/"]', (as) =>
        Array.from(
          new Set(
            as
              .map((a) => {
                try {
                  return new URL(a.href).pathname;
                } catch {
                  return null;
                }
              })
              .filter((pth) => pth && /^\/blog\/[^/]+$/.test(pth))
          )
        )
      );
      console.log(`Discovered ${postRoutes.length} blog post route(s)`);
      for (const route of postRoutes) {
        await renderRoute(route);
      }
    } catch (blogErr) {
      console.warn(`Blog post discovery skipped: ${blogErr.message}`);
    }
  } catch (browserErr) {
    console.warn(`Browser launch failed, using fallback route copies: ${browserErr.message}`);
    for (const route of SEO_ROUTES) {
      writeFallbackRoute(route);
    }
  } finally {
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
    await new Promise((resolve) => server.close(resolve));
  }

  const blogPostRoutes = rendered
    .map((r) => r.route)
    .filter((route) => /^\/blog\/[^/]+$/.test(route));
  const sitemapRoutes = [
    ...new Set([...Object.keys(SITEMAP_META), ...blogPostRoutes]),
  ];
  writeFileSync(join(outDir, 'sitemap.xml'), buildSitemapXml(sitemapRoutes));
  console.log(
    `Wrote sitemap.xml with ${sitemapRoutes.length} URLs (${blogPostRoutes.length} blog post(s))`
  );

  writeFileSync(
    join(outDir, 'prerender-routes.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        routeCount: rendered.length,
        fallbackRouteCount: fallbackRoutes.length,
        routes: rendered.map((r) => r.route),
        fallbackRoutes,
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

