/**
 * Resolve VITE_GOOGLE_PLACE_ID from env.
 *
 * The canonical Place ID (matching the g.page review link) is:
 *   ChIJzUlZ6tl1DAMRgESb9fQrHYw
 *
 * An older ID (ChIJcw6BIkQL9YgRi2XERn80DPg / ...Blk...) points to a
 * different listing at the same address that has no reviews.
 * Migrate to the correct ID in .env / Vercel when possible.
 */

const STALE_IDS = [
  'ChIJcw6BIkQL9YgRi2XERn80DPg',
  'ChIJcw6BlkQL9YgRi2XERn80DPg',
];
const CANONICAL_PLACE_ID = 'ChIJzUlZ6tl1DAMRgESb9fQrHYw';

export function resolveGooglePlaceIdFromEnv() {
  const raw = import.meta.env.VITE_GOOGLE_PLACE_ID;
  if (STALE_IDS.includes(raw)) {
    console.warn(
      `[Google] Place ID ${raw} is a stale listing. Using canonical ID ${CANONICAL_PLACE_ID}. Update VITE_GOOGLE_PLACE_ID in .env / Vercel.`
    );
    return CANONICAL_PLACE_ID;
  }
  return raw;
}
