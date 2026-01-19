# Google Reviews Display Integration - Setup Guide

## ✅ What's Been Implemented

### 1. **Review Tabs on Landing Page**
- Two tabs: "Customer Stories" (internal) and "Google Reviews"
- Seamless switching between review sources
- Both tabs visible on main landing page

### 2. **Google Places API Service** (`src/services/googlePlacesService.js`)
- Fetches reviews from Google Places API
- Caches reviews for 1 hour in localStorage
- Formats reviews for display
- Error handling and fallbacks

### 3. **UI Components**
- Google review cards with:
  - Author name and photo
  - Star rating (amber colored for Google)
  - Review text (truncated to 4 lines)
  - Relative time ("2 weeks ago")
  - Google attribution badge
- "Leave Google Review" call-to-action card
- Loading states and empty states

### 4. **Environment Variables**
Added to `.env` (need to add to Vercel):
- `VITE_GOOGLE_PLACES_API_KEY` - For fetching reviews
- `VITE_GOOGLE_PLACE_ID` - Your business Place ID

## ⚠️ IMPORTANT: CORS Issue & Solution

### The Problem
Google Places API **cannot be called directly from a browser** due to CORS (Cross-Origin Resource Sharing) restrictions. The current implementation uses a CORS proxy which is:
- ❌ Not reliable for production
- ❌ Has rate limits
- ❌ May go offline

### The Solution: Backend Proxy

You need to create a backend endpoint to proxy the Google Places API calls. Here are your options:

#### **Option A: Cloudflare Worker** (Recommended - Free)

1. Create a Cloudflare Worker at `https://workers.cloudflare.com/`
2. Use this code:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const placeId = url.searchParams.get('placeId');
    const apiKey = 'YOUR_GOOGLE_PLACES_API_KEY'; // Store securely
    
    const googleUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;
    
    const response = await fetch(googleUrl);
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Restrict to your domain in production
      },
    });
  },
};
```

3. Deploy worker and get URL (e.g., `https://your-worker.workers.dev`)
4. Update `googlePlacesService.js` to use your worker URL instead of CORS proxy

#### **Option B: Vercel Serverless Function**

1. Create `/api/google-reviews.js`:

```javascript
export default async function handler(req, res) {
  const { placeId } = req.query;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  res.status(200).json(data);
}
```

2. Call from frontend: `fetch('/api/google-reviews?placeId=...')`

#### **Option C: Firebase Cloud Function**

If you're already using Firebase:

```javascript
const functions = require('firebase-functions');
const fetch = require('node-fetch');

exports.getGoogleReviews = functions.https.onRequest(async (req, res) => {
  const { placeId } = req.query;
  const apiKey = functions.config().google.places_api_key;
  
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  res.json(data);
});
```

## 📋 Next Steps

### 1. Get Google Place ID
```bash
# Already in your .env file:
VITE_GOOGLE_PLACE_ID=ChIJt1xEZ_NAz4EBM
```

### 2. Set Up Backend Proxy (Choose one option above)
- Cloudflare Worker (easiest, free)
- Vercel Serverless Function
- Firebase Cloud Function

### 3. Update `googlePlacesService.js`

Replace the fetch URL (line ~33):
```javascript
// OLD (uses unreliable CORS proxy):
const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;

// NEW (use your backend):
const proxyUrl = `https://your-worker.workers.dev?placeId=${PLACE_ID}`;
// OR
const proxyUrl = `/api/google-reviews?placeId=${PLACE_ID}`;
```

### 4. Add to Vercel Environment Variables

Add these in Vercel dashboard:
- `VITE_GOOGLE_PLACES_API_KEY` = `AIzaSyDFIwa_pv5vne3-WJDzB0D4JVQBPzkv0IQ`
- `VITE_GOOGLE_PLACE_ID` = `ChIJt1xEZ_NAz4EBM`

**Important**: Consider rotating the API key since it was shared in conversation.

### 5. Test the Integration

1. Deploy to preview/production
2. Visit landing page
3. Click "Google Reviews" tab
4. Should see:
   - Loading spinner
   - Google reviews (if backend proxy working)
   - OR "No Google reviews yet" with CTA to leave one

## 🎨 Current Features

### What Works Now:
- ✅ Tab navigation between review sources
- ✅ "Leave Google Review" CTAs (opens Google review form)
- ✅ Review caching (1 hour)
- ✅ Proper error handling
- ✅ Loading states
- ✅ Empty states with prompts

### What Needs Backend Proxy:
- ⏳ Actually fetching Google reviews
- ⏳ Displaying real Google reviews on site

## 🔒 Security Best Practices

1. **API Key Restrictions** in Google Cloud Console:
   - HTTP referrers: Your domain only
   - API restrictions: Places API only
   - Usage quotas: Set reasonable limits

2. **Backend Proxy**:
   - Don't expose API key to frontend
   - Rate limit requests
   - Cache responses
   - Restrict CORS to your domain

3. **Consider**:
   - Rotating the API key that was shared
   - Using different keys for dev/prod
   - Setting up usage alerts in Google Cloud

## 📊 Google's Display Requirements

When showing Google reviews, you MUST:
- ✅ Display Google attribution (we have "Google Review" chip)
- ✅ Show reviews unmodified (no editing)
- ✅ Include all reviews (no cherry-picking)
- ✅ Update regularly (our cache: 1 hour)
- ✅ Link to Google Business Profile (we have this)

## 🚀 Quick Start (After Backend Proxy Setup)

```bash
# 1. Choose and deploy backend proxy (see options above)

# 2. Update googlePlacesService.js with your proxy URL

# 3. Add env vars to Vercel

# 4. Test locally:
npm run dev

# 5. Visit: http://localhost:9000
# Click "Google Reviews" tab

# 6. If working, you'll see your Google reviews!
```

## 💡 Tips

- **Free Tier Limits**: Google Places API gives 1000 free requests/month
- **Caching**: With 1-hour cache, even heavy traffic stays under limits
- **Fallback**: If API fails, site still works (shows empty state)
- **Analytics**: Track which tab users prefer (Google vs Internal)

## 🐛 Troubleshooting

### "No Google reviews yet" shows but you have reviews:
1. Check browser console for errors
2. Verify backend proxy is working
3. Test API key in Google Cloud Console
4. Check Place ID is correct

### CORS errors in console:
- Backend proxy not set up yet
- Using the placeholder CORS proxy
- Need to implement one of the backend options above

### API key errors:
- Key not enabled for Places API
- Key restrictions too strict
- Key not added to backend proxy

## 📞 Need Help?

If reviews aren't showing:
1. Check browser console (F12) for errors
2. Verify env variables in Vercel
3. Test backend proxy directly
4. Check Google Cloud Console for API usage/errors

---

**Status**: ✅ Frontend complete, ⏳ Backend proxy needed for production
