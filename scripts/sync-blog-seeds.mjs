#!/usr/bin/env node
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const outDir = join(projectRoot, 'seo');

const INSTAGRAM_PROFILE_URL =
  process.env.INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/lilmagnetmemories/';
const SITE_BASE_URL = (process.env.SITE_BASE_URL || 'https://www.lilmagnetmemories.com').replace(/\/$/, '');
const MAX_INSTAGRAM_POSTS = Number(process.env.MAX_INSTAGRAM_POSTS || 24);

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function instagramDraftFromPost(post) {
  const shortCode = post.url.split('/p/')[1]?.split('/')[0] || Math.random().toString(36).slice(2, 8);
  const postTitle = post.altText
    ? post.altText.slice(0, 90)
    : `Instagram memories update ${shortCode}`;
  return {
    title: `Instagram Update: ${postTitle}`,
    slug: `instagram-${shortCode}`,
    excerpt:
      'Fresh memory inspiration from our Instagram feed: custom magnets for families, teams, holidays, and local events.',
    content:
      `${post.altText || 'See our latest Instagram post for custom magnet inspiration.'}\n\n` +
      `View this post on Instagram: ${post.url}\n\n` +
      'Looking for personalized photo magnets in Dunwoody or Sandy Springs? We create keepsake magnets for team gifts, family celebrations, birthdays, and holiday gift ideas.',
    sourceType: 'instagram',
    sourceUrl: post.url,
    featuredImage: post.image || null,
    tags: ['instagram', 'custom magnets', 'gift ideas', 'Dunwoody', 'Sandy Springs'],
    locationTargets: ['Dunwoody', 'Sandy Springs', 'Atlanta'],
    seoDescription:
      'Instagram custom magnet inspiration for families, teams, and holiday gifts near Dunwoody and Sandy Springs.',
    seoKeywords:
      'instagram magnet ideas, custom magnets near me, holiday gift ideas, team magnet gifts, Dunwoody, Sandy Springs',
    status: 'draft',
    instagram: {
      publishRequested: false,
      publishStatus: 'already_on_instagram',
      publishedUrl: post.url,
      caption: '',
    },
  };
}

function eventDraftFromEvent(event) {
  const title = `${event.name} - Photo Magnet Event in ${event.location}`;
  return {
    title,
    slug: slugify(`event-${event.name}-${event.location}`),
    excerpt: `Join us at ${event.name} in ${event.location} for custom photo magnets and gift-ready keepsakes.`,
    content:
      `Find Li'l Magnet Memories at ${event.name} in ${event.location}. ` +
      'Bring your favorite photos for personalized magnets perfect for teams, families, school groups, and party favors.\n\n' +
      (event.eventLink ? `Event details: ${event.eventLink}\n\n` : '') +
      'Need gift ideas for holidays, birthdays, and local events near Dunwoody/Sandy Springs? Custom magnets are a great way to share memories.',
    sourceType: 'event',
    sourceUrl: event.eventLink || `${SITE_BASE_URL}/event-calendar`,
    featuredImage: null,
    tags: ['market event', 'custom magnets', 'local events', 'Dunwoody', 'Sandy Springs'],
    locationTargets: ['Dunwoody', 'Sandy Springs', 'Atlanta'],
    seoDescription:
      `Custom photo magnet event in ${event.location}. Great for families, teams, and holiday gift ideas near Dunwoody/Sandy Springs.`,
    seoKeywords:
      'Dunwoody events, Sandy Springs events, custom magnets near me, photo gift ideas, team event gifts',
    status: 'draft',
    instagram: {
      publishRequested: false,
      publishStatus: 'not_requested',
      publishedUrl: null,
      caption: `We are at ${event.name} in ${event.location}! #custommagnets #dunwoody #sandysprings`,
    },
  };
}

async function scrapeInstagramPosts(page) {
  await page.goto(INSTAGRAM_PROFILE_URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(4000);
  return await page.evaluate((maxPosts) => {
    const anchors = Array.from(document.querySelectorAll('a[href*="/p/"]'));
    const posts = [];
    const seen = new Set();
    for (const a of anchors) {
      const href = a.getAttribute('href');
      if (!href) continue;
      const absolute = href.startsWith('http') ? href : `https://www.instagram.com${href}`;
      if (seen.has(absolute)) continue;
      seen.add(absolute);
      const img = a.querySelector('img');
      posts.push({
        url: absolute,
        image: img?.getAttribute('src') || null,
        altText: img?.getAttribute('alt') || '',
      });
      if (posts.length >= maxPosts) break;
    }
    return posts;
  }, MAX_INSTAGRAM_POSTS);
}

async function scrapeEventCards(page) {
  await page.goto(`${SITE_BASE_URL}/event-calendar`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(3000);
  return await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.event-card'));
    return cards.map((card) => {
      const titleEl = card.querySelector('.text-h6');
      const locationEl = card.querySelector('.text-body2');
      const linkEl = card.querySelector('a[href]');
      return {
        name: titleEl?.textContent?.trim() || 'Market Event',
        location: locationEl?.textContent?.trim() || 'Dunwoody / Sandy Springs',
        eventLink: linkEl?.getAttribute('href') || '',
      };
    });
  });
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log(`Scraping Instagram posts from ${INSTAGRAM_PROFILE_URL}`);
    const instagramPosts = await scrapeInstagramPosts(page);
    const instagramDrafts = instagramPosts.map(instagramDraftFromPost);

    console.log(`Scraping events from ${SITE_BASE_URL}/event-calendar`);
    const events = await scrapeEventCards(page);
    const eventDrafts = events.map(eventDraftFromEvent);

    const generatedAt = new Date().toISOString();
    writeFileSync(
      join(outDir, 'blog-instagram-seeds.json'),
      JSON.stringify({ generatedAt, source: INSTAGRAM_PROFILE_URL, count: instagramDrafts.length, posts: instagramDrafts }, null, 2)
    );
    writeFileSync(
      join(outDir, 'blog-event-seeds.json'),
      JSON.stringify({ generatedAt, source: `${SITE_BASE_URL}/event-calendar`, count: eventDrafts.length, posts: eventDrafts }, null, 2)
    );

    console.log(`\nWrote ${instagramDrafts.length} Instagram blog seeds`);
    console.log(`Wrote ${eventDrafts.length} event blog seeds`);
    console.log(
      'Next step: import these drafts through Admin Blog Manager (or automate via Firestore admin script).'
    );
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

