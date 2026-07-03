const {
  normalizeInstagramPostUrl,
  scrapeInstagramPostPage,
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

module.exports = async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.method === 'POST' ? getJsonBody(req) : req.query || {};
    const rawUrl = String(body.url || '').trim();
    const normalizedUrl = normalizeInstagramPostUrl(rawUrl);

    if (!normalizedUrl) {
      return res.status(400).json({
        error: 'Invalid Instagram post URL.',
        details: 'Use a link like https://www.instagram.com/p/ABC123/ or /reel/ABC123/',
      });
    }

    const post = await scrapeInstagramPostPage(normalizedUrl);

    return res.status(200).json({
      success: true,
      method: 'scrape',
      post,
    });
  } catch (error) {
    console.error('[API] instagram-scrape-post error:', error);
    return res.status(500).json({
      error: 'Failed to scrape Instagram post.',
      details: error?.message || 'Unknown error',
    });
  }
};
