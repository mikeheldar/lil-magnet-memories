/**
 * Vercel Serverless Function
 * Proxies Google Places requests to avoid CORS.
 *
 * Places API (New): requests Enterprise (rating, userRatingCount) + Enterprise+Atmosphere
 * (reviews, reviewSummary) per field mask docs.
 * Legacy Place Details: requests Atmosphere fields (reviews, rating, user_ratings_total)
 * with reviews_sort + language.
 *
 * Runs both in parallel and merges the best available data.
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

/** Normalize reviewSummary for JSON (LocalizedText → plain strings where needed) */
function normalizeReviewSummary(body) {
  const rs = body.reviewSummary;
  if (!rs) return null;
  return {
    text: rs.text?.text ?? rs.text ?? null,
    disclosureText: rs.disclosureText?.text ?? rs.disclosureText ?? null,
    reviewsUri: rs.reviewsUri ?? null,
    flagContentUri: rs.flagContentUri ?? null,
  };
}

/**
 * Places API (New) — field mask must list Enterprise + Enterprise+Atmosphere fields
 * @see https://developers.google.com/maps/documentation/places/web-service/place-details
 */
async function fetchPlacesApiNew(placeId, apiKey) {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const fieldMask = [
    'displayName',
    'rating',
    'userRatingCount',
    'reviews',
    'reviewSummary',
    'googleMapsUri',
  ].join(',');

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
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
    reviewSummary: normalizeReviewSummary(body),
    googleMapsUri: body.googleMapsUri || null,
  };
}

/**
 * Legacy Place Details — atmosphere: rating, user_ratings_total, reviews
 * @see https://developers.google.com/maps/documentation/places/web-service/details
 */
async function fetchLegacyPlaceDetails(placeId, apiKey) {
  const fields = 'name,rating,user_ratings_total,reviews,place_id';
  const u = new URL(
    'https://maps.googleapis.com/maps/api/place/details/json'
  );
  u.searchParams.set('place_id', placeId);
  u.searchParams.set('fields', fields);
  u.searchParams.set('key', apiKey);
  u.searchParams.set('reviews_sort', 'newest');
  u.searchParams.set('language', 'en');

  const response = await fetch(u.toString());
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
      place_id: data.result?.place_id,
      rating: data.result?.rating,
      user_ratings_total: data.result?.user_ratings_total,
      reviews: data.result?.reviews || [],
    },
  };
}

function mergeReviewLists(a, b) {
  const out = [];
  const seen = new Set();
  for (const list of [a, b]) {
    if (!list?.length) continue;
    for (const r of list) {
      const key = `${r.time}|${r.author_name}|${(r.text || '').slice(0, 40)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(r);
    }
  }
  return out;
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

    const [newData, legacy] = await Promise.all([
      fetchPlacesApiNew(placeId, apiKey),
      fetchLegacyPlaceDetails(placeId, apiKey),
    ]);

    let name = newData?.name;
    let rating = newData?.rating;
    let user_ratings_total = newData?.user_ratings_total;
    let reviewSummary = newData?.reviewSummary || null;
    let googleMapsUri = newData?.googleMapsUri || null;

    const newReviews = newData?.reviews || [];
    let legacyReviews = [];
    if (legacy?.ok) {
      if (name == null) name = legacy.result.name;
      if (rating == null) rating = legacy.result.rating;
      if (user_ratings_total == null) {
        user_ratings_total = legacy.result.user_ratings_total;
      }
      legacyReviews = legacy.result.reviews || [];
    } else if (legacy && !legacy.ok) {
      console.warn('[API] Legacy Place Details:', legacy.status, legacy.message);
    }

    const reviews = mergeReviewLists(newReviews, legacyReviews);

    console.log(
      `[API] Merged reviews: ${reviews.length} (new:${newReviews.length} legacy:${legacyReviews.length})`
    );

    return res.status(200).json({
      status: 'OK',
      result: {
        name,
        rating,
        user_ratings_total,
        reviews,
        reviewSummary,
        googleMapsUri,
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
