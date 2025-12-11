# Test Runner Troubleshooting

## Common Issues

### 404 Error: "The page could not be found"

This error typically means one of the following:

1. **Test API server is not running**
   - Solution: Run `npm run test:server` in a separate terminal
   - The server should start on `http://localhost:3000`

2. **Playwright is not installed**
   - Solution: Run `npm run test:setup` or `npx playwright install --with-deps`
   - This installs the Playwright browsers needed to run tests

3. **Test files don't exist**
   - Verify that test files exist in `tests/e2e/scenarios/`
   - Check that file names match: `market-event-not-live.spec.ts`, etc.

### All Tests Show as Failed When Running One

**Fixed in latest version!** The issue was that:
- Clicking "Run" on a single test was running the entire suite
- All filtered tests were being marked as running/failed

**Solution**: The latest code now:
- Runs only the selected test when clicking individual "Run" button
- Only updates status for tests that actually executed
- Uses Playwright's `-g` flag to filter by test ID

### Tests Show "Never run" but Also "Failed"

This happens when:
- Tests fail immediately (like 404 errors) before history is saved
- The error occurs at the API level, not the test level

**Solution**: The latest code now properly saves test results to history even on failures.

## Setup Checklist

- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run test:setup` to install Playwright browsers
- [ ] Start test server: `npm run test:server` (in separate terminal)
- [ ] Start dev server: `npm run dev` (in another terminal)
- [ ] Navigate to `/test-runner` page
- [ ] Verify test files exist in `tests/e2e/scenarios/`

## Testing the Setup

1. **Check if test server is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   Should return: `{"status":"ok","message":"Test API server is running"}`

2. **Check if Playwright is installed:**
   ```bash
   npx playwright --version
   ```
   Should show Playwright version

3. **Try running a test manually:**
   ```bash
   npx playwright test tests/e2e/scenarios/market-event-not-live.spec.ts -g "TC-1.1"
   ```
   This should run only TC-1.1 test

## API Endpoint Details

The test API expects:
- **POST** to `/api/run-tests`
- Body: `{ "testSuite": "market-event-not-live", "testId": "TC-1.1" }` (testId is optional)
- Returns: JSON with test results

If `testId` is provided, only that test runs.
If only `testSuite` is provided, the entire suite runs.
If neither is provided, all tests run.
