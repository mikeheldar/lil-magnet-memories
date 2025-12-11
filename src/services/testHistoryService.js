/**
 * Test History Service
 * Manages test run history and status tracking
 */

const STORAGE_KEY = 'test_run_history';

export const testHistoryService = {
  /**
   * Get test run history
   */
  getHistory() {
    try {
      const historyJson = localStorage.getItem(STORAGE_KEY);
      return historyJson ? JSON.parse(historyJson) : {};
    } catch (error) {
      console.error('Error reading test history:', error);
      return {};
    }
  },

  /**
   * Get last run info for a specific test
   */
  getLastRun(testId) {
    const history = this.getHistory();
    return history[testId] || null;
  },

  /**
   * Save test run result
   */
  saveTestResult(testId, result) {
    const history = this.getHistory();
    history[testId] = {
      lastRun: new Date().toISOString(),
      status: result.status, // 'passed', 'failed', 'skipped'
      duration: result.duration || 0,
      error: result.error || null,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving test history:', error);
    }
  },

  /**
   * Save multiple test results from a test run
   */
  saveTestResults(results) {
    if (!results || !results.suites) return;

    results.suites.forEach((suite) => {
      suite.tests.forEach((test) => {
        // Extract test ID from test name (e.g., "TC-1.1: ..." -> "TC-1.1")
        const match = test.name.match(/^(TC-[0-9]+\.[0-9]+)/);
        if (match) {
          const testId = match[1];
          this.saveTestResult(testId, {
            status: test.status,
            duration: test.duration,
            error: test.error,
          });
        }
      });
    });
  },

  /**
   * Clear all test history
   */
  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing test history:', error);
    }
  },
};
