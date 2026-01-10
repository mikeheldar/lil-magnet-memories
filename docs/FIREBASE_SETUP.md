# Firebase Setup Guide

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `lil-magnet-memories`
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In your Firebase project, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users
5. Click "Done"

## Step 3: Enable Storage

1. Go to "Storage" in your Firebase project
2. Click "Get started"
3. Choose "Start in test mode" (for development)
4. Select the same location as Firestore
5. Click "Done"

## Step 4: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app" and select the web icon (</>)
4. Enter app name: `lil-magnet-memories-web`
5. Click "Register app"
6. Copy the Firebase configuration object

## Step 5: Update Configuration

Replace the placeholder values in `src/firebase/config.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: 'your-actual-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-actual-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-actual-app-id',
};
```

## Step 6: Security Rules (Important!)

### Firestore Rules

Go to Firestore Database > Rules and update to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /orders/{document} {
      allow read, write: if true; // Allow all access for now
    }
  }
}
```

### Storage Rules

Go to Storage > Rules and update to:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /orders/{allPaths=**} {
      allow read, write: if true; // Allow all access for now
    }
  }
}
```

## Step 7: Test the Setup

1. Run `npm run dev`
2. Upload a photo and submit an order
3. Check Firestore Database to see if the order appears
4. Check Storage to see if photos are uploaded
5. Check the OrderList page to see if orders display

## Troubleshooting

- Make sure all Firebase services are enabled
- Check browser console for any Firebase errors
- Verify your configuration values are correct
- Ensure Firestore and Storage rules allow access

## Next Steps

Once Firebase is configured:

1. Orders will be saved to Firestore
2. Photos will be uploaded to Storage
3. OrderList page will display all orders
4. You can manage order statuses
