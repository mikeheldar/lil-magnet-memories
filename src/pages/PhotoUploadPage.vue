<template>
  <q-page class="row justify-center">
    <div class="col-12 col-md-8 col-lg-6 q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <div class="text-h5 text-grey-7">Photo Upload Form</div>
        <div class="text-body1 text-grey-6 q-mt-sm">
          <span v-if="isAtMarketEvent"
            >Create custom magnets for market event pickup</span
          >
          <span v-else>Create custom magnets for home delivery</span>
        </div>

        <!-- Login Section for Non-Authenticated Users -->
        <div v-if="!isAuthenticated" class="q-mb-lg">
          <q-card class="q-pa-md bg-blue-1">
            <q-card-section class="text-center">
              <div class="text-h6 q-mb-sm text-primary">
                <q-icon name="login" class="q-mr-sm" />
                Already have an account?
              </div>
              <div class="text-body2 q-mb-md text-grey-7">
                Sign in to track your orders and get faster service
              </div>
              <q-btn
                @click="handleGoogleSignIn"
                color="primary"
                size="lg"
                class="q-px-xl q-py-md"
                :loading="signingIn"
                :disable="signingIn"
              >
                <q-icon name="login" class="q-mr-sm" />
                {{ signingIn ? 'Signing in...' : 'Sign in with Google' }}
              </q-btn>

              <!-- Help text for popup blockers -->
              <div class="text-caption text-grey-6 q-mt-sm text-center">
                <q-icon name="info" size="14px" class="q-mr-xs" />
                If sign-in hangs, check that popups are allowed for this site
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- User Info Pre-fill Notice for Authenticated Users -->
        <div v-if="isAuthenticated" class="q-mb-md">
          <q-card class="q-pa-sm bg-green-1">
            <q-card-section class="text-center">
              <q-icon name="check_circle" color="positive" class="q-mr-sm" />
              <span class="text-positive text-weight-medium">
                Signed in as
                {{ currentUser?.displayName || currentUser?.email }}
              </span>
              <span class="text-grey-7 q-ml-sm">
                - Your information will be saved and you can track your orders
              </span>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Upload Form Card -->
      <q-card class="q-pa-lg">
        <q-card-section>
          <div class="text-h5 text-weight-medium q-mb-md text-center">
            <q-icon
              name="camera_alt"
              size="32px"
              class="q-mr-sm text-primary"
            />
            Photo Upload Form
          </div>

          <q-form @submit="onSubmit" class="q-gutter-md">
            <!-- Customer Information -->
            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="person" class="q-mr-sm" />
              Your Information
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.firstName"
                  label="First Name *"
                  filled
                  ref="firstNameInput"
                  :rules="[(val) => !!val || 'First name is required']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.lastName"
                  label="Last Name *"
                  filled
                  ref="lastNameInput"
                  :rules="[(val) => !!val || 'Last name is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.email"
                  label="Email Address *"
                  type="email"
                  filled
                  ref="emailInput"
                  :rules="[
                    (val) => !!val || 'Email is required',
                    (val) => isValidEmail(val) || 'Please enter a valid email',
                  ]"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.phone"
                  label="Phone Number"
                  filled
                  mask="(###) ###-####"
                />
              </div>
            </div>

            <!-- Photo Upload Section -->
            <q-separator class="q-my-md" />

            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="photo_library" class="q-mr-sm" />
              Your Photos
            </div>

            <div class="text-body2 text-grey-7 q-mb-md">
              Upload your photos below. You can select multiple photos at once.
              We'll turn them into beautiful custom magnets!
            </div>

            <!-- File Upload -->
            <q-file
              v-model="selectedFiles"
              label="Choose Photos"
              filled
              multiple
              accept="image/*"
              @rejected="onRejected"
              @update:model-value="onFileSelected"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <!-- Selected Files Preview -->
            <div
              v-if="selectedFiles && selectedFiles.length > 0"
              class="q-mb-md"
            >
              <div class="text-subtitle2 q-mb-sm">
                Selected Photos ({{ selectedFiles.length }}):
              </div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="col-6 col-md-4 col-lg-3"
                >
                  <q-card class="q-pa-sm">
                    <!-- Square frame with centered photo -->
                    <div
                      class="square-photo-frame q-mb-sm"
                      style="
                        width: 100%;
                        aspect-ratio: 1;
                        position: relative;
                        overflow: hidden;
                        border: 2px solid #e0e0e0;
                        border-radius: 4px;
                        background: #f5f5f5;
                      "
                    >
                      <img
                        :src="getFilePreview(file)"
                        style="
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          width: 100%;
                          height: 100%;
                          object-fit: contain;
                        "
                        class="rounded-borders"
                      />
                    </div>
                    <div class="text-caption text-center q-mb-xs">
                      {{ file.name }}
                    </div>
                    <div class="text-center">
                      <div class="text-caption q-mb-xs">Quantity:</div>
                      <q-btn-group>
                        <q-btn
                          dense
                          size="sm"
                          icon="remove"
                          @click="decreaseQuantity(index)"
                          :disable="fileQuantities[index] <= 1"
                        />
                        <q-btn
                          dense
                          size="sm"
                          :label="fileQuantities[index]"
                          class="q-px-md"
                        />
                        <q-btn
                          dense
                          size="sm"
                          icon="add"
                          @click="increaseQuantity(index)"
                        />
                      </q-btn-group>
                    </div>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div v-if="totalMagnets > 0" class="q-mb-md">
              <q-card class="q-pa-md">
                <div class="text-h6 text-center text-primary">
                  <q-icon name="style" class="q-mr-sm" />
                  Total Magnets: {{ totalMagnets }}
                </div>
                <div v-if="totalCost.total > 0" class="q-mt-sm">
                  <div
                    v-if="totalCost.breakdown.length > 0"
                    class="text-center q-mb-xs"
                  >
                    <div
                      v-for="(item, index) in totalCost.breakdown"
                      :key="index"
                      class="text-caption text-grey-7"
                    >
                      {{ item.count }} × ({{ item.qty }} for ${{
                        (item.price / item.count).toFixed(2)
                      }})
                    </div>
                  </div>
                  <div class="text-h6 text-center text-primary q-mt-xs">
                    <q-icon name="attach_money" class="q-mr-sm" />
                    Total Cost: ${{ totalCost.total.toFixed(2) }}
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Special Instructions -->
            <q-input
              v-model="formData.specialInstructions"
              label="Special Instructions (Optional)"
              type="textarea"
              filled
              rows="3"
              placeholder="Any special requests for your magnets? Size preferences, color adjustments, etc."
            />

            <!-- Product Selection (moved here) -->
            <div class="q-mb-md">
              <div v-if="selectedProductId && selectedProduct" class="q-mb-sm">
                <div class="text-h6 text-weight-bold text-primary">
                  <q-icon name="inventory_2" class="q-mr-sm" />
                  Selected Product: {{ selectedProduct.description }}
                  <q-chip
                    v-if="selectedProduct.isDefault"
                    color="green"
                    text-color="white"
                    size="sm"
                    icon="star"
                    class="q-ml-sm"
                  >
                    Default
                  </q-chip>
                </div>
                <div
                  class="text-caption text-grey-7 q-mt-xs"
                  v-if="
                    selectedProduct.pricing &&
                    Object.keys(selectedProduct.pricing).length > 0
                  "
                >
                  <div
                    v-for="(price, qty) in selectedProduct.pricing"
                    :key="String(qty)"
                  >
                    {{ qty }}x for ${{ Number(price).toFixed(2) }}
                  </div>
                </div>
              </div>
              <div v-else-if="selectedProductId" class="text-body2 text-grey-6">
                Loading product details...
              </div>
              <div v-else class="text-body2 text-grey-6">
                No product selected
              </div>

              <!-- Collapsible Change Product Section -->
              <q-expansion-item
                icon="swap_horiz"
                label="Change Product"
                class="q-mt-sm"
                header-class="text-caption"
              >
                <q-select
                  v-model="selectedProductId"
                  :options="productOptions"
                  option-label="description"
                  option-value="id"
                  emit-value
                  map-options
                  :label="
                    selectedProduct
                      ? 'Choose a different product'
                      : 'Select a product'
                  "
                  filled
                  :rules="[(val) => !!val || 'Please select a product']"
                  :loading="loadingProducts"
                  @update:model-value="onProductChange"
                  :disable="
                    loadingProducts ||
                    !productOptions ||
                    productOptions.length === 0
                  "
                >
                  <template v-slot:option="scope">
                    <q-item
                      v-bind="scope.itemProps"
                      v-if="
                        scope &&
                        scope.opt &&
                        scope.opt.id &&
                        scope.opt.description
                      "
                    >
                      <q-item-section>
                        <q-item-label>{{ scope.opt.description }}</q-item-label>
                        <q-item-label
                          caption
                          v-if="
                            scope.opt.pricing &&
                            typeof scope.opt.pricing === 'object'
                          "
                        >
                          <div
                            v-for="(price, qty) in scope.opt.pricing"
                            :key="String(qty)"
                            class="text-caption"
                          >
                            {{ qty }}x for ${{ Number(price).toFixed(2) }}
                          </div>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="scope.opt.isDefault">
                        <q-chip
                          color="green"
                          text-color="white"
                          size="sm"
                          icon="star"
                        >
                          Default
                        </q-chip>
                      </q-item-section>
                    </q-item>
                  </template>
                  <template v-slot:selected>
                    <span v-if="selectedProduct">{{
                      selectedProduct.description
                    }}</span>
                    <span v-else>Select a product</span>
                  </template>
                </q-select>
              </q-expansion-item>
            </div>

            <!-- Payment Options (only show if at market event) -->
            <div v-if="isAtMarketEvent" class="q-mb-md">
              <q-card class="q-pa-md bg-blue-1">
                <div class="text-h6 q-mb-sm text-primary">
                  <q-icon name="payment" class="q-mr-sm" />
                  Payment Options
                </div>
                <q-radio
                  v-model="paymentChoice"
                  val="pay_at_tent"
                  label="Pay at Li'l Magnet Memories Tent"
                  class="q-mb-sm"
                />
                <q-radio
                  v-model="paymentChoice"
                  val="pay_online"
                  label="Pay Online Now"
                  class="q-mb-sm"
                />
                <div
                  v-if="paymentChoice === 'pay_online'"
                  class="text-body2 text-grey-7 q-mt-sm"
                >
                  You'll be taken to the payment form to complete your order.
                </div>
              </q-card>
            </div>

            <!-- Submit Button -->
            <div class="text-center q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                size="lg"
                :loading="submitting"
                :disable="!canSubmit"
                class="q-px-xl"
                @click="handleSubmitClick"
              >
                <q-icon name="send" class="q-mr-sm" />
                {{
                  isAtMarketEvent && paymentChoice === 'pay_online'
                    ? 'Continue to Payment'
                    : isAtMarketEvent
                    ? 'Submit Photos for Magnet Creation'
                    : 'Add to Cart'
                }}
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Order Summary Dialog -->
      <q-dialog v-model="showOrderSummary" persistent>
        <q-card
          style="
            min-width: 400px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
          "
        >
          <q-card-section class="row items-center">
            <q-avatar icon="assignment" color="primary" text-color="white" />
            <span class="q-ml-sm text-h6">Order Summary</span>
          </q-card-section>

          <q-card-section style="flex: 1; overflow-y: auto">
            <div class="q-mb-md">
              <div class="text-h6 text-primary">Order #{{ orderNumber }}</div>
              <div class="text-caption text-grey-6">
                {{ formatDate(new Date()) }}
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium">
                Customer Information
              </div>
              <div>
                <strong>Name:</strong> {{ formData.firstName }}
                {{ formData.lastName }}
              </div>
              <div><strong>Email:</strong> {{ formData.email }}</div>
              <div v-if="formData.phone">
                <strong>Phone:</strong> {{ formData.phone }}
              </div>
              <div v-if="formData.specialInstructions">
                <strong>Special Instructions:</strong>
                <div class="text-grey-7 q-mt-xs">
                  {{ formData.specialInstructions }}
                </div>
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium">Order Details</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="col-6"
                >
                  <div class="photo-thumbnail-container">
                    <img
                      :src="getFilePreview(file)"
                      class="photo-thumbnail rounded-borders q-mb-xs"
                      alt="Photo thumbnail"
                    />
                  </div>
                  <div class="text-caption text-truncate" :title="file.name">
                    {{ file.name }}
                  </div>
                  <div class="text-caption text-primary">
                    <q-icon name="style" size="12px" class="q-mr-xs" />
                    {{ fileQuantities[index] }} magnet{{
                      fileQuantities[index] > 1 ? 's' : ''
                    }}
                  </div>
                </div>
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <div class="text-center">
              <div class="text-h6 text-primary">
                <q-icon name="style" class="q-mr-sm" />
                Total: {{ totalMagnets }} Magnets
              </div>
            </div>
          </q-card-section>

          <q-card-actions
            align="right"
            class="q-pa-md"
            style="flex-shrink: 0; border-top: 1px solid rgba(0, 0, 0, 0.12)"
          >
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="showOrderSummary = false"
              class="q-mr-sm"
            />
            <q-btn
              label="Confirm Order"
              color="primary"
              @click="confirmOrder"
              :loading="submitting"
              class="q-px-lg"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Upload Progress Dialog -->
      <q-dialog v-model="showUploadProgress" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center">
            <q-avatar icon="cloud_upload" color="primary" text-color="white" />
            <span class="q-ml-sm text-h6">Uploading Photos</span>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-body1 q-mb-sm">
                Uploading {{ uploadProgress.completed }} of
                {{ uploadProgress.total }} photos...
              </div>
              <q-linear-progress
                :value="uploadProgress.overall / 100"
                color="primary"
                size="25px"
                class="q-mt-sm"
              >
                <div class="absolute-full flex flex-center">
                  <span class="text-white text-body2"
                    >{{ uploadProgress.overall }}%</span
                  >
                </div>
              </q-linear-progress>
              <div class="text-caption text-grey-6 q-mt-xs text-center">
                {{ formatBytes(uploadProgress.uploaded) }} of
                {{ formatBytes(uploadProgress.totalSize) }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Market Event Ended Dialog -->
      <q-dialog v-model="showEventEndedDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center">
            <q-avatar icon="event_busy" color="orange" text-color="white" />
            <span class="q-ml-sm text-h6">Market Event Has Ended</span>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">
              The market event has ended, but we'd love for you to try our easy
              online purchase experience!
            </div>
            <div class="text-body2 text-grey-7">
              You can order custom magnets online from our homepage and have
              them shipped directly to you.
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              label="Return to Main Page"
              color="primary"
              @click="goToMainPage"
              class="q-px-lg"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Information Card -->
      <q-card class="q-mt-md q-pa-md bg-grey-1">
        <q-card-section>
          <div class="text-h6 text-weight-medium q-mb-sm text-primary">
            <q-icon name="info" class="q-mr-sm" />
            What Happens Next?
          </div>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >We'll review your photos and contact you within 24
                  hours</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >We'll provide a quote and timeline for your custom
                  magnets</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >Once approved, we'll create your beautiful custom
                  magnets!</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { auth } from '../firebase/config.js';
import { signInAnonymously } from 'firebase/auth';
import { marketEventService } from '../services/marketEventService.js';
import {
  useCustomerType,
  CUSTOMER_TYPES,
} from '../composables/useCustomerType.js';
import { useCart } from '../composables/useCart.js';

export default {
  name: 'PhotoUploadPage',
  setup() {
    const $q = useQuasar();
    const quasar = $q; // Capture in local variable for safe access
    const router = useRouter();
    const route = useRoute();

    // Safe notify wrapper
    const safeNotify = (options) => {
      try {
        if (quasar && typeof quasar.notify === 'function') {
          quasar.notify(options);
        } else {
          console.log('Notification not available:', options);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialInstructions: '',
    });

    const selectedFiles = ref([]);
    const fileQuantities = ref([]);
    const submitting = ref(false);
    const showOrderSummary = ref(false);
    const showEventEndedDialog = ref(false);
    const orderNumber = ref('');
    const products = ref([]);
    const selectedProductId = ref(null);
    const loadingProducts = ref(false);
    const paymentChoice = ref('pay_at_tent'); // Default to pay at tent

    // Upload progress tracking
    const uploadProgress = ref({
      overall: 0,
      completed: 0,
      total: 0,
      uploaded: 0,
      totalSize: 0,
    });
    const showUploadProgress = ref(false);

    // Product options for dropdown - ensure it's always an array with valid structure
    const productOptions = computed(() => {
      if (!products.value || !Array.isArray(products.value)) {
        return [];
      }
      return products.value
        .filter((p) => {
          // Only include products that have all required fields
          return (
            p &&
            p.id &&
            p.description &&
            (p.category === 'custom' ||
              (!p.category && (!p.productType || p.productType === 'custom')))
          );
        })
        .map((p) => {
          // Ensure all properties exist and are valid
          return {
            id: String(p.id || ''),
            description: String(p.description || 'Unknown Product'),
            pricing:
              p.pricing && typeof p.pricing === 'object' ? p.pricing : {},
            isDefault: Boolean(p.isDefault),
            category: p.category || null,
            productType: p.productType || null,
          };
        })
        .filter((p) => p.id && p.description); // Final safety check
    });

    // Get selected product object from ID
    const selectedProduct = computed(() => {
      if (!selectedProductId.value) {
        console.log('🔍 selectedProduct: No selectedProductId');
        return null;
      }

      // Try to find in productOptions first
      const foundInOptions = productOptions.value.find((p) => {
        const match = String(p.id) === String(selectedProductId.value);
        if (!match && p.id) {
          console.log(
            '🔍 Comparing:',
            String(p.id),
            'vs',
            String(selectedProductId.value)
          );
        }
        return match;
      });

      if (foundInOptions) {
        console.log(
          '✅ selectedProduct: Found in productOptions:',
          foundInOptions.description
        );
        return foundInOptions;
      }

      // Fallback: try to find in original products array
      const foundInProducts = products.value.find(
        (p) => String(p.id) === String(selectedProductId.value)
      );
      if (foundInProducts) {
        console.log(
          '✅ selectedProduct: Found in products array:',
          foundInProducts.description
        );
        // Normalize it to match productOptions structure
        return {
          id: String(foundInProducts.id || ''),
          description: String(foundInProducts.description || 'Unknown Product'),
          pricing:
            foundInProducts.pricing &&
            typeof foundInProducts.pricing === 'object'
              ? foundInProducts.pricing
              : {},
          isDefault: Boolean(foundInProducts.isDefault),
          category: foundInProducts.category || null,
          productType: foundInProducts.productType || null,
        };
      }

      console.log(
        '⚠️ selectedProduct: Not found! ID:',
        selectedProductId.value,
        'Options count:',
        productOptions.value.length
      );
      return null;
    });
    const { addCustomUploadToCart } = useCart();
    let marketEventUnsubscribe = null;
    let eventCheckInterval = null;
    const hadEventOnLoad = ref(false);

    // Handler for when product selection changes
    const onProductChange = (newProductId) => {
      console.log('🔄 Product changed to:', newProductId);
      // Force reactivity update by accessing the computed property
      // This ensures totalCost recalculates with the new product pricing
      if (selectedProduct.value) {
        console.log(
          '✅ Selected product updated:',
          selectedProduct.value.description
        );
        console.log('✅ New product pricing:', selectedProduct.value.pricing);
        // Force totalCost to recalculate by accessing it
        const _ = totalCost.value;
      }
    };

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const totalMagnets = computed(() => {
      return fileQuantities.value.reduce((sum, qty) => sum + qty, 0);
    });

    // Check if user is at a market event
    const isAtMarketEvent = computed(() => {
      return marketEventService.getCheckedInEvent() !== null;
    });

    // Function to check if event has ended and show dialog
    const checkEventStatus = () => {
      const checkedInEvent = marketEventService.getCheckedInEvent();

      // If there's no checked-in event AND we had an event when page loaded, show dialog
      // This prevents showing dialog on initial load when there's no event (route guard handles that)
      if (!checkedInEvent && hadEventOnLoad.value) {
        // Only show dialog if it's not already showing (to prevent multiple triggers)
        if (!showEventEndedDialog.value) {
          console.log('⚠️ Market event has ended, showing dialog');
          showEventEndedDialog.value = true;
        }
      }
    };

    // Function to redirect to main page
    const goToMainPage = () => {
      router.push('/');
    };

    const totalCost = computed(() => {
      if (
        !selectedProduct.value ||
        !selectedProduct.value.pricing ||
        totalMagnets.value === 0
      ) {
        return { total: 0, breakdown: [] };
      }

      const pricing = selectedProduct.value.pricing;
      const totalQty = totalMagnets.value;

      // Sort tiers from largest to smallest
      const sortedTiers = Object.keys(pricing)
        .map(Number)
        .sort((a, b) => b - a);

      let remainingQty = totalQty;
      let totalCost = 0;
      const breakdown = [];

      // Use a greedy algorithm to find the best combination
      for (const tier of sortedTiers) {
        const count = Math.floor(remainingQty / tier);
        if (count > 0) {
          const tierPrice = pricing[tier] * count;
          totalCost += tierPrice;
          breakdown.push({ qty: tier, count, price: tierPrice });
          remainingQty -= tier * count;
        }
      }

      // Handle any remaining items with the smallest tier
      if (remainingQty > 0 && sortedTiers.length > 0) {
        const smallestTier = sortedTiers[sortedTiers.length - 1];
        const remainingPrice =
          (pricing[smallestTier] / smallestTier) * remainingQty;
        totalCost += remainingPrice;
        breakdown.push({ qty: remainingQty, count: 1, price: remainingPrice });
      }

      return { total: totalCost, breakdown };
    });

    const canSubmit = computed(() => {
      return (
        formData.value.firstName &&
        formData.value.lastName &&
        formData.value.email &&
        isValidEmail(formData.value.email) &&
        selectedFiles.value &&
        selectedFiles.value.length > 0 &&
        totalMagnets.value > 0
      );
    });

    // Refs for input fields
    const firstNameInput = ref(null);
    const lastNameInput = ref(null);
    const emailInput = ref(null);

    // Handle submit button click - show validation errors if disabled
    const handleSubmitClick = (event) => {
      if (!canSubmit.value) {
        event.preventDefault();
        event.stopPropagation();

        const missingFields = [];
        if (!formData.value.firstName) missingFields.push('First Name');
        if (!formData.value.lastName) missingFields.push('Last Name');
        if (!formData.value.email) {
          missingFields.push('Email');
        } else if (!isValidEmail(formData.value.email)) {
          missingFields.push('Valid Email');
        }

        if (missingFields.length > 0) {
          const message = `Please fill in: ${missingFields.join(', ')}`;
          safeNotify({
            type: 'warning',
            message: 'Required fields missing',
            caption: message,
            position: 'top',
            timeout: 4000,
          });

          // Scroll to first missing field
          setTimeout(() => {
            if (!formData.value.firstName && firstNameInput.value) {
              firstNameInput.value.$el.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              firstNameInput.value.focus();
            } else if (!formData.value.lastName && lastNameInput.value) {
              lastNameInput.value.$el.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              lastNameInput.value.focus();
            } else if (
              (!formData.value.email || !isValidEmail(formData.value.email)) &&
              emailInput.value
            ) {
              emailInput.value.$el.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              emailInput.value.focus();
            }
          }, 100);
        }
      }
    };

    const getFilePreview = (file) => {
      return URL.createObjectURL(file);
    };

    const onRejected = () => {
      safeNotify({
        type: 'negative',
        message:
          'Some files were rejected. Please make sure they are image files.',
        caption: 'Accepted formats: JPG, PNG, GIF, WebP',
      });
    };

    const onFileSelected = (files) => {
      selectedFiles.value = files;
      // Initialize quantities to 1 for each file
      fileQuantities.value = files.map(() => 1);
    };

    const increaseQuantity = (index) => {
      fileQuantities.value[index]++;
    };

    const decreaseQuantity = (index) => {
      if (fileQuantities.value[index] > 1) {
        fileQuantities.value[index]--;
      }
    };

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1);
      fileQuantities.value.splice(index, 1);
    };

    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const time = now.getTime().toString().slice(-4);
      return `LMM-${year}${month}${day}-${time}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString();
    };

    const formatBytes = (bytes) => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const confirmOrder = async () => {
      showOrderSummary.value = false;
      submitting.value = true;
      showUploadProgress.value = true;
      uploadProgress.value = {
        overall: 0,
        completed: 0,
        total: selectedFiles.value.length,
        uploaded: 0,
        totalSize: selectedFiles.value.reduce(
          (sum, file) => sum + (file.size || 0),
          0
        ),
      };

      // Save form data to localStorage for non-authenticated users
      saveFormDataToLocalStorage();

      try {
        // Prepare customer data
        const customerData = {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          email: formData.value.email,
          phone: formData.value.phone,
          specialInstructions: formData.value.specialInstructions,
          photos: selectedFiles.value,
          quantities: fileQuantities.value,
          orderNumber: orderNumber.value,
          totalMagnets: totalMagnets.value,
          userId: currentUser.value?.uid || null,
        };

        console.log('Submitting order with userId:', customerData.userId);
        console.log('Current user:', currentUser.value);
        console.log('Customer data:', customerData);

        let savedOrder = null;

        // Save to Firebase
        try {
          console.log('Attempting to save order to Firebase...');
          // Pass progress callback to saveOrder, which will pass it to uploadPhotos
          savedOrder = await firebaseService.saveOrder(
            customerData,
            (progress) => {
              uploadProgress.value = progress;
            }
          );
          console.log('Order saved to Firebase successfully:', savedOrder);
        } catch (error) {
          console.error('Firebase save failed:', error);
          throw error; // Re-throw to show error to user
        }

        // Prepare order data for thank you page
        const orderData = {
          orderNumber: orderNumber.value,
          customerName: `${formData.value.firstName} ${formData.value.lastName}`,
          customerEmail: formData.value.email,
          totalMagnets: totalMagnets.value,
        };

        // Store in localStorage as backup
        localStorage.setItem('lastOrderData', JSON.stringify(orderData));

        // Reset form
        formData.value = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          specialInstructions: '',
        };
        selectedFiles.value = [];
        fileQuantities.value = [];

        // Show success notification
        try {
          safeNotify({
            type: 'positive',
            message: 'Order submitted successfully!',
            caption: 'Your order has been saved and we will contact you soon.',
            position: 'top',
          });
        } catch (notifyError) {
          console.log('Notification error (non-critical):', notifyError);
        }

        // Redirect to thank you page with order details
        try {
          router.push({
            path: '/thank-you',
            query: orderData,
          });
        } catch (routerError) {
          console.error('Router error:', routerError);
          // Fallback: redirect using window.location
          const queryString = new URLSearchParams(orderData).toString();
          window.location.href = `/thank-you?${queryString}`;
        }
      } catch (error) {
        console.error('Order submission error:', error);
        // Only show notification if $q is available
        safeNotify({
          type: 'negative',
          message: 'Failed to submit order',
          caption: 'Please try again or contact us directly.',
          position: 'top',
        });
      } finally {
        submitting.value = false;
        showUploadProgress.value = false;
      }
    };

    const onSubmit = async () => {
      // Save form data to localStorage for non-authenticated users
      saveFormDataToLocalStorage();

      // If at market event and user chose to pay online, route to checkout
      if (isAtMarketEvent.value && paymentChoice.value === 'pay_online') {
        // Generate order number
        orderNumber.value = generateOrderNumber();

        // Calculate total cost
        const total = totalCost.value.total;

        // Upload photos to Firebase Storage first to get persistent URLs
        submitting.value = true;
        showUploadProgress.value = true;
        uploadProgress.value = {
          overall: 0,
          completed: 0,
          total: selectedFiles.value.length,
          uploaded: 0,
          totalSize: selectedFiles.value.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          ),
        };
        try {
          console.log('📤 Uploading photos to Firebase Storage for cart...');
          const uploadedPhotos = await firebaseService.uploadPhotos(
            selectedFiles.value,
            (progress) => {
              uploadProgress.value = progress;
            }
          );
          console.log(
            '✅ Photos uploaded successfully:',
            uploadedPhotos.length
          );

          // Prepare photos with download URLs and quantities for cart
          // Convert files to base64 for persistence across devices
          const photosForCart = await Promise.all(
            uploadedPhotos.map(async (uploadedPhoto, index) => {
              const file = selectedFiles.value[index];
              let base64Preview = null;
              if (file) {
                try {
                  base64Preview = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                } catch (error) {
                  console.warn('Failed to convert file to base64:', error);
                }
              }
              return {
                name: uploadedPhoto.name,
                url: uploadedPhoto.url, // Persistent Firebase Storage URL
                preview: base64Preview || uploadedPhoto.url, // Use base64 for cross-device compatibility
                fileName: uploadedPhoto.fileName,
                size: uploadedPhoto.size,
                type: uploadedPhoto.type,
                quantity: fileQuantities.value[index] || 1,
              };
            })
          );

          // Add order to cart with persistent photo URLs and market event context
          addCustomUploadToCart({
            productName:
              selectedProduct.value?.description || 'Custom Photo Magnets',
            photos: photosForCart,
            quantities: fileQuantities.value,
            specialInstructions: formData.value.specialInstructions,
            totalMagnets: totalMagnets.value,
            totalCost: totalCost.value,
            costBreakdown: totalCost.value.breakdown,
            pricing: selectedProduct.value?.pricing || {},
            marketEventContext: true, // Flag to remember this is from market event
            formData: {
              firstName: formData.value.firstName,
              lastName: formData.value.lastName,
              email: formData.value.email,
              phone: formData.value.phone,
              specialInstructions: formData.value.specialInstructions,
            },
          });

          submitting.value = false;
          showUploadProgress.value = false;

          // Show success notification
          safeNotify({
            type: 'positive',
            message: 'Photos added to cart!',
            position: 'top',
          });

          // Route directly to checkout with skipShipping and customTotal
          router.push({
            path: '/checkout',
            query: {
              customTotal: total.toFixed(2),
              skipShipping: '1',
              orderNumber: orderNumber.value,
              context: 'market_event',
              firstName: formData.value.firstName,
              lastName: formData.value.lastName,
              email: formData.value.email,
              phone: formData.value.phone || '',
            },
          });
          return;
        } catch (error) {
          console.error('❌ Error uploading photos for cart:', error);
          submitting.value = false;
          showUploadProgress.value = false;
          safeNotify({
            type: 'negative',
            message: 'Failed to upload photos',
            caption: error.message || 'Please try again',
            position: 'top',
          });
        }
      }

      // If NOT at market event (online order), add to cart and go to cart
      if (!isAtMarketEvent.value) {
        // Upload photos to Firebase Storage first to get persistent URLs
        submitting.value = true;
        showUploadProgress.value = true;
        uploadProgress.value = {
          overall: 0,
          completed: 0,
          total: selectedFiles.value.length,
          uploaded: 0,
          totalSize: selectedFiles.value.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          ),
        };
        try {
          console.log('📤 Uploading photos to Firebase Storage for cart...');
          const uploadedPhotos = await firebaseService.uploadPhotos(
            selectedFiles.value,
            (progress) => {
              uploadProgress.value = progress;
            }
          );
          console.log(
            '✅ Photos uploaded successfully:',
            uploadedPhotos.length
          );

          // Prepare photos with download URLs and quantities for cart
          const photosForCart = await Promise.all(
            uploadedPhotos.map(async (uploadedPhoto, index) => {
              const file = selectedFiles.value[index];
              let base64Preview = null;
              if (file) {
                try {
                  base64Preview = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                } catch (error) {
                  console.warn('Failed to convert file to base64:', error);
                }
              }
              return {
                name: uploadedPhoto.name,
                url: uploadedPhoto.url, // Persistent Firebase Storage URL
                preview: base64Preview || uploadedPhoto.url,
                fileName: uploadedPhoto.fileName,
                size: uploadedPhoto.size,
                type: uploadedPhoto.type,
                quantity: fileQuantities.value[index] || 1,
              };
            })
          );

          // Add order to cart (no market event context for online orders)
          addCustomUploadToCart({
            productName:
              selectedProduct.value?.description || 'Custom Photo Magnets',
            photos: photosForCart,
            quantities: fileQuantities.value,
            specialInstructions: formData.value.specialInstructions,
            totalMagnets: totalMagnets.value,
            totalCost: totalCost.value,
            costBreakdown: totalCost.value.breakdown,
            pricing: selectedProduct.value?.pricing || {},
            marketEventContext: false, // Online orders don't have market event context
            formData: {
              firstName: formData.value.firstName,
              lastName: formData.value.lastName,
              email: formData.value.email,
              phone: formData.value.phone,
              specialInstructions: formData.value.specialInstructions,
            },
          });

          submitting.value = false;
          showUploadProgress.value = false;

          // Show success notification
          safeNotify({
            type: 'positive',
            message: 'Added to cart!',
            caption: `${totalMagnets.value} magnets added to your cart`,
            position: 'top',
            timeout: 3000,
          });

          // Navigate to cart page
          try {
            await router.push('/cart');
          } catch (error) {
            console.error('Failed to navigate to cart:', error);
            safeNotify({
              type: 'warning',
              message: 'Added to cart, but navigation failed',
              caption: 'Please open the cart manually.',
              position: 'top',
              timeout: 4000,
            });
          }
          return;
        } catch (error) {
          console.error('❌ Error uploading photos for cart:', error);
          submitting.value = false;
          showUploadProgress.value = false;
          safeNotify({
            type: 'negative',
            message: 'Failed to upload photos',
            caption: error.message || 'Please try again',
            position: 'top',
          });
        }
      }

      // Otherwise, show order summary dialog (default behavior)
      orderNumber.value = generateOrderNumber();
      showOrderSummary.value = true;
    };

    // Authentication state
    const isAuthenticated = ref(false);
    const currentUser = ref(null);
    const signingIn = ref(false);

    const handleGoogleSignIn = async () => {
      // Check if popups are likely blocked
      const popupBlocked = checkPopupBlocked();
      if (popupBlocked) {
        safeNotify({
          type: 'warning',
          message: 'Popup blocked detected',
          caption: 'Please allow popups for this site and try again.',
          position: 'top',
          timeout: 5000,
        });
        return;
      }

      signingIn.value = true;

      // Shorter timeout for better UX
      const timeoutId = setTimeout(() => {
        if (signingIn.value) {
          console.log('Sign-in timeout, resetting state');
          signingIn.value = false;
          safeNotify({
            type: 'negative',
            message: 'Sign-in timed out',
            caption:
              'The popup may have been blocked. Please check your browser settings.',
            position: 'top',
            timeout: 8000,
            actions: [
              {
                label: 'Try Again',
                color: 'white',
                handler: () => handleGoogleSignIn(),
              },
            ],
          });
        }
      }, 15000); // 15 second timeout

      try {
        console.log('Starting Google sign-in...');
        console.log('Current domain:', window.location.origin);

        await authService.signInWithGoogle();
        console.log('Google sign-in successful');

        safeNotify({
          type: 'positive',
          message: 'Successfully signed in!',
          caption: 'Your information has been filled automatically.',
          position: 'top',
        });
      } catch (error) {
        console.error('Sign in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific error cases with better guidance
        let errorMessage = 'Failed to sign in. Please try again.';
        let caption = '';

        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in was cancelled';
          caption = 'Please complete the sign-in process in the popup window.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Sign-in popup was blocked';
          caption = 'Please allow popups for this site and try again.';
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = 'Domain not authorized';
          caption = 'This domain is not authorized for Google sign-in.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Google sign-in not enabled';
          caption = 'Google sign-in is not enabled for this project.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error';
          caption = 'Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Sign-in timed out';
          caption = 'The sign-in process took too long. Please try again.';
        }

        safeNotify({
          type: 'negative',
          message: errorMessage,
          caption: caption,
          position: 'top',
          timeout: 8000,
          actions: [
            {
              label: 'Try Again',
              color: 'white',
              handler: () => handleGoogleSignIn(),
            },
          ],
        });
      } finally {
        console.log('Resetting signingIn state');
        clearTimeout(timeoutId);
        signingIn.value = false;
      }
    };

    // Helper function to detect popup blocking
    const checkPopupBlocked = () => {
      try {
        const popup = window.open('', '_blank', 'width=1,height=1');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          return true;
        }
        popup.close();
        return false;
      } catch (e) {
        return true;
      }
    };

    const fillFormWithUserData = (user) => {
      if (user) {
        // Fill name fields
        if (user.displayName) {
          const nameParts = user.displayName.split(' ');
          formData.value.firstName = nameParts[0] || '';
          formData.value.lastName = nameParts.slice(1).join(' ') || '';
        }

        // Fill email field
        if (user.email) {
          formData.value.email = user.email;
        }
      }
    };

    // Save form data to localStorage for non-authenticated users
    const saveFormDataToLocalStorage = () => {
      if (!isAuthenticated.value) {
        try {
          const dataToSave = {
            firstName: formData.value.firstName,
            lastName: formData.value.lastName,
            email: formData.value.email,
            phone: formData.value.phone,
          };
          localStorage.setItem('guestFormData', JSON.stringify(dataToSave));
        } catch (error) {
          console.error('Error saving form data to localStorage:', error);
        }
      }
    };

    // Load form data from localStorage for non-authenticated users
    const loadFormDataFromLocalStorage = () => {
      if (!isAuthenticated.value) {
        try {
          const savedData = localStorage.getItem('guestFormData');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.firstName) formData.value.firstName = parsed.firstName;
            if (parsed.lastName) formData.value.lastName = parsed.lastName;
            if (parsed.email) formData.value.email = parsed.email;
            if (parsed.phone) formData.value.phone = parsed.phone;
          }
        } catch (error) {
          console.error('Error loading form data from localStorage:', error);
        }
      }
    };

    const loadProducts = async () => {
      loadingProducts.value = true;
      try {
        // Non-admins should not see testing products
        const isAdmin = authService.isAdmin();
        const productsData = await firebaseService.getProducts(isAdmin);
        products.value = productsData || [];

        // Determine which product to select
        let productToSelect = null;

        // First, check if productId is in route query (from landing page)
        if (route.query.productId) {
          productToSelect = products.value.find(
            (p) => p.id === route.query.productId
          );
        }

        // If not found in route, check for default product
        if (!productToSelect) {
          productToSelect = products.value.find((p) => p.isDefault === true);
        }

        // If still not found, use first custom product
        if (!productToSelect) {
          productToSelect = products.value.find(
            (p) =>
              p.category === 'custom' ||
              (!p.category && (!p.productType || p.productType === 'custom'))
          );
        }

        // Set selected product after products are loaded
        // Use a small delay to ensure productOptions computed has updated
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (productToSelect) {
          // Set the product ID (q-select will handle the rest)
          // Use nextTick to ensure the select component is ready
          await nextTick();
          selectedProductId.value = productToSelect.id;
          console.log(
            '✅ Selected product ID:',
            productToSelect.id,
            productToSelect.description,
            productToSelect.isDefault ? '(default)' : ''
          );
          // Force a small delay to ensure reactive updates
          await new Promise((resolve) => setTimeout(resolve, 50));
        } else {
          console.warn(
            '⚠️ No product to select - no default product found and no route query productId'
          );
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        loadingProducts.value = false;
      }
    };

    // Helper to check if user is anonymous (no email means anonymous)
    const isAnonymousUser = (user) => {
      return user && user.providerId === 'firebase' && !user.email;
    };

    onMounted(async () => {
      // The route guard handles blocking access when there's no active event
      // This onMounted sets up the page and auto-checks in anonymous users
      try {
        // Wait a moment for market event service to fully load events
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check for active event (sync version first for speed)
        const activeEvent = marketEventService.getActiveEventSync();

        // If anonymous user and there's an active event, automatically set them as "at the event"
        if (activeEvent && !isAuthenticated.value) {
          // Set customer type to market_customer so they're treated as being at the event
          const { setCustomerType } = useCustomerType();
          setCustomerType(CUSTOMER_TYPES.MARKET);
          console.log(
            '✅ Anonymous user auto-checked in to active market event:',
            activeEvent.name
          );
        }

        // Check for active checked-in event (async version)
        const checkedInEvent =
          await marketEventService.getCheckedInEventAsync();

        if (checkedInEvent) {
          console.log(
            '✅ Active checked-in market event found:',
            checkedInEvent.name
          );
          // Mark that we had an event when page loaded
          hadEventOnLoad.value = true;
        } else {
          console.log('⚠️ No active checked-in market event found');
          // Don't redirect here - route guard already handled it for new navigations
          // If we're here on refresh, it means the route guard allowed it, so stay on page
          // But don't mark hadEventOnLoad as true, so dialog won't show on initial load
        }
      } catch (error) {
        console.error('Error checking for market event:', error);
        // Don't redirect on error - let user stay on page
      }

      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser && !isAnonymousUser(currentAuthUser)) {
        console.log(
          'User already authenticated on upload page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
        currentUser.value = currentAuthUser;
        fillFormWithUserData(currentAuthUser);
      } else {
        // Load saved form data from localStorage for non-authenticated users
        loadFormDataFromLocalStorage();
      }

      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        // Only treat non-anonymous users as authenticated for UI
        const isRealUser = user && !isAnonymousUser(user);
        isAuthenticated.value = isRealUser;
        currentUser.value = isRealUser ? user : null;

        // Pre-fill form data if user is authenticated (and not anonymous)
        if (isRealUser) {
          fillFormWithUserData(user);
        } else {
          // Load saved form data from localStorage when user signs out
          loadFormDataFromLocalStorage();
        }
      });

      // Handler for when product selection changes
      const onProductChange = (newProductId) => {
        console.log('🔄 Product changed to:', newProductId);
        // Force reactivity update by accessing the computed property
        // This ensures totalCost recalculates with the new product pricing
        if (selectedProduct.value) {
          console.log(
            '✅ Selected product updated:',
            selectedProduct.value.description
          );
          console.log('✅ New product pricing:', selectedProduct.value.pricing);
          // Force totalCost to recalculate by accessing it
          const _ = totalCost.value;
        }
      };

      // Load products
      loadProducts();

      // Watch selectedProductId to ensure totalCost updates when product changes
      watch(selectedProductId, (newId, oldId) => {
        if (newId !== oldId && newId) {
          console.log('🔄 Product ID changed from', oldId, 'to', newId);
          // Force reactivity update - totalCost computed should automatically recalculate
          if (selectedProduct.value) {
            console.log(
              '✅ Product changed, totalCost will recalculate for:',
              selectedProduct.value.description
            );
          }
        }
      });

      // Watch productOptions to sync selectedProductId when options change
      watch(
        productOptions,
        (newOptions) => {
          if (newOptions.length > 0) {
            // If product ID is set, verify it still exists in options
            if (selectedProductId.value) {
              const stillExists = newOptions.find(
                (p) => String(p.id) === String(selectedProductId.value)
              );
              if (!stillExists) {
                // Selected product no longer in options, reset
                selectedProductId.value = null;
                console.log(
                  '⚠️ Watched: Selected product no longer available, resetting'
                );
              }
            }

            // If no product selected, try to set default
            if (!selectedProductId.value) {
              const defaultProduct = newOptions.find(
                (p) => p.isDefault === true
              );
              if (defaultProduct) {
                selectedProductId.value = defaultProduct.id;
                console.log(
                  '✅ Watched: Set default product:',
                  defaultProduct.description
                );
              } else if (route.query.productId) {
                const routeProduct = newOptions.find(
                  (p) => p.id === route.query.productId
                );
                if (routeProduct) {
                  selectedProductId.value = routeProduct.id;
                  console.log(
                    '✅ Watched: Set route product:',
                    routeProduct.description
                  );
                }
              } else if (newOptions.length > 0) {
                selectedProductId.value = newOptions[0].id;
                console.log(
                  '✅ Watched: Set first product:',
                  newOptions[0].description
                );
              }
            }
          }
        },
        { immediate: true }
      );

      // Watch selectedProductId to ensure totalCost updates when product changes
      watch(selectedProductId, (newId, oldId) => {
        if (newId !== oldId && newId) {
          console.log('🔄 Product ID changed from', oldId, 'to', newId);
          // Force reactivity update - totalCost computed should automatically recalculate
          // But we can trigger it explicitly if needed
          if (selectedProduct.value) {
            console.log(
              '✅ Product changed, totalCost will recalculate for:',
              selectedProduct.value.description
            );
          }
        }
      });

      // Set up real-time listener to detect when event ends
      marketEventUnsubscribe = marketEventService.addListener(() => {
        // Check event status whenever events update
        checkEventStatus();
      });

      // Set up periodic check to catch events that end
      // This checks if an event that existed on load has now ended
      eventCheckInterval = setInterval(() => {
        checkEventStatus();
      }, 2000); // Check every 2 seconds

      // Ensure we have an auth context for Storage rules even without full sign-in.
      // This avoids 403 (storage/unauthorized) when rules require request.auth != null.
      // Do this silently - don't expose to user that they're using anonymous auth
      try {
        const userNow = authService.getCurrentUser();
        if (!userNow || isAnonymousUser(userNow)) {
          // Silently sign in anonymously for Storage rules
          signInAnonymously(auth).catch(() => {
            // Silent failure - non-blocking
          });
        }
      } catch (anonErr) {
        // Silent failure - non-blocking
      }
    });

    onUnmounted(() => {
      // Clean up listener and interval
      if (marketEventUnsubscribe) {
        marketEventUnsubscribe();
        marketEventUnsubscribe = null;
      }
      if (eventCheckInterval) {
        clearInterval(eventCheckInterval);
        eventCheckInterval = null;
      }
    });

    return {
      formData,
      selectedFiles,
      fileQuantities,
      productOptions,
      selectedProductId,
      selectedProduct,
      loadingProducts,
      submitting,
      canSubmit,
      totalMagnets,
      totalCost,
      showOrderSummary,
      orderNumber,
      uploadProgress,
      showUploadProgress,
      formatBytes,
      isAuthenticated,
      currentUser,
      signingIn,
      isValidEmail,
      getFilePreview,
      onRejected,
      onFileSelected,
      increaseQuantity,
      decreaseQuantity,
      removeFile,
      generateOrderNumber,
      formatDate,
      confirmOrder,
      onSubmit,
      handleGoogleSignIn,
      isAtMarketEvent,
      paymentChoice,
      showEventEndedDialog,
      goToMainPage,
      onProductChange,
      handleSubmitClick,
      firstNameInput,
      lastNameInput,
      emailInput,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .text-h3 {
    font-size: 1.8rem;
  }

  .text-h5 {
    font-size: 1.3rem;
  }

  .q-btn {
    font-size: 14px;
  }
}

.photo-thumbnail-container {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;
  background: #f5f5f5;
}

.photo-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: contain;
  display: block;
}
</style>
