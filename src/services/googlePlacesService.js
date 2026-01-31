/**
 * Google Places API Service
 * Fetches business reviews from Google Places API
 */

// Get the appropriate API key based on environment
const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY_TEST || import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
const PLACE_ID = import.meta.env.VITE_GOOGLE_PLACE_ID;

export const googlePlacesService = {
  /**
   * Fetch reviews for Li'l Magnet Memories from Google
   * @returns {Promise<Array>} Array of formatted reviews
   */
  async fetchReviews() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 [Google Reviews] Starting fetch...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!PLACE_ID) {
      console.error('❌ [Google Reviews] VITE_GOOGLE_PLACE_ID not set in environment');
      console.log('   Check your .env file and Vercel environment variables');
      return [];
    }
    console.log('✅ [Google Reviews] Place ID found:', PLACE_ID);

    try {
      // Use Vercel Serverless Function as backend proxy (solves CORS issue)
      const apiUrl = `/api/google-reviews?placeId=${PLACE_ID}`;
      
      console.log('📡 [Google Reviews] Using Vercel Serverless Function');
      console.log('   Endpoint:', apiUrl);
      console.log('   This solves CORS issues by calling Google API from backend');
      
      console.log('⏳ [Google Reviews] Sending request to backend proxy...');
      const response = await fetch(apiUrl);

      console.log('📥 [Google Reviews] Response received');
      console.log('   Status:', response.status, response.statusText);
      console.log('   OK:', response.ok);
      console.log('   Headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [Google Reviews] HTTP Error Response:');
        console.error('   Status:', response.status);
        console.error('   Status Text:', response.statusText);
        console.error('   Body:', errorText.substring(0, 500));
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 [Google Reviews] Response data:', JSON.stringify(data, null, 2));
      
      if (data.status !== 'OK') {
        console.error('❌ [Google Reviews] API Error:');
        console.error('   Status:', data.status);
        console.error('   Error Message:', data.error_message);
        console.error('   Full Response:', data);
        return [];
      }

      const reviews = data.result?.reviews || [];
      console.log(`✅ [Google Reviews] Successfully fetched ${reviews.length} reviews`);
      
      if (reviews.length > 0) {
        console.log('📝 [Google Reviews] Sample review:');
        console.log('   Author:', reviews[0].author_name);
        console.log('   Rating:', reviews[0].rating);
        console.log('   Text:', reviews[0].text?.substring(0, 100) + '...');
      } else {
        console.warn('⚠️  [Google Reviews] No reviews found in API response');
        console.log('   This could mean:');
        console.log('   1. Your business has no reviews yet');
        console.log('   2. Wrong Place ID');
        console.log('   3. Reviews not public');
      }
      
      const formatted = this.formatReviews(reviews);
      console.log(`✅ [Google Reviews] Formatted ${formatted.length} reviews for display`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return formatted;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ [Google Reviews] FETCH FAILED');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('   Error Type:', error.name);
      console.error('   Error Message:', error.message);
      console.error('   Error Stack:', error.stack);
      console.error('   Possible causes:');
      console.error('   1. CORS proxy is down/blocked');
      console.error('   2. Network connectivity issue');
      console.error('   3. Invalid API key or Place ID');
      console.error('   4. API quota exceeded');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return [];
    }
  },

  /**
   * Format Google reviews for display
   * @param {Array} reviews - Raw reviews from Google API
   * @returns {Array} Formatted reviews
   */
  formatReviews(reviews) {
    console.log(`🔄 [Google Reviews] Formatting ${reviews.length} reviews...`);
    
    const formatted = reviews.map((review, index) => {
      const formatted = {
        id: `google-${review.time}`,
        author: review.author_name || 'Anonymous',
        authorPhoto: review.profile_photo_url || null,
        rating: review.rating || 5,
        text: review.text || '',
        date: new Date(review.time * 1000), // Convert Unix timestamp
        relativeTime: review.relative_time_description || '',
        source: 'google',
        verified: true, // Google reviews are inherently verified
      };
      
      if (index === 0) {
        console.log('   Sample formatted review:', formatted);
      }
      
      return formatted;
    });
    
    console.log(`✅ [Google Reviews] Formatting complete`);
    return formatted;
  },

  /**
   * Get cached reviews from localStorage
   * @returns {Array|null} Cached reviews or null if expired/not found
   */
  getCachedReviews() {
    try {
      console.log('💾 [Google Reviews Cache] Checking localStorage...');
      const cached = localStorage.getItem('google_reviews_cache');
      
      if (!cached) {
        console.log('   No cache found');
        return null;
      }

      const { reviews, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      const ageMinutes = Math.floor(age / 60000);
      
      console.log(`   Cache found: ${reviews.length} reviews`);
      console.log(`   Cache age: ${ageMinutes} minutes`);
      
      // Cache for 1 hour (3600000 ms)
      if (age < 3600000) {
        console.log(`✅ [Google Reviews Cache] Using cached reviews (${ageMinutes}m old)`);
        return reviews;
      }
      
      console.log(`⏰ [Google Reviews Cache] Cache expired (${ageMinutes}m > 60m)`);
      return null;
    } catch (error) {
      console.error('❌ [Google Reviews Cache] Error reading cache:', error);
      return null;
    }
  },

  /**
   * Cache reviews in localStorage
   * @param {Array} reviews - Reviews to cache
   */
  setCachedReviews(reviews) {
    try {
      const cacheData = {
        reviews,
        timestamp: Date.now(),
      };
      localStorage.setItem('google_reviews_cache', JSON.stringify(cacheData));
      console.log(`✅ [Google Reviews Cache] Cached ${reviews.length} reviews`);
      console.log(`   Cache will expire in 60 minutes`);
    } catch (error) {
      console.error('❌ [Google Reviews Cache] Error saving cache:', error);
      console.error('   Error:', error.message);
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
