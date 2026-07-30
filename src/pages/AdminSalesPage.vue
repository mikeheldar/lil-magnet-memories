<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        <q-icon name="monitoring" size="32px" class="q-mr-sm" />
        Sales Dashboard
      </div>
      <div class="text-subtitle1 text-grey-7">
        Revenue, orders, and top products from your store
      </div>
    </div>

    <q-banner v-if="loadError" class="bg-negative text-white q-mb-md" rounded>
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ loadError }}
    </q-banner>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-col-gutter-md">
          <div class="col-auto">
            <q-btn-toggle
              v-model="period"
              :options="periodOptions"
              toggle-color="primary"
              unelevated
              rounded
              dense
              class="period-toggle"
            />
          </div>
          <div class="col-auto">
            <q-toggle
              v-model="includeArchived"
              label="Include archived"
              dense
            />
          </div>
          <q-space />
          <div class="col-auto">
            <q-btn
              color="grey-7"
              icon="refresh"
              label="Refresh"
              flat
              :loading="loading"
              @click="loadOrders"
            />
            <q-btn
              color="primary"
              icon="download"
              label="Export CSV"
              class="q-ml-sm"
              :disable="periodOrders.length === 0"
              @click="exportCsv"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- KPI cards -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="kpi in kpis"
        :key="kpi.label"
        class="col-6 col-md-3"
      >
        <q-card class="kpi-card full-height">
          <q-card-section>
            <div class="text-caption text-grey-7 text-uppercase">
              {{ kpi.label }}
            </div>
            <div class="text-h5 text-weight-bold q-mt-xs">{{ kpi.value }}</div>
            <div
              v-if="kpi.delta !== null"
              class="text-caption q-mt-xs"
              :class="kpi.delta >= 0 ? 'text-positive' : 'text-negative'"
            >
              <q-icon
                :name="kpi.delta >= 0 ? 'trending_up' : 'trending_down'"
                size="14px"
              />
              {{ kpi.delta >= 0 ? '+' : '' }}{{ kpi.delta.toFixed(0) }}% vs
              prior {{ periodDays }}d
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Revenue chart -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="bar_chart" class="q-mr-sm" />
          Revenue {{ bucketUnitLabel }}
        </div>
        <div v-if="buckets.length === 0" class="text-grey-6 text-center q-pa-lg">
          No orders in this period
        </div>
        <div v-else>
          <div class="chart-bars">
            <div
              v-for="(b, i) in buckets"
              :key="i"
              class="chart-bar-col"
              :title="b.label + ': $' + b.revenue.toFixed(2) + ' (' + b.orders + ' order' + (b.orders === 1 ? '' : 's') + ')'"
            >
              <div class="chart-bar-wrap">
                <div
                  class="chart-bar"
                  :style="{ height: barHeight(b.revenue) + '%' }"
                />
              </div>
              <div class="chart-bar-label">
                {{ showBucketLabel(i) ? b.shortLabel : '' }}
              </div>
            </div>
          </div>
          <div class="row items-center q-mt-sm text-caption text-grey-7">
            <div>
              Peak: ${{ maxBucketRevenue.toFixed(2) }}
            </div>
            <q-space />
            <div class="row items-center q-gutter-xs">
              <q-chip
                v-for="s in statusBreakdown"
                :key="s.status"
                dense
                :color="statusColor(s.status)"
                text-color="white"
                size="sm"
              >
                {{ s.status }}: {{ s.count }}
              </q-chip>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Top products -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="star" class="q-mr-sm" />
          Top Products
        </div>
        <q-table
          :rows="topProducts"
          :columns="productColumns"
          row-key="name"
          :loading="loading"
          :pagination="{ rowsPerPage: 10, sortBy: 'revenue', descending: true }"
          no-data-label="No product data in this period"
          flat
          bordered
          dense
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useQuasar, useMeta, exportFile, date } from 'quasar';
import { firebaseService } from '../services/firebaseService';

const MS_DAY = 24 * 60 * 60 * 1000;

// Same tolerant timestamp handling as OrderList: Firestore Timestamp,
// epoch-ms number, ISO string, Date, or {seconds,nanoseconds}.
function toDate(timestamp) {
  if (timestamp === null || timestamp === undefined) return null;
  try {
    let d;
    if (timestamp && typeof timestamp.toDate === 'function') {
      d = timestamp.toDate();
    } else if (typeof timestamp === 'number') {
      d = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      d = new Date(timestamp);
    } else if (timestamp instanceof Date) {
      d = timestamp;
    } else if (typeof timestamp === 'object' && 'seconds' in timestamp) {
      d = new Date(
        timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000
      );
    } else {
      d = new Date(timestamp);
    }
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function orderDate(order) {
  return (
    toDate(order.submissionDateClient) ||
    toDate(order.submissionDate) ||
    toDate(order.createdAt)
  );
}

function orderMagnets(order) {
  if (order.totalMagnets) return order.totalMagnets;
  if (Array.isArray(order.cartItems)) {
    return order.cartItems.reduce((total, item) => {
      if (Array.isArray(item.photoQuantities)) {
        return (
          total + item.photoQuantities.reduce((sum, qty) => sum + (qty || 0), 0)
        );
      }
      return total + (item.quantity || 0);
    }, 0);
  }
  return 0;
}

export default {
  name: 'AdminSalesPage',
  setup() {
    useMeta({
      title: 'Sales Dashboard - Lil Magnet Memories',
      meta: {
        robots: { name: 'robots', content: 'noindex, nofollow' },
      },
    });

    const $q = useQuasar();
    const orders = ref([]);
    const loading = ref(false);
    const loadError = ref('');
    const period = ref('30d');
    const includeArchived = ref(true);

    const periodOptions = [
      { value: '7d', label: '7 days' },
      { value: '30d', label: '30 days' },
      { value: '90d', label: '90 days' },
      { value: 'ytd', label: 'This year' },
      { value: 'all', label: 'All time' },
    ];

    const periodDays = computed(() => {
      if (period.value === '7d') return 7;
      if (period.value === '30d') return 30;
      if (period.value === '90d') return 90;
      return null;
    });

    const periodStart = computed(() => {
      const now = new Date();
      if (periodDays.value) {
        const start = new Date(now.getTime() - periodDays.value * MS_DAY);
        start.setHours(0, 0, 0, 0);
        return start;
      }
      if (period.value === 'ytd') return new Date(now.getFullYear(), 0, 1);
      return null; // all time
    });

    const datedOrders = computed(() =>
      orders.value
        .map((o) => ({ order: o, date: orderDate(o) }))
        .filter((e) => e.date !== null)
        .filter((e) => includeArchived.value || !e.order.archived)
    );

    const periodOrders = computed(() => {
      const start = periodStart.value;
      if (!start) return datedOrders.value;
      return datedOrders.value.filter((e) => e.date >= start);
    });

    // Prior window of equal length, for delta comparison (rolling periods only)
    const priorOrders = computed(() => {
      if (!periodDays.value || !periodStart.value) return null;
      const start = periodStart.value;
      const priorStart = new Date(start.getTime() - periodDays.value * MS_DAY);
      return datedOrders.value.filter(
        (e) => e.date >= priorStart && e.date < start
      );
    });

    const sumRevenue = (entries) =>
      entries.reduce((sum, e) => sum + (Number(e.order.totalAmount) || 0), 0);

    const pctDelta = (current, prior) => {
      if (prior === null) return null;
      if (prior === 0) return current > 0 ? 100 : 0;
      return ((current - prior) / prior) * 100;
    };

    const kpis = computed(() => {
      const entries = periodOrders.value;
      const prior = priorOrders.value;
      const revenue = sumRevenue(entries);
      const count = entries.length;
      const magnets = entries.reduce(
        (sum, e) => sum + orderMagnets(e.order),
        0
      );
      const aov = count > 0 ? revenue / count : 0;
      const priorRevenue = prior ? sumRevenue(prior) : null;
      const priorCount = prior ? prior.length : null;
      return [
        {
          label: 'Revenue',
          value: '$' + revenue.toFixed(2),
          delta: pctDelta(revenue, priorRevenue),
        },
        {
          label: 'Orders',
          value: String(count),
          delta: pctDelta(count, priorCount),
        },
        {
          label: 'Avg Order',
          value: '$' + aov.toFixed(2),
          delta: null,
        },
        {
          label: 'Magnets Sold',
          value: String(magnets),
          delta: null,
        },
      ];
    });

    // daily buckets for 7/30d, weekly for 90d, monthly for ytd/all
    const bucketUnit = computed(() => {
      if (period.value === '7d' || period.value === '30d') return 'day';
      if (period.value === '90d') return 'week';
      return 'month';
    });

    const bucketUnitLabel = computed(
      () =>
        ({ day: 'by day', week: 'by week', month: 'by month' })[
          bucketUnit.value
        ]
    );

    const bucketKey = (d) => {
      if (bucketUnit.value === 'day') return date.formatDate(d, 'YYYY-MM-DD');
      if (bucketUnit.value === 'week') {
        // bucket by the Monday of that week
        const monday = new Date(d);
        const dow = (monday.getDay() + 6) % 7;
        monday.setDate(monday.getDate() - dow);
        return date.formatDate(monday, 'YYYY-MM-DD');
      }
      return date.formatDate(d, 'YYYY-MM');
    };

    const buckets = computed(() => {
      const entries = periodOrders.value;
      if (entries.length === 0) return [];
      const map = new Map();
      // seed the full range so quiet days/weeks still show as gaps
      const now = new Date();
      let cursor;
      if (periodStart.value) {
        cursor = new Date(periodStart.value);
      } else {
        cursor = entries.reduce(
          (min, e) => (e.date < min ? e.date : min),
          entries[0].date
        );
        cursor = new Date(cursor);
      }
      const stepDays =
        bucketUnit.value === 'day' ? 1 : bucketUnit.value === 'week' ? 7 : null;
      let guard = 0;
      while (cursor <= now && guard < 400) {
        map.set(bucketKey(cursor), { revenue: 0, orders: 0, sample: new Date(cursor) });
        if (stepDays) cursor = new Date(cursor.getTime() + stepDays * MS_DAY);
        else cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
        guard++;
      }
      for (const e of entries) {
        const key = bucketKey(e.date);
        if (!map.has(key)) map.set(key, { revenue: 0, orders: 0, sample: e.date });
        const b = map.get(key);
        b.revenue += Number(e.order.totalAmount) || 0;
        b.orders += 1;
      }
      return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([key, b]) => ({
          label:
            bucketUnit.value === 'month'
              ? date.formatDate(b.sample, 'MMM YYYY')
              : bucketUnit.value === 'week'
                ? 'Week of ' + date.formatDate(key, 'MMM D')
                : date.formatDate(key, 'MMM D'),
          shortLabel:
            bucketUnit.value === 'month'
              ? date.formatDate(b.sample, 'MMM')
              : date.formatDate(
                  bucketUnit.value === 'week' ? key : b.sample,
                  'M/D'
                ),
          revenue: b.revenue,
          orders: b.orders,
        }));
    });

    const maxBucketRevenue = computed(() =>
      buckets.value.reduce((max, b) => Math.max(max, b.revenue), 0)
    );

    const barHeight = (revenue) => {
      if (maxBucketRevenue.value === 0) return 0;
      return Math.max((revenue / maxBucketRevenue.value) * 100, revenue > 0 ? 2 : 0);
    };

    const showBucketLabel = (i) => {
      const n = buckets.value.length;
      if (n <= 14) return true;
      const step = Math.ceil(n / 12);
      return i % step === 0;
    };

    const statusBreakdown = computed(() => {
      const counts = new Map();
      for (const e of periodOrders.value) {
        const s = e.order.status || 'unknown';
        counts.set(s, (counts.get(s) || 0) + 1);
      }
      return Array.from(counts.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);
    });

    const statusColor = (status) =>
      ({
        new: 'blue',
        paid: 'teal',
        in_progress: 'orange',
        completed: 'positive',
      })[status] || 'grey-6';

    const topProducts = computed(() => {
      const map = new Map();
      for (const e of periodOrders.value) {
        if (!Array.isArray(e.order.cartItems)) continue;
        for (const item of e.order.cartItems) {
          const name = item.productName || 'Unknown product';
          if (!map.has(name)) {
            map.set(name, { name, quantity: 0, revenue: 0, orders: 0 });
          }
          const p = map.get(name);
          const qty = Array.isArray(item.photoQuantities)
            ? item.photoQuantities.reduce((s, q) => s + (q || 0), 0)
            : item.quantity || 0;
          p.quantity += qty;
          p.revenue +=
            Number(item.totalPrice) ||
            (Number(item.pricePerUnit) || 0) * qty ||
            0;
          p.orders += 1;
        }
      }
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    });

    const productColumns = [
      { name: 'name', label: 'Product', field: 'name', align: 'left', sortable: true },
      { name: 'orders', label: 'Orders', field: 'orders', align: 'right', sortable: true },
      { name: 'quantity', label: 'Magnets', field: 'quantity', align: 'right', sortable: true },
      {
        name: 'revenue',
        label: 'Revenue',
        field: 'revenue',
        align: 'right',
        sortable: true,
        format: (v) => '$' + Number(v || 0).toFixed(2),
      },
    ];

    const loadOrders = async () => {
      loading.value = true;
      loadError.value = '';
      try {
        orders.value = await firebaseService.getOrdersForAnalytics();
      } catch (error) {
        console.error('Error loading orders for sales dashboard:', error);
        loadError.value =
          error.code === 'permission-denied'
            ? 'Permission denied — admin access is required to view sales data.'
            : 'Could not load orders. Please try again.';
        orders.value = [];
      } finally {
        loading.value = false;
      }
    };

    const csvEscape = (val) => {
      const str = String(val ?? '');
      return /[",\n]/.test(str) ? '"' + str.replace(/"/g, '""') + '"' : str;
    };

    const exportCsv = () => {
      const header = [
        'date',
        'order_number',
        'customer',
        'email',
        'status',
        'archived',
        'magnets',
        'total',
      ];
      const lines = periodOrders.value
        .slice()
        .sort((a, b) => b.date - a.date)
        .map((e) =>
          [
            date.formatDate(e.date, 'YYYY-MM-DD HH:mm:ss'),
            e.order.orderNumber || e.order.id,
            [e.order.customer?.firstName, e.order.customer?.lastName]
              .filter(Boolean)
              .join(' '),
            e.order.customer?.email || '',
            e.order.status || '',
            e.order.archived ? 'yes' : 'no',
            orderMagnets(e.order),
            (Number(e.order.totalAmount) || 0).toFixed(2),
          ]
            .map(csvEscape)
            .join(',')
        );
      const csv = [header.join(','), ...lines].join('\n');
      const fileName =
        'sales-' + period.value + '-' + date.formatDate(new Date(), 'YYYYMMDD') + '.csv';
      const ok = exportFile(fileName, csv, 'text/csv');
      if (!ok) {
        $q.notify({
          type: 'negative',
          message: 'Browser blocked the download',
          position: 'top',
        });
      }
    };

    onMounted(loadOrders);

    return {
      loading,
      loadError,
      period,
      periodOptions,
      periodDays,
      includeArchived,
      periodOrders,
      kpis,
      buckets,
      bucketUnitLabel,
      maxBucketRevenue,
      barHeight,
      showBucketLabel,
      statusBreakdown,
      statusColor,
      topProducts,
      productColumns,
      loadOrders,
      exportCsv,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.kpi-card {
  border-top: 3px solid $primary;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 180px;
}

.chart-bar-col {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-bar-wrap {
  flex: 1;
  display: flex;
  align-items: flex-end;
}

.chart-bar {
  width: 100%;
  background: $primary;
  border-radius: 3px 3px 0 0;
  min-height: 0;
  transition: height 0.2s ease;
}

.chart-bar-label {
  font-size: 10px;
  color: #757575;
  text-align: center;
  white-space: nowrap;
  overflow: visible;
  height: 14px;
  margin-top: 2px;
}
</style>
