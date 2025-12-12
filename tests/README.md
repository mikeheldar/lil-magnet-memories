# Test Harness for Lil Magnet Memories

This directory contains the comprehensive test suite for the Lil Magnet Memories application.

## Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── scenarios/          # Test scenarios organized by feature
│   └── fixtures/          # Test fixtures and data
├── page-objects/          # Page Object Model classes
├── utils/                 # Test utilities and helpers
│   ├── test-data/        # Test data factories
│   ├── market-events/    # Market event control utilities
│   ├── payments/         # Payment mocking utilities
│   └── validation/       # Data validation helpers
├── config/                # Test configuration files
└── playwright.config.ts   # Playwright configuration
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test scenario
```bash
npm run test:e2e -- tests/e2e/scenarios/market-event-not-live.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

## Test Scenarios

The test suite is organized according to the comprehensive test plan:

1. **Market Event NOT Live** - Online order scenarios
2. **Market Event Live - Toggle ON** - Market event with user toggle
3. **Market Event Live - Popup Flow** - Market event with dialog
4. **Authenticated Users** - Signed-in user scenarios
5. **Data Integrity** - Validation and button functionality
6. **Edge Cases** - Error handling and edge cases

## Prerequisites

- Node.js 18+
- Test Firebase project configured
- Test Square payment credentials
- Test images available in `tests/fixtures/images/`

