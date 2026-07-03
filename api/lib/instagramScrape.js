const DEFAULT_INSTAGRAM_PROFILE_URL =
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

function collectSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie().map((cookie) => cookie.split(';')[0]).join('; ');
  }
  const raw = response.headers.get('set-cookie');
  if (!raw) return '';
  return raw
    .split(/,(?=[^;]+=[^;]+)/)
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

function parseSeedPostUrls(rawValue) {
  if (!rawValue) return [];
  const urls = [];
  for (const part of String(rawValue).split(/[\n,]+/)) {
    const normalized = normalizeInstagramPostUrl(part.trim());
    if (normalized && !urls.includes(normalized)) {
      urls.push(normalized);
    }
  }
  return urls;
}

function getConfiguredSeedPostUrls(extraUrls = []) {
  const envSeeds = parseSeedPostUrls(process.env.INSTAGRAM_SYNC_SEED_URLS || '');
  const merged = [...envSeeds];
  for (const raw of extraUrls) {
    const normalized = normalizeInstagramPostUrl(String(raw || '').trim());
    if (normalized && !merged.includes(normalized)) {
      merged.push(normalized);
    }
  }
  return merged;
}

async function bootstrapInstagramSession(username) {
  const profileRes = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: {
      ...FETCH_HEADERS,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    },
    redirect: 'follow',
  });

  const html = await profileRes.text();
  const lsd = html.match(/"LSD",\[\],\{"token":"([^"]+)"/)?.[1] || '';
  const cookies = collectSetCookieHeaders(profileRes);

  if (!profileRes.ok) {
    throw new Error(`Instagram profile page failed (${profileRes.status}).`);
  }

  return { lsd, cookies, html };
}

function buildInstagramWebApiHeaders(username, session) {
  return {
    ...INSTAGRAM_WEB_API_HEADERS,
    Referer: `https://www.instagram.com/${username}/`,
    ...(session?.lsd ? { 'X-FB-LSD': session.lsd } : {}),
    ...(session?.cookies ? { Cookie: session.cookies } : {}),
  };
}

async function fetchWithRetry(url, options = {}, attempts = 3) {
  let lastError = null;
  let lastResponse = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;
      if (response.ok) {
        return response;
      }
      if (response.status === 429) {
        lastError = new Error(`Instagram request rate limited (429) for ${url}`);
        const retryAfter = Number(response.headers.get('retry-after') || 0);
        const waitMs = retryAfter > 0 ? retryAfter * 1000 : 1500 * attempt;
        if (attempt < attempts) {
          await sleep(waitMs);
          continue;
        }
        return response;
      }
      if (response.status < 500) {
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
  if (lastResponse) {
    return lastResponse;
  }
  throw lastError || new Error(`Instagram request failed for ${url}`);
}

function extractInstagramShortCode(raw) {
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

function extractInstagramUsername(raw) {
  const value = String(raw || '').trim();
  const match = value.match(/instagram\.com\/([A-Za-z0-9._]+)\/?(?:$|\?|#)/i);
  if (!match?.[1]) return null;
  const username = match[1].toLowerCase();
  if (['p', 'reel', 'tv', 'stories', 'explore', 'accounts'].includes(username)) {
    return null;
  }
  return match[1];
}

function extractInstagramProfileUsername(profileUrl = DEFAULT_INSTAGRAM_PROFILE_URL) {
  return extractInstagramUsername(profileUrl) || 'lilmagnetmemories';
}

function normalizeInstagramPostUrl(raw) {
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

function mapInstagramProfileEdges(edges, limit) {
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

    posts.push({
      shortCode,
      url: `https://www.instagram.com/p/${shortCode}/`,
      caption,
      altText: caption,
      mediaUrls,
      featuredImage: mediaUrls[0] || null,
    });
  }
  return posts;
}

async function enrichPostsWithMedia(posts) {
  const enriched = [];
  for (const post of posts) {
    let mediaUrls = uniqueUrls(post.mediaUrls || []);
    if (!mediaUrls.length && post.shortCode) {
      const redirectUrl = await resolveInstagramMediaRedirect(post.shortCode);
      if (redirectUrl) mediaUrls = [redirectUrl];
    }
    enriched.push({
      ...post,
      mediaUrls,
      featuredImage: mediaUrls[0] || post.featuredImage || null,
    });
  }
  return enriched;
}

async function fetchInstagramWebProfilePosts(username, limit, session = null) {
  const activeSession = session || (await bootstrapInstagramSession(username));
  const apiPath = `/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
  const hosts = ['www.instagram.com', 'i.instagram.com'];
  let lastStatus = 0;

  for (const host of hosts) {
    const response = await fetchWithRetry(
      `https://${host}${apiPath}`,
      {
        headers: buildInstagramWebApiHeaders(username, activeSession),
      },
      4
    );

    lastStatus = response.status;
    if (response.status === 429) {
      continue;
    }

    if (!response.ok) {
      throw new Error(`Instagram profile API failed (${response.status}).`);
    }

    const payload = await response.json();
    const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges;
    if (!Array.isArray(edges) || !edges.length) {
      throw new Error('Instagram profile returned no posts.');
    }

    return enrichPostsWithMedia(mapInstagramProfileEdges(edges, limit));
  }

  const rateLimitError = new Error(`Instagram profile API failed (${lastStatus || 429}).`);
  rateLimitError.statusCode = lastStatus || 429;
  throw rateLimitError;
}

async function scrapeInstagramProfilePostsFromUrls(postUrls, limit) {
  const safeLimit = Math.max(1, Math.min(50, Number.isFinite(limit) ? limit : 20));
  const urls = parseSeedPostUrls(postUrls.join('\n')).slice(0, safeLimit);
  if (!urls.length) {
    return [];
  }

  const posts = [];
  for (const url of urls) {
    try {
      const post = await scrapeInstagramPostPage(url);
      if (post?.shortCode) {
        posts.push(post);
      }
    } catch (error) {
      console.warn('[instagram-scrape] Seed post scrape failed:', url, error?.message);
    }
    await sleep(350);
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

async function scrapeInstagramPostPage(rawUrl) {
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

async function scrapeInstagramProfilePosts(
  profileUrl = DEFAULT_INSTAGRAM_PROFILE_URL,
  limit = 20,
  options = {}
) {
  const safeLimit = Math.max(1, Math.min(50, Number.isFinite(limit) ? limit : 20));
  const username = extractInstagramProfileUsername(profileUrl);
  const seedUrls = getConfiguredSeedPostUrls(options.postUrls || []);

  try {
    const webPosts = await fetchInstagramWebProfilePosts(username, safeLimit);
    if (webPosts.length) {
      return webPosts;
    }
  } catch (error) {
    if (error?.statusCode !== 429 && !String(error?.message || '').includes('429')) {
      throw error;
    }
    console.warn('[instagram-scrape] Profile API rate limited, trying seed URLs fallback.');
    const fallbackPosts = await scrapeInstagramProfilePostsFromUrls(seedUrls, safeLimit);
    if (fallbackPosts.length) {
      return fallbackPosts;
    }
    const rateLimitError = new Error(
      'Instagram is rate-limiting bulk profile sync from the server. Wait a few minutes and try again, paste individual post URLs, or set INSTAGRAM_SYNC_SEED_URLS on Vercel with recent post links as a fallback.'
    );
    rateLimitError.statusCode = 429;
    throw rateLimitError;
  }

  if (seedUrls.length) {
    const fallbackPosts = await scrapeInstagramProfilePostsFromUrls(seedUrls, safeLimit);
    if (fallbackPosts.length) {
      return fallbackPosts;
    }
  }

  throw new Error(
    'Could not load Instagram profile posts. Try importing individual post URLs instead.'
  );
}

module.exports = {
  DEFAULT_INSTAGRAM_PROFILE_URL,
  extractInstagramShortCode,
  extractInstagramUsername,
  extractInstagramProfileUsername,
  normalizeInstagramPostUrl,
  scrapeInstagramPostPage,
  scrapeInstagramProfilePosts,
  scrapeInstagramProfilePostsFromUrls,
  getConfiguredSeedPostUrls,
};
