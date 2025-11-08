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
                                  :src="photo.preview"
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
                        :rules="[(val) => !!val || 'Required']"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="customerInfo.lastName"
                        label="Last Name *"
                        filled
                        :rules="[(val) => !!val || 'Required']"
                      />
                    </div>
                    <div class="col-12">
                      <q-input
                        v-model="customerInfo.email"
                        label="Email *"
                        type="email"
                        filled
                        :rules="[
                          (val) => !!val || 'Required',
                          (val) =>
                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ||
                            'Invalid email',
                        ]"
                      />
                    </div>
                    <div class="col-12">
                      <q-input
                        v-model="customerInfo.phone"
                        label="Phone"
                        filled
                        mask="(###) ###-####"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Shipping Options -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Shipping Options</div>
                  <q-option-group
                    v-model="selectedShippingOption"
                    :options="shippingOptions"
                    color="primary"
                  />
                  <div
                    v-if="
                      selectedShippingOption === 'ship_to_address' &&
                      shippingOptions.find((o) => o.value === 'ship_to_address')
                        ?.required
                    "
                    class="q-mt-md"
                  >
                    <q-input
                      v-model="shippingAddress.street"
                      label="Street Address *"
                      filled
                      class="q-mb-md"
                    />
                    <div class="row q-col-gutter-md q-mb-md">
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.city"
                          label="City *"
                          filled
                        />
                      </div>
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.state"
                          label="State *"
                          filled
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.zip"
                          label="ZIP Code *"
                          filled
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="
                      selectedShippingOption === 'collect_at_event' &&
                      checkedInEvent
                    "
                    class="q-mt-md q-pa-md bg-blue-1 rounded-borders"
                  >
                    <div class="row items-center q-mb-sm">
                      <q-icon
                        name="event"
                        class="q-mr-sm"
                        color="primary"
                        size="24px"
                      />
                      <div class="text-weight-medium">
                        Market Event Pickup Available
                      </div>
                    </div>
                    <div class="text-body2">
                      Since you're in the area, you can pick up your order at
                      <strong>{{ checkedInEvent.name }}</strong> for free! Just
                      let us know you're at the event and we'll have your
                      magnets ready.
                    </div>
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
                  <div
                    v-if="selectedShippingOption === 'ship_to_address'"
                    class="row justify-between q-mb-sm"
                  >
                    <div class="text-body2">Shipping:</div>
                    <div class="text-body2">${{ shippingCost.toFixed(2) }}</div>
                  </div>
                  <div v-else class="row justify-between q-mb-sm">
                    <div class="text-body2">Shipping:</div>
                    <div class="text-body2 text-positive">Free (Pickup)</div>
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

                  <!-- Apple Pay Button -->
                  <q-card
                    v-if="availablePaymentMethods.applePay"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected': selectedPaymentOption === 'apple_pay',
                    }"
                    @click="selectedPaymentOption = 'apple_pay'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon name="apple" size="32px" class="q-mr-md" />
                          <div>
                            <div class="text-weight-bold">Apple Pay</div>
                            <div class="text-caption text-grey-7">
                              Fast and secure payment
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'apple_pay'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Google Pay Button -->
                  <q-card
                    v-if="availablePaymentMethods.googlePay"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected':
                        selectedPaymentOption === 'google_pay',
                    }"
                    @click="selectedPaymentOption = 'google_pay'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon
                            name="account_balance_wallet"
                            size="32px"
                            class="q-mr-md"
                          />
                          <div>
                            <div class="text-weight-bold">Google Pay</div>
                            <div class="text-caption text-grey-7">
                              Quick checkout
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'google_pay'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Square Credit Card Button -->
                  <q-card
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected':
                        selectedPaymentOption === 'square_card',
                    }"
                    @click="selectedPaymentOption = 'square_card'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon
                            name="credit_card"
                            size="32px"
                            class="q-mr-md"
                          />
                          <div>
                            <div class="text-weight-bold">
                              Credit/Debit Card
                            </div>
                            <div class="text-caption text-grey-7">
                              Pay with Visa, Mastercard, etc.
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'square_card'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- PayPal Button -->
                  <q-card
                    v-if="availablePaymentMethods.paypal"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected': selectedPaymentOption === 'paypal',
                    }"
                    @click="selectedPaymentOption = 'paypal'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon
                            name="account_balance_wallet"
                            size="32px"
                            class="q-mr-md"
                          />
                          <div>
                            <div class="text-weight-bold">PayPal</div>
                            <div class="text-caption text-grey-7">
                              Pay with your PayPal account
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'paypal'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Pay at Event Button (if applicable) -->
                  <q-card
                    v-if="availablePaymentMethods.payAtEvent"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected':
                        selectedPaymentOption === 'pay_at_event',
                    }"
                    @click="selectedPaymentOption = 'pay_at_event'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon name="atm" size="32px" class="q-mr-md" />
                          <div>
                            <div class="text-weight-bold">
                              Pay at Pop-up Station
                            </div>
                            <div class="text-caption text-grey-7">
                              Pay when you collect your order
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'pay_at_event'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Square Credit Card Form (shown when Square is selected) -->
                  <q-card-section
                    v-if="selectedPaymentOption === 'square_card'"
                    class="q-pt-md border-top"
                  >
                    <div class="text-caption text-grey-7 q-mb-sm">
                      Payment will be processed securely via Square
                    </div>
                    <!-- Square payment form container -->
                    <div id="square-payment-form" class="q-mt-md">
                      <div class="text-body2 text-grey-6">
                        <q-spinner size="24px" class="q-mr-sm" />
                        Loading secure payment form...
                      </div>
                    </div>
                  </q-card-section>

                  <!-- PayPal Button Container (shown when PayPal is selected) -->
                  <q-card-section
                    v-if="selectedPaymentOption === 'paypal'"
                    class="q-pt-md border-top"
                  >
                    <div id="paypal-button-container"></div>
                  </q-card-section>
                </q-card-section>

                <q-card-actions vertical class="q-pa-md">
                  <q-btn
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
                    label="Back to Cart"
                    @click="$router.push('/cart')"
                    class="full-width q-mt-sm"
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
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCart } from '../composables/useCart.js';
import { marketEventService } from '../services/marketEventService.js';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'CheckoutPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const { cartItems, cartSubtotal, clearCart } = useCart();

    const submitting = ref(false);
    const checkedInEvent = ref(null);
    const selectedShippingOption = ref(null);
    const selectedPaymentOption = ref(null);
    const squareInitialized = ref(false);
    const squarePayments = ref(null);
    const squarePaymentRequest = ref(null);
    const squareCard = ref(null);
    const squareApplePay = ref(null);
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

    const shippingCost = ref(5.0); // Default shipping cost

    // Check for active market event and check-in status
    onMounted(() => {
      checkedInEvent.value = marketEventService.getCheckedInEvent();

      // Pre-fill customer info if user is authenticated
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        customerInfo.value.email = currentUser.email || '';
        if (currentUser.displayName) {
          const nameParts = currentUser.displayName.split(' ');
          customerInfo.value.firstName = nameParts[0] || '';
          customerInfo.value.lastName = nameParts.slice(1).join(' ') || '';
        }
      }

      // Pre-fill customer info from custom upload form data if available
      const customUploadItem = cartItems.value.find(
        (item) => item.isCustomUpload && item.formData
      );
      if (customUploadItem?.formData) {
        customerInfo.value.firstName =
          customUploadItem.formData.firstName || customerInfo.value.firstName;
        customerInfo.value.lastName =
          customUploadItem.formData.lastName || customerInfo.value.lastName;
        customerInfo.value.email =
          customUploadItem.formData.email || customerInfo.value.email;
        customerInfo.value.phone =
          customUploadItem.formData.phone || customerInfo.value.phone;
      }

      // Auto-select shipping option based on check-in status
      if (checkedInEvent.value) {
        selectedShippingOption.value = 'collect_at_event';
      } else {
        selectedShippingOption.value = 'ship_to_address';
      }

      // Initialize Square payments after a short delay to ensure SDK is loaded
      setTimeout(() => {
        initializeSquarePayments();
      }, 500);
    });

    // Auto-select payment option when shipping option changes
    watch(selectedShippingOption, () => {
      if (paymentOptions.value.length > 0) {
        selectedPaymentOption.value = paymentOptions.value[0].value;
      }
    });

    watch(
      paymentOptions,
      (options) => {
        if (!options.find((option) => option.value === selectedPaymentOption.value)) {
          selectedPaymentOption.value = options.length > 0 ? options[0].value : null;
        }
      },
      { immediate: true }
    );

    // Shipping options based on check-in status
    const shippingOptions = computed(() => {
      if (checkedInEvent.value) {
        return [
          {
            label: `Collect at ${checkedInEvent.value.name}`,
            value: 'collect_at_event',
            description: 'Pick up at the market event - Free',
          },
          {
            label: 'Ship to Address',
            value: 'ship_to_address',
            description: `Standard shipping - $${shippingCost.value.toFixed(
              2
            )}`,
          },
        ];
      } else {
        return [
          {
            label: 'Ship to Address',
            value: 'ship_to_address',
            description: `Standard shipping - $${shippingCost.value.toFixed(
              2
            )}`,
            required: true,
          },
        ];
      }
    });

    // Available payment methods based on Square readiness and context
    const availablePaymentMethods = computed(() => {
      const hasEvent =
        selectedShippingOption.value === 'collect_at_event' &&
        checkedInEvent.value;

      return {
        applePay: applePayReady.value,
        googlePay: googlePayReady.value,
        paypal: true, // PayPal available everywhere
        payAtEvent: hasEvent,
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

      if (availablePaymentMethods.value.paypal) {
        options.push({
          label: 'PayPal',
          value: 'paypal',
          disable: false,
        });
      }

      if (availablePaymentMethods.value.payAtEvent) {
        options.push({
          label: 'Pay at Event',
          value: 'pay_at_event',
          disable: false,
        });
      }

      return options;
    });

    // Calculate order total
    const orderTotal = computed(() => {
      let total = cartSubtotal.value;
      if (selectedShippingOption.value === 'ship_to_address') {
        total += shippingCost.value;
      }
      // TODO: Add tax calculation if needed
      return total;
    });

    // Check if order can be placed
    const canPlaceOrder = computed(() => {
      if (
        !customerInfo.value.firstName ||
        !customerInfo.value.lastName ||
        !customerInfo.value.email
      ) {
        return false;
      }
      if (!selectedShippingOption.value || !selectedPaymentOption.value) {
        return false;
      }
      if (
        selectedShippingOption.value === 'ship_to_address' &&
        (!shippingAddress.value.street ||
          !shippingAddress.value.city ||
          !shippingAddress.value.state ||
          !shippingAddress.value.zip)
      ) {
        return false;
      }
      return true;
    });

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
      if (!squareCard.value) {
        return;
      }
      await nextTick();
      const container = document.getElementById('square-payment-form');
      if (!container) {
        return;
      }
      if (!squareCardMounted.value) {
        container.innerHTML = '';
        await squareCard.value.attach('#square-payment-form');
        squareCardMounted.value = true;
      }
    };

    const renderApplePayButton = async () => {
      if (!squareApplePay.value) {
        return;
      }
      await nextTick();
      const container = document.getElementById('square-apple-pay-button');
      if (!container) {
        return;
      }
      if (applePayAttached.value) {
        return;
      }
      container.innerHTML = '';
      try {
        await squareApplePay.value.attach('#square-apple-pay-button');
        applePayAttached.value = true;
      } catch (error) {
        applePayError.value = error;
        console.error('Error attaching Apple Pay button:', error);
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
            selectedShippingOption.value === 'ship_to_address',
        });
      } catch (error) {
        console.warn('Failed to update Square payment request:', error);
      }
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

        const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        if (!window.Square) {
          console.warn('Square SDK not loaded yet');
          return;
        }

        if (!applicationId || !locationId) {
          console.warn(
            'Square credentials not configured. See SQUARE_PAYMENT_SETUP.md'
          );
          return;
        }

        const payments = window.Square.payments(applicationId, locationId);
        squarePayments.value = payments;

        const paymentRequest = payments.paymentRequest({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: orderTotal.value.toFixed(2),
            label: 'Lil Magnet Memories',
          },
          requestBillingContact: true,
          requestShippingContact:
            selectedShippingOption.value === 'ship_to_address',
        });
        squarePaymentRequest.value = paymentRequest;

        try {
          const applePay = await payments.applePay(paymentRequest);
          const canMakePayment = await applePay.canMakePayment();
          if (canMakePayment) {
            squareApplePay.value = applePay;
            applePayReady.value = true;
          } else {
            applePayReady.value = false;
          }
        } catch (appleError) {
          console.warn('Apple Pay not available:', appleError);
          applePayError.value = appleError;
          applePayReady.value = false;
        }

        try {
          const googlePay = await payments.googlePay(paymentRequest);
          const canMakePayment = await googlePay.canMakePayment();
          if (canMakePayment.result) {
            squareGooglePay.value = googlePay;
            googlePayReady.value = true;
          } else {
            googlePayReady.value = false;
          }
        } catch (googleError) {
          console.warn('Google Pay not available:', googleError);
          googlePayError.value = googleError;
          googlePayReady.value = false;
        }

        const card = await payments.card();
        squareCard.value = card;

        await mountSquareCard();
        squareInitialized.value = true;
        await updateSquarePaymentRequest();

        if (selectedPaymentOption.value === 'apple_pay' && applePayReady.value) {
          await renderApplePayButton();
        }
        if (
          selectedPaymentOption.value === 'google_pay' &&
          googlePayReady.value
        ) {
          await renderGooglePayButton();
        }

        console.log('✅ Square payments initialized successfully');
      } catch (error) {
        squareInitError.value = error;
        console.error('Error initializing Square payments:', error);
      }
    };

    const placeOrder = async () => {
      if (!canPlaceOrder.value) {
        $q.notify({
          type: 'negative',
          message: 'Please fill in all required fields',
          position: 'top',
        });
        return;
      }

      submitting.value = true;

      try {
        const orderNumber = generateOrderNumber();
        const currentUser = authService.getCurrentUser();

        // Prepare order data
        const orderData = {
          orderNumber,
          orderType: 'product_cart',
          cartItems: cartItems.value.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice,
          })),
          customer: {
            firstName: customerInfo.value.firstName,
            lastName: customerInfo.value.lastName,
            email: customerInfo.value.email,
            phone: customerInfo.value.phone || '',
          },
          userId: currentUser?.uid || null,
          shippingOption: {
            type: selectedShippingOption.value,
            eventId:
              selectedShippingOption.value === 'collect_at_event'
                ? checkedInEvent.value?.id
                : null,
            address:
              selectedShippingOption.value === 'ship_to_address'
                ? { ...shippingAddress.value }
                : null,
          },
          paymentOption: {
            type: selectedPaymentOption.value,
            processor:
              selectedPaymentOption.value === 'online' ? 'square' : null,
            paymentId: null, // Will be set after payment processing
            paidAt: null,
          },
          subtotal: cartSubtotal.value,
          shipping:
            selectedShippingOption.value === 'ship_to_address'
              ? shippingCost.value
              : 0,
          tax: 0, // TODO: Calculate tax if needed
          totalAmount: orderTotal.value,
          status:
            selectedPaymentOption.value === 'pay_at_event'
              ? 'pending_payment'
              : 'pending',
        };

        // TODO: Process payment if paying online
        if (selectedPaymentOption.value === 'online') {
          // Square payment processing will go here
          // For now, we'll save the order and mark payment as pending
          orderData.paymentOption.paymentId = 'pending'; // Placeholder
        }

        // Save order to Firebase
        await firebaseService.saveCartOrder(orderData);

        // Clear cart
        clearCart();

        // Show success notification
        $q.notify({
          type: 'positive',
          message: 'Order placed successfully!',
          caption: `Order #${orderNumber}`,
          position: 'top',
          timeout: 5000,
        });

        // Redirect to thank you page
        router.push({
          path: '/thank-you',
          query: {
            orderNumber: orderNumber,
            customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
            customerEmail: customerInfo.value.email,
            totalAmount: orderTotal.value.toFixed(2),
          },
        });
      } catch (error) {
        console.error('Error placing order:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to place order',
          caption: error.message || 'Please try again',
          position: 'top',
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
      shippingCost,
      selectedShippingOption,
      selectedPaymentOption,
      shippingOptions,
      orderTotal,
      canPlaceOrder,
      submitting,
      checkedInEvent,
      placeOrder,
      getPaymentIcon,
      availablePaymentMethods,
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

.border-top {
  border-top: 1px solid #e0e0e0;
  margin-top: 16px;
}
</style>
