/**
 * Vercel Serverless Function
 * Proxies Google Places API requests to avoid CORS issues
 * 
 * This function fetches reviews from Google Places API on the backend
 * and returns them to the frontend, solving the CORS problem.
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { placeId } = req.query;
    
    // Validate Place ID
    if (!placeId) {
      return res.status(400).json({ 
        error: 'Missing placeId parameter',
        usage: '/api/google-reviews?placeId=YOUR_PLACE_ID'
      });
    }

    // Get API key from environment variable
    const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;
    
    if (!apiKey) {
      console.error('VITE_GOOGLE_PLACES_API_KEY not set in Vercel environment variables');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key not configured'
      });
    }

    console.log('🔍 [API] Fetching Google reviews for Place ID:', placeId);

    // Construct Google Places API URL
    const fields = 'name,rating,user_ratings_total,reviews';
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;

    console.log('📡 [API] Calling Google Places API...');

    // Fetch from Google Places API
    const response = await fetch(googleUrl);
    const data = await response.json();

    console.log('📥 [API] Google API Response Status:', data.status);

    // Check for API errors
    if (data.status !== 'OK') {
      console.error('❌ [API] Google Places API error:', data.status, data.error_message);
      return res.status(400).json({
        error: 'Google Places API error',
        status: data.status,
        message: data.error_message || 'Unknown error'
      });
    }

    const reviews = data.result?.reviews || [];
    console.log(`✅ [API] Successfully fetched ${reviews.length} reviews`);

    // Return the reviews
    return res.status(200).json({
      status: 'OK',
      result: {
        name: data.result?.name,
        rating: data.result?.rating,
        user_ratings_total: data.result?.user_ratings_total,
        reviews: reviews
      }
    });

  } catch (error) {
    console.error('❌ [API] Error fetching reviews:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
