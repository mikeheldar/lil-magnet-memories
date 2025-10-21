<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">My Orders</div>
      <div class="text-subtitle1 text-grey-7">
        Track the status of your magnet orders
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="32px" />
      <div class="text-body2 q-mt-sm text-grey-6">Loading your orders...</div>
    </div>

    <!-- Error State -->
    <q-card v-else-if="error" class="q-pa-lg text-center">
      <q-card-section>
        <div class="text-h6 text-center text-negative">
          <q-icon name="error" size="32px" class="q-mb-sm" />
          <div>Error loading orders</div>
          <div class="text-caption q-mt-sm">{{ error }}</div>
          <q-btn
            color="primary"
            label="Retry"
            @click="loadUserOrders"
            class="q-mt-md"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- No Orders State -->
    <q-card v-else-if="userOrders.length === 0" class="q-pa-lg text-center">
      <q-card-section>
        <q-icon name="inbox" size="64px" class="text-grey-5 q-mb-md" />
        <div class="text-h5 text-weight-bold text-grey-7 q-mb-sm">
          No Orders Yet
        </div>
        <div class="text-subtitle1 text-grey-6">
          You haven't placed any orders yet.
        </div>
        <q-btn
          color="primary"
          label="Place Your First Order"
          icon="camera_alt"
          @click="$router.push('/upload')"
          class="q-mt-md"
        />
      </q-card-section>
    </q-card>

    <!-- Orders List -->
    <div v-else class="q-gutter-md">
      <q-card v-for="order in userOrders" :key="order.id" class="order-card">
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h6 text-weight-bold">
                Order #{{ order.orderNumber }}
                <q-chip
                  :color="getStatusColor(order.status)"
                  text-color="white"
                  size="sm"
                  class="q-ml-sm"
                >
                  {{ order.status }}
                </q-chip>
              </div>
            </div>
            <div class="col-auto">
              <div class="text-caption text-grey-6">
                {{ formatDate(order.submissionDate) }}
              </div>
            </div>
          </div>

          <q-separator class="q-mb-md" />

          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-6">
              <div class="text-weight-medium text-primary">
                Customer Information
              </div>
              <div class="q-mt-xs">
                <div>
                  <strong>Name:</strong> {{ order.customer.firstName }}
                  {{ order.customer.lastName }}
                </div>
                <div>
                  <strong>Email:</strong>
                  <a
                    :href="`mailto:${order.customer.email}`"
                    class="text-primary"
                    >{{ order.customer.email }}</a
                  >
                </div>
                <div v-if="order.customer.phone">
                  <strong>Phone:</strong>
                  <a
                    :href="`tel:${order.customer.phone}`"
                    class="text-primary"
                    >{{ order.customer.phone }}</a
                  >
                </div>
                <div v-if="order.specialInstructions">
                  <strong>Special Instructions:</strong>
                  <div class="text-grey-7 q-mt-xs">
                    {{ order.specialInstructions }}
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-weight-medium text-primary">Order Summary</div>
              <div class="q-mt-xs">
                <div>
                  <strong>Total Photos:</strong> {{ order.photos.length }}
                </div>
                <div>
                  <strong>Total Magnets:</strong> {{ order.totalMagnets }}
                </div>
                <div>
                  <strong>Order Date:</strong>
                  {{ formatDate(order.submissionDate) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Photos Grid -->
          <div class="q-mt-md">
            <div class="text-weight-medium text-primary q-mb-sm">
              Photos & Quantities
            </div>
            <div class="row q-col-gutter-sm">
              <div
                v-for="(photo, index) in order.photos"
                :key="index"
                class="col-6 col-sm-4 col-md-3 col-lg-2"
              >
                <q-img :src="photo.url" ratio="1" class="rounded-borders" />
                <div class="text-caption text-center q-mt-xs">
                  {{ photo.name }}
                </div>
                <div class="text-center q-mt-xs">
                  <q-chip
                    color="primary"
                    text-color="white"
                    size="sm"
                    icon="style"
                  >
                    {{ order.quantities[index] }}
                  </q-chip>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default {
  name: 'CustomerOrdersPage',
  setup() {
    const router = useRouter();
    const orders = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const currentUser = ref(null);
    let unsubscribeOrders = null;

    const setupRealtimeListener = () => {
      if (!currentUser.value?.uid) {
        console.log('No user ID available for real-time listener');
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('submissionDate', 'desc'));

        unsubscribeOrders = onSnapshot(
          q,
          (snapshot) => {
            const allOrders = [];
            snapshot.forEach((doc) => {
              allOrders.push({
                id: doc.id,
                ...doc.data(),
              });
            });

            // Filter orders for current user
            const userOrders = allOrders.filter((order) => {
              const matchesUserId = order.userId === currentUser.value.uid;
              const matchesEmail =
                order.customer?.email === currentUser.value.email;
              return matchesUserId || matchesEmail;
            });

            orders.value = userOrders;
            loading.value = false;
            console.log('User orders updated in real-time:', userOrders.length);
          },
          (err) => {
            console.error('Real-time listener error:', err);
            error.value = err.message;
            loading.value = false;
          }
        );
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        error.value = err.message;
        loading.value = false;
      }
    };

    const loadUserOrders = async () => {
      loading.value = true;
      error.value = null;

      // Add timeout to prevent infinite spinning
      const timeoutId = setTimeout(() => {
        if (loading.value) {
          console.log('Load timeout reached, stopping loading');
          loading.value = false;
          error.value = 'Loading timed out. Please try again.';
        }
      }, 15000); // 15 second timeout

      try {
        if (currentUser.value?.uid) {
          console.log('Loading orders for user:', currentUser.value.uid);
          console.log('Current user object:', currentUser.value);

          // Try the getUserOrders method first
          try {
            orders.value = await firebaseService.getUserOrders(
              currentUser.value.uid,
              currentUser.value.email
            );
            console.log('Loaded orders via getUserOrders:', orders.value);
            console.log('Number of orders found:', orders.value.length);
          } catch (getUserOrdersError) {
            console.log(
              'getUserOrders failed, trying fallback method:',
              getUserOrdersError
            );

            // Fallback: get all orders and filter client-side
            const allOrders = await firebaseService.getOrders();
            console.log('All orders from Firebase:', allOrders);
            console.log('Total orders in database:', allOrders.length);

            // Debug: log each order's userId and email
            allOrders.forEach((order, index) => {
              console.log(
                `Order ${index}: userId=${order.userId}, email=${order.customer?.email}, orderNumber=${order.orderNumber}`
              );
            });

            // Filter by userId first, then by email as fallback
            orders.value = allOrders.filter((order) => {
              const matchesUserId = order.userId === currentUser.value.uid;
              const matchesEmail =
                order.customer?.email === currentUser.value.email;
              return matchesUserId || matchesEmail;
            });
            console.log('Filtered orders for user:', orders.value);
            console.log('Number of filtered orders:', orders.value.length);
          }
        } else {
          console.log('No user ID available');
          orders.value = [];
        }
      } catch (err) {
        console.error('Error loading user orders:', err);
        error.value = err.message || 'Failed to load orders';
        orders.value = [];
      } finally {
        clearTimeout(timeoutId);
        loading.value = false;
      }
    };

    const userOrders = computed(() => {
      return orders.value;
    });

    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'new':
          return 'orange';
        case 'in_progress':
          return 'blue';
        case 'completed':
          return 'green';
        case 'cancelled':
          return 'red';
        default:
          return 'grey';
      }
    };

    const getDisplayStatus = (status) => {
      switch (status) {
        case 'new':
          return 'new order submitted';
        case 'in_progress':
          return 'in progress';
        case 'completed':
          return 'completed';
        case 'cancelled':
          return 'cancelled';
        default:
          return status;
      }
    };

    onMounted(() => {
      // Check if user is already authenticated
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log('User already authenticated:', currentAuthUser);
        currentUser.value = currentAuthUser;
        setupRealtimeListener();
      } else {
        console.log('No current user, waiting for auth state change...');
        // Set up auth state listener
        authService.onAuthStateChanged((user) => {
          console.log('Auth state changed in CustomerOrdersPage:', user);
          currentUser.value = user;
          if (user) {
            console.log('User authenticated, setting up real-time listener...');
            currentUser.value = user;
            setupRealtimeListener();
          } else {
            console.log('No user, redirecting to home page');
            orders.value = [];
            loading.value = false;
            // Redirect to home page when user signs out
            router.push('/');
          }
        });

        // Fallback: try to load after a short delay in case auth is still initializing
        setTimeout(() => {
          if (!currentUser.value && loading.value) {
            console.log('Fallback: trying to get current user after delay...');
            const delayedUser = authService.getCurrentUser();
            if (delayedUser) {
              console.log('Found user after delay:', delayedUser);
              currentUser.value = delayedUser;
              setupRealtimeListener();
            } else {
              console.log('Still no user after delay, stopping loading');
              loading.value = false;
              error.value = 'Please sign in to view your orders.';
            }
          }
        }, 2000); // 2 second delay
      }
    });

    onUnmounted(() => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
        console.log('Customer orders real-time listener unsubscribed');
      }
    });

    return {
      orders,
      loading,
      error,
      userOrders,
      loadUserOrders,
      formatDate,
      getStatusColor,
      getDisplayStatus,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.order-card {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
</style>
