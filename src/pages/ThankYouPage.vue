<template>
  <q-page class="thank-you-page">
    <div class="thank-you-container">
      <div class="text-center">
        <!-- Success Icon -->
        <div class="success-icon-container">
          <q-icon name="check_circle" size="80px" color="positive" />
        </div>

        <!-- Thank You Message -->
        <h1 class="thank-you-title">Thank You!</h1>
        <p class="thank-you-subtitle">
          We've received your order and will get started on your custom magnets
          right away.
        </p>

        <!-- Order Details Card -->
        <q-card class="order-details-card">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold text-primary q-mb-md">
              <q-icon name="receipt" size="28px" class="q-mr-sm" />
              Order Confirmation
            </div>

            <div class="order-number-section">
              <div class="text-caption text-grey-6 q-mb-xs">
                Your Order Number:
              </div>
              <div class="text-h4 text-weight-bold text-primary">
                {{ orderNumber }}
              </div>
            </div>

            <q-separator class="q-my-md" />

            <!-- Customer Info -->
            <div class="customer-info q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">
                Order Details:
              </div>
              <div class="text-body1">
                <strong>{{ customerName }}</strong>
              </div>
              <div class="text-body2 text-grey-7">
                {{ customerEmail }}
              </div>
              <div class="text-body2 text-grey-7 q-mt-xs">
                {{ totalMagnets }} custom magnet{{
                  totalMagnets > 1 ? 's' : ''
                }}
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="receipt-summary q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">
                Receipt Summary:
              </div>
              <div class="row justify-between text-body2">
                <div>Subtotal</div>
                <div>{{ formatCurrency(subtotal) }}</div>
              </div>
              <div class="row justify-between text-body2">
                <div>Shipping</div>
                <div>{{ formatCurrency(shippingCost) }}</div>
              </div>
              <div class="row justify-between text-body2">
                <div>Tax</div>
                <div>{{ formatCurrency(tax) }}</div>
              </div>
              <q-separator class="q-my-sm" />
              <div
                class="row justify-between text-body1 text-weight-medium q-mt-sm"
              >
                <div>Total</div>
                <div class="text-primary">
                  {{ formatCurrency(totalAmount) }}
                </div>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="shipping-info q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">
                <q-icon name="local_shipping" size="20px" class="q-mr-sm" />
                Shipping
              </div>
              <div class="text-body2 text-grey-7">
                <div>
                  <strong>{{ shippingMethodLabel }}</strong>
                  <span class="q-ml-sm">
                    ({{ formatCurrency(shippingCost) }})
                  </span>
                </div>
                <div v-if="shippingTimeline" class="q-mt-xs">
                  {{ shippingTimeline }}
                </div>
                <div v-if="shippingAddressLines.length" class="q-mt-sm">
                  <div class="text-caption text-grey-6">Deliver to:</div>
                  <div
                    v-for="(line, index) in shippingAddressLines"
                    :key="`ship-${index}`"
                  >
                    {{ line }}
                  </div>
                </div>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="billing-info q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">
                <q-icon name="credit_card" size="20px" class="q-mr-sm" />
                Payment
              </div>
              <div class="text-body2 text-grey-7">
                <div>
                  Method:
                  <strong>{{ paymentMethodLabel }}</strong>
                </div>
                <div v-if="billingAddressLines.length" class="q-mt-sm">
                  <div class="text-caption text-grey-6">Billing address:</div>
                  <div
                    v-for="(line, index) in billingAddressLines"
                    :key="`bill-${index}`"
                  >
                    {{ line }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">
                <q-icon name="email" size="20px" class="q-mr-sm" />
                What's Next?
              </div>
              <div class="text-body2 text-grey-7">
                <p class="q-mb-sm">
                  • We'll review your photos and contact you within 24 hours
                </p>
                <p class="q-mb-sm">
                  • You'll receive an email with pricing and timeline details
                </p>
                <p class="q-mb-sm">
                  • We'll send another email when your magnets are ready!
                </p>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Action Buttons -->
        <div class="action-buttons q-mt-xl">
          <!-- Show "View My Orders" button first for authenticated users -->
          <q-btn
            v-if="isAuthenticated"
            color="purple"
            size="lg"
            class="q-px-xl q-py-md q-mr-md"
            @click="viewMyOrders"
          >
            <q-icon name="list_alt" class="q-mr-sm" />
            View My Orders
          </q-btn>

          <q-btn
            color="primary"
            size="lg"
            class="q-px-xl q-py-md q-mr-md"
            @click="submitAnotherOrder"
          >
            <q-icon name="camera_alt" class="q-mr-sm" />
            Submit Another Order
          </q-btn>

          <q-btn
            flat
            color="grey-7"
            size="lg"
            class="q-px-xl q-py-md"
            @click="goHome"
          >
            <q-icon name="home" class="q-mr-sm" />
            Back to Home
          </q-btn>
        </div>

        <!-- Contact Info -->
        <div class="contact-info q-mt-xl">
          <div class="text-caption text-grey-6">
            Questions about your order? Contact us at
            <a href="mailto:orders@lilmagnetmemories.com" class="text-primary">
              orders@lilmagnetmemories.com
            </a>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from '../services/authService';

export default {
  name: 'ThankYouPage',
  setup() {
    const router = useRouter();
    const route = useRoute();

    const orderNumber = ref('');
    const customerName = ref('');
    const customerEmail = ref('');
    const totalMagnets = ref(0);
    const subtotal = ref(0);
    const shippingCost = ref(0);
    const tax = ref(0);
    const totalAmount = ref(0);
    const shippingOption = ref(null);
    const paymentOption = ref(null);
    const shippingTimeline = ref('');
    const shippingAddress = ref(null);
    const billingAddress = ref(null);
    const isAuthenticated = ref(false);

    const submitAnotherOrder = () => {
      router.push('/upload');
    };

    const goHome = () => {
      router.push('/');
    };

    const viewMyOrders = () => {
      router.push('/my-orders');
    };

    const formatCurrency = (value) => {
      const amount = Number(value || 0);
      return `$${amount.toFixed(2)}`;
    };

    const formatAddressLines = (address) => {
      if (!address) {
        return [];
      }
      const lines = [];
      if (address.street) {
        lines.push(address.street);
      }
      const cityState = [address.city, address.state]
        .filter((part) => part && part.toString().trim().length > 0)
        .join(', ');
      const postal = (address.zip || '').toString().trim();
      const cityLine = [cityState, postal].filter(Boolean).join(' ');
      if (cityLine) {
        lines.push(cityLine);
      }
      return lines;
    };

    const applyReceiptData = (data) => {
      if (!data) return;
      if (data.orderNumber) {
        orderNumber.value = data.orderNumber;
      }
      if (data.customerName) {
        customerName.value = data.customerName;
      }
      if (data.customerEmail) {
        customerEmail.value = data.customerEmail;
      }
      if (typeof data.totalMagnets === 'number') {
        totalMagnets.value = data.totalMagnets;
      }
      subtotal.value = Number(data.subtotal || 0);
      shippingCost.value = Number(data.shipping || 0);
      tax.value = Number(data.tax || 0);
      totalAmount.value =
        data.totalAmount !== undefined
          ? Number(data.totalAmount)
          : subtotal.value + shippingCost.value + tax.value;
      shippingOption.value = data.shippingOption || null;
      paymentOption.value = data.paymentOption || null;
      shippingTimeline.value =
        data.shippingOption?.estimatedTimeline || data.shippingTimeline || '';
      shippingAddress.value = data.shippingOption?.address || null;
      billingAddress.value = data.paymentOption?.billingAddress || null;
    };

    const shippingMethodLabel = computed(() => {
      if (shippingOption.value?.label) {
        return shippingOption.value.label;
      }
      if (shippingOption.value?.value) {
        return shippingOption.value.value.replace(/_/g, ' ');
      }
      return 'Shipping';
    });

    const shippingAddressLines = computed(() =>
      formatAddressLines(shippingAddress.value)
    );
    const billingAddressLines = computed(() =>
      formatAddressLines(billingAddress.value)
    );

    const paymentMethodLabel = computed(() => {
      const type = paymentOption.value?.type;
      switch (type) {
        case 'square_card':
          return 'Credit/Debit Card';
        case 'apple_pay':
          return 'Apple Pay';
        case 'google_pay':
          return 'Google Pay';
        case 'paypal':
          return 'PayPal';
        case 'pay_at_event':
          return 'Pay at Event';
        default:
          return type ? type.replace(/_/g, ' ') : 'Payment';
      }
    });

    onMounted(() => {
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log(
          'User already authenticated on thank you page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
      }

      authService.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user;
      });

      if (route.query.orderNumber) {
        orderNumber.value = route.query.orderNumber;
        customerName.value = route.query.customerName || '';
        customerEmail.value = route.query.customerEmail || '';
        totalMagnets.value = parseInt(route.query.totalMagnets) || 0;
      }

      const storedData = localStorage.getItem('lastOrderData');
      if (storedData) {
        try {
          const data = JSON.parse(storedData);
          applyReceiptData(data);
        } catch (error) {
          console.error('Error parsing order data:', error);
        }
      }

      if (!orderNumber.value) {
        orderNumber.value = 'N/A';
      }
    });

    return {
      orderNumber,
      customerName,
      customerEmail,
      totalMagnets,
      subtotal,
      shippingCost,
      tax,
      totalAmount,
      shippingTimeline,
      shippingMethodLabel,
      shippingAddressLines,
      billingAddressLines,
      paymentMethodLabel,
      isAuthenticated,
      submitAnotherOrder,
      goHome,
      viewMyOrders,
      formatCurrency,
    };
  },
};
</script>

<style lang="scss" scoped>
.thank-you-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.thank-you-container {
  max-width: 600px;
  width: 100%;
}

.success-icon-container {
  margin-bottom: 2rem;
  animation: bounceIn 0.6s ease-out;
}

.thank-you-title {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
  margin: 0 0 1rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.thank-you-subtitle {
  font-size: 1.2rem;
  color: #6c757d;
  margin: 0 0 2rem 0;
  font-weight: 300;
}

.order-details-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 2rem;
}

.order-number-section {
  background: linear-gradient(135deg, #9c27b0 0%, #673ab7 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin: 1rem 0;
  box-shadow: 0 4px 16px rgba(156, 39, 176, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.order-number-section .text-h4 {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-weight: 700;
  letter-spacing: 1px;
}

.customer-info {
  text-align: left;
}

.receipt-summary .row {
  margin: 4px 0;
}

.shipping-info,
.billing-info {
  text-align: left;
}

.next-steps {
  text-align: left;

  p {
    margin: 0.5rem 0;
    display: flex;
    align-items: flex-start;
  }
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-info {
  text-align: center;

  a {
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .thank-you-title {
    font-size: 2.2rem;
  }

  .thank-you-subtitle {
    font-size: 1rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;

    .q-btn {
      width: 100%;
      max-width: 300px;
    }
  }

  .order-number-section {
    padding: 1rem;
  }
}
</style>
