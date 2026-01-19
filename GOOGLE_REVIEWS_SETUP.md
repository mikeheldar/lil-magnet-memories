# Google Reviews Integration Setup

## Step 1: Get Your Google Place ID

### Method 1: From Google Business Profile (Easiest)
1. Log into [Google Business Profile](https://business.google.com/)
2. Select "Li'l Magnet Memories"
3. Click "Get more reviews"
4. Copy the "Share review form" link
5. Extract the Place ID from the URL (format: `ChIJ...`)

### Method 2: Use Place ID Finder Tool
1. Go to: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
2. Search for "Li'l Magnet Memories"
3. Click on your business
4. Copy the Place ID

### Method 3: From Google Search
1. Google search "Li'l Magnet Memories"
2. Click on your business listing
3. Scroll to reviews → Click "Write a review"
4. Copy the URL - extract Place ID from the URL parameter

## Step 2: Add Place ID to Environment Variables

Add to `.env` (production):
```bash
VITE_GOOGLE_PLACE_ID=ChIJxxxxxxxxxxxxxx
```

Add to `.env.test` (if you have a test location):
```bash
VITE_GOOGLE_PLACE_ID_TEST=ChIJxxxxxxxxxxxxxx
```

## Step 3: Add to Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - Variable: `VITE_GOOGLE_PLACE_ID`
   - Value: Your Place ID (ChIJ...)
   - Environment: Production, Preview, Development

## Step 4: Test Your Review Link

Your review link will be:
```
https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID
```

Test it to ensure:
- ✅ Opens Google's review interface
- ✅ Shows "Li'l Magnet Memories" as business name
- ✅ Allows customers to rate and review
- ✅ No search required

## Features Implemented

1. **CustomerReviewPage** (`/leave-review`)
   - Prominent Google review button at top
   - Secondary option for website testimonials
   - Clear labeling of each option

2. **ThankYouPage** (post-order)
   - Google review prompt after successful order
   - Encourages customers to share experience

3. **Utility Helper**
   - `src/utils/googleReviews.js`
   - Centralized review URL management
   - Easy to update Place ID in one location

## Benefits

- ✅ Increases Google review volume (helps SEO & local discovery)
- ✅ Builds trust with potential customers
- ✅ Maintains separate website testimonials for marketing
- ✅ Simple one-click experience for customers
- ✅ Legitimate per Google's TOS

## Important Notes

- ❌ Do NOT try to automatically sync reviews to Google (against TOS)
- ✅ DO make it easy for customers to leave Google reviews
- ✅ DO keep both Google and site reviews clearly labeled
- ❌ Do NOT incentivize only positive reviews
