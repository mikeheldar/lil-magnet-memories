# How to Check Firebase Status

## 🔍 Checking if Firestore is Online/Working

### Method 1: Firebase Console - Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `lil-magnet-memories`
3. Click on **"Firestore Database"** in the left sidebar
4. You should see:
   - **Data tab**: Shows all your collections and documents
   - **Rules tab**: Shows security rules
   - **Indexes tab**: Shows database indexes
   - **Usage tab**: Shows read/write operations

**If you can see your data and collections, Firestore is online and working!**

### Method 2: Check Recent Activity

1. In Firebase Console → Firestore Database
2. Look at the **Usage** tab
3. You should see recent read/write operations
4. If you see activity, Firestore is working

### Method 3: Google Cloud Console - Firestore API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to **APIs & Services** → **Enabled APIs**
4. Search for "Cloud Firestore API"
5. Check if it's **enabled** (should show a green checkmark)
6. Click on it to see:
   - **Quotas**: Check if you've hit any limits
   - **Metrics**: See API usage graphs

### Method 4: Check Firestore Status Page

1. Go to [Google Cloud Status](https://status.cloud.google.com/)
2. Look for "Cloud Firestore" in the service list
3. Check if there are any incidents or outages

### Method 5: Test Direct Connection

Open browser console on your site and run:

```javascript
// Check if Firestore is accessible
import { getFirestore, collection, getDocs } from 'firebase/firestore';
const db = getFirestore();
const testRef = collection(db, 'test');
getDocs(testRef).then(() => {
  console.log('✅ Firestore is online and accessible');
}).catch(err => {
  console.error('❌ Firestore error:', err);
});
```

## 🚨 Common Issues and How to Check

### Issue: "Client is offline" error

**Check:**
1. Firebase Console → Firestore Database → Usage tab
   - If you see recent operations, Firestore is online
   - The issue is likely browser-side (persistence cache)

**Solution:**
- Clear browser cache and localStorage
- Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
- Try incognito/private browsing mode

### Issue: "Permission denied" error

**Check:**
1. Firebase Console → Firestore Database → Rules tab
2. Verify rules allow read/write for your use case

**Solution:**
- Temporarily set permissive rules for testing:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Issue: "Quota exceeded" error

**Check:**
1. Google Cloud Console → IAM & Admin → Quotas
2. Search for "Firestore"
3. Check if any quotas show as exceeded

**Solution:**
- Request quota increase if needed
- Check billing is enabled

## 📊 Monitoring Firestore Health

### Real-time Monitoring

1. **Firebase Console** → **Firestore Database** → **Usage** tab
   - Shows read/write operations per day
   - Shows storage usage
   - Shows document count

2. **Google Cloud Console** → **Monitoring** → **Dashboards**
   - Create custom dashboard for Firestore metrics
   - Set up alerts for errors or quota issues

### Check Billing Status

1. Firebase Console → Project Settings → Usage and billing
2. Verify billing is enabled (required even for free tier)
3. Check if you're within free tier limits

## ✅ Quick Health Check Checklist

- [ ] Can access Firebase Console
- [ ] Firestore Database shows collections
- [ ] Can see recent data in Firestore
- [ ] Cloud Firestore API is enabled in Google Cloud
- [ ] No quota exceeded warnings
- [ ] Billing is enabled
- [ ] Security rules are configured
- [ ] No active incidents on status page

If all checked, Firestore is online and working! 🎉

