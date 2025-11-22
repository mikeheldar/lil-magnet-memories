# Add Cloud Datastore User Role to Production

Even though test works without this role, production needs it explicitly.

## Quick Fix via Google Cloud Console

1. **Go to IAM page**: https://console.cloud.google.com/iam-admin/iam?project=lil-magnet-memories

2. **Find the service account**: `firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com`

3. **Click the pencil icon** (✏️) on the right

4. **Click "ADD ANOTHER ROLE"**

5. **Type or search**: `datastore.user`

6. **Select**: "Cloud Datastore User" (roles/datastore.user)

7. **Click "SAVE"**

8. **Wait 2-3 minutes** for permissions to propagate

9. **Test**: Run `node scripts/test-direct-write.js prod`

## Alternative: Using gcloud CLI

```bash
# Make sure you're authenticated
gcloud auth login

# Grant the role
gcloud projects add-iam-policy-binding lil-magnet-memories \
  --member="serviceAccount:firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com" \
  --role="roles/datastore.user"
```

## Why This Might Be Needed

Even though:
- ✅ Test works without this role
- ✅ Both have the same roles
- ✅ Firestore Admin API is enabled
- ✅ Database exists and has data

Production might have:
- Different project-level permissions
- Different database configuration
- Different region/location settings
- Permissions that need explicit grant

Adding this role explicitly should resolve the `NOT_FOUND` errors.

