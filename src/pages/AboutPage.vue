<template>
  <q-page padding class="about-page">
    <div class="q-pa-lg q-gutter-y-xl">
      <section class="hero-section q-pt-xl q-pb-lg text-center">
        <q-icon name="favorite" color="primary" size="64px" class="q-mb-md" />
        <div class="text-h3 text-primary text-weight-bold">
          About Li'l Magnet Memories
        </div>
        <div class="text-subtitle1 text-grey-7 q-mx-auto hero-subtitle">
          Founded in 2025 by Amy Helman-Darley to sprinkle a little more joy
          into the world—one magnetic memory at a time.
        </div>
        <div class="q-mt-md">
          <a
            href="https://www.instagram.com/lilmagnetmemories"
            target="_blank"
            rel="noopener noreferrer"
            class="instagram-link"
          >
            <q-icon name="camera_alt" size="24px" class="q-mr-sm" />
            <span class="text-body1 text-primary">Follow us on Instagram</span>
            <q-icon name="open_in_new" size="16px" class="q-ml-xs" />
          </a>
        </div>
      </section>

      <section class="story-section q-pa-lg bg-white shadow-2 rounded-borders">
        <div class="text-h5 text-primary text-weight-medium q-mb-md">
          Our Story
        </div>
        <p class="text-body1 text-grey-8">
          Li'l Magnet Memories began when Amy Helman-Darley decided to turn her
          love of photography, storytelling, and crafting into something
          everyone could share. From the very first market booth, the mission
          has been to capture everyday smiles, milestone moments, and unexpected
          adventures in a form that can live right on your fridge, locker, or
          studio wall.
        </p>
        <p class="text-body1 text-grey-8 q-mt-md">
          Every magnet we make is designed to celebrate connection. Whether
          you’re commemorating a family trip, cheering on a team, or surprising
          someone special, we want each piece to feel personal, playful, and
          ready to brighten the room.
        </p>
      </section>

      <section class="values-section row q-col-gutter-lg">
        <div class="col-12 col-md-4">
          <q-card flat bordered class="value-card">
            <q-card-section>
              <q-icon
                name="emoji_emotions"
                color="primary"
                size="48px"
                class="q-mb-sm"
              />
              <div class="text-h6 text-primary text-weight-medium">
                Spread Joy
              </div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                We believe tiny artifacts can spark big smiles. Every design is
                made to brighten your day and remind you of what matters most.
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered class="value-card">
            <q-card-section>
              <q-icon
                name="brush"
                color="primary"
                size="48px"
                class="q-mb-sm"
              />
              <div class="text-h6 text-primary text-weight-medium">
                Stay Creative
              </div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                From custom uploads to curated collections, we explore fresh
                ways to transform photos into keepsakes that feel artful and
                fun.
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-4">
          <q-card flat bordered class="value-card">
            <q-card-section>
              <q-icon
                name="volunteer_activism"
                color="primary"
                size="48px"
                class="q-mb-sm"
              />
              <div class="text-h6 text-primary text-weight-medium">
                Celebrate Community
              </div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                Whether we’re at a local market or shipping across the country,
                Li'l Magnet Memories is about cheering on the people and places
                you love.
              </div>
            </q-card-section>
          </q-card>
        </div>
      </section>

      <section
        class="cta-section q-pa-lg bg-blue-1 rounded-borders text-center"
      >
        <div class="text-h5 text-primary text-weight-medium q-mb-sm">
          Ready to craft your next magnet story?
        </div>
        <div class="text-body1 text-grey-7 q-mb-md">
          Join Amy and the Li'l Magnet Memories crew in turning today's
          snapshots into tomorrow's treasures.
        </div>
        <q-btn
          color="primary"
          unelevated
          label="Start Creating Magnets"
          @click="$router.push('/photo-upload')"
          class="q-mb-md"
        />
      </section>

      <section class="timeline-section">
        <div class="text-h5 text-primary text-weight-medium q-mb-md">
          Highlights & New Features
        </div>
        <div class="text-body2 text-grey-7 q-mb-lg">
          We keep a running log of our favorite improvements. Newest updates are
          pinned to the top so you can see what’s fresh off the magnet press.
        </div>

        <q-timeline color="primary" layout="dense">
          <q-timeline-entry
            icon="emoji_events"
            color="primary"
            title="November 8, 2025 — About page debuts"
          >
            Introduced this very page with our story, value pillars, and a
            living timeline so fans can follow Li'l Magnet Memories as it grows.
          </q-timeline-entry>

          <q-timeline-entry
            icon="shopping_cart"
            color="primary"
            title="November 8, 2025 — Online order flow polished"
          >
            Smoothed the “Add to Cart” experience and improved button handling
            so customers jump straight to the cart with zero friction.
          </q-timeline-entry>

          <q-timeline-entry
            icon="print"
            color="primary"
            title="November 8, 2025 — Print template precision upgrade"
          >
            Swapped in SVG guide frames, fine-tune controls, and scaling fixes
            to keep bottom-row cut lines perfectly aligned on every sheet.
          </q-timeline-entry>

          <q-timeline-entry
            icon="event"
            color="primary"
            title="November 6, 2025 — Market-aware navigation"
          >
            Drawer navigation and quick links now switch between market pickup
            and online delivery automatically when Amy is live at an event.
          </q-timeline-entry>

          <q-timeline-entry
            icon="auto_fix_high"
            color="primary"
            title="November 3, 2025 — Magnet Studio controls"
          >
            Added touch and mouse pan/zoom to the print template so every magnet
            crop can be dialed in with pixel-perfect placement.
          </q-timeline-entry>

          <q-timeline-entry
            icon="all_inclusive"
            color="primary"
            title="November 2, 2025 — Multi-quantity uploads"
          >
            Online orders now expand photos by quantity, keeping market and cart
            workflows in sync.
          </q-timeline-entry>

          <q-timeline-entry
            icon="auto_awesome"
            color="primary"
            title="January 2025 — Li'l Magnet Memories launches"
          >
            Amy Helman-Darley hosts the first pop-up, offering custom 2.6-inch
            magnets made with love, laughter, and a trusty photo printer.
          </q-timeline-entry>

          <q-timeline-entry
            icon="shopping_cart"
            color="primary"
            title="February 2025 — Online ordering arrives"
          >
            Added the Online Order flow so you can upload photos, review
            pricing, and build a magnet cart from your couch. Apple Pay and
            Square checkout joined the fun shortly after.
          </q-timeline-entry>

          <q-timeline-entry
            icon="print"
            color="primary"
            title="March 2025 — Print template 2.0"
          >
            Rebuilt the print template with precise SVG guides, fine-tune
            controls, and better scaling so every magnet sheet matches the cut
            lines perfectly.
          </q-timeline-entry>

          <q-timeline-entry
            icon="event"
            color="primary"
            title="April 2025 — Market-mode magic"
          >
            Drawer navigation now detects when we’re live at a market, steering
            you to in-person pickup and highlighting local events.
          </q-timeline-entry>

          <q-timeline-entry
            icon="favorite"
            color="primary"
            title="Want to see your favorite feature here?"
          >
            Drop us a note and we’ll keep this living timeline updated as Li'l
            Magnet Memories grows.
          </q-timeline-entry>
        </q-timeline>
      </section>

      <section class="market-events-section q-pa-lg bg-white shadow-2 rounded-borders">
        <div class="text-h5 text-primary text-weight-medium q-mb-md">
          <q-icon name="event" class="q-mr-sm" />
          Market Events
        </div>
        <div class="text-body2 text-grey-7 q-mb-lg">
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
      </section>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { marketEventService } from '../services/marketEventService.js';

export default {
  name: 'AboutPage',
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
.about-page {
  background: linear-gradient(135deg, #f7f9fc 0%, #e3ecff 100%);
  min-height: 100vh;
}

.hero-section {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
}

.hero-subtitle {
  max-width: 520px;
}

.story-section {
  max-width: 900px;
  margin: 0 auto;
}

.values-section {
  max-width: 1024px;
  margin: 0 auto;
}

.value-card {
  height: 100%;
  border-radius: 16px;
}

.cta-section {
  max-width: 720px;
  margin: 0 auto 4rem;
}

.timeline-section {
  max-width: 900px;
  margin: 0 auto 5rem;
}

.market-events-section {
  max-width: 900px;
  margin: 0 auto 5rem;
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

.instagram-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s;
}

.instagram-link:hover {
  opacity: 0.8;
}

@media (max-width: 767px) {
  .hero-section {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .story-section,
  .cta-section,
  .timeline-section,
  .market-events-section {
    margin-left: 1rem;
    margin-right: 1rem;
  }
}
</style>
