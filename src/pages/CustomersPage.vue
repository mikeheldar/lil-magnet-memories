<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Customer List
      </div>
      <div class="text-subtitle1 text-grey-7">
        View all customers who have placed orders
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="40px" />
      <div class="text-subtitle1 q-mt-md">Loading customers...</div>
    </div>

    <!-- Error State -->
    <q-card v-else-if="error" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 text-center text-negative">
          <q-icon name="error" size="32px" class="q-mb-sm" />
          <div>Error loading customers</div>
          <div class="text-caption q-mt-sm">{{ error }}</div>
          <q-btn
            color="primary"
            label="Retry"
            @click="loadCustomers"
            class="q-mt-md"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Empty State -->
    <q-card v-else-if="customers.length === 0" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 text-center text-grey-6">
          <q-icon name="people" size="32px" class="q-mb-sm" />
          <div>No customers yet</div>
          <div class="text-caption q-mt-sm">
            Customer information will appear here once orders are placed.
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Customers List -->
    <div v-else class="q-gutter-md">
      <q-card
        v-for="customer in customers"
        :key="customer.email"
        class="customer-card"
      >
        <q-card-section>
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-h6 text-weight-bold">
                {{ customer.firstName }} {{ customer.lastName }}
              </div>
              <div class="text-caption text-grey-7">
                Customer since {{ formatDate(customer.firstOrderDate) }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn-group>
                <q-btn
                  icon="email"
                  color="primary"
                  size="sm"
                  @click="sendEmail(customer.email)"
                >
                  <q-tooltip>Send Email</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="customer.phone"
                  icon="phone"
                  color="green"
                  size="sm"
                  @click="callPhone(customer.phone)"
                >
                  <q-tooltip>Call Phone</q-tooltip>
                </q-btn>
              </q-btn-group>
            </div>
          </div>

          <q-separator class="q-mb-md" />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-weight-medium text-primary">
                Contact Information
              </div>
              <div class="q-mt-xs">
                <div>
                  <strong>Email:</strong>
                  <a :href="`mailto:${customer.email}`" class="text-primary">{{
                    customer.email
                  }}</a>
                </div>
                <div v-if="customer.phone">
                  <strong>Phone:</strong>
                  <a :href="`tel:${customer.phone}`" class="text-primary">{{
                    customer.phone
                  }}</a>
                </div>
              </div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-weight-medium text-primary">
                Order Statistics
              </div>
              <div class="q-mt-xs">
                <div>
                  <strong>Total Orders:</strong> {{ customer.totalOrders }}
                </div>
                <div>
                  <strong>Total Magnets:</strong> {{ customer.totalMagnets }}
                </div>
                <div>
                  <strong>Last Order:</strong>
                  {{ formatDate(customer.lastOrderDate) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Orders -->
          <div class="q-mt-md" v-if="customer.recentOrders.length > 0">
            <div class="text-weight-medium text-primary q-mb-sm">
              Recent Orders
            </div>
            <div class="row q-col-gutter-sm">
              <div
                v-for="order in customer.recentOrders.slice(0, 3)"
                :key="order.id"
                class="col-12 col-sm-6 col-md-4"
              >
                <q-card flat bordered>
                  <q-card-section class="q-pa-sm">
                    <div class="text-subtitle2">
                      Order #{{ order.orderNumber }}
                    </div>
                    <div class="text-caption">
                      {{ order.totalMagnets }} magnets
                    </div>
                    <div class="text-caption text-grey-6">
                      {{ formatDate(order.submissionDate) }}
                    </div>
                    <q-chip
                      :color="getStatusColor(order.status)"
                      text-color="white"
                      size="sm"
                      class="q-mt-xs"
                    >
                      {{ order.status }}
                    </q-chip>
                  </q-card-section>
                </q-card>
              </div>
            </div>
            <div
              v-if="customer.recentOrders.length > 3"
              class="text-center q-mt-sm"
            >
              <q-btn
                flat
                dense
                color="primary"
                @click="viewAllOrders(customer)"
              >
                View all {{ customer.totalOrders }} orders
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Customer Orders Dialog -->
    <q-dialog v-model="showOrdersDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            {{ selectedCustomer?.firstName }} {{ selectedCustomer?.lastName }} -
            All Orders
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-md">
            <q-card
              v-for="order in selectedCustomer?.recentOrders"
              :key="order.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <q-card-section>
                <div class="text-subtitle1 text-weight-bold q-mb-sm">
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
                <div class="text-caption q-mb-sm">
                  <strong>Total Magnets:</strong> {{ order.totalMagnets }}
                </div>
                <div class="text-caption q-mb-sm">
                  <strong>Order Date:</strong>
                  {{ formatDate(order.submissionDate) }}
                </div>
                <div
                  v-if="order.specialInstructions"
                  class="text-caption q-mb-sm"
                >
                  <strong>Notes:</strong> {{ order.specialInstructions }}
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
import { ref, onMounted, computed } from 'vue';
import { firebaseService } from '../services/firebaseService.js';
import { useQuasar } from 'quasar';

export default {
  name: 'CustomersPage',
  setup() {
    const orders = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const showOrdersDialog = ref(false);
    const selectedCustomer = ref(null);
    const $q = useQuasar();

    const loadCustomers = async () => {
      loading.value = true;
      error.value = null;

      try {
        orders.value = await firebaseService.getOrders();
      } catch (err) {
        error.value = err.message;
        console.error('Error loading customers:', err);
      } finally {
        loading.value = false;
      }
    };

    // Group orders by customer email
    const customers = computed(() => {
      const customerMap = new Map();

      orders.value.forEach((order) => {
        const email = order.customer.email;
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
            email: order.customer.email,
            phone: order.customer.phone,
            totalOrders: 0,
            totalMagnets: 0,
            firstOrderDate: null,
            lastOrderDate: null,
            recentOrders: [],
          });
        }

        const customer = customerMap.get(email);
        customer.totalOrders++;
        customer.totalMagnets += order.totalMagnets;

        if (
          !customer.firstOrderDate ||
          order.submissionDate < customer.firstOrderDate
        ) {
          customer.firstOrderDate = order.submissionDate;
        }
        if (
          !customer.lastOrderDate ||
          order.submissionDate > customer.lastOrderDate
        ) {
          customer.lastOrderDate = order.submissionDate;
        }

        customer.recentOrders.push(order);
      });

      // Sort recent orders by date
      customerMap.forEach((customer) => {
        customer.recentOrders.sort((a, b) => {
          const dateA = a.submissionDate?.toDate
            ? a.submissionDate.toDate()
            : new Date(a.submissionDate);
          const dateB = b.submissionDate?.toDate
            ? b.submissionDate.toDate()
            : new Date(b.submissionDate);
          return dateB - dateA;
        });
      });

      // Convert to array and sort by last order date
      return Array.from(customerMap.values()).sort((a, b) => {
        const dateA = a.lastOrderDate?.toDate
          ? a.lastOrderDate.toDate()
          : new Date(a.lastOrderDate);
        const dateB = b.lastOrderDate?.toDate
          ? b.lastOrderDate.toDate()
          : new Date(b.lastOrderDate);
        return dateB - dateA;
      });
    });

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown';
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    };

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending':
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

    const sendEmail = (email) => {
      window.open(`mailto:${email}`, '_blank');
    };

    const callPhone = (phone) => {
      window.open(`tel:${phone}`, '_blank');
    };

    const viewAllOrders = (customer) => {
      selectedCustomer.value = customer;
      showOrdersDialog.value = true;
    };

    onMounted(() => {
      loadCustomers();
    });

    return {
      orders,
      loading,
      error,
      showOrdersDialog,
      selectedCustomer,
      customers,
      loadCustomers,
      formatDate,
      getStatusColor,
      sendEmail,
      callPhone,
      viewAllOrders,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.customer-card {
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}
</style>
