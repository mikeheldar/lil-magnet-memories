# Create user_roles Collection in Production - Manual Steps

## Quick Steps (2 minutes)

1. **Open Firebase Console**: https://console.firebase.google.com/project/lil-magnet-memories/firestore/data

2. **Click the "+" button** next to the existing collections (or "Start collection" if this is a new database)

3. **Collection ID**: Type `user_roles` and click "Next"

4. **Document ID**: Type `roles_config` and click "Next"

5. **Add First Field**:
   - Field name: `roles`
   - Field type: Select **"map"** from the dropdown
   - Click "Add field" (this creates an empty map)
   - Click "Save" (this saves the empty map)

6. **Add Second Field**:
   - Click "+ Add field" again
   - Field name: `updatedAt`
   - Field type: Select **"timestamp"** from the dropdown
   - Click "Set" to use the current timestamp
   - Click "Save"

7. **Final Save**: Click "Save" at the bottom to create the document

## Verification

After creating, you should see:
- ✅ `user_roles` collection in the left sidebar
- ✅ `roles_config` document when you click on `user_roles`
- ✅ Two fields: `roles` (map) and `updatedAt` (timestamp)

## What This Does

This collection is used by the AdminPage to:
- Store user role assignments (admin, operator, customer)
- Allow dynamic role management via the UI
- Work alongside the hardcoded admin emails

Without it, the app falls back to hardcoded admins but can't manage roles dynamically.

## Next Steps

After creating this collection:
1. Test the Admin page in production
2. Try adding a user role - it should work now
3. The collection will be automatically populated as you use the admin features

