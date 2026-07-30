<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        <q-icon name="mark_email_read" size="32px" class="q-mr-sm" />
        Newsletter Subscribers
      </div>
      <div class="text-subtitle1 text-grey-7">
        Emails collected from the newsletter signup page
      </div>
    </div>

    <q-card>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-input
              v-model="search"
              dense
              filled
              clearable
              label="Search email or source"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-chip color="primary" text-color="white" icon="people">
              {{ filteredSubscribers.length }} subscriber{{
                filteredSubscribers.length === 1 ? '' : 's'
              }}
            </q-chip>
          </div>
          <q-space />
          <div class="col-auto">
            <q-btn
              color="grey-7"
              icon="refresh"
              label="Refresh"
              flat
              :loading="loading"
              @click="loadSubscribers"
            />
            <q-btn
              color="primary"
              icon="download"
              label="Export CSV"
              class="q-ml-sm"
              :disable="filteredSubscribers.length === 0"
              @click="exportCsv"
            />
          </div>
        </div>

        <q-banner v-if="loadError" class="bg-negative text-white q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ loadError }}
        </q-banner>

        <q-table
          :rows="filteredSubscribers"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="{ rowsPerPage: 25, sortBy: 'subscribedAt', descending: true }"
          no-data-label="No subscribers yet"
          flat
          bordered
        >
          <template v-slot:body-cell-status="props">
            <q-td :props="props">
              <q-chip
                dense
                :color="props.value === 'subscribed' ? 'positive' : 'grey-6'"
                text-color="white"
              >
                {{ props.value || 'unknown' }}
              </q-chip>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useQuasar, useMeta, exportFile, date } from 'quasar';
import { firebaseService } from '../services/firebaseService';

export default {
  name: 'AdminNewsletterPage',
  setup() {
    useMeta({
      title: 'Newsletter Subscribers - Lil Magnet Memories',
      meta: {
        robots: { name: 'robots', content: 'noindex, nofollow' },
      },
    });

    const $q = useQuasar();
    const subscribers = ref([]);
    const loading = ref(false);
    const loadError = ref('');
    const search = ref('');

    const formatDate = (val) =>
      val ? date.formatDate(val, 'MMM D, YYYY h:mm A') : '—';

    const columns = [
      {
        name: 'email',
        label: 'Email',
        field: 'email',
        align: 'left',
        sortable: true,
      },
      {
        name: 'subscribedAt',
        label: 'Subscribed',
        field: 'subscribedAt',
        align: 'left',
        sortable: true,
        format: formatDate,
      },
      {
        name: 'source',
        label: 'Source',
        field: 'source',
        align: 'left',
        sortable: true,
      },
      {
        name: 'status',
        label: 'Status',
        field: 'status',
        align: 'left',
        sortable: true,
      },
    ];

    const filteredSubscribers = computed(() => {
      const term = (search.value || '').trim().toLowerCase();
      if (!term) return subscribers.value;
      return subscribers.value.filter(
        (s) =>
          s.email.toLowerCase().includes(term) ||
          (s.source || '').toLowerCase().includes(term)
      );
    });

    const loadSubscribers = async () => {
      loading.value = true;
      loadError.value = '';
      try {
        subscribers.value = await firebaseService.getNewsletterSubscribers();
      } catch (error) {
        console.error('Error loading newsletter subscribers:', error);
        loadError.value =
          error.code === 'permission-denied'
            ? 'Permission denied — admin access is required to view subscribers.'
            : 'Could not load subscribers. Please try again.';
        subscribers.value = [];
      } finally {
        loading.value = false;
      }
    };

    const csvEscape = (val) => {
      const str = String(val ?? '');
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };

    const exportCsv = () => {
      const header = ['email', 'subscribed_at', 'source', 'status'];
      const lines = filteredSubscribers.value.map((s) =>
        [
          s.email,
          s.subscribedAt ? date.formatDate(s.subscribedAt, 'YYYY-MM-DD HH:mm:ss') : '',
          s.source,
          s.status,
        ]
          .map(csvEscape)
          .join(',')
      );
      const csv = [header.join(','), ...lines].join('\n');
      const fileName = `newsletter-subscribers-${date.formatDate(new Date(), 'YYYYMMDD')}.csv`;
      const ok = exportFile(fileName, csv, 'text/csv');
      if (!ok) {
        $q.notify({
          type: 'negative',
          message: 'Browser blocked the download',
          position: 'top',
        });
      }
    };

    onMounted(loadSubscribers);

    return {
      subscribers,
      filteredSubscribers,
      columns,
      loading,
      loadError,
      search,
      loadSubscribers,
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
</style>
