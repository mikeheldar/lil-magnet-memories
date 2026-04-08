/**
 * Vercel Serverless Function
 * Proxies Google Places requests to avoid CORS.
 *
 * Tries Places API (New) first (reviews often require this endpoint + billing SKU),
 * then falls back to legacy Place Details if needed.
 */

function getServerApiKey() {
  return (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.VITE_GOOGLE_PLACES_API_KEY
  );
}

/** Map Places API (New) review → legacy Place Details shape for the frontend */
function mapNewReviewToLegacy(r, index) {
  const text =
    (r.text && r.text.text) ||
    (r.originalText && r.originalText.text) ||
    '';
  const publishMs = r.publishTime ? Date.parse(r.publishTime) : NaN;
  const timeSec = Number.isFinite(publishMs)
    ? Math.floor(publishMs / 1000)
    : Math.floor(Date.now() / 1000) + index;

  return {
    author_name: r.authorAttribution?.displayName || 'Anonymous',
    profile_photo_url: r.authorAttribution?.photoUri || null,
    rating: typeof r.rating === 'number' ? r.rating : 5,
    text,
    time: timeSec,
    relative_time_description: r.relativePublishTimeDescription || '',
  };
}

function displayNameText(displayName) {
  if (!displayName) return undefined;
  if (typeof displayName === 'string') return displayName;
  return displayName.text;
}

/**
 * @returns {Promise<{ name?: string, rating?: number, user_ratings_total?: number, reviews: object[], error?: string } | null>}
 */
async function fetchPlacesApiNew(placeId, apiKey) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'displayName,rating,userRatingCount,reviews',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn(
      '[API] Places API (New) HTTP',
      response.status,
      errText.slice(0, 400)
    );
    return null;
  }

  const body = await response.json();
  const raw = body.reviews || [];
  const reviews = raw.map(mapNewReviewToLegacy);

  return {
    name: displayNameText(body.displayName),
    rating: body.rating,
    user_ratings_total: body.userRatingCount,
    reviews,
  };
}

/**
 * @returns {Promise<{ ok: true, result: object } | { ok: false, status: string, message?: string }>}
 */
async function fetchLegacyPlaceDetails(placeId, apiKey) {
  const fields = 'name,rating,user_ratings_total,reviews';
  const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(googleUrl);
  const data = await response.json();

  if (data.status !== 'OK') {
    return {
      ok: false,
      status: data.status,
      message: data.error_message,
    };
  }

  return {
    ok: true,
    result: {
      name: data.result?.name,
      rating: data.result?.rating,
      user_ratings_total: data.result?.user_ratings_total,
      reviews: data.result?.reviews || [],
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({
        error: 'Missing placeId parameter',
        usage: '/api/google-reviews?placeId=YOUR_PLACE_ID',
      });
    }

    const apiKey = getServerApiKey();

    if (!apiKey) {
      console.error(
        'GOOGLE_PLACES_API_KEY or VITE_GOOGLE_PLACES_API_KEY not set in environment'
      );
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'API key not configured',
      });
    }

    console.log('[API] Fetching Google reviews for Place ID:', placeId);

    const newData = await fetchPlacesApiNew(placeId, apiKey);

    let name = newData?.name;
    let rating = newData?.rating;
    let user_ratings_total = newData?.user_ratings_total;
    let reviews = newData?.reviews || [];

    if (reviews.length === 0) {
      console.log('[API] New API returned 0 reviews (or unavailable); trying legacy');
      const legacy = await fetchLegacyPlaceDetails(placeId, apiKey);

      if (!legacy.ok) {
        if (!newData) {
          console.error(
            '[API] Legacy error:',
            legacy.status,
            legacy.message
          );
          return res.status(400).json({
            error: 'Google Places API error',
            status: legacy.status,
            message: legacy.message || 'Unknown error',
          });
        }
        console.warn('[API] Legacy failed but New returned metadata:', legacy.status);
      } else {
        if (name == null) name = legacy.result.name;
        if (rating == null) rating = legacy.result.rating;
        if (user_ratings_total == null) {
          user_ratings_total = legacy.result.user_ratings_total;
        }
        if (legacy.result.reviews?.length) {
          reviews = legacy.result.reviews;
        }
      }
    } else {
      console.log(`[API] Places API (New): ${reviews.length} reviews`);
    }

    console.log(`[API] Returning ${reviews.length} reviews`);

    return res.status(200).json({
      status: 'OK',
      result: {
        name,
        rating,
        user_ratings_total,
        reviews,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching reviews:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
