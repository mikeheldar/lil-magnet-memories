<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        <q-icon name="error_outline" size="32px" class="q-mr-sm" />
        Errored Transactions
      </div>
      <div class="text-subtitle1 text-grey-7">
        View failed payment and upload transactions
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="48px" color="primary" />
      <div class="text-body1 q-mt-md text-grey-7">Loading errored transactions...</div>
    </div>

    <!-- Error State -->
    <q-banner
      v-if="error && !loading"
      class="bg-red-1 text-negative q-mb-md"
      rounded
    >
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
    </q-banner>

    <!-- Transactions List -->
    <div v-if="!loading && !error">
      <q-card v-if="erroredTransactions.length === 0" class="q-pa-xl text-center">
        <q-icon name="check_circle" size="64px" color="positive" class="q-mb-md" />
        <div class="text-h6 text-grey-7">No errored transactions found</div>
        <div class="text-body2 text-grey-6 q-mt-sm">
          All transactions have been processed successfully.
        </div>
      </q-card>

      <div v-else>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            {{ erroredTransactions.length }} Errored Transaction{{ erroredTransactions.length !== 1 ? 's' : '' }}
          </div>
          <q-btn
            icon="refresh"
            label="Refresh"
            color="primary"
            outline
            @click="loadErroredTransactions"
            :loading="loading"
          />
        </div>

        <q-list separator>
          <q-item
            v-for="transaction in erroredTransactions"
            :key="transaction.id"
            class="q-pa-md"
          >
            <q-item-section>
              <q-item-label class="text-h6">
                <q-icon
                  :name="getErrorTypeIcon(transaction.errorType)"
                  :color="getErrorTypeColor(transaction.errorType)"
                  class="q-mr-sm"
                />
                {{ formatErrorType(transaction.errorType) }}
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <div class="text-weight-medium">Error Message:</div>
                    <div class="text-body2">{{ transaction.errorMessage }}</div>
                  </div>
                  <div class="col-12 col-md-6">
                    <div class="text-weight-medium">Timestamp:</div>
                    <div class="text-body2">
                      {{ formatTimestamp(transaction.createdAt || transaction.timestamp) }}
                    </div>
                  </div>
                </div>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                icon="expand_more"
                flat
                round
                @click="toggleTransactionDetails(transaction.id)"
              >
                <q-tooltip>View Details</q-tooltip>
              </q-btn>
            </q-item-section>
          </q-item>

          <!-- Expanded Details -->
          <q-expansion-item
            v-for="transaction in erroredTransactions"
            :key="`details-${transaction.id}`"
            v-model="expandedTransactions[transaction.id]"
            header-class="bg-grey-1"
          >
            <template v-slot:header>
              <q-item-section avatar>
                <q-icon
                  :name="getErrorTypeIcon(transaction.errorType)"
                  :color="getErrorTypeColor(transaction.errorType)"
                />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ formatErrorType(transaction.errorType) }}</q-item-label>
                <q-item-label caption>
                  {{ formatTimestamp(transaction.createdAt || transaction.timestamp) }}
                </q-item-label>
              </q-item-section>
            </template>

            <q-card>
              <q-card-section>
                <div class="row q-col-gutter-md">
                  <!-- Error Information -->
                  <div class="col-12 col-md-6">
                    <div class="text-h6 q-mb-sm">Error Information</div>
                    <div class="q-mb-sm">
                      <div class="text-weight-medium">Error Type:</div>
                      <div class="text-body2">{{ formatErrorType(transaction.errorType) }}</div>
                    </div>
                    <div class="q-mb-sm">
                      <div class="text-weight-medium">Error Message:</div>
                      <div class="text-body2">{{ transaction.errorMessage }}</div>
                    </div>
                    <div v-if="transaction.errorDetails" class="q-mb-sm">
                      <div class="text-weight-medium">Error Details:</div>
                      <pre class="text-body2 bg-grey-1 q-pa-sm rounded-borders" style="max-height: 200px; overflow-y: auto;">{{ JSON.stringify(transaction.errorDetails, null, 2) }}</pre>
                    </div>
                  </div>

                  <!-- Transaction Data -->
                  <div class="col-12 col-md-6">
                    <div class="text-h6 q-mb-sm">Transaction Data</div>
                    <div v-if="transaction.transactionData" class="q-mb-sm">
                      <div class="text-weight-medium">Order Number:</div>
                      <div class="text-body2">{{ transaction.transactionData.orderNumber || 'N/A' }}</div>
                    </div>
                    <div v-if="transaction.transactionData" class="q-mb-sm">
                      <div class="text-weight-medium">Amount:</div>
                      <div class="text-body2">${{ (transaction.transactionData.amount || 0).toFixed(2) }}</div>
                    </div>
                    <div v-if="transaction.transactionData" class="q-mb-sm">
                      <div class="text-weight-medium">Payment Method:</div>
                      <div class="text-body2">{{ transaction.transactionData.paymentMethod || 'N/A' }}</div>
                    </div>
                    <div v-if="transaction.transactionData" class="q-mb-sm">
                      <div class="text-weight-medium">Customer Email:</div>
                      <div class="text-body2">{{ transaction.transactionData.customerEmail || 'N/A' }}</div>
                    </div>
                    <div v-if="transaction.transactionData" class="q-mb-sm">
                      <div class="text-weight-medium">Customer Name:</div>
                      <div class="text-body2">{{ transaction.transactionData.customerName || 'N/A' }}</div>
                    </div>
                    <div v-if="transaction.transactionData?.cartItems" class="q-mb-sm">
                      <div class="text-weight-medium">Cart Items:</div>
                      <div class="text-body2">
                        <ul>
                          <li v-for="(item, index) in transaction.transactionData.cartItems" :key="index">
                            {{ item.productName }} ({{ item.quantity }}x)
                            <span v-if="item.isCustomUpload" class="text-caption text-grey-6">(Custom Upload)</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </q-list>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default {
  name: 'ErroredTransactionsPage',
  setup() {
    const $q = useQuasar();
    const loading = ref(false);
    const error = ref(null);
    const erroredTransactions = ref([]);
    const expandedTransactions = ref({});

    const loadErroredTransactions = async () => {
      // Check admin access
      if (!authService.isAdmin()) {
        error.value = 'Access denied. Admin privileges required.';
        return;
      }

      loading.value = true;
      error.value = null;

      try {
        const errorsCollection = collection(db, 'errored_transactions');
        const q = query(errorsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        erroredTransactions.value = [];
        querySnapshot.forEach((doc) => {
          erroredTransactions.value.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        console.log(`✅ Loaded ${erroredTransactions.value.length} errored transactions`);
      } catch (err) {
        console.error('Error loading errored transactions:', err);
        error.value = 'Failed to load errored transactions: ' + err.message;
      } finally {
        loading.value = false;
      }
    };

    const toggleTransactionDetails = (transactionId) => {
      expandedTransactions.value[transactionId] = !expandedTransactions.value[transactionId];
    };

    const formatErrorType = (errorType) => {
      if (!errorType) return 'Unknown Error';
      return errorType
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const getErrorTypeIcon = (errorType) => {
      if (!errorType) return 'error';
      if (errorType.includes('payment')) return 'payment';
      if (errorType.includes('upload')) return 'cloud_upload';
      if (errorType.includes('apple_pay')) return 'apple';
      return 'error';
    };

    const getErrorTypeColor = (errorType) => {
      if (!errorType) return 'negative';
      if (errorType.includes('payment')) return 'orange';
      if (errorType.includes('upload')) return 'blue';
      if (errorType.includes('apple_pay')) return 'purple';
      return 'negative';
    };

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'Unknown';
      try {
        // Handle Firestore Timestamp
        if (timestamp.toDate) {
          return timestamp.toDate().toLocaleString();
        }
        // Handle ISO string
        if (typeof timestamp === 'string') {
          return new Date(timestamp).toLocaleString();
        }
        // Handle Date object
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString();
        }
        return 'Invalid date';
      } catch (e) {
        return 'Invalid date';
      }
    };

    onMounted(() => {
      // Check admin access
      if (!authService.isAdmin()) {
        error.value = 'Access denied. Admin privileges required.';
        return;
      }
      loadErroredTransactions();
    });

    return {
      loading,
      error,
      erroredTransactions,
      expandedTransactions,
      loadErroredTransactions,
      toggleTransactionDetails,
      formatErrorType,
      getErrorTypeIcon,
      getErrorTypeColor,
      formatTimestamp,
    };
  },
};
</script>

<style scoped>
pre {
  font-size: 12px;
  line-height: 1.4;
}
</style>

