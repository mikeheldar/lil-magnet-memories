<template>
  <q-page class="market-events-page">
    <div class="container">
      <!-- Header -->
      <div class="page-header q-mb-lg">
        <div class="text-h4 text-weight-bold text-center q-mb-md">
          <q-icon name="event" size="32px" class="q-mr-sm" />
          Market Events
        </div>
        <p class="text-center text-grey-6">
          Manage your market events and check in when you arrive
        </p>
      </div>

      <!-- Create New Event Button -->
      <div class="q-mb-lg text-center">
        <q-btn
          color="primary"
          size="lg"
          icon="add"
          label="Create New Market Event"
          @click="openCreateEventDialog"
          class="q-px-xl q-py-md"
        />
      </div>

      <!-- Events List -->
      <div class="events-section">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h5 text-weight-bold">
            <q-icon name="calendar_month" class="q-mr-sm" />
            Market Events
          </div>
          <q-btn
            flat
            dense
            icon="refresh"
            label="Refresh"
            @click="refreshEvents"
            :loading="loading"
            color="primary"
          />
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
          <div class="q-mt-md">Loading events...</div>
        </div>

        <!-- No Events -->
        <div
          v-else-if="events.length === 0"
          class="no-events q-pa-lg text-center"
        >
          <q-icon name="event_busy" size="64px" color="grey-5" />
          <div class="text-h6 text-grey-6 q-mt-md">No events created yet</div>
          <div class="text-body2 text-grey-5">
            Create your first market event to get started!
          </div>
        </div>

        <!-- Events Grid -->
        <div v-else class="events-grid">
          <q-card
            v-for="event in events"
            :key="event.id"
            class="event-card q-mb-md"
            flat
            bordered
          >
            <q-card-section>
              <div class="row items-start">
                <div class="col">
                  <div class="row items-center q-mb-sm">
                    <div class="col">
                      <div class="text-h6 text-weight-bold text-primary">
                        {{ event.name }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-chip
                        :color="getEventStatusColor(getEventStatus(event))"
                        text-color="white"
                        size="sm"
                      >
                        {{ getEventStatusText(getEventStatus(event)) }}
                      </q-chip>
                    </div>
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
                      <div class="col-12 col-sm-6">
                        <q-icon
                          name="schedule"
                          color="grey-6"
                          size="sm"
                          class="q-mr-xs"
                        />
                        <span class="text-body2">
                          <strong>Start:</strong>
                          {{ formatDateTime(event.startDateTime) }}
                        </span>
                      </div>
                      <div class="col-12 col-sm-6">
                        <q-icon
                          name="schedule"
                          color="grey-6"
                          size="sm"
                          class="q-mr-xs"
                        />
                        <span class="text-body2">
                          <strong>End:</strong>
                          {{ formatDateTime(event.endDateTime) }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Check-in Status -->
                  <div class="check-in-status q-mb-md">
                    <q-chip
                      :color="event.checkedIn ? 'green' : 'orange'"
                      text-color="white"
                      :icon="
                        event.checkedIn
                          ? 'check_circle'
                          : 'radio_button_unchecked'
                      "
                      size="sm"
                    >
                      {{ event.checkedIn ? 'Checked In' : 'Not Checked In' }}
                    </q-chip>
                    <q-chip
                      v-if="event.checkedOut"
                      color="blue"
                      text-color="white"
                      icon="exit_to_app"
                      size="sm"
                      class="q-ml-sm"
                    >
                      Checked Out
                    </q-chip>
                  </div>

                  <!-- Order Statistics -->
                  <div class="order-stats q-mb-md">
                    <div
                      class="text-subtitle2 text-weight-bold text-primary q-mb-sm"
                    >
                      <q-icon name="shopping_cart" class="q-mr-xs" />
                      Event Orders
                    </div>
                    <div class="row q-gutter-md">
                      <div class="col-4">
                        <q-card flat bordered class="stat-card">
                          <q-card-section class="text-center">
                            <div class="text-h6 text-weight-bold text-primary">
                              {{ getEventOrders(event.id).length }}
                            </div>
                            <div class="text-caption text-grey-6">
                              Total Orders
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div class="col-4">
                        <q-card flat bordered class="stat-card">
                          <q-card-section class="text-center">
                            <div class="text-h6 text-weight-bold text-primary">
                              {{ getEventTotalMagnets(event.id) }}
                            </div>
                            <div class="text-caption text-grey-6">
                              Total Magnets
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                      <div class="col-4">
                        <q-card flat bordered class="stat-card">
                          <q-card-section class="text-center">
                            <div class="text-h6 text-weight-bold text-primary">
                              ${{ getEventRevenue(event.id).toFixed(2) }}
                            </div>
                            <div class="text-caption text-grey-6">
                              Total Revenue
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="col-auto">
                  <q-btn-group vertical>
                    <q-btn
                      v-if="!event.checkedIn"
                      color="green"
                      icon="check_circle"
                      label="Check In"
                      size="sm"
                      @click="checkInToEvent(event.id)"
                      :loading="checkingIn === event.id"
                    />
                    <q-btn
                      v-else-if="event.checkedIn && !event.checkedOut"
                      color="blue"
                      icon="exit_to_app"
                      label="Check Out"
                      size="sm"
                      @click="checkOutOfEvent(event.id)"
                      :loading="checkingIn === event.id"
                    />
                    <q-btn
                      v-else-if="event.checkedOut"
                      color="grey-6"
                      icon="undo"
                      label="Undo Check-out"
                      size="sm"
                      @click="undoCheckOut(event.id)"
                      :loading="checkingIn === event.id"
                    />
                    <q-btn
                      color="negative"
                      icon="delete"
                      label="Delete"
                      size="sm"
                      @click="confirmDeleteEvent(event)"
                    />
                  </q-btn-group>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Create Event Dialog -->
    <q-dialog v-model="showCreateEventDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Create New Market Event</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="createEvent" class="q-gutter-md">
            <q-input
              v-model="newEvent.name"
              label="Event Name"
              :rules="[(val) => !!val || 'Event name is required']"
              filled
            />

            <q-input
              v-model="newEvent.location"
              label="Location/Place"
              :rules="[(val) => !!val || 'Location is required']"
              filled
            />

            <div class="row q-gutter-md">
              <div class="col">
                <q-input
                  v-model="newEvent.startDateTime"
                  type="datetime-local"
                  label="Event Start Date & Time"
                  :rules="[(val) => !!val || 'Start date and time is required']"
                  filled
                />
              </div>
              <div class="col">
                <q-input
                  v-model="newEvent.endDateTime"
                  type="datetime-local"
                  label="Event End Date & Time"
                  :rules="[(val) => !!val || 'End date and time is required']"
                  filled
                />
              </div>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelCreateEvent" />
          <q-btn
            type="submit"
            color="primary"
            label="Create Event"
            :loading="creatingEvent"
            @click.prevent="createEvent"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">Delete Event</div>
        </q-card-section>

        <q-card-section>
          <div>
            Are you sure you want to delete "{{ eventToDelete?.name }}"?
          </div>
          <div class="text-caption text-grey-6 q-mt-sm">
            This action cannot be undone.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showDeleteDialog = false" />
          <q-btn
            color="negative"
            label="Delete"
            @click="deleteEvent"
            :loading="deletingEvent"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService';
import { marketEventService } from '../services/marketEventService.js';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default {
  name: 'MarketEventsPage',
  setup() {
    const $q = useQuasar();

    // Safe notification helper
    const safeNotify = (options) => {
      try {
        if ($q && typeof $q.notify === 'function') {
          $q.notify(options);
        } else {
          console.warn('Notification not available:', options);
        }
      } catch (error) {
        console.error('Error showing notification:', error, options);
      }
    };

    // Reactive data
    const events = ref([]);
    const loading = ref(false);
    const creatingEvent = ref(false);
    const checkingIn = ref(null);
    const deletingEvent = ref(false);
    const allOrders = ref([]);
    let unsubscribeEvents = null;

    // Dialog states
    const showCreateEventDialog = ref(false);
    const showDeleteDialog = ref(false);
    const eventToDelete = ref(null);

    // Helper function to get next whole hour
    const getNextWholeHour = () => {
      const now = new Date();
      now.setHours(now.getHours() + 1, 0, 0, 0); // Next hour, 00 minutes
      return now;
    };

    // Format date for datetime-local input
    const formatDateTimeLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialize new event with default date/time
    const initializeNewEvent = () => {
      const startTime = getNextWholeHour();
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 3); // Default 3 hour event

      return {
        name: '',
        location: '',
        startDateTime: formatDateTimeLocal(startTime),
        endDateTime: formatDateTimeLocal(endTime),
      };
    };

    // New event form
    const newEvent = ref(initializeNewEvent());

    // Format date and time for display
    const formatDateTime = (dateTimeString) => {
      try {
        const date = new Date(dateTimeString);
        return date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } catch (error) {
        return dateTimeString;
      }
    };

    // Get event status based on current time
    const getEventStatus = (event) => {
      const now = new Date();
      const startTime = new Date(event.startDateTime);
      const endTime = new Date(event.endDateTime);

      if (now < startTime) {
        return 'upcoming';
      } else if (now >= startTime && now <= endTime) {
        return 'in-progress';
      } else {
        return 'ended';
      }
    };

    // Get event status color
    const getEventStatusColor = (status) => {
      switch (status) {
        case 'upcoming':
          return 'blue';
        case 'in-progress':
          return 'green';
        case 'ended':
          return 'grey-6';
        default:
          return 'grey';
      }
    };

    // Get event status display text
    const getEventStatusText = (status) => {
      switch (status) {
        case 'upcoming':
          return 'Upcoming';
        case 'in-progress':
          return 'In Progress';
        case 'ended':
          return 'Ended';
        default:
          return 'Unknown';
      }
    };

    // Load orders from Firebase
    const loadOrdersFromFirebase = async () => {
      try {
        const orders = await firebaseService.getOrders();
        allOrders.value = orders;
        console.log('Loaded orders from Firebase:', orders.length);
        console.log('Sample order:', orders[0]);
      } catch (error) {
        console.error('Error loading orders from Firebase:', error);
        allOrders.value = [];
      }
    };

    // Convert Firebase event to processed format
    const processEvent = (event) => {
      const processed = { ...event };
      if (processed.createdAt?.toDate) {
        processed.createdAt = processed.createdAt.toDate().toISOString();
      }
      if (processed.updatedAt?.toDate) {
        processed.updatedAt = processed.updatedAt.toDate().toISOString();
      }
      if (processed.checkedInAt?.toDate) {
        processed.checkedInAt = processed.checkedInAt.toDate().toISOString();
      }
      if (processed.checkedOutAt?.toDate) {
        processed.checkedOutAt = processed.checkedOutAt.toDate().toISOString();
      }
      return processed;
    };

    // Set up real-time listener for market events
    const setupRealtimeListener = () => {
      loading.value = true;
      try {
        const eventsRef = collection(db, 'marketEvents');
        const q = query(eventsRef, orderBy('startDateTime', 'desc'));

        console.log('Setting up real-time listener for market events...');

        unsubscribeEvents = onSnapshot(
          q,
          (snapshot) => {
            // Skip if this is just a metadata change (not actual data change)
            if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites) {
              console.log('Snapshot is from cache with pending writes, skipping...');
              return;
            }

            console.log('Real-time snapshot received:', {
              size: snapshot.size,
              empty: snapshot.empty,
              fromCache: snapshot.metadata.fromCache,
              hasPendingWrites: snapshot.metadata.hasPendingWrites,
            });

            const eventsList = [];
            snapshot.forEach((doc) => {
              const eventData = doc.data();
              console.log('Processing event:', doc.id, {
                name: eventData.name,
                location: eventData.location,
                checkedIn: eventData.checkedIn,
              });
              eventsList.push(processEvent({
                id: doc.id,
                ...eventData,
              }));
            });

            console.log('Market events updated in real-time:', {
              count: eventsList.length,
              events: eventsList.map(e => ({ id: e.id, name: e.name })),
            });

            events.value = eventsList;
            loading.value = false;

            // Update market event service cache
            marketEventService.eventsCache = eventsList;
            marketEventService.cacheTimestamp = Date.now();
          },
          (err) => {
            console.error('Real-time listener error:', err);
            console.error('Error code:', err?.code);
            console.error('Error message:', err?.message);
            console.error('Error details:', {
              code: err?.code,
              message: err?.message,
              stack: err?.stack,
            });
            loading.value = false;
            
            // Show error notification
            safeNotify({
              type: 'negative',
              message: 'Real-time listener error',
              caption: err?.message || 'Failed to connect to Firebase. Using fallback method.',
              position: 'top',
              timeout: 5000,
            });
            
            // Fallback to manual load
            loadEvents();
          }
        );
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        console.error('Error stack:', err?.stack);
        loading.value = false;
        // Fallback to manual load
        loadEvents();
      }
    };

    // Load events from Firebase (fallback method)
    const loadEvents = async () => {
      loading.value = true;
      try {
        console.log('Loading events from Firebase (fallback method)...');
        // Load events from Firebase
        const firebaseEvents = await firebaseService.getMarketEvents();
        
        console.log('Loaded events from Firebase:', {
          count: firebaseEvents.length,
          events: firebaseEvents.map(e => ({ id: e.id, name: e.name })),
        });
        
        // Convert Firebase timestamps to ISO strings for compatibility
        events.value = firebaseEvents.map(processEvent);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        // Also load orders from Firebase
        await loadOrdersFromFirebase();
      } catch (error) {
        console.error('Error loading events:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);
        events.value = [];
        
        // Show error notification
        safeNotify({
          type: 'negative',
          message: 'Failed to load market events',
          caption: error?.message || 'Please check your connection and try again',
          position: 'top',
          timeout: 5000,
        });
      } finally {
        loading.value = false;
      }
    };

    // Manual refresh function
    const refreshEvents = async () => {
      console.log('Manual refresh triggered');
      // Force refresh by clearing cache and reloading
      marketEventService.cacheTimestamp = null;
      await loadEvents();
    };

    // Get orders that occurred during an event
    const getEventOrders = (eventId) => {
      const event = events.value.find((e) => e.id === eventId);
      if (!event) {
        console.log('Event not found for ID:', eventId);
        return [];
      }

      try {
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime);

        console.log('Filtering orders for event:', event.name);
        console.log('Event start:', eventStart);
        console.log('Event end:', eventEnd);
        console.log('Total orders available:', allOrders.value.length);

        const filteredOrders = allOrders.value.filter((order) => {
          // Handle Firebase Timestamp objects
          let orderDate;
          if (order.submissionDate) {
            orderDate = order.submissionDate.toDate
              ? order.submissionDate.toDate()
              : new Date(order.submissionDate);
          } else if (order.createdAt) {
            orderDate = order.createdAt.toDate
              ? order.createdAt.toDate()
              : new Date(order.createdAt);
          } else {
            console.log('Order without valid timestamp:', order);
            return false; // Skip orders without valid timestamps
          }

          const isInRange = orderDate >= eventStart && orderDate <= eventEnd;
          if (isInRange) {
            console.log(
              'Order matches event timeframe:',
              order.orderNumber,
              orderDate
            );
          }

          return isInRange;
        });

        console.log('Filtered orders count:', filteredOrders.length);
        return filteredOrders;
      } catch (error) {
        console.error('Error getting event orders:', error);
        return [];
      }
    };

    // Get total magnets for an event
    const getEventTotalMagnets = (eventId) => {
      const eventOrders = getEventOrders(eventId);
      return eventOrders.reduce((total, order) => {
        return total + (order.photos?.length || 0);
      }, 0);
    };

    // Get total revenue for an event
    const getEventRevenue = (eventId) => {
      const eventOrders = getEventOrders(eventId);
      return eventOrders.reduce((total, order) => {
        return total + (order.totalAmount || 0);
      }, 0);
    };

    // Create new event
    const createEvent = async () => {
      if (
        !newEvent.value.name ||
        !newEvent.value.location ||
        !newEvent.value.startDateTime ||
        !newEvent.value.endDateTime
      ) {
        safeNotify({
          type: 'negative',
          message: 'Please fill in all fields',
          position: 'top',
        });
        return;
      }

      // Validate that end time is after start time
      if (
        new Date(newEvent.value.endDateTime) <=
        new Date(newEvent.value.startDateTime)
      ) {
        safeNotify({
          type: 'negative',
          message: 'End time must be after start time',
          position: 'top',
        });
        return;
      }

      creatingEvent.value = true;
      try {
        // Create event in Firebase
        const eventData = {
          name: newEvent.value.name.trim(),
          location: newEvent.value.location.trim(),
          startDateTime: newEvent.value.startDateTime,
          endDateTime: newEvent.value.endDateTime,
        };

        console.log('MarketEventsPage: Creating event with data:', eventData);

        // Create event in Firebase - real-time listener will update the list automatically
        const createdEvent = await firebaseService.createMarketEvent(eventData);
        
        console.log('MarketEventsPage: Event created, result:', createdEvent);
        console.log('MarketEventsPage: Waiting for real-time listener to update...');

        // Don't refresh cache manually - let the real-time listener handle it
        // The listener should pick up the new event within 1-2 seconds
        
        // Give the real-time listener a moment to update
        await new Promise(resolve => setTimeout(resolve, 500));

        safeNotify({
          type: 'positive',
          message: 'Event created successfully!',
          caption: `"${eventData.name}" has been saved to Firebase`,
          position: 'top',
          timeout: 3000,
        });

        cancelCreateEvent();
      } catch (error) {
        console.error('MarketEventsPage: Error creating event:', error);
        console.error('Error code:', error?.code);
        console.error('Error message:', error?.message);
        
        safeNotify({
          type: 'negative',
          message: 'Failed to create event',
          caption: error.message || error?.code || 'An error occurred. Check console for details.',
          position: 'top',
          timeout: 5000,
          actions: [
            { label: 'Dismiss', color: 'white' }
          ]
        });
      } finally {
        creatingEvent.value = false;
      }
    };

    // Open create event dialog with fresh defaults
    const openCreateEventDialog = () => {
      newEvent.value = initializeNewEvent();
      showCreateEventDialog.value = true;
    };

    // Cancel create event
    const cancelCreateEvent = () => {
      showCreateEventDialog.value = false;
      newEvent.value = initializeNewEvent();
    };

    // Check in to event
    const checkInToEvent = async (eventId) => {
      checkingIn.value = eventId;
      try {
        // Update in Firebase - real-time listener will update the list automatically
        await firebaseService.checkInToMarketEvent(eventId);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        const event = events.value.find((e) => e.id === eventId);
        safeNotify({
          type: 'positive',
          message: 'Successfully checked in!',
          caption: event?.name || 'Market Event',
          position: 'top',
          timeout: 3000,
        });
      } catch (error) {
        console.error('Error checking in:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to check in',
          caption: error.message || 'An error occurred',
          position: 'top',
        });
      } finally {
        checkingIn.value = null;
      }
    };

    // Check out of event
    const checkOutOfEvent = async (eventId) => {
      checkingIn.value = eventId;
      try {
        // Update in Firebase - real-time listener will update the list automatically
        await firebaseService.checkOutOfMarketEvent(eventId);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        const event = events.value.find((e) => e.id === eventId);
        safeNotify({
          type: 'positive',
          message: 'Successfully checked out!',
          caption: event?.name || 'Market Event',
          position: 'top',
          timeout: 3000,
        });
      } catch (error) {
        console.error('Error checking out:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to check out',
          caption: error.message || 'An error occurred',
          position: 'top',
        });
      } finally {
        checkingIn.value = null;
      }
    };

    // Undo check-out
    const undoCheckOut = async (eventId) => {
      checkingIn.value = eventId;
      try {
        // Update in Firebase - real-time listener will update the list automatically
        await firebaseService.undoCheckOutOfMarketEvent(eventId);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        const event = events.value.find((e) => e.id === eventId);
        safeNotify({
          type: 'info',
          message: 'Check-out undone',
          caption: event?.name || 'Market Event',
          position: 'top',
        });
      } catch (error) {
        console.error('Error undoing check-out:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to undo check-out',
          caption: error.message || 'An error occurred',
          position: 'top',
        });
      } finally {
        checkingIn.value = null;
      }
    };

    // Confirm delete event
    const confirmDeleteEvent = (event) => {
      eventToDelete.value = event;
      showDeleteDialog.value = true;
    };

    // Delete event
    const deleteEvent = async () => {
      if (!eventToDelete.value) return;

      deletingEvent.value = true;
      try {
        // Delete from Firebase - real-time listener will update the list automatically
        await firebaseService.deleteMarketEvent(eventToDelete.value.id);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        safeNotify({
          type: 'positive',
          message: 'Event deleted successfully',
          position: 'top',
        });
      } catch (error) {
        console.error('Error deleting event:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to delete event',
          caption: error.message || 'An error occurred',
          position: 'top',
        });
      } finally {
        deletingEvent.value = false;
        showDeleteDialog.value = false;
        eventToDelete.value = null;
      }
    };

    // Initialize
    onMounted(() => {
      setupRealtimeListener();
      loadOrdersFromFirebase();
    });

    onUnmounted(() => {
      if (unsubscribeEvents) {
        unsubscribeEvents();
        console.log('Market events real-time listener unsubscribed');
      }
    });

    return {
      // Data
      events,
      loading,
      creatingEvent,
      checkingIn,
      deletingEvent,
      showCreateEventDialog,
      showDeleteDialog,
      eventToDelete,
      newEvent,

      // Methods
      formatDateTime,
      getEventStatus,
      getEventStatusColor,
      getEventStatusText,
      getEventOrders,
      getEventTotalMagnets,
      getEventRevenue,
      openCreateEventDialog,
      createEvent,
      cancelCreateEvent,
      checkInToEvent,
      checkOutOfEvent,
      undoCheckOut,
      confirmDeleteEvent,
      deleteEvent,
      refreshEvents,
    };
  },
};
</script>

<style lang="scss" scoped>
.market-events-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.events-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.no-events {
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.events-grid {
  display: grid;
  gap: 1rem;
}

.event-card {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
}

.event-details {
  .row {
    align-items: center;
  }
}

.check-in-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.order-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

@media (max-width: 768px) {
  .market-events-page {
    padding: 0.5rem;
  }

  .page-header,
  .events-section {
    padding: 1rem;
  }

  .event-card {
    .row {
      flex-direction: column;
      align-items: stretch;
    }

    // Exception: Keep order stats in a row even on mobile
    .order-stats .row {
      flex-direction: row !important;
    }

    .col-auto {
      margin-top: 1rem;

      .q-btn-group {
        width: 100%;

        .q-btn {
          flex: 1;
        }
      }
    }
  }
}
</style>
