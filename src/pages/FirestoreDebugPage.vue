<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Firestore Operation Logger
      </div>
      <div class="text-subtitle1 text-grey-7">
        Step 1: Track when "client is offline" errors occur
      </div>
    </div>

    <q-card class="q-pa-lg q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Summary</div>
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label>Total Operations</q-item-label>
              <q-item-label caption>{{ summary.total }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Completed</q-item-label>
              <q-item-label caption>{{ summary.completed }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Successful</q-item-label>
              <q-item-label caption class="text-positive">{{ summary.successful }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Failed</q-item-label>
              <q-item-label caption class="text-negative">{{ summary.failed }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Offline Errors</q-item-label>
              <q-item-label caption class="text-negative">{{ summary.offlineErrors }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Success Rate</q-item-label>
              <q-item-label caption>{{ summary.successRate }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions>
        <q-btn
          @click="refreshLogs"
          color="primary"
          icon="refresh"
          label="Refresh"
        />
        <q-btn
          @click="clearLogs"
          color="negative"
          icon="delete"
          label="Clear Logs"
        />
        <q-btn
          @click="exportLogs"
          color="secondary"
          icon="download"
          label="Export JSON"
        />
      </q-card-actions>
    </q-card>

    <q-card class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Operation Logs</div>
        
        <q-list v-if="logs.length > 0">
          <q-item
            v-for="log in logs"
            :key="log.id"
            class="q-mb-sm"
            :class="{ 'bg-red-1': log.completed && log.result && !log.result.success }"
          >
            <q-item-section avatar>
              <q-icon
                v-if="!log.completed"
                name="hourglass_empty"
                color="orange"
                size="24px"
              />
              <q-icon
                v-else-if="log.result && log.result.success"
                name="check_circle"
                color="positive"
                size="24px"
              />
              <q-icon
                v-else
                name="error"
                color="negative"
                size="24px"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ log.operation }}</q-item-label>
              <q-item-label caption>
                <span v-if="!log.completed">In progress...</span>
                <span v-else-if="log.result && log.result.success">
                  Success ({{ log.result.duration }})
                </span>
                <span v-else-if="log.result && log.result.error">
                  Failed: {{ log.result.error.message }} ({{ log.result.error.code }})
                </span>
                <span v-else>Unknown status</span>
              </q-item-label>
              <q-expansion-item
                label="View Details"
                dense
                class="q-mt-xs"
              >
                <pre class="q-pa-sm bg-grey-1 rounded-borders text-caption">{{ JSON.stringify(log, null, 2) }}</pre>
              </q-expansion-item>
            </q-item-section>
            <q-item-section side>
              <q-item-label caption>{{ new Date(log.state.timestamp).toLocaleTimeString() }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        
        <div v-else class="text-center text-grey-6 q-pa-lg">
          No operations logged yet. Perform some Firestore operations to see logs here.
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="offlineErrors.length > 0" class="q-pa-lg q-mt-md">
      <q-card-section>
        <div class="text-h6 q-mb-md text-negative">Offline Errors Detected</div>
        <q-list>
          <q-item
            v-for="log in offlineErrors"
            :key="log.id"
            class="q-mb-sm bg-red-1"
          >
            <q-item-section>
              <q-item-label>{{ log.operation }}</q-item-label>
              <q-item-label caption>
                Error: {{ log.result.error.message }} ({{ log.result.error.code }})
              </q-item-label>
              <q-item-label caption class="q-mt-xs">
                Browser Online: {{ log.state.browser.online ? 'Yes' : 'No' }}
                | Auth: {{ log.state.auth.currentUser ? (log.state.auth.currentUser.email || 'Anonymous') : 'None' }}
              </q-item-label>
              <q-expansion-item
                label="Full Error Details"
                dense
                class="q-mt-xs"
              >
                <pre class="q-pa-sm bg-grey-1 rounded-borders text-caption">{{ JSON.stringify(log, null, 2) }}</pre>
              </q-expansion-item>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useMeta } from 'quasar';
import { 
  getLogs, 
  getSummary, 
  getOfflineErrors, 
  clearLogs as clearLogsUtil,
  exportLogs as exportLogsUtil 
} from '../utils/firestoreLogger.js';

export default {
  name: 'FirestoreDebugPage',
  setup() {
    useMeta({
      title: 'Firestore Debug - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Firestore debugging and logging tool.'
        },
        robots: {
          name: 'robots',
          content: 'noindex, nofollow'
        }
      }
    });

    const logs = ref([]);
    const summary = ref({});
    const offlineErrors = ref([]);
    let refreshInterval = null;

    const refreshLogs = () => {
      logs.value = getLogs();
      summary.value = getSummary();
      offlineErrors.value = getOfflineErrors();
    };

    const clearLogs = () => {
      clearLogsUtil();
      refreshLogs();
    };

    const exportLogs = () => {
      const json = exportLogsUtil();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firestore-logs-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    onMounted(() => {
      refreshLogs();
      // Auto-refresh every 2 seconds
      refreshInterval = setInterval(refreshLogs, 2000);
    });

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });

    return {
      logs,
      summary,
      offlineErrors,
      refreshLogs,
      clearLogs,
      exportLogs,
    };
  },
};
</script>

