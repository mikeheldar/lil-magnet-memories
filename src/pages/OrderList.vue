<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Order List
      </div>
      <div class="text-subtitle1 text-grey-7">
        View and manage all customer orders
      </div>

      <!-- Filter Toggle -->
      <div class="q-mt-md">
        <q-toggle
          v-model="hideCompleted"
          label="Hide completed orders"
          color="primary"
        />
        <q-btn
          v-if="hideCompleted"
          flat
          dense
          icon="history"
          label="View Completed Orders"
          color="grey-7"
          @click="showCompletedDialog = true"
          class="q-ml-md"
        />
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
      if (hideCompleted.value) {
        return orders.value.filter((order) => order.status !== 'completed');
      }
      return orders.value;
    });

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
      // Navigate to print template page with order data
      router.push({
        name: 'print-template',
        params: { orderId: order.id },
        query: {
          orderNumber: order.orderNumber,
          photos: JSON.stringify(order.photos),
          quantities: JSON.stringify(order.quantities),
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
