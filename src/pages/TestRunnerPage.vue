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

    <!-- Test Suite Selection -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="play_arrow" class="q-mr-sm" />
          Select Test Suite
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedSuite"
              :options="testSuites"
              label="Test Suite"
              filled
              emit-value
              map-options
            />
          </div>
          <div class="col-12 col-md-6">
            <q-btn
              color="primary"
              size="lg"
              icon="play_arrow"
              label="Run Tests"
              :loading="running"
              :disable="running"
              @click="runTests"
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Test Results -->
    <q-card v-if="testResults" class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="assessment" class="q-mr-sm" />
          Test Results
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

        <!-- Summary Stats -->
        <div class="row q-col-gutter-md q-mb-md">
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

        <!-- Duration -->
        <div v-if="testResults.duration" class="text-center q-mb-md">
          <div class="text-body2 text-grey-7">
            Total Duration: {{ formatDuration(testResults.duration) }}
          </div>
        </div>

        <!-- Test Suites -->
        <div v-if="testResults.suites && testResults.suites.length > 0">
          <q-expansion-item
            v-for="(suite, index) in testResults.suites"
            :key="index"
            :label="suite.name"
            :caption="`${suite.passed} passed, ${suite.failed} failed, ${suite.skipped} skipped`"
            :default-opened="suite.failed > 0"
            class="q-mb-sm"
          >
            <q-list>
              <q-item
                v-for="(test, testIndex) in suite.tests"
                :key="testIndex"
                :class="getTestItemClass(test.status)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="getTestIcon(test.status)"
                    :color="getTestColor(test.status)"
                    size="24px"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ test.name }}</q-item-label>
                  <q-item-label caption>
                    Duration: {{ formatDuration(test.duration) }}
                    <span v-if="test.error" class="text-negative q-ml-sm">
                      - {{ test.error }}
                    </span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip
                    :color="getTestColor(test.status)"
                    text-color="white"
                    size="sm"
                  >
                    {{ test.status.toUpperCase() }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </div>
      </q-card-section>
    </q-card>

    <!-- Error Message -->
    <q-banner
      v-if="error"
      class="bg-negative text-white q-mb-md"
      rounded
    >
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
    </q-banner>

    <!-- Loading State -->
    <q-card v-if="running && !testResults" class="q-mb-md">
      <q-card-section class="text-center q-pa-xl">
        <q-spinner color="primary" size="48px" />
        <div class="text-h6 q-mt-md">Running tests...</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          This may take a few minutes
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

export default {
  name: 'TestRunnerPage',
  setup() {
    const $q = useQuasar();
    const selectedSuite = ref('all');
    const running = ref(false);
    const testResults = ref(null);
    const error = ref(null);

    const testSuites = [
      { label: 'All Tests', value: 'all' },
      { label: 'Market Event Not Live', value: 'market-event-not-live' },
      { label: 'Market Event Live', value: 'market-event-live' },
      { label: 'Data Integrity', value: 'data-integrity' },
    ];

    const runTests = async () => {
      running.value = true;
      error.value = null;
      testResults.value = null;

      try {
        // For local development, try localhost API first, fallback to relative path
        const apiUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:3000/api/run-tests'
          : '/api/run-tests';
        
        const response = await axios.post(apiUrl, {
          testSuite: selectedSuite.value,
        }, {
          timeout: 300000, // 5 minute timeout for test execution
        });

        testResults.value = response.data;

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

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleString();
    };

    const formatDuration = (ms) => {
      if (!ms) return '0s';
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    };

    const getTestIcon = (status) => {
      switch (status) {
        case 'passed':
          return 'check_circle';
        case 'failed':
          return 'cancel';
        case 'skipped':
          return 'skip_next';
        default:
          return 'help';
      }
    };

    const getTestColor = (status) => {
      switch (status) {
        case 'passed':
          return 'positive';
        case 'failed':
          return 'negative';
        case 'skipped':
          return 'grey-7';
        default:
          return 'grey-6';
      }
    };

    const getTestItemClass = (status) => {
      return {
        'bg-positive-1': status === 'passed',
        'bg-negative-1': status === 'failed',
        'bg-grey-2': status === 'skipped',
      };
    };

    return {
      selectedSuite,
      running,
      testResults,
      error,
      testSuites,
      runTests,
      formatTimestamp,
      formatDuration,
      getTestIcon,
      getTestColor,
      getTestItemClass,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-item {
  border-radius: 4px;
  margin-bottom: 4px;
}
</style>

