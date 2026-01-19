/**
 * Google Reviews Utility
 * Handles Google Business review links and integration
 */

/**
 * Get the Google review URL for Li'l Magnet Memories
 * @returns {string} The Google review link
 */
export const getGoogleReviewUrl = () => {
  // Priority 1: Use Google's short review URL (recommended by Google Business Profile)
  const shortUrl = import.meta.env.VITE_GOOGLE_REVIEW_URL;
  if (shortUrl) {
    return shortUrl;
  }
  
  // Priority 2: Construct from Place ID
  const placeId = import.meta.env.VITE_GOOGLE_PLACE_ID;
  if (placeId) {
    return `https://search.google.com/local/writereview?placeid=${placeId}`;
  }
  
  // Fallback: Search page (when nothing is configured)
  console.warn('VITE_GOOGLE_REVIEW_URL or VITE_GOOGLE_PLACE_ID not set in environment variables');
  return 'https://www.google.com/search?q=Li%27l+Magnet+Memories';
};

/**
 * Get the Google Business profile URL
 * @returns {string} The Google Business profile link
 */
export const getGoogleBusinessUrl = () => {
  const placeId = import.meta.env.VITE_GOOGLE_PLACE_ID;
  
  if (!placeId) {
    return 'https://www.google.com/search?q=Li%27l+Magnet+Memories';
  }
  
  // This opens the business profile with all reviews
  return `https://search.google.com/local/reviews?placeid=${placeId}`;
};

/**
 * Check if Google review URL is configured
 * @returns {boolean} True if review URL or Place ID is set
 */
export const isGoogleReviewConfigured = () => {
  return !!(import.meta.env.VITE_GOOGLE_REVIEW_URL || import.meta.env.VITE_GOOGLE_PLACE_ID);
};

/**
 * Track Google review click (for analytics)
 * @param {string} source - Where the click originated (e.g., 'thank-you-page', 'review-page')
 */
export const trackGoogleReviewClick = (source = 'unknown') => {
  console.log(`Google review link clicked from: ${source}`);
  // TODO: Add your analytics tracking here (Google Analytics, etc.)
  // Example: gtag('event', 'google_review_click', { source });
};
