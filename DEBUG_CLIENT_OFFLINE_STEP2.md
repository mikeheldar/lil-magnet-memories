# Step 2: Fix Timeout Errors

## Problem Identified from Logs

From the operation log, we can see:
- **Operation**: `loadAdminEmails`
- **Browser**: Online (4G connection)
- **Auth**: Authenticated user
- **Result**: **TIMEOUT after 10 seconds** (not "offline" error)

## Root Cause

The operation is **hanging/timing out** rather than immediately failing with an "offline" error. The `retryOnOffline` function only retries on:
- Error code `unavailable`
- Error message containing "offline"

**Timeout errors don't match these conditions**, so they're not retried and the operation fails.

## Solution

1. **Update `retryOnOffline`** to also handle timeout errors
2. **Increase timeout** to allow for retries (30 seconds instead of 10)
3. **Treat timeouts as connection issues** that should trigger retries

## Changes Made

- `retryOnOffline` now detects timeout errors and retries them
- `loadAdminEmails` timeout increased from 10s to 30s
- Timeout errors trigger the same retry mechanism as offline errors

## Expected Result

When operations timeout:
- They will be retried (up to 5 times)
- Network will be reset between retries
- Connection will be verified before retrying
- Operations should succeed after retry

