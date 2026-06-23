import {
  DEFAULT_INSTAGRAM_PROFILE_URL,
  scrapeInstagramProfilePosts,
} from './lib/instagramScrape.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.method === 'POST' ? req.body || {} : req.query || {};
    const requestedLimit = Number(body.limit || 20);
    const limit = Math.max(1, Math.min(50, Number.isFinite(requestedLimit) ? requestedLimit : 20));
    const profileUrl = String(body.profileUrl || DEFAULT_INSTAGRAM_PROFILE_URL).trim();

    const posts = await scrapeInstagramProfilePosts(profileUrl, limit);

    return res.status(200).json({
      success: true,
      method: 'scrape',
      fetchedCount: posts.length,
      posts,
    });
  } catch (error) {
    console.error('[API] instagram-scrape-profile error:', error);
    return res.status(500).json({
      error: 'Failed to scrape Instagram profile posts.',
      details: error?.message || 'Unknown error',
    });
  }
}
