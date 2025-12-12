/**
 * Test Runner Utility
 * Executes all test scenarios and collects results
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface TestResult {
  testCase: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface TestSuiteResult {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  duration: number;
}

export class TestRunner {
  /**
   * Run all test scenarios
   */
  static async runAllTests(): Promise<TestSuiteResult[]> {
    const suites = [
      'tests/e2e/scenarios/market-event-not-live.spec.ts',
      'tests/e2e/scenarios/market-event-live.spec.ts',
      'tests/e2e/scenarios/data-integrity.spec.ts',
    ];

    const results: TestSuiteResult[] = [];

    for (const suite of suites) {
      try {
        const result = await this.runTestSuite(suite);
        results.push(result);
      } catch (error) {
        console.error(`Error running suite ${suite}:`, error);
      }
    }

    return results;
  }

  /**
   * Run a single test suite
   */
  static async runTestSuite(suitePath: string): Promise<TestSuiteResult> {
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(
        `npx playwright test ${suitePath} --reporter=json`
      );

      // Parse Playwright JSON output
      const jsonOutput = JSON.parse(stdout);

      const results: TestResult[] = jsonOutput.suites.flatMap((suite: any) =>
        suite.specs.flatMap((spec: any) =>
          spec.tests.map((test: any) => ({
            testCase: `${spec.title} - ${test.title}`,
            status:
              test.results[0]?.status === 'passed'
                ? 'passed'
                : test.results[0]?.status === 'skipped'
                ? 'skipped'
                : 'failed',
            duration: test.results[0]?.duration || 0,
            error: test.results[0]?.error?.message,
          }))
        )
      );

      const passed = results.filter((r) => r.status === 'passed').length;
      const failed = results.filter((r) => r.status === 'failed').length;
      const skipped = results.filter((r) => r.status === 'skipped').length;

      return {
        suite: suitePath,
        total: results.length,
        passed,
        failed,
        skipped,
        results,
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        suite: suitePath,
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        results: [],
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Save test results to file
   */
  static saveResults(
    results: TestSuiteResult[],
    filename: string = 'test-results.json'
  ): void {
    const outputPath = join(process.cwd(), 'test-results', filename);
    writeFileSync(outputPath, JSON.stringify(results, null, 2));
  }
}

