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
        <div class="text-h5 text-weight-bold q-mb-md">
          <q-icon name="calendar_month" class="q-mr-sm" />
          Market Events
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
                    <div class="col-auto q-gutter-xs status-chips">
                      <q-chip
                        v-if="event.isTesting"
                        color="orange"
                        text-color="white"
                        size="sm"
                        icon="science"
                      >
                        Testing
                      </q-chip>
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
                        <q-chip
                          v-if="eventHasCoordinates(event)"
                          dense
                          color="positive"
                          text-color="white"
                          size="sm"
                          icon="pin_drop"
                          class="q-ml-sm"
                        >
                          Pin set
                        </q-chip>
                        <q-chip
                          v-else
                          dense
                          color="warning"
                          text-color="black"
                          size="sm"
                          icon="location_off"
                          class="q-ml-sm"
                        >
                          No map pin — “at event” distance won’t work
                        </q-chip>
                        <div
                          v-if="eventHasCoordinates(event)"
                          class="text-caption text-grey-6 q-mt-xs q-pl-sm"
                        >
                          {{ formatCoordPair(event.coordinates) }}
                        </div>
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
                    <div class="row q-gutter-md event-order-cards no-wrap">
                      <div class="col event-order-card-col">
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
                      <div class="col event-order-card-col">
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
                      <div class="col event-order-card-col">
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

                <div class="col-auto action-buttons">
                  <q-btn
                    v-if="!event.checkedIn"
                    color="green"
                    icon="check_circle"
                    label="Check In"
                    size="sm"
                    @click="checkInToEvent(event.id)"
                    :loading="checkingIn === event.id"
                    class="action-btn"
                  />
                  <q-btn
                    v-else-if="event.checkedIn && !event.checkedOut"
                    color="blue"
                    icon="exit_to_app"
                    label="Check Out"
                    size="sm"
                    @click="checkOutOfEvent(event.id)"
                    :loading="checkingIn === event.id"
                    class="action-btn"
                  />
                  <q-btn
                    v-else-if="event.checkedOut"
                    color="grey-6"
                    icon="undo"
                    label="Undo Check-out"
                    size="sm"
                    @click="undoCheckOut(event.id)"
                    :loading="checkingIn === event.id"
                    class="action-btn"
                  />
                  <q-btn
                    color="primary"
                    icon="edit"
                    label="Edit"
                    size="sm"
                    @click="openEditEventDialog(event)"
                    class="action-btn"
                  />
                  <q-btn
                    color="negative"
                    icon="delete"
                    label="Delete"
                    size="sm"
                    @click="confirmDeleteEvent(event)"
                    class="action-btn"
                  />
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

            <GooglePlacesAutocomplete
              v-model="newEvent.location"
              label="Location/Address"
              :types="marketEventPlaceTypes"
              :rules="[(val) => !!val || 'Location is required']"
              hint="Search for a venue or address — pick a suggestion for an accurate map pin"
              filled
              @place-selected="onCreatePlaceSelected"
              @update:model-value="onCreateLocationInput"
            />

            <div class="q-mt-sm q-mb-xs">
              <q-chip
                v-if="createDialogPinReady"
                dense
                color="positive"
                text-color="white"
                size="sm"
                icon="pin_drop"
              >
                Map pin ready
              </q-chip>
              <q-chip
                v-else-if="createShowPlaceNoCoords"
                dense
                color="deep-orange"
                text-color="white"
                size="sm"
                icon="place"
              >
                Address set — Google returned no coordinates
              </q-chip>
              <q-chip
                v-else
                dense
                color="warning"
                text-color="black"
                size="sm"
                icon="warning"
              >
                No map pin yet — required to save
              </q-chip>
            </div>
            <div
              v-if="createCoordPreview"
              class="text-body2 q-pa-sm rounded-borders bg-grey-2 q-mb-sm"
            >
              <strong>Coordinates:</strong>
              {{ formatCoordPair(createCoordPreview) }}
              <span class="text-caption text-grey-7 q-ml-xs">
                ({{ createCoordPreviewSourceLabel }})
              </span>
            </div>
            <div
              v-else-if="createShowPlaceNoCoords"
              class="text-caption text-deep-orange q-mb-sm"
            >
              Use “Use my location” or enter latitude/longitude below.
            </div>
            <div class="row q-gutter-sm q-mb-md">
              <q-btn
                outline
                color="primary"
                dense
                icon="my_location"
                label="Use my location"
                :loading="loadingCreateLocation"
                @click="useMyLocationForCreate"
              />
              <q-btn
                flat
                dense
                color="grey-8"
                :label="createShowManualCoords ? 'Hide manual coordinates' : 'Enter coordinates manually'"
                @click="createShowManualCoords = !createShowManualCoords"
              />
            </div>
            <div v-show="createShowManualCoords" class="row q-gutter-md q-mb-md">
              <div class="col">
                <q-input
                  v-model="createManualLat"
                  label="Latitude"
                  hint="-90 to 90"
                  filled
                  dense
                />
              </div>
              <div class="col">
                <q-input
                  v-model="createManualLng"
                  label="Longitude"
                  hint="-180 to 180"
                  filled
                  dense
                />
              </div>
            </div>

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

            <q-input
              v-model="newEvent.eventLink"
              label="Event Details Link (Optional)"
              hint="Add a link to event details, social media post, or website"
              type="url"
              filled
            />

            <q-toggle
              v-model="newEvent.isTesting"
              label="Testing Only (visible to admins only)"
              color="orange"
            />
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

    <!-- Edit Event Dialog -->
    <q-dialog v-model="showEditEventDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Edit Market Event</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="updateEvent" class="q-gutter-md">
            <q-input
              v-model="editingEvent.name"
              label="Event Name"
              :rules="[(val) => !!val || 'Event name is required']"
              filled
            />

            <GooglePlacesAutocomplete
              v-model="editingEvent.location"
              label="Location/Address"
              :types="marketEventPlaceTypes"
              :rules="[(val) => !!val || 'Location is required']"
              hint="Search for a venue or address — pick a suggestion to update the pin"
              filled
              @place-selected="onEditPlaceSelected"
              @update:model-value="onEditLocationInput"
            />

            <div class="q-mt-sm q-mb-xs">
              <q-chip
                v-if="editDialogPinReady"
                dense
                color="positive"
                text-color="white"
                size="sm"
                icon="pin_drop"
              >
                Map pin ready
              </q-chip>
              <q-chip
                v-else-if="editShowPlaceNoCoords"
                dense
                color="deep-orange"
                text-color="white"
                size="sm"
                icon="place"
              >
                Address set — Google returned no coordinates
              </q-chip>
              <q-chip
                v-else-if="editLocationUnchanged"
                dense
                color="info"
                text-color="white"
                size="sm"
                icon="info"
              >
                Address unchanged — existing pin will be kept
              </q-chip>
              <q-chip
                v-else
                dense
                color="warning"
                text-color="black"
                size="sm"
                icon="warning"
              >
                Address changed — set a new pin (pick place, GPS, or manual)
              </q-chip>
            </div>
            <div
              v-if="editCoordPreview"
              class="text-body2 q-pa-sm rounded-borders bg-grey-2 q-mb-sm"
            >
              <strong>Coordinates:</strong>
              {{ formatCoordPair(editCoordPreview) }}
              <span class="text-caption text-grey-7 q-ml-xs">
                ({{ editCoordPreviewSourceLabel }})
              </span>
            </div>
            <div
              v-else-if="editShowPlaceNoCoords"
              class="text-caption text-deep-orange q-mb-sm"
            >
              Use “Use my location” or enter latitude/longitude below.
            </div>
            <div class="row q-gutter-sm q-mb-md">
              <q-btn
                outline
                color="primary"
                dense
                icon="my_location"
                label="Use my location"
                :loading="loadingEditLocation"
                @click="useMyLocationForEdit"
              />
              <q-btn
                flat
                dense
                color="grey-8"
                :label="editShowManualCoords ? 'Hide manual coordinates' : 'Enter coordinates manually'"
                @click="editShowManualCoords = !editShowManualCoords"
              />
            </div>
            <div v-show="editShowManualCoords" class="row q-gutter-md q-mb-md">
              <div class="col">
                <q-input
                  v-model="editManualLat"
                  label="Latitude"
                  hint="-90 to 90"
                  filled
                  dense
                />
              </div>
              <div class="col">
                <q-input
                  v-model="editManualLng"
                  label="Longitude"
                  hint="-180 to 180"
                  filled
                  dense
                />
              </div>
            </div>

            <div class="row q-gutter-md">
              <div class="col">
                <q-input
                  v-model="editingEvent.startDateTime"
                  type="datetime-local"
                  label="Event Start Date & Time"
                  :rules="[(val) => !!val || 'Start date and time is required']"
                  filled
                />
              </div>
              <div class="col">
                <q-input
                  v-model="editingEvent.endDateTime"
                  type="datetime-local"
                  label="Event End Date & Time"
                  :rules="[(val) => !!val || 'End date and time is required']"
                  filled
                />
              </div>
            </div>

            <q-input
              v-model="editingEvent.eventLink"
              label="Event Details Link (Optional)"
              hint="Add a link to event details, social media post, or website"
              type="url"
              filled
            />

            <q-toggle
              v-model="editingEvent.isTesting"
              label="Testing Only (visible to admins only)"
              color="orange"
            />

            <q-separator class="q-my-md" />

            <div class="text-subtitle2 text-weight-medium q-mb-sm">
              Frames for this event
            </div>
            <div class="text-caption text-grey-7 q-mb-sm">
              Select which frames customers can use during photo upload at this event.
              <router-link to="/frame-library" class="text-primary">Manage frames in Frame Library</router-link>
            </div>
            <div v-if="libraryFramesLoading" class="q-py-md text-center">
              <q-spinner color="primary" size="24px" />
            </div>
            <div v-else-if="!libraryFrames.length" class="text-body2 text-grey-7 q-mb-sm">
              No frames in the library yet. Add frames in the Frame Library first.
            </div>
            <div v-else class="event-frame-picker q-mb-sm">
              <button
                v-for="frame in libraryFrames"
                :key="frame.id"
                type="button"
                class="event-frame-option"
                :class="{ 'event-frame-option--selected': isFrameSelected(frame.id) }"
                @click="toggleFrameSelection(frame.id)"
              >
                <img :src="frame.imageUrl" :alt="frame.name" class="event-frame-option-image" />
                <span class="event-frame-option-label">{{ frame.name }}</span>
                <q-icon
                  v-if="isFrameSelected(frame.id)"
                  name="check_circle"
                  color="primary"
                  size="16px"
                  class="event-frame-option-check"
                />
              </button>
            </div>
            <div v-if="editingEvent.selectedFrameIds?.length" class="text-caption text-grey-7">
              {{ editingEvent.selectedFrameIds.length }} frame(s) selected
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="cancelEditEvent" />
          <q-btn
            type="submit"
            color="primary"
            label="Update Event"
            :loading="creatingEvent"
            @click.prevent="updateEvent"
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useQuasar, useMeta } from 'quasar';
import { firebaseService } from '../services/firebaseService';
import { marketEventService } from '../services/marketEventService.js';
import { getLibraryFrames } from '../services/frameCatalogService.js';
import { authService } from '../services/authService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import GooglePlacesAutocomplete from '../components/GooglePlacesAutocomplete.vue';
import {
  getUserLocation,
  reverseGeocodeCoordinates,
} from '../utils/geolocation.js';

export default {
  name: 'MarketEventsPage',
  components: {
    GooglePlacesAutocomplete,
  },
  setup() {
    useMeta({
      title: 'Market Events Admin - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Create and manage market events. Admin interface for scheduling and tracking market event attendance.'
        },
        robots: {
          name: 'robots',
          content: 'noindex, nofollow'
        }
      }
    });

    const $q = useQuasar();

    // Reactive data
    const events = ref([]);
    const loading = ref(false);
    const creatingEvent = ref(false);
    const checkingIn = ref(null);
    const deletingEvent = ref(false);
    const allOrders = ref([]);
    let unsubscribeEvents = null;

    // Filter events based on admin status
    const isAdmin = computed(() => authService.isAdmin());
    const filteredEvents = computed(() => {
      if (isAdmin.value) {
        // Admins see all events
        return events.value;
      }
      // Non-admins don't see testing events
      return events.value.filter(event => !event.isTesting);
    });

    // Dialog states
    const showCreateEventDialog = ref(false);
    const showEditEventDialog = ref(false);
    const showDeleteDialog = ref(false);
    const eventToDelete = ref(null);
    const editingEvent = ref(null);
    const libraryFrames = ref([]);
    const libraryFramesLoading = ref(false);

    // Helper function to get 15 min increment before current time
    const getPrevious15MinIncrement = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const roundedMinutes = Math.floor(minutes / 15) * 15; // Round down to nearest 15 min
      now.setMinutes(roundedMinutes, 0, 0); // Set to rounded minutes, 0 seconds
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
      const startTime = getPrevious15MinIncrement();
      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 3); // Default 3 hour event

      return {
        name: '',
        location: '',
        startDateTime: formatDateTimeLocal(startTime),
        endDateTime: formatDateTimeLocal(endTime),
        eventLink: '',
        isTesting: false,
      };
    };

    // New event form
    const newEvent = ref(initializeNewEvent());

    const marketEventPlaceTypes = ['establishment', 'geocode'];

    const parseManualCoords = (latStr, lngStr) => {
      const lat = parseFloat(String(latStr ?? '').trim());
      const lng = parseFloat(String(lngStr ?? '').trim());
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
      return { lat, lng };
    };

    const normalizeEventCoordinates = (event) => {
      const c = event?.coordinates;
      if (!c) return null;
      const lat =
        c.lat != null
          ? Number(c.lat)
          : c.latitude != null
            ? Number(c.latitude)
            : NaN;
      const lng =
        c.lng != null
          ? Number(c.lng)
          : c.longitude != null
            ? Number(c.longitude)
            : NaN;
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng };
    };

    const eventHasCoordinates = (event) =>
      normalizeEventCoordinates(event) != null;

    const formatCoordPair = (coords) => {
      if (!coords) return '';
      const lat = coords.lat != null ? coords.lat : coords.latitude;
      const lng = coords.lng != null ? coords.lng : coords.longitude;
      if (lat == null || lng == null) return '';
      return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
    };

    const coordsObjValid = (p) =>
      p != null &&
      !Number.isNaN(Number(p.lat)) &&
      !Number.isNaN(Number(p.lng));

    const createPendingCoords = ref(null);
    const createManualLat = ref('');
    const createManualLng = ref('');
    const createAnchorAddress = ref('');
    const createCoordsSource = ref(null);
    const createShowManualCoords = ref(false);
    const loadingCreateLocation = ref(false);

    const editPendingCoords = ref(null);
    const editManualLat = ref('');
    const editManualLng = ref('');
    const editOriginalLocation = ref('');
    const editAnchorAddress = ref('');
    const editCoordsSource = ref(null);
    const editShowManualCoords = ref(false);
    const loadingEditLocation = ref(false);

    const resetCreateCoordinateState = () => {
      createPendingCoords.value = null;
      createManualLat.value = '';
      createManualLng.value = '';
      createAnchorAddress.value = '';
      createCoordsSource.value = null;
      createShowManualCoords.value = false;
    };

    const resetEditCoordinateState = () => {
      editPendingCoords.value = null;
      editManualLat.value = '';
      editManualLng.value = '';
      editOriginalLocation.value = '';
      editAnchorAddress.value = '';
      editCoordsSource.value = null;
      editShowManualCoords.value = false;
    };

    const onCreatePlaceSelected = (placeData) => {
      const addr =
        placeData?.formattedAddress ||
        placeData?.formatted_address ||
        '';
      if (addr) {
        newEvent.value = { ...newEvent.value, location: addr };
      }
      // Selecting a place always overwrites GPS / manual coords
      createManualLat.value = '';
      createManualLng.value = '';

      const hasGeom =
        placeData?.coordinates != null &&
        placeData.coordinates.lat != null &&
        placeData.coordinates.lng != null;

      if (hasGeom) {
        createPendingCoords.value = {
          lat: Number(placeData.coordinates.lat),
          lng: Number(placeData.coordinates.lng),
        };
        createAnchorAddress.value = addr || newEvent.value.location || '';
        createCoordsSource.value = 'place';
      } else {
        createPendingCoords.value = null;
        createAnchorAddress.value = addr || newEvent.value.location || '';
        createCoordsSource.value = 'place_no_coords';
      }
    };

    const onCreateLocationInput = (val) => {
      const src = createCoordsSource.value;
      if (
        (src === 'place' || src === 'place_no_coords') &&
        createAnchorAddress.value &&
        val !== createAnchorAddress.value
      ) {
        createPendingCoords.value = null;
        createCoordsSource.value = null;
        createAnchorAddress.value = '';
      }
    };

    const onEditPlaceSelected = (placeData) => {
      const addr =
        placeData?.formattedAddress ||
        placeData?.formatted_address ||
        '';
      if (addr && editingEvent.value) {
        editingEvent.value = { ...editingEvent.value, location: addr };
      }
      editManualLat.value = '';
      editManualLng.value = '';

      const hasGeom =
        placeData?.coordinates != null &&
        placeData.coordinates.lat != null &&
        placeData.coordinates.lng != null;

      if (hasGeom) {
        editPendingCoords.value = {
          lat: Number(placeData.coordinates.lat),
          lng: Number(placeData.coordinates.lng),
        };
        editAnchorAddress.value =
          addr || editingEvent.value?.location || '';
        editCoordsSource.value = 'place';
      } else {
        editPendingCoords.value = null;
        editAnchorAddress.value =
          addr || editingEvent.value?.location || '';
        editCoordsSource.value = 'place_no_coords';
      }
    };

    const onEditLocationInput = (val) => {
      const src = editCoordsSource.value;
      if (
        (src === 'place' || src === 'place_no_coords') &&
        editAnchorAddress.value &&
        val !== editAnchorAddress.value
      ) {
        editPendingCoords.value = null;
        editCoordsSource.value = null;
        editAnchorAddress.value = '';
      }
    };

    const useMyLocationForCreate = async () => {
      loadingCreateLocation.value = true;
      try {
        const loc = await getUserLocation();
        createManualLat.value = '';
        createManualLng.value = '';
        createPendingCoords.value = { lat: loc.lat, lng: loc.lng };
        createCoordsSource.value = 'gps';

        let address = '';
        try {
          address = await reverseGeocodeCoordinates(loc.lat, loc.lng);
        } catch (geoErr) {
          console.warn('Reverse geocode failed, using coordinates as location label:', geoErr);
          address = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
        }
        newEvent.value = { ...newEvent.value, location: address };
        createAnchorAddress.value = address;

        $q.notify({
          type: 'positive',
          message: 'Location captured',
          caption: address,
          position: 'top',
        });
      } catch (e) {
        console.error(e);
        $q.notify({
          type: 'negative',
          message: 'Could not get your location',
          caption: e.message || 'Allow location permission and try again',
          position: 'top',
        });
      } finally {
        loadingCreateLocation.value = false;
      }
    };

    const useMyLocationForEdit = async () => {
      loadingEditLocation.value = true;
      try {
        const loc = await getUserLocation();
        editManualLat.value = '';
        editManualLng.value = '';
        editPendingCoords.value = { lat: loc.lat, lng: loc.lng };
        editCoordsSource.value = 'gps';

        let address = '';
        try {
          address = await reverseGeocodeCoordinates(loc.lat, loc.lng);
        } catch (geoErr) {
          console.warn('Reverse geocode failed, using coordinates as location label:', geoErr);
          address = `${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`;
        }
        if (editingEvent.value) {
          editingEvent.value = {
            ...editingEvent.value,
            location: address,
          };
        }
        editAnchorAddress.value = address;

        $q.notify({
          type: 'positive',
          message: 'Location captured',
          caption: address,
          position: 'top',
        });
      } catch (e) {
        console.error(e);
        $q.notify({
          type: 'negative',
          message: 'Could not get your location',
          caption: e.message || 'Allow location permission and try again',
          position: 'top',
        });
      } finally {
        loadingEditLocation.value = false;
      }
    };

    const createShowPlaceNoCoords = computed(
      () => createCoordsSource.value === 'place_no_coords'
    );

    const createCoordPreview = computed(() => {
      if (
        createCoordsSource.value === 'place' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return createPendingCoords.value;
      }
      const manual = parseManualCoords(
        createManualLat.value,
        createManualLng.value
      );
      if (manual) return manual;
      if (
        createCoordsSource.value === 'gps' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return createPendingCoords.value;
      }
      return null;
    });

    const createCoordPreviewSourceLabel = computed(() => {
      if (
        createCoordsSource.value === 'place' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return 'selected place (Google)';
      }
      if (parseManualCoords(createManualLat.value, createManualLng.value)) {
        return 'manual entry';
      }
      if (createCoordsSource.value === 'gps') return 'your device (GPS)';
      return '';
    });

    const createDialogPinReady = computed(() => {
      if (
        createCoordsSource.value === 'place' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return true;
      }
      if (parseManualCoords(createManualLat.value, createManualLng.value)) {
        return true;
      }
      if (
        createCoordsSource.value === 'gps' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return true;
      }
      return false;
    });

    const editLocationUnchanged = computed(() => {
      if (!editingEvent.value) return false;
      return editingEvent.value.location === editOriginalLocation.value;
    });

    const editShowPlaceNoCoords = computed(
      () => editCoordsSource.value === 'place_no_coords'
    );

    const editCoordPreview = computed(() => {
      if (
        editCoordsSource.value === 'place' &&
        coordsObjValid(editPendingCoords.value)
      ) {
        return editPendingCoords.value;
      }
      const manual = parseManualCoords(editManualLat.value, editManualLng.value);
      if (manual) return manual;
      if (
        editCoordsSource.value === 'gps' &&
        coordsObjValid(editPendingCoords.value)
      ) {
        return editPendingCoords.value;
      }
      return null;
    });

    const editCoordPreviewSourceLabel = computed(() => {
      if (
        editCoordsSource.value === 'place' &&
        coordsObjValid(editPendingCoords.value)
      ) {
        return 'selected place (Google)';
      }
      if (parseManualCoords(editManualLat.value, editManualLng.value)) {
        return 'manual entry';
      }
      if (editCoordsSource.value === 'gps') return 'your device (GPS)';
      return '';
    });

    const editDialogPinReady = computed(() => {
      if (editLocationUnchanged.value) return true;
      if (
        editCoordsSource.value === 'place' &&
        coordsObjValid(editPendingCoords.value)
      ) {
        return true;
      }
      if (parseManualCoords(editManualLat.value, editManualLng.value)) {
        return true;
      }
      if (
        editCoordsSource.value === 'gps' &&
        coordsObjValid(editPendingCoords.value)
      ) {
        return true;
      }
      return false;
    });

    const resolveCoordinatesForCreate = () => {
      if (
        createCoordsSource.value === 'place' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return {
          lat: Number(createPendingCoords.value.lat),
          lng: Number(createPendingCoords.value.lng),
        };
      }
      const manual = parseManualCoords(
        createManualLat.value,
        createManualLng.value
      );
      if (manual) return manual;
      if (
        createCoordsSource.value === 'gps' &&
        coordsObjValid(createPendingCoords.value)
      ) {
        return {
          lat: Number(createPendingCoords.value.lat),
          lng: Number(createPendingCoords.value.lng),
        };
      }
      return null;
    };

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

        unsubscribeEvents = onSnapshot(
          q,
          (snapshot) => {
            const eventsList = [];
            snapshot.forEach((doc) => {
              eventsList.push(processEvent({
                id: doc.id,
                ...doc.data(),
              }));
            });

            events.value = eventsList;
            loading.value = false;

            // Update market event service cache
            marketEventService.eventsCache = eventsList;
            marketEventService.cacheTimestamp = Date.now();

            console.log('Market events updated in real-time:', eventsList.length);
          },
          (err) => {
            console.error('Real-time listener error:', err);
            loading.value = false;
            // Fallback to manual load
            loadEvents();
          }
        );
      } catch (err) {
        console.error('Error setting up real-time listener:', err);
        loading.value = false;
        // Fallback to manual load
        loadEvents();
      }
    };

    // Load events from Firebase (fallback method)
    const loadEvents = async () => {
      loading.value = true;
      try {
        // Load events from Firebase
        const firebaseEvents = await firebaseService.getMarketEvents();

        // Convert Firebase timestamps to ISO strings for compatibility
        events.value = firebaseEvents.map(processEvent);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        // Also load orders from Firebase
        await loadOrdersFromFirebase();
      } catch (error) {
        console.error('Error loading events:', error);
        events.value = [];
      } finally {
        loading.value = false;
      }
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
          if (order.submissionDateClient) {
            // Prefer submissionDateClient if available
            orderDate = new Date(order.submissionDateClient);
          } else if (order.submissionDate) {
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

          // Check if date is valid
          if (isNaN(orderDate.getTime())) {
            console.log('Invalid date for order:', order.orderNumber);
            return false;
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

    // Get total magnets for an event (sum of all magnets in all orders)
    const getEventTotalMagnets = (eventId) => {
      const eventOrders = getEventOrders(eventId);
      return eventOrders.reduce((total, order) => {
        // Prefer order-level totalMagnets if set
        if (order.totalMagnets != null && !isNaN(order.totalMagnets)) {
          return total + Number(order.totalMagnets);
        }
        if (order.cartItems?.length) {
          const orderMagnets = order.cartItems.reduce((itemTotal, item) => {
            const qty = item.quantity ?? item.totalMagnets ?? (item.photos?.length || 0);
            return itemTotal + (Number(qty) || 0);
          }, 0);
          return total + orderMagnets;
        }
        if (order.photos?.length) {
          return total + order.photos.length;
        }
        return total;
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
      const locationTrim = String(newEvent.value.location || '').trim();

      if (
        !newEvent.value.name ||
        !locationTrim ||
        !newEvent.value.startDateTime ||
        !newEvent.value.endDateTime
      ) {
        try {
          $q.notify({
            type: 'negative',
            message: 'Please fill in all fields',
            caption: `Missing: ${!newEvent.value.name ? 'Name ' : ''}${!locationTrim ? 'Location ' : ''}${!newEvent.value.startDateTime ? 'Start Time ' : ''}${!newEvent.value.endDateTime ? 'End Time' : ''}`,
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
        return;
      }

      // Validate that end time is after start time
      if (
        new Date(newEvent.value.endDateTime) <=
        new Date(newEvent.value.startDateTime)
      ) {
        try {
          $q.notify({
            type: 'negative',
            message: 'End time must be after start time',
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
        return;
      }

      creatingEvent.value = true;
      try {
        const coordinates = resolveCoordinatesForCreate();
        if (!coordinates) {
          try {
            $q.notify({
              type: 'warning',
              message: 'Map pin required',
              caption:
                'Pick a place from suggestions, use “Use my location”, or enter latitude/longitude.',
              position: 'top',
            });
          } catch (notifyErr) {
            console.error('Notification error:', notifyErr);
          }
          return;
        }

        const eventData = {
          name: newEvent.value.name,
          location: locationTrim,
          coordinates,
          startDateTime: newEvent.value.startDateTime,
          endDateTime: newEvent.value.endDateTime,
          eventLink: newEvent.value.eventLink || null,
          isTesting: newEvent.value.isTesting || false,
        };

        console.log('[Event Creation] Event data to save:', JSON.stringify(eventData, null, 2));

        // Create event in Firebase - real-time listener will update the list automatically
        await firebaseService.createMarketEvent(eventData);

        // Refresh market event service cache (real-time listener will update events.value)
        await marketEventService.refreshCache();

        try {
          $q.notify({
            type: 'positive',
            message: 'Event created successfully!',
            caption: eventData.name,
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }

        cancelCreateEvent();
      } catch (error) {
        console.error('Error creating event:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to create event',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
      } finally {
        creatingEvent.value = false;
      }
    };

    // Open create event dialog with fresh defaults
    const openCreateEventDialog = () => {
      newEvent.value = initializeNewEvent();
      resetCreateCoordinateState();
      showCreateEventDialog.value = true;
    };

    // Cancel create event
    const cancelCreateEvent = () => {
      showCreateEventDialog.value = false;
      newEvent.value = initializeNewEvent();
      resetCreateCoordinateState();
    };

    // Open edit event dialog
    const openEditEventDialog = async (event) => {
      resetEditCoordinateState();
      editingEvent.value = {
        id: event.id,
        name: event.name,
        location: event.location,
        startDateTime: formatDateTimeLocal(new Date(event.startDateTime)),
        endDateTime: formatDateTimeLocal(new Date(event.endDateTime)),
        eventLink: event.eventLink || '',
        isTesting: event.isTesting || false,
        selectedFrameIds: Array.isArray(event.selectedFrameIds)
          ? [...event.selectedFrameIds]
          : Array.isArray(event.frames)
            ? event.frames.map((frame) => frame.id).filter(Boolean)
            : [],
        frameSortOrder: Array.isArray(event.frameSortOrder)
          ? [...event.frameSortOrder]
          : [],
      };
      editOriginalLocation.value = event.location || '';
      libraryFramesLoading.value = true;
      try {
        libraryFrames.value = await getLibraryFrames();
      } finally {
        libraryFramesLoading.value = false;
      }
      showEditEventDialog.value = true;
    };

    // Cancel edit event
    const cancelEditEvent = () => {
      showEditEventDialog.value = false;
      editingEvent.value = null;
      resetEditCoordinateState();
    };

    const isFrameSelected = (frameId) =>
      editingEvent.value?.selectedFrameIds?.includes(frameId) ?? false;

    const toggleFrameSelection = (frameId) => {
      if (!editingEvent.value) return;
      const current = [...(editingEvent.value.selectedFrameIds || [])];
      const index = current.indexOf(frameId);
      if (index >= 0) {
        current.splice(index, 1);
      } else {
        current.push(frameId);
      }
      editingEvent.value = {
        ...editingEvent.value,
        selectedFrameIds: current,
        frameSortOrder: current,
      };
    };

    // Update event
    const updateEvent = async () => {
      const editLocationTrim = String(
        editingEvent.value?.location || ''
      ).trim();
      if (
        !editingEvent.value.name ||
        !editLocationTrim ||
        !editingEvent.value.startDateTime ||
        !editingEvent.value.endDateTime
      ) {
        try {
          $q.notify({
            type: 'negative',
            message: 'Please fill in all fields',
            caption: !editLocationTrim ? 'Location is required' : undefined,
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
        return;
      }
      if (editLocationTrim !== editingEvent.value.location) {
        editingEvent.value = {
          ...editingEvent.value,
          location: editLocationTrim,
        };
      }

      // Validate that end time is after start time
      if (
        new Date(editingEvent.value.endDateTime) <=
        new Date(editingEvent.value.startDateTime)
      ) {
        try {
          $q.notify({
            type: 'negative',
            message: 'End time must be after start time',
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
        return;
      }

      creatingEvent.value = true;
      try {
        const manual = parseManualCoords(
          editManualLat.value,
          editManualLng.value
        );
        const locationUnchanged =
          editingEvent.value.location === editOriginalLocation.value;

        let coordinatesPayload;
        if (
          editCoordsSource.value === 'place' &&
          coordsObjValid(editPendingCoords.value)
        ) {
          coordinatesPayload = {
            lat: Number(editPendingCoords.value.lat),
            lng: Number(editPendingCoords.value.lng),
          };
        } else if (manual) {
          coordinatesPayload = manual;
        } else if (
          editCoordsSource.value === 'gps' &&
          coordsObjValid(editPendingCoords.value)
        ) {
          coordinatesPayload = {
            lat: Number(editPendingCoords.value.lat),
            lng: Number(editPendingCoords.value.lng),
          };
        } else if (locationUnchanged) {
          coordinatesPayload = undefined;
        } else {
          try {
            $q.notify({
              type: 'negative',
              message: 'Set a map pin for the new address',
              caption:
                'Pick a place from the list, use GPS, or enter coordinates manually.',
              position: 'top',
            });
          } catch (notifyErr) {
            console.error('Notification error:', notifyErr);
          }
          return;
        }

        const eventData = {
          name: editingEvent.value.name,
          location: editingEvent.value.location,
          startDateTime: editingEvent.value.startDateTime,
          endDateTime: editingEvent.value.endDateTime,
          eventLink: editingEvent.value.eventLink || null,
          isTesting: editingEvent.value.isTesting || false,
          selectedFrameIds: editingEvent.value.selectedFrameIds || [],
          frameSortOrder: editingEvent.value.frameSortOrder || editingEvent.value.selectedFrameIds || [],
        };
        if (coordinatesPayload !== undefined) {
          eventData.coordinates = coordinatesPayload;
        }

        console.log('[Event Update] Event data to save:', JSON.stringify(eventData, null, 2));

        // Update event in Firebase - real-time listener will update the list automatically
        await firebaseService.updateMarketEvent(editingEvent.value.id, eventData);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        try {
          $q.notify({
            type: 'positive',
            message: 'Event updated successfully!',
            caption: eventData.name,
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }

        cancelEditEvent();
      } catch (error) {
        console.error('Error updating event:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to update event',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
      } finally {
        creatingEvent.value = false;
      }
    };

    // Check in to event
    const checkInToEvent = async (eventId) => {
      checkingIn.value = eventId;
      try {
        // Update in Firebase - real-time listener will update the list automatically
        await firebaseService.checkInToMarketEvent(eventId);

        // Refresh market event service cache
        await marketEventService.refreshCache();

        try {
          const event = events.value.find((e) => e.id === eventId);
          $q.notify({
            type: 'positive',
            message: 'Successfully checked in!',
            caption: event?.name || 'Market Event',
            position: 'top',
            timeout: 3000,
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
      } catch (error) {
        console.error('Error checking in:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to check in',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
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

        try {
          const event = events.value.find((e) => e.id === eventId);
          $q.notify({
            type: 'positive',
            message: 'Successfully checked out!',
            caption: event?.name || 'Market Event',
            position: 'top',
            timeout: 3000,
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
      } catch (error) {
        console.error('Error checking out:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to check out',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
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

        try {
          const event = events.value.find((e) => e.id === eventId);
          $q.notify({
            type: 'info',
            message: 'Check-out undone',
            caption: event?.name || 'Market Event',
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
      } catch (error) {
        console.error('Error undoing check-out:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to undo check-out',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
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

        try {
          $q.notify({
            type: 'positive',
            message: 'Event deleted successfully',
            position: 'top',
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to delete event',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
        }
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
      // Data - use filteredEvents so non-admins don't see testing events
      events: filteredEvents,
      loading,
      creatingEvent,
      checkingIn,
      deletingEvent,
      showCreateEventDialog,
      showEditEventDialog,
      showDeleteDialog,
      eventToDelete,
      editingEvent,
      libraryFrames,
      libraryFramesLoading,
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
      openEditEventDialog,
      updateEvent,
      cancelEditEvent,
      isFrameSelected,
      toggleFrameSelection,
      checkInToEvent,
      checkOutOfEvent,
      undoCheckOut,
      confirmDeleteEvent,
      deleteEvent,

      marketEventPlaceTypes,
      eventHasCoordinates,
      formatCoordPair,
      createDialogPinReady,
      createShowPlaceNoCoords,
      createCoordPreview,
      createCoordPreviewSourceLabel,
      editDialogPinReady,
      editShowPlaceNoCoords,
      editCoordPreview,
      editCoordPreviewSourceLabel,
      editLocationUnchanged,
      createShowManualCoords,
      editShowManualCoords,
      createManualLat,
      createManualLng,
      editManualLat,
      editManualLng,
      loadingCreateLocation,
      loadingEditLocation,
      onCreatePlaceSelected,
      onCreateLocationInput,
      onEditPlaceSelected,
      onEditLocationInput,
      useMyLocationForCreate,
      useMyLocationForEdit,
    };
  },
};
</script>

<style lang="scss" scoped>
.market-events-page {
  // Use same plaid background as main page - inherited from .q-page-container
  background: transparent;
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

.event-frame-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.event-frame-option {
  width: 88px;
  padding: 6px;
  border: 2px solid #bdbdbd;
  border-radius: 0;
  background: #fff;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  position: relative;

  &--selected {
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.35);
  }
}

.event-frame-option-image {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.event-frame-option-label {
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
  color: #555;
}

.event-frame-option-check {
  position: absolute;
  top: 2px;
  right: 2px;
}

.event-frame-thumb {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: #fafafa;
}

// Status chips - keep pill shape and add margin to separate from buttons
.status-chips {
  margin-right: 1.5rem; // Separate status pill from action buttons
}

// Action buttons - individual buttons with consistent shape and spacing
.action-buttons {
  display: flex;
  flex-direction: row; // Horizontal layout
  gap: 0.5rem; // Space between buttons
  align-items: center;

  .action-btn {
    // Ensure all buttons have the same rounded shape (not conjoined)
    border-radius: 10px !important; // Match global button border-radius
    white-space: nowrap; // Prevent text wrapping
  }
}

.order-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* Keep Event Orders three cards on one line */
.event-order-cards {
  flex-wrap: nowrap !important;
}
.event-order-card-col {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
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

      &.action-buttons {
        width: 100%;
        flex-direction: column; // Stack vertically on mobile

        .action-btn {
          width: 100%;
        }
      }

      // Legacy support for q-btn-group (if any remain)
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
