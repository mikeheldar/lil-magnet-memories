# Firestore Access Test Results

## Current Status

The service account `firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com` is getting **NOT_FOUND (code 5)** errors when trying to access Firestore.

## What This Means

The NOT_FOUND error typically means one of:
1. **Missing IAM Permissions** - Service account lacks "Cloud Datastore User" role
2. **Firestore API Not Enabled** - Firestore Admin API might not be enabled
3. **Database Location Issue** - Database might be in a different region

## Since You Can See Firestore in Console

Since you can see and access Firestore in the Firebase Console, the database definitely exists. The issue is **permissions for the service account**.

## Fix: Grant Permissions to Service Account

### Option 1: Via Google Cloud Console (Recommended)

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=lil-magnet-memories

2. **Find the service account**: `firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com`

3. **Click the pencil icon** (Edit) next to it

4. **Add Role**: Click "ADD ANOTHER ROLE"

5. **Select**: "Cloud Datastore User" (or "Firestore Service Agent")

6. **Click "SAVE"**

### Option 2: Via gcloud CLI

```bash
gcloud projects add-iam-policy-binding lil-magnet-memories \
  --member="serviceAccount:firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

### Option 3: Create New Service Account (As Per SERVICE_ACCOUNT_SETUP.md)

Follow the guide in `SERVICE_ACCOUNT_SETUP.md` to create a new service account with proper permissions from the start.

## Test After Fixing Permissions

Run the test script again:
```bash
node scripts/test-firestore-simple.js
```

You should see:
- ✅ Document reads working
- ✅ Collection listing working
- ✅ Write operations working

## Alternative: Test via Firebase Console

Since you can access Firestore in the console, you can verify access by:

1. **Go to**: https://console.firebase.google.com/project/lil-magnet-memories/firestore/data

2. **Try these operations**:
   - Read `admin_config/admin_emails` - Should work
   - Read `user_roles/roles_config` - Should work (if it exists)
   - List collections - Should show all collections

3. **If console works but Admin SDK doesn't**, it confirms it's a service account permissions issue.

## What the Test Scripts Do

### `test-firestore-simple.js`
- Tests reading specific documents
- Tests listing collections
- Tests writing documents
- Provides detailed error messages

### `test-firestore-access.js`
- Comprehensive test suite
- Tests all collections
- Tests read/write/query operations
- Tests permissions

## Next Steps

1. **Grant "Cloud Datastore User" role** to the service account
2. **Re-run the test script**
3. **If still failing**, check if Firestore Admin API is enabled:
   - https://console.cloud.google.com/apis/library/datastore.googleapis.com?project=lil-magnet-memories

