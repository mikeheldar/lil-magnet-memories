/**
 * TestGrid Service
 * Integration with TestGrid API for running tests
 */

import axios from 'axios';

const TESTGRID_API_URL =
  process.env.VITE_TESTGRID_API_URL || 'https://testgrid.readyera.com/api';
const TESTGRID_API_KEY = process.env.VITE_TESTGRID_API_KEY;
const PROJECT_ID = 'lilmagnetmemories';
const COMPANY_ID = 'readyera';

export const testGridService = {
  /**
   * Run a test or test suite
   * @param {Object} options - Test execution options
   * @param {string} options.testCaseId - Optional: specific test case ID (e.g., 'TC-1.1')
   * @param {string} options.testSuite - Optional: test suite file name
   * @param {string} options.testPlanId - Optional: test plan ID
   * @returns {Promise<Object>} Test execution results
   */
  async runTest(options = {}) {
    try {
      const response = await axios.post(
        `${TESTGRID_API_URL}/run-tests`,
        {
          projectId: PROJECT_ID,
          companyId: COMPANY_ID,
          ...options,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(TESTGRID_API_KEY && {
              Authorization: `Bearer ${TESTGRID_API_KEY}`,
            }),
          },
          timeout: 300000, // 5 minutes
        }
      );
      return response.data;
    } catch (error) {
      console.error('TestGrid API error:', error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Failed to run tests'
      );
    }
  },

  /**
   * Get test run history
   * @param {number} limit - Maximum number of runs to return
   * @returns {Promise<Array>} Array of test runs
   */
  async getTestRuns(limit = 50) {
    try {
      const response = await axios.get(`${TESTGRID_API_URL}/test-runs`, {
        params: {
          projectId: PROJECT_ID,
          companyId: COMPANY_ID,
          limit,
        },
        headers: {
          ...(TESTGRID_API_KEY && {
            Authorization: `Bearer ${TESTGRID_API_KEY}`,
          }),
        },
      });
      return response.data.runs || [];
    } catch (error) {
      console.error('TestGrid API error:', error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Failed to get test runs'
      );
    }
  },

  /**
   * Get a specific test run by ID
   * @param {string} runId - Test run ID
   * @returns {Promise<Object>} Test run details
   */
  async getTestRun(runId) {
    try {
      const response = await axios.get(`${TESTGRID_API_URL}/test-runs`, {
        params: {
          projectId: PROJECT_ID,
          companyId: COMPANY_ID,
          runId,
        },
        headers: {
          ...(TESTGRID_API_KEY && {
            Authorization: `Bearer ${TESTGRID_API_KEY}`,
          }),
        },
      });
      return response.data;
    } catch (error) {
      console.error('TestGrid API error:', error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Failed to get test run'
      );
    }
  },

  /**
   * Get test plans for the project
   * @returns {Promise<Array>} Array of test plans
   */
  async getTestPlans() {
    try {
      const response = await axios.get(`${TESTGRID_API_URL}/test-plans`, {
        params: {
          projectId: PROJECT_ID,
          companyId: COMPANY_ID,
        },
        headers: {
          ...(TESTGRID_API_KEY && {
            Authorization: `Bearer ${TESTGRID_API_KEY}`,
          }),
        },
      });
      return response.data.plans || [];
    } catch (error) {
      console.error('TestGrid API error:', error);
      throw new Error(
        error.response?.data?.error ||
          error.message ||
          'Failed to get test plans'
      );
    }
  },
};
