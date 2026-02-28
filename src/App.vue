<template>
  <div v-if="firebaseInitError" class="firebase-config-error q-pa-xl">
    <div class="text-h6 q-mb-md">Configuration needed</div>
    <p class="text-body2">{{ firebaseInitError }}</p>
    <p class="text-caption q-mt-md text-grey-7">
      If this is the test site (test.lilmagnetmemories.com), add VITE_IS_TEST_ENVIRONMENT and VITE_FIREBASE_*_TEST in your Vercel project Environment Variables for this branch.
    </p>
  </div>
  <router-view v-else />
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import getApp from './firebase/config.js';
import { getFirebaseInitError } from './firebase/config.js';

export default defineComponent({
  name: 'App',
  setup() {
    // Trigger Firebase init immediately so any error is set before first render
    if (typeof getApp === 'function') getApp();
    const firebaseInitError = ref<string | null>(getFirebaseInitError());
    return { firebaseInitError };
  },
});
</script>

<style scoped>
.firebase-config-error {
  max-width: 600px;
  margin: 2rem auto;
  background: #fff3e0;
  border: 1px solid #ff9800;
  border-radius: 8px;
}
</style>
