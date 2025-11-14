# Square Payment Setup Instructions

## Step 1: Get Your Square Sandbox Credentials

1. Go to https://developer.squareup.com/apps
2. Log in to your Square Developer account
3. Select your application (or create a new one)
4. Go to the "Credentials" section
5. You'll need:
   - **Application ID** (e.g., `sandbox-sq0idb-JWrilnnFfNcus4htkfm6ug`)
   - **Access Token** (Sandbox Access Token - starts with `EAA...` or `sandbox-...`)
   - **Location ID** (found in the Locations section of your Square Dashboard)

## Step 2: Get Your Location ID

1. Go to https://squareup.com/dashboard/locations (or Sandbox Dashboard)
2. Click on your location
3. The Location ID is shown in the URL or in the location settings
4. It looks like: `L88917AVBK2S5` or similar

## Step 3: Configure Firebase Functions

Run these commands to set your Square credentials:

```bash
cd functions
firebase functions:config:set square.access_token="YOUR_SANDBOX_ACCESS_TOKEN"
firebase functions:config:set square.location_id="YOUR_LOCATION_ID"
firebase functions:config:set square.environment="sandbox"
```

Replace:
- `YOUR_SANDBOX_ACCESS_TOKEN` with your actual Sandbox Access Token
- `YOUR_LOCATION_ID` with your actual Location ID

## Step 4: Verify Configuration

Check your config:
```bash
firebase functions:config:get
```

You should see:
```
square:
  access_token: EAA... (or sandbox-...)
  location_id: L88917AVBK2S5
  environment: sandbox
```

## Step 5: Redeploy Functions

After setting the config, redeploy:
```bash
firebase deploy --only functions
```

## Step 6: Test

Try a test payment with:
- Card: 4111 1111 1111 1111
- CVV: 111
- Expiry: Any future date
- ZIP: 11111

## Troubleshooting

If you see "Square location ID is not configured":
1. Verify the config is set: `firebase functions:config:get`
2. Make sure you redeployed after setting config
3. Check the logs: `firebase functions:log`

If you see "Square access token is not configured":
1. Make sure you set `square.access_token` in Firebase config
2. Verify the token is correct (no extra quotes or spaces)
