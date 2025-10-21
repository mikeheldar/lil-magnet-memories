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
              <q-item-label>Project ID</q-item-label>
              <q-item-label caption>lil-magnet-memories</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Auth Domain</q-item-label>
              <q-item-label caption
                >lil-magnet-memories.firebaseapp.com</q-item-label
              >
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Storage Bucket</q-item-label>
              <q-item-label caption
                >lil-magnet-memories.firebasestorage.app</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <div class="text-h6 q-mb-md">Connection Tests</div>

        <div class="q-gutter-md">
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
            @click="runMinimalOrderTest"
            color="accent"
            :loading="minimalOrderTestLoading"
            class="full-width"
          >
            Test Minimal Order Write
          </q-btn>
        </div>
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
              </q-item-label>
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
import { ref } from 'vue';
import { firebaseTest } from '../services/firebaseTest';
import { useQuasar } from 'quasar';

export default {
  name: 'FirebaseDiagnostic',
  setup() {
    const $q = useQuasar();
    const connectionTestLoading = ref(false);
    const basicWriteTestLoading = ref(false);
    const minimalOrderTestLoading = ref(false);
    const testResults = ref([]);

    const addTestResult = (test, success, message) => {
      testResults.value.push({
        test,
        success,
        message,
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
          result.success ? 'Connected successfully' : result.error
        );
      } catch (error) {
        addTestResult('Firebase Connection', false, error.message);
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
          result.success ? `Document created: ${result.docId}` : result.error
        );
      } catch (error) {
        addTestResult('Basic Write Test', false, error.message);
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
          result.success ? `Order created: ${result.docId}` : result.error
        );
      } catch (error) {
        addTestResult('Minimal Order Write', false, error.message);
      } finally {
        minimalOrderTestLoading.value = false;
      }
    };

    return {
      connectionTestLoading,
      basicWriteTestLoading,
      minimalOrderTestLoading,
      testResults,
      runConnectionTest,
      runBasicWriteTest,
      runMinimalOrderTest,
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
