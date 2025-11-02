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
                  <div class="text-h6 q-mb-md">Payment</div>
                  <q-option-group
                    v-model="selectedPaymentOption"
                    :options="paymentOptions"
                    color="primary"
                  />
                </q-card-section>

                <!-- Payment Form (if paying online) -->
                <q-card-section
                  v-if="selectedPaymentOption === 'online'"
                  class="q-pt-none"
                >
                  <div class="text-caption text-grey-7 q-mb-sm">
                    Payment will be processed securely
                  </div>
                  <!-- Square payment form will go here -->
                  <div id="square-payment-form" class="q-mt-md">
                    <div class="text-body2 text-grey-6">
                      Payment integration coming soon
                    </div>
                  </div>
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
import { ref, computed, onMounted, watch } from 'vue';
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
    });

    // Auto-select payment option when shipping option changes
    watch(selectedShippingOption, () => {
      if (paymentOptions.value.length > 0) {
        selectedPaymentOption.value = paymentOptions.value[0].value;
      }
    });

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

    // Payment options based on shipping selection
    const paymentOptions = computed(() => {
      if (
        selectedShippingOption.value === 'collect_at_event' &&
        checkedInEvent.value
      ) {
        return [
          {
            label: 'Pay Online Now',
            value: 'online',
            description: 'Pay securely with Square',
          },
          {
            label: 'Pay at Pop-up Station',
            value: 'pay_at_event',
            description: 'Pay when you collect your order',
          },
        ];
      } else {
        return [
          {
            label: 'Pay Online',
            value: 'online',
            description: 'Pay securely with Square',
            required: true,
          },
        ];
      }
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
      paymentOptions,
      orderTotal,
      canPlaceOrder,
      submitting,
      checkedInEvent,
      placeOrder,
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
</style>
