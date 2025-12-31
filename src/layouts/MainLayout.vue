<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="headerClasses" :style="headerInlineStyle">
      <q-toolbar :class="{ 'drawer-open': leftDrawerOpen }">
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

        <!-- Market Event Mode Toggle (only when event is live) -->
        <div v-if="hasActiveEvent" class="q-mr-md">
          <q-btn
            flat
            dense
            :color="isMarketCustomer ? 'green' : 'blue'"
            text-color="white"
            size="sm"
            :icon="isMarketCustomer ? 'store' : 'shopping_bag'"
            @click="toggleCustomerMode"
            class="customer-mode-toggle"
          >
            <span class="gt-xs q-ml-xs">{{ isMarketCustomer ? 'Market' : 'Online' }}</span>
            <q-tooltip>{{ isMarketCustomer ? 'Switch to Online Mode' : 'Switch to Market Event Mode' }}</q-tooltip>
          </q-btn>
        </div>

        <!-- Page title in center -->
        <q-toolbar-title class="text-center no-ellipsis" :style="headerTitleStyle">
          <span class="text-h5 text-weight-bold" :style="headerTitleSpanStyle">{{ pageTitle }}</span>
        </q-toolbar-title>

        <!-- Shop Dropdowns for Wide Screens -->
        <div class="shop-header-dropdowns q-mr-md">
          <!-- Custom Photo Magnets Dropdown -->
          <q-btn-dropdown
            flat
            dense
            no-caps
            label="Custom Photo Magnets"
            :style="headerButtonStyle"
            class="shop-header-btn shop-header-btn-custom"
          >
            <q-list v-if="customCollections.length > 0">
              <q-item
                v-for="collection in customCollections"
                :key="collection"
                clickable
                v-close-popup
                @click="scrollToSection('custom-products-section', collection)"
              >
                <q-item-section>
                  <q-item-label>{{ collection }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <q-list v-else>
              <q-item clickable v-close-popup @click="scrollToSection('custom-products-section')">
                <q-item-section>
                  <q-item-label>Shop Products</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Designer Magnets Dropdown -->
          <q-btn-dropdown
            flat
            dense
            no-caps
            label="Designer Magnets"
            :style="headerButtonStyle"
            class="shop-header-btn shop-header-btn-designer"
          >
            <q-list v-if="designerCollections.length > 0">
              <q-item
                v-for="collection in designerCollections"
                :key="collection"
                clickable
                v-close-popup
                @click="scrollToSection('designer-products-section', collection)"
              >
                <q-item-section>
                  <q-item-label>{{ collection }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <q-list v-else>
              <q-item clickable v-close-popup @click="scrollToSection('designer-products-section')">
                <q-item-section>
                  <q-item-label>Shop Products</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <!-- Specialty Products Dropdown -->
          <q-btn-dropdown
            flat
            dense
            no-caps
            label="Specialty Products"
            :style="headerButtonStyle"
            class="shop-header-btn shop-header-btn-specialty"
          >
            <q-list v-if="specialtyCollections.length > 0">
              <q-item
                v-for="collection in specialtyCollections"
                :key="collection"
                clickable
                v-close-popup
                @click="scrollToSection('specialty-products-section', collection)"
              >
                <q-item-section>
                  <q-item-label>{{ collection }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <q-list v-else>
              <q-item clickable v-close-popup @click="scrollToSection('specialty-products-section')">
                <q-item-section>
                  <q-item-label>Shop Products</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>

        <!-- About Button -->
        <q-btn
          flat
          dense
          class="gt-xs q-mr-sm"
          label="About"
          :style="headerButtonStyle"
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
          <q-btn-dropdown flat dense no-caps class="user-profile-dropdown" :style="headerButtonStyle">
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
                <span class="user-name gt-sm q-ml-sm" :style="userNameStyle">{{
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

    <!-- Left Drawer for Navigation -->
    <q-drawer v-model="leftDrawerOpen" bordered class="bg-grey-1">
      <q-list>
        <q-item-label header class="text-grey-8"> Navigation </q-item-label>

        <!-- Shop section (always visible) -->
        <q-expansion-item
          icon="shopping_bag"
          label="Shop"
          :default-opened="true"
          header-class="text-grey-8"
        >
          <!-- Custom Photo Magnets -->
          <q-item
            clickable
            v-ripple
            @click="scrollToSection('custom-products-section')"
            @mouseenter="hoveredCategory = 'custom'"
            @mouseleave="hoveredCategory = null"
            class="shop-category-item"
          >
            <q-item-section avatar>
              <q-icon name="camera_alt" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Custom Photo Magnets</q-item-label>
              <q-item-label caption>Create personalized magnets</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Show collections on hover for Custom (only if collections exist) -->
          <div
            v-if="hoveredCategory === 'custom' && customCollections.length > 0"
            class="collection-submenu q-pl-xl q-pr-md q-pb-sm"
          >
            <q-item
              v-for="collection in customCollections"
              :key="collection"
              clickable
              v-ripple
              dense
              @click.stop="scrollToSection('custom-products-section', collection)"
              class="collection-item"
            >
              <q-item-section>
                <q-item-label class="text-caption">{{ collection }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <!-- Designer Magnets -->
          <q-item
            clickable
            v-ripple
            @click="scrollToSection('designer-products-section')"
            @mouseenter="hoveredCategory = 'designer'"
            @mouseleave="hoveredCategory = null"
            class="shop-category-item"
          >
            <q-item-section avatar>
              <q-icon name="palette" color="secondary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Designer Magnets</q-item-label>
              <q-item-label caption>Ready-made designs</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Show collections on hover for Designer (only if collections exist) -->
          <div
            v-if="hoveredCategory === 'designer' && designerCollections.length > 0"
            class="collection-submenu q-pl-xl q-pr-md q-pb-sm"
          >
            <q-item
              v-for="collection in designerCollections"
              :key="collection"
              clickable
              v-ripple
              dense
              @click.stop="scrollToSection('designer-products-section', collection)"
              class="collection-item"
            >
              <q-item-section>
                <q-item-label class="text-caption">{{ collection }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <!-- Specialty Products -->
          <q-item
            clickable
            v-ripple
            @click="scrollToSection('specialty-products-section')"
            @mouseenter="hoveredCategory = 'specialty'"
            @mouseleave="hoveredCategory = null"
            class="shop-category-item"
          >
            <q-item-section avatar>
              <q-icon name="star" color="amber" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Specialty Products</q-item-label>
              <q-item-label caption>Unique specialty items</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Show collections on hover for Specialty (only if collections exist) -->
          <div
            v-if="hoveredCategory === 'specialty' && specialtyCollections.length > 0"
            class="collection-submenu q-pl-xl q-pr-md q-pb-sm"
          >
            <q-item
              v-for="collection in specialtyCollections"
              :key="collection"
              clickable
              v-ripple
              dense
              @click.stop="scrollToSection('specialty-products-section', collection)"
              class="collection-item"
            >
              <q-item-section>
                <q-item-label class="text-caption">{{ collection }}</q-item-label>
              </q-item-section>
            </q-item>
          </div>

          <!-- Start Creating Now (last item in Shop section) -->
          <q-item clickable v-ripple @click="handleUploadClick" class="shop-category-item">
            <q-item-section avatar>
              <q-icon name="camera_alt" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Start Creating Now</q-item-label>
              <q-item-label caption>{{ uploadLinkCaption }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-expansion-item>

        <q-separator class="q-my-md" />

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
        </template>

        <!-- Content for authenticated users -->
        <template v-else>
          <!-- Operator section (collapsible, default collapsed) -->
          <template v-if="isAdmin">
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

              <q-item clickable v-ripple @click="navigateTo('/look-and-feel')">
                <q-item-section avatar>
                  <q-icon name="palette" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Look and Feel</q-item-label>
                  <q-item-label caption>Manage site themes</q-item-label>
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

              <q-item clickable v-ripple @click="navigateTo('/test-runner')">
                <q-item-section avatar>
                  <q-icon name="bug_report" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Test Runner</q-item-label>
                  <q-item-label caption>Run automated test suites</q-item-label>
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

          <!-- My Orders for authenticated users -->
          <q-item
            v-if="isAuthenticated"
            clickable
            v-ripple
            @click="navigateTo('/my-orders')"
          >
            <q-item-section avatar>
              <q-icon name="assignment" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>My Orders</q-item-label>
              <q-item-label caption>View your orders</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Sign Out for authenticated users -->
          <q-item v-if="isAuthenticated" clickable v-ripple @click="handleSignOut">
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
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { themeService } from '../services/themeService.js';
import { useRoute, useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { useCart } from '../composables/useCart.js';
import { useQuasar } from 'quasar';
import { config } from '../config/environment.js';
import { marketEventService } from '../services/marketEventService.js';
import { useCustomerType } from '../composables/useCustomerType.js';
import { firebaseService } from '../services/firebaseService.js';

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

    // Shop section state
    const products = ref([]);
    const hoveredCategory = ref(null);

    // Helper function to group products by collection
    const groupProductsByCollection = (productList) => {
      const grouped = {};
      productList.forEach((product) => {
        const collection = product.collection || 'Uncategorized';
        if (!grouped[collection]) {
          grouped[collection] = [];
        }
        grouped[collection].push(product);
      });
      return grouped;
    };

    // Computed collections for each category
    // Returns collections, but filters out "Uncategorized" from the list
    // If only "Uncategorized" exists (or no collections), return empty array (will show "Shop Products" instead)
    const customCollections = computed(() => {
      const customProducts = products.value.filter((p) => p.category === 'custom');
      const grouped = groupProductsByCollection(customProducts);
      const allCollections = Object.keys(grouped).sort();
      // Filter out "Uncategorized" - only return actual named collections
      const collections = allCollections.filter(c => c !== 'Uncategorized');
      return collections;
    });

    const designerCollections = computed(() => {
      const designerProducts = products.value.filter((p) => p.category === 'designer');
      const grouped = groupProductsByCollection(designerProducts);
      const allCollections = Object.keys(grouped).sort();
      // Filter out "Uncategorized" - only return actual named collections
      const collections = allCollections.filter(c => c !== 'Uncategorized');
      return collections;
    });

    const specialtyCollections = computed(() => {
      const specialtyProducts = products.value.filter((p) => p.category === 'specialty');
      const grouped = groupProductsByCollection(specialtyProducts);
      const allCollections = Object.keys(grouped).sort();
      // Filter out "Uncategorized" - only return actual named collections
      const collections = allCollections.filter(c => c !== 'Uncategorized');
      return collections;
    });

    // Function to scroll to section on landing page, optionally to a specific collection
    const scrollToSection = (sectionId, collectionName = null) => {
      // Close drawer on mobile
      leftDrawerOpen.value = false;

      // Navigate to home page if not already there
      if (route.path !== '/') {
        router.push('/').then(() => {
          // Wait for page to load and Vue to render, then scroll with retry
          let attempts = 0;
          const maxAttempts = 10;
          const tryScroll = () => {
            attempts++;
            const element = findScrollTarget(sectionId, collectionName);
            if (element || attempts >= maxAttempts) {
              if (element) {
                performScroll(element);
              } else if (attempts >= maxAttempts) {
                console.warn(`Could not find scroll target: ${sectionId}${collectionName ? ` - ${collectionName}` : ''}`);
              }
            } else {
              // Retry after a short delay
              setTimeout(tryScroll, 100);
            }
          };
          setTimeout(tryScroll, 200);
        });
      } else {
        // Already on home page, scroll with retry
        let attempts = 0;
        const maxAttempts = 10;
        const tryScroll = () => {
          attempts++;
          const element = findScrollTarget(sectionId, collectionName);
          if (element || attempts >= maxAttempts) {
            if (element) {
              performScroll(element);
            } else if (attempts >= maxAttempts) {
              console.warn(`Could not find scroll target: ${sectionId}${collectionName ? ` - ${collectionName}` : ''}`);
            }
          } else {
            // Retry after a short delay
            setTimeout(tryScroll, 50);
          }
        };
        setTimeout(tryScroll, 50);
      }
    };

    // Helper function to find the scroll target element
    const findScrollTarget = (sectionId, collectionName = null) => {
      if (collectionName) {
        // Try to find the collection by data attribute
        let element = document.querySelector(`[data-collection="${collectionName}"]`);

        // If not found, try to find within the section by matching label text
        if (!element) {
          const section = document.querySelector(`.${sectionId}`);
          if (section) {
            // Look for q-expansion-item with matching label text
            const expansionItems = section.querySelectorAll('.collection-group');
            expansionItems.forEach((item) => {
              // Try multiple selectors to find the label
              const label = item.querySelector('.q-item__label, .q-expansion-item__header .q-item__label, [class*="q-expansion-item"] .q-item__label');
              if (label && label.textContent.trim() === collectionName) {
                element = item;
              }
            });
          }
        }
        return element;
      }

      // If no collection specified, find section heading
      const section = document.querySelector(`.${sectionId}`);
      if (section) {
        // Find the heading div (the one with text-h4 class containing the section title)
        const heading = section.querySelector('.text-h4');
        if (heading) {
          return heading;
        }
        // Fallback to section itself
        return section;
      }
      return null;
    };

    // Helper function to perform the actual scroll
    const performScroll = (element) => {
      if (!element) return;

      // Calculate offset for fixed header (header is typically ~64px)
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    };


    // Load products
    const loadProducts = async () => {
      try {
        const isAdminUser = authService.isAdmin();
        const productsData = await firebaseService.getProducts(isAdminUser);
        if (productsData && productsData.length > 0) {
          products.value = productsData;
        }
      } catch (error) {
        console.error('Error loading products in MainLayout:', error);
      }
    };

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

    const toggleCustomerMode = () => {
      // Toggle between market and online mode
      if (isMarketCustomer.value) {
        setCustomerType('online_customer');
        $q.notify({
          type: 'info',
          message: 'Switched to Online Mode',
          caption: "You'll see shipping options for orders",
          position: 'top',
          timeout: 2000,
        });
      } else {
        setCustomerType('market_customer');
        $q.notify({
          type: 'positive',
          message: 'Switched to Market Event Mode',
          caption: "You'll see pickup and local payment options",
          position: 'top',
          timeout: 2000,
        });
      }
    };

    // Track active theme for header styling - get from cache immediately (synchronous)
    // Try to get theme name from cache immediately (synchronous, no async)
    let initialThemeName = null;
    try {
      const storedTheme = localStorage.getItem('activeTheme');
      if (storedTheme) {
        const theme = JSON.parse(storedTheme);
        initialThemeName = theme?.name || null;
      }
    } catch (e) {
      // Ignore errors
    }
    const activeThemeName = ref(initialThemeName);

    // Check active theme from Firebase in background (non-blocking)
    const checkActiveTheme = async () => {
      try {
        const theme = await themeService.getActiveTheme();
        if (theme?.name) {
          activeThemeName.value = theme.name;
        }
      } catch (error) {
        // Ignore errors, use cached theme
      }
    };

    // Check theme from Firebase in background (non-blocking)
    checkActiveTheme();
    onMounted(() => {
      checkActiveTheme();
      // Real-time listener in themeService handles theme changes automatically
    });

    // Listen for theme changes and reapply to ensure persistence
    let themeChangeHandler = null;
    onMounted(() => {
      themeChangeHandler = async (event) => {
        if (event.detail && event.detail.themeName) {
          activeThemeName.value = event.detail.themeName;
          // Reapply theme to ensure header styles persist
          try {
            const theme = await themeService.getActiveTheme();
            if (theme) {
              themeService.applyTheme(theme);
            }
          } catch (error) {
            console.error('Error reapplying theme after change:', error);
          }
        }
      };
      window.addEventListener('theme-changed', themeChangeHandler);
    });

    onUnmounted(() => {
      if (themeChangeHandler) {
        window.removeEventListener('theme-changed', themeChangeHandler);
      }
    });

    // Reapply theme on route changes to ensure header styles persist across navigation
    // Use a debounced approach to prevent excessive reapplications
    let routeChangeTimeout = null;
    watch(() => route.path, async () => {
      // Clear any pending route change handler
      if (routeChangeTimeout) {
        clearTimeout(routeChangeTimeout);
      }

      // Debounce route changes to prevent excessive theme reapplications
      routeChangeTimeout = setTimeout(async () => {
        try {
          const theme = await themeService.getActiveTheme();
          if (theme) {
            // Small delay to ensure DOM is ready after navigation
            setTimeout(() => {
              themeService.applyTheme(theme);
            }, 200);
          }
        } catch (error) {
          console.error('Error reapplying theme on route change:', error);
        }
      }, 300); // Debounce by 300ms
    });

    // Computed classes for header - conditionally apply bg-primary only if not LineA Modern theme
    const headerClasses = computed(() => {
      const isLineAModern = activeThemeName.value &&
        (activeThemeName.value.includes('LineA Modern Black Header') ||
         activeThemeName.value.includes('LineA Modern White Header'));

      if (isLineAModern) {
        // Don't use bg-primary for LineA Modern themes - we'll style it ourselves
        return 'text-white';
      }
      // Default: use bg-primary for other themes
      return 'bg-primary text-white';
    });

    // Computed inline style for header - apply theme background immediately
    const headerInlineStyle = computed(() => {
      const isWhiteHeader = activeThemeName.value &&
        activeThemeName.value.includes('LineA Modern White Header');
      const isBlackHeader = activeThemeName.value &&
        activeThemeName.value.includes('LineA Modern Black Header');

      if (isWhiteHeader) {
        return {
          background: '#ffffff',
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
        };
      } else if (isBlackHeader) {
        return {
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          backgroundColor: '#000000',
          backgroundImage: 'none',
        };
      }
      return {};
    });

    // Computed styles for header title based on active theme
    const headerTitleStyle = computed(() => {
      return {};
    });

    const headerTitleSpanStyle = computed(() => {
      const isLineAModern = activeThemeName.value &&
        (activeThemeName.value.includes('LineA Modern Black Header') ||
         activeThemeName.value.includes('LineA Modern White Header'));

      if (isLineAModern) {
        const isWhiteHeader = activeThemeName.value.includes('White Header');
        return {
          fontFamily: "'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive",
          fontWeight: '400',
          fontStyle: 'normal',
          letterSpacing: '0.05em',
          textTransform: 'none',
          color: isWhiteHeader ? '#1a1a1a' : '#ffffff',
        };
      }
      return {};
    });

    // Computed style for user name - changes based on theme
    const userNameStyle = computed(() => {
      const isWhiteHeader = activeThemeName.value &&
        activeThemeName.value.includes('LineA Modern White Header');
      const isWhiteLattus = activeThemeName.value &&
        activeThemeName.value.includes('White Lattus');
      const isSilverCrisCross = activeThemeName.value &&
        activeThemeName.value.includes('Silver Cris-Cross');

      if (isWhiteHeader) {
        return {
          color: '#1a1a1a', // Black on white header
        };
      } else if (isWhiteLattus || isSilverCrisCross) {
        return {
          color: '#ffffff', // White on purple header
        };
      }
      return {};
    });

    // Computed style for header buttons (About, dropdowns, etc.) - changes based on theme
    const headerButtonStyle = computed(() => {
      const isWhiteHeader = activeThemeName.value &&
        activeThemeName.value.includes('LineA Modern White Header');
      const isWhiteLattus = activeThemeName.value &&
        activeThemeName.value.includes('White Lattus');
      const isSilverCrisCross = activeThemeName.value &&
        activeThemeName.value.includes('Silver Cris-Cross');

      if (isWhiteHeader) {
        return {
          color: '#1a1a1a', // Black on white header
        };
      } else if (isWhiteLattus || isSilverCrisCross) {
        return {
          color: '#ffffff', // White on purple header
        };
      }
      return {};
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
          case '/test-runner':
            return 'Admin - Test Runner';
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

      // Return base title without (TEST) - orange pill badge already indicates test environment
      return baseTitle;
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
      // Load products for Shop section
      loadProducts();

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
      headerClasses,
      headerInlineStyle,
      headerTitleStyle,
      headerTitleSpanStyle,
      userNameStyle,
      headerButtonStyle,
      isTestEnvironment,
      isAtMarketEvent,
      activeMarketEvent,
      hasActiveEvent,
      isMarketCustomer,
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
      toggleCustomerMode,
      // Shop section
      hoveredCategory,
      customCollections,
      designerCollections,
      specialtyCollections,
      scrollToSection,
    };
  },
};
</script>

<style lang="scss">
// Default header gradient - will be overridden by theme styles
.q-header:not([data-theme-override]) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

// Ensure toolbar title stays centered
.q-toolbar {
  position: relative;
  padding-left: 8px;
  padding-right: 8px;

  // Ensure right side elements respect title space
  > .shop-header-dropdowns {
    margin-left: auto;
    padding-left: 20px; /* Extra padding to keep away from title */
  }
}

.q-toolbar-title {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: fit-content !important; /* Fit content width */
  min-width: 225px !important; /* Ensure minimum width for title */
  max-width: none !important;
  text-align: center;
  z-index: 99999 !important; /* Extremely high z-index - title is ALWAYS on top */
  pointer-events: none; /* Allow clicks to pass through to elements below */
  flex-shrink: 0 !important; /* Prevent title from shrinking */
  padding: 0 40px !important; /* Increased padding to create protected zone around title */
  background: transparent !important; /* Ensure no background interferes */
  box-sizing: content-box;
  visibility: visible !important; /* Always visible */
  opacity: 1 !important; /* Always fully opaque */
  overflow: visible !important; /* Prevent clipping */
  text-overflow: clip !important; /* Don't truncate text */
  // Ensure title never gets clipped by parent containers
  clip-path: none !important;
  clip: auto !important;

  // Override Quasar's ellipsis class if present
  &.ellipsis,
  &[class*="ellipsis"] {
    overflow: visible !important;
    text-overflow: clip !important;
    white-space: nowrap !important;
  }

  span {
    pointer-events: auto; /* Re-enable pointer events for the title text itself */
    white-space: nowrap !important; /* Prevent text wrapping */
    display: inline-block !important; /* Let text determine width naturally */
    position: relative;
    z-index: 10000 !important; /* Even higher z-index for the text itself */
    visibility: visible !important; /* Always visible */
    opacity: 1 !important; /* Always fully opaque */
    overflow: visible !important; /* Prevent text clipping */
    text-overflow: clip !important; /* Don't truncate text */
    max-width: none !important; /* No max-width restriction */
    width: auto !important; /* Let text determine width */
  }
}

// Ensure title has protected space - menus must hide before reaching title area
.q-toolbar {
  position: relative;
  padding-left: 8px;
  padding-right: 8px;

  // Ensure right side elements respect title space
  > .shop-header-dropdowns {
    margin-left: auto;
  }

}

// Keep logo large on medium screens
@media (min-width: 601px) and (max-width: 1024px) {
  .q-toolbar-title {
    font-size: 1.5rem !important;
  }
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
  flex-shrink: 0 !important; /* Don't shrink */
  z-index: 100 !important; /* Above menus but below title */
  margin-left: 8px; /* Small gap from menus */
  position: relative;
}

// Ensure About button doesn't get overlapped
.q-toolbar > .gt-xs.q-btn[label="About"],
.q-toolbar > .q-btn:has([aria-label*="About"]) {
  flex-shrink: 0 !important; /* Don't shrink */
  z-index: 100 !important; /* Above menus but below title */
  margin-left: 8px; /* Small gap from menus */
  position: relative;
}

// Ensure shopping cart button also doesn't get overlapped
.q-toolbar > .q-btn[aria-label="Shopping Cart"] {
  flex-shrink: 0 !important;
  z-index: 100 !important;
  position: relative;
}

.customer-mode-toggle {
  font-size: 0.75rem;
  padding: 4px 8px;
  min-height: 28px;
  opacity: 0.9;
  transition: opacity 0.2s;
}

// Shop section styles
.shop-category-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.collection-submenu {
  background-color: rgba(0, 0, 0, 0.02);
  border-left: 2px solid rgba(0, 0, 0, 0.1);
  margin-left: 8px;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.collection-item {
  padding: 4px 8px;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

// Header shop dropdowns for wide screens
// Container always visible on screens > 960px, individual buttons hide one by one
.shop-header-dropdowns {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
  z-index: 1; /* Lower than title (9999) to ensure title stays on top */
  margin-left: auto; /* Push to the right */
  flex-shrink: 0; /* Prevent shrinking */
  margin-right: 0;
  padding-left: 10px; /* Reduced padding to bring menus closer to title */
  // Don't allow menus to extend into the center 300px where title is (225px min-width + 75px padding)
  max-width: calc(50% - 150px); /* Leave 300px protected zone in center for title */
}

// Individual button base styles - visible by default on wide screens
.shop-header-btn-custom,
.shop-header-btn-designer,
.shop-header-btn-specialty {
  display: flex !important;
  flex-shrink: 0; /* Don't shrink buttons */
}

// Hide dropdowns one by one from RIGHT to LEFT as screen gets smaller
// Each menu hides individually BEFORE covering the title or overlapping About/user
// Breakpoints are conservative to ensure title is NEVER cut off
// Hide Specialty Products first (rightmost menu) - hide early to protect title
@media (max-width: 1300px) {
  .shop-header-dropdowns .shop-header-btn-specialty {
    display: none !important;
  }
}

// Hide Designer Magnets next (middle menu) - hide before reaching title
@media (max-width: 1200px) {
  .shop-header-dropdowns .shop-header-btn-designer {
    display: none !important;
  }
}

// Hide Custom Photo Magnets last (leftmost menu) - hide before touching title
@media (max-width: 1100px) {
  .shop-header-dropdowns .shop-header-btn-custom {
    display: none !important;
  }
}

// When left drawer is open, adjust breakpoints to account for reduced space
// Drawer is typically ~300px wide, so menus need to hide much earlier
.q-toolbar.drawer-open {
  // Reduce max-width even more when drawer is open to protect title
  .shop-header-dropdowns {
    max-width: calc(50% - 200px); /* Larger protected zone when drawer open */
  }

  // Hide Specialty Products earlier when drawer is open
  @media (max-width: 1600px) {
    .shop-header-dropdowns .shop-header-btn-specialty {
      display: none !important;
    }
  }

  // Hide Designer Magnets earlier when drawer is open
  @media (max-width: 1500px) {
    .shop-header-dropdowns .shop-header-btn-designer {
      display: none !important;
    }
  }

  // Hide Custom Photo Magnets earlier when drawer is open
  @media (max-width: 1400px) {
    .shop-header-dropdowns .shop-header-btn-custom {
      display: none !important;
    }
  }
}

// Hide entire dropdown container only on mobile (< 960px) - menus are in sidebar
@media (max-width: 960px) {
  .shop-header-dropdowns {
    display: none !important;
  }
}

// Ensure container is visible on screens > 960px
@media (min-width: 961px) {
  .shop-header-dropdowns {
    display: flex !important;
  }
}

.shop-header-btn {
  min-width: auto;
  position: relative;
  z-index: 1; /* Lower than title z-index (9999) */
  /* Don't set display here - let individual button classes control it */

  .q-btn__content {
    padding: 0 8px;
  }

  // Ensure dropdown menu appears below the button, not overlapping title
  :deep(.q-menu) {
    z-index: 50; /* Dropdown menu z-index, but still below title (9999) */
    margin-top: 4px; /* Small gap from button */
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
  // Always ensure white text for test environment chip, regardless of theme
  color: #ffffff !important;

  span, .q-chip__content, * {
    color: #ffffff !important;
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

// Global chip icon styling
:deep(.q-chip__icon) {
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 1.5em !important;
  margin: 0.27em !important;
}

// Mobile responsive adjustments
@media (max-width: 600px) {
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
