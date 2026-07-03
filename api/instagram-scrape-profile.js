const {
  DEFAULT_INSTAGRAM_PROFILE_URL,
  scrapeInstagramProfilePosts,
} = require('./lib/instagramScrape.js');

function getJsonBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.method === 'POST' ? getJsonBody(req) : req.query || {};
    const requestedLimit = Number(body.limit || 20);
    const limit = Math.max(1, Math.min(50, Number.isFinite(requestedLimit) ? requestedLimit : 20));
    const profileUrl = String(body.profileUrl || DEFAULT_INSTAGRAM_PROFILE_URL).trim();
    const postUrls = Array.isArray(body.postUrls) ? body.postUrls : [];

    const posts = await scrapeInstagramProfilePosts(profileUrl, limit, { postUrls });

    return res.status(200).json({
      success: true,
      method: 'scrape',
      fetchedCount: posts.length,
      posts,
    });
  } catch (error) {
    console.error('[API] instagram-scrape-profile error:', error);
    const statusCode = error?.statusCode === 429 ? 429 : 500;
    return res.status(statusCode).json({
      error: statusCode === 429 ? 'Instagram rate limited bulk profile sync.' : 'Failed to scrape Instagram profile posts.',
      details: error?.message || 'Unknown error',
    });
  }
}

handler.config = { maxDuration: 30 };
module.exports = handler;
