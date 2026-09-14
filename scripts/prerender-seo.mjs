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

// Per-route <head> content for the FALLBACK path (when chromium can't launch — the
// reality on Vercel's build container, where every route otherwise ships one identical
// bare SPA shell with no canonical/OG/description). Copy mirrors each page's own
// useSiteSeo() getter so the crawler sees the SAME meta the client renders. Dynamic
// routes (/product/:type/:id, /blog/:slug) are intentionally absent — no static copy to
// fabricate; they fall back to the plain shell.
const OG_IMAGE = `${SITE_ORIGIN}/assets/lil-magnet-memories-logo.png`;
const ROUTE_HEAD = {
  '/': {
    title: 'Home - Lil Magnet Memories',
    socialTitle: 'Lil Magnet Memories - Custom Photo Magnets',
    description:
      'Turn your favorite photos into custom magnets for holidays, team gifts, family keepsakes, school events, and parties in Dunwoody, Sandy Springs, and nearby Atlanta.',
  },
  '/about': {
    title: 'About Us - Lil Magnet Memories',
    crumb: 'About Us',
    description:
      'Learn about Lil Magnet Memories, a Dunwoody-area custom magnet studio helping families, teams, and event planners preserve memories with personalized photo magnets.',
  },
  '/products/custom': {
    title: 'Custom Photo Magnets - Lil Magnet Memories',
    crumb: 'Custom Photo Magnets',
    description:
      'Create custom photo magnets from your own pictures for holiday gifts, sports teams, family reunions, graduations, and party events across Dunwoody and Sandy Springs.',
  },
  '/products/novelty': {
    title: 'Novelty Magnets - Lil Magnet Memories',
    crumb: 'Novelty Magnets',
    description:
      'Shop novelty magnet styles and ready-made layouts for birthdays, holidays, teacher gifts, and event keepsakes in Dunwoody, Sandy Springs, and metro Atlanta.',
  },
  '/products/specialty': {
    title: 'Specialty Products - Lil Magnet Memories',
    crumb: 'Specialty Products',
    description:
      'Discover specialty magnet products with unique shapes and finishes, perfect for team events, family milestones, holiday gifting, and local celebrations.',
  },
  '/event-calendar': {
    title: 'Event Calendar - Lil Magnet Memories',
    crumb: 'Event Calendar',
    description:
      'Find upcoming Lil Magnet Memories market events near Dunwoody and Sandy Springs. Bring your pictures and order custom magnets for teams, families, and party events.',
  },
  '/photo-upload': {
    title: 'Upload Photos - Lil Magnet Memories',
    crumb: 'Upload Photos',
    description:
      'Upload your photos for custom photo magnets. Easy photo upload with preview and cropping tools. Start creating your memories!',
  },
  '/contact-us': {
    title: 'Contact Us - Lil Magnet Memories',
    crumb: 'Contact Us',
    description:
      'Contact Lil Magnet Memories for custom photo magnets, local event orders, and personalized gift ideas in Dunwoody, Sandy Springs, and nearby areas.',
  },
  '/shipping-info': {
    title: 'Shipping Information - Lil Magnet Memories',
    crumb: 'Shipping Information',
    description:
      'Shipping information for custom photo magnets. Learn about delivery times, shipping costs, and pickup options at market events.',
  },
  '/returns': {
    title: 'Returns & Refunds - Lil Magnet Memories',
    crumb: 'Returns & Refunds',
    description:
      'Our return and refund policy for custom photo magnets. Learn about our satisfaction guarantee and how to request returns or refunds.',
  },
  '/faq': {
    title: 'FAQ - Lil Magnet Memories',
    crumb: 'FAQ',
    description:
      'Frequently asked questions about custom photo magnets. Learn about ordering, shipping, pricing, and our products.',
  },
  '/blog': {
    title: 'Magnet Gift Ideas Blog - Lil Magnet Memories',
    crumb: 'Blog',
    description:
      'Explore custom magnet gift ideas for holidays, birthdays, team events, and family memories in Dunwoody and Sandy Springs.',
  },
  '/newsletter-signup': {
    title: 'Newsletter Signup - Lil Magnet Memories',
    crumb: 'Newsletter Signup',
    description:
      'Subscribe to our newsletter for special offers, new products, and updates from Lil Magnet Memories.',
  },
  '/leave-review': {
    title: 'Leave a Review - Lil Magnet Memories',
    crumb: 'Leave a Review',
    description:
      'Share your experience with Lil Magnet Memories. Leave a review and help others discover our custom photo magnets.',
  },
};

// Rewrite the SPA shell's <head> with a route's real title/description/canonical/OG +
// a BreadcrumbList JSON-LD, so a fallback copy is still crawlable and unique per URL.
// Returns the html unchanged for routes with no curated entry (dynamic detail pages).
function injectFallbackHead(html, route) {
  const meta = ROUTE_HEAD[route];
  if (!meta) return html;
  const canonical = `${SITE_ORIGIN}${route}`;
  const title = meta.title;
  const socialTitle = meta.socialTitle || title;
  const desc = (meta.description || '').slice(0, 320);

  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeXml(title)}</title>`);
  // Drop the static default description meta; the route-specific one is added below.
  out = out.replace(/<meta[^>]*name=["']?description["']?[^>]*>/i, '');

  const tags = [
    `<meta name="description" content="${escapeXml(desc)}">`,
    `<link rel="canonical" href="${escapeXml(canonical)}">`,
    `<meta property="og:title" content="${escapeXml(socialTitle)}">`,
    `<meta property="og:description" content="${escapeXml(desc)}">`,
    `<meta property="og:url" content="${escapeXml(canonical)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:image" content="${escapeXml(OG_IMAGE)}">`,
    `<meta property="og:site_name" content="Lil Magnet Memories">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeXml(socialTitle)}">`,
    `<meta name="twitter:description" content="${escapeXml(desc)}">`,
    `<meta name="twitter:image" content="${escapeXml(OG_IMAGE)}">`,
  ];
  if (route !== '/' && meta.crumb) {
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: meta.crumb, item: canonical },
      ],
    };
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>`
    );
  }
  const block = `\n${tags.join('\n')}\n`;
  return out.includes('</head>')
    ? out.replace('</head>', `${block}</head>`)
    : out + block;
}

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
// Blog tag archive hubs — topic clusters that spread crawl equity across the blog graph.
const BLOG_TAG_META = { priority: '0.5', changefreq: 'weekly' };
// Product detail pages are money pages — rank them above blog posts.
const PRODUCT_DETAIL_META = { priority: '0.7', changefreq: 'weekly' };
// Listing pages whose rendered DOM we scrape for /product/:type/:id links.
const PRODUCT_LISTINGS = [
  '/products/custom',
  '/products/novelty',
  '/products/specialty',
];

// Escape the five XML entities. Critical for image <loc>s: Firebase Storage URLs
// carry `?alt=media&token=...`, and a bare `&` makes the sitemap invalid XML.
function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Google caps image-sitemap entries at 1000 images per page; keep it sane per URL.
const MAX_IMAGES_PER_URL = 25;

// Build a complete sitemap.xml from the curated pages + every discovered blog post.
// Unknown routes (admin/debug/utility) are skipped by design. When `imagesByRoute`
// carries image URLs for a route (scraped from its prerendered og:image + Product
// JSON-LD), they're emitted as <image:image> entries so Google Image search — a real
// discovery channel for a photo-magnet store — can index the actual product photos.
function buildSitemapXml(routes, imagesByRoute = {}) {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map((route) => {
      const meta = route.startsWith('/blog/tag/')
        ? BLOG_TAG_META
        : route.startsWith('/blog/')
        ? BLOG_POST_META
        : /^\/product\/[^/]+\/[^/]+$/.test(route)
        ? PRODUCT_DETAIL_META
        : SITEMAP_META[route];
      if (!meta) return null;
      const loc = `${SITE_ORIGIN}${route}`;
      const images = (imagesByRoute[route] || [])
        .slice(0, MAX_IMAGES_PER_URL)
        .map((img) => `    <image:image>\n      <image:loc>${escapeXml(img)}</image:loc>\n    </image:image>`)
        .join('\n');
      return (
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
        `    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>\n` +
        (images ? `${images}\n` : '') +
        '  </url>'
      );
    })
    .filter(Boolean);
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' +
    ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    `${urls.join('\n')}\n</urlset>\n`
  );
}

// Pull indexable image URLs out of a prerendered page's live DOM: the og:image meta
// (present on every page) plus any Product JSON-LD `image` array (multiple product
// photos per detail page). Absolute http(s) only, deduped, in document order.
async function collectPageImages(page) {
  try {
    const urls = await page.evaluate(() => {
      const out = [];
      const push = (u) => {
        if (typeof u === 'string' && /^https?:\/\//i.test(u) && !out.includes(u)) {
          out.push(u);
        }
      };
      document
        .querySelectorAll('meta[property="og:image"]')
        .forEach((m) => push(m.getAttribute('content')));
      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((s) => {
          let data;
          try {
            data = JSON.parse(s.textContent);
          } catch {
            return;
          }
          const nodes = Array.isArray(data)
            ? data
            : data && data['@graph']
            ? data['@graph']
            : [data];
          nodes.forEach((n) => {
            if (!n) return;
            const t = n['@type'];
            const isProduct =
              t === 'Product' || (Array.isArray(t) && t.includes('Product'));
            if (isProduct && n.image) {
              (Array.isArray(n.image) ? n.image : [n.image]).forEach(push);
            }
          });
        });
      return out;
    });
    return urls;
  } catch {
    return [];
  }
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
  const imagesByRoute = {};
  const fallbackRoutes = [];
  let browser;
  let context;
  let page;

  const writeFallbackRoute = (route) => {
    const outPath = routeToOutputPath(route);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, `<!DOCTYPE html>\n${injectFallbackHead(spaIndexHtml, route)}`);
    fallbackRoutes.push(route);
    console.warn(`Fallback copy for ${route}`);
  };

  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
        const imgs = await collectPageImages(page);
        if (imgs.length) imagesByRoute[route] = imgs;
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

    // Discover detail-page routes linked from a rendered listing page, then
    // prerender each so they are crawlable HTML with their JSON-LD baked in.
    // Uses the live SPA (client-side Firestore) at build time — no creds.
    const discoverAndRender = async (listingRoute, linkSelector, pattern, label) => {
      try {
        await page.goto(`${baseUrl}${listingRoute}`, {
          waitUntil: 'domcontentloaded',
          timeout: 90000,
        });
        await page.waitForSelector(appRootSelector, { timeout: 15000 });
        await page
          .waitForLoadState('networkidle', { timeout: 5000 })
          .catch(() => undefined);
        await page.waitForTimeout(1000);
        const hrefs = await page.$$eval(linkSelector, (as) =>
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
                .filter(Boolean)
            )
          )
        );
        const routes = hrefs.filter((pth) => pattern.test(pth));
        console.log(
          `Discovered ${routes.length} ${label} route(s) from ${listingRoute}`
        );
        for (const route of routes) {
          if (!rendered.some((r) => r.route === route)) {
            await renderRoute(route);
          }
        }
      } catch (err) {
        console.warn(`${label} discovery skipped for ${listingRoute}: ${err.message}`);
      }
    };

    await discoverAndRender(
      '/blog',
      'a[href*="/blog/"]',
      /^\/blog\/[^/]+$/,
      'blog post'
    );
    // Blog tag archive hubs (crawlable topic clusters) — linked from the /blog tag
    // cloud and from each post's tag chips.
    await discoverAndRender(
      '/blog',
      'a[href*="/blog/tag/"]',
      /^\/blog\/tag\/[^/]+$/,
      'blog tag'
    );
    for (const listing of PRODUCT_LISTINGS) {
      await discoverAndRender(
        listing,
        'a[href*="/product/"]',
        /^\/product\/[^/]+\/[^/]+$/,
        'product'
      );
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
  const productRoutes = rendered
    .map((r) => r.route)
    .filter((route) => /^\/product\/[^/]+\/[^/]+$/.test(route));
  const sitemapRoutes = [
    ...new Set([
      ...Object.keys(SITEMAP_META),
      ...blogPostRoutes,
      ...productRoutes,
    ]),
  ];
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    buildSitemapXml(sitemapRoutes, imagesByRoute)
  );
  const imageCount = sitemapRoutes.reduce(
    (n, route) => n + (imagesByRoute[route] || []).length,
    0
  );
  console.log(
    `Wrote sitemap.xml with ${sitemapRoutes.length} URLs ` +
      `(${blogPostRoutes.length} blog post(s), ${productRoutes.length} product(s), ` +
      `${imageCount} image entries)`
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

