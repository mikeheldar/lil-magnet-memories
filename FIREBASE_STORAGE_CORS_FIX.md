# Firebase Storage CORS Fix

## 🚨 Current Issue

Images from Firebase Storage are not loading due to CORS policy:

```
Access to image at 'https://firebasestorage.googleapis.com/...' from origin 'https://lil-magnet-memories.vercel.app' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔧 Solution: Configure Firebase Storage CORS

### Step 1: Create CORS Configuration File

Create a file called `cors.json` in the project root:

```json
[
  {
    "origin": [
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
```

### Step 2: Apply CORS Configuration

Run this command to apply the CORS configuration:

```bash
gsutil cors set cors.json gs://lil-magnet-memories.appspot.com
```

### Step 3: Alternative Solution - Use Firebase Storage Rules

If the above doesn't work, update Firebase Storage rules in the Firebase Console:

1. Go to: https://console.firebase.google.com/project/lil-magnet-memories/storage
2. Click on "Rules" tab
3. Update the rules to:

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

### Step 4: Verify Configuration

After applying the CORS configuration, test by:

1. Going to the OrderList page
2. Checking if images load properly
3. Looking for CORS errors in the browser console

## 🔍 Troubleshooting

### If gsutil command fails:

- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Authenticate: `gcloud auth login`
- Set project: `gcloud config set project lil-magnet-memories`

### If images still don't load:

- Check Firebase Storage bucket name
- Verify the CORS configuration is applied
- Try clearing browser cache
- Check if the images exist in Firebase Storage

## 📝 Notes

- CORS configuration affects all requests to Firebase Storage
- The configuration allows GET and HEAD requests from the Vercel domain
- This is a one-time setup that applies to all future uploads
