# Market Events Debugging Guide

## Issue: Market events not appearing for other admins

When one admin creates a market event, it doesn't appear for other admins.

## Debugging Steps

### 1. Check Browser Console

When Admin A creates an event, look for these console logs:

**In Admin A's browser:**
- `MarketEventsPage: Creating event with data:`
- `Creating market event with data:`
- `✅ Market event created successfully!`
- `Document ID: [some-id]`
- `✅ Verified: Document exists in Firestore`

**In Admin B's browser:**
- `MainLayout: Setting up real-time listener for market events...`
- `MainLayout: Market events snapshot received:`
- `MainLayout: Market events cache updated:`

### 2. Check for Errors

Look for these error patterns:

**Permission Denied:**
```
❌ Error creating market event: [FirebaseError: Missing or insufficient permissions]
Error code: permission-denied
```

**Solution:** Update Firebase security rules (see below)

**Network Errors:**
```
Error code: unavailable
Error message: Service unavailable
```

**Solution:** Check internet connection and Firebase status

### 3. Verify Firebase Security Rules

Go to [Firebase Console](https://console.firebase.google.com/) → Firestore Database → Rules

**Required Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all authenticated users to read/write market events
    match /marketEvents/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Or for testing, allow all access:
    match /marketEvents/{eventId} {
      allow read, write: if true;
    }
  }
}
```

**Important:** Click "Publish" after updating rules!

### 4. Verify Event Was Created in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Firestore Database** → **Data**
3. Look for the `marketEvents` collection
4. Check if the event appears there

**If event is NOT in Firebase:**
- The create operation failed
- Check console for errors
- Verify security rules allow writes

**If event IS in Firebase but not showing in app:**
- Real-time listener issue
- Check console for listener errors
- Try clicking "Refresh" button

### 5. Test Real-Time Listener

1. Open browser console
2. Look for: `MainLayout: Setting up real-time listener for market events...`
3. Create an event in another browser
4. Watch for: `MainLayout: Market events snapshot received:`

**If listener isn't working:**
- Check for permission errors
- Verify Firebase connection
- Check browser console for errors

### 6. Manual Verification

1. **Admin A creates event:**
   - Check console for success message
   - Verify event appears in Firebase Console

2. **Admin B refreshes page:**
   - Click "Refresh" button on MarketEventsPage
   - Check if event appears

3. **Check both browsers' consoles:**
   - Compare what each admin sees
   - Look for different error messages

## Common Issues & Solutions

### Issue 1: Permission Denied

**Error:** `permission-denied`

**Solution:**
1. Go to Firebase Console → Firestore → Rules
2. Add rules for `marketEvents` collection (see above)
3. Click "Publish"
4. Try creating event again

### Issue 2: Event Created But Not Visible

**Symptoms:**
- Event appears in Firebase Console
- Event doesn't appear in app for other admins

**Solution:**
1. Check if real-time listener is active (look for console logs)
2. Try clicking "Refresh" button
3. Check for listener errors in console
4. Verify both admins are authenticated

### Issue 3: Real-Time Listener Not Working

**Symptoms:**
- No console logs about snapshots
- Events don't update in real-time

**Solution:**
1. Check Firebase connection
2. Verify security rules allow reads
3. Check browser console for errors
4. Try refreshing the page

## Testing Checklist

- [ ] Admin A can create event (check console for success)
- [ ] Event appears in Firebase Console
- [ ] Admin B's console shows listener setup
- [ ] Admin B's console shows snapshot received
- [ ] Event appears in Admin B's MarketEventsPage
- [ ] Banner appears in Admin B's MainLayout (if checked in)

## Next Steps

If events still don't appear:

1. **Share console logs** from both admins
2. **Check Firebase Console** to verify events are being created
3. **Verify security rules** are published correctly
4. **Test with Refresh button** to see if it's a real-time issue

