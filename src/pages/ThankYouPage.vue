<template>
  <q-page class="thank-you-page">
    <div class="thank-you-container">
      <div class="text-center">
        <!-- Order Details Card -->
        <q-card class="order-details-card">
          <q-card-section class="text-center">
            <div class="text-h5 text-weight-bold text-primary q-mb-md">
              <q-icon name="check_circle" size="28px" color="positive" class="q-mr-sm" />
              Thank You!
            </div>
            <p class="thank-you-subtitle q-mb-md">
              We've received your order and will get started on your custom magnets
              right away.
            </p>

            <div class="order-number-section">
              <div class="text-caption text-grey-6 q-mb-xs">
                Your Order Number:
              </div>
              <div class="order-number-display">
                {{ formattedOrderNumber }}
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <!-- Customer Info -->
            <div class="customer-info q-mb-sm">
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

            <q-separator class="q-my-sm" />

            <div class="receipt-summary q-mb-sm">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">
                Receipt Summary:
              </div>
              <div class="row justify-between text-body1 text-weight-medium">
                <div>
                  {{
                    isPayAtTent ? 'Total to pay at tent' : 'Total Paid'
                  }}
                </div>
                <div class="text-primary">
                  {{ formatCurrency(totalAmount) }}
                </div>
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <div class="delivery-info q-mb-sm">
              <div class="row justify-between items-center text-body1 text-weight-medium">
                <div class="row items-center">
                <q-icon name="local_shipping" size="20px" class="q-mr-sm" />
                  <span>Delivery Option</span>
                </div>
                <div class="text-primary">
                  {{ deliveryOptionLabel }}
              </div>
              </div>
            </div>

            <q-separator class="q-my-sm" />

            <div class="payment-info q-mb-sm">
              <div class="row justify-between items-center text-body1 text-weight-medium">
                <div class="row items-center">
                <q-icon name="credit_card" size="20px" class="q-mr-sm" />
                  <span>Payment Method</span>
                </div>
                <div class="text-primary">
                  {{ displayPaymentMethod }}
              </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Google Review Prompt -->
        <q-card v-if="isGoogleReviewConfigured" class="google-review-prompt q-mt-lg">
          <q-card-section class="text-center google-review-content">
            <q-icon name="star" size="32px" color="primary" class="q-mb-xs" />
            <div class="text-h6 text-weight-bold q-mb-xs">Loved your magnets?</div>
            <div class="text-body2 text-grey-7 q-mb-sm">
              Share your experience and help others discover us!
            </div>
            <q-btn
              color="primary"
              label="Leave Google Review"
              icon="open_in_new"
              size="md"
              :href="googleReviewUrl"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackGoogleClick"
              class="q-mb-xs"
            />
            <div class="text-caption text-grey-6">
              Takes less than 30 seconds
            </div>
          </q-card-section>
        </q-card>

        <!-- Action Buttons -->
        <div class="action-buttons q-mt-lg">
          <q-btn
            color="primary"
            size="lg"
            class="full-width q-mb-md"
            @click="submitAnotherOrder"
          >
            <q-icon name="camera_alt" class="q-mr-sm" />
            Submit Another Order
          </q-btn>

          <q-btn
            v-if="isAuthenticated"
            color="primary"
            size="lg"
            class="full-width q-mb-md"
            @click="viewMyOrders"
          >
            <q-icon name="list_alt" class="q-mr-sm" />
            View My Orders
          </q-btn>

          <q-btn
            flat
            color="grey-7"
            size="lg"
            class="full-width"
            @click="goHome"
          >
            <q-icon name="arrow_back" class="q-mr-sm" />
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
import { marketEventService } from '../services/marketEventService.js';
import { 
  getGoogleReviewUrl, 
  isGoogleReviewConfigured,
  trackGoogleReviewClick 
} from '../utils/googleReviews.js';

export default {
  name: 'ThankYouPage',
  setup() {
    const router = useRouter();
    const route = useRoute();

    // Google Reviews integration
    const googleReviewUrl = computed(() => getGoogleReviewUrl());
    const trackGoogleClick = () => trackGoogleReviewClick('thank-you-page');

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
      // Check if user is currently at a market event (checked in)
      const checkedInEvent = marketEventService.getCheckedInEvent();
      const isAtMarketEvent = checkedInEvent !== null;

      // Route to photo upload form (unified page handles both market and online)
      router.push('/photo-upload');
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

      // Determine total amount with priority:
      // 1. Explicit totalAmount from data
      // 2. Amount from paymentOption (for pay_at_event orders)
      // 3. Calculate from subtotal + shipping + tax
      if (data.totalAmount !== undefined && Number(data.totalAmount) > 0) {
        totalAmount.value = Number(data.totalAmount);
      } else if (data.paymentOption?.amount !== undefined && Number(data.paymentOption.amount) > 0) {
        // For pay_at_event orders, use the amount from paymentOption
        totalAmount.value = Number(data.paymentOption.amount);
      } else {
        // Fallback: calculate from components
        totalAmount.value = subtotal.value + shippingCost.value + tax.value;
      }
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

    const isPayAtTent = computed(() => {
      return paymentOption.value?.type === 'pay_at_event';
    });

    const isPickupOrder = computed(() => {
      // Check if shipping option is pickup type
      if (shippingOption.value?.type === 'pickup') {
        return true;
      }
      // Also check if payment is at event (market event order)
      if (isPayAtTent.value) {
        return true;
      }
      return false;
    });

    const displayPaymentMethod = computed(() => {
      if (isPayAtTent.value) {
        return 'Payment Options at Tent';
      }
      return paymentMethodLabel.value;
    });

    const deliveryOptionLabel = computed(() => {
      // For pickup orders, show pickup label
      if (isPickupOrder.value) {
        return 'Pickup at Market Event';
      }
      // Otherwise use shipping method label
      return shippingMethodLabel.value;
    });

    const formattedOrderNumber = computed(() => {
      // Make order number more readable by adding spacing, but remove LMM prefix
      if (!orderNumber.value) return 'N/A';
      // Format like: LMM-251116-1886 -> 251116 - 1886 (removed LMM -)
      return orderNumber.value.replace(/([A-Z]+)-(\d+)-(\d+)/, '$2 - $3');
    });

    onMounted(() => {
      // Check authentication status (excludes anonymous users)
      isAuthenticated.value = authService.isAuthenticated();

      authService.onAuthStateChanged((user) => {
        // Only set authenticated if user exists and is not anonymous
        isAuthenticated.value = authService.isAuthenticated();
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
      formattedOrderNumber,
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
      displayPaymentMethod,
      deliveryOptionLabel,
      isPayAtTent,
      isPickupOrder,
      isAuthenticated,
      submitAnotherOrder,
      goHome,
      viewMyOrders,
      formatCurrency,
      // Google Reviews
      googleReviewUrl,
      isGoogleReviewConfigured,
      trackGoogleClick,
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

.thank-you-subtitle {
  font-size: 1rem;
  color: #6c757d;
  margin: 0;
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

.order-number-display {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  font-family: 'Courier New', monospace;
  word-spacing: 0.2em;
}

.customer-info {
  text-align: left;
}

.receipt-summary .row {
  margin: 4px 0;
}

.delivery-info .row,
.payment-info .row {
  margin: 0;
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.action-btn {
  min-width: 280px;
  width: 100%;
  max-width: 350px;
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
  .thank-you-subtitle {
    font-size: 0.9rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: center;

    .action-btn {
      width: 100%;
      max-width: 300px;
      min-width: 200px;
    }
  }

  .order-number-display {
    font-size: 1.5rem;
  }

  .order-number-section {
    padding: 1rem;
  }
}

.google-review-prompt {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(228, 217, 255, 0.2);
  border: 1px solid rgba(228, 217, 255, 0.3);
  background: linear-gradient(135deg, #FAFAFF 0%, #E4D9FF 100%);
  transition: all 0.3s ease;
}

.google-review-prompt:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(228, 217, 255, 0.3);
}

.google-review-content {
  padding: 16px 20px !important;
}
</style>
