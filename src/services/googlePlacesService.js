/**
 * Google Places API Service
 * Fetches business reviews from Google Places API
 */

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID;

export const googlePlacesService = {
  /**
   * Fetch reviews for Li'l Magnet Memories from Google
   * @returns {Promise<Array>} Array of formatted reviews
   */
  async fetchReviews() {
    if (!API_KEY) {
      console.warn('⚠️ VITE_GOOGLE_PLACES_API_KEY not set');
      return [];
    }

    if (!PLACE_ID) {
      console.warn('⚠️ VITE_GOOGLE_PLACE_ID not set');
      return [];
    }

    try {
      console.log('🔍 Fetching Google reviews...');
      
      // Using Places API (legacy) - more widely supported
      const fields = 'name,rating,user_ratings_total,reviews';
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=${fields}&key=${API_KEY}`;
      
      // Note: Direct API calls from browser will fail due to CORS
      // This needs to be proxied through a backend endpoint or use Places API client library
      // For now, using a CORS proxy for demonstration
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
      
      const response = await fetch(proxyUrl, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error('❌ Google Places API error:', data.status, data.error_message);
        return [];
      }

      const reviews = data.result?.reviews || [];
      console.log(`✅ Fetched ${reviews.length} Google reviews`);
      
      return this.formatReviews(reviews);
    } catch (error) {
      console.error('❌ Error fetching Google reviews:', error);
      return [];
    }
  },

  /**
   * Format Google reviews for display
   * @param {Array} reviews - Raw reviews from Google API
   * @returns {Array} Formatted reviews
   */
  formatReviews(reviews) {
    return reviews.map((review) => ({
      id: `google-${review.time}`,
      author: review.author_name || 'Anonymous',
      authorPhoto: review.profile_photo_url || null,
      rating: review.rating || 5,
      text: review.text || '',
      date: new Date(review.time * 1000), // Convert Unix timestamp
      relativeTime: review.relative_time_description || '',
      source: 'google',
      verified: true, // Google reviews are inherently verified
    }));
  },

  /**
   * Get cached reviews from localStorage
   * @returns {Array|null} Cached reviews or null if expired/not found
   */
  getCachedReviews() {
    try {
      const cached = localStorage.getItem('google_reviews_cache');
      if (!cached) return null;

      const { reviews, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      // Cache for 1 hour (3600000 ms)
      if (age < 3600000) {
        console.log('✅ Using cached Google reviews');
        return reviews;
      }
      
      console.log('⏰ Google reviews cache expired');
      return null;
    } catch (error) {
      console.error('❌ Error reading cached reviews:', error);
      return null;
    }
  },

  /**
   * Cache reviews in localStorage
   * @param {Array} reviews - Reviews to cache
   */
  setCachedReviews(reviews) {
    try {
      localStorage.setItem('google_reviews_cache', JSON.stringify({
        reviews,
        timestamp: Date.now(),
      }));
      console.log('✅ Cached Google reviews');
    } catch (error) {
      console.error('❌ Error caching reviews:', error);
    }
  },

  /**
   * Get business rating summary
   * @returns {Promise<Object>} Rating summary
   */
  async getRatingSummary() {
    // This would be fetched alongside reviews
    // For now, calculate from reviews
    return {
      averageRating: 0,
      totalReviews: 0,
    };
  },
};
