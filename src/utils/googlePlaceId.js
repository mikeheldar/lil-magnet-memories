/**
 * Normalize VITE_GOOGLE_PLACE_ID. Uppercase "I" and lowercase "l" are often confused when copying.
 */

const PLACE_ID_TYPO_I_FOR_L = 'ChIJcw6BIkQL9YgRi2XERn80DPg';
const PLACE_ID_CORRECTED = 'ChIJcw6BlkQL9YgRi2XERn80DPg';

export function resolveGooglePlaceIdFromEnv() {
  const raw = import.meta.env.VITE_GOOGLE_PLACE_ID;
  if (raw === PLACE_ID_TYPO_I_FOR_L) {
    console.warn(
      "[Google] Place ID uses capital I where Google's finder shows lowercase L (...Blk... not ...BIk...). Using corrected ID. Update VITE_GOOGLE_PLACE_ID in .env / Vercel."
    );
    return PLACE_ID_CORRECTED;
  }
  return raw;
}
