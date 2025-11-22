# Quick Guide: Grant Firestore Permissions

The service account needs permissions. Here's the fastest way:

## Option 1: Google Cloud Console (2 minutes)

1. **Click this link**: https://console.cloud.google.com/iam-admin/iam?project=lil-magnet-memories

2. **Find**: `firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com`

3. **Click the pencil icon** (✏️) on the right

4. **Click "ADD ANOTHER ROLE"**

5. **Type**: `datastore.user` or search for "Cloud Datastore User"

6. **Select**: "Cloud Datastore User"

7. **Click "SAVE"**

8. **Wait 30 seconds** for permissions to propagate

9. **Test**: Run `node scripts/test-firestore-simple.js`

## Option 2: gcloud CLI (if you're authenticated with your personal account)

```bash
# Make sure you're authenticated with your personal account
gcloud auth login

# Grant the role
gcloud projects add-iam-policy-binding lil-magnet-memories \
  --member="serviceAccount:firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## Verify It Worked

After granting permissions, run:
```bash
node scripts/test-firestore-simple.js
```

You should see ✅ instead of ❌ for all tests.

