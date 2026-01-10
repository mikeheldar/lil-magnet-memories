<template>
  <q-page class="shipping-info-page">
    <div class="q-pa-md">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Shipping Information
        </div>
        <div class="text-body1 text-grey-7">
          Learn about our shipping options and delivery times
        </div>
      </div>

      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner size="48px" color="primary" />
        <div class="q-mt-md">Loading shipping options...</div>
      </div>

      <div v-else-if="shippingOptions.length > 0" class="row q-col-gutter-md">
        <div
          v-for="option in shippingOptions"
          :key="option.id || option.value"
          class="col-12 col-md-6"
        >
          <q-card class="shipping-option-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <div class="col">
                  <div class="text-h6 q-mb-xs">
                    {{ option.label }}
                  </div>
                  <div v-if="option.description" class="text-body2 text-grey-7">
                    {{ option.description }}
                  </div>
                </div>
                <div class="col-auto">
                  <div class="text-h5 text-primary">
                    ${{ option.cost ? option.cost.toFixed(2) : '0.00' }}
                  </div>
                </div>
              </div>

              <div v-if="option.estimatedTimeline" class="q-mt-md">
                <q-icon name="schedule" class="q-mr-xs" />
                <span class="text-body2">{{ option.estimatedTimeline }}</span>
              </div>

              <div v-if="option.type === 'pickup'" class="q-mt-md">
                <q-chip color="green" text-color="white" icon="store">
                  Available at Market Events
                </q-chip>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <div v-else class="text-center q-pa-xl">
        <q-icon name="local_shipping" size="64px" color="grey-4" />
        <div class="text-h6 q-mt-md text-grey-7">
          No shipping options available at this time.
        </div>
      </div>

      <!-- Additional Information -->
      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="info" class="q-mr-sm" />
            Shipping Details
          </div>
          <div class="text-body2 q-mb-sm">
            <strong>Processing Time:</strong> Orders are typically processed within 1-2 business days.
          </div>
          <div class="text-body2 q-mb-sm">
            <strong>Tracking:</strong> You will receive a tracking number via email once your order ships.
          </div>
          <div class="text-body2">
            <strong>International Shipping:</strong> Currently, we only ship within the United States.
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

const loading = ref(true);
const shippingOptions = ref([]);

const loadShippingOptions = async () => {
  try {
    loading.value = true;
    const isAdmin = authService.isAdmin();
    const options = await firebaseService.getShippingOptions(isAdmin);
    shippingOptions.value = options || [];
  } catch (error) {
    console.error('Error loading shipping options:', error);
    shippingOptions.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadShippingOptions();
});
</script>

<style lang="scss" scoped>
.shipping-info-page {
  max-width: 1200px;
  margin: 0 auto;
}

.shipping-option-card {
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
}
</style>
