<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Top header: always purple gradient; market event is indicated by the green banner below -->
    <q-header elevated class="text-white">
      <q-toolbar>
        <!-- Menu button (always visible) -->
        <q-btn
          flat
          dense
          icon="menu"
          @click="toggleLeftDrawer"
          aria-label="Menu"
          class="q-mr-sm"
        />

        <!-- Logo on the left -->
        <q-btn flat dense @click="$router.push('/')" class="q-mr-md">
          <img
            src="/assets/lil-magnet-memories-logo.png"
            alt="Lil Magnet Memories"
            class="logo-header"
            style="height: 40px; width: auto"
          />
        </q-btn>

        <!-- Test Environment Indicator (hide on extra-small screens to avoid crowding) -->
        <q-chip
          v-if="isTestEnvironment"
          color="orange"
          text-color="white"
          size="sm"
          class="q-mr-md gt-xs"
          icon="bug_report"
        >
          TEST
        </q-chip>

        <!-- Market Event Indicator (hide on extra-small screens; banner will indicate event) -->
        <q-chip
          v-if="isAtMarketEvent"
          color="green"
          text-color="white"
          size="sm"
          class="q-mr-md gt-xs"
          icon="event"
        >
          MARKET EVENT
        </q-chip>

        <!-- Page title in center (hide on extra-small screens to reduce crowding) -->
        <q-toolbar-title class="text-center gt-xs">
          <span class="text-h5 text-weight-bold">{{ pageTitle }}</span>
        </q-toolbar-title>

        <!-- About Button (hide on extra-small screens) -->
        <q-btn
          flat
          dense
          class="gt-xs q-mr-sm"
          label="About"
          @click="$router.push('/about')"
        />

        <!-- Shopping Cart Icon -->
        <q-btn
          flat
          dense
          icon="shopping_cart"
          @click="$router.push('/cart')"
          aria-label="Shopping Cart"
          class="q-mr-sm"
        >
          <q-badge
            v-if="cartItemCount > 0"
            color="orange"
            :label="cartItemCount"
            floating
          />
          <q-tooltip>Shopping Cart</q-tooltip>
        </q-btn>

        <!-- User Profile Dropdown (only when authenticated) -->
        <template v-if="isAuthenticated">
          <q-btn-dropdown flat dense no-caps class="user-profile-dropdown">
            <q-tooltip class="lt-md">User Profile</q-tooltip>
            <template v-slot:label>
              <div class="row items-center no-wrap">
                <q-avatar size="32px" class="user-avatar">
                  <img
                    v-if="userProfile.photoURL"
                    :src="userProfile.photoURL"
                    :alt="userProfile.displayName || 'User'"
                  />
                  <q-icon
                    v-else
                    name="account_circle"
                    size="32px"
                    color="white"
                  />
                </q-avatar>
                <!-- Show name only on larger screens -->
                <span class="user-name gt-sm q-ml-sm">{{
                  userProfile.displayName || 'User'
                }}</span>
              </div>
            </template>

            <q-list>
              <q-item-label header class="text-primary">
                <q-icon name="person" class="q-mr-sm" />
                {{ userProfile.displayName || 'User' }}
                <q-chip
                  v-if="isAdmin"
                  size="sm"
                  color="orange"
                  text-color="white"
                  class="q-ml-sm"
                >
                  Admin
                </q-chip>
              </q-item-label>
              <q-item-label caption class="text-grey-6 q-px-md q-pb-md">
                {{ userProfile.email }}
              </q-item-label>

              <q-separator />

              <q-item clickable v-close-popup @click="handleSignOut">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Sign Out</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </template>

        <!-- Show upload link when not authenticated -->
        <template v-else>
          <q-btn
            flat
            dense
            icon="camera_alt"
            @click="handleUploadClick"
            aria-label="Start Creating Magnets"
          >
            <q-tooltip>Start Creating Magnets</q-tooltip>
          </q-btn>
          <q-btn
            flat
            dense
            icon="info"
            @click="$router.push('/about')"
            aria-label="About Li'l Magnet Memories"
            class="q-ml-xs"
          >
            <q-tooltip>About Li'l Magnet Memories</q-tooltip>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <!-- Market Event Banner (single green band directly under the purple header) -->
    <q-banner
      v-if="isAtMarketEvent && activeMarketEvent"
      class="bg-green-5 text-white market-event-banner"
      dense
    >
      <template v-slot:avatar>
        <q-icon name="event" size="32px" />
      </template>
      <div class="text-weight-bold">
        Market Event Live!
      </div>
      <div class="text-body2">
        We're currently at <strong>{{ activeMarketEvent.name }}</strong>
        <span v-if="activeMarketEvent.location"> at {{ activeMarketEvent.location }}</span>.
        Visit us at the market event!
      </div>
    </q-banner>

    <!-- Left Drawer for Navigation (always visible) -->
    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-1">
      <q-list>
        <q-item-label header class="text-grey-8"> Navigation </q-item-label>

        <!-- Content for non-authenticated users -->
        <template v-if="!isAuthenticated">
          <q-item clickable v-ripple @click="navigateTo('/')">
            <q-item-section avatar>
              <q-icon name="home" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Home</q-item-label>
              <q-item-label caption>Go to main page</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="handleUploadClick">
            <q-item-section avatar>
              <q-icon name="camera_alt" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ uploadLinkLabel }}</q-item-label>
              <q-item-label caption>{{ uploadLinkCaption }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('/about')">
            <q-item-section avatar>
              <q-icon name="info" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>About</q-item-label>
              <q-item-label caption
                >Get to know Li'l Magnet Memories</q-item-label
              >
            </q-item-section>
          </q-item>
        </template>

        <!-- Content for authenticated users -->
        <template v-else>
          <!-- Admin-only navigation items -->
          <template v-if="isAdmin">
            <q-item clickable v-ripple @click="navigateTo('/orders')">
              <q-item-section avatar>
                <q-icon name="inventory" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Order List</q-item-label>
                <q-item-label caption>View all orders</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="navigateTo('/customers')">
              <q-item-section avatar>
                <q-icon name="people" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Customer List</q-item-label>
                <q-item-label caption>View all customers</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple to="/magnet-studio">
              <q-item-section avatar>
                <q-icon name="apps" color="purple" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Magnet Studio</q-item-label>
                <q-item-label caption>Crop images into squares</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="navigateTo('/market-events')">
              <q-item-section avatar>
                <q-icon name="event" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Market Events</q-item-label>
                <q-item-label caption>Manage market events</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="navigateTo('/pricing')">
              <q-item-section avatar>
                <q-icon name="attach_money" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Pricing</q-item-label>
                <q-item-label caption>Manage product pricing</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

          <q-item-label header class="text-grey-8"> Customer </q-item-label>

          <q-item clickable v-ripple @click="handleUploadClick">
            <q-item-section avatar>
              <q-icon name="camera_alt" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ uploadLinkLabel }}</q-item-label>
              <q-item-label caption>{{ uploadLinkCaption }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('/about')">
            <q-item-section avatar>
              <q-icon name="info" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>About</q-item-label>
              <q-item-label caption>Learn our story</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-ripple @click="navigateTo('/my-orders')">
            <q-item-section avatar>
              <q-icon name="assignment" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>My Orders</q-item-label>
              <q-item-label caption>View your orders</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Admin-only navigation items -->
          <template v-if="isAdmin">
            <q-separator class="q-my-md" />

            <q-item-label header class="text-grey-8">
              <q-icon name="admin_panel_settings" class="q-mr-sm" />
              Admin
            </q-item-label>

            <q-item clickable v-ripple @click="navigateTo('/firebase-test')">
              <q-item-section avatar>
                <q-icon name="bug_report" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Firebase Diagnostic</q-item-label>
                <q-item-label caption>Test Firebase connection</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="navigateTo('/admin')">
              <q-item-section avatar>
                <q-icon name="settings" color="orange" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Admin Settings</q-item-label>
                <q-item-label caption>Manage system settings</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="navigateTo('/email-test')">
              <q-item-section avatar>
                <q-icon name="email" color="purple" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Email Test</q-item-label>
                <q-item-label caption>Test email functionality</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </template>

        <q-separator class="q-my-md" />

        <q-item-label header class="text-grey-8"> Account </q-item-label>

        <!-- Sign In for non-authenticated users -->
        <q-item
          v-if="!isAuthenticated"
          clickable
          v-ripple
          @click="handleSignIn"
        >
          <q-item-section avatar>
            <q-icon name="login" color="positive" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Sign In</q-item-label>
            <q-item-label caption>Log in to your account</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Sign Out for authenticated users -->
        <q-item v-else clickable v-ripple @click="handleSignOut">
          <q-item-section avatar>
            <q-icon name="logout" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Sign Out</q-item-label>
            <q-item-label caption>Log out of your account</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { useCart } from '../composables/useCart.js';
import { useQuasar } from 'quasar';
import { config } from '../config/environment.js';
import { marketEventService } from '../services/marketEventService.js';
import {
  useCustomerType,
  CUSTOMER_TYPES,
} from '../composables/useCustomerType.js';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';

export default {
  name: 'MainLayout',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const $q = useQuasar();
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);
    const leftDrawerOpen = ref(false);
    const { cartItemCount } = useCart();
    const userProfile = ref({
      displayName: null,
      photoURL: null,
      email: null,
    });

    const { setCustomerType } = useCustomerType();
    
    // Initialize market event cache immediately
    const marketEventCacheInitialized = ref(false);
    let unsubscribeMarketEvents = null;

    // Set up real-time listener for market events in MainLayout
    const setupMarketEventsListener = () => {
      try {
        const eventsRef = collection(db, 'marketEvents');
        const q = query(eventsRef, orderBy('startDateTime', 'desc'));

        console.log('MainLayout: Setting up real-time listener for market events...');

        unsubscribeMarketEvents = onSnapshot(
          q,
          (snapshot) => {
            // Skip if this is just a metadata change (not actual data change)
            if (snapshot.metadata.fromCache && snapshot.metadata.hasPendingWrites) {
              return;
            }

            console.log('MainLayout: Market events snapshot received:', {
              size: snapshot.size,
              empty: snapshot.empty,
            });

            const eventsList = [];
            snapshot.forEach((doc) => {
              const eventData = doc.data();
              // Convert Firebase timestamps to ISO strings
              const processed = {
                id: doc.id,
                ...eventData,
              };
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
              eventsList.push(processed);
            });

            // Update market event service cache immediately
            marketEventService.eventsCache = eventsList;
            marketEventService.cacheTimestamp = Date.now();

            // Trigger reactivity
            marketEventCheckTrigger.value++;

            console.log('MainLayout: Market events cache updated:', {
              count: eventsList.length,
              events: eventsList.map(e => ({ id: e.id, name: e.name, checkedIn: e.checkedIn })),
            });

            marketEventCacheInitialized.value = true;
          },
          (err) => {
            console.error('MainLayout: Real-time listener error:', err);
            // Fallback: refresh cache manually
            marketEventService.refreshCache().catch(refreshErr => {
              console.error('MainLayout: Error refreshing cache:', refreshErr);
            });
            marketEventCacheInitialized.value = true;
          }
        );
      } catch (err) {
        console.error('MainLayout: Error setting up real-time listener:', err);
        // Fallback: initialize cache manually
        marketEventService.refreshCache()
          .then(() => {
            marketEventCacheInitialized.value = true;
          })
          .catch(refreshErr => {
            console.error('MainLayout: Error initializing cache:', refreshErr);
            marketEventCacheInitialized.value = true;
          });
      }
    };

    // Initialize cache and set up listener
    (async () => {
      try {
        await marketEventService.refreshCache();
        marketEventCacheInitialized.value = true;
      } catch (error) {
        console.error('Error initializing market event cache:', error);
        marketEventCacheInitialized.value = true;
      }
      // Set up real-time listener
      setupMarketEventsListener();
    })();

    const activeMarketEvent = computed(() => {
      // Trigger reactivity with marketEventCheckTrigger
      marketEventCheckTrigger.value;
      return marketEventService.getCheckedInEvent();
    });
    const hasActiveEvent = computed(() => !!activeMarketEvent.value);

    // Create a ref that gets updated periodically to trigger reactivity
    const marketEventCheckTrigger = ref(0);
    let marketEventCheckInterval = null;

    const uploadLinkLabel = computed(() => {
      return 'Start Creating Magnets';
    });

    const uploadLinkCaption = computed(() => {
      if (hasActiveEvent.value) {
        return 'Create magnets for market pickup';
      }
      return 'Create magnets for online delivery';
    });

    const handleUploadClick = () => {
      if (hasActiveEvent.value) {
        setCustomerType(CUSTOMER_TYPES.MARKET);
        router.push('/market-event-upload');
      } else {
        setCustomerType(CUSTOMER_TYPES.ONLINE);
        router.push('/online-order');
      }
      leftDrawerOpen.value = false;
    };

    const pageTitle = computed(() => {
      const baseTitle = (() => {
        switch (route.path) {
          case '/orders':
            return 'Admin - Order List';
          case '/customers':
            return 'Admin - Customer List';
          case '/upload':
            return 'Upload Photos';
          case '/my-orders':
            return 'My Orders';
          case '/thank-you':
            return 'Order Confirmation';
          case '/firebase-test':
            return 'Firebase Diagnostic';
          case '/admin':
            return 'Admin Settings';
          case '/email-test':
            return 'Admin - Email Test';
          case '/market-events':
            return 'Admin - Market Events';
          case '/magnet-studio':
            return 'Admin - Magnet Studio';
          case '/pricing':
            return 'Admin - Pricing';
          case '/':
          default:
            return 'Lil Magnet Memories';
        }
      })();

      // Add test environment indicator
      return config.isTest ? `${baseTitle} (TEST)` : baseTitle;
    });

    const isTestEnvironment = computed(() => config.isTest);

    // Check if customer is at a market event (periodically refresh)
    const isAtMarketEvent = computed(() => {
      // This computed will re-run when marketEventCheckTrigger changes
      marketEventCheckTrigger.value;
      return marketEventService.getCheckedInEvent() !== null;
    });

    const toggleLeftDrawer = () => {
      leftDrawerOpen.value = !leftDrawerOpen.value;
    };

    const navigateTo = (path) => {
      router.push(path);
      leftDrawerOpen.value = false; // Close drawer after navigation
    };

    const handleSignIn = async () => {
      try {
        console.log('Starting sign in process...');
        await authService.signInWithGoogle();
        console.log('Sign in successful');

        try {
          $q.notify({
            type: 'positive',
            message: 'Successfully signed in!',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show success notification:', notifyError);
        }

        // Close drawer after sign in
        leftDrawerOpen.value = false;
      } catch (error) {
        console.error('Sign in error:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to sign in. Please try again.',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show error notification:', notifyError);
        }
      }
    };

    const handleSignOut = async () => {
      try {
        console.log('Starting sign out process...');
        await authService.signOut();
        console.log('Sign out successful, showing notification...');

        try {
          $q.notify({
            type: 'positive',
            message: 'Successfully signed out!',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show success notification:', notifyError);
        }

        console.log('Redirecting to home page...');
        // Immediate redirect to home page
        try {
          console.log('Attempting router.push to home page...');
          router.push('/');
          console.log('Router redirect successful');
        } catch (routerError) {
          console.error(
            'Router redirect failed, using window.location:',
            routerError
          );
          // Fallback: redirect using window.location
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Sign out error:', error);
        try {
          $q.notify({
            type: 'negative',
            message: 'Failed to sign out. Please try again.',
            position: 'top',
          });
        } catch (notifyError) {
          console.error('Failed to show notification:', notifyError);
        }
      }
    };

    onMounted(() => {
      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user?.email);
        isAuthenticated.value = !!user;
        if (user) {
          userProfile.value = {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
          };
          // Wait a bit for admin config to load, then check admin status
          setTimeout(() => {
            isAdmin.value = authService.isAdmin();
            console.log('Admin status updated:', isAdmin.value);
          }, 100);
        } else {
          userProfile.value = {
            displayName: null,
            photoURL: null,
            email: null,
          };
          isAdmin.value = false;
        }
      });

      // Set up periodic check for market event status
      // This will automatically hide the indicator when events end
      // Refresh more frequently to ensure all users see updates quickly
      marketEventCheckInterval = setInterval(async () => {
        marketEventCheckTrigger.value++;
        // Refresh market event cache periodically
        try {
          await marketEventService.refreshCache();
        } catch (error) {
          console.error('Error refreshing market event cache:', error);
        }
      }, 10000); // Check every 10 seconds for faster updates
    });

    onUnmounted(() => {
      // Clean up interval when component unmounts
      if (marketEventCheckInterval) {
        clearInterval(marketEventCheckInterval);
        marketEventCheckInterval = null;
      }
      // Clean up real-time listener
      if (unsubscribeMarketEvents) {
        unsubscribeMarketEvents();
        console.log('MainLayout: Market events real-time listener unsubscribed');
      }
    });

    return {
      $q,
      pageTitle,
      isTestEnvironment,
      isAtMarketEvent,
      activeMarketEvent,
      isAuthenticated,
      isAdmin,
      leftDrawerOpen,
      userProfile,
      toggleLeftDrawer,
      navigateTo,
      handleSignIn,
      handleSignOut,
      cartItemCount,
      uploadLinkLabel,
      uploadLinkCaption,
      handleUploadClick,
    };
  },
};
</script>

<style lang="scss">
.q-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

.logo-header {
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.user-profile-dropdown {
  .q-btn__content {
    padding: 0;
  }
}

.user-avatar {
  border: none !important;
  transition: all 0.3s ease;
  box-shadow: none !important;
  filter: none !important;
  outline: none !important;

  &:hover {
    transform: scale(1.05);
  }

  img {
    object-fit: cover;
    border-radius: 50%;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
}

// Remove any shadow, border, or outline from the avatar
.q-avatar.user-avatar {
  box-shadow: none !important;
  filter: none !important;
  border: none !important;
  outline: none !important;

  &:before {
    display: none !important;
  }

  &:after {
    display: none !important;
  }
}

.user-name {
  color: white;
  font-weight: 500;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.market-event-banner {
  margin: 0;
  border-radius: 0;
}

// Mobile responsive adjustments
@media (max-width: 768px) {
  .q-toolbar-title {
    font-size: 1.1rem !important;
  }

  .logo-header {
    height: 35px !important;
  }

  .user-avatar {
    width: 28px !important;
    height: 28px !important;
  }
}
</style>
