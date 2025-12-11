/**
 * API endpoint to run Playwright tests
 * This endpoint executes the test suite and returns results
 *
 * Works with both Express (local development) and Vercel serverless functions
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Handler function that works for both Express and Vercel
const handler = async (req, res) => {
  // Set CORS headers
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  // Handle OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { testSuite, testId } = req.body || {};

    // Determine which tests to run
    let testCommand = 'npx playwright test';

    if (testId) {
      // Run a specific test by ID (e.g., TC-1.1)
      // Playwright supports running tests by name pattern
      if (testSuite && testSuite !== 'all') {
        testCommand += ` tests/e2e/scenarios/${testSuite}.spec.ts -g "${testId}"`;
      } else {
        // Search all test files for this test ID
        testCommand += ` -g "${testId}"`;
      }
    } else if (testSuite && testSuite !== 'all') {
      // Run entire suite
      testCommand += ` tests/e2e/scenarios/${testSuite}.spec.ts`;
    }

    testCommand += ' --reporter=json';

    console.log(`Running tests: ${testCommand}`);

    // Run tests with timeout
    const { stdout, stderr } = await execAsync(testCommand, {
      cwd: process.cwd(),
      timeout: 300000, // 5 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });

    // Parse results
    let results;
    try {
      // Check if stdout is empty or invalid
      if (!stdout || stdout.trim() === '') {
        console.error('No output from Playwright');
        return res.status(500).json({
          error: 'No test results returned',
          message:
            'Playwright did not return any output. Check that tests exist and Playwright is installed.',
          stderr: stderr.substring(0, 1000),
        });
      }

      results = JSON.parse(stdout);
    } catch (parseError) {
      // If JSON parsing fails, check if it's a file not found error
      console.error('Failed to parse test results:', parseError);
      console.error('Stdout:', stdout.substring(0, 500));
      console.error('Stderr:', stderr.substring(0, 500));

      // Check for common errors
      if (stderr.includes('Cannot find module') || stderr.includes('ENOENT')) {
        return res.status(404).json({
          error: 'Test file not found',
          message: `Could not find test file. Make sure the test suite exists: ${
            testSuite || 'all'
          }`,
          details: stderr.substring(0, 1000),
        });
      }

      return res.status(500).json({
        error: 'Failed to parse test results',
        message: parseError.message,
        stdout: stdout.substring(0, 1000),
        stderr: stderr.substring(0, 1000),
      });
    }

    // Transform results to our format
    const testResults = {
      timestamp: new Date().toISOString(),
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      suites: [],
    };

    if (results.suites) {
      results.suites.forEach((suite) => {
        suite.specs.forEach((spec) => {
          spec.tests.forEach((test) => {
            testResults.total++;
            const status = test.results[0]?.status || 'unknown';
            if (status === 'passed') testResults.passed++;
            else if (status === 'failed') testResults.failed++;
            else if (status === 'skipped') testResults.skipped++;

            testResults.duration += test.results[0]?.duration || 0;

            // Find or create suite entry
            let suiteEntry = testResults.suites.find(
              (s) => s.name === suite.title
            );
            if (!suiteEntry) {
              suiteEntry = {
                name: suite.title,
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                tests: [],
              };
              testResults.suites.push(suiteEntry);
            }

            suiteEntry.total++;
            if (status === 'passed') suiteEntry.passed++;
            else if (status === 'failed') suiteEntry.failed++;
            else if (status === 'skipped') suiteEntry.skipped++;

            suiteEntry.tests.push({
              name: `${spec.title} - ${test.title}`,
              status,
              duration: test.results[0]?.duration || 0,
              error: test.results[0]?.error?.message,
            });
          });
        });
      });
    }

    // Save results to file
    const resultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    const resultsFile = path.join(
      resultsDir,
      `test-results-${Date.now()}.json`
    );
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));

    return res.status(200).json(testResults);
  } catch (error) {
    console.error('Error running tests:', error);

    // Check for specific error types
    let statusCode = 500;
    let errorMessage = 'Failed to run tests';

    if (error.code === 'ENOENT' || error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Test file or Playwright not found';
    } else if (
      error.code === 'ETIMEDOUT' ||
      error.message.includes('timeout')
    ) {
      statusCode = 504;
      errorMessage = 'Test execution timed out';
    }

    return res.status(statusCode).json({
      error: errorMessage,
      message: error.message,
      code: error.code,
      stdout: error.stdout?.substring(0, 1000),
      stderr: error.stderr?.substring(0, 1000),
    });
  }
};

// Export for both Express and Vercel
module.exports = handler;
