# Test Runner Quick Start

## Setup (One-time)

1. **Install Playwright browsers:**
   ```bash
   npm run test:setup
   ```
   Or manually:
   ```bash
   npx playwright install --with-deps
   ```

2. **Install Express (for local test server):**
   ```bash
   npm install
   ```
   (Express is already in package.json)

## Running Tests

### Option 1: Via Admin UI (Recommended)

1. **Start the test API server** (in one terminal):
   ```bash
   npm run test:server
   ```
   This starts the server on `http://localhost:3000`

2. **Start the Quasar dev server** (in another terminal):
   ```bash
   npm run dev
   ```
   This starts the app on `http://localhost:9000`

3. **Access the Test Runner:**
   - Log in as an admin user
   - Open the hamburger menu (☰)
   - Go to **Admin** section
   - Click **Test Runner**
   - Select a test suite
   - Click **Run Tests**

### Option 2: Via Command Line

```bash
# Run all tests
npm run test:e2e

# Run specific suite
npx playwright test tests/e2e/scenarios/market-event-not-live.spec.ts

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run with UI
npm run test:e2e:ui
```

## Troubleshooting

**"Failed to run tests" error:**
- Make sure the test server is running: `npm run test:server`
- Check that Playwright browsers are installed: `npm run test:setup`
- Verify the dev server is running on port 9000

**"Cannot find module 'express'" error:**
- Run: `npm install`

**Tests timeout:**
- Tests can take several minutes, especially with 15 photos
- Check browser console for detailed errors

## Test Suites Available

- **All Tests**: Complete test suite
- **Market Event Not Live**: Online ordering scenarios
- **Market Event Live**: Market event scenarios  
- **Data Integrity**: Validation and button tests
