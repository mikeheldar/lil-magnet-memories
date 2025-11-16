# Test Firebase Project Setup Guide

This guide will help you set up the `lil-magnet-memories-test` Firebase project that you've already created.

## ✅ What You've Already Done
- Created Firebase project: `lil-magnet-memories-test`
- Set environment variables in Vercel

## 📋 What We Need to Set Up

### 1. Enable Firestore Database

1. **Go to Firebase Console**: https://console.firebase.google.com/project/lil-magnet-memories-test
2. **Click "Firestore Database"** in the left sidebar
3. **Click "Create database"** (if not already created)
4. **Choose mode**: Start in **test mode** (for now - we'll set rules next)
5. **Choose location**: `us-central1` (same as production)
6. **Click "Enable"**

### 2. Set Firestore Rules

1. **Go to Firestore Database** → **Rules** tab
2. **Paste these rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection - allow read/write for now (test environment)
    match /orders/{document=**} {
      allow read, write: if true;
    }
    
    // Products collection
    match /products/{document=**} {
      allow read, write: if true;
    }
    
    // Market events collection
    match /marketEvents/{document=**} {
      allow read, write: if true;
    }
    
    // Settings collection (for admin config, shipping options, etc.)
    match /settings/{document=**} {
      allow read, write: if true;
    }
    
    // Admin config collection
    match /adminConfig/{document=**} {
      allow read: if true;
      allow write: if false; // Only admins can write, but we'll allow reads for now
    }
  }
}
```

3. **Click "Publish"**

### 3. Enable Storage

1. **Go to "Storage"** in the left sidebar
2. **Click "Get started"** (if not already enabled)
3. **Choose mode**: Start in **test mode** (for now)
4. **Choose location**: `us-central1` (same as production)
5. **Click "Done"**

### 4. Set Storage Rules

1. **Go to Storage** → **Rules** tab
2. **Paste these rules**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. **Click "Publish"**

### 5. Enable Anonymous Authentication

1. **Go to "Authentication"** in the left sidebar
2. **Click "Get started"** (if not already enabled)
3. **Click "Sign-in method"** tab
4. **Find "Anonymous"** in the list
5. **Click on "Anonymous"**
6. **Toggle "Enable"** to ON
7. **Click "Save"**

### 6. Enable Google Authentication

1. **Still in Authentication** → **Sign-in method**
2. **Click on "Google"**
3. **Toggle "Enable"** to ON
4. **Add authorized domains**:
   - `test.lilmagnetmemories.com`
   - `localhost` (for local testing)
5. **Click "Save"**

### 7. Configure CORS for Test Storage Bucket

The test storage bucket is: `lil-magnet-memories-test.firebasestorage.app`

**Option A: Using Google Cloud Shell (Recommended)**

1. **Open Cloud Shell** in Google Cloud Console: https://console.cloud.google.com/
2. **Make sure you're in the test project**: 
   ```bash
   gcloud config set project lil-magnet-memories-test
   ```
3. **Create CORS config file**:
   ```bash
   cat > cors.json <<'EOF'
   [
     {
       "origin": [
         "https://test.lilmagnetmemories.com",
         "https://www.lilmagnetmemories.com",
         "https://lilmagnetmemories.com",
         "https://lil-magnet-memories.vercel.app",
         "http://localhost:9000"
       ],
       "method": ["GET", "HEAD", "POST", "PUT", "OPTIONS"],
       "responseHeader": [
         "Content-Type",
         "X-Goog-Upload-Protocol",
         "X-Goog-Upload-Command",
         "X-Goog-Upload-Header-Content-Length",
         "X-Goog-Upload-Header-Content-Type",
         "X-Goog-Upload-Offset",
         "Authorization"
       ],
       "maxAgeSeconds": 3600
     }
   ]
   EOF
   ```
4. **Apply CORS to test bucket**:
   ```bash
   gsutil cors set cors.json gs://lil-magnet-memories-test.firebasestorage.app
   ```
5. **Verify CORS is set**:
   ```bash
   gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app
   ```

**Option B: Using Google Cloud Console**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/storage/browser?project=lil-magnet-memories-test
2. **Click on the bucket**: `lil-magnet-memories-test.firebasestorage.app`
3. **Click "Configuration" tab**
4. **Scroll down to "Cross-origin resource sharing (CORS)"**
5. **Click "Edit"** (or "Add CORS configuration")
6. **Paste the JSON** from Option A above
7. **Click "Save"**

### 8. Create Initial Admin Config (Optional)

If you want to set up admin emails in Firestore:

1. **Go to Firestore Database** → **Data** tab
2. **Click "Start collection"**
3. **Collection ID**: `adminConfig`
4. **Document ID**: `config`
5. **Add field**:
   - **Field**: `adminEmails`
   - **Type**: `array`
   - **Value**: Add your test admin emails (e.g., `["michael.helmandarley@gmail.com"]`)
6. **Click "Save"**

## ✅ Verification Checklist

After setup, verify:

- [ ] Firestore database created and rules published
- [ ] Storage enabled and rules published
- [ ] Anonymous authentication enabled
- [ ] Google authentication enabled with test domain authorized
- [ ] CORS configured on test storage bucket
- [ ] Test environment variables set in Vercel match Firebase config

## 🧪 Test It

1. **Redeploy test environment** in Vercel (or wait for auto-deploy)
2. **Visit**: `https://test.lilmagnetmemories.com`
3. **Try uploading a photo** - it should work now!
4. **Check browser console** - should see no CORS errors
5. **Check Firestore** - order should appear in `orders` collection
6. **Check Storage** - photo should appear in `orders/` folder

## 🆘 Troubleshooting

**"Client is offline" error:**
- Make sure Firestore database is created and enabled
- Check Firestore rules allow writes

**CORS errors:**
- Verify CORS is applied: `gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app`
- Make sure test domain is in CORS origins
- Wait 1-2 minutes after applying CORS

**Upload timeouts:**
- Check Storage rules allow writes
- Verify anonymous auth is enabled
- Check browser console for specific errors

