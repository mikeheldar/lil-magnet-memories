# Complete CORS Configuration Guide

This guide walks you through checking and configuring CORS for both production and test Firebase Storage buckets.

## 🎯 Current Status

**Production Bucket**: `gs://lil-magnet-memories.firebasestorage.app`
- ✅ CORS is configured correctly
- ✅ All required origins are included

**Test Bucket**: Need to verify (likely `gs://lil-magnet-memories-test.firebasestorage.app` or `gs://lil-magnet-memories-test.appspot.com`)

---

## 📋 Method 1: Using Google Cloud Console (Recommended - Visual)

### Step 1: Access Google Cloud Console

1. **Go to**: https://console.cloud.google.com/
2. **Select your project** from the dropdown at the top:
   - For **Production**: `lil-magnet-memories`
   - For **Test**: `lil-magnet-memories-test` (if it exists)

### Step 2: Navigate to Cloud Storage

1. **Click the hamburger menu** (☰) in the top left
2. **Navigate to**: `Cloud Storage` → `Buckets`
3. **Or go directly**: https://console.cloud.google.com/storage/browser

### Step 3: Find Your Buckets

You should see buckets like:
- `lil-magnet-memories.firebasestorage.app` (Production)
- `lil-magnet-memories-test.firebasestorage.app` (Test - if exists)
- Or `lil-magnet-memories-test.appspot.com` (Test - alternative format)

### Step 4: Check CORS Configuration

1. **Click on the bucket name** (e.g., `lil-magnet-memories.firebasestorage.app`)
2. **Click the "Configuration" tab** at the top
3. **Scroll down to "CORS configuration"** section
4. **Click "Edit CORS configuration"**

### Step 5: View/Edit CORS Settings

You should see a JSON editor with the CORS configuration. The correct configuration should be:

```json
[
  {
    "origin": [
      "https://www.lilmagnetmemories.com",
      "https://lilmagnetmemories.com",
      "https://test.lilmagnetmemories.com",
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
```

### Step 6: Update if Needed

1. **If CORS is missing or incorrect**:
   - Copy the JSON above
   - Paste it into the editor
   - **Click "Save"**

2. **If CORS is empty**:
   - Click "Add CORS configuration"
   - Paste the JSON above
   - **Click "Save"**

---

## 📋 Method 2: Using gsutil (Command Line)

### Step 1: Authenticate (if needed)

```bash
gcloud auth login
```

### Step 2: Set the Project

**For Production:**
```bash
gcloud config set project lil-magnet-memories
```

**For Test:**
```bash
gcloud config set project lil-magnet-memories-test
```

### Step 3: List All Buckets

```bash
gsutil ls
```

You should see:
- `gs://lil-magnet-memories.firebasestorage.app/` (Production)
- `gs://lil-magnet-memories-test.firebasestorage.app/` (Test - if exists)

### Step 4: Check Current CORS Configuration

**Production:**
```bash
gsutil cors get gs://lil-magnet-memories.firebasestorage.app
```

**Test (try both formats):**
```bash
gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app
# OR
gsutil cors get gs://lil-magnet-memories-test.appspot.com
```

### Step 5: Update CORS Configuration

If CORS is missing or incorrect, apply it:

**Production:**
```bash
gsutil cors set cors.json gs://lil-magnet-memories.firebasestorage.app
```

**Test:**
```bash
gsutil cors set cors.json gs://lil-magnet-memories-test.firebasestorage.app
# OR
gsutil cors set cors.json gs://lil-magnet-memories-test.appspot.com
```

### Step 6: Verify the Update

```bash
gsutil cors get gs://[BUCKET_NAME]
```

You should see the JSON configuration printed out.

---

## 🔍 Finding Your Test Bucket Name

If you're not sure what your test bucket name is:

### Option 1: Check Vercel Environment Variables

1. **Go to**: https://vercel.com/dashboard
2. **Select your project**: `lil-magnet-memories`
3. **Go to**: Settings → Environment Variables
4. **Look for**: `VITE_FIREBASE_STORAGE_BUCKET_TEST`
5. **The value** is your test bucket name

### Option 2: Check Firebase Console

1. **Go to**: https://console.firebase.google.com/project/lil-magnet-memories-test/storage
2. **Look at the URL** or the bucket name shown in the Storage page
3. **It will be** either:
   - `lil-magnet-memories-test.firebasestorage.app`
   - `lil-magnet-memories-test.appspot.com`

### Option 3: List All Projects

```bash
gcloud projects list
```

Then switch to the test project and list buckets:
```bash
gcloud config set project lil-magnet-memories-test
gsutil ls
```

---

## ✅ Verification Checklist

After configuring CORS, verify:

- [ ] Production bucket has CORS configured
- [ ] Test bucket has CORS configured (if separate)
- [ ] All required origins are included:
  - `https://www.lilmagnetmemories.com`
  - `https://lilmagnetmemories.com`
  - `https://test.lilmagnetmemories.com`
  - `https://lil-magnet-memories.vercel.app`
  - `http://localhost:9000`
- [ ] All required methods are included: `GET`, `HEAD`, `POST`, `PUT`, `OPTIONS`
- [ ] All required response headers are included
- [ ] `maxAgeSeconds` is set to `3600` (1 hour)

---

## 🐛 Troubleshooting

### "Bucket not found" error

- **Check the bucket name** - it might be `.firebasestorage.app` instead of `.appspot.com`
- **Verify you're in the correct project**: `gcloud config get-value project`
- **Check if the bucket exists**: `gsutil ls`

### "Permission denied" error

- **Authenticate**: `gcloud auth login`
- **Check permissions**: You need "Storage Admin" or "Storage Object Admin" role
- **Verify project access**: `gcloud projects list`

### CORS still not working after configuration

1. **Wait a few minutes** - CORS changes can take 1-2 minutes to propagate
2. **Clear browser cache** - Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. **Check browser console** - Look for specific CORS error messages
4. **Verify the origin** - Make sure your site's origin matches exactly (including `https://` and `www.`)

### Cross-Origin-Opener-Policy (COOP) Error

The error `Cross-Origin-Opener-Policy policy would block the window.close call` is **different from CORS**. This is a browser security feature related to popup windows. It's usually harmless and doesn't affect file uploads.

---

## 📝 Quick Reference: Current CORS File

The `cors.json` file in your project root contains the correct configuration:

```json
[
  {
    "origin": [
      "https://www.lilmagnetmemories.com",
      "https://lilmagnetmemories.com",
      "https://test.lilmagnetmemories.com",
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
```

---

## 🎯 Next Steps

1. **Check production bucket CORS** (already done ✅)
2. **Find and check test bucket CORS**
3. **Update test bucket CORS if needed**
4. **Test file uploads on both environments**
5. **Clear browser cache and verify no CORS errors**

