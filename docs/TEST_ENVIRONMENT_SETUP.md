# Test Environment Setup Guide

This guide will help you set up a complete test environment for Lil Magnet Memories at `test.lilmagnetmemories.com`.

## 🎯 Overview

The test environment will have:
- ✅ Separate Firebase project for test data
- ✅ Visual indicators showing it's a test environment
- ✅ Separate admin configuration
- ✅ Independent from production data

## 📋 Step-by-Step Setup

### 1. Create Test Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Click "Create Project"**
3. **Project Name**: `lil-magnet-memories-test`
4. **Enable Google Analytics**: No (optional)
5. **Create Project**

### 2. Configure Firebase Services

#### Enable Authentication
1. **Go to Authentication** → **Sign-in method**
2. **Enable Google** provider
3. **Add authorized domains**:
   - `test.lilmagnetmemories.com`
   - `localhost` (for local testing)

#### Enable Firestore Database
1. **Go to Firestore Database** → **Create database**
2. **Start in test mode** (for now)
3. **Choose location**: Same as production

#### Enable Storage
1. **Go to Storage** → **Get started**
2. **Start in test mode** (for now)
3. **Choose location**: Same as production

### 3. Get Firebase Configuration

1. **Go to Project Settings** → **General**
2. **Scroll down to "Your apps"**
3. **Click "Web app" icon** (`</>`)
4. **App nickname**: `lil-magnet-memories-test`
5. **Copy the config object**

### 4. Create Vercel Test Project

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "New Project"**
3. **Import from GitHub**: Select `lil-magnet-memories` repository
4. **Configure Project**:
   - **Project Name**: `lil-magnet-memories-test`
   - **Framework Preset**: Other
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/spa`
   - **Install Command**: `npm install`

### 5. Set Environment Variables in Vercel

In your Vercel test project settings:

1. **Go to Settings** → **Environment Variables**
2. **Add these variables**:

```
# Test Firebase Configuration
VITE_FIREBASE_API_KEY_TEST=your_test_api_key
VITE_FIREBASE_AUTH_DOMAIN_TEST=your_test_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID_TEST=your_test_project_id
VITE_FIREBASE_STORAGE_BUCKET_TEST=your_test_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID_TEST=your_test_sender_id
VITE_FIREBASE_APP_ID_TEST=your_test_app_id

# Production Firebase Configuration (fallback)
VITE_FIREBASE_API_KEY=AIzaSyDFIwa_pv5vne3-WJDzB0D4JVQBPzkv0IQ
VITE_FIREBASE_AUTH_DOMAIN=lil-magnet-memories.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lil-magnet-memories
VITE_FIREBASE_STORAGE_BUCKET=lil-magnet-memories.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=849050019895
VITE_FIREBASE_APP_ID=1:849050019895:web:4600965ea2f49a396877b2
```

### 6. Configure DNS

In your Cloudflare DNS settings:

1. **Add CNAME Record**:
   - **Name**: `test`
   - **Target**: `cname.vercel-dns.com`
   - **Proxy**: Disabled (gray cloud)

### 7. Configure Vercel Domain

1. **Go to Vercel Test Project** → **Settings** → **Domains**
2. **Add Domain**: `test.lilmagnetmemories.com`
3. **Verify DNS**: Wait for verification

### 8. Deploy Test Environment

1. **Connect Test Branch**: In Vercel, set the production branch to `test-environment`
2. **Deploy**: The test branch will automatically deploy
3. **Verify**: Visit `test.lilmagnetmemories.com`

## 🎨 Test Environment Features

### Visual Indicators
- **Orange "TEST" chip** in the header
- **Page titles** show "(TEST)" suffix
- **Separate admin emails** for test environment

### Test Admin Configuration
The test environment uses these admin emails:
- `test-admin@lilmagnetmemories.com`
- `lilmagnetmemories@gmail.com` (your email for testing)

### Environment Detection
The app automatically detects the test environment based on the hostname `test.lilmagnetmemories.com`.

## 🔄 Development Workflow

### Making Changes
1. **Develop on test branch**: `git checkout test-environment`
2. **Make changes**: Test new features
3. **Commit and push**: `git add . && git commit -m "Test feature" && git push`
4. **Test on**: `test.lilmagnetmemories.com`
5. **Merge to production**: When ready, merge to main branch

### Testing Process
1. **Test new features** on test environment first
2. **Verify functionality** with test data
3. **Test admin features** with test admin accounts
4. **Deploy to production** when satisfied

## 🚨 Important Notes

### Data Separation
- ✅ Test environment has **separate Firebase project**
- ✅ **No production data** is affected
- ✅ **Independent admin configuration**
- ✅ **Safe to break things** during testing

### Security
- 🔒 **Test Firebase rules** should be permissive for development
- 🔒 **Production rules** remain secure
- 🔒 **Test admin emails** are separate from production

### Deployment
- 🚀 **Test branch** → `test.lilmagnetmemories.com`
- 🚀 **Main branch** → `lilmagnetmemories.com`
- 🚀 **Automatic deployments** on branch pushes

## 🎯 Next Steps

After setup:
1. **Test the environment** by visiting `test.lilmagnetmemories.com`
2. **Create test admin accounts** in Firebase
3. **Test all features** in the test environment
4. **Start developing new features** on the test branch

## 🆘 Troubleshooting

### Common Issues

**Test site not loading**:
- Check DNS propagation (can take up to 24 hours)
- Verify Vercel domain configuration
- Check environment variables are set correctly

**Firebase connection errors**:
- Verify test Firebase project configuration
- Check authorized domains in Firebase Auth
- Ensure environment variables match Firebase config

**Admin features not working**:
- Check test admin emails in Firebase
- Verify admin configuration is loaded
- Check browser console for errors

### Support
If you encounter issues, check:
1. **Browser console** for JavaScript errors
2. **Vercel deployment logs** for build issues
3. **Firebase console** for database/auth errors
