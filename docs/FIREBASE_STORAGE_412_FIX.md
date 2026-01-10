# Firebase Storage 412 Precondition Failed - Setup Fix Guide

## Problem
Getting `412 Precondition Failed` errors when uploading photos to Firebase Storage. This was working fine a week ago, suggesting a configuration change.

## Common Causes (Since It Was Working Before)

### 1. **CORS Configuration Reset** ⚠️ MOST LIKELY
Firebase Storage CORS can be reset or changed. This is the #1 cause of 412 errors.

**Check CORS:**
```bash
# For test bucket
gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app

# For production bucket  
gsutil cors get gs://lil-magnet-memories.firebasestorage.app
```

**Fix CORS:**
```bash
# Apply CORS configuration
gsutil cors set cors.json gs://lil-magnet-memories-test.firebasestorage.app
gsutil cors set cors.json gs://lil-magnet-memories.firebasestorage.app
```

**Verify in Firebase Console:**
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/storage
2. Click on your bucket
3. Go to "Configuration" tab
4. Scroll to "Cross-origin resource sharing (CORS)"
5. Verify CORS is configured correctly

### 2. **Firebase Storage Rules Changed**
Check if Storage rules were modified in Firebase Console.

**Check Rules:**
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/storage/rules
2. Verify rules allow write access
3. Current rules should be:
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

**Deploy Rules:**
```bash
firebase deploy --only storage
```

### 3. **Bucket Settings Changed**
Check if bucket settings were modified:
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/storage
2. Click on bucket → "Configuration" tab
3. Check:
   - **Location**: Should be set correctly
   - **Storage class**: Should be STANDARD
   - **Lifecycle rules**: Should not delete files too quickly
   - **Retention policy**: Should not be blocking uploads

### 4. **Authentication Token Issues**
The 412 error can occur if auth tokens are expiring during upload.

**Check Auth:**
- Verify anonymous auth is working
- Check if there are any auth restrictions in Firebase Console
- Try refreshing the auth token before upload

### 5. **Firebase SDK Version**
Check if Firebase SDK was updated recently:
```bash
npm list firebase
```

If version changed, this could cause compatibility issues.

### 6. **Bucket Permissions**
Verify bucket IAM permissions:
1. Go to: https://console.cloud.google.com/storage/browser?project=lil-magnet-memories-test
2. Click on bucket → "Permissions" tab
3. Verify Firebase service accounts have proper access

## Quick Fix Steps

### Step 1: Re-apply CORS (Most Common Fix)
```bash
# Make sure you're in the project directory
cd /path/to/lil-magnet-memories

# Set the correct project
gcloud config set project lil-magnet-memories-test

# Apply CORS to test bucket
gsutil cors set cors.json gs://lil-magnet-memories-test.firebasestorage.app

# Verify CORS was applied
gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app
```

### Step 2: Verify Storage Rules
```bash
# Deploy storage rules
firebase deploy --only storage
```

### Step 3: Check Firebase Console Settings
1. Go to Firebase Console → Storage
2. Verify bucket exists and is accessible
3. Check for any warnings or errors
4. Verify CORS configuration is present

### Step 4: Test Upload
After applying fixes, wait 1-2 minutes for changes to propagate, then test upload again.

## Diagnostic Commands

### Check Current CORS
```bash
# Test bucket
gsutil cors get gs://lil-magnet-memories-test.firebasestorage.app

# Production bucket
gsutil cors get gs://lil-magnet-memories.firebasestorage.app
```

### Check Bucket Exists
```bash
gsutil ls -b gs://lil-magnet-memories-test.firebasestorage.app
```

### Check Storage Rules
```bash
firebase storage:rules:get
```

## What Changed in Code

The code now uses `uploadBytes` (non-resumable) for files under 5MB to avoid 412 errors. This should help, but if the issue persists, it's likely a Firebase configuration problem.

## Still Not Working?

1. **Check Firebase Status**: https://status.firebase.google.com/
2. **Check Browser Console**: Look for additional error details
3. **Try Different Browser**: Rule out browser-specific issues
4. **Check Network Tab**: Look at the actual HTTP request/response
5. **Contact Firebase Support**: If it's a Firebase-side issue

## Prevention

- Document any Firebase Console changes
- Version control Firebase Storage rules
- Regularly verify CORS configuration
- Monitor Firebase status page for outages
