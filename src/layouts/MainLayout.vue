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
          class="q-mr-md"
          icon="bug_report"
        >
          TEST
        </q-chip>

        <!-- Page title in center -->
        <q-toolbar-title class="text-center">
          <span class="text-h5 text-weight-bold">{{ pageTitle }}</span>
        </q-toolbar-title>

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
            @click="$router.push('/upload')"
            aria-label="Upload Photos"
          >
            <q-tooltip>Upload Photos</q-tooltip>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

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

          <q-item clickable v-ripple @click="navigateTo('/upload')">
            <q-item-section avatar>
              <q-icon name="camera_alt" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Upload Photos</q-item-label>
              <q-item-label caption>Create custom magnets</q-item-label>
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
          </template>

          <q-item clickable v-ripple @click="navigateTo('/upload')">
            <q-item-section avatar>
              <q-icon name="camera_alt" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Upload Photos</q-item-label>
              <q-item-label caption>Add new orders</q-item-label>
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

            <q-item clickable v-ripple @click="navigateTo('/market-events')">
              <q-item-section avatar>
                <q-icon name="event" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Market Events</q-item-label>
                <q-item-label caption>Manage market events</q-item-label>
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
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { useQuasar } from 'quasar';
import { config } from '../config/environment.js';

export default {
  name: 'MainLayout',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const $q = useQuasar();
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);
    const leftDrawerOpen = ref(false);
    const userProfile = ref({
      displayName: null,
      photoURL: null,
      email: null,
    });

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
          case '/':
          default:
            return 'Lil Magnet Memories';
        }
      })();

      // Add test environment indicator
      return config.isTest ? `${baseTitle} (TEST)` : baseTitle;
    });

    const isTestEnvironment = computed(() => config.isTest);

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
    });

    return {
      pageTitle,
      isTestEnvironment,
      isAuthenticated,
      isAdmin,
      leftDrawerOpen,
      userProfile,
      toggleLeftDrawer,
      navigateTo,
      handleSignIn,
      handleSignOut,
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
