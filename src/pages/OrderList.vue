<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Order List
      </div>
      <div class="text-subtitle1 text-grey-7">
        View and manage all customer orders
      </div>

      <!-- Search Bar -->
      <div class="q-mt-md q-mb-md">
        <q-input
          v-model="searchQuery"
          filled
          placeholder="Search by name, email, or order #..."
          clearable
          class="max-width-600"
          style="margin: 0 auto; max-width: 600px"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <!-- Status filter tags (multi-select; default = open orders, clear = all) -->
      <div class="q-mt-md">
        <div class="row items-center justify-center q-gutter-xs status-filter-bar">
          <span class="text-caption text-weight-medium text-grey-7 q-mr-xs">
            Status
          </span>
          <q-chip
            v-for="s in ALL_STATUSES"
            :key="s.value"
            clickable
            dense
            :outline="!statusFilter.includes(s.value)"
            :color="getStatusColor(s.value)"
            :text-color="statusFilter.includes(s.value) ? 'white' : undefined"
            @click="toggleStatus(s.value)"
          >
            {{ s.label }}
            <span class="q-ml-xs text-caption">({{ statusCounts[s.value] || 0 }})</span>
          </q-chip>
          <q-separator vertical class="q-mx-sm" />
          <q-btn
            flat
            dense
            size="sm"
            label="Open"
            color="primary"
            @click="selectOpenStatuses"
          >
            <q-tooltip>Show open orders (new, paid, pending, in progress)</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            size="sm"
            :label="statusFilter.length === 0 ? 'All ✓' : 'All'"
            color="grey-8"
            @click="clearStatusFilter"
          >
            <q-tooltip>Clear the status filter — show every order</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Delivery type filter tags (multi-select; empty = all types) -->
      <div class="q-mt-sm">
        <div class="row items-center justify-center q-gutter-xs status-filter-bar">
          <span class="text-caption text-weight-medium text-grey-7 q-mr-xs">
            Type
          </span>
          <q-chip
            v-for="t in ALL_TYPES"
            :key="t.value"
            clickable
            dense
            :icon="t.icon"
            :outline="!typeFilter.includes(t.value)"
            :color="getTypeColor(t.value)"
            :text-color="typeFilter.includes(t.value) ? 'white' : undefined"
            @click="toggleType(t.value)"
          >
            {{ t.label }}
            <span class="q-ml-xs text-caption">({{ typeCounts[t.value] || 0 }})</span>
          </q-chip>
          <q-separator vertical class="q-mx-sm" />
          <q-btn
            flat
            dense
            size="sm"
            :label="typeFilter.length === 0 ? 'All ✓' : 'All'"
            color="grey-8"
            @click="clearTypeFilter"
          >
            <q-tooltip>Clear the type filter — show shipping and pickup</q-tooltip>
          </q-btn>
          <q-separator vertical class="q-mx-sm" />
          <q-toggle
            v-model="showArchived"
            label="Show archived"
            color="deep-purple"
            dense
          />
        </div>
      </div>

      <div class="text-caption text-grey-6 q-mt-sm text-center">
        Showing {{ filteredOrders.length }}
        {{ filteredOrders.length === 1 ? 'order' : 'orders' }}
        <template v-if="!showArchived"> (archived hidden)</template>
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
              @click="$router.push('/photo-upload')"
            />
          </p>
        </div>
      </q-card-section>
    </q-card>

    <!-- Orders List -->
    <div v-else class="q-gutter-md">
      <!-- Bulk selection toolbar -->
      <div class="row items-center q-gutter-sm bulk-toolbar">
        <q-btn
          flat
          dense
          icon="done_all"
          label="Select All"
          color="primary"
          @click="selectAllDisplayed"
        />
        <q-btn
          v-if="selectedOrderIds.length > 0"
          flat
          dense
          icon="remove_done"
          label="Clear All"
          color="grey-8"
          @click="clearSelection"
        />
        <template v-if="selectedOrderIds.length > 0">
          <div class="text-body2 text-weight-medium text-grey-8 q-ml-sm">
            {{ selectedOrderIds.length }} selected
          </div>
          <q-btn
            icon="archive"
            color="deep-purple"
            size="sm"
            @click="bulkArchiveSelected"
          >
            <q-tooltip>Archive Selected (marks completed, no emails)</q-tooltip>
          </q-btn>
          <q-btn
            icon="delete"
            color="red"
            size="sm"
            @click="confirmBulkDelete"
          >
            <q-tooltip>Delete Selected</q-tooltip>
          </q-btn>
        </template>
        <q-space />
        <q-btn-dropdown
          flat
          dense
          icon="cleaning_services"
          label="Cleanup"
          color="teal"
          :loading="reconciling || reconcilingShipped || archivingUndated"
        >
          <q-list style="min-width: 320px">
            <q-item
              v-close-popup
              clickable
              :disable="reconciling"
              @click="reconcileArchivedStatuses"
            >
              <q-item-section avatar>
                <q-icon name="cleaning_services" color="teal" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Fix archived statuses</q-item-label>
                <q-item-label caption>
                  Stamp archived-but-open orders completed, so the daily reminder
                  and sales dashboard stop counting them open. No customer emails
                  sent.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item
              v-close-popup
              clickable
              :disable="reconcilingShipped"
              @click="reconcileShippedStatuses"
            >
              <q-item-section avatar>
                <q-icon name="local_shipping" color="teal" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Fix shipped statuses</q-item-label>
                <q-item-label caption>
                  Stamp shipped/delivered-but-open orders completed — they were
                  fulfilled but never marked complete, so the reminder and list
                  still counted them open. No customer emails sent.
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-separator />
            <q-item
              v-close-popup
              clickable
              :disable="archivingUndated"
              @click="archiveUndatedOrders"
            >
              <q-item-section avatar>
                <q-icon name="event_busy" color="teal" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Archive undated orders</q-item-label>
                <q-item-label caption>
                  Archive old orders whose date can't be recovered from the order
                  number or a stored date field. Removes them from the open view;
                  no customer emails sent.
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

      <q-card
        v-for="order in filteredOrders"
        :key="order.id"
        class="order-card"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col-auto q-mr-sm">
              <q-checkbox
                :model-value="isSelected(order.id)"
                @update:model-value="(val) => setSelected(order.id, val)"
                color="primary"
              />
            </div>
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
              <div class="action-buttons">
                <q-btn
                  v-if="order.status === 'new' || order.status === 'paid'"
                  icon="play_arrow"
                  color="blue"
                  size="sm"
                  @click.stop.prevent="updateOrderStatus(order.id, 'in_progress')"
                >
                  <q-tooltip>Start Processing</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="order.status === 'in_progress'"
                  icon="check"
                  color="green"
                  size="sm"
                  @click.stop.prevent="updateOrderStatus(order.id, 'completed')"
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
                  @click.stop.prevent="resetOrderStatus(order.id)"
                >
                  <q-tooltip>Reset to New</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="!order.archived"
                  icon="archive"
                  color="deep-purple"
                  size="sm"
                  @click.stop.prevent="setOrderArchived(order.id, true)"
                >
                  <q-tooltip>Archive Order</q-tooltip>
                </q-btn>
                <q-btn
                  v-else
                  icon="unarchive"
                  color="teal"
                  size="sm"
                  @click.stop.prevent="setOrderArchived(order.id, false)"
                >
                  <q-tooltip>Unarchive Order</q-tooltip>
                </q-btn>
                <q-btn
                  icon="delete"
                  color="red"
                  size="sm"
                  @click.stop.prevent="confirmDeleteOrder(order)"
                >
                  <q-tooltip>Delete Order</q-tooltip>
                </q-btn>
                <q-btn
                  icon="print"
                  color="primary"
                  size="sm"
                  @click.stop.prevent="openPrintTemplate(order)"
                >
                  <q-tooltip>Print Template</q-tooltip>
                </q-btn>
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
                <div v-if="getSpecialInstructions(order)">
                  <strong>Special Instructions:</strong>
                  <div class="text-grey-7 q-mt-xs">
                    {{ getSpecialInstructions(order) }}
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
                  {{ formatOrderDate(order) }}
                </div>
                <div v-if="order.totalAmount">
                  <strong>Total Amount:</strong> ${{
                    order.totalAmount.toFixed(2)
                  }}
                </div>
                <div v-if="order.shipping">
                  <strong>Shipping:</strong> ${{ order.shipping.toFixed(2) }}
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
            <!-- Shipping Status Controls (Admin Only) -->
            <div class="q-mt-md">
              <div class="action-buttons">
                <q-btn
                  v-if="
                    !order.shippingStatus || order.shippingStatus === 'pending'
                  "
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
                  v-if="
                    order.shippingStatus === 'shipped' ||
                    order.shippingStatus === 'delivered'
                  "
                  icon="undo"
                  color="orange"
                  size="sm"
                  @click="updateShippingStatus(order.id, 'pending')"
                >
                  <q-tooltip>Reset to Pending</q-tooltip>
                </q-btn>
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

          <!-- Payment Information -->
          <div
            v-if="order.paymentOption"
            class="q-mt-md q-pa-md bg-grey-1 rounded-borders"
          >
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
                <q-img
                  :src="getPhotoUrl(photo, order, index)"
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
                      :src="getPhotoUrl(photo, order, photoIndex)"
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
import { isOrderFulfilled } from '../utils/orderStatus.js';
import { useQuasar, useMeta } from 'quasar';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { config } from '../config/environment.js';

export default {
  name: 'OrderList',
  setup() {
    useMeta({
      title: 'Order Management - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Admin interface for managing customer orders, tracking order status, and processing fulfillment.'
        },
        robots: {
          name: 'robots',
          content: 'noindex, nofollow'
        }
      }
    });

    // Canonical order statuses shown as filter tags. Order matters (display order).
    const ALL_STATUSES = [
      { value: 'new', label: 'New' },
      { value: 'paid', label: 'Paid' },
      { value: 'pending_payment', label: 'Pending Payment' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];
    // "Open" = not yet fulfilled. These are the tags selected by default.
    const OPEN_STATUS_VALUES = ['new', 'paid', 'pending_payment', 'in_progress'];

    // Delivery type tags (multi-select; empty selection = show all types).
    const ALL_TYPES = [
      { value: 'shipping', label: 'Shipping', icon: 'local_shipping' },
      { value: 'pickup', label: 'Pickup', icon: 'store' },
    ];

    const orders = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showArchived = ref(false);
    // Multi-select delivery type filter. Empty array = no type filter (show ALL).
    const typeFilter = ref([]);
    // Multi-select status filter. Empty array = no status filter (show ALL).
    const statusFilter = ref([...OPEN_STATUS_VALUES]);
    const searchQuery = ref('');
    const $q = useQuasar();
    const router = useRouter();
    let unsubscribeOrders = null;

    const setupRealtimeListener = () => {
      loading.value = true;
      error.value = null;

      try {
        const ordersRef = collection(db, 'orders');
        // IMPORTANT: do NOT use Firestore orderBy() here. orderBy silently EXCLUDES
        // any document missing the sort field, so older orders without
        // submissionDateClient (e.g. LMM-251207-8682) never load and become
        // invisible in the admin list — no search or toggle can surface them,
        // yet the daily reminder still flags them. Load the whole collection and
        // let the client-side sort below (which handles missing dates) order it.
        const q = query(ordersRef);

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

            // Sort by submissionDateClient (most recent first), handling missing/invalid dates
            ordersList.sort((a, b) => {
              // Effective date (stored field, else recovered from order #);
              // 0 sorts undated orders to the bottom.
              const getDateValue = (order) => getEffectiveOrderDate(order).ms || 0;
              const dateA = getDateValue(a);
              const dateB = getDateValue(b);
              // Sort descending (newest first): larger date (b) - smaller date (a) = positive, so b comes first
              // If both dates are 0 (invalid), maintain original order
              if (dateA === 0 && dateB === 0) return 0;
              // If one is invalid (0), put it at the bottom
              if (dateA === 0) return 1; // a goes after b
              if (dateB === 0) return -1; // b goes after a
              // Both valid: sort descending
              return dateB - dateA;
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

      // Filter by search query (name, email, or order number)
      if (searchQuery.value && searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        // Strip a leading '#' so "#1042" and "1042" both match the order number
        const orderNumberQuery = query.replace(/^#/, '');
        filtered = filtered.filter((order) => {
          const customer = order.customer || {};
          const firstName = (customer.firstName || '').toLowerCase();
          const lastName = (customer.lastName || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();
          const email = (customer.email || '').toLowerCase();
          const orderNumber = String(order.orderNumber || '').toLowerCase();

          return (
            fullName.includes(query) ||
            firstName.includes(query) ||
            lastName.includes(query) ||
            email.includes(query) ||
            orderNumber.includes(orderNumberQuery)
          );
        });
      }

      // Filter by status tags (empty selection = show all statuses).
      // Uses effective status so a paid-but-already-shipped order counts as
      // completed and never leaks back into the default "open" view.
      if (statusFilter.value.length > 0) {
        filtered = filtered.filter((order) =>
          statusFilter.value.includes(getEffectiveStatus(order))
        );
      }

      // Archive visibility (default hide archived)
      if (!showArchived.value) {
        filtered = filtered.filter((order) => !order.archived);
      }

      // Filter by delivery type (empty selection = show all types)
      if (typeFilter.value.length > 0) {
        filtered = filtered.filter((order) =>
          typeFilter.value.includes(getOrderType(order))
        );
      }

      // Ensure filtered results are sorted by submissionDateClient (most recent first)
      filtered.sort((a, b) => {
        // Effective date (stored field, else recovered from order #);
        // 0 sorts undated orders to the bottom.
        const getDateValue = (order) => getEffectiveOrderDate(order).ms || 0;
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
            return (
              total +
              item.photoQuantities.reduce((sum, qty) => sum + (qty || 0), 0)
            );
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
            notificationMessage =
              '📦 Order marked as shipped! Customer will be notified.';
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

    // Effective status for filtering/counting: a fulfilled order (completed OR
    // already shipped/delivered) is treated as 'completed' regardless of a stale
    // status field, so the shipping/status split can't hide fulfilled orders in
    // the "open" view. Everything else keeps its own status.
    const getEffectiveStatus = (order) => {
      if (isOrderFulfilled(order)) return 'completed';
      return order?.status || 'new';
    };

    // Live count per status tag (respects the archived toggle so the numbers
    // match what the list would actually show).
    const statusCounts = computed(() => {
      const counts = {};
      for (const order of orders.value) {
        if (!showArchived.value && order.archived) continue;
        const s = getEffectiveStatus(order);
        counts[s] = (counts[s] || 0) + 1;
      }
      return counts;
    });

    const toggleStatus = (value) => {
      const idx = statusFilter.value.indexOf(value);
      if (idx === -1) {
        statusFilter.value.push(value);
      } else {
        statusFilter.value.splice(idx, 1);
      }
    };

    const selectOpenStatuses = () => {
      statusFilter.value = [...OPEN_STATUS_VALUES];
    };

    const clearStatusFilter = () => {
      statusFilter.value = [];
    };

    // Live count per delivery-type tag (respects the archived toggle so the
    // numbers match what the list would actually show).
    const typeCounts = computed(() => {
      const counts = {};
      for (const order of orders.value) {
        if (!showArchived.value && order.archived) continue;
        const t = getOrderType(order);
        counts[t] = (counts[t] || 0) + 1;
      }
      return counts;
    });

    const getTypeColor = (type) => (type === 'shipping' ? 'blue' : 'green');

    const toggleType = (value) => {
      const idx = typeFilter.value.indexOf(value);
      if (idx === -1) {
        typeFilter.value.push(value);
      } else {
        typeFilter.value.splice(idx, 1);
      }
    };

    const clearTypeFilter = () => {
      typeFilter.value = [];
    };

    // --- Order date recovery -------------------------------------------------
    // Some old orders were written before the date fields worked and show
    // "Order Date: N/A". The order NUMBER encodes the date though —
    // LMM-251207-8682 -> 2025-12-07 — so we can recover most of them. This is
    // display/sort only; no data is written.
    const toMs = (val) => {
      if (val === null || val === undefined) return null;
      try {
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (typeof val === 'number') return val > 0 ? val : null;
        if (val instanceof Date)
          return isNaN(val.getTime()) ? null : val.getTime();
        if (typeof val === 'object' && 'seconds' in val)
          return val.seconds * 1000 + (val.nanoseconds || 0) / 1000000;
        if (typeof val === 'string') {
          const t = new Date(val).getTime();
          return isNaN(t) ? null : t;
        }
      } catch {
        return null;
      }
      return null;
    };

    // Parse the YYMMDD block out of an order number (LMM-251207-8682).
    const parseDateFromOrderNumber = (orderNumber) => {
      if (!orderNumber) return null;
      const m = String(orderNumber).match(/(\d{2})(\d{2})(\d{2})/);
      if (!m) return null;
      const yy = +m[1];
      const mm = +m[2];
      const dd = +m[3];
      if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
      const d = new Date(2000 + yy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d.getTime();
    };

    // Resolve an order's effective date: explicit fields first, then the date
    // embedded in the order number. Returns { ms, source }.
    const getEffectiveOrderDate = (order) => {
      if (!order) return { ms: null, source: null };
      const fields = [
        'submissionDateClient',
        'submissionDate',
        'createdAtClient',
        'createdAt',
        'orderDate',
        'date',
      ];
      for (const f of fields) {
        const ms = toMs(order[f]);
        if (ms) return { ms, source: 'field' };
      }
      const fromNum = parseDateFromOrderNumber(order.orderNumber);
      if (fromNum) return { ms: fromNum, source: 'orderNumber' };
      return { ms: null, source: null };
    };

    // Display string for an order's date, with a hint when it was recovered
    // from the order number rather than a stored date field.
    const formatOrderDate = (order) => {
      const { ms, source } = getEffectiveOrderDate(order);
      if (!ms) return 'N/A';
      if (source === 'orderNumber') {
        return `${new Date(ms).toLocaleDateString()} (from order #)`;
      }
      return new Date(ms).toLocaleString();
    };

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
        case 'paid':
          return 'blue';
        case 'pending_payment':
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
        case 'paid':
          return 'paid';
        case 'pending_payment':
          return 'pending payment';
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

    // Get special instructions from order (check all possible locations)
    const getSpecialInstructions = (order) => {
      // Check order-level specialInstructions first
      if (order.specialInstructions) {
        return order.specialInstructions;
      }
      // Check customer-level specialInstructions
      if (order.customer && order.customer.specialInstructions) {
        return order.customer.specialInstructions;
      }
      // Check cartItems for specialInstructions
      if (order.cartItems && Array.isArray(order.cartItems)) {
        const itemWithInstructions = order.cartItems.find(
          (item) => item.specialInstructions
        );
        if (itemWithInstructions && itemWithInstructions.specialInstructions) {
          return itemWithInstructions.specialInstructions;
        }
      }
      // Check photos array (for photo upload orders)
      if (order.photos && Array.isArray(order.photos)) {
        // Photos might have specialInstructions in metadata
        const photoWithInstructions = order.photos.find(
          (photo) => photo.specialInstructions
        );
        if (photoWithInstructions && photoWithInstructions.specialInstructions) {
          return photoWithInstructions.specialInstructions;
        }
      }
      return null;
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
          $q.notify({
            type: 'positive',
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

    const setOrderArchived = async (orderId, archived) => {
      try {
        await firebaseService.setOrderArchived(orderId, archived);
        $q.notify({
          type: 'positive',
          message: archived
            ? 'Order archived & marked completed (no email sent)'
            : 'Order unarchived',
          icon: archived ? 'archive' : 'unarchive',
          position: 'top',
        });
      } catch (err) {
        $q.notify({
          type: 'negative',
          message: archived ? 'Failed to archive order' : 'Failed to unarchive order',
          icon: 'error',
          position: 'top',
        });
      }
    };

    // --- Multi-select / bulk actions ---
    const selectedOrderIds = ref([]);

    const isSelected = (orderId) => selectedOrderIds.value.includes(orderId);

    const setSelected = (orderId, val) => {
      if (val) {
        if (!selectedOrderIds.value.includes(orderId)) {
          selectedOrderIds.value.push(orderId);
        }
      } else {
        selectedOrderIds.value = selectedOrderIds.value.filter(
          (id) => id !== orderId
        );
      }
    };

    // Selects exactly what's displayed, so an active search/filter scopes it
    const selectAllDisplayed = () => {
      selectedOrderIds.value = filteredOrders.value.map((o) => o.id);
    };

    const clearSelection = () => {
      selectedOrderIds.value = [];
    };

    const bulkArchiveSelected = async () => {
      const ids = [...selectedOrderIds.value];
      let ok = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          await firebaseService.setOrderArchived(id, true);
          ok++;
          setSelected(id, false);
        } catch (err) {
          failed++;
          console.error('Bulk archive failed for order', id, err);
        }
      }
      $q.notify({
        type: failed ? 'warning' : 'positive',
        message: failed
          ? `Archived ${ok} order(s), ${failed} failed`
          : `Archived ${ok} order(s) — marked completed, no emails sent`,
        icon: 'archive',
        position: 'top',
      });
    };

    const confirmBulkDelete = () => {
      const count = selectedOrderIds.value.length;
      $q.dialog({
        title: 'Confirm Deletion',
        message: `Are you sure you want to delete ${count} selected order(s)? This action cannot be undone.`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        const ids = [...selectedOrderIds.value];
        let ok = 0;
        let failed = 0;
        for (const id of ids) {
          try {
            await firebaseService.deleteOrder(id);
            ok++;
            setSelected(id, false);
          } catch (err) {
            failed++;
            console.error('Bulk delete failed for order', id, err);
          }
        }
        $q.notify({
          type: failed ? 'warning' : 'positive',
          message: failed
            ? `Deleted ${ok} order(s), ${failed} failed`
            : `Deleted ${ok} order(s)`,
          icon: 'delete',
          position: 'top',
        });
      });
    };

    // --- Data hygiene: fix archived orders stuck on an open status ---
    // Orders archived before archiving began stamping status='completed' stay
    // hidden from the list but are still counted "open" by the daily reminder
    // and the sales dashboard. One-tap reconcile stamps them completed (no email).
    const reconciling = ref(false);

    const reconcileArchivedStatuses = async () => {
      if (reconciling.value) return;
      reconciling.value = true;
      try {
        const preview = await firebaseService.reconcileArchivedOrderStatuses({
          dryRun: true,
        });
        if (preview.stale === 0) {
          $q.notify({
            type: 'positive',
            message: `All ${preview.scanned} orders are consistent — no archived-but-open orders to fix.`,
            icon: 'verified',
            position: 'top',
          });
          reconciling.value = false;
          return;
        }
        $q.dialog({
          title: 'Fix archived order statuses',
          message: `${preview.stale} archived order(s) still carry an open status (new/paid/in_progress). They stay hidden from this list but are still counted as "open" by the daily reminder email and the sales dashboard. Stamp them completed now? No customer emails are sent.`,
          cancel: true,
          persistent: true,
          ok: { label: `Fix ${preview.stale}`, color: 'teal' },
        })
          .onOk(async () => {
            try {
              const res = await firebaseService.reconcileArchivedOrderStatuses();
              $q.notify({
                type: 'positive',
                message: `Fixed ${res.fixed} archived order(s) — stamped completed, no emails sent.`,
                icon: 'verified',
                position: 'top',
              });
              await loadOrders();
            } catch (err) {
              console.error('Reconcile failed:', err);
              $q.notify({
                type: 'negative',
                message: `Reconcile failed: ${err.message}`,
                position: 'top',
              });
            } finally {
              reconciling.value = false;
            }
          })
          .onCancel(() => {
            reconciling.value = false;
          });
      } catch (err) {
        console.error('Reconcile preview failed:', err);
        $q.notify({
          type: 'negative',
          message: `Could not scan orders: ${err.message}`,
          position: 'top',
        });
        reconciling.value = false;
      }
    };

    // --- Data hygiene: fix shipped/delivered orders stuck on an open status ---
    // "Mark as Shipped/Delivered" sets shippingStatus but never advances status,
    // so a long-shipped order can read status='paid'. That's what kept the daily
    // reminder over-counting (fixed in functions) and clutters the active list.
    // One-tap reconcile stamps them completed (direct write, no customer email).
    const reconcilingShipped = ref(false);

    const reconcileShippedStatuses = async () => {
      if (reconcilingShipped.value) return;
      reconcilingShipped.value = true;
      try {
        const preview = await firebaseService.reconcileShippedOrderStatuses({
          dryRun: true,
        });
        if (preview.stale === 0) {
          $q.notify({
            type: 'positive',
            message: `All ${preview.scanned} orders are consistent — no shipped-but-open orders to fix.`,
            icon: 'verified',
            position: 'top',
          });
          reconcilingShipped.value = false;
          return;
        }
        $q.dialog({
          title: 'Fix shipped order statuses',
          message: `${preview.stale} order(s) are marked shipped/delivered but still carry an open status (new/paid/in_progress). They're fulfilled, but the daily reminder email and the active list still count them as open. Stamp them completed now? No customer emails are sent.`,
          cancel: true,
          persistent: true,
          ok: { label: `Fix ${preview.stale}`, color: 'teal' },
        })
          .onOk(async () => {
            try {
              const res = await firebaseService.reconcileShippedOrderStatuses();
              $q.notify({
                type: 'positive',
                message: `Fixed ${res.fixed} shipped order(s) — stamped completed, no emails sent.`,
                icon: 'verified',
                position: 'top',
              });
              await loadOrders();
            } catch (err) {
              console.error('Shipped reconcile failed:', err);
              $q.notify({
                type: 'negative',
                message: `Reconcile failed: ${err.message}`,
                position: 'top',
              });
            } finally {
              reconcilingShipped.value = false;
            }
          })
          .onCancel(() => {
            reconcilingShipped.value = false;
          });
      } catch (err) {
        console.error('Shipped reconcile preview failed:', err);
        $q.notify({
          type: 'negative',
          message: `Could not scan orders: ${err.message}`,
          position: 'top',
        });
        reconcilingShipped.value = false;
      }
    };

    // --- Data hygiene: archive orders with an unrecoverable date ---
    // After date recovery (stored fields + order-number parse), a few very old
    // orders may still have no date at all. This archives ONLY those leftovers
    // so they leave the open view. Same dry-run preview -> confirm flow.
    const archivingUndated = ref(false);

    const archiveUndatedOrders = async () => {
      if (archivingUndated.value) return;
      archivingUndated.value = true;
      try {
        const preview = await firebaseService.archiveUndatedOrders({
          dryRun: true,
        });
        if (preview.stale === 0) {
          $q.notify({
            type: 'positive',
            message: `All ${preview.scanned} orders have a recoverable date — nothing to archive.`,
            icon: 'verified',
            position: 'top',
          });
          archivingUndated.value = false;
          return;
        }
        $q.dialog({
          title: 'Archive undated orders',
          message: `${preview.stale} order(s) have no date that can be recovered from a stored field or the order number. Archive them now? They'll leave the open view and stop being counted open by the reminder and dashboard. No customer emails are sent.`,
          cancel: true,
          persistent: true,
          ok: { label: `Archive ${preview.stale}`, color: 'teal' },
        })
          .onOk(async () => {
            try {
              const res = await firebaseService.archiveUndatedOrders();
              $q.notify({
                type: 'positive',
                message: `Archived ${res.fixed} undated order(s) — no emails sent.`,
                icon: 'verified',
                position: 'top',
              });
              await loadOrders();
            } catch (err) {
              console.error('Archive undated failed:', err);
              $q.notify({
                type: 'negative',
                message: `Archive failed: ${err.message}`,
                position: 'top',
              });
            } finally {
              archivingUndated.value = false;
            }
          })
          .onCancel(() => {
            archivingUndated.value = false;
          });
      } catch (err) {
        console.error('Archive undated preview failed:', err);
        $q.notify({
          type: 'negative',
          message: `Could not scan orders: ${err.message}`,
          position: 'top',
        });
        archivingUndated.value = false;
      }
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
        const customUploadItems = order.cartItems.filter(
          (item) => item.isCustomUpload
        );
        if (customUploadItems.length > 0) {
          // Extract all photos from custom upload items
          customUploadItems.forEach((item) => {
            if (item.photos && item.photos.length > 0) {
              item.photos.forEach((photo, photoIndex) => {
                photos.push(photo);
                // Use the quantity from photoQuantities array (indexed by photoIndex)
                // Fallback to photo.quantity, then item.quantities, then 1
                const quantity =
                  item.photoQuantities?.[photoIndex] ||
                  photo.quantity ||
                  item.quantities?.[photoIndex] ||
                  1;
                quantities.push(quantity);
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

    // Check and convert WebP photos in orders (test environment only)
    // NOTE: Disabled automatic conversion for existing orders due to browser compatibility issues
    // Conversion still works for new uploads. For existing orders, conversion would need
    // to be done server-side or with a different approach.
    const checkAndConvertWebP = async (order, photoIndex, photo) => {
      // Disabled - browser can't decode WebP from blob URLs reliably
      // Conversion still happens on upload, which works fine
      return;

      // Original code kept for reference:
      // if (!config.isTest) return;
      // const isWebP = photo.url && (photo.url.includes('.webp') || photo.type === 'image/webp');
      // if (isWebP && !photo.convertedFromWebP) {
      //   // Only convert once - check if already converting
      //   if (photo._converting) return;
      //   photo._converting = true;
      //   try {
      //     const result = await firebaseService.convertWebPPhotoInOrder(order.id, photoIndex, photo);
      //     if (result) {
      //       console.log(`Successfully converted WebP photo ${photoIndex} in order ${order.id}`);
      //     }
      //   } catch (error) {
      //     console.warn('Failed to convert WebP photo (non-critical):', error);
      //   } finally {
      //     photo._converting = false;
      //   }
      // }
    };

    // Extract storage path from Firebase Storage URL
    const extractStoragePath = (url) => {
      try {
        const urlObj = new URL(url);
        // Firebase Storage URLs have format: /v0/b/{bucket}/o/{path}?alt=media&token=...
        // The path is URL-encoded, so we need to decode it
        const match = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          // Decode the path (handles %2F for slashes, etc.)
          const decodedPath = decodeURIComponent(match[1]);
          return decodedPath;
        }
      } catch (e) {
        console.warn('Failed to extract path from URL:', url, e);
      }
      return null;
    };

    // Refresh expired Firebase Storage URL
    const refreshPhotoUrl = async (photo) => {
      try {
        // Try to get path from photo.fullPath first, then extract from URL
        let path = photo.fullPath;
        if (!path && photo.url) {
          path = extractStoragePath(photo.url);
        }

        if (!path) {
          console.warn('⚠️ Cannot refresh URL: no path available for photo:', photo?.name);
          return null;
        }

        // Ensure storage is initialized by getting the instance
        const { getStorage: getStorageInstance } = await import('firebase/storage');
        const { default: getApp } = await import('../firebase/config.js');
        const storageInstance = getStorageInstance(getApp());
        
        // Get fresh download URL from Firebase Storage
        const fileRef = storageRef(storageInstance, path);
        
        if (!fileRef) {
          console.error('❌ Failed to create storage reference for path:', path);
          return null;
        }
        
        const freshUrl = await getDownloadURL(fileRef);
        
        console.log('✅ Refreshed URL for photo:', photo?.name);
        return freshUrl;
      } catch (error) {
        console.error('❌ Failed to refresh URL for photo:', photo?.name, error);
        if (error.code) {
          console.error('Error code:', error.code);
        }
        return null;
      }
    };

    // Get photo URL, filtering out blob URLs (which don't persist)
    const getPhotoUrl = (photo, order = null, photoIndex = null) => {
      if (!photo) return '';

      // Check and convert WebP in test environment
      if (config.isTest && order && photoIndex !== null) {
        checkAndConvertWebP(order, photoIndex, photo);
      }

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
        // But check if it needs re-encoding for special characters
        try {
          // Try to decode and re-encode to ensure proper encoding
          const urlObj = new URL(photo.url);
          // If the pathname has special characters, they should already be encoded by Firebase
          // But we can verify the URL is valid
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
    const handlePhotoError = async (event, photo) => {
      const failedSrc = event.target.src;
      const photoName = photo?.name || 'Unknown';

      // Extract full path from URL for debugging
      let fullPath = failedSrc;
      try {
        const urlObj = new URL(failedSrc);
        fullPath = urlObj.pathname + urlObj.search;
      } catch (e) {
        // Not a valid URL, use as-is
      }

      console.error('❌ Failed to load photo in OrderList:', {
        name: photoName,
        failedSource: failedSrc,
        fullPath: fullPath,
        photo: photo,
        isBlobUrl: failedSrc.startsWith('blob:'),
        hasUrl: !!photo?.url,
        url: photo?.url,
        urlLength: photo?.url?.length || 0,
        hasPreview: !!photo?.preview,
        previewType: photo?.preview
          ? photo.preview.substring(0, 50) + '...'
          : 'none',
        fileName: photo?.fileName || 'unknown',
      });

      // Log the exact filename that's causing issues
      if (photoName.includes('78286856707') || photoName.includes('HEIC')) {
        console.error('🔍 DEBUGGING SPECIFIC FILE:', {
          originalName: photoName,
          storedUrl: photo?.url,
          storedFileName: photo?.fileName,
          fullPhotoObject: JSON.stringify(photo, null, 2),
        });
      }

      // Try to refresh expired Firebase Storage URL first
      if (failedSrc && failedSrc.includes('firebasestorage.googleapis.com')) {
        const freshUrl = await refreshPhotoUrl(photo);
        if (freshUrl && event.target) {
          event.target.src = freshUrl;
          return; // Successfully refreshed, exit early
        }
      }

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
      showArchived,
      searchQuery,
      ALL_STATUSES,
      statusFilter,
      statusCounts,
      toggleStatus,
      selectOpenStatuses,
      clearStatusFilter,
      ALL_TYPES,
      typeFilter,
      typeCounts,
      getTypeColor,
      toggleType,
      clearTypeFilter,
      filteredOrders,
      loadOrders,
      formatDate,
      getStatusColor,
      getDisplayStatus,
      updateOrderStatus,
      resetOrderStatus,
      confirmDeleteOrder,
      setOrderArchived,
      selectedOrderIds,
      isSelected,
      setSelected,
      selectAllDisplayed,
      clearSelection,
      bulkArchiveSelected,
      confirmBulkDelete,
      reconciling,
      reconcileArchivedStatuses,
      reconcilingShipped,
      reconcileShippedStatuses,
      archivingUndated,
      archiveUndatedOrders,
      formatOrderDate,
      openPrintTemplate,
      getTotalMagnetsFromCart,
      formatAddress,
      getPaymentMethodLabel,
      getPaymentStatusColor,
      getOrderType,
      getShippingStatusColor,
      getShippingStatusLabel,
      updateShippingStatus,
      getPhotoUrl,
      handlePhotoError,
      getSpecialInstructions,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  // Use same plaid background as main page - inherited from .q-page-container
  background: transparent;
  min-height: 100vh;
}

.order-card {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
</style>
