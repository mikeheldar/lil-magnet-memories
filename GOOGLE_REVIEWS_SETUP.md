# Google Reviews Integration Setup

## Step 1: Get Your Google Review URL

### Method 1: From Google Business Profile (Easiest - RECOMMENDED)
1. Log into [Google Business Profile](https://business.google.com/)
2. Select "Li'l Magnet Memories"
3. Click **"Get more reviews"** in the left menu
4. Click **"Share review form"**
5. Copy the short URL (format: `https://g.page/r/XXXXX/review`)

**Example:** `https://g.page/r/CYtlxEZ_NAz4EBM/review`

✅ **This is the recommended approach** - it's shorter, cleaner, and officially recommended by Google.

### Method 2: Use Place ID (Alternative)
1. Go to: https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder
2. Search for "Li'l Magnet Memories"
3. Click on your business
4. Copy the Place ID (format: `ChIJ...`)

## Step 2: Add Review URL to Environment Variables

### Option A: Using Short URL (Recommended)
Add to `.env` (production):
```bash
VITE_GOOGLE_REVIEW_URL=https://g.page/r/CYtlxEZ_NAz4EBM/review
```

### Option B: Using Place ID (Alternative)
Add to `.env` (production):
```bash
VITE_GOOGLE_PLACE_ID=ChIJxxxxxxxxxxxxxx
```

You can use either option - the code will prefer `VITE_GOOGLE_REVIEW_URL` if both are set.

## Step 3: Add to Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - Variable: `VITE_GOOGLE_REVIEW_URL`
   - Value: `https://g.page/r/CYtlxEZ_NAz4EBM/review`
   - Environment: Production, Preview, Development

## Step 4: Test Your Review Link

Your review link: `https://g.page/r/CYtlxEZ_NAz4EBM/review`

Test it to ensure:
- ✅ Opens Google's review interface directly
- ✅ Shows "Li'l Magnet Memories" as business name
- ✅ Allows customers to rate and review
- ✅ No search or sign-in required to see the form

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
