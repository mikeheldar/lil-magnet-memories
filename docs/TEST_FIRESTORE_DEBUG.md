# Test Firestore Permission Debugging

## Current Status
- ✅ Rules are set to `allow read, write: if true;`
- ✅ Anonymous auth is enabled
- ✅ Project ID is correct: `lil-magnet-memories-test`
- ❌ Still getting "Missing or insufficient permissions" errors

## Debugging Steps

### 1. Verify Database Mode
The test Firestore database must be in **Native mode**, not Datastore mode.

**Check:**
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore
2. Look at the top of the page
3. It should say "Cloud Firestore" (Native mode)
4. If it says "Cloud Datastore", that's the problem - you need to create a new Native mode database

**If in Datastore mode:**
- You cannot use Firestore security rules
- You need to create a new Native mode database
- Go to Firestore Database → Create Database → Choose "Start in production mode" or "Start in test mode" → Select "Cloud Firestore" (Native mode)

### 2. Republish Rules (Force Refresh)
Sometimes rules need to be republished to take effect:

1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/rules
2. Click in the rules editor
3. Make a small change (add a space, then remove it)
4. Click "Publish" again
5. Wait 2-3 minutes

### 3. Test Rules Directly
Use the Rules Playground in Firebase Console:

1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/rules
2. Click "Rules Playground" (or "Simulator" tab)
3. Test a read operation:
   - **Location**: `products/magnet-2x3`
   - **Operation**: `get`
   - **Authenticated**: `false` (or `true` with anonymous user)
   - Click "Run"
4. It should show "Allow" - if it shows "Deny", the rules aren't working

### 4. Check for Multiple Databases
Firebase projects can have multiple databases. Make sure you're editing rules for the default database:

1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/databases
2. Check if there are multiple databases
3. If there are, make sure the rules are set for the `(default)` database
4. The code uses `getFirestore(app)` which connects to the default database

### 5. Verify API is Enabled
Make sure Cloud Firestore API is enabled:

1. Go to: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=lil-magnet-memories-test
2. Make sure "Cloud Firestore API" is enabled
3. If not, click "Enable"

### 6. Clear Browser Cache
Sometimes cached rules can cause issues:

1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Or clear browser cache completely
3. Try in an incognito/private window

### 7. Check Billing Status
Firestore requires billing to be enabled (even for free tier):

1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/settings/usage
2. Check if billing is enabled
3. If not, enable it (you won't be charged for free tier usage)

## Most Likely Issue

Based on the symptoms, the most likely issue is:

**The database is in Datastore mode instead of Native mode.**

If this is the case:
- Security rules won't work
- You need to create a new Native mode database
- You may need to migrate data (or just re-initialize with the script)

## Quick Test

Try accessing a document directly in the browser:
```
https://firestore.googleapis.com/v1/projects/lil-magnet-memories-test/databases/(default)/documents/products/magnet-2x3?key=YOUR_API_KEY
```

Replace `YOUR_API_KEY` with your test Firebase API key. If this works, the issue is with the client SDK. If it doesn't, the issue is with the database configuration.

