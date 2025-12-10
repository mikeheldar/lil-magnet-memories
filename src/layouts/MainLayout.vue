<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
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

        <!-- Test Environment Indicator -->
        <q-chip
          v-if="isTestEnvironment"
          color="orange"
          text-color="white"
          size="sm"
          class="q-mr-md test-environment-chip"
          icon="bug_report"
        >
          <span class="gt-xs">TEST</span>
        </q-chip>

        <!-- Market Event Indicator (always visible when an event is live) -->
        <router-link
          v-if="isAtMarketEvent"
          to="/"
          class="market-event-pill-link"
        >
          <q-chip
            color="green"
            text-color="white"
            size="sm"
            class="q-mr-md market-event-chip"
            icon="event"
          >
            <span class="gt-xs">MARKET EVENT</span>
          </q-chip>
        </router-link>

        <!-- Page title in center -->
        <q-toolbar-title class="text-center">
          <span class="text-h5 text-weight-bold">{{ pageTitle }}</span>
        </q-toolbar-title>

        <!-- About Button -->
        <q-btn
          flat
          dense
          class="gt-xs q-mr-sm"
          label="About"
          @click="$router.push('/about')"
        />

        <!-- Shopping Cart Icon (only show if cart has items) -->
        <q-btn
          v-if="cartItemCount > 0"
          flat
          dense
          icon="shopping_cart"
          @click="$router.push('/cart')"
          aria-label="Shopping Cart"
          class="q-mr-sm"
        >
          <q-badge color="orange" :label="cartItemCount" floating />
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

    <!-- Market Event Banner removed -->

    <!-- Market Event Dialog -->
    <q-dialog v-model="showMarketEventDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Market Event Active!</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="goToOnlineOrder" />
        </q-card-section>

        <q-card-section>
          <div class="text-body1 q-mb-md">
            We're currently at <strong>{{ activeMarketEvent?.name }}</strong
            >!
          </div>
          <div class="text-body2 text-grey-7 q-mb-md">
            Are you at the market event?
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="No, Order Online"
            color="grey-8"
            @click="goToOnlineOrder"
          />
          <q-btn
            flat
            label="Yes, I'm at the event"
            color="primary"
            @click="confirmAtMarketEvent"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
          <!-- Customer section (collapsible) -->
          <q-expansion-item
            icon="person"
            label="Customer"
            default-opened
            header-class="text-grey-8"
          >
            <q-item clickable v-ripple @click="handleUploadClick">
              <q-item-section avatar>
                <q-icon name="camera_alt" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ uploadLinkLabel }}</q-item-label>
                <q-item-label caption>{{ uploadLinkCaption }}</q-item-label>
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

            <q-item clickable v-ripple @click="navigateTo('/about')">
              <q-item-section avatar>
                <q-icon name="info" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>About</q-item-label>
                <q-item-label caption>Learn our story</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

          <!-- Operator section (collapsible, default collapsed) -->
          <template v-if="isAdmin">
            <q-separator class="q-my-md" />
            <q-expansion-item
              icon="work"
              label="Operator"
              :default-opened="true"
              header-class="text-grey-8"
            >
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

              <q-item clickable v-ripple to="/magnet-studio-select">
                <q-item-section avatar>
                  <q-icon name="apps" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Magnet Studio</q-item-label>
                  <q-item-label caption>Crop images into squares</q-item-label>
                </q-item-section>
              </q-item>

              <q-item clickable v-ripple @click="navigateTo('/photo-selector')">
                <q-item-section avatar>
                  <q-icon name="print" color="blue" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Print Template</q-item-label>
                  <q-item-label caption
                    >Select photos for print template</q-item-label
                  >
                </q-item-section>
              </q-item>

              <q-item
                clickable
                v-ripple
                @click="navigateTo('/photo-management')"
              >
                <q-item-section avatar>
                  <q-icon name="delete_sweep" color="red" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Photo Management</q-item-label>
                  <q-item-label caption>Delete photos and orders</q-item-label>
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
                  <q-icon name="inventory_2" color="green" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Manage Products</q-item-label>
                  <q-item-label caption
                    >Manage products and pricing</q-item-label
                  >
                </q-item-section>
              </q-item>
            </q-expansion-item>

            <!-- Admin section (collapsible, default collapsed) -->
            <q-separator class="q-my-md" />
            <q-expansion-item
              icon="admin_panel_settings"
              label="Admin"
              :default-opened="false"
              header-class="text-grey-8"
            >
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

              <q-item
                clickable
                v-ripple
                @click="navigateTo('/errored-transactions')"
              >
                <q-item-section avatar>
                  <q-icon name="error_outline" color="red" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Errored Transactions</q-item-label>
                  <q-item-label caption
                    >View failed payments and uploads</q-item-label
                  >
                </q-item-section>
              </q-item>
            </q-expansion-item>
          </template>
        </template>

        <q-separator class="q-my-md" />

        <!-- Account section (collapsible) -->
        <q-expansion-item
          icon="account_circle"
          label="Account"
          default-opened
          header-class="text-grey-8"
        >
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
        </q-expansion-item>
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
import { useCustomerType } from '../composables/useCustomerType.js';

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

    const { setCustomerType, isMarketCustomer } = useCustomerType();

    // Create a ref that gets updated periodically to trigger reactivity
    const marketEventCheckTrigger = ref(0);

    // Market event dialog state
    const showMarketEventDialog = ref(false);

    // Initialize market event cache immediately
    const marketEventCacheInitialized = ref(false);
    let marketEventUnsubscribe = null;

    // Set up real-time listener for immediate updates
    marketEventUnsubscribe = marketEventService.addListener(() => {
      // Trigger reactivity when events change
      marketEventCheckTrigger.value++;
      marketEventCacheInitialized.value = true;
      console.log('🔄 Market events updated in MainLayout');
    });

    // Initial trigger to ensure UI reflects current state
    marketEventCheckTrigger.value++;
    marketEventCacheInitialized.value = true;

    const activeMarketEvent = computed(() => {
      // Trigger reactivity with marketEventCheckTrigger
      marketEventCheckTrigger.value;
      return marketEventService.getCheckedInEvent();
    });
    const hasActiveEvent = computed(() => !!activeMarketEvent.value);

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
      // Check if there's an active market event
      const activeEvent = marketEventService.getCheckedInEvent();

      if (activeEvent) {
        // If user has toggled "I'm at the event", go directly to market upload
        if (isMarketCustomer.value) {
          setCustomerType('market_customer');
          router.push('/photo-upload');
        } else {
          // Show popup to ask if they're at the event
          showMarketEventDialog.value = true;
        }
      } else {
        // No active event - go to online order
        setCustomerType('online_customer');
        router.push('/photo-upload');
      }
      leftDrawerOpen.value = false;
    };

    const confirmAtMarketEvent = () => {
      // Set the toggle state (this persists via localStorage in customerType composable)
      setCustomerType('market_customer');
      // Close dialog and navigate to photo upload form
      showMarketEventDialog.value = false;
      router.push('/photo-upload');
      leftDrawerOpen.value = false;
    };

    const goToOnlineOrder = () => {
      // User said they're not at the event - go to photo upload form (online mode)
      showMarketEventDialog.value = false;
      setCustomerType('online_customer');
      router.push('/photo-upload');
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
          case '/errored-transactions':
            return 'Admin - Errored Transactions';
          case '/market-events':
            return 'Admin - Market Events';
          case '/magnet-studio':
            return 'Admin - Magnet Studio';
          case '/pricing':
            return 'Admin - Manage Products';
          case '/photo-selector':
            return 'Print Template';
          case '/photo-management':
            return 'Photo Management';
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
        // Clear cart before signing out
        const { clearCart } = useCart();
        await clearCart();
        console.log('Cart cleared before sign out');

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

    // Helper to check if user is anonymous (no email means anonymous)
    const isAnonymousUser = (user) => {
      return user && user.providerId === 'firebase' && !user.email;
    };

    onMounted(() => {
      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        // Only treat non-anonymous users as authenticated for UI
        // Anonymous users should see sign-in options, not be treated as signed in
        const isRealUser = user && !isAnonymousUser(user);
        isAuthenticated.value = isRealUser;

        if (isRealUser) {
          userProfile.value = {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
          };
          // Check admin status immediately (sync check is fast and works offline)
          isAdmin.value = authService.isAdmin();
          console.log('Admin status updated (immediate):', isAdmin.value);

          // Also check async in background for Firebase-based admins (non-blocking)
          authService
            .isAdminAsync()
            .then((adminStatus) => {
              if (adminStatus !== isAdmin.value) {
                isAdmin.value = adminStatus;
                console.log('Admin status updated (async):', adminStatus);
              }
            })
            .catch(() => {
              // Silently fail - sync check already handled it
            });
        } else {
          userProfile.value = {
            displayName: null,
            photoURL: null,
            email: null,
          };
          isAdmin.value = false;
        }
      });

      // Real-time listener is already set up above, no need for periodic refresh
    });

    onUnmounted(() => {
      // Clean up real-time listener when component unmounts
      if (marketEventUnsubscribe) {
        marketEventUnsubscribe();
        marketEventUnsubscribe = null;
      }
    });

    return {
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
      showMarketEventDialog,
      confirmAtMarketEvent,
      goToOnlineOrder,
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

.market-event-pill-link {
  text-decoration: none;
  display: inline-block;
}

.market-event-chip {
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }

  @media (max-width: 600px) {
    min-width: 24px !important;
    width: 24px !important;
    height: 24px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    position: relative !important;

    :deep(.q-chip__content) {
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
      position: relative !important;
    }

    // Center icons on small screens
    :deep(.q-chip__icon) {
      margin: 0 !important;
      padding: 0 !important;
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 16px !important;
      height: 16px !important;
      font-size: 16px !important;
      line-height: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    // Hide text on small screens
    :deep(span) {
      display: none !important;
    }
  }
}

.test-environment-chip {
  @media (max-width: 600px) {
    min-width: 24px !important;
    width: 24px !important;
    height: 24px !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
    position: relative !important;

    :deep(.q-chip__content) {
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
      position: relative !important;
    }

    // Center icons on small screens
    :deep(.q-chip__icon) {
      margin: 0 !important;
      padding: 0 !important;
      position: absolute !important;
      left: 50% !important;
      top: 50% !important;
      transform: translate(-50%, -50%) !important;
      width: 16px !important;
      height: 16px !important;
      font-size: 16px !important;
      line-height: 1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    // Hide text on small screens
    :deep(span) {
      display: none !important;
    }
  }
}

// Global chip icon styling
:deep(.q-chip__icon) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.5em !important;
  margin: 0.27em !important;
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
