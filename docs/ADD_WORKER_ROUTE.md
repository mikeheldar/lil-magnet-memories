# Add Cloudflare Worker Route

The Worker script `apple-pay-file` has been deployed successfully, but the route needs to be added manually.

## Quick Steps

1. **Go to Cloudflare Dashboard**
   - https://dash.cloudflare.com
   - Select zone: `lilmagnetmemories.com`

2. **Navigate to Workers**
   - Click **Workers & Pages** in left sidebar
   - Click on **apple-pay-file** worker

3. **Add Route**
   - Click **Triggers** tab
   - Under **Routes** section, click **Add route**
   - Enter route pattern:
     ```
     *.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association
     ```
   - Click **Add route**

4. **Verify**
   - Wait 1-2 minutes for propagation
   - Test: `curl -s https://test.lilmagnetmemories.com/.well-known/apple-developer-merchantid-domain-association | wc -c`
   - Should return **9099** (not 2026)

## Alternative: Update API Token

If you want me to add the route via API, update your API token with:
- **Workers Routes:Edit** permission

Then I can add the route automatically.

