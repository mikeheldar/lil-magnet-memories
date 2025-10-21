# Firebase 400 Error - Quick Fix Checklist

## 🚨 MOST LIKELY ISSUE: Firestore Security Rules

**Problem**: Your Firestore rules are blocking writes
**Solution**: Set permissive rules temporarily

### Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to **Firestore Database** → **Rules**
4. Replace current rules with:

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

5. Click **"Publish"**

---

## 🚨 ISSUE #2: Billing Not Enabled

**Problem**: Firebase requires billing enabled even for free tier
**Solution**: Enable billing

### Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to **Project Settings** → **Usage and billing**
4. Click **"Upgrade"** or **"Enable billing"**
5. Add a payment method (you won't be charged for free tier usage)

---

## 🚨 ISSUE #3: Domain Not Authorized

**Problem**: Your Vercel domain isn't authorized in Firebase
**Solution**: Add domain to authorized domains

### Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to **Authentication** → **Settings**
4. Scroll to **"Authorized domains"**
5. Add these domains:
   - `lil-magnet-memories-4k1jxcgue-mikeheldars-projects.vercel.app`
   - `localhost` (if not already there)

---

## 🚨 ISSUE #4: API Quotas Exceeded

**Problem**: You've hit Firebase usage limits
**Solution**: Check and reset quotas

### Steps to Fix:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `lil-magnet-memories`
3. Go to **IAM & Admin** → **Quotas**
4. Search for "Firestore"
5. Check if any quotas are exceeded
6. Request quota increases if needed

---

## 🧪 TESTING STEPS

After making any changes:

1. **Visit diagnostic tool**: https://lil-magnet-memories-4k1jxcgue-mikeheldars-projects.vercel.app/firebase-test
2. **Run all three tests**:
   - Test Firebase Connection
   - Test Basic Firestore Write
   - Test Minimal Order Write
3. **Check results** - all should show "Success"
4. **Test order submission** on upload page

---

## 📞 IMMEDIATE ACTION

**Start with Issue #1 (Firestore Rules)** - this fixes 80% of 400 errors.

If that doesn't work, proceed to Issue #2 (Billing).

Your app will work regardless of Firebase issues, but fixing these will enable proper order storage.
