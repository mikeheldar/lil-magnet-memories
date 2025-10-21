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
import { ref, onMounted } from 'vue';
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

    onMounted(() => {
      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log(
          'User already authenticated on thank you page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
      }

      // Check authentication status
      authService.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user;
      });

      // Get order details from route params or localStorage
      if (route.query.orderNumber) {
        orderNumber.value = route.query.orderNumber;
        customerName.value = route.query.customerName || '';
        customerEmail.value = route.query.customerEmail || '';
        totalMagnets.value = parseInt(route.query.totalMagnets) || 0;
      } else {
        // Fallback to localStorage if route params not available
        const orderData = localStorage.getItem('lastOrderData');
        if (orderData) {
          try {
            const data = JSON.parse(orderData);
            orderNumber.value = data.orderNumber || 'N/A';
            customerName.value = data.customerName || '';
            customerEmail.value = data.customerEmail || '';
            totalMagnets.value = data.totalMagnets || 0;
          } catch (error) {
            console.error('Error parsing order data:', error);
            orderNumber.value = 'N/A';
          }
        } else {
          orderNumber.value = 'N/A';
        }
      }
    });

    return {
      orderNumber,
      customerName,
      customerEmail,
      totalMagnets,
      isAuthenticated,
      submitAnotherOrder,
      goHome,
      viewMyOrders,
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
