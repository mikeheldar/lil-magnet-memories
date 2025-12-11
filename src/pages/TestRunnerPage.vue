<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        <q-icon name="bug_report" size="32px" class="q-mr-sm" />
        Test Runner
      </div>
      <div class="text-subtitle1 text-grey-7">
        Run automated test suites and view results
      </div>
    </div>

    <!-- Filters and Search -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedSuite"
              :options="testSuites"
              label="Filter by Suite"
              filled
              emit-value
              map-options
              clearable
            />
          </div>
          <div class="col-12 col-md-4">
            <q-select
              v-model="selectedCategory"
              :options="categories"
              label="Filter by Category"
              filled
              emit-value
              map-options
              clearable
            />
          </div>
          <div class="col-12 col-md-4">
            <q-input
              v-model="searchQuery"
              label="Search Tests"
              filled
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>

        <div class="row items-center justify-between">
          <div class="col-auto">
            <q-btn
              color="primary"
              size="lg"
              icon="play_arrow"
              label="Run All Filtered Tests"
              :loading="running"
              :disable="running || filteredTests.length === 0"
              @click="runTests"
            />
          </div>
          <div class="col-auto">
            <q-btn
              flat
              color="grey-7"
              size="sm"
              icon="refresh"
              label="Clear History"
              @click="clearHistory"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Test List -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="list" class="q-mr-sm" />
          Test Cases
          <q-chip color="grey-6" text-color="white" size="sm" class="q-ml-sm">
            {{ filteredTests.length }} test{{
              filteredTests.length !== 1 ? 's' : ''
            }}
          </q-chip>
        </div>

        <!-- Test Table/List -->
        <q-list bordered separator>
          <q-item
            v-for="testCase in filteredTests"
            :key="testCase.id"
            :class="getTestRowClass(testCase)"
            class="test-row"
          >
            <q-item-section avatar>
              <q-icon
                :name="getTestStatusIcon(testCase)"
                :color="getTestStatusColor(testCase)"
                size="28px"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ testCase.id }}: {{ testCase.name }}
              </q-item-label>
              <q-item-label caption class="text-grey-7">
                {{ testCase.description }}
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                <q-chip
                  :color="getCategoryColor(testCase.category)"
                  text-color="white"
                  size="xs"
                  class="q-mr-xs"
                >
                  {{ testCase.category }}
                </q-chip>
                <q-chip
                  v-for="tag in testCase.tags.slice(0, 3)"
                  :key="tag"
                  color="grey-6"
                  text-color="white"
                  size="xs"
                  class="q-mr-xs"
                >
                  {{ tag }}
                </q-chip>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="column items-end q-gutter-xs">
                <!-- Last Run Status -->
                <div v-if="getLastRun(testCase.id)" class="text-right">
                  <q-chip
                    :color="getTestStatusColor(testCase)"
                    text-color="white"
                    size="sm"
                    :icon="getTestStatusIcon(testCase)"
                  >
                    {{ getLastRunStatus(testCase.id) }}
                  </q-chip>
                  <div class="text-caption text-grey-7 q-mt-xs">
                    {{ formatLastRunDate(testCase.id) }}
                  </div>
                </div>
                <div v-else class="text-caption text-grey-5">Never run</div>

                <!-- Progress Bar (when running) -->
                <div
                  v-if="runningTests[testCase.id]"
                  class="q-mt-sm"
                  style="width: 200px"
                >
                  <q-linear-progress
                    :value="runningTests[testCase.id].progress"
                    :color="
                      runningTests[testCase.id].status === 'failed'
                        ? 'negative'
                        : 'primary'
                    "
                    :indeterminate="
                      runningTests[testCase.id].status === 'running'
                    "
                    size="8px"
                    class="q-mb-xs"
                  />
                  <div class="text-caption text-center">
                    <span
                      v-if="runningTests[testCase.id].status === 'running'"
                      class="text-primary"
                    >
                      Running...
                    </span>
                    <span
                      v-else-if="runningTests[testCase.id].status === 'failed'"
                      class="text-negative"
                    >
                      Failed
                    </span>
                    <span
                      v-else-if="runningTests[testCase.id].status === 'passed'"
                      class="text-positive"
                    >
                      Passed
                    </span>
                  </div>
                  <div
                    v-if="runningTests[testCase.id].error"
                    class="text-caption text-negative q-mt-xs"
                    style="max-width: 200px; word-wrap: break-word"
                  >
                    {{ runningTests[testCase.id].error }}
                  </div>
                </div>

                <!-- Run Individual Test Button -->
                <q-btn
                  v-if="!runningTests[testCase.id]"
                  flat
                  dense
                  size="sm"
                  color="primary"
                  icon="play_arrow"
                  label="Run"
                  @click="runSingleTest(testCase)"
                  :disable="running"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Empty State -->
        <div v-if="filteredTests.length === 0" class="text-center q-pa-xl">
          <q-icon
            name="search_off"
            size="64px"
            color="grey-4"
            class="q-mb-md"
          />
          <div class="text-h6 text-grey-6">No tests match your filters</div>
          <div class="text-body2 text-grey-5 q-mt-sm">
            Try adjusting your search or filter criteria
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Results Card (after run) -->
    <q-card v-if="testResults && !running" class="q-mt-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="assessment" class="q-mr-sm" />
          Last Run Summary
          <q-chip
            v-if="testResults.timestamp"
            color="grey-6"
            text-color="white"
            size="sm"
            class="q-ml-sm"
          >
            {{ formatTimestamp(testResults.timestamp) }}
          </q-chip>
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center">
              <q-card-section>
                <div class="text-h4 text-weight-bold text-primary">
                  {{ testResults.total || 0 }}
                </div>
                <div class="text-caption text-grey-7">Total Tests</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center">
              <q-card-section>
                <div class="text-h4 text-weight-bold text-positive">
                  {{ testResults.passed || 0 }}
                </div>
                <div class="text-caption text-grey-7">Passed</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center">
              <q-card-section>
                <div class="text-h4 text-weight-bold text-negative">
                  {{ testResults.failed || 0 }}
                </div>
                <div class="text-caption text-grey-7">Failed</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3">
            <q-card flat bordered class="text-center">
              <q-card-section>
                <div class="text-h4 text-weight-bold text-grey-7">
                  {{ testResults.skipped || 0 }}
                </div>
                <div class="text-caption text-grey-7">Skipped</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Error Message -->
    <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
    </q-banner>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';
import {
  testCatalog,
  getTestsBySuite,
  searchTests,
} from '../../tests/test-catalog';
import { testHistoryService } from '../services/testHistoryService';

export default {
  name: 'TestRunnerPage',
  setup() {
    const $q = useQuasar();
    const selectedSuite = ref(null);
    const selectedCategory = ref(null);
    const searchQuery = ref('');
    const running = ref(false);
    const testResults = ref(null);
    const error = ref(null);
    const runningTests = ref({});

    const testSuites = [
      { label: 'All Suites', value: null },
      { label: 'Market Event Not Live', value: 'market-event-not-live' },
      { label: 'Market Event Live', value: 'market-event-live' },
      { label: 'Data Integrity', value: 'data-integrity' },
      { label: 'Authenticated Users', value: 'authenticated-users' },
      { label: 'Edge Cases', value: 'edge-cases' },
    ];

    const categories = computed(() => {
      const cats = [...new Set(testCatalog.map((t) => t.category))];
      return [
        { label: 'All Categories', value: null },
        ...cats.map((c) => ({ label: c, value: c })),
      ];
    });

    // Filter tests based on suite, category, and search
    const filteredTests = computed(() => {
      let tests = testCatalog;

      // Filter by suite
      if (selectedSuite.value) {
        tests = getTestsBySuite(selectedSuite.value);
      }

      // Filter by category
      if (selectedCategory.value) {
        tests = tests.filter((t) => t.category === selectedCategory.value);
      }

      // Filter by search query
      if (searchQuery.value) {
        tests = searchTests(searchQuery.value);
        // Also apply suite and category filters to search results
        if (selectedSuite.value) {
          tests = tests.filter((t) => t.suiteFile === selectedSuite.value);
        }
        if (selectedCategory.value) {
          tests = tests.filter((t) => t.category === selectedCategory.value);
        }
      }

      return tests;
    });

    const runTests = async () => {
      if (filteredTests.value.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'No tests to run',
          caption: 'Please adjust your filters to select tests',
          position: 'top',
        });
        return;
      }

      running.value = true;
      error.value = null;
      testResults.value = null;
      runningTests.value = {};

      // Initialize only the tests that will actually run
      // If a specific suite is selected, only mark those tests
      const testsToRun = selectedSuite.value 
        ? filteredTests.value.filter(t => t.suiteFile === selectedSuite.value)
        : filteredTests.value;
      
      testsToRun.forEach((testCase) => {
        runningTests.value[testCase.id] = {
          status: 'running',
          progress: 0,
          error: null,
        };
      });

      try {
        // Determine which suite file to run
        const suiteFile = selectedSuite.value || 'all';

        const apiUrl =
          window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api/run-tests'
            : '/api/run-tests';

        const response = await axios.post(
          apiUrl,
          {
            testSuite: suiteFile,
          },
          {
            timeout: 300000, // 5 minute timeout
          }
        );

        testResults.value = response.data;

        // Update running tests with results
        // Only update tests that were actually running (not all tests)
        if (testResults.value.suites) {
          testResults.value.suites.forEach((suite) => {
            suite.tests.forEach((test) => {
              const match = test.name.match(/^(TC-[0-9]+\.[0-9]+)/);
              if (match) {
                const testId = match[1];
                // Only update if this test was in our running list
                if (runningTests.value[testId]) {
                  runningTests.value[testId] = {
                    status: test.status,
                    progress:
                      test.status === 'passed'
                        ? 1
                        : test.status === 'failed'
                        ? 1
                        : 0,
                    error: test.error || null,
                  };
                  // Save to history
                  testHistoryService.saveTestResult(testId, {
                    status: test.status,
                    duration: test.duration,
                    error: test.error,
                  });
                }
              }
            });
          });
        }

        // Save results to history
        testHistoryService.saveTestResults(testResults.value);

        $q.notify({
          type: testResults.value.failed === 0 ? 'positive' : 'warning',
          message:
            testResults.value.failed === 0
              ? 'All tests passed!'
              : `${testResults.value.failed} test(s) failed`,
          position: 'top',
          timeout: 5000,
        });
      } catch (err) {
        console.error('Error running tests:', err);
        error.value =
          err.response?.data?.error ||
          err.message ||
          'Failed to run tests. Please check the server logs.';

        // Mark only currently running tests as failed
        Object.keys(runningTests.value).forEach((testId) => {
          if (runningTests.value[testId].status === 'running') {
            runningTests.value[testId] = {
              status: 'failed',
              progress: 1,
              error: error.value,
            };
            // Save failed status to history
            testHistoryService.saveTestResult(testId, {
              status: 'failed',
              duration: 0,
              error: error.value,
            });
          }
        });

        $q.notify({
          type: 'negative',
          message: 'Failed to run tests',
          caption: error.value,
          position: 'top',
          timeout: 8000,
        });
      } finally {
        running.value = false;
      }
    };

    const runSingleTest = async (testCase) => {
      running.value = true;
      error.value = null;
      testResults.value = null;
      runningTests.value = {};

      // Initialize only this test as running
      runningTests.value[testCase.id] = {
        status: 'running',
        progress: 0,
        error: null,
      };

      try {
        const apiUrl =
          window.location.hostname === 'localhost'
            ? 'http://localhost:3000/api/run-tests'
            : '/api/run-tests';

        const response = await axios.post(
          apiUrl,
          {
            testSuite: testCase.suiteFile,
            testId: testCase.id, // Pass the specific test ID
          },
          {
            timeout: 300000,
          }
        );

        testResults.value = response.data;

        // Update only this test's status
        if (testResults.value.suites) {
          testResults.value.suites.forEach((suite) => {
            suite.tests.forEach((test) => {
              const match = test.name.match(/^(TC-[0-9]+\.[0-9]+)/);
              if (match && match[1] === testCase.id) {
                runningTests.value[testCase.id] = {
                  status: test.status,
                  progress: test.status === 'passed' ? 1 : test.status === 'failed' ? 1 : 0,
                  error: test.error || null,
                };
                // Save to history
                testHistoryService.saveTestResult(testCase.id, {
                  status: test.status,
                  duration: test.duration,
                  error: test.error,
                });
              }
            });
          });
        }

        $q.notify({
          type: runningTests.value[testCase.id]?.status === 'passed' ? 'positive' : 'negative',
          message: runningTests.value[testCase.id]?.status === 'passed' 
            ? 'Test passed!' 
            : 'Test failed',
          position: 'top',
          timeout: 5000,
        });
      } catch (err) {
        console.error('Error running test:', err);
        error.value =
          err.response?.data?.error ||
          err.message ||
          'Failed to run test. Please check the server logs.';

        runningTests.value[testCase.id] = {
          status: 'failed',
          progress: 1,
          error: error.value,
        };

        $q.notify({
          type: 'negative',
          message: 'Failed to run test',
          caption: error.value,
          position: 'top',
          timeout: 8000,
        });
      } finally {
        running.value = false;
      }
    };

    const getLastRun = (testId) => {
      return testHistoryService.getLastRun(testId);
    };

    const getLastRunStatus = (testId) => {
      const lastRun = getLastRun(testId);
      if (!lastRun) return 'Never run';
      return lastRun.status === 'passed'
        ? 'Passed'
        : lastRun.status === 'failed'
        ? 'Failed'
        : 'Skipped';
    };

    const formatLastRunDate = (testId) => {
      const lastRun = getLastRun(testId);
      if (!lastRun) return '';
      const date = new Date(lastRun.lastRun);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    const getTestStatusIcon = (testCase) => {
      const lastRun = getLastRun(testCase.id);
      if (runningTests.value[testCase.id]) {
        const status = runningTests.value[testCase.id].status;
        if (status === 'running') return 'hourglass_empty';
        if (status === 'failed') return 'cancel';
        if (status === 'passed') return 'check_circle';
        return 'skip_next';
      }
      if (lastRun) {
        if (lastRun.status === 'passed') return 'check_circle';
        if (lastRun.status === 'failed') return 'cancel';
        return 'skip_next';
      }
      return 'help_outline';
    };

    const getTestStatusColor = (testCase) => {
      const lastRun = getLastRun(testCase.id);
      if (runningTests.value[testCase.id]) {
        const status = runningTests.value[testCase.id].status;
        if (status === 'running') return 'primary';
        if (status === 'failed') return 'negative';
        if (status === 'passed') return 'positive';
        return 'grey-7';
      }
      if (lastRun) {
        if (lastRun.status === 'passed') return 'positive';
        if (lastRun.status === 'failed') return 'negative';
        return 'grey-7';
      }
      return 'grey-6';
    };

    const getTestRowClass = (testCase) => {
      const lastRun = getLastRun(testCase.id);
      if (runningTests.value[testCase.id]) {
        const status = runningTests.value[testCase.id].status;
        if (status === 'failed') return 'bg-negative-1';
        if (status === 'passed') return 'bg-positive-1';
        if (status === 'running') return 'bg-blue-1';
      }
      if (lastRun) {
        if (lastRun.status === 'failed') return 'bg-negative-1';
        if (lastRun.status === 'passed') return 'bg-positive-1';
      }
      return '';
    };

    const getCategoryColor = (category) => {
      const colors = {
        'Online Orders': 'blue',
        'Market Events': 'green',
        Authentication: 'purple',
        'Data Integrity': 'orange',
        'Edge Cases': 'grey',
      };
      return colors[category] || 'grey-6';
    };

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    const clearHistory = () => {
      $q.dialog({
        title: 'Clear Test History',
        message: 'Are you sure you want to clear all test run history?',
        cancel: true,
        persistent: true,
      }).onOk(() => {
        testHistoryService.clearHistory();
        $q.notify({
          type: 'positive',
          message: 'Test history cleared',
          position: 'top',
        });
      });
    };

    return {
      selectedSuite,
      selectedCategory,
      searchQuery,
      running,
      testResults,
      error,
      runningTests,
      testSuites,
      categories,
      filteredTests,
      runTests,
      runSingleTest,
      getLastRun,
      getLastRunStatus,
      formatLastRunDate,
      getTestStatusIcon,
      getTestStatusColor,
      getTestRowClass,
      getCategoryColor,
      formatTimestamp,
      clearHistory,
    };
  },
};
</script>

<style lang="scss" scoped>
.test-row {
  border-radius: 4px;
  margin-bottom: 4px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
</style>
