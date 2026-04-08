import { defineConfig, devices } from '@playwright/test';

const testBaseUrl = process.env.TEST_BASE_URL || 'http://localhost:9000';
const skipLocalWebServer =
  process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1' ||
  /^https?:\/\//i.test(testBaseUrl) && !/localhost|127\.0\.0\.1/.test(testBaseUrl);

/**
 * Playwright configuration for Lil Magnet Memories E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    process.env.CI ? ['github'] : ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: testBaseUrl,
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Local dev server (skipped when testing a remote URL or PLAYWRIGHT_SKIP_WEBSERVER=1) */
  ...(skipLocalWebServer
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:9000',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }),
});

