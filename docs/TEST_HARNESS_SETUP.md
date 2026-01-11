# Test Harness Setup Guide

## Overview

The Lil Magnet Memories test harness is a comprehensive end-to-end testing system built with **Playwright** that validates the entire customer journey from photo upload through order completion. The system includes:

- **Automated E2E Tests**: Full browser automation testing all user flows
- **Test Runner UI**: Admin interface to run and monitor tests
- **Page Object Model**: Maintainable test structure
- **Test Data Factories**: Consistent test data generation
- **Payment & Event Mocking**: Simulated payment and market event scenarios

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Test Runner UI                       │
│              (src/pages/TestRunnerPage.vue)              │
│  - View all tests                                        │
│  - Filter by suite/category                              │
│  - Run individual or batch tests                         │
│  - View results and history                             │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP POST
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Test API Server (Express)                   │
│                  (test-server.js)                        │
│  - Receives test execution requests                     │
│  - Spawns Playwright processes                          │
│  - Returns JSON results                                 │
└────────────────────┬────────────────────────────────────┘
                     │ Executes
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Playwright Test Engine                      │
│              (tests/e2e/scenarios/*.spec.ts)             │
│  - Page Objects (tests/page-objects/)                   │
│  - Test Utilities (tests/utils/)                        │
│  - Test Data (tests/utils/test-data/)                   │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

Before setting up the test harness, ensure you have:

- **Node.js 18+** installed
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)
- **Admin access** to the application (for Test Runner UI)
- **Firebase test project** configured (for test data)
- **Square test credentials** (for payment testing)

## Installation

### Step 1: Install Dependencies

```bash
npm install
```

This installs all project dependencies including:

- `@playwright/test` - Playwright testing framework
- `express` - Test API server
- `axios` - HTTP client for API calls
- Other project dependencies

### Step 2: Install Playwright Browsers

Playwright requires browser binaries to run tests. Install them with:

```bash
npm run test:setup
```

Or manually:

```bash
npx playwright install --with-deps
```

This installs Chromium, Firefox, and WebKit browsers (~500MB download).

**Note**: The `--with-deps` flag also installs system dependencies (fonts, libraries) required for browser rendering.

### Step 3: Verify Installation

Check that Playwright is installed correctly:

```bash
npx playwright --version
```

You should see the Playwright version number.

## Project Structure

```
tests/
├── e2e/                          # End-to-end test files
│   ├── scenarios/                # Test scenario files
│   │   ├── market-event-not-live.spec.ts
│   │   ├── market-event-live.spec.ts
│   │   ├── authenticated-users.spec.ts
│   │   ├── data-integrity.spec.ts
│   │   └── edge-cases.spec.ts
│   └── test-runner.ts            # Programmatic test execution
├── page-objects/                 # Page Object Model classes
│   ├── LandingPage.ts
│   ├── PhotoUploadPage.ts
│   ├── CheckoutPage.ts
│   ├── ThankYouPage.ts
│   ├── OrderListPage.ts
│   └── CustomerOrdersPage.ts
├── utils/                        # Test utilities
│   ├── test-data/               # Test data factories
│   │   ├── test-data-factory.ts
│   │   └── image-generator.ts
│   ├── market-events/           # Market event utilities
│   │   └── market-event-controller.ts
│   ├── payments/                # Payment mocking
│   │   └── payment-mocker.ts
│   ├── validation/              # Data validators
│   │   └── data-validators.ts
│   └── test-helpers.ts          # General helpers
├── config/                      # Test configuration
│   └── test-config.ts           # Environment variables
├── fixtures/                    # Test fixtures
│   └── images/                  # Test images
├── test-catalog.ts              # Centralized test metadata
└── README.md                    # Test documentation

api/
└── run-tests.js                 # Test execution API handler

src/
├── pages/
│   └── TestRunnerPage.vue       # Test Runner UI
└── services/
    └── testHistoryService.js    # Test history persistence

test-server.js                    # Local Express server
playwright.config.ts             # Playwright configuration
```

## Running Tests

### Option 1: Test Runner UI (Recommended for Development)

The Test Runner UI provides a visual interface to run and monitor tests.

#### 1. Start the Test API Server

In one terminal, start the Express server that handles test execution:

```bash
npm run test:server
```

You should see:

```
✅ Test API server running on http://localhost:3000
📋 Health check: http://localhost:3000/api/health
```

#### 2. Start the Development Server

In another terminal, start the Quasar development server:

```bash
npm run dev
```

The app should start on `http://localhost:9000`.

#### 3. Access the Test Runner

1. Navigate to `http://localhost:9000`
2. Log in as an **admin user**
3. Open the hamburger menu (☰)
4. Go to **Admin** section
5. Click **Test Runner**

#### 4. Run Tests

- **Filter tests**: Use the suite and category dropdowns
- **Search**: Type in the search bar to filter by name/description
- **Run all filtered**: Click "Run All Filtered Tests" to run all visible tests
- **Run individual**: Click the "Run" button next to a specific test
- **View results**: See progress bars, pass/fail status, and error messages

### Option 2: Command Line Interface

For CI/CD, debugging, or batch execution, use the CLI:

#### Run All Tests

```bash
npm run test:e2e
```

#### Run Specific Test Suite

```bash
npx playwright test tests/e2e/scenarios/market-event-not-live.spec.ts
```

#### Run Specific Test by ID

```bash
npx playwright test tests/e2e/scenarios/market-event-not-live.spec.ts -g "TC-1.1"
```

#### Run in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

#### Run with Playwright UI

```bash
npm run test:e2e:ui
```

Opens Playwright's interactive test runner with step-by-step execution.

#### Run in Debug Mode

```bash
npm run test:e2e:debug
```

Pauses execution and opens Playwright Inspector for debugging.

#### View Test Report

After running tests, view the HTML report:

```bash
npm run test:report
```

## Configuration

### Playwright Configuration

The `playwright.config.ts` file configures:

- **Test directory**: `tests/e2e/scenarios/`
- **Base URL**: `http://localhost:9000` (dev) or production URL
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome/Safari
- **Timeouts**: Default 30s, test timeout 60s
- **Retries**: 2 retries on failure
- **Reporters**: HTML, list, GitHub Actions, JSON
- **Screenshots/Videos**: Captured on failure

### Test Configuration

The `tests/config/test-config.ts` file contains:

- **Firebase config**: Test project credentials
- **Square config**: Test payment credentials
- **Test data**: Default customer info, addresses
- **Timeouts**: Custom timeouts for specific operations

### Environment Variables

For production or CI/CD, set these environment variables:

```bash
# Firebase
FIREBASE_PROJECT_ID=your-test-project
FIREBASE_API_KEY=your-api-key

# Square
SQUARE_APPLICATION_ID=your-app-id
SQUARE_ACCESS_TOKEN=your-access-token

# Test Server
TEST_API_PORT=3000
```

## Test Suites

The test harness includes the following test suites:

### 1. Market Event NOT Live

- **File**: `market-event-not-live.spec.ts`
- **Tests**: Online ordering scenarios when no market event is active
- **Coverage**: Credit card, Apple Pay, shipping, local pickup, bulk orders

### 2. Market Event LIVE - User Toggles "At Event"

- **File**: `market-event-live.spec.ts`
- **Tests**: Market event scenarios with user toggle enabled
- **Coverage**: Pay at tent, online payment, bulk orders at events

### 3. Market Event LIVE - Popup Flow

- **File**: `market-event-live.spec.ts`
- **Tests**: Market event dialog scenarios
- **Coverage**: Popup handling, toggle persistence, navigation

### 4. Authenticated User Scenarios

- **File**: `authenticated-users.spec.ts`
- **Tests**: Signed-in user flows
- **Coverage**: "My Orders" visibility, order history

### 5. Data Integrity and Button Functionality

- **File**: `data-integrity.spec.ts`
- **Tests**: Data validation and UI functionality
- **Coverage**: Sorting, search, receipt data, button states, upload progress

### 6. Edge Cases and Error Handling

- **File**: `edge-cases.spec.ts`
- **Tests**: Error scenarios and edge cases
- **Coverage**: Form validation, toggle persistence, order uniqueness

## Page Object Model

The test harness uses the **Page Object Model (POM)** pattern for maintainability:

### Benefits

- **Reusability**: Page interactions defined once
- **Maintainability**: UI changes require updates in one place
- **Readability**: Tests read like user stories
- **Reliability**: Centralized selectors and wait logic

### Example Usage

```typescript
import { LandingPage } from '../page-objects/LandingPage';

test('example', async ({ page }) => {
  const landingPage = new LandingPage(page);
  await landingPage.navigate();
  await landingPage.clickStartCreatingMagnets();
  // ...
});
```

## Test Data Management

### Test Data Factory

The `test-data-factory.ts` provides methods to generate consistent test data:

```typescript
import { TestDataFactory } from '../utils/test-data/test-data-factory';

const customer = TestDataFactory.createCustomer();
const address = TestDataFactory.createAddress();
const marketEvent = TestDataFactory.createMarketEvent();
```

### Image Generator

The `image-generator.ts` creates minimal test images programmatically:

```typescript
import { ImageGenerator } from '../utils/test-data/image-generator';

const imagePath = await ImageGenerator.generateTestImage('test-photo.png');
```

## Utilities

### Market Event Controller

Control market events for testing:

```typescript
import { MarketEventController } from '../utils/market-events/market-event-controller';

await MarketEventController.activateEvent('test-event-id');
await MarketEventController.deactivateEvent('test-event-id');
```

### Payment Mocker

Mock Square and Apple Pay payments:

```typescript
import { PaymentMocker } from '../utils/payments/payment-mocker';

await PaymentMocker.mockSquarePayment(page, { success: true, amount: 25.0 });
await PaymentMocker.mockApplePay(page, { success: true });
```

### Data Validators

Validate order data:

```typescript
import { DataValidators } from '../utils/validation/data-validators';

DataValidators.validateOrderNumber('ORD-12345');
DataValidators.validateOrderDate(new Date());
DataValidators.validateOrderTotal(25.0);
```

## Troubleshooting

### Common Issues

#### 404 Error: "The page could not be found"

**Causes:**

1. Test API server not running
2. Playwright browsers not installed
3. Test files missing

**Solutions:**

```bash
# 1. Start test server
npm run test:server

# 2. Install Playwright
npm run test:setup

# 3. Verify test files exist
ls tests/e2e/scenarios/
```

#### Tests Timeout

**Causes:**

- Slow network
- Large photo uploads
- Firebase connection issues

**Solutions:**

- Increase timeout in `playwright.config.ts`
- Check network connection
- Verify Firebase project is accessible

#### "Cannot find module" Errors

**Causes:**

- Missing dependencies
- TypeScript compilation issues

**Solutions:**

```bash
npm install
npx playwright install --with-deps
```

#### All Tests Fail When Running One

**Fixed!** The latest version properly isolates individual test execution. If you still see this:

1. Clear browser cache
2. Restart test server
3. Verify you're using the latest code

### Debugging Tips

1. **Use headed mode** to see what's happening:

   ```bash
   npm run test:e2e:headed
   ```

2. **Use Playwright UI** for step-by-step debugging:

   ```bash
   npm run test:e2e:ui
   ```

3. **Check browser console** for JavaScript errors

4. **Review test reports**:

   ```bash
   npm run test:report
   ```

5. **Enable verbose logging** in `playwright.config.ts`:
   ```typescript
   use: {
     trace: 'on',
     screenshot: 'on',
     video: 'on',
   }
   ```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:setup
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Vercel Deployment

**Note**: The test API server (`test-server.js`) is designed for **local development only**. For production/CI:

1. Use GitHub Actions or similar CI/CD
2. Or deploy test server to a separate Node.js hosting service
3. Or use Playwright's cloud service (Playwright Cloud)

The Vercel serverless functions cannot run Playwright due to binary size and execution time limits.

## Best Practices

1. **Keep tests independent**: Each test should be able to run in isolation
2. **Use Page Objects**: Don't duplicate selectors across tests
3. **Generate test data**: Use factories instead of hardcoded values
4. **Clean up**: Remove test data after tests complete
5. **Use meaningful test names**: Test IDs should clearly describe the scenario
6. **Add new tests**: When adding features, add corresponding test cases to `test-catalog.ts`

## Adding New Tests

1. **Create test file** in `tests/e2e/scenarios/`:

   ```typescript
   import { test, expect } from '@playwright/test';

   test('TC-X.X: New Test Name', async ({ page }) => {
     // Test implementation
   });
   ```

2. **Add to test catalog** in `tests/test-catalog.ts`:

   ```typescript
   {
     id: 'TC-X.X',
     name: 'New Test Name',
     description: 'Test description',
     suite: 'Suite Name',
     suiteFile: 'suite-file-name',
     category: 'Category',
     tags: ['tag1', 'tag2'],
   }
   ```

3. **Update Page Objects** if needed (new pages or interactions)

4. **Run the test** to verify it works

## Support

For issues or questions:

1. Check `TEST_RUNNER_TROUBLESHOOTING.md` for common issues
2. Review `TEST_RUNNER_QUICK_START.md` for quick reference
3. Check Playwright documentation: https://playwright.dev
4. Review test logs and error messages for specific issues

## Next Steps

After setup:

1. ✅ Run a simple test to verify setup
2. ✅ Explore the Test Runner UI
3. ✅ Review existing test scenarios
4. ✅ Add tests for new features
5. ✅ Set up CI/CD integration (optional)

---

**Last Updated**: December 2024
**Playwright Version**: 1.40.0
**Node.js Requirement**: 18+
