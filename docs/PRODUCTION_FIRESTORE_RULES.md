# Production Firestore Security Rules

## Overview

These are the recommended Firestore security rules for production. They balance security with functionality, allowing the app to work while protecting sensitive data.

## Quick Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your **production** project (`lil-magnet-memories` — see `.firebaserc` `default`)
3. Go to **Firestore Database** → **Rules**
4. Copy and paste the rules from `production-firestore-rules.txt`
5. Click **"Publish"**

### Or deploy from this repo (production project)

```bash
# Ensure you’re logged in: firebase login
firebase use default   # production: lil-magnet-memories
npm run deploy:firestore-rules
```

If promo codes or other features work in **test** but show **“Missing or insufficient permissions”** in **production**, the production rules in the console are almost always **out of date**. Publishing/deploying the file above fixes it.

## Rule Breakdown

### User Roles (`user_roles`)
- **Read**: Authenticated users (needed for admin check in app)
- **Write**: Authenticated users (admin check happens in application code)
- **Note**: For tighter security, you could hardcode admin emails in rules

### Admin Config (`admin_config`)
- **Read**: Authenticated users (needed for admin check)
- **Write**: Authenticated users (admin check in app code)

### Orders (`orders`)
- **Create**: Any authenticated user (including anonymous)
- **Read**: Users can read their own orders (by userId or email)
- **Update**: Users can update their own orders
- **Delete**: Authenticated users (admin check in app code)

### Products (`products`)
- **Read**: Public (anyone can view products/pricing)
- **Write**: Authenticated users (admin check in app code)

### Settings (`settings`)
- **Read**: Public (anyone can view shipping options, etc.)
- **Write**: Authenticated users (admin check in app code)

### Market Events (`marketEvents`)
- **Read**: Public (anyone can view active market events)
- **Write**: Authenticated users (admin check in app code)

### Promo codes (`promo_codes`)
- **Read (`get`, `list`)**: Public — checkout validates by document id; Manage Products lists all codes with `orderBy`.
- **Write (`create` / `update` / `delete`)**: Authenticated users only (admin/operator enforced in app code).

## Security Considerations

### Current Approach
- Admin checks happen in **application code**, not in Firestore rules
- This is because checking admin status in rules would require reading `user_roles`, creating a circular dependency
- The app code properly validates admin status before allowing admin operations

### For Enhanced Security (Optional)

If you want stricter rules, you can hardcode admin emails in the rules:

```javascript
function isHardcodedAdmin() {
  return request.auth != null && 
    request.auth.token.email in [
      'michael.helmandarley@gmail.com',
      'lilmagnetmemories@gmail.com'
    ];
}

match /user_roles/{document} {
  allow read: if request.auth != null;
  allow write: if isHardcodedAdmin();
}
```

### Anonymous Authentication
- The app uses anonymous authentication for users who aren't logged in
- This allows them to create orders without signing in
- Rules allow `request.auth != null` which includes anonymous users

## Testing

After updating rules:

1. Test creating an order (should work for any authenticated user)
2. Test reading your own orders (should work)
3. Test admin operations (should work if you're admin in app)
4. Check browser console for any permission errors

## Troubleshooting

### "Permission denied" errors
- Check that user is authenticated (`request.auth != null`)
- For orders, check that userId/email matches
- Verify admin status in application code, not just rules

### "Client is offline" errors
- This is a different issue (network/Firebase connection)
- See the network enable fixes in `src/firebase/config.js`

## Differences from Test Environment

Test environment might have more permissive rules for development:
- Test: `allow read, write: if true;` (allows everything)
- Production: Rules above (more restrictive, secure)

Make sure both environments have appropriate rules for their use case.

