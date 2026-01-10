<template>
  <q-page class="event-calendar-page q-pa-lg">
    <div class="page-container">
      <div class="text-h4 text-center q-mb-md text-primary">
        <q-icon name="event" size="32px" class="q-mr-sm" />
        Event Calendar
      </div>
      <div class="text-body1 text-center text-grey-7 q-mb-xl">
        Find us at local farmers markets and events. Click on any event for
        more details!
      </div>

      <!-- Loading State -->
      <div v-if="loadingEvents" class="text-center q-pa-lg">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading events...</div>
      </div>

      <!-- No Events -->
      <div
        v-else-if="displayEvents.length === 0"
        class="text-center q-pa-lg text-grey-6"
      >
        <q-icon name="event_busy" size="48px" class="q-mb-sm" />
        <div>No upcoming or recent events to display.</div>
      </div>

      <!-- Events List -->
      <div v-else class="events-list">
        <q-card
          v-for="event in displayEvents"
          :key="event.id"
          flat
          bordered
          class="event-card q-mb-md"
        >
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-h6 text-primary text-weight-medium q-mb-xs">
                  {{ event.name }}
                </div>
                <div class="text-body2 text-grey-7 q-mb-xs">
                  <q-icon name="place" size="16px" class="q-mr-xs" />
                  {{ event.location }}
                </div>
                <div class="text-body2 text-grey-6">
                  <q-icon name="schedule" size="16px" class="q-mr-xs" />
                  {{ formatEventDate(event) }}
                </div>
              </div>
              <div class="col-auto">
                <q-chip
                  :color="getEventStatusColor(event)"
                  text-color="white"
                  size="sm"
                  class="q-mb-xs"
                >
                  {{ getEventStatusText(event) }}
                </q-chip>
                <div v-if="event.eventLink" class="q-mt-sm">
                  <q-btn
                    :href="event.eventLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    size="sm"
                    outline
                    icon="link"
                    label="Event Details"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { marketEventService } from '../services/marketEventService.js';

export default {
  name: 'EventCalendarPage',
  setup() {
    const events = ref([]);
    const loadingEvents = ref(true);

    // Get events to display (upcoming and recent past events)
    const displayEvents = computed(() => {
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      return events.value
        .filter((event) => {
          const endDate = new Date(event.endDateTime);
          // Show events that are upcoming or ended within the last 3 months
          return endDate >= threeMonthsAgo;
        })
        .sort((a, b) => {
          // Sort by start date, upcoming first
          const dateA = new Date(a.startDateTime);
          const dateB = new Date(b.startDateTime);
          return dateB - dateA; // Most recent/upcoming first
        });
    });

    // Format event date for display
    const formatEventDate = (event) => {
      try {
        const startDate = new Date(event.startDateTime);
        const endDate = new Date(event.endDateTime);
        const startStr = startDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
        const endStr = endDate.toLocaleDateString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        });
        return `${startStr} - ${endStr}`;
      } catch (error) {
        return event.startDateTime;
      }
    };

    // Get event status color
    const getEventStatusColor = (event) => {
      const now = new Date();
      const startTime = new Date(event.startDateTime);
      const endTime = new Date(event.endDateTime);

      if (now < startTime) {
        return 'blue';
      } else if (now >= startTime && now <= endTime) {
        return 'green';
      } else {
        return 'grey-6';
      }
    };

    // Get event status text
    const getEventStatusText = (event) => {
      const now = new Date();
      const startTime = new Date(event.startDateTime);
      const endTime = new Date(event.endDateTime);

      if (now < startTime) {
        return 'Upcoming';
      } else if (now >= startTime && now <= endTime) {
        return 'Live Now';
      } else {
        return 'Past Event';
      }
    };

    // Load events
    const loadEvents = async () => {
      loadingEvents.value = true;
      try {
        const allEvents = await marketEventService.getEvents();
        events.value = allEvents;
      } catch (error) {
        console.error('Error loading events:', error);
        events.value = [];
      } finally {
        loadingEvents.value = false;
      }
    };

    // Set up listener for real-time updates
    onMounted(() => {
      loadEvents();
      // Subscribe to real-time updates
      marketEventService.addListener(() => {
        loadEvents();
      });
    });

    return {
      events,
      displayEvents,
      loadingEvents,
      formatEventDate,
      getEventStatusColor,
      getEventStatusText,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.event-card {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.event-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
