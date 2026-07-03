export const DEFAULT_INSTAGRAM_PROFILE_URL =
  process.env.INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/lilmagnetmemories/';

const INSTAGRAM_WEB_APP_ID = '936619743392459';

const FETCH_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const INSTAGRAM_WEB_API_HEADERS: Record<string, string> = {
  ...FETCH_HEADERS,
  Accept: '*/*',
  'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
  'X-Requested-With': 'XMLHttpRequest',
  Referer: DEFAULT_INSTAGRAM_PROFILE_URL,
  Origin: 'https://www.instagram.com',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

export type ScrapedInstagramPost = {
  shortCode: string;
  url: string;
  caption: string;
  altText: string;
  mediaUrls: string[];
  featuredImage: string | null;
};

function decodeHtmlEntities(value: string): string {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function uniqueUrls(urls: string[]): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    const next = String(raw || '').trim();
    if (next && !out.includes(next)) {
      out.push(next);
    }
  }
  return out;
}

export function extractInstagramShortCode(raw: string): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;

  const patterns = [
    /instagram\.com\/(?:[^/]+\/)?p\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/(?:[^/]+\/)?reel\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/(?:[^/]+\/)?tv\/([A-Za-z0-9_-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

export function extractInstagramUsername(raw: string): string | null {
  const value = String(raw || '').trim();
  const match = value.match(/instagram\.com\/([A-Za-z0-9._]+)\/?(?:$|\?|#)/i);
  if (!match?.[1]) {
    return null;
  }
  const username = match[1].toLowerCase();
  if (['p', 'reel', 'tv', 'stories', 'explore', 'accounts'].includes(username)) {
    return null;
  }
  return match[1];
}

export function extractInstagramProfileUsername(profileUrl = DEFAULT_INSTAGRAM_PROFILE_URL): string {
  return extractInstagramUsername(profileUrl) || 'lilmagnetmemories';
}

async function fetchInstagramWebProfilePosts(
  username: string,
  limit: number
): Promise<ScrapedInstagramPost[]> {
  const fetchFn = (globalThis as { fetch?: typeof fetch }).fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error('Global fetch is unavailable in this runtime.');
  }

  const response = await fetchFn(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        ...INSTAGRAM_WEB_API_HEADERS,
        Referer: `https://www.instagram.com/${username}/`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Instagram profile request failed (${response.status}).`);
  }

  const payload = await response.json();
  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges;
  if (!Array.isArray(edges) || !edges.length) {
    throw new Error('Instagram profile returned no posts.');
  }

  const posts: ScrapedInstagramPost[] = [];

  for (const edge of edges.slice(0, limit)) {
    const node = edge?.node;
    const shortCode = String(node?.shortcode || '').trim();
    if (!shortCode) {
      continue;
    }

    const caption =
      String(node?.edge_media_to_caption?.edges?.[0]?.node?.text || '').trim() ||
      String(node?.accessibility_caption || '').trim();
    const mediaUrls = uniqueUrls([
      node?.display_url,
      node?.thumbnail_src,
      ...(Array.isArray(node?.edge_sidecar_to_children?.edges)
        ? node.edge_sidecar_to_children.edges.map(
            (child: { node?: { display_url?: string; thumbnail_src?: string } }) =>
              child?.node?.display_url || child?.node?.thumbnail_src
          )
        : []),
    ]);

    let resolvedMediaUrls = mediaUrls;
    if (!resolvedMediaUrls.length) {
      const redirectUrl = await resolveInstagramMediaRedirect(shortCode);
      if (redirectUrl) {
        resolvedMediaUrls = [redirectUrl];
      }
    }

    posts.push({
      shortCode,
      url: `https://www.instagram.com/p/${shortCode}/`,
      caption,
      altText: caption,
      mediaUrls: resolvedMediaUrls,
      featuredImage: resolvedMediaUrls[0] || null,
    });
  }

  return posts;
}

async function lookupCaptionFromWebProfile(
  shortCode: string,
  username = extractInstagramProfileUsername()
): Promise<{ caption: string; mediaUrls: string[] }> {
  try {
    const posts = await fetchInstagramWebProfilePosts(username, 50);
    const match = posts.find((post) => post.shortCode === shortCode);
    if (match) {
      return {
        caption: match.caption || match.altText || '',
        mediaUrls: match.mediaUrls,
      };
    }
  } catch (error) {
    console.warn('[BLOG/INSTAGRAM-SCRAPE] Profile caption lookup failed:', error);
  }

  return { caption: '', mediaUrls: [] };
}

export function normalizeInstagramPostUrl(raw: string): string | null {
  const shortCode = extractInstagramShortCode(raw);
  if (!shortCode) return null;
  return `https://www.instagram.com/p/${shortCode}/`;
}

function extractMetaContent(
  html: string,
  attr: 'property' | 'name',
  value: string
): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return null;
}

function extractImagesFromHtml(html: string): string[] {
  const urls: string[] = [];
  const add = (url?: string | null) => {
    const next = String(url || '').trim();
    if (next && (next.startsWith('http://') || next.startsWith('https://'))) {
      urls.push(next);
    }
  };

  add(extractMetaContent(html, 'property', 'og:image'));

  const jsonPatterns = [
    /"display_url"\s*:\s*"([^"]+)"/g,
    /"thumbnail_src"\s*:\s*"([^"]+)"/g,
    /"src"\s*:\s"(https:\/\/[^"]+\.cdninstagram\.com[^"]+)"/g,
  ];

  for (const pattern of jsonPatterns) {
    let match: RegExpExecArray | null = pattern.exec(html);
    while (match) {
      add(decodeHtmlEntities(match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')));
      match = pattern.exec(html);
    }
  }

  const imgTagPattern = /<img[^>]+src=["'](https:\/\/[^"']+\.cdninstagram\.com[^"']+)["']/gi;
  let imgMatch: RegExpExecArray | null = imgTagPattern.exec(html);
  while (imgMatch) {
    add(decodeHtmlEntities(imgMatch[1]));
    imgMatch = imgTagPattern.exec(html);
  }

  return uniqueUrls(urls);
}

async function fetchText(url: string): Promise<string> {
  const fetchFn = (globalThis as { fetch?: typeof fetch }).fetch;
  if (typeof fetchFn !== 'function') {
    throw new Error('Global fetch is unavailable in this runtime.');
  }

  const response = await fetchFn(url, {
    headers: FETCH_HEADERS,
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Instagram request failed (${response.status}) for ${url}`);
  }

  return response.text();
}

async function resolveInstagramMediaRedirect(shortCode: string): Promise<string | null> {
  const fetchFn = (globalThis as { fetch?: typeof fetch }).fetch;
  if (typeof fetchFn !== 'function') {
    return null;
  }

  const response = await fetchFn(`https://www.instagram.com/p/${shortCode}/media/?size=l`, {
    headers: FETCH_HEADERS,
    redirect: 'manual',
  });

  if (response.status >= 300 && response.status < 400) {
    return response.headers.get('location');
  }

  return null;
}

function extractCaptionFromHtml(html: string): string {
  const ogDescription = extractMetaContent(html, 'property', 'og:description') || '';
  const cleaned = ogDescription
    .replace(/^[\d,.]+ (likes?|views?),?\s*/i, '')
    .replace(/^".*?" on Instagram:\s*/i, '')
    .replace(/^".*?":\s*/i, '')
    .trim();

  if (cleaned) {
    return cleaned;
  }

  return (
    extractMetaContent(html, 'name', 'description') ||
    extractMetaContent(html, 'property', 'og:title') ||
    ''
  ).trim();
}

export async function scrapeInstagramPostPage(rawUrl: string): Promise<ScrapedInstagramPost> {
  const url = normalizeInstagramPostUrl(rawUrl);
  if (!url) {
    throw new Error('Invalid Instagram post URL. Use a link like https://www.instagram.com/p/ABC123/');
  }

  const shortCode = extractInstagramShortCode(url)!;
  const fetchUrls = [
    `https://www.instagram.com/p/${shortCode}/embed/captioned/`,
    url,
    `https://www.instagram.com/reel/${shortCode}/`,
  ];

  let caption = '';
  let altText = '';
  let mediaUrls: string[] = [];

  for (const fetchUrl of fetchUrls) {
    try {
      const html = await fetchText(fetchUrl);
      if (!caption) {
        caption = extractCaptionFromHtml(html);
        altText = caption;
      }
      mediaUrls = uniqueUrls([...mediaUrls, ...extractImagesFromHtml(html)]);
      if (mediaUrls.length && caption) {
        break;
      }
    } catch (error) {
      console.warn('[BLOG/INSTAGRAM-SCRAPE] Fetch attempt failed:', fetchUrl, error);
    }
  }

  if (!mediaUrls.length) {
    try {
      const redirectUrl = await resolveInstagramMediaRedirect(shortCode);
      if (redirectUrl) {
        mediaUrls = [redirectUrl];
      }
    } catch (error) {
      console.warn('[BLOG/INSTAGRAM-SCRAPE] Media redirect failed:', shortCode, error);
    }
  }

  if (!caption || mediaUrls.length <= 1) {
    const profileLookup = await lookupCaptionFromWebProfile(shortCode);
    if (!caption) {
      caption = profileLookup.caption;
      altText = caption;
    }
    if (profileLookup.mediaUrls.length) {
      mediaUrls = uniqueUrls([...mediaUrls, ...profileLookup.mediaUrls]);
    }
  }

  if (!mediaUrls.length && !caption) {
    throw new Error(
      'Could not load photos or caption from that Instagram post. It may be private, or Instagram blocked the server request.'
    );
  }

  return {
    shortCode,
    url,
    caption,
    altText,
    mediaUrls,
    featuredImage: mediaUrls[0] || null,
  };
}

type ProfileStub = {
  shortCode: string;
  url: string;
  mediaUrls: string[];
  caption: string;
};

function extractProfileStubsFromHtml(html: string, limit: number): ProfileStub[] {
  const stubs: ProfileStub[] = [];
  const seen = new Set<string>();

  const addStub = (shortCode: string, mediaUrls: string[] = [], caption = '') => {
    const code = String(shortCode || '').trim();
    if (!code || seen.has(code)) {
      return;
    }
    seen.add(code);
    stubs.push({
      shortCode: code,
      url: `https://www.instagram.com/p/${code}/`,
      mediaUrls: uniqueUrls(mediaUrls),
      caption: String(caption || '').trim(),
    });
  };

  const shortcodeBlockPattern =
    /"shortcode"\s*:\s*"([A-Za-z0-9_-]+)"[\s\S]{0,1200}?"display_url"\s*:\s*"([^"]+)"/g;
  let blockMatch: RegExpExecArray | null = shortcodeBlockPattern.exec(html);
  while (blockMatch) {
    addStub(
      blockMatch[1],
      [decodeHtmlEntities(blockMatch[2].replace(/\\u0026/g, '&').replace(/\\\//g, '/'))],
      ''
    );
    if (stubs.length >= limit) {
      return stubs;
    }
    blockMatch = shortcodeBlockPattern.exec(html);
  }

  const hrefPattern = /href="(\/(?:[^"/]+\/)?p\/([A-Za-z0-9_-]+)\/?)"/g;
  let hrefMatch: RegExpExecArray | null = hrefPattern.exec(html);
  while (hrefMatch) {
    addStub(hrefMatch[2], [], '');
    if (stubs.length >= limit) {
      return stubs;
    }
    hrefMatch = hrefPattern.exec(html);
  }

  const shortCodePattern = /\/p\/([A-Za-z0-9_-]+)/g;
  let shortMatch: RegExpExecArray | null = shortCodePattern.exec(html);
  while (shortMatch) {
    addStub(shortMatch[1], [], '');
    if (stubs.length >= limit) {
      return stubs;
    }
    shortMatch = shortCodePattern.exec(html);
  }

  return stubs.slice(0, limit);
}

export async function scrapeInstagramProfilePosts(
  profileUrl = DEFAULT_INSTAGRAM_PROFILE_URL,
  limit = 20
): Promise<ScrapedInstagramPost[]> {
  const safeLimit = Math.max(1, Math.min(50, Number.isFinite(limit) ? limit : 20));
  const username = extractInstagramProfileUsername(profileUrl);

  try {
    const webPosts = await fetchInstagramWebProfilePosts(username, safeLimit);
    if (webPosts.length) {
      return webPosts;
    }
  } catch (error) {
    console.warn('[BLOG/INSTAGRAM-SCRAPE] Web profile API failed, falling back to HTML scrape:', error);
  }

  const html = await fetchText(profileUrl);
  const stubs = extractProfileStubsFromHtml(html, safeLimit);

  if (!stubs.length) {
    throw new Error(
      'Could not find Instagram posts on the profile page. Try importing individual post URLs instead.'
    );
  }

  const posts: ScrapedInstagramPost[] = [];

  for (const stub of stubs) {
    if (stub.mediaUrls.length) {
      posts.push({
        shortCode: stub.shortCode,
        url: stub.url,
        caption: stub.caption,
        altText: stub.caption,
        mediaUrls: stub.mediaUrls,
        featuredImage: stub.mediaUrls[0] || null,
      });
      continue;
    }

    try {
      posts.push(await scrapeInstagramPostPage(stub.url));
    } catch (error) {
      console.warn('[BLOG/INSTAGRAM-SCRAPE] Skipping profile post:', stub.url, error);
    }
  }

  if (!posts.length) {
    throw new Error(
      'Found Instagram post links but could not load any photos. Try importing a single post URL instead.'
    );
  }

  return posts;
}
