<template>
  <q-page class="shipping-info-page q-pa-lg">
    <div class="page-container">
      <div class="text-h4 text-center q-mb-lg text-primary">
        Shipping Information
      </div>
      <div class="text-body1 text-center text-grey-7 q-mb-xl">
        Learn about our shipping options and delivery timelines
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading shipping options...</div>
      </div>

      <!-- Shipping Options -->
      <div v-else-if="shippingOptions.length > 0" class="shipping-options">
        <q-card
          v-for="option in shippingOptions"
          :key="option.id"
          class="shipping-option-card q-mb-md"
        >
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 q-mb-xs">{{ option.label }}</div>
                <div class="text-body2 text-grey-7 q-mb-xs">
                  {{ option.description }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ option.estimatedTimeline }}
                </div>
              </div>
              <div class="col-auto">
                <div class="text-h6 text-primary">
                  ${{ option.cost.toFixed(2) }}
                </div>
                <div v-if="option.cost === 0" class="text-caption text-grey-6">
                  Free
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-else class="text-center text-grey-6 q-pa-xl">
        No shipping options available at this time.
      </div>

      <!-- Additional Info -->
      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">Shipping Details</div>
          <ul class="text-body2 text-grey-7">
            <li class="q-mb-sm">
              Orders are typically processed within 1-2 business days.
            </li>
            <li class="q-mb-sm">
              Shipping times are estimates and may vary based on your location.
            </li>
            <li class="q-mb-sm">
              You'll receive a tracking number once your order ships.
            </li>
            <li>
              For market event pickup, select "Collect at Market Event" during
              checkout.
            </li>
          </ul>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { firebaseService } from '../services/firebaseService.js';

export default {
  name: 'ShippingInfoPage',
  setup() {
    const shippingOptions = ref([]);
    const loading = ref(true);

    const loadShippingOptions = async () => {
      try {
        const options = await firebaseService.getShippingOptions();
        shippingOptions.value = options || [];
        loading.value = false;
      } catch (error) {
        console.error('Error loading shipping options:', error);
        shippingOptions.value = [];
        loading.value = false;
      }
    };

    onMounted(() => {
      loadShippingOptions();
    });

    return {
      shippingOptions,
      loading,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.shipping-option-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.shipping-option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
