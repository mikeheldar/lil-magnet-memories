"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeInstagramProfilePosts = exports.scrapeInstagramPostPage = exports.normalizeInstagramPostUrl = exports.extractInstagramProfileUsername = exports.extractInstagramUsername = exports.extractInstagramShortCode = exports.DEFAULT_INSTAGRAM_PROFILE_URL = void 0;
exports.DEFAULT_INSTAGRAM_PROFILE_URL = process.env.INSTAGRAM_PROFILE_URL || 'https://www.instagram.com/lilmagnetmemories/';
const INSTAGRAM_WEB_APP_ID = '936619743392459';
const FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
};
const INSTAGRAM_WEB_API_HEADERS = Object.assign(Object.assign({}, FETCH_HEADERS), { Accept: '*/*', 'X-IG-App-ID': INSTAGRAM_WEB_APP_ID, 'X-Requested-With': 'XMLHttpRequest', Referer: exports.DEFAULT_INSTAGRAM_PROFILE_URL, Origin: 'https://www.instagram.com', 'Sec-Fetch-Site': 'same-origin', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Dest': 'empty' });
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
function extractInstagramShortCode(raw) {
    const value = String(raw || '').trim();
    if (!value)
        return null;
    const patterns = [
        /instagram\.com\/(?:[^/]+\/)?p\/([A-Za-z0-9_-]+)/i,
        /instagram\.com\/(?:[^/]+\/)?reel\/([A-Za-z0-9_-]+)/i,
        /instagram\.com\/(?:[^/]+\/)?tv\/([A-Za-z0-9_-]+)/i,
    ];
    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match === null || match === void 0 ? void 0 : match[1]) {
            return match[1];
        }
    }
    return null;
}
exports.extractInstagramShortCode = extractInstagramShortCode;
function extractInstagramUsername(raw) {
    const value = String(raw || '').trim();
    const match = value.match(/instagram\.com\/([A-Za-z0-9._]+)\/?(?:$|\?|#)/i);
    if (!(match === null || match === void 0 ? void 0 : match[1])) {
        return null;
    }
    const username = match[1].toLowerCase();
    if (['p', 'reel', 'tv', 'stories', 'explore', 'accounts'].includes(username)) {
        return null;
    }
    return match[1];
}
exports.extractInstagramUsername = extractInstagramUsername;
function extractInstagramProfileUsername(profileUrl = exports.DEFAULT_INSTAGRAM_PROFILE_URL) {
    return extractInstagramUsername(profileUrl) || 'lilmagnetmemories';
}
exports.extractInstagramProfileUsername = extractInstagramProfileUsername;
async function fetchInstagramWebProfilePosts(username, limit) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const fetchFn = globalThis.fetch;
    if (typeof fetchFn !== 'function') {
        throw new Error('Global fetch is unavailable in this runtime.');
    }
    const response = await fetchFn(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`, {
        headers: Object.assign(Object.assign({}, INSTAGRAM_WEB_API_HEADERS), { Referer: `https://www.instagram.com/${username}/` }),
    });
    if (!response.ok) {
        throw new Error(`Instagram profile request failed (${response.status}).`);
    }
    const payload = await response.json();
    const edges = (_c = (_b = (_a = payload === null || payload === void 0 ? void 0 : payload.data) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.edge_owner_to_timeline_media) === null || _c === void 0 ? void 0 : _c.edges;
    if (!Array.isArray(edges) || !edges.length) {
        throw new Error('Instagram profile returned no posts.');
    }
    const posts = [];
    for (const edge of edges.slice(0, limit)) {
        const node = edge === null || edge === void 0 ? void 0 : edge.node;
        const shortCode = String((node === null || node === void 0 ? void 0 : node.shortcode) || '').trim();
        if (!shortCode) {
            continue;
        }
        const caption = String(((_g = (_f = (_e = (_d = node === null || node === void 0 ? void 0 : node.edge_media_to_caption) === null || _d === void 0 ? void 0 : _d.edges) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.node) === null || _g === void 0 ? void 0 : _g.text) || '').trim() ||
            String((node === null || node === void 0 ? void 0 : node.accessibility_caption) || '').trim();
        const mediaUrls = uniqueUrls([
            node === null || node === void 0 ? void 0 : node.display_url,
            node === null || node === void 0 ? void 0 : node.thumbnail_src,
            ...(Array.isArray((_h = node === null || node === void 0 ? void 0 : node.edge_sidecar_to_children) === null || _h === void 0 ? void 0 : _h.edges)
                ? node.edge_sidecar_to_children.edges.map((child) => { var _a, _b; return ((_a = child === null || child === void 0 ? void 0 : child.node) === null || _a === void 0 ? void 0 : _a.display_url) || ((_b = child === null || child === void 0 ? void 0 : child.node) === null || _b === void 0 ? void 0 : _b.thumbnail_src); })
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
async function lookupCaptionFromWebProfile(shortCode, username = extractInstagramProfileUsername()) {
    try {
        const posts = await fetchInstagramWebProfilePosts(username, 50);
        const match = posts.find((post) => post.shortCode === shortCode);
        if (match) {
            return {
                caption: match.caption || match.altText || '',
                mediaUrls: match.mediaUrls,
            };
        }
    }
    catch (error) {
        console.warn('[BLOG/INSTAGRAM-SCRAPE] Profile caption lookup failed:', error);
    }
    return { caption: '', mediaUrls: [] };
}
function normalizeInstagramPostUrl(raw) {
    const shortCode = extractInstagramShortCode(raw);
    if (!shortCode)
        return null;
    return `https://www.instagram.com/p/${shortCode}/`;
}
exports.normalizeInstagramPostUrl = normalizeInstagramPostUrl;
function extractMetaContent(html, attr, value) {
    const patterns = [
        new RegExp(`<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${value}["']`, 'i'),
    ];
    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match === null || match === void 0 ? void 0 : match[1]) {
            return decodeHtmlEntities(match[1].trim());
        }
    }
    return null;
}
function extractImagesFromHtml(html) {
    const urls = [];
    const add = (url) => {
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
        let match = pattern.exec(html);
        while (match) {
            add(decodeHtmlEntities(match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')));
            match = pattern.exec(html);
        }
    }
    const imgTagPattern = /<img[^>]+src=["'](https:\/\/[^"']+\.cdninstagram\.com[^"']+)["']/gi;
    let imgMatch = imgTagPattern.exec(html);
    while (imgMatch) {
        add(decodeHtmlEntities(imgMatch[1]));
        imgMatch = imgTagPattern.exec(html);
    }
    return uniqueUrls(urls);
}
async function fetchText(url) {
    const fetchFn = globalThis.fetch;
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
async function resolveInstagramMediaRedirect(shortCode) {
    const fetchFn = globalThis.fetch;
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
function extractCaptionFromHtml(html) {
    const ogDescription = extractMetaContent(html, 'property', 'og:description') || '';
    const cleaned = ogDescription
        .replace(/^[\d,.]+ (likes?|views?),?\s*/i, '')
        .replace(/^".*?" on Instagram:\s*/i, '')
        .replace(/^".*?":\s*/i, '')
        .trim();
    if (cleaned) {
        return cleaned;
    }
    return (extractMetaContent(html, 'name', 'description') ||
        extractMetaContent(html, 'property', 'og:title') ||
        '').trim();
}
async function scrapeInstagramPostPage(rawUrl) {
    const url = normalizeInstagramPostUrl(rawUrl);
    if (!url) {
        throw new Error('Invalid Instagram post URL. Use a link like https://www.instagram.com/p/ABC123/');
    }
    const shortCode = extractInstagramShortCode(url);
    const fetchUrls = [
        `https://www.instagram.com/p/${shortCode}/embed/captioned/`,
        url,
        `https://www.instagram.com/reel/${shortCode}/`,
    ];
    let caption = '';
    let altText = '';
    let mediaUrls = [];
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
        }
        catch (error) {
            console.warn('[BLOG/INSTAGRAM-SCRAPE] Fetch attempt failed:', fetchUrl, error);
        }
    }
    if (!mediaUrls.length) {
        try {
            const redirectUrl = await resolveInstagramMediaRedirect(shortCode);
            if (redirectUrl) {
                mediaUrls = [redirectUrl];
            }
        }
        catch (error) {
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
        throw new Error('Could not load photos or caption from that Instagram post. It may be private, or Instagram blocked the server request.');
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
exports.scrapeInstagramPostPage = scrapeInstagramPostPage;
function extractProfileStubsFromHtml(html, limit) {
    const stubs = [];
    const seen = new Set();
    const addStub = (shortCode, mediaUrls = [], caption = '') => {
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
    const shortcodeBlockPattern = /"shortcode"\s*:\s*"([A-Za-z0-9_-]+)"[\s\S]{0,1200}?"display_url"\s*:\s*"([^"]+)"/g;
    let blockMatch = shortcodeBlockPattern.exec(html);
    while (blockMatch) {
        addStub(blockMatch[1], [decodeHtmlEntities(blockMatch[2].replace(/\\u0026/g, '&').replace(/\\\//g, '/'))], '');
        if (stubs.length >= limit) {
            return stubs;
        }
        blockMatch = shortcodeBlockPattern.exec(html);
    }
    const hrefPattern = /href="(\/(?:[^"/]+\/)?p\/([A-Za-z0-9_-]+)\/?)"/g;
    let hrefMatch = hrefPattern.exec(html);
    while (hrefMatch) {
        addStub(hrefMatch[2], [], '');
        if (stubs.length >= limit) {
            return stubs;
        }
        hrefMatch = hrefPattern.exec(html);
    }
    const shortCodePattern = /\/p\/([A-Za-z0-9_-]+)/g;
    let shortMatch = shortCodePattern.exec(html);
    while (shortMatch) {
        addStub(shortMatch[1], [], '');
        if (stubs.length >= limit) {
            return stubs;
        }
        shortMatch = shortCodePattern.exec(html);
    }
    return stubs.slice(0, limit);
}
async function scrapeInstagramProfilePosts(profileUrl = exports.DEFAULT_INSTAGRAM_PROFILE_URL, limit = 20) {
    const safeLimit = Math.max(1, Math.min(50, Number.isFinite(limit) ? limit : 20));
    const username = extractInstagramProfileUsername(profileUrl);
    try {
        const webPosts = await fetchInstagramWebProfilePosts(username, safeLimit);
        if (webPosts.length) {
            return webPosts;
        }
    }
    catch (error) {
        console.warn('[BLOG/INSTAGRAM-SCRAPE] Web profile API failed, falling back to HTML scrape:', error);
    }
    const html = await fetchText(profileUrl);
    const stubs = extractProfileStubsFromHtml(html, safeLimit);
    if (!stubs.length) {
        throw new Error('Could not find Instagram posts on the profile page. Try importing individual post URLs instead.');
    }
    const posts = [];
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
        }
        catch (error) {
            console.warn('[BLOG/INSTAGRAM-SCRAPE] Skipping profile post:', stub.url, error);
        }
    }
    if (!posts.length) {
        throw new Error('Found Instagram post links but could not load any photos. Try importing a single post URL instead.');
    }
    return posts;
}
exports.scrapeInstagramProfilePosts = scrapeInstagramProfilePosts;
//# sourceMappingURL=instagramScrape.js.map