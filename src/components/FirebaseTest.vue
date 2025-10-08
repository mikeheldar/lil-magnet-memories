<template>
  <div class="firebase-test q-pa-md">
    <q-card class="q-mb-md">
      <q-card-section>
        <h4 class="q-ma-none">🔥 Firebase Integration Test</h4>
      </q-card-section>

      <q-card-section>
        <div v-if="firebaseConnected" class="text-positive q-mb-md">
          <q-icon name="check_circle" size="sm" class="q-mr-sm" />
          Firebase Connected Successfully!
        </div>

        <div v-else class="text-negative q-mb-md">
          <q-icon name="error" size="sm" class="q-mr-sm" />
          Firebase Not Connected
        </div>

        <div class="q-mb-md">
          <strong>Config Status:</strong>
          <ul class="q-mt-sm">
            <li>API Key: {{ configStatus.apiKey }}</li>
            <li>Project ID: {{ configStatus.projectId }}</li>
            <li>Auth Domain: {{ configStatus.authDomain }}</li>
          </ul>
        </div>

        <q-btn
          @click="testFirestore"
          color="primary"
          :loading="testing"
          :disable="!firebaseConnected"
          icon="cloud"
        >
          Test Firestore Connection
        </q-btn>

        <div v-if="testResult" class="q-mt-md">
          <q-banner
            :class="testResult.includes('✅') ? 'bg-positive' : 'bg-negative'"
            rounded
          >
            <template v-slot:avatar>
              <q-icon
                :name="testResult.includes('✅') ? 'check_circle' : 'error'"
              />
            </template>
            {{ testResult }}
          </q-banner>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { auth, db } from '../boot/firebase';
import { collection, getDocs } from 'firebase/firestore';

const firebaseConnected = ref(false);
const testing = ref(false);
const testResult = ref('');
const configStatus = ref({
  apiKey: 'Not set',
  projectId: 'Not set',
  authDomain: 'Not set',
});

onMounted(() => {
  // Check if Firebase is properly initialized
  if (auth && db) {
    firebaseConnected.value = true;
    configStatus.value = {
      apiKey: process.env.FIREBASE_API_KEY ? 'Set' : 'Not set',
      projectId: process.env.FIREBASE_PROJECT_ID || 'Not set',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'Not set',
    };
  }
});

const testFirestore = async () => {
  if (!firebaseConnected.value) return;

  testing.value = true;
  testResult.value = '';

  try {
    // Try to read from a test collection
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);

    testResult.value = `✅ Firestore connection successful! Found ${snapshot.size} documents in test collection.`;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    testResult.value = `❌ Firestore error: ${errorMessage}`;
  } finally {
    testing.value = false;
  }
};
</script>

<style scoped>
.firebase-test {
  max-width: 600px;
  margin: 0 auto;
}
</style>

