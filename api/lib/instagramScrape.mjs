export const DEFAULT_INSTAGRAM_PROFILE_URL =
  process.env.INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/lilmagnetmemories/';

const INSTAGRAM_WEB_APP_ID = '936619743392459';
const INSTAGRAM_ASBD_ID = '359341';

const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const INSTAGRAM_WEB_API_HEADERS = {
  ...FETCH_HEADERS,
  Accept: '*/*',
  'X-IG-App-ID': INSTAGRAM_WEB_APP_ID,
  'X-ASBD-ID': INSTAGRAM_ASBD_ID,
  'X-IG-WWW-Claim': '0',
  'X-Requested-With': 'XMLHttpRequest',
  Origin: 'https://www.instagram.com',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function uniqueUrls(urls) {
  const out = [];
  for (const raw of urls) {
    const next = String(raw || '').trim();
    if (next && !out.includes(next)) {
      out.push(next);
    }
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok || response.status < 500) {
        return response;
      }
      lastError = new Error(`Instagram request failed (${response.status}) for ${url}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await sleep(400 * attempt);
    }
  }
  throw lastError || new Error(`Instagram request failed for ${url}`);
}

export function extractInstagramShortCode(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  const patterns = [
    /instagram\.com\/(?:[^/]+\/)?p\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/(?:[^/]+\/)?reel\/([A-Za-z0-9_-]+)/i,
    /instagram\.com\/(?:[^/]+\/)?tv\/([A-Za-z0-9_-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function extractInstagramUsername(raw) {
  const value = String(raw || '').trim();
  const match = value.match(/instagram\.com\/([A-Za-z0-9._]+)\/?(?:$|\?|#)/i);
  if (!match?.[1]) return null;
  const username = match[1].toLowerCase();
  if (['p', 'reel', 'tv', 'stories', 'explore', 'accounts'].includes(username)) {
    return null;
  }
  return match[1];
}

export function extractInstagramProfileUsername(profileUrl = DEFAULT_INSTAGRAM_PROFILE_URL) {
  return extractInstagramUsername(profileUrl) || 'lilmagnetmemories';
}

export function normalizeInstagramPostUrl(raw) {
  const shortCode = extractInstagramShortCode(raw);
  if (!shortCode) return null;
  return `https://www.instagram.com/p/${shortCode}/`;
}

async function resolveInstagramMediaRedirect(shortCode) {
  const response = await fetchWithRetry(
    `https://www.instagram.com/p/${shortCode}/media/?size=l`,
    { headers: FETCH_HEADERS, redirect: 'manual' },
    2
  );
  if (response.status >= 300 && response.status < 400) {
    return response.headers.get('location');
  }
  return null;
}

async function fetchInstagramWebProfilePosts(username, limit) {
  const response = await fetchWithRetry(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        ...INSTAGRAM_WEB_API_HEADERS,
        Referer: `https://www.instagram.com/${username}/`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Instagram profile API failed (${response.status}).`);
  }

  const payload = await response.json();
  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges;
  if (!Array.isArray(edges) || !edges.length) {
    throw new Error('Instagram profile returned no posts.');
  }

  const posts = [];
  for (const edge of edges.slice(0, limit)) {
    const node = edge?.node;
    const shortCode = String(node?.shortcode || '').trim();
    if (!shortCode) continue;

    const caption =
      String(node?.edge_media_to_caption?.edges?.[0]?.node?.text || '').trim() ||
      String(node?.accessibility_caption || '').trim();
    const mediaUrls = uniqueUrls([
      node?.display_url,
      node?.thumbnail_src,
      ...(Array.isArray(node?.edge_sidecar_to_children?.edges)
        ? node.edge_sidecar_to_children.edges.map(
            (child) => child?.node?.display_url || child?.node?.thumbnail_src
          )
        : []),
    ]);

    let resolvedMediaUrls = mediaUrls;
    if (!resolvedMediaUrls.length) {
      const redirectUrl = await resolveInstagramMediaRedirect(shortCode);
      if (redirectUrl) resolvedMediaUrls = [redirectUrl];
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

async function fetchText(url) {
  const response = await fetchWithRetry(url, { headers: FETCH_HEADERS, redirect: 'follow' });
  if (!response.ok) {
    throw new Error(`Instagram request failed (${response.status}) for ${url}`);
  }
  return response.text();
}

function extractMetaContent(html, attr, value) {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function extractImagesFromHtml(html) {
  const urls = [];
  const add = (url) => {
    const next = String(url || '').trim();
    if (next.startsWith('http://') || next.startsWith('https://')) urls.push(next);
  };

  add(extractMetaContent(html, 'property', 'og:image'));

  for (const pattern of [
    /"display_url"\s*:\s*"([^"]+)"/g,
    /"thumbnail_src"\s*:\s*"([^"]+)"/g,
  ]) {
    let match = pattern.exec(html);
    while (match) {
      add(decodeHtmlEntities(match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')));
      match = pattern.exec(html);
    }
  }

  return uniqueUrls(urls);
}

function extractCaptionFromHtml(html) {
  const ogDescription = extractMetaContent(html, 'property', 'og:description') || '';
  const cleaned = ogDescription
    .replace(/^[\d,.]+ (likes?|views?),?\s*/i, '')
    .replace(/^".*?" on Instagram:\s*/i, '')
    .replace(/^".*?":\s*/i, '')
    .trim();
  if (cleaned) return cleaned;
  return (
    extractMetaContent(html, 'name', 'description') ||
    extractMetaContent(html, 'property', 'og:title') ||
    ''
  ).trim();
}

async function lookupCaptionFromWebProfile(shortCode, username) {
  try {
    const posts = await fetchInstagramWebProfilePosts(username, 50);
    const match = posts.find((post) => post.shortCode === shortCode);
    if (match) {
      return { caption: match.caption || match.altText || '', mediaUrls: match.mediaUrls };
    }
  } catch (error) {
    console.warn('[instagram-scrape] Profile caption lookup failed:', error?.message);
  }
  return { caption: '', mediaUrls: [] };
}

export async function scrapeInstagramPostPage(rawUrl) {
  const url = normalizeInstagramPostUrl(rawUrl);
  if (!url) {
    throw new Error('Invalid Instagram post URL. Use a link like https://www.instagram.com/p/ABC123/');
  }

  const shortCode = extractInstagramShortCode(url);
  let caption = '';
  let mediaUrls = [];

  for (const fetchUrl of [
    `https://www.instagram.com/p/${shortCode}/embed/captioned/`,
    url,
    `https://www.instagram.com/reel/${shortCode}/`,
  ]) {
    try {
      const html = await fetchText(fetchUrl);
      if (!caption) caption = extractCaptionFromHtml(html);
      mediaUrls = uniqueUrls([...mediaUrls, ...extractImagesFromHtml(html)]);
      if (mediaUrls.length && caption) break;
    } catch (error) {
      console.warn('[instagram-scrape] Post fetch failed:', fetchUrl, error?.message);
    }
  }

  if (!mediaUrls.length) {
    const redirectUrl = await resolveInstagramMediaRedirect(shortCode);
    if (redirectUrl) mediaUrls = [redirectUrl];
  }

  if (!caption || mediaUrls.length <= 1) {
    const profileLookup = await lookupCaptionFromWebProfile(
      shortCode,
      extractInstagramProfileUsername()
    );
    if (!caption) caption = profileLookup.caption;
    if (profileLookup.mediaUrls.length) {
      mediaUrls = uniqueUrls([...mediaUrls, ...profileLookup.mediaUrls]);
    }
  }

  if (!mediaUrls.length && !caption) {
    throw new Error(
      'Could not load photos or caption from that Instagram post. It may be private or temporarily unavailable.'
    );
  }

  return {
    shortCode,
    url,
    caption,
    altText: caption,
    mediaUrls,
    featuredImage: mediaUrls[0] || null,
  };
}

export async function scrapeInstagramProfilePosts(
  profileUrl = DEFAULT_INSTAGRAM_PROFILE_URL,
  limit = 20
) {
  const safeLimit = Math.max(1, Math.min(50, Number.isFinite(limit) ? limit : 20));
  const username = extractInstagramProfileUsername(profileUrl);

  const webPosts = await fetchInstagramWebProfilePosts(username, safeLimit);
  if (webPosts.length) return webPosts;

  throw new Error(
    'Could not load Instagram profile posts. Try importing individual post URLs instead.'
  );
}
