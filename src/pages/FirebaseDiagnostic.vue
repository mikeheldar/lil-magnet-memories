<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Firebase Diagnostic Tool
      </div>
      <div class="text-subtitle1 text-grey-7">
        Test Firebase connection and identify issues
      </div>
    </div>

    <q-card class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Firebase Configuration</div>
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label>Environment</q-item-label>
              <q-item-label caption>{{ firebaseConfig.environment }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Project ID</q-item-label>
              <q-item-label caption>{{ firebaseConfig.projectId || 'Not configured' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Auth Domain</q-item-label>
              <q-item-label caption>{{ firebaseConfig.authDomain || 'Not configured' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Storage Bucket</q-item-label>
              <q-item-label caption>{{ firebaseConfig.storageBucket || 'Not configured' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>API Key</q-item-label>
              <q-item-label caption>{{ firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'Not configured' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>App ID</q-item-label>
              <q-item-label caption>{{ firebaseConfig.appId || 'Not configured' }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-h6 q-mb-md">Connection Tests</div>

        <div class="q-gutter-md">
          <q-btn
            @click="runDiagnosticInfo"
            color="info"
            :loading="diagnosticLoading"
            class="full-width"
            icon="info"
          >
            Run Full Diagnostic
          </q-btn>

          <q-btn
            @click="runConnectionTest"
            color="primary"
            :loading="connectionTestLoading"
            class="full-width"
          >
            Test Firebase Connection
          </q-btn>

          <q-btn
            @click="runBasicWriteTest"
            color="secondary"
            :loading="basicWriteTestLoading"
            class="full-width"
          >
            Test Basic Firestore Write
          </q-btn>

          <q-btn
            @click="runRetryTest"
            color="orange"
            :loading="retryTestLoading"
            class="full-width"
          >
            Test with Retry Mechanism
          </q-btn>

          <q-btn
            @click="runMinimalOrderTest"
            color="accent"
            :loading="minimalOrderTestLoading"
            class="full-width"
          >
            Test Minimal Order Write
          </q-btn>
        </div>
      </q-card-section>

      <q-separator v-if="diagnosticInfo" />

      <q-card-section v-if="diagnosticInfo">
        <div class="text-h6 q-mb-md">Diagnostic Information</div>
        <q-expansion-item
          v-for="(section, key) in diagnosticInfo"
          :key="key"
          :label="formatLabel(key)"
          :caption="getSectionSummary(section)"
          icon="info"
          class="q-mb-sm"
        >
          <pre class="q-pa-md bg-grey-1 rounded-borders text-caption">{{ JSON.stringify(section, null, 2) }}</pre>
        </q-expansion-item>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-h6 q-mb-md">Test Results</div>

        <div v-if="testResults.length === 0" class="text-center text-grey-6">
          No tests run yet
        </div>

        <q-list v-else>
          <q-item
            v-for="(result, index) in testResults"
            :key="index"
            class="q-mb-sm"
          >
            <q-item-section avatar>
              <q-icon
                :name="result.success ? 'check_circle' : 'error'"
                :color="result.success ? 'positive' : 'negative'"
                size="24px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ result.test }}</q-item-label>
              <q-item-label caption>
                {{ result.success ? 'Success' : 'Failed' }}:
                {{ result.message }}
                <span v-if="result.code" class="text-grey-6"> ({{ result.code }})</span>
              </q-item-label>
              <q-expansion-item
                v-if="result.details"
                label="View Details"
                dense
                class="q-mt-xs"
              >
                <pre class="q-pa-sm bg-grey-1 rounded-borders text-caption">{{ JSON.stringify(result.details, null, 2) }}</pre>
              </q-expansion-item>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-h6 q-mb-md">Recommended Actions</div>
        <q-list dense>
          <q-item>
            <q-item-section avatar>
              <q-icon name="security" color="warning" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Check Firestore Security Rules</q-item-label>
              <q-item-label caption>
                Ensure rules allow writes to 'orders' and 'test' collections
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="account_balance" color="info" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Verify Firebase Project Status</q-item-label>
              <q-item-label caption>
                Check if project has billing enabled and quotas available
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-icon name="domain" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Check Domain Authorization</q-item-label>
              <q-item-label caption>
                Ensure your Vercel domain is authorized in Firebase console
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <div class="text-center q-mt-lg">
      <q-btn
        flat
        color="primary"
        @click="$router.push('/upload')"
        icon="arrow_back"
        label="Back to Upload"
      />
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue';
import { firebaseTest } from '../services/firebaseTest';
import { useQuasar } from 'quasar';
import { config } from '../config/environment.js';

export default {
  name: 'FirebaseDiagnostic',
  setup() {
    const $q = useQuasar();
    const connectionTestLoading = ref(false);
    const basicWriteTestLoading = ref(false);
    const minimalOrderTestLoading = ref(false);
    const retryTestLoading = ref(false);
    const diagnosticLoading = ref(false);
    const testResults = ref([]);
    const diagnosticInfo = ref(null);

    // Get actual Firebase configuration being used
    const firebaseConfig = computed(() => ({
      environment: config.environment,
      projectId: config.firebase.projectId,
      authDomain: config.firebase.authDomain,
      storageBucket: config.firebase.storageBucket,
      apiKey: config.firebase.apiKey,
      appId: config.firebase.appId,
    }));

    const addTestResult = (test, success, message, details = null) => {
      testResults.value.push({
        test,
        success,
        message,
        code: details?.code,
        details,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    const runConnectionTest = async () => {
      connectionTestLoading.value = true;
      try {
        const result = await firebaseTest.testConnection();
        addTestResult(
          'Firebase Connection',
          result.success,
          result.success ? 'Connected successfully' : result.error,
          result
        );
      } catch (error) {
        addTestResult('Firebase Connection', false, error.message, { error: error.message, code: error.code });
      } finally {
        connectionTestLoading.value = false;
      }
    };

    const runBasicWriteTest = async () => {
      basicWriteTestLoading.value = true;
      try {
        const result = await firebaseTest.testBasicWrite();
        addTestResult(
          'Basic Write Test',
          result.success,
          result.success ? `Document created: ${result.docId}` : result.error,
          result
        );
      } catch (error) {
        addTestResult('Basic Write Test', false, error.message, { error: error.message, code: error.code });
      } finally {
        basicWriteTestLoading.value = false;
      }
    };

    const runMinimalOrderTest = async () => {
      minimalOrderTestLoading.value = true;
      try {
        const result = await firebaseTest.testMinimalOrderWrite();
        addTestResult(
          'Minimal Order Write',
          result.success,
          result.success ? `Order created: ${result.docId}` : result.error,
          result
        );
      } catch (error) {
        addTestResult('Minimal Order Write', false, error.message, { error: error.message, code: error.code });
      } finally {
        minimalOrderTestLoading.value = false;
      }
    };

    const runRetryTest = async () => {
      retryTestLoading.value = true;
      try {
        const result = await firebaseTest.testWithRetry();
        addTestResult(
          'Retry Mechanism Test',
          result.success,
          result.success ? `Document created with retry: ${result.docId}` : result.error,
          result
        );
      } catch (error) {
        addTestResult('Retry Mechanism Test', false, error.message, { error: error.message, code: error.code });
      } finally {
        retryTestLoading.value = false;
      }
    };

    const runDiagnosticInfo = async () => {
      diagnosticLoading.value = true;
      try {
        const info = await firebaseTest.getDiagnosticInfo();
        diagnosticInfo.value = info;
        addTestResult(
          'Full Diagnostic',
          info.errors.length === 0 && info.firestore.canRead,
          info.errors.length === 0 
            ? 'All checks passed' 
            : `${info.errors.length} issue(s) found - see diagnostic info below`,
          info
        );
      } catch (error) {
        addTestResult('Full Diagnostic', false, error.message, { error: error.message });
      } finally {
        diagnosticLoading.value = false;
      }
    };

    const formatLabel = (key) => {
      const labels = {
        timestamp: 'Timestamp',
        environment: 'Environment',
        browser: 'Browser Info',
        firebase: 'Firebase Config',
        auth: 'Authentication',
        firestore: 'Firestore Status',
        indexedDB: 'IndexedDB',
        errors: 'Errors',
      };
      return labels[key] || key;
    };

    const getSectionSummary = (section) => {
      if (typeof section === 'object' && section !== null) {
        if (section.online !== undefined) return `Online: ${section.online}`;
        if (section.canRead !== undefined) return `Can Read: ${section.canRead}, Can Write: ${section.canWrite || 'unknown'}`;
        if (section.hasUser !== undefined) return `User: ${section.hasUser ? (section.email || 'anonymous') : 'none'}`;
        if (Array.isArray(section)) return `${section.length} items`;
        if (section.available !== undefined) return `Available: ${section.available}`;
      }
      return '';
    };

    return {
      firebaseConfig,
      connectionTestLoading,
      basicWriteTestLoading,
      minimalOrderTestLoading,
      retryTestLoading,
      diagnosticLoading,
      testResults,
      diagnosticInfo,
      runConnectionTest,
      runBasicWriteTest,
      runMinimalOrderTest,
      runRetryTest,
      runDiagnosticInfo,
      formatLabel,
      getSectionSummary,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}
</style>
