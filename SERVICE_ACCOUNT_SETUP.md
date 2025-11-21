# Service Account Setup for Firestore Admin Access

This guide will help you create a service account with proper permissions to programmatically manage Firestore collections.

## Step 1: Go to Google Cloud Console

1. **Open**: https://console.cloud.google.com/iam-admin/serviceaccounts?project=lil-magnet-memories
2. **Or navigate**: Google Cloud Console → IAM & Admin → Service Accounts

## Step 2: Create New Service Account

1. **Click "Create Service Account"** (top of the page)
2. **Service account name**: `firestore-admin-script`
3. **Service account ID**: Will auto-fill (e.g., `firestore-admin-script`)
4. **Description**: `Service account for Firestore admin operations via scripts`
5. **Click "Create and Continue"**

## Step 3: Grant Permissions

1. **In "Grant this service account access to project"**:
   - **Role**: Search for and select **"Cloud Datastore User"** or **"Firestore Admin"**
   - For full admin access, select: **"Cloud Datastore User"** (allows read/write)
   - Or for more restricted access: **"Firestore Service Agent"**
   - **Best option**: **"Cloud Datastore User"** - This gives read/write access to Firestore

2. **Click "Continue"**

3. **Optional - Grant users access**: You can skip this or add your email
   - Click "Done"

## Step 4: Create and Download Key

1. **Find your new service account** in the list: `firestore-admin-script@lil-magnet-memories.iam.gserviceaccount.com`

2. **Click on the service account** (the email address)

3. **Go to "Keys" tab** (top of the page)

4. **Click "Add Key"** → **"Create new key"**

5. **Key type**: Select **"JSON"**

6. **Click "Create"**

7. **File will download** - This is your service account key file

## Step 5: Save the Key File

1. **Rename the downloaded file** to: `firestore-admin-service-account.json`

2. **Move it to your project root**:
   ```bash
   mv ~/Downloads/[downloaded-file].json /Users/michaelhelman-darley/projects/lil-magnet-memories/firestore-admin-service-account.json
   ```

3. **Add to .gitignore** (IMPORTANT - don't commit this file!):
   ```bash
   echo "firestore-admin-service-account.json" >> .gitignore
   ```

## Step 6: Update the Script

The script will automatically use the new service account file.

## Alternative: Use Existing Service Account

If you want to use the existing `prod-service-account.json`, you can grant it additional permissions:

1. **Go to**: https://console.cloud.google.com/iam-admin/iam?project=lil-magnet-memories
2. **Find**: `firebase-adminsdk-fbsvc@lil-magnet-memories.iam.gserviceaccount.com`
3. **Click the pencil icon** (Edit)
4. **Add role**: "Cloud Datastore User"
5. **Save**

## Required IAM Roles

For Firestore operations, the service account needs one of these roles:

- **Cloud Datastore User** (Recommended) - Read/write access to Firestore
- **Firestore Admin** - Full admin access (more than needed)
- **Firestore Service Agent** - Basic service access

**Minimum needed**: `Cloud Datastore User`

## Verification

After setting up, test with:
```bash
node scripts/create-prod-user-roles.js
```

If it works, you'll see:
```
✅ Successfully created user_roles/roles_config in production!
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit service account JSON files to git
- Keep them secure and private
- Only grant minimum necessary permissions
- Rotate keys periodically

