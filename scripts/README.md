# Database Seeding Script

This script copies data from production Firebase to test Firebase.

## What It Copies

- ✅ **products** collection - All product data
- ✅ **adminConfig** collection - Admin email configuration

## Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Download Service Account Keys:**

   **Production:**
   - Go to: https://console.firebase.google.com/project/lil-magnet-memories/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Save the JSON file (e.g., `prod-service-account.json`)
   - **Keep this file secure - don't commit it to git!**

   **Test:**
   - Go to: https://console.firebase.google.com/project/lil-magnet-memories-test/settings/serviceaccounts/adminsdk
   - Click "Generate new private key"
   - Save the JSON file (e.g., `test-service-account.json`)
   - **Keep this file secure - don't commit it to git!**

## Usage

1. **Set environment variables:**
   ```bash
   export PROD_SERVICE_ACCOUNT_PATH=/path/to/prod-service-account.json
   export TEST_SERVICE_ACCOUNT_PATH=/path/to/test-service-account.json
   ```

2. **Run the script:**
   ```bash
   npm run seed-test
   ```

   Or directly:
   ```bash
   node scripts/seed-test-database.js
   ```

## Example

```bash
# Set paths to your service account files
export PROD_SERVICE_ACCOUNT_PATH=~/Downloads/prod-service-account.json
export TEST_SERVICE_ACCOUNT_PATH=~/Downloads/test-service-account.json

# Run the script
npm run seed-test
```

## What Happens

1. Connects to production Firebase
2. Reads all documents from `products` and `adminConfig` collections
3. Connects to test Firebase
4. Writes all documents to test database
5. Converts Firestore Timestamps to serverTimestamp() for dates
6. Shows summary of what was copied

## Security Notes

⚠️ **IMPORTANT:**
- Service account keys have full admin access
- **Never commit these files to git**
- Add to `.gitignore`:
  ```
  *-service-account.json
  service-account*.json
  ```
- Store keys securely
- Delete keys if compromised

## Troubleshooting

**"PROD_SERVICE_ACCOUNT_PATH not set"**
- Make sure you've set the environment variable
- Use `export` command (see Usage above)

**"Service account file not found"**
- Check the file path is correct
- Use absolute paths if relative paths don't work

**"Permission denied"**
- Make sure service account has proper permissions in Firebase
- Service accounts should have "Firebase Admin SDK Administrator Service Agent" role

**"Collection is empty"**
- This is normal if production doesn't have data in that collection
- The script will skip empty collections

