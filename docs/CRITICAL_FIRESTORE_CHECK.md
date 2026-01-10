# Critical Firestore Checks - Do These NOW

## 1. Check Billing (REQUIRED for Firestore)
Firestore REQUIRES billing to be enabled, even for free tier.

1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/settings/usage
2. Check if billing is enabled
3. If NOT enabled:
   - Click "Upgrade" or "Enable billing"
   - Add a payment method (you won't be charged for free tier)
   - **This is REQUIRED - Firestore won't work without it**

## 2. Enable Firestore API
The Firestore API must be enabled in Google Cloud.

1. Go to: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=lil-magnet-memories-test
2. Click "Enable" if it's not enabled
3. Wait 1-2 minutes

## 3. Verify Rules Are Actually Published
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/rules
2. Look at the revision history on the left
3. Make sure the latest one shows "Today" with a star (active)
4. If not, click on it and "Publish" again

## 4. Test Rules in Playground
1. In Rules tab, click "Rules Playground"
2. Test:
   - Location: `orders/test123`
   - Operation: `create`
   - Authenticated: `false` (unchecked)
   - Click "Run"
3. If it shows "Deny", the rules aren't working

## 5. Try This EXACT Rule Set
Copy this EXACTLY (no changes):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

Then:
1. Paste it
2. Click "Publish"
3. Wait 3 minutes
4. Hard refresh test site (Cmd+Shift+R)

## 6. Check Database Mode
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore
2. At the top, it MUST say "Cloud Firestore" (Native mode)
3. If it says "Cloud Datastore", that's the problem - you need Native mode

## 7. Test Direct Write in Console
1. Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/firestore/data
2. Click "Start collection"
3. Collection ID: `test`
4. Document ID: `test123`
5. Add a field: `test` = `"hello"`
6. Click "Save"
7. If this fails, it's a project configuration issue, not code

## Most Likely Issues (in order):
1. **Billing not enabled** - Firestore won't work without it
2. **Firestore API not enabled** - Check Google Cloud Console
3. **Rules not actually published** - Check revision history
4. **Database in wrong mode** - Must be Native mode, not Datastore

