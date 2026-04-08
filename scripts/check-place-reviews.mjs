#!/usr/bin/env node
/**
 * One-off: fetch Place Details (legacy + Places API New) for a place_id and print review counts.
 * Usage: node scripts/check-place-reviews.mjs [placeId]
 * Loads API key from .env: GOOGLE_PLACES_API_KEY or VITE_GOOGLE_PLACES_API_KEY
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env'), quiet: true });
config({ path: resolve(__dirname, '../.env.local'), quiet: true });

const placeId = process.argv[2] || 'ChIJcw6BIkQL9YgRi2XERn80DPg';

const apiKey =
  process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY;

if (!apiKey) {
  console.error(
    'Missing GOOGLE_PLACES_API_KEY or VITE_GOOGLE_PLACES_API_KEY in .env'
  );
  process.exit(1);
}

async function legacyDetails() {
  const fields = 'name,rating,user_ratings_total,reviews,place_id';
  const url = new URL(
    'https://maps.googleapis.com/maps/api/place/details/json'
  );
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', fields);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('reviews_sort', 'newest');
  url.searchParams.set('language', 'en');

  const res = await fetch(url);
  const data = await res.json();
  const reviews = data.result?.reviews || [];
  return {
    api: 'legacy Place Details',
    httpOk: res.ok,
    status: data.status,
    error_message: data.error_message,
    name: data.result?.name ?? null,
    place_id: data.result?.place_id ?? null,
    rating: data.result?.rating ?? null,
    user_ratings_total: data.result?.user_ratings_total ?? null,
    reviewCount: reviews.length,
  };
}

async function placesNew() {
  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'id,displayName,rating,userRatingCount,reviews,reviewSummary,googleMapsUri,formattedAddress',
    },
  });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    return {
      api: 'Places API (New)',
      httpStatus: res.status,
      parseError: true,
      rawSnippet: text.slice(0, 200),
    };
  }
  const reviews = body.reviews || [];
  const rs = body.reviewSummary;
  return {
    api: 'Places API (New)',
    httpStatus: res.status,
    name: (body.displayName?.text || body.displayName) ?? null,
    rating: body.rating ?? null,
    userRatingCount: body.userRatingCount ?? null,
    reviewCount: reviews.length,
    hasReviewSummary: !!(rs && (rs.text?.text || rs.text)),
    error: body.error ?? null,
  };
}

console.log('Place ID:', placeId);
console.log('');

try {
  const legacy = await legacyDetails();
  console.log('---', legacy.api, '---');
  console.log(JSON.stringify(legacy, null, 2));
  if (legacy.status === 'OK' && legacy.reviewCount === 0 && legacy.user_ratings_total == null) {
    console.log(
      '\nNote: If rating/review counts are missing from the raw API despite being requested,'
    );
    console.log(
      '      check GCP: Places API enabled, billing on, and SKU access for review/atmosphere data.\n'
    );
  }
  console.log('');

  const neu = await placesNew();
  console.log('---', neu.api, '---');
  console.log(JSON.stringify(neu, null, 2));
} catch (e) {
  console.error(e);
  process.exit(1);
}
