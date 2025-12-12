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
          @click="$router.push('/photo-upload')"
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
                  {{ getDisplayStatus(order.status) }}
                </q-chip>
              </div>
            </div>
            <div class="col-auto">
              <div class="text-caption text-grey-6">
                {{ formatDate(order.submissionDateClient) }}
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
                  <strong>Total Photos:</strong>
                  {{ order.photos?.length || order.cartItems?.length || 0 }}
                </div>
                <div>
                  <strong>Total Magnets:</strong> {{ order.totalMagnets }}
                </div>
                <div>
                  <strong>Order Date:</strong>
                  {{ formatDate(order.submissionDateClient) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Information (for online orders) -->
          <div
            v-if="
              order.shippingOption && order.shippingOption.type === 'shipping'
            "
            class="q-mt-md q-pa-md bg-blue-1 rounded-borders"
          >
            <div class="row items-center q-mb-sm">
              <div class="col">
                <div class="text-weight-medium text-primary">
                  <q-icon name="local_shipping" class="q-mr-xs" />
                  Shipping Information
                </div>
              </div>
              <div class="col-auto">
                <q-chip
                  :color="getShippingStatusColor(order.shippingStatus)"
                  text-color="white"
                  size="sm"
                >
                  {{ getShippingStatusLabel(order.shippingStatus) }}
                </q-chip>
              </div>
            </div>
            <div class="q-mt-xs">
              <div>
                <strong>Delivery Method:</strong>
                {{
                  order.shippingOption.label ||
                  order.shippingOption.description ||
                  order.shippingOption.value ||
                  'Standard Shipping'
                }}
              </div>
              <div v-if="order.shippingOption.address">
                <strong>Address:</strong>
                {{ formatAddress(order.shippingOption.address) }}
              </div>
              <div
                v-if="order.shippingOption.estimatedTimeline"
                class="q-mt-xs"
              >
                <strong>Estimated Delivery:</strong>
                {{ order.shippingOption.estimatedTimeline }}
              </div>
              <div
                v-if="order.shippingOption.cost !== undefined"
                class="q-mt-xs"
              >
                <strong>Shipping Cost:</strong> ${{
                  order.shippingOption.cost.toFixed(2)
                }}
              </div>
            </div>
          </div>

          <!-- Pickup Information (for market event orders) -->
          <div
            v-if="
              order.shippingOption && order.shippingOption.type === 'pickup'
            "
            class="q-mt-md q-pa-md bg-green-1 rounded-borders"
          >
            <div class="text-weight-medium text-primary q-mb-sm">
              <q-icon name="store" class="q-mr-xs" />
              Pickup Information
            </div>
            <div class="q-mt-xs">
              <div>
                <strong>Delivery Method:</strong>
                {{
                  order.shippingOption.label ||
                  order.shippingOption.description ||
                  order.shippingOption.value ||
                  'Pickup at Market Event'
                }}
              </div>
              <div
                v-if="
                  order.shippingOption.description &&
                  order.shippingOption.label !==
                    order.shippingOption.description
                "
                class="q-mt-xs"
              >
                <strong>Pickup Location:</strong>
                {{ order.shippingOption.description }}
              </div>
              <div
                v-if="order.shippingOption.estimatedTimeline"
                class="q-mt-xs"
              >
                <strong>Estimated Pickup:</strong>
                {{ order.shippingOption.estimatedTimeline }}
              </div>
            </div>
          </div>

          <!-- Photos Grid -->
          <div class="q-mt-md">
            <div class="text-weight-medium text-primary q-mb-sm">
              Photos & Quantities
            </div>
            <!-- Legacy orders with photos array -->
            <div
              v-if="order.photos && order.photos.length > 0"
              class="row q-col-gutter-sm"
            >
              <div
                v-for="(photo, index) in order.photos"
                :key="index"
                class="col-6 col-sm-4 col-md-3 col-lg-2"
              >
                <q-img
                  :src="getPhotoUrl(photo)"
                  ratio="1"
                  class="rounded-borders"
                  @error="handlePhotoError($event, photo)"
                >
                  <template v-slot:error>
                    <div
                      class="absolute-full flex flex-center bg-grey-3 text-grey-8"
                    >
                      <q-icon name="broken_image" size="24px" />
                    </div>
                  </template>
                </q-img>
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
                    {{ order.quantities?.[index] || 1 }}
                  </q-chip>
                </div>
              </div>
            </div>
            <!-- Cart-based orders -->
            <div
              v-else-if="order.cartItems && order.cartItems.length > 0"
              class="row q-col-gutter-sm"
            >
              <div
                v-for="(item, itemIndex) in order.cartItems"
                :key="itemIndex"
                class="col-12 q-mb-md"
              >
                <div class="text-subtitle2 q-mb-sm">{{ item.productName }}</div>
                <div class="row q-col-gutter-sm">
                  <div
                    v-for="(photo, photoIndex) in item.photos || []"
                    :key="photoIndex"
                    class="col-6 col-sm-4 col-md-3 col-lg-2"
                  >
                    <q-img
                      :src="getPhotoUrl(photo)"
                      ratio="1"
                      class="rounded-borders"
                      @error="handlePhotoError($event, photo)"
                    >
                      <template v-slot:error>
                        <div
                          class="absolute-full flex flex-center bg-grey-3 text-grey-8"
                        >
                          <q-icon name="broken_image" size="24px" />
                        </div>
                      </template>
                    </q-img>
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
                        {{
                          item.photoQuantities?.[photoIndex] ||
                          item.quantities?.[photoIndex] ||
                          1
                        }}
                      </q-chip>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-body2 text-grey-6 text-center q-pa-md">
              No photos available for this order
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
        // Sort by submissionDateClient descending (newest first) on the server for better performance
        // Client-side sort will handle any edge cases with missing dates
        const q = query(ordersRef, orderBy('submissionDateClient', 'desc'));

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
            let userOrders = allOrders.filter((order) => {
              const matchesUserId = order.userId === currentUser.value.uid;
              const matchesEmail =
                order.customer?.email === currentUser.value.email;
              return matchesUserId || matchesEmail;
            });

            // Sort by submissionDateClient (most recent first), handling missing/invalid dates
            userOrders.sort((a, b) => {
              const getDateValue = (order) => {
                // Use submissionDateClient as primary date for sorting
                const date = order.submissionDateClient;
                if (!date) {
                  // Return a very old date (0) so invalid dates sort to the bottom
                  return 0;
                }
                try {
                  // Handle Firestore Timestamp
                  if (date && typeof date.toDate === 'function') {
                    return date.toDate().getTime();
                  }
                  // Handle number timestamps (milliseconds since epoch)
                  if (typeof date === 'number') {
                    return date;
                  }
                  // Handle Firestore timestamp object with seconds/nanoseconds
                  if (date && typeof date === 'object' && 'seconds' in date) {
                    return (
                      date.seconds * 1000 + (date.nanoseconds || 0) / 1000000
                    );
                  }
                  // Handle Date objects or string timestamps
                  const parsed = new Date(date);
                  const time = parsed.getTime();
                  // If invalid date, return 0 (will sort to bottom)
                  return isNaN(time) ? 0 : time;
                } catch {
                  // Return 0 for any parsing errors (will sort to bottom)
                  return 0;
                }
              };
              const dateA = getDateValue(a);
              const dateB = getDateValue(b);
              // If both dates are 0 (invalid), maintain original order
              if (dateA === 0 && dateB === 0) return 0;
              // If one is invalid (0), put it at the bottom
              if (dateA === 0) return 1; // a goes after b
              if (dateB === 0) return -1; // b goes after a
              // Both valid: sort descending (newest first)
              return dateB - dateA;
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
            let filteredOrders = allOrders.filter((order) => {
              const matchesUserId = order.userId === currentUser.value.uid;
              const matchesEmail =
                order.customer?.email === currentUser.value.email;
              return matchesUserId || matchesEmail;
            });

            // Sort by submissionDateClient (most recent first), handling missing/invalid dates
            filteredOrders.sort((a, b) => {
              const getDateValue = (order) => {
                // Use submissionDateClient as primary date for sorting
                const date = order.submissionDateClient;
                if (!date) {
                  // Return a very old date (0) so invalid dates sort to the bottom
                  return 0;
                }
                try {
                  // Handle Firestore Timestamp
                  if (date && typeof date.toDate === 'function') {
                    return date.toDate().getTime();
                  }
                  // Handle number timestamps (milliseconds since epoch)
                  if (typeof date === 'number') {
                    return date;
                  }
                  // Handle Firestore timestamp object with seconds/nanoseconds
                  if (date && typeof date === 'object' && 'seconds' in date) {
                    return (
                      date.seconds * 1000 + (date.nanoseconds || 0) / 1000000
                    );
                  }
                  // Handle Date objects or string timestamps
                  const parsed = new Date(date);
                  const time = parsed.getTime();
                  // If invalid date, return 0 (will sort to bottom)
                  return isNaN(time) ? 0 : time;
                } catch {
                  // Return 0 for any parsing errors (will sort to bottom)
                  return 0;
                }
              };
              const dateA = getDateValue(a);
              const dateB = getDateValue(b);
              // If both dates are 0 (invalid), maintain original order
              if (dateA === 0 && dateB === 0) return 0;
              // If one is invalid (0), put it at the bottom
              if (dateA === 0) return 1; // a goes after b
              if (dateB === 0) return -1; // b goes after a
              // Both valid: sort descending (newest first)
              return dateB - dateA;
            });

            orders.value = filteredOrders;
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
      // Never use current date as fallback - show "N/A" or raw value instead
      if (timestamp === null || timestamp === undefined) {
        return 'N/A';
      }

      try {
        let date;
        // Handle Firestore Timestamp
        if (timestamp && typeof timestamp.toDate === 'function') {
          date = timestamp.toDate();
        }
        // Handle number timestamps (milliseconds since epoch - from Date.now() or submissionDateClient)
        else if (typeof timestamp === 'number') {
          date = new Date(timestamp);
        }
        // Handle string timestamps
        else if (typeof timestamp === 'string') {
          date = new Date(timestamp);
        }
        // Handle Date objects
        else if (timestamp instanceof Date) {
          date = timestamp;
        }
        // Try to convert if it's an object with seconds/nanoseconds (Firestore format)
        else if (
          timestamp &&
          typeof timestamp === 'object' &&
          'seconds' in timestamp
        ) {
          date = new Date(
            timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
          );
        } else {
          date = new Date(timestamp);
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
          // Return raw value or type info instead of current date
          return `Invalid: ${JSON.stringify(timestamp)}`;
        }

        return date.toLocaleString();
      } catch (error) {
        // Return error info instead of current date
        return `Error: ${error.message} (${JSON.stringify(timestamp)})`;
      }
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

    // Format shipping address
    const formatAddress = (address) => {
      if (!address) return 'No address provided';
      const parts = [];
      if (address.street || address.addressLine1) {
        parts.push(address.street || address.addressLine1);
      }
      if (address.addressLine2) {
        parts.push(address.addressLine2);
      }
      const cityStateZip = [];
      if (address.city) cityStateZip.push(address.city);
      if (address.state) cityStateZip.push(address.state);
      if (address.zip || address.postalCode) {
        cityStateZip.push(address.zip || address.postalCode);
      }
      if (cityStateZip.length > 0) {
        parts.push(cityStateZip.join(', '));
      }
      return parts.join(', ') || 'No address provided';
    };

    // Get shipping status color
    const getShippingStatusColor = (status) => {
      switch (status) {
        case 'pending':
          return 'orange';
        case 'shipped':
          return 'blue';
        case 'delivered':
          return 'green';
        default:
          return 'grey';
      }
    };

    // Get shipping status label
    const getShippingStatusLabel = (status) => {
      switch (status) {
        case 'pending':
          return 'Pending Shipment';
        case 'shipped':
          return 'Shipped';
        case 'delivered':
          return 'Delivered';
        default:
          return 'Pending Shipment';
      }
    };

    // Get photo URL, filtering out blob URLs (which don't persist)
    const getPhotoUrl = (photo) => {
      if (!photo) return '';

      // Filter out blob URLs - they're temporary and won't work
      if (photo.url && photo.url.startsWith('blob:')) {
        console.warn('⚠️ Photo has blob URL (temporary, will not work):', {
          name: photo.name,
          blobUrl: photo.url,
          hasPreview: !!photo.preview,
        });
        // Try preview if available
        if (photo.preview && !photo.preview.startsWith('blob:')) {
          return photo.preview;
        }
        // Return empty to trigger error handler
        return '';
      }

      // Prefer Firebase Storage URL, fallback to preview
      if (photo.url && photo.url.startsWith('http')) {
        // Ensure URL is properly encoded (Firebase Storage URLs should already be encoded)
        try {
          const urlObj = new URL(photo.url);
          return photo.url;
        } catch (e) {
          console.warn('⚠️ Invalid URL format:', photo.url, e);
          // Try preview as fallback
          if (photo.preview && !photo.preview.startsWith('blob:')) {
            return photo.preview;
          }
          return '';
        }
      }
      if (photo.preview && !photo.preview.startsWith('blob:')) {
        return photo.preview;
      }

      return photo.url || photo.preview || '';
    };

    // Handle photo loading errors
    const handlePhotoError = (event, photo) => {
      const failedSrc = event.target.src;
      const photoName = photo?.name || 'Unknown';

      console.error('❌ Failed to load photo in CustomerOrdersPage:', {
        name: photoName,
        failedSource: failedSrc,
        photo: photo,
        isBlobUrl: failedSrc.startsWith('blob:'),
        hasUrl: !!photo?.url,
        url: photo?.url,
        hasPreview: !!photo?.preview,
      });

      // Try fallback if available
      if (
        photo?.url &&
        photo.url !== failedSrc &&
        !photo.url.startsWith('blob:')
      ) {
        console.log('⚠️ Trying fallback URL for:', photoName);
        event.target.src = photo.url;
      } else if (
        photo?.preview &&
        photo.preview !== failedSrc &&
        !photo.preview.startsWith('blob:')
      ) {
        console.log('⚠️ Trying fallback preview for:', photoName);
        event.target.src = photo.preview;
      }
      // q-img error template will show broken_image icon
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
      formatAddress,
      getShippingStatusColor,
      getShippingStatusLabel,
      getPhotoUrl,
      handlePhotoError,
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
