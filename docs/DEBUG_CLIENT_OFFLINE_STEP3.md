# Step 3: Fix Hanging Operations with Per-Attempt Timeouts

## Problem Identified from Logs

From the operation log:
- **Operation**: `loadAdminEmails`
- **Duration**: 73 seconds (not 30 seconds)
- **Result**: Timeout after 30 seconds
- **Issue**: Operation is **hanging** - `getDoc()` never returns or throws

## Root Cause

The Firestore operation (`getDoc()`) is **hanging indefinitely** - it's not failing immediately, it's just not completing. The previous timeout was applied to the entire retry operation, meaning:
- If it retries 5 times, each could take 30 seconds
- Total time: up to 150 seconds
- Operations hang instead of failing fast

## Solution

**Per-attempt timeouts** instead of per-operation timeouts:
1. Each retry attempt has its own 8-second timeout
2. If an attempt hangs, it times out after 8 seconds
3. The retry mechanism kicks in immediately
4. Total time: 5 retries × 8s = 40s maximum (vs 150s before)

## Changes Made

### `retryOnOffline` function:
- Added `perAttemptTimeout` parameter (default: 8 seconds)
- Wraps each attempt in its own timeout
- Detects hanging operations faster

### Removed redundant timeouts:
- `loadAdminEmails`: Removed 30s timeout wrapper
- `saveAdminEmails`: Removed 10s timeout wrapper
- `loadUserRoles`: Removed 60s timeout wrapper
- `saveUserRoles`: Removed 20s timeout wrapper

All operations now use the per-attempt timeout mechanism.

## Expected Result

When operations hang:
- Each attempt times out after 8 seconds (not 30+ seconds)
- Retries happen faster
- Total operation time: ~40 seconds maximum (vs 150+ seconds)
- Operations fail fast instead of hanging indefinitely

## Testing

After deployment, check logs for:
- Operations completing in < 40 seconds
- Faster retry attempts (8s each)
- More responsive error handling

