# Firestore Collections Sync Guide

## Current Status

### Test Environment (`lil-magnet-memories-test`)
Collections present:
- ✅ `admin_config` - Admin email configuration
- ✅ `marketEvents` - Market event data
- ✅ `orders` - Order data
- ✅ `products` - Product catalog
- ✅ `settings` - App settings
- ✅ `test` - Test data (not needed in production)
- ✅ `user_roles` - User role management (CRITICAL - missing in production)

### Production Environment (`lil-magnet-memories`)
Collections present:
- ✅ `admin_config` - Admin email configuration
- ✅ `marketEvents` - Market event data
- ✅ `orders` - Order data
- ✅ `products` - Product catalog
- ✅ `settings` - App settings
- ❌ `user_roles` - **MISSING** - This is critical for admin functionality

## Required Collections

### 1. `user_roles` Collection (MISSING IN PRODUCTION)

**Purpose**: Stores user role assignments (admin, operator, customer)

**Required Document**:
- Document ID: `roles_config`
- Structure:
  ```json
  {
    "roles": {
      "user@example.com": "admin",
      "another@example.com": "operator"
    },
    "updatedAt": "2024-01-01T00:00:00Z"
  }
  ```

**How to Create in Production**:

1. **Go to Firebase Console**: https://console.firebase.google.com/project/lil-magnet-memories/firestore
2. **Click "Start collection"** (if no collections exist) or click the "+" next to existing collections
3. **Collection ID**: Enter `user_roles`
4. **Click "Next"**
5. **Document ID**: Enter `roles_config`
6. **Add fields**:
   - Field name: `roles`, Type: `map`, Value: `{}` (empty map)
   - Field name: `updatedAt`, Type: `timestamp`, Value: Current timestamp
7. **Click "Save"**

### 2. `admin_config` Collection (EXISTS IN BOTH)

**Purpose**: Stores admin email addresses

**Required Document**:
- Document ID: `admin_emails`
- Structure:
  ```json
  {
    "emails": [
      "michael.helmandarley@gmail.com",
      "lilmagnetmemories@gmail.com"
    ],
    "updatedAt": "2024-01-01T00:00:00Z"
  }
  ```

**Verify in Production**:
1. Go to `admin_config` collection
2. Check if `admin_emails` document exists
3. If missing, create it with the structure above

### 3. Other Collections

These should already exist and be populated:
- `orders` - Created automatically when orders are submitted
- `products` - Should be populated with product data
- `marketEvents` - Should be populated with market event data
- `settings` - Should contain app settings

## Quick Sync Steps

### Option 1: Manual Creation (Recommended for `user_roles`)

1. **Open Production Firebase Console**: https://console.firebase.google.com/project/lil-magnet-memories/firestore/data
2. **Create `user_roles` collection**:
   - Click "+ Start collection" or "+" button
   - Collection ID: `user_roles`
   - Document ID: `roles_config`
   - Add field: `roles` (type: map, value: `{}`)
   - Add field: `updatedAt` (type: timestamp, value: now)
   - Click "Save"

3. **Verify `admin_config` exists**:
   - Navigate to `admin_config` collection
   - Ensure `admin_emails` document exists
   - If missing, create it with:
     - Field: `emails` (type: array, value: `["michael.helmandarley@gmail.com", "lilmagnetmemories@gmail.com"]`)
     - Field: `updatedAt` (type: timestamp, value: now)

### Option 2: Copy from Test to Production

**⚠️ WARNING**: Only copy the structure, not the data (unless you want to sync admin users)

1. **Export from Test**:
   - Go to test project Firestore
   - Export the `user_roles/roles_config` document structure
   - Note the field structure

2. **Import to Production**:
   - Go to production project Firestore
   - Create the same collection and document structure
   - Use empty/default values initially

## Verification

After creating the collections, verify:

1. **Test in Production**:
   - Sign in as admin
   - Go to Admin page
   - Try to add a user role
   - Should work without errors

2. **Check Console Logs**:
   - Open browser console
   - Look for errors about missing collections
   - Should see successful reads from `user_roles` collection

## Why This Matters

The `user_roles` collection is critical because:
- The AdminPage uses it to manage user roles
- `authService.isAdminAsync()` reads from it
- Without it, admin role management via the UI won't work
- The app will fall back to hardcoded admin emails, but dynamic role management won't work

## Next Steps

1. ✅ Create `user_roles` collection in production
2. ✅ Verify `admin_config` exists in production
3. ✅ Test admin functionality in production
4. ✅ Consider syncing product data if needed
5. ✅ Consider syncing market events if needed

