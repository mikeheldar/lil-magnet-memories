<template>
  <q-page class="event-calendar-page">
    <div class="page-container q-pa-lg">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          <q-icon name="event" size="32px" class="q-mr-sm" />
          Market Events Calendar
        </div>
        <div class="text-body1 text-grey-7">
          Find us at local markets and events near you!
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading events...</div>
      </div>

      <!-- No Events -->
      <div
        v-else-if="!loading && upcomingEvents.length === 0 && historicalEvents.length === 0"
        class="text-center q-pa-xl"
      >
        <q-icon name="event_busy" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">
          No events scheduled
        </div>
        <div class="text-body2 text-grey-5 q-mt-sm">
          Check back soon for our next market appearance!
        </div>
      </div>

      <!-- Upcoming Events Section -->
      <div v-else-if="!loading && upcomingEvents.length > 0" class="q-mb-xl">
        <div class="text-h5 text-weight-bold text-primary q-mb-md">
          Upcoming Events
        </div>
        <div class="row q-col-gutter-md">
          <div
            v-for="event in upcomingEvents"
            :key="event.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="event-card" flat bordered>
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6 text-weight-bold text-primary">
                      {{ event.name }}
                    </div>
                  </div>
                  <q-chip
                    :color="getEventStatusColor(getEventStatus(event))"
                    text-color="white"
                    size="sm"
                  >
                    {{ getEventStatusText(getEventStatus(event)) }}
                  </q-chip>
                </div>

                <div class="event-details q-mb-md">
                  <div class="row q-gutter-md">
                    <div class="col-12">
                      <q-icon
                        name="place"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <span class="text-body2">{{ event.location }}</span>
                    </div>
                    <div v-if="event.eventLink" class="col-12">
                      <q-icon
                        name="link"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <a
                        :href="event.eventLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-body2 text-primary text-weight-medium"
                        style="text-decoration: none;"
                      >
                        Event Details
                        <q-icon name="open_in_new" size="14px" class="q-ml-xs" />
                      </a>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-icon
                        name="schedule"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <span class="text-body2">{{
                        formatDateTime(event.startDateTime)
                      }}</span>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-icon
                        name="schedule"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <span class="text-body2">{{
                        formatDateTime(event.endDateTime)
                      }}</span>
                    </div>
                  </div>
                </div>

                <q-btn
                  v-if="getEventStatus(event) === 'active'"
                  color="primary"
                  label="Shop at Event"
                  icon="store"
                  class="full-width"
                  @click="goToMarketEventUpload"
                />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Historical Events Section -->
      <div v-if="!loading && historicalEvents.length > 0">
        <div class="text-h5 text-weight-bold text-primary q-mb-md q-mt-xl">
          Historical Events
        </div>
        <div class="row q-col-gutter-md">
          <div
            v-for="event in historicalEvents"
            :key="event.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="event-card" flat bordered>
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-h6 text-weight-bold text-primary">
                      {{ event.name }}
                    </div>
                  </div>
                  <q-chip
                    :color="getEventStatusColor(getEventStatus(event))"
                    text-color="white"
                    size="sm"
                  >
                    {{ getEventStatusText(getEventStatus(event)) }}
                  </q-chip>
                </div>

                <div class="event-details q-mb-md">
                  <div class="row q-gutter-md">
                    <div class="col-12">
                      <q-icon
                        name="place"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <span class="text-body2">{{ event.location }}</span>
                    </div>
                    <div v-if="event.eventLink" class="col-12">
                      <q-icon
                        name="link"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <a
                        :href="event.eventLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-body2 text-primary text-weight-medium"
                        style="text-decoration: none;"
                      >
                        Event Details
                        <q-icon name="open_in_new" size="14px" class="q-ml-xs" />
                      </a>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-icon
                        name="schedule"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <span class="text-body2">{{
                        formatDateTime(event.startDateTime)
                      }}</span>
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-icon
                        name="schedule"
                        color="grey-6"
                        size="sm"
                        class="q-mr-xs"
                      />
                      <span class="text-body2">{{
                        formatDateTime(event.endDateTime)
                      }}</span>
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { marketEventService } from '../services/marketEventService.js';
import { useSiteSeo } from '../composables/useSiteSeo.js';

const router = useRouter();
const route = useRoute();

useSiteSeo(() => ({
  title: 'Event Calendar - Lil Magnet Memories',
  description:
    'Find Lil Magnet Memories at upcoming market events. See our event calendar, locations, and dates. Visit us in person for custom photo magnets!',
  keywords:
    'market events, event calendar, local markets, in-person shopping, market schedule',
  path: route.path,
  image: '/assets/lil-magnet-memories-logo.png',
}));
const loading = ref(true);
const events = ref([]);

const loadEvents = async () => {
  try {
    loading.value = true;
    const allEvents = await marketEventService.getEvents();
    // Filter out testing events and only show public events
    // Note: marketEventService.getEvents() already filters out testing events for non-admins
    events.value = allEvents.filter((event) => !event.isTesting);
  } catch (error) {
    console.error('Error loading events:', error);
    events.value = [];
  } finally {
    loading.value = false;
  }
};

// Filter to show upcoming and active events
const upcomingEvents = computed(() => {
  const now = new Date();
  return events.value
    .filter((event) => {
      const endDate = event.endDateTime?.toDate
        ? event.endDateTime.toDate()
        : new Date(event.endDateTime);
      return endDate >= now;
    })
    .sort((a, b) => {
      const dateA = a.startDateTime?.toDate
        ? a.startDateTime.toDate()
        : new Date(a.startDateTime);
      const dateB = b.startDateTime?.toDate
        ? b.startDateTime.toDate()
        : new Date(b.startDateTime);
      return dateA - dateB;
    });
});

// Filter to show historical (past) events
const historicalEvents = computed(() => {
  const now = new Date();
  return events.value
    .filter((event) => {
      const endDate = event.endDateTime?.toDate
        ? event.endDateTime.toDate()
        : new Date(event.endDateTime);
      return endDate < now;
    })
    .sort((a, b) => {
      const dateA = a.startDateTime?.toDate
        ? a.startDateTime.toDate()
        : new Date(a.startDateTime);
      const dateB = b.startDateTime?.toDate
        ? b.startDateTime.toDate()
        : new Date(b.startDateTime);
      return dateB - dateA; // Reverse order for historical (most recent first)
    });
});

const getEventStatus = (event) => {
  const now = new Date();
  const startDate = event.startDateTime?.toDate
    ? event.startDateTime.toDate()
    : new Date(event.startDateTime);
  const endDate = event.endDateTime?.toDate
    ? event.endDateTime.toDate()
    : new Date(event.endDateTime);

  if (now < startDate) {
    return 'upcoming';
  } else if (now >= startDate && now <= endDate) {
    return 'active';
  } else {
    return 'past';
  }
};

const getEventStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'green';
    case 'upcoming':
      return 'blue';
    case 'past':
      return 'grey';
    default:
      return 'grey';
  }
};

const getEventStatusText = (status) => {
  switch (status) {
    case 'active':
      return 'Live Now';
    case 'upcoming':
      return 'Upcoming';
    case 'past':
      return 'Past';
    default:
      return 'Unknown';
  }
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return 'TBD';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const goToMarketEventUpload = () => {
  router.push('/photo-upload');
};

onMounted(() => {
  loadEvents();
});
</script>

<style lang="scss" scoped>
.event-calendar-page {
  max-width: 1200px;
  margin: 0 auto;
}

.event-card {
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
}

.event-details {
  margin-top: 12px;
}
</style>
