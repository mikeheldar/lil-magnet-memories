<template>
  <q-page padding class="checkout-page">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="text-h4 q-mb-md">Checkout</div>

        <div v-if="cartItems.length === 0" class="text-center q-pa-xl">
          <q-icon
            name="shopping_cart"
            size="64px"
            color="grey-4"
            class="q-mb-md"
          />
          <div class="text-h6 text-grey-6 q-mb-sm">Your cart is empty</div>
          <q-btn
            color="primary"
            label="Continue Shopping"
            @click="$router.push('/')"
          />
        </div>

        <div v-else>
          <q-banner
            v-if="showValidationErrors && !canPlaceOrder"
            class="bg-red-1 text-negative q-mb-md"
            rounded
            dense
          >
            Please fix the highlighted fields before placing your order.
          </q-banner>
          <div class="row q-col-gutter-md">
            <!-- Left: Customer Info & Shipping -->
            <div class="col-12 col-lg-7">
              <!-- Order Summary -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Order Summary</div>
                  <q-list>
                    <template v-for="item in cartItems" :key="item.productId">
                      <!-- Custom Upload Item -->
                      <q-item v-if="item.isCustomUpload" class="q-px-none">
                        <q-item-section>
                          <q-item-label class="text-h6">{{
                            item.productName
                          }}</q-item-label>
                          <q-item-label caption>
                            <!-- Photo Previews -->
                            <div class="row q-col-gutter-xs q-mt-sm q-mb-sm">
                              <div
                                v-for="(photo, photoIndex) in item.photos"
                                :key="photoIndex"
                                class="col-auto"
                              >
                                <q-img
                                  :src="photo.url || photo.preview"
                                  style="height: 60px; width: 60px"
                                  class="rounded-borders"
                                />
                              </div>
                            </div>

                            <!-- Photo details -->
                            <div class="text-caption text-grey-7 q-mb-xs">
                              <div
                                v-for="(photo, photoIndex) in item.photos"
                                :key="photoIndex"
                              >
                                {{ photo.name }} ({{ photo.quantity }}x)
                              </div>
                            </div>

                            <!-- Cost Breakdown -->
                            <div
                              v-if="
                                item.costBreakdown &&
                                item.costBreakdown.length > 0
                              "
                              class="text-caption text-grey-7 q-mb-xs"
                            >
                              <div
                                v-for="(breakdown, index) in item.costBreakdown"
                                :key="index"
                              >
                                {{ breakdown.count }} × ({{ breakdown.qty }} for
                                ${{
                                  (breakdown.price / breakdown.count).toFixed(
                                    2
                                  )
                                }})
                              </div>
                            </div>

                            <!-- Special Instructions -->
                            <div
                              v-if="item.specialInstructions"
                              class="text-caption text-grey-7 q-mt-xs"
                            >
                              <strong>Notes:</strong>
                              {{ item.specialInstructions }}
                            </div>
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-item-label class="text-primary">
                            ${{ item.totalCost?.total?.toFixed(2) || '0.00' }}
                          </q-item-label>
                          <q-item-label caption class="text-right">
                            {{ item.quantity }} magnet{{
                              item.quantity > 1 ? 's' : ''
                            }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <!-- Regular Product Item -->
                      <q-item v-else class="q-px-none">
                        <q-item-section avatar>
                          <q-avatar size="60px" square v-if="item.productImage">
                            <img
                              :src="item.productImage"
                              :alt="item.productName"
                            />
                          </q-avatar>
                          <q-avatar size="60px" square color="grey-3" v-else>
                            <q-icon name="image" size="24px" color="grey-6" />
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ item.productName }}</q-item-label>
                          <q-item-label caption>
                            Quantity: {{ item.quantity }} × ${{
                              item.pricePerUnit.toFixed(2)
                            }}
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-item-label class="text-primary">
                            ${{ item.totalPrice.toFixed(2) }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-list>
                </q-card-section>
              </q-card>

              <!-- Customer Information -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Customer Information</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="customerInfo.firstName"
                        label="First Name *"
                        filled
                        :error="customerFirstNameError"
                        :error-message="
                          customerFirstNameError ? 'First name is required' : ''
                        "
                        :input-attrs="{ autocomplete: 'given-name' }"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="customerInfo.lastName"
                        label="Last Name *"
                        filled
                        :error="customerLastNameError"
                        :error-message="
                          customerLastNameError ? 'Last name is required' : ''
                        "
                        :input-attrs="{ autocomplete: 'family-name' }"
                      />
                    </div>
                    <div class="col-12">
                      <q-input
                        v-model="customerInfo.email"
                        label="Email *"
                        type="email"
                        filled
                        :error="customerEmailError"
                        :error-message="
                          customerEmailError
                            ? !customerInfo.email
                              ? 'Email is required'
                              : 'Please enter a valid email'
                            : ''
                        "
                        :input-attrs="{ autocomplete: 'email' }"
                      />
                    </div>
                    <div class="col-12">
                      <q-input
                        v-model="customerInfo.phone"
                        label="Phone"
                        filled
                        mask="(###) ###-####"
                        :input-attrs="{ autocomplete: 'tel' }"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Shipping Options -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Shipping / Delivery Options</div>

                  <!-- Pickup option (shown when at market event) -->
                  <div v-if="pickupOptions.length > 0">
                    <q-option-group
                      v-model="selectedShippingOption"
                      :options="pickupOptions"
                      color="primary"
                    />
                  </div>

                  <!-- Other shipping options (expandable when pickup options exist) -->
                  <div
                    v-if="
                      pickupOptions.length > 0 &&
                      otherShippingOptions.length > 0
                    "
                  >
                    <q-expansion-item
                      v-model="showOtherShippingOptions"
                      label="Other delivery options"
                      icon="local_shipping"
                      class="q-mt-md"
                    >
                      <q-option-group
                        v-model="selectedShippingOption"
                        :options="otherShippingOptions"
                        color="primary"
                      />
                    </q-expansion-item>
                  </div>

                  <!-- If no pickup options, show all options normally (no expandable section) -->
                  <div v-if="pickupOptions.length === 0">
                    <q-option-group
                      v-model="selectedShippingOption"
                      :options="shippingOptions"
                      color="primary"
                    />
                  </div>
                  <div v-if="selectedShippingDetails" class="q-mt-md">
                    <q-banner
                      dense
                      class="bg-blue-1 text-primary"
                      style="border: 2px solid #1976d2; border-radius: 8px"
                    >
                      <template v-slot:avatar>
                        <q-icon
                          name="local_shipping"
                          color="primary"
                          size="24px"
                        />
                      </template>
                      <div class="text-weight-bold text-body1">
                        {{ selectedShippingDetails.rawLabel }}
                      </div>
                      <div
                        v-if="shippingTimeline"
                        class="text-caption text-grey-7 q-mt-xs"
                      >
                        {{ shippingTimeline }}
                      </div>
                    </q-banner>
                  </div>
                  <div v-if="requiresShippingAddress" class="q-mt-md">
                    <q-input
                      v-model="shippingAddress.street"
                      label="Street Address *"
                      filled
                      class="q-mb-md"
                      :error="shippingStreetError"
                      :error-message="
                        shippingStreetError ? 'Street address is required' : ''
                      "
                      :input-attrs="{ autocomplete: 'shipping address-line1' }"
                    />
                    <div class="row q-col-gutter-md q-mb-md">
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.city"
                          label="City *"
                          filled
                          :error="shippingCityError"
                          :error-message="
                            shippingCityError ? 'City is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'shipping address-level2',
                          }"
                        />
                      </div>
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.state"
                          label="State *"
                          filled
                          :error="shippingStateError"
                          :error-message="
                            shippingStateError ? 'State is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'shipping address-level1',
                          }"
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.zip"
                          label="ZIP Code *"
                          filled
                          :error="shippingZipError"
                          :error-message="
                            shippingZipError ? 'ZIP code is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'shipping postal-code',
                          }"
                        />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Market Event Notice (shown when skipShipping) -->
              <q-card v-if="skipShipping" class="q-mb-md bg-green-1">
                <q-card-section>
                  <div class="text-h6 q-mb-sm text-primary">
                    <q-icon name="event" class="q-mr-sm" />
                    Market Event Pickup
                  </div>
                  <div class="text-body2">
                    Your order will be available for pickup at the market event.
                    No shipping required.
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Right: Order Total & Payment -->
            <div class="col-12 col-lg-5">
              <q-card class="sticky-card">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Order Total</div>
                  <div class="row justify-between q-mb-sm">
                    <div class="text-body2">Subtotal:</div>
                    <div class="text-body2">${{ cartSubtotal.toFixed(2) }}</div>
                  </div>
                  <div class="row justify-between q-mb-sm">
                    <div class="text-body2">Shipping:</div>
                    <div class="text-body2" v-if="selectedShippingDetails">
                      <span v-if="selectedShippingDetails.type === 'shipping'">
                        ${{ shippingCost.toFixed(2) }}
                      </span>
                      <span v-else class="text-positive"> Free (Pickup) </span>
                    </div>
                    <div class="text-body2" v-else>—</div>
                  </div>
                  <q-separator class="q-my-md" />
                  <div class="row justify-between">
                    <div class="text-h6">Total:</div>
                    <div class="text-h6 text-primary">
                      ${{ orderTotal.toFixed(2) }}
                    </div>
                  </div>
                </q-card-section>

                <!-- Payment Options -->
                <q-card-section v-if="selectedShippingOption">
                  <div class="text-h6 q-mb-md">Payment Method</div>

                  <!-- Apple Pay Button (shown when credit card form is NOT visible) -->
                  <div v-if="availablePaymentMethods.applePay && !showCreditCardForm" class="q-mb-lg">
                    <div
                      v-if="!applePayReady && !applePayError"
                      class="text-body2 text-grey-6 q-mb-sm"
                    >
                      <q-spinner size="20px" class="q-mr-sm" />
                      Checking Apple Pay availability...
                    </div>
                    <div
                      v-show="applePayReady"
                      id="square-apple-pay-button"
                      class="wallet-button"
                    ></div>
                    <div
                      v-if="applePayError"
                      class="text-negative q-mt-sm q-pa-sm bg-red-1 rounded-borders"
                    >
                      <q-icon name="error" class="q-mr-sm" />
                      <span v-if="typeof applePayError === 'string'">{{
                        applePayError
                      }}</span>
                      <span v-else>{{
                        applePayError?.message || 'Apple Pay is not available'
                      }}</span>
                    </div>
                  </div>

                  <!-- Apple Pay Section (expandable when credit card form is shown) -->
                  <div v-if="availablePaymentMethods.applePay && showCreditCardForm" class="q-mb-lg">
                    <q-expansion-item
                      v-model="showApplePaySection"
                      :default-opened="false"
                      expand-separator
                      icon="apple"
                      label="Buy with Apple Pay"
                      class="q-mb-md"
                    >
                      <div
                        v-if="!applePayReady && !applePayError"
                        class="text-body2 text-grey-6 q-mb-sm"
                      >
                        <q-spinner size="20px" class="q-mr-sm" />
                        Checking Apple Pay availability...
                      </div>
                      <div
                        v-show="applePayReady"
                        id="square-apple-pay-button-collapsed"
                        class="wallet-button"
                      ></div>
                      <div
                        v-if="applePayError"
                        class="text-negative q-mt-sm q-pa-sm bg-red-1 rounded-borders"
                      >
                        <q-icon name="error" class="q-mr-sm" />
                        <span v-if="typeof applePayError === 'string'">{{
                          applePayError
                        }}</span>
                        <span v-else>{{
                          applePayError?.message || 'Apple Pay is not available'
                        }}</span>
                      </div>
                    </q-expansion-item>
                  </div>

                  <!-- Pay with Credit Card Button -->
                  <div v-if="!showCreditCardForm" class="q-mb-lg">
                    <q-btn
                      color="primary"
                      size="lg"
                      class="full-width"
                      style="height: 50px; min-height: 50px; border-radius: 8px; font-size: 17px; font-weight: 400;"
                      @click="handleCreditCardButtonClick"
                    >
                      <q-icon name="credit_card" class="q-mr-sm" />
                      Pay with Credit Card with Square
                    </q-btn>
                  </div>

                  <!-- Credit Card Form (shown when Pay with Credit Card button is clicked) -->
                  <div v-if="showCreditCardForm">
                    <!-- Square payment form container -->
                    <!-- Key attribute ensures container is recreated when form is shown -->
                    <div
                      :key="`square-form-${showCreditCardForm}`"
                      id="square-payment-form"
                      style="min-height: 20px"
                      class="q-mb-md"
                    >
                      <!-- Show loading only if not initialized AND no error -->
                      <div
                        v-if="!squareCardMounted && !squareInitError"
                        class="text-body2 text-grey-6 q-pa-md text-center"
                      >
                        <q-spinner size="24px" class="q-mr-sm" />
                        Loading secure payment form...
                      </div>
                      <!-- Show error if initialization failed -->
                      <div
                        v-if="squareInitError"
                        class="text-negative text-caption q-pa-sm bg-red-1 rounded-borders"
                      >
                        <q-icon name="error" class="q-mr-xs" />
                        <strong>Error loading payment form:</strong>
                        <div class="q-mt-xs">{{ squareInitError.message }}</div>
                        <div class="q-mt-xs text-caption">
                          Please refresh the page or contact support if the
                          issue persists.
                        </div>
                      </div>
                      <!-- Form will be rendered here by Square SDK when mounted -->
                      <!-- The loading spinner above will be hidden once squareCardMounted is true -->
                    </div>

                    <!-- Billing Address Section -->
                    <div>
                      <div class="text-h6 q-mb-md q-mt-md">Billing Address</div>
                      <q-toggle
                        v-if="
                          !skipShipping &&
                          selectedShippingDetails?.type !== 'pickup' &&
                          requiresShippingAddress
                        "
                        v-model="billingSameAsShipping"
                        :disable="!requiresShippingAddress"
                        label="Billing address matches shipping address"
                        class="q-mb-md"
                      />
                      <div
                        v-if="
                          requiresBillingAddress &&
                          (skipShipping ||
                            !billingSameAsShipping ||
                            !requiresShippingAddress)
                        "
                      >
                        <q-input
                          v-model="billingAddress.street"
                          label="Billing Street Address *"
                          filled
                          class="q-mb-md"
                          :error="billingStreetError"
                          :error-message="
                            billingStreetError ? 'Billing street is required' : ''
                          "
                          :input-attrs="{ autocomplete: 'billing address-line1' }"
                        />
                        <div class="row q-col-gutter-md q-mb-md">
                          <div class="col-6">
                            <q-input
                              v-model="billingAddress.city"
                              label="Billing City *"
                              filled
                              :error="billingCityError"
                              :error-message="
                                billingCityError ? 'Billing city is required' : ''
                              "
                              :input-attrs="{
                                autocomplete: 'billing address-level2',
                              }"
                            />
                          </div>
                          <div class="col-6">
                            <q-input
                              v-model="billingAddress.state"
                              label="Billing State *"
                              filled
                              :error="billingStateError"
                              :error-message="
                                billingStateError
                                  ? 'Billing state is required'
                                  : ''
                              "
                              :input-attrs="{
                                autocomplete: 'billing address-level1',
                              }"
                            />
                          </div>
                        </div>
                        <div class="row q-col-gutter-md">
                          <div class="col-6">
                            <q-input
                              v-model="billingAddress.zip"
                              label="Billing ZIP Code *"
                              filled
                              :error="billingZipError"
                              :error-message="
                                billingZipError ? 'Billing ZIP is required' : ''
                              "
                              :input-attrs="{
                                autocomplete: 'billing postal-code',
                              }"
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        v-if="
                          skipShipping &&
                          requiresBillingAddress &&
                          billingSameAsShipping
                        "
                        class="text-body2 text-grey-7 q-mt-md"
                      >
                        Please provide a billing address so we can verify your
                        payment details.
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-actions vertical class="q-pa-md q-pt-none">
                  <!-- Submit button (only shown when credit card form is visible) -->
                  <q-btn
                    v-if="showCreditCardForm"
                    color="primary"
                    label="Place Order"
                    icon="check"
                    size="lg"
                    class="full-width"
                    :loading="submitting"
                    :disable="!canPlaceOrder"
                    @click="placeOrder"
                  />
                  <q-btn
                    flat
                    icon="arrow_back"
                    label="Back to Cart"
                    @click="$router.push('/cart')"
                    class="full-width q-mt-sm"
                  />

                  <!-- Kiosk Payment Option (only shown when from market event upload) -->
                  <q-btn
                    v-if="
                      isFromMarketEventUpload && skipShipping && checkedInEvent
                    "
                    flat
                    color="primary"
                    icon="point_of_sale"
                    label="Changed my mind, I'll just pay at the kiosk"
                    @click="submitKioskOrder"
                    class="full-width q-mt-md"
                    :loading="submittingKiosk"
                    :disable="!canPlaceKioskOrder"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCart } from '../composables/useCart.js';
import { marketEventService } from '../services/marketEventService.js';
import { useCustomerType } from '../composables/useCustomerType.js';
import {
  firebaseService,
  DEFAULT_SHIPPING_OPTIONS,
} from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { config as envConfig } from '../config/environment.js';

export default {
  name: 'CheckoutPage',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();
    
    // Import and initialize notification service
    let notificationServiceInstance = null;
    import('../services/notificationService.js').then(({ notificationService }) => {
      notificationService.setQuasar($q);
      notificationServiceInstance = notificationService;
    });
    
    const safeNotify = (options) => {
      if (notificationServiceInstance) {
        notificationServiceInstance.notify(options);
      } else {
        // Fallback to direct notify if service not loaded yet
        if ($q && typeof $q.notify === 'function') {
          $q.notify(options);
        } else {
          console.warn('Notify plugin unavailable', options);
        }
      }
    };
    const { cartItems, cartSubtotal, clearCart } = useCart();
    const { isMarketCustomer } = useCustomerType();

    const submitting = ref(false);
    const submittingKiosk = ref(false);
    const checkedInEvent = ref(null);
    const selectedShippingOption = ref(null);
    const selectedPaymentOption = ref('square_card'); // Default to credit card
    const squareInitialized = ref(false);
    const squarePayments = ref(null);
    const squarePaymentRequest = ref(null);
    const squareCard = ref(null);
    const squareApplePay = ref(null);
    const applePayToken = ref(null);
    const squareGooglePay = ref(null);
    const applePayReady = ref(false);
    const googlePayReady = ref(false);
    const applePayAttached = ref(false);
    const googlePayAttached = ref(false);
    const squareCardMounted = ref(false);
    const squareInitError = ref(null);
    const applePayError = ref(null);
    const googlePayError = ref(null);
    const squareProcessing = ref(false);
    const showCreditCardForm = ref(false); // Track if credit card form should be shown
    const showApplePaySection = ref(false); // Track if Apple Pay section is expanded

    const customerInfo = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });

    const shippingAddress = ref({
      street: '',
      city: '',
      state: '',
      zip: '',
    });
    const billingAddress = ref({
      street: '',
      city: '',
      state: '',
      zip: '',
    });
    const billingSameAsShipping = ref(true);
    const shippingOptionsData = ref([]);
    const loadingShippingOptions = ref(true);
    const showValidationErrors = ref(false);
    const showOtherShippingOptions = ref(false);
    const switchToMarketEventPickup = ref(false);

    // Determine if this checkout is from market event upload (vs online order)
    const isFromMarketEventUpload = computed(() => {
      // If skipShipping is set in query, it's from market event upload
      if (
        route.query.skipShipping === '1' ||
        route.query.skipShipping === 'true'
      ) {
        return true;
      }
      // If customTotal is set, it's from market event upload
      if (route.query.customTotal) {
        return true;
      }
      // If context is market_event, it's from market event upload
      if (route.query.context === 'market_event') {
        return true;
      }
      return false;
    });

    // Check for active market event and check-in status
    onMounted(async () => {
      console.log('🛒 Checkout page route query:', route.query);
      console.log(
        '🛒 Checkout page isFromMarketEventUpload:',
        isFromMarketEventUpload.value
      );
      checkedInEvent.value = marketEventService.getCheckedInEvent();
      console.log('🛒 Checkout page - checkedInEvent:', checkedInEvent.value);
      console.log(
        '🛒 Checkout page - isMarketCustomer:',
        isMarketCustomer.value
      );

      // Check if cart items are from market event (have marketEventContext flag)
      const hasMarketEventCartItems = cartItems.value.some(
        (item) => item.marketEventContext === true
      );
      console.log(
        '🛒 Checkout page - hasMarketEventCartItems:',
        hasMarketEventCartItems
      );
      console.log(
        '🛒 Checkout page - isFromMarketEventUpload:',
        isFromMarketEventUpload.value
      );

      // If cart has market event items, treat as coming from market event upload
      if (hasMarketEventCartItems && !isFromMarketEventUpload.value) {
        // Set skipShipping to true to match market event context
        // This will be handled by the skipShipping computed property
        console.log(
          '🛒 Cart contains market event items, applying market event context'
        );
      }

      loadShippingOptions();

      // Pre-fill customer info in priority order:
      // 1. From cart items' formData (most recent, from upload forms)
      // 2. From route query params (from market event upload direct navigation)
      // 3. From authenticated user (if logged in)
      
      // Use nextTick to ensure cart items are loaded (they might be loading from Firestore/localStorage)
      await nextTick();
      
      // Small delay to ensure cart items from Firestore are loaded
      setTimeout(() => {
        // Priority 1: Check cart items for formData (from upload forms)
        const customUploadItem = cartItems.value.find(
          (item) => item.isCustomUpload && item.formData
        );
        if (customUploadItem?.formData) {
          console.log('📝 Pre-filling customer info from cart item formData:', customUploadItem.formData);
          customerInfo.value.firstName = customUploadItem.formData.firstName || customerInfo.value.firstName || '';
          customerInfo.value.lastName = customUploadItem.formData.lastName || customerInfo.value.lastName || '';
          customerInfo.value.email = customUploadItem.formData.email || customerInfo.value.email || '';
          customerInfo.value.phone = customUploadItem.formData.phone || customerInfo.value.phone || '';
        } else {
          console.log('⚠️ No formData found in cart items. Cart items:', cartItems.value.map(item => ({
            isCustomUpload: item.isCustomUpload,
            hasFormData: !!item.formData,
            productName: item.productName
          })));
        }
      }, 100);
      
      // Also check immediately (in case cart items are already loaded)
      const customUploadItem = cartItems.value.find(
        (item) => item.isCustomUpload && item.formData
      );
      if (customUploadItem?.formData) {
        console.log('📝 Pre-filling customer info from cart item formData (immediate):', customUploadItem.formData);
        customerInfo.value.firstName = customUploadItem.formData.firstName || customerInfo.value.firstName || '';
        customerInfo.value.lastName = customUploadItem.formData.lastName || customerInfo.value.lastName || '';
        customerInfo.value.email = customUploadItem.formData.email || customerInfo.value.email || '';
        customerInfo.value.phone = customUploadItem.formData.phone || customerInfo.value.phone || '';
      }

      // Priority 2: Pre-fill from route query if available (from market event upload direct navigation)
      // Only use if not already set from cart item formData
      if (!customerInfo.value.firstName && route.query.firstName) {
        customerInfo.value.firstName = route.query.firstName;
      }
      if (!customerInfo.value.lastName && route.query.lastName) {
        customerInfo.value.lastName = route.query.lastName;
      }
      if (!customerInfo.value.email && route.query.email) {
        customerInfo.value.email = route.query.email;
      }
      if (!customerInfo.value.phone && route.query.phone) {
        customerInfo.value.phone = route.query.phone;
      }

      // Priority 3: Pre-fill from authenticated user (only if not already set)
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        if (!customerInfo.value.email) {
          customerInfo.value.email = currentUser.email || '';
        }
        if (currentUser.displayName && !customerInfo.value.firstName) {
          const nameParts = currentUser.displayName.split(' ');
          customerInfo.value.firstName = nameParts[0] || '';
          if (!customerInfo.value.lastName && nameParts.length > 1) {
            customerInfo.value.lastName = nameParts.slice(1).join(' ') || '';
          }
        }
      }

      // If skipShipping, set billingSameAsShipping to false
      if (skipShipping.value) {
        billingSameAsShipping.value = false;
      }

      // Check environment variables first
      const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
      const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

      console.log('🔵 CheckoutPage mounted - Square configuration:', {
        hasApplicationId: !!applicationId,
        hasLocationId: !!locationId,
        applicationIdPrefix: applicationId
          ? applicationId.substring(0, 15) + '...'
          : 'MISSING',
        locationId: locationId || 'MISSING',
        hasWindowSquare: typeof window !== 'undefined' && !!window.Square,
      });

      if (!applicationId || !locationId) {
        const errorMsg = `Square credentials not configured. Application ID: ${
          applicationId ? 'set' : 'MISSING'
        }, Location ID: ${
          locationId ? 'set' : 'MISSING'
        }. Please configure Vercel environment variables for Production and Preview environments.`;
        console.error('❌', errorMsg);
        squareInitError.value = new Error(errorMsg);
        return;
      }

      // Wait for Square SDK to load, then initialize
      waitForSquareSDK()
        .then(() => {
          console.log('✅ Square SDK loaded, initializing payments...');
          initializeSquarePayments();
        })
        .catch((error) => {
          console.error('❌ Failed to load Square SDK:', error);
          squareInitError.value = error;
        });
    });

    const normalizeShippingOption = (option) => {
      if (!option) {
        return null;
      }
      const costNumber = Number(option.cost ?? 0);
      const costLabel =
        costNumber > 0 ? ` - $${costNumber.toFixed(2)}` : ' - Free';
      const title = option.label || 'Shipping';
      // Ensure requiresAddress is set (default to true if allowAddress is true, false if allowAddress is false)
      const requiresAddress = option.requiresAddress !== undefined
        ? option.requiresAddress
        : (option.allowAddress !== false);
      
      return {
        label: `${title}${costLabel}`,
        value: option.value || option.id,
        description:
          option.description ||
          option.estimatedTimeline ||
          (costNumber === 0 ? 'No additional shipping cost' : ''),
        cost: costNumber,
        estimatedTimeline: option.estimatedTimeline || '',
        allowAddress: option.allowAddress !== false,
        requiresAddress: requiresAddress,
        type: option.type || 'shipping',
        // Preserve default value - handle boolean, string, and number
        default: option.default === true || option.default === 'true' || option.default === 1 || option.default === '1',
        rawLabel: title,
      };
    };

    const shippingOptions = computed(() => {
      const baseOptions = Array.isArray(shippingOptionsData.value)
        ? shippingOptionsData.value
        : [];
      const normalized = [];

      const pushOption = (option) => {
        const normalizedOption = normalizeShippingOption(option);
        if (!normalizedOption?.value) {
          return;
        }
        if (
          normalized.find(
            (existing) => existing.value === normalizedOption.value
          )
        ) {
          return;
        }
        normalized.push(normalizedOption);
      };

      // Check current market event status (not just the ref, in case it changed)
      // Note: We can't modify checkedInEvent.value here (side effect), so we just check the current status
      const currentCheckedInEvent = marketEventService.getCheckedInEvent();

      // Also check if user is a market customer (from customer type)
      const userIsMarketCustomer = isMarketCustomer.value;
      const shouldShowPickup =
        currentCheckedInEvent || checkedInEvent.value || userIsMarketCustomer;

      baseOptions.forEach((option) => {
        if (!option) {
          return;
        }
        const type = option.type || 'shipping';
        if (type === 'pickup') {
          if (shouldShowPickup) {
            pushOption(option);
          }
        } else {
          pushOption(option);
        }
      });

      // If no options from database, add default options
      // Always include pickup option in defaults if shouldShowPickup is true
      if (!normalized.length) {
        console.log(
          '🔄 No options from database, using DEFAULT_SHIPPING_OPTIONS, shouldShowPickup:',
          shouldShowPickup
        );
        DEFAULT_SHIPPING_OPTIONS.forEach((option) => {
          const type = option.type || 'shipping';
          if (type === 'pickup') {
            if (shouldShowPickup) {
              pushOption(option);
              console.log('✅ Added pickup option from defaults');
            } else {
              console.log(
                '⚠️ Pickup option available but shouldShowPickup is false'
              );
            }
          } else {
            pushOption(option);
          }
        });
      } else {
        // Even if we have options from database, ensure pickup is included if shouldShowPickup
        const hasPickupOption = normalized.some((opt) => opt.type === 'pickup');
        if (!hasPickupOption && shouldShowPickup) {
          console.log(
            '🔄 No pickup option in database options, adding from defaults'
          );
          const pickupDefault = DEFAULT_SHIPPING_OPTIONS.find(
            (opt) => opt.type === 'pickup'
          );
          if (pickupDefault) {
            pushOption(pickupDefault);
            console.log(
              '✅ Added pickup option from defaults to existing options'
            );
          }
        }
      }

      return normalized;
    });

    // Separate pickup and shipping options for display
    const pickupOptions = computed(() => {
      return shippingOptions.value.filter((option) => option.type === 'pickup');
    });

    const otherShippingOptions = computed(() => {
      return shippingOptions.value.filter((option) => option.type !== 'pickup');
    });

    const selectedShippingDetails = computed(() => {
      return (
        shippingOptions.value.find(
          (option) => option.value === selectedShippingOption.value
        ) || null
      );
    });

    const shippingCost = computed(() => {
      // If shipping is skipped (pay at tent or skipShipping query), cost is 0
      if (skipShipping.value) {
        return 0;
      }
      // If pickup is selected, shipping cost is 0
      if (selectedShippingDetails.value?.type === 'pickup') {
        return 0;
      }
      return selectedShippingDetails.value?.cost || 0;
    });
    const shippingTimeline = computed(
      () => selectedShippingDetails.value?.estimatedTimeline || ''
    );
    // Check if shipping should be skipped (from route query or pay at tent)
    // Note: pickup selection doesn't skip shipping section - it just hides address fields
    const skipShipping = computed(() => {
      // Skip shipping if explicitly set in query (market event upload with pay online)
      if (
        route.query.skipShipping === '1' ||
        route.query.skipShipping === 'true'
      ) {
        return true;
      }
      // Skip shipping if cart items are from market event (have marketEventContext flag)
      const hasMarketEventCartItems = cartItems.value.some(
        (item) => item.marketEventContext === true
      );
      if (hasMarketEventCartItems) {
        return true;
      }
      // Skip shipping if user selected "pay at tent" (market event pickup)
      if (selectedPaymentOption.value === 'pay_at_event') {
        return true;
      }
      // Skip shipping if user toggled to switch to market event pickup
      if (switchToMarketEventPickup.value) {
        return true;
      }
      return false;
    });

    const requiresShippingAddress = computed(() => {
      // If skipShipping is true, don't require shipping address
      if (skipShipping.value) {
        return false;
      }
      // Check if selected shipping option requires address
      if (selectedShippingDetails.value) {
        // Use requiresAddress if set, otherwise fall back to allowAddress (default true)
        const requiresAddress = selectedShippingDetails.value.requiresAddress !== undefined
          ? selectedShippingDetails.value.requiresAddress
          : (selectedShippingDetails.value.allowAddress !== false);
        return requiresAddress;
      }
      return false;
    });
    const requiresBillingAddress = computed(() => {
      // Apple Pay doesn't require billing address (handled by Apple Pay sheet)
      // Check both selectedPaymentOption and applePayToken to handle cases where
      // Apple Pay button is clicked but selectedPaymentOption isn't set yet
      if (selectedPaymentOption.value === 'apple_pay' || applePayToken.value) {
        return false;
      }
      // Always require billing address for credit card payments
      if (selectedPaymentOption.value === 'square_card') {
        return true;
      }
      // For other payment methods, only require if shipping address is required
      // and billing is different from shipping
      if (requiresShippingAddress.value && !billingSameAsShipping.value) {
        return true;
      }
      return false;
    });

    const addressIsComplete = (address) => {
      if (!address) return false;
      const { street, city, state, zip } = address;
      return [street, city, state, zip].every(
        (value) => value && value.toString().trim().length > 0
      );
    };

    // Validate that all photos in custom upload items are uploaded (have valid URLs)
    const validatePhotosUploaded = () => {
      for (const item of cartItems.value) {
        if (item.isCustomUpload && item.photos) {
          for (const photo of item.photos) {
            // Photo must have a URL that's not a blob URL (blob URLs are temporary)
            // Valid URLs should be from Firebase Storage (contain firebasestorage.googleapis.com)
            // or be a data URL that was already uploaded
            if (!photo.url) {
              return {
                valid: false,
                message: 'Some photos have not been uploaded yet. Please wait for uploads to complete.',
              };
            }
            // Check if it's a blob URL (temporary, not uploaded)
            if (photo.url.startsWith('blob:')) {
              return {
                valid: false,
                message: 'Some photos are still uploading. Please wait for all uploads to complete before placing your order.',
              };
            }
            // Check if it's a data URL (base64) - these should be uploaded
            if (photo.url.startsWith('data:')) {
              return {
                valid: false,
                message: 'Some photos need to be uploaded. Please wait for uploads to complete.',
              };
            }
            // Valid URL should be from Firebase Storage or another valid HTTP(S) URL
            if (!photo.url.startsWith('http://') && !photo.url.startsWith('https://')) {
              return {
                valid: false,
                message: 'Some photos have invalid URLs. Please try uploading again.',
              };
            }
          }
        }
      }
      return { valid: true };
    };

    const sanitizeAddress = (address) => {
      if (!address) {
        return null;
      }
      const trimmed = {
        street: (address.street || '').trim(),
        city: (address.city || '').trim(),
        state: (address.state || '').trim(),
        zip: (address.zip || '').trim(),
      };
      const hasValue = Object.values(trimmed).some((value) => value.length > 0);
      return hasValue ? trimmed : null;
    };

    const applyDefaultShippingSelection = () => {
      const options = shippingOptions.value;
      console.log(
        '🔄 applyDefaultShippingSelection called, options:',
        options.map((o) => ({ value: o.value, type: o.type, label: o.label }))
      );
      console.log(
        '🔄 Current selectedShippingOption:',
        selectedShippingOption.value
      );

      if (!options.length) {
        console.log('⚠️ No shipping options available');
        selectedShippingOption.value = null;
        return;
      }
      
      // Check if currently selected option exists and is the default
      const existing = options.find(
        (option) => option.value === selectedShippingOption.value
      );
      
      // Check if the existing selection is actually the default option
      if (existing) {
        const isDefault = existing.default === true || existing.default === 'true' || existing.default === 1 || existing.default === '1';
        if (isDefault) {
          console.log(
            '✅ Selected option is already the default, keeping it:',
            selectedShippingOption.value
          );
          return;
        } else {
          console.log(
            '🔄 Selected option exists but is not the default, will check for default option:',
            selectedShippingOption.value,
            'Default status:', existing.default
          );
          // Don't return - continue to check for default option below
        }
      }

      // Check if cart items are from market event
      const hasMarketEventCartItems = cartItems.value.some(
        (item) => item.marketEventContext === true
      );

      // Check if user is currently at a market event (refresh checkedInEvent)
      const currentCheckedInEvent = marketEventService.getCheckedInEvent();

      // Check if user is a market customer (from customer type)
      const userIsMarketCustomer = isMarketCustomer.value;

      console.log('🔄 Checking conditions for pickup:', {
        isFromMarketEventUpload: isFromMarketEventUpload.value,
        currentCheckedInEvent: !!currentCheckedInEvent,
        checkedInEvent: !!checkedInEvent.value,
        userIsMarketCustomer,
        hasMarketEventCartItems,
      });

      // Check if user is an online customer (explicitly chose "No, Order Online")
      // If they're an online customer, they should NOT default to pickup even if they're at an event
      const isOnlineCustomer = !userIsMarketCustomer;
      
      // Only default to pickup if:
      // 1. User is actually at a market event (checked in) AND
      // 2. User is a market customer (not an online customer) AND
      // 3. Either coming from market event upload OR has market event items
      // This ensures online customers always get shipping options, not pickup
      if (
        !isOnlineCustomer && // User must be a market customer
        (currentCheckedInEvent || checkedInEvent.value) && // User must be checked in at event
        (isFromMarketEventUpload.value || hasMarketEventCartItems) // Must have market event context
      ) {
        const pickupOption = options.find((option) => option.type === 'pickup');
        console.log('🔄 Looking for pickup option, found:', pickupOption);
        if (pickupOption) {
          selectedShippingOption.value = pickupOption.value;
          console.log(
            '✅ Defaulted to pickup option for market event:',
            pickupOption.value,
            {
              isFromMarketEventUpload: isFromMarketEventUpload.value,
              currentCheckedInEvent: !!currentCheckedInEvent,
              checkedInEvent: !!checkedInEvent.value,
              userIsMarketCustomer,
              isOnlineCustomer,
              hasMarketEventCartItems,
            }
          );
          return;
        } else {
          console.log(
            '⚠️ No pickup option found in options! Available options:',
            options.map((o) => ({ value: o.value, type: o.type }))
          );
        }
      }

      // For online customers OR when not at market event, use the default option
      // First try to find the option marked as default (regardless of type)
      // If default is a pickup option and user is online, prefer shipping options
      // If no default shipping option, use first shipping option
      
      // Log all options with their default status for debugging
      console.log('🔄 All shipping options with default status:', options.map(o => ({
        value: o.value,
        label: o.label,
        type: o.type,
        default: o.default,
        defaultType: typeof o.default,
        isDefault: o.default === true || o.default === 'true' || o.default === 1
      })));
      
      // Check for any default option (regardless of type)
      const anyDefaultOption = options.find(
        (option) => {
          const isDefault = option.default === true || option.default === 'true' || option.default === 1 || option.default === '1';
          return isDefault;
        }
      );
      
      // Check for default shipping option specifically
      const defaultShippingOption = options.find(
        (option) => {
          const isDefault = option.default === true || option.default === 'true' || option.default === 1 || option.default === '1';
          const isShipping = option.type === 'shipping';
          return isDefault && isShipping;
        }
      );
      
      // Get first shipping option as fallback
      const firstShippingOption = options.find(o => o.type === 'shipping');
      
      // Determine which option to use
      let defaultOption;
      if (anyDefaultOption) {
        // There is a default option set
        if (anyDefaultOption.type === 'pickup' && isOnlineCustomer) {
          // Default is pickup but user is online - prefer shipping
          defaultOption = defaultShippingOption || firstShippingOption || options[0];
          console.log('🔄 Default is pickup but user is online, using shipping option instead');
        } else {
          // Use the default option (whether shipping or pickup)
          defaultOption = anyDefaultOption;
          console.log('🔄 Using admin-set default option:', anyDefaultOption.label);
        }
      } else {
        // No default set - use first shipping option for online customers
        defaultOption = defaultShippingOption || firstShippingOption || options[0];
        console.log('🔄 No default option set, using first shipping option');
      }
      
      console.log('🔄 Final default option selection:', {
        selectedValue: defaultOption?.value,
        selectedLabel: defaultOption?.label,
        isOnlineCustomer,
        userIsMarketCustomer,
        anyDefaultOptionValue: anyDefaultOption?.value,
        anyDefaultOptionType: anyDefaultOption?.type,
        anyDefaultOptionLabel: anyDefaultOption?.label,
        hasDefaultShipping: !!defaultShippingOption,
        defaultShippingOptionValue: defaultShippingOption?.value,
        optionType: defaultOption?.type,
        allOptions: options.length,
      });
      
      if (defaultOption) {
        selectedShippingOption.value = defaultOption.value;
      } else {
        console.warn('⚠️ No default option found! Available options:', options);
      }
    };

    const loadShippingOptions = async () => {
      // Always load shipping options, even if skipShipping is true
      // We still need to show the pickup option for market event context
      loadingShippingOptions.value = true;
      try {
        // Non-admins should not see testing shipping options
        const isAdmin = authService.isAdmin();
        const options = await firebaseService.getShippingOptions(!isAdmin);
        shippingOptionsData.value = Array.isArray(options)
          ? options
          : DEFAULT_SHIPPING_OPTIONS;
        console.log(
          '🔄 Shipping options loaded:',
          (Array.isArray(options) ? options : DEFAULT_SHIPPING_OPTIONS).map(
            (o) => ({ value: o.value, type: o.type, label: o.label })
          )
        );
      } catch (error) {
        console.error('Error loading shipping options:', error);
        shippingOptionsData.value = DEFAULT_SHIPPING_OPTIONS;
        safeNotify({
          type: 'warning',
          message: 'Using default shipping options',
          position: 'top',
        });
      } finally {
        loadingShippingOptions.value = false;
        // Wait a tick to ensure shippingOptions computed has updated
        await nextTick();
        console.log(
          '🔄 Calling applyDefaultShippingSelection after loading options'
        );
        applyDefaultShippingSelection();
      }
    };

    // Available payment methods based on Square readiness and context
    const availablePaymentMethods = computed(() => {
      // Pay at event is available when:
      // 1. There's a checked-in market event AND
      // 2. Either: user is from market event upload OR user has toggled to switch to pickup
      const hasCheckedInEvent = !!checkedInEvent.value;
      const canPayAtEvent =
        hasCheckedInEvent &&
        (isFromMarketEventUpload.value || switchToMarketEventPickup.value);

      // Check if PayPal client ID is configured
      const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      const isPayPalConfigured =
        !!paypalClientId &&
        paypalClientId !== 'YOUR_PAYPAL_CLIENT_ID' &&
        paypalClientId.trim() !== '';

      // Debug logging for payment methods
      if (applePayReady.value) {
        console.log('✅ Apple Pay is available');
      } else if (squarePayments.value) {
        console.log('❌ Apple Pay not available:', {
          applePayReady: applePayReady.value,
          applePayError: applePayError.value,
          hasSquarePayments: !!squarePayments.value,
        });
      }

      return {
        applePay: applePayReady.value,
        googlePay: googlePayReady.value,
        paypal: isPayPalConfigured, // Only show PayPal if client ID is configured
        payAtEvent: canPayAtEvent,
      };
    });

    const paymentOptions = computed(() => {
      const options = [];

      if (availablePaymentMethods.value.applePay) {
        options.push({
          label: 'Apple Pay',
          value: 'apple_pay',
          disable: false,
        });
      }

      if (availablePaymentMethods.value.googlePay) {
        options.push({
          label: 'Google Pay',
          value: 'google_pay',
          disable: false,
        });
      }

      options.push({
        label: 'Credit/Debit Card',
        value: 'square_card',
        disable: !squareInitialized.value,
      });

      // Only show PayPal if it's configured
      if (availablePaymentMethods.value.paypal) {
        options.push({
          label: 'PayPal',
          value: 'paypal',
          disable: false,
        });
      }

      if (availablePaymentMethods.value.payAtEvent) {
        options.push({
          label: 'Pay at Market Event Kiosk',
          value: 'pay_at_event',
          disable: false,
        });
      }

      return options;
    });

    // Calculate order total
    const orderTotal = computed(() => {
      // Always calculate from cart if cart has items (more accurate)
      // Only use customTotal if cart is empty (for direct market event orders without cart)
      if (cartItems.value.length > 0) {
        let total = cartSubtotal.value;
        // Only add shipping cost if shipping type is selected (not pickup)
        if (selectedShippingDetails.value?.type === 'shipping') {
          total += shippingCost.value;
        }
        // TODO: Add tax calculation if needed
        return total;
      }

      // If cart is empty, use customTotal from query (for market event orders without cart)
      if (route.query.customTotal) {
        const customTotal = parseFloat(route.query.customTotal);
        if (!isNaN(customTotal)) {
          return customTotal;
        }
      }

      // Fallback to 0 if no cart and no customTotal
      return 0;
    });

    // Auto-select payment option when shipping option list updates
    watch(
      paymentOptions,
      (options) => {
        if (
          !options.find(
            (option) => option.value === selectedPaymentOption.value
          )
        ) {
          selectedPaymentOption.value =
            options.length > 0 ? options[0].value : null;
        }
      },
      { immediate: true }
    );

    watch(
      shippingOptions,
      () => {
        applyDefaultShippingSelection();
      },
      { immediate: true }
    );

    // Watch for changes in checked-in event status
    watch(
      () => marketEventService.getCheckedInEvent(),
      (newEvent) => {
        if (newEvent !== checkedInEvent.value) {
          checkedInEvent.value = newEvent;
          // Re-apply shipping selection when event status changes
          applyDefaultShippingSelection();
        }
      },
      { immediate: true }
    );

    // Watch cart items for customer info updates (in case items are added while on checkout page)
    watch(
      () => cartItems.value,
      (newItems) => {
        // Check if any cart item has formData with customer info
        const customUploadItem = newItems.find(
          (item) => item.isCustomUpload && item.formData
        );
        if (customUploadItem?.formData) {
          // Only update if field is currently empty (don't overwrite user input)
          if (!customerInfo.value.firstName && customUploadItem.formData.firstName) {
            customerInfo.value.firstName = customUploadItem.formData.firstName;
          }
          if (!customerInfo.value.lastName && customUploadItem.formData.lastName) {
            customerInfo.value.lastName = customUploadItem.formData.lastName;
          }
          if (!customerInfo.value.email && customUploadItem.formData.email) {
            customerInfo.value.email = customUploadItem.formData.email;
          }
          if (!customerInfo.value.phone && customUploadItem.formData.phone) {
            customerInfo.value.phone = customUploadItem.formData.phone;
          }
        }
      },
      { deep: true }
    );

    watch(selectedShippingOption, () => {
      if (
        paymentOptions.value.length > 0 &&
        !paymentOptions.value.find(
          (option) => option.value === selectedPaymentOption.value
        )
      ) {
        selectedPaymentOption.value = paymentOptions.value[0].value;
      }
      if (!requiresShippingAddress.value || skipShipping.value) {
        billingSameAsShipping.value = false;
      }
      updateSquarePaymentRequest();
    });

    // Watch for payment option changes - if pay at tent is selected, clear shipping selection
    watch(selectedPaymentOption, (newOption) => {
      if (newOption === 'pay_at_event') {
        // Clear shipping selection when pay at tent is selected
        selectedShippingOption.value = null;
        // Ensure switchToMarketEventPickup is true when pay at event is selected
        if (checkedInEvent.value) {
          switchToMarketEventPickup.value = true;
        }
      } else if (
        newOption !== 'pay_at_event' &&
        switchToMarketEventPickup.value
      ) {
        // If user switches away from pay at event, turn off the toggle
        switchToMarketEventPickup.value = false;
      }
      updateSquarePaymentRequest();
    });

    watch(
      () => selectedShippingDetails.value?.allowAddress,
      (allowAddress) => {
        if (!allowAddress) {
          billingSameAsShipping.value = false;
        } else if (!addressIsComplete(billingAddress.value)) {
          billingSameAsShipping.value = true;
        }
      }
    );

    watch(requiresBillingAddress, (required) => {
      if (!required) {
        billingAddress.value = {
          street: '',
          city: '',
          state: '',
          zip: '',
        };
      }
    });

    watch(
      () => ({ ...shippingAddress.value }),
      () => {
        if (billingSameAsShipping.value && requiresShippingAddress.value) {
          billingAddress.value = { ...shippingAddress.value };
        }
      },
      { deep: true }
    );

    watch(billingSameAsShipping, (same) => {
      if (same && requiresShippingAddress.value) {
        billingAddress.value = { ...shippingAddress.value };
      }
    });

    watch(orderTotal, () => {
      updateSquarePaymentRequest();
    });

    // Watch for Apple Pay becoming ready and render button (regardless of selected payment option)
    watch(applePayReady, async (isReady) => {
      if (isReady && squareApplePay.value) {
        console.log('🍎 Apple Pay became ready, rendering button...');
        applePayAttached.value = false;
        await nextTick();
        await renderApplePayButton();
      }
    });

    // Watch for Apple Pay section expansion - render button when expanded
    watch(showApplePaySection, async (isExpanded) => {
      if (isExpanded && applePayReady.value && squareApplePay.value) {
        console.log('🍎 Apple Pay section expanded, rendering button...');
        // Small delay to ensure DOM is ready
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));
        // Reset attachment to allow re-rendering
        applePayAttached.value = false;
        await renderApplePayButton();
      }
      // When collapsing Apple Pay and credit card form is visible, keep credit card form
      if (!isExpanded && showCreditCardForm.value) {
        // Credit card form stays visible
      } else if (isExpanded && showCreditCardForm.value) {
        // When expanding Apple Pay, collapse credit card form
        showCreditCardForm.value = false;
      }
    });

    watch(selectedPaymentOption, async (option) => {
      if (option === 'square_card') {
        // Wait for Square to be initialized before mounting
        if (squareInitialized.value && squareCard.value) {
          await mountSquareCard();
        } else if (!squareInitialized.value) {
          // Try to initialize if not already done
          console.log(
            'Square not initialized yet, attempting initialization...'
          );
          try {
            await waitForSquareSDK();
            await initializeSquarePayments();
          } catch (error) {
            console.error('Failed to initialize Square:', error);
            squareInitError.value = error;
          }
        }
      }
      if (option === 'paypal') {
        // PayPal is not currently configured
        // To enable PayPal, uncomment the PayPal SDK script in index.html
        // and add VITE_PAYPAL_CLIENT_ID to environment variables
        console.warn(
          'PayPal is not configured. Please configure PayPal client ID to enable PayPal payments.'
        );
        safeNotify({
          type: 'warning',
          message: 'PayPal is not currently available',
          caption: 'Please use another payment method',
          position: 'top',
        });
        // Reset to default payment option (skip PayPal)
        const availableOptions = paymentOptions.value.filter(
          (opt) => opt.value !== 'paypal'
        );
        selectedPaymentOption.value =
          availableOptions.find((opt) => opt.value === 'square_card')?.value ||
          availableOptions[0]?.value ||
          null;
      }
    });

    // Check if order can be placed
    const canPlaceOrder = computed(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (cartItems.value.length === 0) {
        return false;
      }
      if (
        !customerInfo.value.firstName ||
        !customerInfo.value.lastName ||
        !customerInfo.value.email ||
        !emailRegex.test(customerInfo.value.email)
      ) {
        return false;
      }
      // Skip shipping option check if skipShipping is true
      if (!skipShipping.value && !selectedShippingOption.value) {
        return false;
      }
      if (!selectedPaymentOption.value) {
        return false;
      }
      // Validate that all photos are uploaded before allowing payment
      const photoValidation = validatePhotosUploaded();
      if (!photoValidation.valid) {
        return false;
      }
      // Apple Pay doesn't require shipping address (handled by Apple Pay sheet)
      // In test environment, Apple Pay doesn't require address at all
      // Check both selectedPaymentOption and applePayToken to handle cases where
      // Apple Pay button is clicked but selectedPaymentOption isn't set yet
      const isApplePay = selectedPaymentOption.value === 'apple_pay' || applePayToken.value;
      if (
        !skipShipping.value &&
        requiresShippingAddress.value &&
        !addressIsComplete(shippingAddress.value) &&
        !isApplePay
      ) {
        return false;
      }
      // Apple Pay doesn't require billing address (handled by Apple Pay sheet)
      if (
        requiresBillingAddress.value &&
        !isApplePay
      ) {
        if (skipShipping.value) {
          // When skipShipping, always require billing address
          if (!addressIsComplete(billingAddress.value)) {
            return false;
          }
        } else if (
          billingSameAsShipping.value &&
          requiresShippingAddress.value
        ) {
          if (!addressIsComplete(shippingAddress.value)) {
            return false;
          }
        } else if (!addressIsComplete(billingAddress.value)) {
          return false;
        }
      }
      return true;
    });

    const customerFirstNameError = computed(
      () => showValidationErrors.value && !customerInfo.value.firstName
    );
    const customerLastNameError = computed(
      () => showValidationErrors.value && !customerInfo.value.lastName
    );
    const customerEmailError = computed(
      () =>
        showValidationErrors.value &&
        (!customerInfo.value.email ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.value.email))
    );
    const shippingStreetError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.street
    );
    const shippingCityError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.city
    );
    const shippingStateError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.state
    );
    const shippingZipError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.zip
    );
    const billingStreetError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.street
    );
    const billingCityError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.city
    );
    const billingStateError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.state
    );
    const billingZipError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.zip
    );

    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const time = now.getTime().toString().slice(-4);
      return `LMM-${year}${month}${day}-${time}`;
    };

    // Helper function to get payment icon
    const getPaymentIcon = (paymentType) => {
      switch (paymentType) {
        case 'apple_pay':
          return 'apple';
        case 'google_pay':
          return 'account_balance_wallet';
        case 'square_card':
          return 'credit_card';
        case 'paypal':
          return 'account_balance_wallet';
        case 'pay_at_event':
          return 'atm';
        default:
          return 'payment';
      }
    };

    const mountSquareCard = async () => {
      // Only mount if credit card form is visible
      if (!showCreditCardForm.value) {
        console.log('ℹ️ Skipping mount - credit card form not visible');
        return;
      }

      if (!squareCard.value) {
        console.warn('⚠️ Square card not initialized yet');
        return;
      }

      // Wait for DOM to be ready
      await nextTick();

      // Give extra time for container to be available
      let retries = 0;
      let container = document.getElementById('square-payment-form');
      while (!container && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        container = document.getElementById('square-payment-form');
        retries++;
      }

      if (!container) {
        const errorMsg =
          'Square payment form container not found after waiting';
        console.error('❌', errorMsg);
        squareInitError.value = new Error(errorMsg);
        return;
      }

      try {
        console.log('🔵 Mounting Square card form to container...');
        container.setAttribute('autocomplete', 'cc-number');
        container.setAttribute('aria-label', 'Secure credit card form');
        container.classList.add('square-card-container');

        // Check if form is already attached to this container
        const hasSquareForm = container.querySelector('.sq-card') || container.querySelector('[id*="sq-"]');
        
        // Also check if card instance is already attached (even if not in this container)
        // Square SDK tracks attachment globally, so we need to check before attempting attach
        if (squareCardMounted.value && hasSquareForm) {
          console.log('ℹ️ Square card form already mounted and visible');
          return;
        }
        
        if (!hasSquareForm) {
          // Clear any existing content (including loading spinner)
          // Use multiple nextTick calls and delays to ensure Vue has finished rendering
          await nextTick();
          await new Promise((resolve) => setTimeout(resolve, 100));
          await nextTick();

          // Clear container before attaching
          container.innerHTML = '';

          // Wait one more tick to ensure DOM is stable
          await nextTick();
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Attach the card form - this will populate the container
          console.log(
            '🔵 Attaching Square card form to #square-payment-form...'
          );
          try {
            await squareCard.value.attach('#square-payment-form');

            // Wait for Square to finish DOM manipulation before updating Vue state
            await nextTick();
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Now update Vue state - this should prevent reconciliation conflicts
            squareCardMounted.value = true;
            console.log('✅ Square card form mounted successfully');

            // Verify the form was attached
            await nextTick();
            const hasSquareForm =
              container.querySelector('.sq-card') ||
              container.querySelector('[id*="sq-"]') ||
              container.children.length > 0;
            if (hasSquareForm) {
              console.log('✅ Verified: Square form is present in container');
            } else {
              console.warn(
                '⚠️ Warning: Square form container appears empty after mounting'
              );
            }
          } catch (attachError) {
            // Check if error is because card is already attached
            if (attachError?.message?.includes('already been attached') || 
                attachError?.name === 'PaymentMethodAlreadyAttachedError') {
              console.log('ℹ️ Square card already attached, checking if form exists in container...');
              // Check if form actually exists in the container
              const hasForm = container.querySelector('.sq-card') || container.querySelector('[id*="sq-"]');
              if (hasForm) {
                console.log('✅ Square form is present, marking as mounted');
                squareCardMounted.value = true;
                return; // Success - form is already attached and visible
            } else {
              // Form is attached but not in this container - need to create new instance
              console.log('⚠️ Card attached but form not in container, creating new card instance...');
              // Create a new card instance
              try {
                if (!payments.value) {
                  throw new Error('Square payments object not available');
                }
                squareCard.value = payments.value.card();
                // Retry attach with new instance
                await squareCard.value.attach('#square-payment-form');
                await nextTick();
                await new Promise((resolve) => setTimeout(resolve, 150));
                squareCardMounted.value = true;
                console.log('✅ New Square card instance attached successfully');
              } catch (retryError) {
                console.error('❌ Error attaching new card instance:', retryError);
                squareInitError.value = retryError;
                throw retryError;
              }
            }
            } else {
              console.error('❌ Error attaching Square card form:', attachError);
              throw attachError;
            }
          }
        } else {
          console.log('ℹ️ Square card form already mounted');
        }
      } catch (error) {
        console.error('❌ Error mounting Square card form:', {
          message: error?.message,
          stack: error?.stack,
          error,
        });
        squareInitError.value = error;
        // Don't throw - let error be displayed in UI
      }
    };

    const renderApplePayButton = async () => {
      if (!squareApplePay.value) {
        console.log(
          '⚠️ Cannot render Apple Pay button: squareApplePay is null'
        );
        return;
      }
      await nextTick();
      // Try to find the container - could be in regular view or collapsed section
      // First try the collapsed section (when credit card form is shown)
      let container = document.getElementById('square-apple-pay-button-collapsed');
      let containerId = '#square-apple-pay-button-collapsed';
      // If not found, try the regular standalone button
      if (!container) {
        container = document.getElementById('square-apple-pay-button');
        containerId = '#square-apple-pay-button';
      }
      if (!container) {
        console.log('⚠️ Cannot render Apple Pay button: container not found');
        return;
      }
      // Reset attachment flag if container changed (e.g., from collapsed to expanded)
      // Check if there's already a button in the container
      if (applePayAttached.value && !container.querySelector('button')) {
        console.log('🔄 Apple Pay container changed, resetting attachment');
        applePayAttached.value = false;
      }
      if (applePayAttached.value && container.querySelector('button')) {
        console.log('ℹ️ Apple Pay button already attached');
        return;
      }
      container.innerHTML = '';

      // Check what methods are available on the Apple Pay object
      console.log('🔍 Square Apple Pay object methods:', {
        hasAttach: typeof squareApplePay.value.attach === 'function',
        hasMount: typeof squareApplePay.value.mount === 'function',
        hasCreateButton:
          typeof squareApplePay.value.createButton === 'function',
        availableMethods: Object.keys(squareApplePay.value).filter(
          (key) => typeof squareApplePay.value[key] === 'function'
        ),
      });

      try {
        // Try attach first (if it exists)
        if (typeof squareApplePay.value.attach === 'function') {
          console.log('✅ Using attach method');
          await squareApplePay.value.attach(containerId);
          applePayAttached.value = true;
        }
        // Try mount as alternative
        else if (typeof squareApplePay.value.mount === 'function') {
          console.log('✅ Using mount method');
          await squareApplePay.value.mount(containerId);
          applePayAttached.value = true;
        }
        // Try createButton if available
        else if (typeof squareApplePay.value.createButton === 'function') {
          console.log('✅ Using createButton method');
          const button = await squareApplePay.value.createButton();
          container.appendChild(button);
          applePayAttached.value = true;
        } else {
          // Square's SDK doesn't provide button rendering - create native Apple Pay button
          console.log(
            "ℹ️ Square SDK doesn't provide button rendering, creating native Apple Pay button"
          );

          // Create native Apple Pay button using Apple's official button styling
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'apple-pay-button';
          button.setAttribute('lang', 'en-US');
          button.setAttribute('aria-label', 'Buy with Apple Pay');

          // Set button content with Apple logo and text
          // The -apple-pay-button-* CSS will render the logo automatically in Safari
          // For fallback, we'll add text content
          // Note: In Safari, the CSS properties will override this and show the official button
          button.textContent = 'Buy with Apple Pay';

          // Add a data attribute to help with styling
          button.setAttribute('data-apple-pay-button', 'true');

          // Apply official Apple Pay button styles
          // Using Apple's official CSS properties for the button (works in Safari)
          // These properties will automatically render the Apple logo and proper styling
          // Plus fallback styles for browsers that don't support -apple-pay-button-*
          button.style.cssText = `
            -apple-pay-button-type: plain;
            -apple-pay-button-style: black;
            background-color: #000000;
            color: #ffffff;
            width: 100%;
            height: 50px;
            min-height: 50px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 17px;
            font-weight: 400;
            letter-spacing: -0.41px;
            transition: opacity 0.2s ease, background-color 0.2s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            padding: 0;
            margin: 0;
          `;

          // Check if Apple Pay button CSS is supported
          // If not, we need to add the Apple logo manually
          const applePayButtonSupported =
            window.CSS &&
            CSS.supports &&
            CSS.supports('-apple-pay-button-type', 'plain');

          if (!applePayButtonSupported) {
            // Fallback: Add Apple logo SVG manually for browsers that don't support the CSS
            const appleLogo = document.createElement('span');
            appleLogo.innerHTML = `
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                <path d="M12.5 2.5c-.2.3-.3.6-.3 1 0 .6.2 1.1.6 1.5.5.5 1.1.7 1.7.7.1 0 .2 0 .4-.1-.2-.5-.4-1-.4-1.5 0-.6.2-1.1.6-1.5.4-.4.9-.6 1.5-.6.1 0 .2 0 .4.1.1-.4.1-.7.1-1.1 0-1.3-.5-2.4-1.3-3.1-.8-.7-1.9-1.1-3.1-1.1-1.3 0-2.4.5-3.2 1.3-.7.8-1.1 1.9-1.1 3.2 0 .4 0 .7.1 1.1.1 0 .2.1.4.1.6 0 1.2-.2 1.7-.7.4-.4.6-.9.6-1.5 0-.5-.1-1-.4-1.5.1-.1.2-.1.4-.1.6 0 1.2.2 1.7.6z" fill="currentColor"/>
              </svg>
            `;
            button.innerHTML = '';
            button.appendChild(appleLogo);
            const textSpan = document.createElement('span');
            textSpan.textContent = 'Buy with Apple Pay';
            button.appendChild(textSpan);
          }

          // Add hover effect
          button.addEventListener('mouseenter', () => {
            button.style.opacity = '0.9';
            button.style.backgroundColor = '#1a1a1a';
          });
          button.addEventListener('mouseleave', () => {
            button.style.opacity = '1';
            button.style.backgroundColor = '#000000';
          });
          button.addEventListener('mousedown', () => {
            button.style.backgroundColor = '#333333';
          });
          button.addEventListener('mouseup', () => {
            button.style.backgroundColor = '#1a1a1a';
          });

          // Handle button click - tokenize with Square and place order
          button.addEventListener('click', async (e) => {
            console.log('🍎 Native Apple Pay button clicked!');
            e.preventDefault();
            e.stopPropagation();

            // Set payment option to Apple Pay immediately so validation knows to skip billing address
            selectedPaymentOption.value = 'apple_pay';

            // Validate form first (but now it knows we're using Apple Pay, so billing address won't be required)
            if (!canPlaceOrder.value) {
              console.log('⚠️ Cannot place order - form validation failed');
              showValidationErrors.value = true;
              safeNotify({
                type: 'negative',
                message: 'Please fill in all required fields',
                position: 'top',
              });
              return;
            }

            // Prevent multiple clicks
            if (submitting.value) {
              console.log('⏳ Payment already in progress, ignoring click');
              return;
            }

            try {
              console.log('🍎 Apple Pay button clicked, preparing payment...');
              submitting.value = true;

              // Update payment request with current order details before tokenizing
              if (squarePaymentRequest.value) {
                console.log(
                  '🔄 Updating payment request with current order details...'
                );

                // Build line items for the payment request
                const lineItems = [];
                cartItems.value.forEach((item) => {
                  if (item.isCustomUpload) {
                    // Custom upload item
                    const totalCost = Number(item.totalCost) || 0;
                    lineItems.push({
                      label: item.productName || 'Custom Photo Magnets',
                      amount: totalCost.toFixed(2),
                    });
                  } else {
                    // Regular product item
                    const itemTotal =
                      (Number(item.pricePerUnit) || 0) *
                      (Number(item.quantity) || 0);
                    lineItems.push({
                      label: item.productName || 'Product',
                      amount: itemTotal.toFixed(2),
                    });
                  }
                });

                // Add shipping if applicable
                const shippingAmount = Number(shippingCost.value) || 0;
                if (shippingAmount > 0 && selectedShippingDetails.value) {
                  lineItems.push({
                    label: selectedShippingDetails.value.rawLabel || 'Shipping',
                    amount: shippingAmount.toFixed(2),
                  });
                }

                // Ensure orderTotal is a number
                const totalAmount = Number(orderTotal.value) || 0;

                console.log('🔄 Payment request update:', {
                  total: totalAmount.toFixed(2),
                  lineItemsCount: lineItems.length,
                  lineItems: lineItems,
                });

                await squarePaymentRequest.value.update({
                  total: {
                    amount: totalAmount.toFixed(2),
                    label: 'Lil Magnet Memories',
                  },
                  lineItems: lineItems.length > 0 ? lineItems : undefined,
                  requestShippingContact:
                    selectedShippingDetails.value?.type === 'shipping',
                });
                console.log('✅ Payment request updated successfully');
              } else {
                console.warn('⚠️ Payment request not available for update');
              }

              // Verify Apple Pay is still available
              if (!squareApplePay.value) {
                throw new Error(
                  'Apple Pay is not available. Please refresh the page.'
                );
              }

              // Small delay to ensure payment request is fully updated
              await new Promise((resolve) => setTimeout(resolve, 100));

              console.log(
                '🍎 Calling Square Apple Pay tokenize() - this should show the Apple Pay sheet...'
              );
              console.log('🍎 Payment request details:', {
                total: orderTotal.value.toFixed(2),
                hasPaymentRequest: !!squarePaymentRequest.value,
                paymentRequest: squarePaymentRequest.value,
                applePayObject: squareApplePay.value,
              });

              // Verify payment request is valid before tokenizing
              if (!squarePaymentRequest.value) {
                throw new Error(
                  'Payment request is not initialized. Please refresh the page.'
                );
              }

              // Tokenize with Square - this should trigger the Apple Pay sheet
              // If this doesn't show the sheet, there's a configuration issue
              let tokenResult;
              try {
                tokenResult = await squareApplePay.value.tokenize();
                console.log('🍎 Tokenize call completed, result:', {
                  hasResult: !!tokenResult,
                  hasToken: !!tokenResult?.token,
                  status: tokenResult?.status,
                  error: tokenResult?.error,
                  fullResult: tokenResult,
                });
              } catch (tokenizeError) {
                console.error('❌ Tokenize error:', tokenizeError);
                throw new Error(
                  `Apple Pay tokenization failed: ${
                    tokenizeError?.message || 'Unknown error'
                  }. Please try again.`
                );
              }

              // Check if tokenize returned a valid result
              if (!tokenResult) {
                console.error('❌ Tokenize returned null/undefined');
                throw new Error(
                  'Apple Pay tokenization failed - no result returned. The Apple Pay sheet may not have appeared.'
                );
              }

              // Check for errors in the result
              if (tokenResult.error) {
                console.error('❌ Tokenize returned error:', tokenResult.error);
                throw new Error(
                  `Apple Pay payment failed: ${
                    tokenResult.error.message || 'Unknown error'
                  }`
                );
              }

              // Check if token is present
              if (!tokenResult.token) {
                console.error('❌ Token result missing token:', {
                  result: tokenResult,
                  hasStatus: !!tokenResult.status,
                  status: tokenResult.status,
                });
                throw new Error(
                  'Apple Pay tokenization failed - no token returned. The Apple Pay sheet may not have appeared or the payment was cancelled.'
                );
              }

              console.log(
                '🍎 Apple Pay tokenize completed - user should have seen the Apple Pay sheet'
              );

              console.log('✅ Apple Pay tokenized successfully:', {
                hasToken: !!tokenResult?.token,
                status: tokenResult?.status,
                token: tokenResult?.token
                  ? tokenResult.token.substring(0, 20) + '...'
                  : 'none',
                fullResult: tokenResult,
              });

              if (!tokenResult) {
                throw new Error('Apple Pay tokenization returned no result');
              }

              if (!tokenResult.token) {
                console.error('❌ Token result missing token:', tokenResult);
                throw new Error(
                  'Failed to get payment token from Apple Pay. Please try again.'
                );
              }

              // Set payment option and store token for placeOrder to use
              selectedPaymentOption.value = 'apple_pay';
              applePayToken.value = tokenResult.token;

              console.log(
                '✅ Apple Pay token stored, proceeding to place order...'
              );

              // Now call placeOrder which will process the payment
              await placeOrder();
            } catch (error) {
              console.error('❌ Apple Pay payment error:', error);
              submitting.value = false;
              
              // Log error to Firestore for admin review
              try {
                await firebaseService.logTransactionError({
                  errorType: 'apple_pay_failed',
                  errorMessage: error?.message || 'Apple Pay payment failed',
                  errorDetails: {
                    stack: error?.stack,
                    details: error?.details,
                    fullError: error?.toString(),
                  },
                  transactionData: {
                    orderNumber: generateOrderNumber(),
                    amount: orderTotal.value,
                    paymentMethod: 'apple_pay',
                    customerEmail: customerInfo.value.email,
                    customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
                    cartItems: cartItems.value.map(item => ({
                      productId: item.productId,
                      productName: item.productName,
                      quantity: item.quantity,
                      isCustomUpload: item.isCustomUpload,
                    })),
                  },
                });
              } catch (logError) {
                console.error('Failed to log Apple Pay error:', logError);
              }
              
              // Show user-friendly error message
              const userFriendlyMessage = 'There was a problem processing your Apple Pay payment.';
              applePayError.value = userFriendlyMessage;
              safeNotify({
                type: 'negative',
                message: userFriendlyMessage,
                caption: 'Don\'t worry - you have not been charged. Please try again or use another payment method.',
                position: 'top',
                timeout: 8000,
              });
            }
          });

          container.appendChild(button);
          applePayAttached.value = true;
          console.log('✅ Native Apple Pay button created and attached', {
            buttonElement: button,
            hasClickListener: true,
            containerId: 'square-apple-pay-button',
          });

          // Test that button is clickable
          console.log('🔍 Button setup verification:', {
            buttonInDOM: container.contains(button),
            buttonType: button.type,
            buttonDisabled: button.disabled,
            buttonStyle: window.getComputedStyle(button).display,
          });
        }
      } catch (error) {
        applePayError.value = error;
        console.error('❌ Error attaching Apple Pay button:', error);
      }
    };

    const renderGooglePayButton = async () => {
      if (!squareGooglePay.value) {
        return;
      }
      await nextTick();
      const container = document.getElementById('square-google-pay-button');
      if (!container) {
        return;
      }
      if (googlePayAttached.value) {
        return;
      }
      container.innerHTML = '';
      try {
        await squareGooglePay.value.attach('#square-google-pay-button');
        googlePayAttached.value = true;
      } catch (error) {
        googlePayError.value = error;
        console.error('Error attaching Google Pay button:', error);
      }
    };

    const normalizeAddressForSquare = (address) => {
      if (!address) {
        return null;
      }
      const normalized = {
        street: (address.street || '').trim(),
        city: (address.city || '').trim(),
        state: (address.state || '').trim(),
        zip: (address.zip || '').trim(),
        country: (address.country || 'US').trim(),
      };

      if (!normalized.street) {
        return null;
      }

      return normalized;
    };

    const handleCreditCardButtonClick = async () => {
      showCreditCardForm.value = true;
      // Keep Apple Pay section collapsed (not hidden) so it can be expanded later
      showApplePaySection.value = false; // Collapse but don't hide the section
      selectedPaymentOption.value = 'square_card';
      
      // Wait for DOM to update and container to be available
      await nextTick();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Ensure Square card form is mounted if not already
      if (squareInitialized.value && squareCard.value) {
        // Always try to mount, even if previously mounted (container might have changed)
        await mountSquareCard();
      } else if (!squareInitialized.value) {
        // Try to initialize if not already done
        console.log('Square not initialized yet, attempting initialization...');
        try {
          await waitForSquareSDK();
          await initializeSquarePayments();
          // Wait a bit more for initialization to complete
          await nextTick();
          await new Promise(resolve => setTimeout(resolve, 300));
          await mountSquareCard();
        } catch (error) {
          console.error('Failed to initialize Square:', error);
          squareInitError.value = error;
        }
      }
    };
    
    // Watch for Apple Pay section expansion - render button and collapse credit card form when expanded
    watch(showApplePaySection, async (isExpanded) => {
      if (isExpanded) {
        // Collapse credit card form if it's visible
        if (showCreditCardForm.value) {
          showCreditCardForm.value = false;
          // Reset mounted flag when hiding credit card form
          // This allows re-mounting when form is shown again
          squareCardMounted.value = false;
        }
        // Render Apple Pay button when section is expanded
        if (applePayReady.value && squareApplePay.value) {
          console.log('🍎 Apple Pay section expanded, rendering button...');
          // Small delay to ensure DOM is ready
          await nextTick();
          await new Promise(resolve => setTimeout(resolve, 100));
          // Reset attachment to allow re-rendering in the collapsed section
          applePayAttached.value = false;
          await renderApplePayButton();
        }
      }
    });

    const processSquareCardPayment = async (orderNumber) => {
      if (!squareCard.value) {
        throw new Error(
          'Secure payment form is still loading. Please try again in a moment.'
        );
      }

      squareProcessing.value = true;

      try {
        const tokenResult = await squareCard.value.tokenize();
        if (tokenResult.status !== 'OK') {
          const tokenError =
            tokenResult.errors && tokenResult.errors.length > 0
              ? tokenResult.errors[0].message
              : null;
          throw new Error(
            tokenError || 'We could not verify your card details. Please retry.'
          );
        }

        const billingAddressToUse =
          billingSameAsShipping.value && requiresShippingAddress.value
            ? shippingAddress.value
            : billingAddress.value;

        const paymentPayload = {
          sourceId: tokenResult.token,
          amount: Number(orderTotal.value) || 0,
          currency: 'USD',
          orderNumber,
          buyerEmail: customerInfo.value.email,
          customerName:
            `${customerInfo.value.firstName} ${customerInfo.value.lastName}`.trim(),
          billingAddress: normalizeAddressForSquare(billingAddressToUse),
          shippingAddress: normalizeAddressForSquare(
            requiresShippingAddress.value ? shippingAddress.value : null
          ),
          locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
        };

        const result = await firebaseService.processSquarePayment(
          paymentPayload
        );

        return result?.payment || null;
      } catch (error) {
        console.error('Square card payment failed:', error);
        // Error logging is handled in processSquarePayment
        throw error;
      } finally {
        squareProcessing.value = false;
      }
    };

    const processApplePayPayment = async (orderNumber, token) => {
      if (!token) {
        throw new Error('Apple Pay token is missing');
      }

      squareProcessing.value = true;

      try {
        // Apple Pay doesn't require billing address - it's handled by Apple Pay sheet
        // Only use billing address if it's available and complete, otherwise pass null
        let billingAddressToUse = null;
        if (billingSameAsShipping.value && requiresShippingAddress.value && addressIsComplete(shippingAddress.value)) {
          billingAddressToUse = shippingAddress.value;
        } else if (addressIsComplete(billingAddress.value)) {
          billingAddressToUse = billingAddress.value;
        }

        const paymentPayload = {
          sourceId: token,
          amount: Number(orderTotal.value) || 0,
          currency: 'USD',
          orderNumber,
          buyerEmail: customerInfo.value.email,
          customerName:
            `${customerInfo.value.firstName} ${customerInfo.value.lastName}`.trim(),
          billingAddress: billingAddressToUse ? normalizeAddressForSquare(billingAddressToUse) : null,
          shippingAddress: normalizeAddressForSquare(
            requiresShippingAddress.value ? shippingAddress.value : null
          ),
          locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
        };

        const result = await firebaseService.processSquarePayment(
          paymentPayload
        );

        return result?.payment || null;
      } catch (error) {
        console.error('Apple Pay payment failed:', error);
        // Error logging is handled in processSquarePayment
        throw error;
      } finally {
        squareProcessing.value = false;
      }
    };

    const updateSquarePaymentRequest = async () => {
      if (!squarePaymentRequest.value) {
        return;
      }
      try {
        await squarePaymentRequest.value.update({
          total: {
            amount: orderTotal.value.toFixed(2),
            label: 'Lil Magnet Memories',
          },
          requestShippingContact:
            selectedShippingDetails.value?.type === 'shipping',
        });
      } catch (error) {
        console.warn('Failed to update Square payment request:', error);
      }
    };

    // Wait for Square SDK to be available
    const waitForSquareSDK = () => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.Square && window.Square.payments) {
          console.log('✅ Square SDK already loaded');
          resolve();
          return;
        }

        // Wait for SDK to load (max 10 seconds)
        const maxWait = 10000;
        const startTime = Date.now();
        const checkInterval = 100;

        const intervalId = setInterval(() => {
          if (window.Square && window.Square.payments) {
            console.log(
              '✅ Square SDK loaded after',
              Date.now() - startTime,
              'ms'
            );
            clearInterval(intervalId);
            resolve();
          } else if (Date.now() - startTime >= maxWait) {
            clearInterval(intervalId);
            const errorMsg =
              'Square SDK failed to load within 10 seconds. Check your network connection and ensure the script is loading from https://web.squarecdn.com/v1/square.js';
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        }, checkInterval);
      });
    };

    // Square payment initialization
    const initializeSquarePayments = async () => {
      try {
        squareInitError.value = null;
        squareCardMounted.value = false;
        applePayReady.value = false;
        googlePayReady.value = false;
        applePayAttached.value = false;
        googlePayAttached.value = false;

        // Get and validate environment variables
        let applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        let locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        // Trim whitespace, newlines, and validate
        if (applicationId) {
          applicationId = String(applicationId).trim().replace(/\s+/g, '');
        }
        if (locationId) {
          locationId = String(locationId).trim().replace(/\s+/g, '');
        }

        console.log('🔵 Checking Square configuration...', {
          hasSDK: !!window.Square,
          hasApplicationId: !!applicationId,
          hasLocationId: !!locationId,
          applicationIdType: typeof applicationId,
          applicationIdLength: applicationId ? applicationId.length : 0,
          applicationIdPrefix: applicationId
            ? applicationId.substring(0, 10)
            : 'N/A',
          locationIdType: typeof locationId,
          locationIdLength: locationId ? locationId.length : 0,
        });

        if (!window.Square || !window.Square.payments) {
          const errorMsg =
            'Square SDK not loaded. Check if script is loaded from https://web.squarecdn.com/v1/square.js';
          console.error(errorMsg);
          squareInitError.value = new Error(errorMsg);
          return;
        }

        if (!applicationId || !locationId) {
          const errorMsg = `Square credentials not configured. Application ID: ${
            applicationId ? 'set' : 'missing'
          }, Location ID: ${locationId ? 'set' : 'missing'}`;
          console.error(errorMsg);
          squareInitError.value = new Error(errorMsg);
          return;
        }

        // Validate format before passing to Square SDK
        if (
          !applicationId ||
          typeof applicationId !== 'string' ||
          applicationId.length === 0
        ) {
          const errorMsg = 'Square Application ID is missing or invalid';
          console.error('❌', errorMsg, {
            applicationId,
            type: typeof applicationId,
          });
          squareInitError.value = new Error(errorMsg);
          return;
        }

        if (
          !locationId ||
          typeof locationId !== 'string' ||
          locationId.length === 0
        ) {
          const errorMsg = 'Square Location ID is missing or invalid';
          console.error('❌', errorMsg, {
            locationId,
            type: typeof locationId,
          });
          squareInitError.value = new Error(errorMsg);
          return;
        }

        // Validate Application ID format (should start with 'sq0idp-' or 'sq0idb-')
        if (!applicationId.match(/^sq0id[pb]-/)) {
          const errorMsg = `Square Application ID format is invalid. Expected format: sq0idp-... or sq0idb-..., got: ${applicationId.substring(
            0,
            15
          )}...`;
          console.error('❌', errorMsg);
          squareInitError.value = new Error(errorMsg);
          return;
        }

        console.log('🔵 Initializing Square payments with:', {
          applicationId: applicationId.substring(0, 15) + '...',
          applicationIdLength: applicationId.length,
          locationId: locationId.substring(0, 10) + '...',
          locationIdLength: locationId.length,
        });

        try {
          const payments = window.Square.payments(applicationId, locationId);
          squarePayments.value = payments;

          // Build line items for the payment request
          const lineItems = [];
          cartItems.value.forEach((item) => {
            if (item.isCustomUpload) {
              // Custom upload item
              const totalCost = Number(item.totalCost) || 0;
              lineItems.push({
                label: item.productName || 'Custom Photo Magnets',
                amount: totalCost.toFixed(2),
              });
            } else {
              // Regular product item
              const itemTotal =
                (Number(item.pricePerUnit) || 0) * (Number(item.quantity) || 0);
              lineItems.push({
                label: item.productName || 'Product',
                amount: itemTotal.toFixed(2),
              });
            }
          });

          // Add shipping if applicable
          const shippingAmount = Number(shippingCost.value) || 0;
          if (shippingAmount > 0 && selectedShippingDetails.value) {
            lineItems.push({
              label: selectedShippingDetails.value.rawLabel || 'Shipping',
              amount: shippingAmount.toFixed(2),
            });
          }

          // Ensure orderTotal is a number
          const totalAmount = Number(orderTotal.value) || 0;

          const paymentRequest = payments.paymentRequest({
            countryCode: 'US',
            currencyCode: 'USD',
            total: {
              amount: totalAmount.toFixed(2),
              label: 'Lil Magnet Memories',
            },
            lineItems: lineItems.length > 0 ? lineItems : undefined,
            requestBillingContact: true,
            requestShippingContact:
              selectedShippingDetails.value?.type === 'shipping',
          });
          squarePaymentRequest.value = paymentRequest;

          try {
            // Check if we're in Safari
            const isSafari = /^((?!chrome|android).)*safari/i.test(
              navigator.userAgent
            );
            const isMac = /Mac/.test(navigator.platform);
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

            console.log('🍎 Initializing Apple Pay...', {
              isSafari,
              isMac,
              isIOS,
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              hasApplePaySession: !!window.ApplePaySession,
              canMakePayments: window.ApplePaySession
                ? ApplePaySession.canMakePayments()
                : 'N/A',
            });

            const applePay = await payments.applePay(paymentRequest);
            console.log(
              '🍎 Apple Pay object created, checking availability...',
              {
                applePay,
                paymentRequest,
                hasCanMakePayment:
                  typeof applePay.canMakePayment === 'function',
              }
            );

            // Add event listeners to handle Apple Pay events
            // This ensures the payment flow is properly handled
            if (applePay && typeof applePay.addEventListener === 'function') {
              applePay.addEventListener('paymentmethodselected', (event) => {
                console.log('🍎 Apple Pay payment method selected:', event);
              });

              applePay.addEventListener('shippingcontactselected', (event) => {
                console.log('🍎 Apple Pay shipping contact selected:', event);
              });

              applePay.addEventListener('shippingmethodselected', (event) => {
                console.log('🍎 Apple Pay shipping method selected:', event);
              });

              applePay.addEventListener('complete', (event) => {
                console.log('🍎 Apple Pay payment completed:', event);
              });

              applePay.addEventListener('error', (event) => {
                console.error('❌ Apple Pay error event:', event);
              });
            }

            // Square's Apple Pay might not have canMakePayment - check if method exists
            let canMakePayment = false;
            if (typeof applePay.canMakePayment === 'function') {
              canMakePayment = await applePay.canMakePayment();
              console.log(
                '🍎 Apple Pay canMakePayment result:',
                canMakePayment,
                {
                  type: typeof canMakePayment,
                  value: canMakePayment,
                  isBoolean: typeof canMakePayment === 'boolean',
                  isObject: typeof canMakePayment === 'object',
                  stringified: JSON.stringify(canMakePayment),
                }
              );
            } else {
              // If canMakePayment doesn't exist, check native Apple Pay API
              console.log(
                'ℹ️ Square Apple Pay does not have canMakePayment method, checking native API'
              );
              const hasApplePaySession = !!window.ApplePaySession;
              const nativeCanMakePayments = hasApplePaySession
                ? ApplePaySession.canMakePayments()
                : false;

              console.log('🔍 Native Apple Pay API check:', {
                hasApplePaySession,
                nativeCanMakePayments,
                userAgent: navigator.userAgent,
                platform: navigator.platform,
              });

              if (nativeCanMakePayments) {
                canMakePayment = true;
                console.log('✅ Native Apple Pay API confirms availability');
              } else {
                canMakePayment = false;
                console.log('❌ Native Apple Pay API says not available', {
                  hasApplePaySession,
                  reason: hasApplePaySession
                    ? 'canMakePayments() returned false'
                    : 'ApplePaySession not available',
                });
              }
            }

            // Square's canMakePayment can return boolean or object with result property
            const canMakePaymentResult =
              typeof canMakePayment === 'boolean'
                ? canMakePayment
                : canMakePayment?.result ?? canMakePayment;

            if (canMakePaymentResult) {
              squareApplePay.value = applePay;
              applePayReady.value = true;
              console.log('✅ Apple Pay is available and ready');
              // Render the Apple Pay button immediately since it's always shown now
              await nextTick();
              await renderApplePayButton();
            } else {
              console.warn(
                '⚠️ Apple Pay is not available on this device/browser',
                {
                  isSafari,
                  isMac,
                  isIOS,
                  hasApplePaySession: !!window.ApplePaySession,
                  nativeCanMakePayments: window.ApplePaySession
                    ? ApplePaySession.canMakePayments()
                    : false,
                }
              );
              applePayReady.value = false;

              // Provide more specific error message
              if (isSafari && (isMac || isIOS)) {
                applePayError.value =
                  'Apple Pay is not set up on this device. Please add a payment method in Settings > Wallet & Apple Pay.';
              } else {
                applePayError.value =
                  'Apple Pay is not available on this device. Make sure you are using Safari or Chrome on a device with Apple Pay set up.';
              }
            }
          } catch (appleError) {
            console.error('❌ Apple Pay initialization error:', appleError);

            // Check if error is about Safari-only restriction but we're on Chrome on macOS/iOS
            const isChromeOnMac =
              /Chrome/.test(navigator.userAgent) &&
              /Mac/.test(navigator.platform);
            const isChromeOnIOS =
              /CriOS/.test(navigator.userAgent) ||
              (/Chrome/.test(navigator.userAgent) &&
                /iPhone|iPad|iPod/.test(navigator.userAgent));
            const isSafariOnlyError =
              appleError?.message?.includes('Safari') ||
              appleError?.message?.includes('Method unsupported');

            if ((isChromeOnMac || isChromeOnIOS) && isSafariOnlyError) {
              console.warn(
                '⚠️ Square SDK says Safari-only, but Apple Pay should work in Chrome on Apple devices'
              );
              // Check if native Apple Pay API is available
              if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
                console.log(
                  '✅ Native Apple Pay API is available - Square SDK restriction detected'
                );
                applePayError.value =
                  "Apple Pay works in Chrome, but Square's SDK currently requires Safari. Please use Safari for Apple Pay, or use Credit Card payment.";
              } else {
                applePayError.value =
                  appleError?.message || 'Apple Pay initialization failed';
              }
            } else {
              applePayError.value =
                appleError?.message || 'Apple Pay initialization failed';
            }
            applePayReady.value = false;
          }

          try {
            const googlePay = await payments.googlePay(paymentRequest);
            // Check if canMakePayment method exists and call it appropriately
            if (typeof googlePay.canMakePayment === 'function') {
              const canMakePayment = await googlePay.canMakePayment();
              if (
                canMakePayment &&
                (canMakePayment.result || canMakePayment === true)
              ) {
                squareGooglePay.value = googlePay;
                googlePayReady.value = true;
              } else {
                googlePayReady.value = false;
              }
            } else {
              // If canMakePayment doesn't exist, assume Google Pay is not available
              console.warn('Google Pay canMakePayment method not available');
              googlePayReady.value = false;
            }
          } catch (googleError) {
            console.warn('Google Pay not available:', googleError);
            googlePayError.value = googleError;
            googlePayReady.value = false;
          }

          console.log('🔵 Creating Square card form...');
          try {
            const card = await payments.card();
            squareCard.value = card;
            console.log('✅ Square card form created');

            squareInitialized.value = true;
            console.log('✅ Square payments fully initialized');

            await updateSquarePaymentRequest();

            // Always mount the card form immediately so it's ready
            // The container will be shown/hidden based on selectedPaymentOption
            // Use a delay to ensure the payment option section is fully rendered
            console.log('🔵 Mounting Square card form...');
            await nextTick();
            await new Promise((resolve) => setTimeout(resolve, 200));
            await mountSquareCard();
          } catch (cardError) {
            console.error('❌ Error creating Square card form:', cardError);
            squareInitError.value = cardError;
            // Don't throw - let error be displayed in UI
          }

          // Always render Apple Pay button if available (no longer depends on selectedPaymentOption)
          if (applePayReady.value) {
            await renderApplePayButton();
          }
          // Always render Google Pay button if available
          if (googlePayReady.value) {
            await renderGooglePayButton();
          }

          console.log('✅ Square payments initialized successfully');
        } catch (initError) {
          console.error('❌ Error calling Square.payments():', {
            message: initError?.message,
            applicationId: applicationId
              ? applicationId.substring(0, 15) + '...'
              : 'missing',
            locationId: locationId
              ? locationId.substring(0, 10) + '...'
              : 'missing',
            error: initError,
          });
          squareInitError.value = initError;
          return;
        }
      } catch (error) {
        squareInitError.value = error;
        console.error('❌ Error initializing Square payments:', {
          message: error?.message,
          stack: error?.stack,
          error,
        });
        // Don't throw - let the error be displayed in the UI
      }
    };

    const getCartItemQuantity = (item) => {
      if (typeof item?.quantity === 'number') {
        return item.quantity;
      }
      if (Array.isArray(item?.photoQuantities)) {
        return item.photoQuantities.reduce(
          (sum, qty) => sum + Number(qty || 0),
          0
        );
      }
      return 0;
    };

    const placeOrder = async () => {
      // For Apple Pay, skip validation if we have a token (payment already authorized)
      // This handles the case where Apple Pay button is clicked and token is received
      const isApplePayWithToken = applePayToken.value && (selectedPaymentOption.value === 'apple_pay' || !selectedPaymentOption.value);
      
      if (!isApplePayWithToken && !canPlaceOrder.value) {
        showValidationErrors.value = true;
        // Check if the issue is with photo uploads
        const photoValidation = validatePhotosUploaded();
        if (!photoValidation.valid) {
          safeNotify({
            type: 'negative',
            message: photoValidation.message,
            position: 'top',
            timeout: 5000,
          });
        } else {
          safeNotify({
            type: 'negative',
            message: 'Please fill in all required fields',
            position: 'top',
          });
        }
        return;
      }

      // Double-check photos are uploaded before processing payment
      const photoValidation = validatePhotosUploaded();
      if (!photoValidation.valid) {
        safeNotify({
          type: 'negative',
          message: photoValidation.message,
          caption: 'Payment cannot be processed until all photos are uploaded.',
          position: 'top',
          timeout: 5000,
        });
        return;
      }

      submitting.value = true;

      try {
        showValidationErrors.value = false;
        const orderNumber = generateOrderNumber();
        const currentUser = authService.getCurrentUser();
        const cartItemsSnapshot = JSON.parse(JSON.stringify(cartItems.value));
        const shippingAddressData = requiresShippingAddress.value
          ? sanitizeAddress(shippingAddress.value)
          : null;
        const billingAddressData = requiresBillingAddress.value
          ? sanitizeAddress(
              billingSameAsShipping.value && shippingAddressData
                ? shippingAddress.value
                : billingAddress.value
            )
          : null;
        const shippingOptionPayload = selectedShippingDetails.value
          ? {
              value: selectedShippingDetails.value.value,
              label: selectedShippingDetails.value.rawLabel,
              description: selectedShippingDetails.value.description,
              cost: shippingCost.value,
              estimatedTimeline: shippingTimeline.value,
              type: selectedShippingDetails.value.type,
              eventId:
                selectedShippingDetails.value.type === 'pickup'
                  ? checkedInEvent.value?.id || null
                  : null,
              address: shippingAddressData,
            }
          : null;
        const paymentProcessor =
          selectedPaymentOption.value === 'square_card'
            ? 'square'
            : selectedPaymentOption.value === 'paypal'
            ? 'paypal'
            : selectedPaymentOption.value === 'apple_pay'
            ? 'apple'
            : selectedPaymentOption.value === 'google_pay'
            ? 'google'
            : selectedPaymentOption.value === 'pay_at_event'
            ? 'in_person'
            : null;

        const totalMagnets = cartItemsSnapshot.reduce(
          (sum, item) => sum + getCartItemQuantity(item),
          0
        );

        // CRITICAL: Save order to Firestore FIRST (before processing payment)
        // This ensures we have an order record even if payment processing fails
        // Initial order status is 'pending_payment' - will be updated to 'paid' after successful payment
        const initialPaymentOptionPayload = {
          type: selectedPaymentOption.value,
          processor: paymentProcessor,
          paymentId: null, // Will be set after payment
          paidAt: null,
          status: null,
          receiptUrl: null,
          billingAddress: billingAddressData,
        };

        let initialOrderStatus =
          selectedPaymentOption.value === 'pay_at_event'
            ? 'pending_payment'
            : 'pending_payment'; // Start as pending_payment for all payment methods

        const initialOrderData = {
          orderNumber,
          orderType: 'product_cart',
          cartItems: cartItemsSnapshot,
          customer: {
            firstName: customerInfo.value.firstName,
            lastName: customerInfo.value.lastName,
            email: customerInfo.value.email,
            phone: customerInfo.value.phone || '',
          },
          userId: currentUser?.uid || null,
          shippingOption: shippingOptionPayload,
          paymentOption: initialPaymentOptionPayload,
          subtotal: cartSubtotal.value,
          shipping: shippingCost.value,
          tax: 0, // TODO: Calculate tax if needed
          totalAmount: orderTotal.value,
          shippingTimeline: shippingTimeline.value,
          status: initialOrderStatus,
        };

        console.log('💾 Saving order to Firestore BEFORE processing payment...');
        let savedOrderId = null;
        try {
          savedOrderId = await firebaseService.saveCartOrder(initialOrderData);
          console.log('✅ Order saved to Firestore with ID:', savedOrderId);
        } catch (saveError) {
          console.error('❌ Failed to save order to Firestore:', saveError);
          // Don't process payment if order save fails
          throw new Error(
            'Failed to save order. Please try again. Your payment has not been processed.'
          );
        }

        // NOW process payment (order is already saved, so if payment fails we still have the order)
        let squarePaymentDetails = null;
        let paymentOptionPayload = initialPaymentOptionPayload; // Start with initial payload, will be updated after payment
        
        if (selectedPaymentOption.value === 'square_card') {
          squarePaymentDetails = await processSquareCardPayment(orderNumber);
        } else if (
          selectedPaymentOption.value === 'apple_pay' &&
          applePayToken.value
        ) {
          console.log('💳 Processing Apple Pay payment with token...');
          try {
            squarePaymentDetails = await processApplePayPayment(
              orderNumber,
              applePayToken.value
            );

            // Validate payment was processed
            if (!squarePaymentDetails) {
              const error = new Error(
                'Apple Pay payment processing failed. No payment details returned.'
              );
              // Log error
              await firebaseService.logTransactionError({
                errorType: 'apple_pay_failed',
                errorMessage: error.message,
                errorDetails: { status: 'no_payment_details' },
                transactionData: {
                  orderNumber,
                  amount: orderTotal.value,
                  paymentMethod: 'apple_pay',
                  customerEmail: customerInfo.value.email,
                  customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
                },
              });
              throw error;
            }

            if (squarePaymentDetails.status !== 'COMPLETED') {
              console.error(
                '❌ Apple Pay payment not completed:',
                squarePaymentDetails
              );
              const error = new Error(
                `Apple Pay payment failed with status: ${squarePaymentDetails.status}`
              );
              // Log error
              await firebaseService.logTransactionError({
                errorType: 'apple_pay_failed',
                errorMessage: error.message,
                errorDetails: {
                  paymentStatus: squarePaymentDetails.status,
                  paymentDetails: squarePaymentDetails,
                },
                transactionData: {
                  orderNumber,
                  amount: orderTotal.value,
                  paymentMethod: 'apple_pay',
                  customerEmail: customerInfo.value.email,
                  customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
                },
              });
              throw error;
            }
          } catch (paymentError) {
            // Payment failed but order is saved - update order status
            console.error('❌ Payment failed, but order is saved:', savedOrderId);
            // Try to update order to reflect payment failure
            try {
              await firebaseService.updateOrderPaymentStatus(savedOrderId, {
                status: 'payment_failed',
                error: paymentError.message,
              });
            } catch (updateError) {
              console.error('Failed to update order status after payment failure:', updateError);
            }
            // Re-throw with user-friendly message
            const userFriendlyError = new Error(
              'There was a problem processing your Apple Pay payment. Your order has been saved but payment failed. Please contact support.'
            );
            userFriendlyError.originalError = paymentError;
            throw userFriendlyError;
          }

          console.log('✅ Apple Pay payment processed successfully:', {
            paymentId: squarePaymentDetails.id,
            status: squarePaymentDetails.status,
            amount: Number(orderTotal.value) || 0,
          });

          // Clear token after use
          applePayToken.value = null;
        } else if (
          selectedPaymentOption.value === 'apple_pay' &&
          !applePayToken.value
        ) {
          // User selected Apple Pay but clicked regular Place Order button
          // They need to use the Apple Pay button instead
          throw new Error(
            'Please use the Apple Pay button to complete your payment. The Apple Pay button is located above this form.'
          );
        }

        // Update paymentOptionPayload with payment details if payment was processed
        if (squarePaymentDetails) {
          paymentOptionPayload = {
            type: selectedPaymentOption.value,
            processor: paymentProcessor,
            paymentId: squarePaymentDetails.id,
            paidAt: squarePaymentDetails.createdAt || null,
            status: squarePaymentDetails.status,
            receiptUrl: squarePaymentDetails.receiptUrl || null,
            billingAddress: billingAddressData,
          };

          // Update order with payment details and status
          if (savedOrderId) {
            const finalOrderStatus = squarePaymentDetails.status === 'COMPLETED' ? 'paid' : 'pending_payment';

            console.log('💾 Updating order with payment details...');
            try {
              await firebaseService.updateOrderPaymentStatus(savedOrderId, {
                paymentOption: paymentOptionPayload,
                status: finalOrderStatus,
              });
              console.log('✅ Order updated with payment details');
            } catch (updateError) {
              console.error('⚠️ Failed to update order with payment details:', updateError);
              // Don't fail the whole transaction - order is saved and payment is processed
              // Log the error for admin review
              await firebaseService.logTransactionError({
                errorType: 'order_update_failed',
                errorMessage: 'Failed to update order with payment details after successful payment',
                errorDetails: {
                  orderId: savedOrderId,
                  paymentDetails: squarePaymentDetails,
                  updateError: updateError.message,
                },
                transactionData: {
                  orderNumber,
                  amount: orderTotal.value,
                  paymentMethod: selectedPaymentOption.value,
                  customerEmail: customerInfo.value.email,
                },
              });
            }
          }
        }

        // Clear cart
        clearCart();

        // Show success notification
        safeNotify({
          type: 'positive',
          message: 'Order placed successfully!',
          caption: `Order #${orderNumber}`,
          position: 'top',
          timeout: 5000,
        });

        localStorage.setItem(
          'lastOrderData',
          JSON.stringify({
            orderNumber,
            customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
            customerEmail: customerInfo.value.email,
            totalMagnets,
            subtotal: cartSubtotal.value,
            shipping: shippingCost.value,
            tax: 0,
            totalAmount: orderTotal.value,
            shippingOption: shippingOptionPayload,
            paymentOption: paymentOptionPayload,
          })
        );

        // Navigate to My Orders page
        router.push({
          path: '/my-orders',
        });
      } catch (error) {
        console.error('Error placing order:', error);
        
        // Log error if it's a payment error
        if (error.message && (error.message.includes('payment') || error.message.includes('Apple Pay'))) {
          try {
            await firebaseService.logTransactionError({
              errorType: 'order_placement_failed',
              errorMessage: error.message,
              errorDetails: {
                stack: error?.stack,
                originalError: error?.originalError?.message,
              },
              transactionData: {
                orderNumber: generateOrderNumber(),
                amount: orderTotal.value,
                paymentMethod: selectedPaymentOption.value,
                customerEmail: customerInfo.value.email,
                customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
              },
            });
          } catch (logError) {
            console.error('Failed to log order error:', logError);
          }
        }
        
        // Show user-friendly error message
        let errorMessage = 'Failed to place order';
        let errorCaption = error.message || 'Please try again';
        
        // For Apple Pay errors, ensure user knows they weren't charged
        if (error.message && error.message.includes('Apple Pay')) {
          errorMessage = 'There was a problem with your Apple Pay payment';
          errorCaption = 'Don\'t worry - you have not been charged. Please try again or use another payment method.';
        }
        
        safeNotify({
          type: 'negative',
          message: errorMessage,
          caption: errorCaption,
          position: 'top',
          timeout: 8000,
        });
      } finally {
        submitting.value = false;
      }
    };

    return {
      cartItems,
      cartSubtotal,
      customerInfo,
      shippingAddress,
      billingAddress,
      billingSameAsShipping,
      shippingCost,
      shippingTimeline,
      selectedShippingOption,
      selectedShippingDetails,
      selectedPaymentOption,
      shippingOptions,
      pickupOptions,
      otherShippingOptions,
      showOtherShippingOptions,
      requiresShippingAddress,
      requiresBillingAddress,
      orderTotal,
      canPlaceOrder,
      submitting,
      checkedInEvent,
      placeOrder,
      getPaymentIcon,
      availablePaymentMethods,
      customerFirstNameError,
      customerLastNameError,
      customerEmailError,
      shippingStreetError,
      shippingCityError,
      shippingStateError,
      shippingZipError,
      billingStreetError,
      billingCityError,
      billingStateError,
      billingZipError,
      showValidationErrors,
      applePayReady,
      applePayError,
      googlePayReady,
      googlePayError,
      squareInitialized,
      squareCardMounted,
      squareInitError,
      squareProcessing,
      showCreditCardForm,
      showApplePaySection,
      handleCreditCardButtonClick,
    };
  },
};
</script>

<style scoped>
.sticky-card {
  position: sticky;
  top: 20px;
}

.checkout-page {
  min-height: 60vh;
}

.payment-option-card {
  transition: all 0.3s ease;
}

.payment-option-card:hover {
  background-color: #f5f5f5;
}

.payment-selected {
  border: 2px solid #1976d2 !important;
  background-color: #e3f2fd;
}

.wallet-button {
  min-height: 48px;
  width: 100%;
  background: transparent;
  padding: 0;
  margin: 0;
}

/* Apple Pay button styling - ensures proper display of Apple's button */
.apple-pay-button {
  -apple-pay-button-type: plain;
  -apple-pay-button-style: black;
  width: 100% !important;
  height: 50px !important;
  min-height: 50px !important;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
    'SF Pro Text', sans-serif;
  font-size: 17px;
  font-weight: 400;
  letter-spacing: -0.41px;
  background-color: #000000 !important;
  color: #ffffff !important;
  transition: opacity 0.2s ease, background-color 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  padding: 0;
  margin: 0;
}

.apple-pay-button:hover {
  opacity: 0.9;
}

.apple-pay-button:active {
  opacity: 0.8;
}

.apple-pay-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.square-card-container {
  min-height: 120px;
}

.border-top {
  border-top: 1px solid #e0e0e0;
  margin-top: 16px;
}
</style>
