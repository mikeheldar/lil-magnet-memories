<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Order List
      </div>
      <div class="text-subtitle1 text-grey-7">
        View and manage all customer orders
      </div>

      <!-- Filter Toggles -->
      <div class="q-mt-md q-gutter-md">
        <div class="row items-center q-gutter-md justify-center">
          <q-toggle
            v-model="hideCompleted"
            label="Hide completed orders"
            color="primary"
          />
          <q-separator vertical />
          <q-btn-toggle
            v-model="orderTypeFilter"
            toggle-color="primary"
            :options="[
              { label: 'All Orders', value: 'all' },
              { label: 'Shipping', value: 'shipping', icon: 'local_shipping' },
              { label: 'Pickup', value: 'pickup', icon: 'store' },
            ]"
          />
          <q-btn
            v-if="hideCompleted"
            flat
            dense
            icon="history"
            label="View Completed Orders"
            color="grey-7"
            @click="showCompletedDialog = true"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="32px" />
      <div class="text-body2 q-mt-sm text-grey-6">Loading orders...</div>
    </div>

    <!-- Error State -->
    <q-card v-else-if="error" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 text-center text-negative">
          <q-icon name="error" size="32px" class="q-mb-sm" />
          <div>Error loading orders</div>
          <div class="text-caption q-mt-sm">{{ error }}</div>
          <q-btn
            color="primary"
            label="Retry"
            @click="loadOrders"
            class="q-mt-md"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Empty State -->
    <q-card v-else-if="orders.length === 0" class="q-pa-lg text-center">
      <q-card-section>
        <q-icon name="inventory" size="48px" class="text-primary q-mb-md" />
        <div class="text-h5 text-weight-bold text-primary q-mb-sm">
          No Orders Yet
        </div>
        <div class="text-body1 text-grey-7 q-mb-md">
          No orders have been submitted yet.
        </div>
        <div class="text-body2 text-grey-6">
          <p>New photo submissions will appear here automatically.</p>
          <p class="q-mt-sm">
            <q-btn
              flat
              color="primary"
              icon="camera_alt"
              label="Upload Photos"
              @click="$router.push('/upload')"
            />
          </p>
        </div>
      </q-card-section>
    </q-card>

    <!-- Orders List -->
    <div v-else class="q-gutter-md">
      <q-card
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
      >
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
              <q-btn-group>
                <q-btn
                  v-if="order.status === 'new'"
                  icon="play_arrow"
                  color="blue"
                  size="sm"
                  @click="updateOrderStatus(order.id, 'in_progress')"
                >
                  <q-tooltip>Start Processing</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="order.status === 'in_progress'"
                  icon="check"
                  color="green"
                  size="sm"
                  @click="updateOrderStatus(order.id, 'completed')"
                >
                  <q-tooltip>Mark Complete</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="
                    order.status === 'in_progress' ||
                    order.status === 'completed'
                  "
                  icon="undo"
                  color="orange"
                  size="sm"
                  @click="resetOrderStatus(order.id)"
                >
                  <q-tooltip>Reset to New</q-tooltip>
                </q-btn>
                <q-btn
                  icon="delete"
                  color="red"
                  size="sm"
                  @click="confirmDeleteOrder(order)"
                >
                  <q-tooltip>Delete Order</q-tooltip>
                </q-btn>
                <q-btn
                  icon="print"
                  color="purple"
                  size="sm"
                  @click="openPrintTemplate(order)"
                >
                  <q-tooltip>Print Template</q-tooltip>
                </q-btn>
              </q-btn-group>
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
                  <strong>Total Magnets:</strong>
                  {{ order.totalMagnets || getTotalMagnetsFromCart(order) }}
                </div>
                <div>
                  <strong>Order Date:</strong>
                  {{ formatDate(order.submissionDate || order.createdAt) }}
                </div>
                <div v-if="order.totalAmount">
                  <strong>Total Amount:</strong> ${{ order.totalAmount.toFixed(2) }}
                </div>
                <div v-if="order.shipping">
                  <strong>Shipping:</strong> ${{ order.shipping.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Shipping Information (for online orders) -->
          <div
            v-if="order.shippingOption && order.shippingOption.type === 'shipping'"
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
            <div v-if="order.shippingOption.address" class="q-mt-xs">
              <div>
                <strong>Address:</strong>
                {{ formatAddress(order.shippingOption.address) }}
              </div>
              <div v-if="order.shippingOption.description" class="q-mt-xs">
                <strong>Shipping Method:</strong>
                {{ order.shippingOption.description }}
              </div>
              <div v-if="order.shippingOption.estimatedTimeline" class="q-mt-xs">
                <strong>Estimated Delivery:</strong>
                {{ order.shippingOption.estimatedTimeline }}
              </div>
              <div v-if="order.shippingOption.cost" class="q-mt-xs">
                <strong>Shipping Cost:</strong> ${{ order.shippingOption.cost.toFixed(2) }}
              </div>
            </div>
            <!-- Shipping Status Controls (Admin Only) -->
            <div class="q-mt-md">
              <q-btn-group>
                <q-btn
                  v-if="!order.shippingStatus || order.shippingStatus === 'pending'"
                  icon="local_shipping"
                  color="blue"
                  size="sm"
                  label="Mark as Shipped"
                  @click="updateShippingStatus(order.id, 'shipped')"
                >
                  <q-tooltip>Mark order as shipped</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="order.shippingStatus === 'shipped'"
                  icon="check_circle"
                  color="green"
                  size="sm"
                  label="Mark as Delivered"
                  @click="updateShippingStatus(order.id, 'delivered')"
                >
                  <q-tooltip>Mark order as delivered</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered'"
                  icon="undo"
                  color="orange"
                  size="sm"
                  @click="updateShippingStatus(order.id, 'pending')"
                >
                  <q-tooltip>Reset to Pending</q-tooltip>
                </q-btn>
              </q-btn-group>
            </div>
          </div>

          <!-- Pickup Information (for market event orders) -->
          <div
            v-if="order.shippingOption && order.shippingOption.type === 'pickup'"
            class="q-mt-md q-pa-md bg-green-1 rounded-borders"
          >
            <div class="text-weight-medium text-primary q-mb-sm">
              <q-icon name="store" class="q-mr-xs" />
              Pickup Information
            </div>
            <div class="q-mt-xs">
              <div v-if="order.shippingOption.description">
                <strong>Pickup Location:</strong>
                {{ order.shippingOption.description }}
              </div>
              <div v-if="order.shippingOption.estimatedTimeline" class="q-mt-xs">
                <strong>Estimated Pickup:</strong>
                {{ order.shippingOption.estimatedTimeline }}
              </div>
            </div>
          </div>

          <!-- Payment Information -->
          <div v-if="order.paymentOption" class="q-mt-md q-pa-md bg-grey-1 rounded-borders">
            <div class="text-weight-medium text-primary q-mb-sm">
              <q-icon name="payment" class="q-mr-xs" />
              Payment Information
            </div>
            <div class="q-mt-xs">
              <div>
                <strong>Payment Method:</strong>
                {{ getPaymentMethodLabel(order.paymentOption.type) }}
              </div>
              <div v-if="order.paymentOption.status" class="q-mt-xs">
                <strong>Payment Status:</strong>
                <q-chip
                  :color="getPaymentStatusColor(order.paymentOption.status)"
                  text-color="white"
                  size="sm"
                >
                  {{ order.paymentOption.status }}
                </q-chip>
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
                    v-for="(photo, photoIndex) in (item.photos || [])"
                    :key="photoIndex"
                    class="col-6 col-sm-4 col-md-3 col-lg-2"
                  >
                    <q-img
                      :src="photo.url || photo.preview"
                      ratio="1"
                      class="rounded-borders"
                    />
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
                        {{ item.photoQuantities?.[photoIndex] || item.quantities?.[photoIndex] || 1 }}
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

    <!-- Completed Orders Dialog -->
    <q-dialog v-model="showCompletedDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Completed Orders</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <q-card
              v-for="order in completedOrders"
              :key="order.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <q-card-section>
                <div class="text-subtitle1 text-weight-bold q-mb-sm">
                  Order #{{ order.orderNumber }}
                  <q-chip
                    color="green"
                    text-color="white"
                    size="sm"
                    class="q-ml-sm"
                  >
                    {{ getDisplayStatus(order.status) }}
                  </q-chip>
                </div>
                <div class="text-caption q-mb-sm">
                  <strong>Customer:</strong> {{ order.customer.firstName }}
                  {{ order.customer.lastName }}
                </div>
                <div class="text-caption q-mb-sm">
                  <strong>Email:</strong> {{ order.customer.email }}
                </div>
                <div class="text-caption q-mb-sm">
                  <strong>Total Magnets:</strong> {{ order.totalMagnets }}
                </div>
                <div class="text-caption q-mb-sm">
                  <strong>Completed:</strong> {{ formatDate(order.updatedAt) }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { useQuasar } from 'quasar';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default {
  name: 'OrderList',
  setup() {
    const orders = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const hideCompleted = ref(false);
    const showCompletedDialog = ref(false);
    const orderTypeFilter = ref('all'); // 'all', 'shipping', 'pickup'
    const $q = useQuasar();
    const router = useRouter();
    let unsubscribeOrders = null;

    const setupRealtimeListener = () => {
      loading.value = true;
      error.value = null;

      try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('submissionDate', 'desc'));

        unsubscribeOrders = onSnapshot(
          q,
          (snapshot) => {
            const ordersList = [];
            snapshot.forEach((doc) => {
              ordersList.push({
                id: doc.id,
                ...doc.data(),
              });
            });
            orders.value = ordersList;
            loading.value = false;
            console.log('Orders updated in real-time:', ordersList.length);
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

    const loadOrders = async () => {
      // Fallback method for manual refresh
      try {
        orders.value = await firebaseService.getOrders();
      } catch (err) {
        error.value = err.message;
        console.error('Error loading orders:', err);
      }
    };

    // Computed properties for filtering
    const filteredOrders = computed(() => {
      let filtered = orders.value;

      // Filter by completion status
      if (hideCompleted.value) {
        filtered = filtered.filter((order) => order.status !== 'completed');
      }

      // Filter by order type (shipping vs pickup)
      if (orderTypeFilter.value !== 'all') {
        filtered = filtered.filter((order) => {
          const orderType = getOrderType(order);
          return orderType === orderTypeFilter.value;
        });
      }

      return filtered;
    });

    // Determine order type from shipping option
    const getOrderType = (order) => {
      if (order.shippingOption) {
        return order.shippingOption.type === 'shipping' ? 'shipping' : 'pickup';
      }
      // Legacy orders without shippingOption are assumed to be pickup/market event
      return 'pickup';
    };

    // Get total magnets from cart items
    const getTotalMagnetsFromCart = (order) => {
      if (order.totalMagnets) {
        return order.totalMagnets;
      }
      if (order.cartItems && Array.isArray(order.cartItems)) {
        return order.cartItems.reduce((total, item) => {
          if (item.photoQuantities && Array.isArray(item.photoQuantities)) {
            return total + item.photoQuantities.reduce((sum, qty) => sum + (qty || 0), 0);
          }
          return total + (item.quantity || 0);
        }, 0);
      }
      return 0;
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

    // Get payment method label
    const getPaymentMethodLabel = (paymentType) => {
      switch (paymentType) {
        case 'square_card':
          return 'Credit/Debit Card (Square)';
        case 'apple_pay':
          return 'Apple Pay';
        case 'google_pay':
          return 'Google Pay';
        case 'paypal':
          return 'PayPal';
        case 'pay_at_event':
          return 'Pay at Event';
        default:
          return paymentType || 'Unknown';
      }
    };

    // Get payment status color
    const getPaymentStatusColor = (status) => {
      switch (status?.toUpperCase()) {
        case 'COMPLETED':
        case 'PAID':
          return 'green';
        case 'PENDING':
          return 'orange';
        case 'FAILED':
          return 'red';
        default:
          return 'grey';
      }
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

    // Update shipping status
    const updateShippingStatus = async (orderId, status) => {
      try {
        await firebaseService.updateShippingStatus(orderId, status);
        
        let notificationMessage = '';
        let notificationIcon = '';

        switch (status) {
          case 'shipped':
            notificationMessage = '📦 Order marked as shipped! Customer will be notified.';
            notificationIcon = 'local_shipping';
            break;
          case 'delivered':
            notificationMessage = '✅ Order marked as delivered!';
            notificationIcon = 'check_circle';
            break;
          case 'pending':
            notificationMessage = '🔄 Shipping status reset to pending.';
            notificationIcon = 'refresh';
            break;
          default:
            notificationMessage = `Shipping status updated to ${status}`;
            notificationIcon = 'update';
        }

        try {
          $q.notify({
            type: 'positive',
            message: notificationMessage,
            icon: notificationIcon,
            position: 'top',
            timeout: 4000,
          });
        } catch (notifyError) {
          console.error('Failed to show success notification:', notifyError);
        }
      } catch (err) {
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to update shipping status',
            icon: 'error',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show error notification:', notifyError);
        }
      }
    };

    const completedOrders = computed(() => {
      return orders.value.filter((order) => order.status === 'completed');
    });

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown';
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

    const updateOrderStatus = async (orderId, status) => {
      try {
        await firebaseService.updateOrderStatus(orderId, status);
        // Don't reload orders - real-time listener handles it

        // Exciting status-specific notifications
        let notificationMessage = '';
        let notificationIcon = '';

        switch (status) {
          case 'in_progress':
            notificationMessage =
              '🎨 Order is now being crafted! Customer will be notified.';
            notificationIcon = 'build';
            break;
          case 'completed':
            notificationMessage =
              '🎊 Order completed! Customer will be excited to pick up their magnets!';
            notificationIcon = 'check_circle';
            break;
          default:
            notificationMessage = `Order status updated to ${status}`;
            notificationIcon = 'update';
        }

        try {
          $q.notify({
            type: 'positive',
            message: notificationMessage,
            icon: notificationIcon,
            position: 'top',
            timeout: 4000,
          });
        } catch (notifyError) {
          console.error('Failed to show success notification:', notifyError);
        }
      } catch (err) {
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to update order status',
            icon: 'error',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show error notification:', notifyError);
        }
      }
    };

    const resetOrderStatus = async (orderId) => {
      try {
        await firebaseService.updateOrderStatus(orderId, 'new');
        // Don't reload orders - real-time listener handles it

        try {
          $q.notify({
            type: 'positive',
            message: '✨ Order reset to new status! Customer will be notified.',
            icon: 'refresh',
            position: 'top',
            timeout: 4000,
          });
        } catch (notifyError) {
          console.error('Failed to show success notification:', notifyError);
        }
      } catch (err) {
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to reset order status',
            icon: 'error',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show error notification:', notifyError);
        }
      }
    };

    const confirmDeleteOrder = (order) => {
      $q.dialog({
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete Order #${order.orderNumber}? This action cannot be undone.`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await firebaseService.deleteOrder(order.id);
          await loadOrders(); // Reload orders
          $q.notify({
            type: 'negative',
            message: 'Order deleted successfully',
          });
        } catch (err) {
          $q.notify({
            type: 'negative',
            message: 'Failed to delete order',
          });
        }
      });
    };

    const openPrintTemplate = (order) => {
      let photos = [];
      let quantities = [];

      // Handle different order types
      if (order.photos && order.quantities) {
        // Legacy photo-based orders (UploadPage)
        photos = order.photos;
        quantities = order.quantities;
      } else if (order.cartItems && order.cartItems.length > 0) {
        // Cart-based orders - extract photos from custom upload items
        const customUploadItems = order.cartItems.filter(item => item.isCustomUpload);
        if (customUploadItems.length > 0) {
          // Extract all photos from custom upload items
          customUploadItems.forEach(item => {
            if (item.photos && item.photos.length > 0) {
              item.photos.forEach(photo => {
                photos.push(photo);
                // Use the quantity from photoQuantities
                quantities.push(photo.quantity || 1);
              });
            }
          });
        }
      }

      // Navigate to print template page with order data
      router.push({
        name: 'print-template',
        params: { orderId: order.id },
        query: {
          orderNumber: order.orderNumber,
          photos: JSON.stringify(photos),
          quantities: JSON.stringify(quantities),
        },
      });
    };

    onMounted(() => {
      setupRealtimeListener();
    });

    onUnmounted(() => {
      if (unsubscribeOrders) {
        unsubscribeOrders();
        console.log('Real-time listener unsubscribed');
      }
    });

    return {
      orders,
      loading,
      error,
      hideCompleted,
      showCompletedDialog,
      orderTypeFilter,
      filteredOrders,
      completedOrders,
      loadOrders,
      formatDate,
      getStatusColor,
      getDisplayStatus,
      updateOrderStatus,
      resetOrderStatus,
      confirmDeleteOrder,
      openPrintTemplate,
      getTotalMagnetsFromCart,
      formatAddress,
      getPaymentMethodLabel,
      getPaymentStatusColor,
      getOrderType,
      getShippingStatusColor,
      getShippingStatusLabel,
      updateShippingStatus,
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
