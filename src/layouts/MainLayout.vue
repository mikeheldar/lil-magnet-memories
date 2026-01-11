<template>
  <q-layout view="hHh lpR fFf">
    <q-header
      elevated
      :class="[headerClasses, { 'header-hidden': !headerVisible }]"
      :style="headerInlineStyle"
    >
      <q-toolbar :class="{ 'drawer-open': leftDrawerOpen }">
        <!-- Menu button (always visible) - hamburger icon -->
        <q-btn
          flat
          dense
          @click="toggleLeftDrawer"
          aria-label="Menu"
          class="q-mr-sm hamburger-menu-btn"
        >
          <q-icon name="menu" />
        </q-btn>

        <!-- Logo on the left -->
        <q-btn flat dense @click="$router.push('/')" class="q-mr-md header-element-responsive logo-header-btn">
          <img
            src="/assets/lil-magnet-memories-logo.png"
            alt="Lil Magnet Memories"
            class="logo-header"
            style="height: 40px; width: auto"
          />
        </q-btn>

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
          <span
            class="text-h5 text-weight-bold header-title-clickable"
            :style="headerTitleSpanStyle"
            @click="$router.push('/')"
          >
            {{ pageTitle }}
          </span>
        </q-toolbar-title>


        <!-- About Button (medium and large screens only) -->
        <q-btn
          flat
          dense
          class="gt-sm q-mr-sm header-element-responsive about-header-btn"
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


        <!-- User Profile Dropdown (only when authenticated) - triangle dropdown icon -->
        <template v-if="isAuthenticated">
          <q-btn-dropdown 
            flat 
            dense 
            no-caps 
            class="user-profile-dropdown" 
            :style="headerButtonStyle"
            dropdown-icon="arrow_drop_down"
          >
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
          <!-- Info Icon (small screens only, hidden on medium+) -->
          <q-btn
            flat
            dense
            icon="info"
            :style="headerButtonStyle"
            @click="$router.push('/about')"
            aria-label="About Li'l Magnet Memories"
            class="q-ml-xs lt-md"
          >
            <q-tooltip>About Li'l Magnet Memories</q-tooltip>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <!-- Sub-Navigation Bar (below header, small screens and up - includes medium) -->
    <div class="sub-navigation-bar gt-xs" :class="[headerClasses, { 'header-hidden': !headerVisible }]">
      <div class="sub-nav-container">
        <!-- Custom Photo Magnets Dropdown -->
        <q-btn-dropdown
          flat
          dense
          no-caps
          label="Custom Photo Magnets"
          class="sub-nav-btn sub-nav-btn-custom"
        >
          <q-list v-if="customProductsList.length > 0">
            <q-item
              v-for="product in customProductsList"
              :key="product.id"
              clickable
              v-close-popup
              @click="$router.push(`/product/custom/${product.id}`)"
            >
              <q-item-section>
                <q-item-label>{{ product.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-list v-else>
            <q-item clickable v-close-popup @click="$router.push('/products/custom')">
              <q-item-section>
                <q-item-label>View All Products</q-item-label>
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
          class="sub-nav-btn sub-nav-btn-designer"
        >
          <q-list v-if="designerProductsList.length > 0">
            <q-item
              v-for="product in designerProductsList"
              :key="product.id"
              clickable
              v-close-popup
              @click="$router.push(`/product/designer/${product.id}`)"
            >
              <q-item-section>
                <q-item-label>{{ product.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-list v-else>
            <q-item clickable v-close-popup @click="$router.push('/products/designer')">
              <q-item-section>
                <q-item-label>View All Products</q-item-label>
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
          class="sub-nav-btn sub-nav-btn-specialty"
        >
          <q-list v-if="specialtyProductsList.length > 0">
            <q-item
              v-for="product in specialtyProductsList"
              :key="product.id"
              clickable
              v-close-popup
              @click="$router.push(`/product/specialty/${product.id}`)"
            >
              <q-item-section>
                <q-item-label>{{ product.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
          <q-list v-else>
            <q-item clickable v-close-popup @click="$router.push('/products/specialty')">
              <q-item-section>
                <q-item-label>View All Products</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

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

    <!-- Left Drawer for Navigation - positioned under header -->
    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      class="drawer-under-header"
      :overlay="false"
      :breakpoint="0"
      :width="300"
    >
      <!-- Drawer background only - menu is in fixed container outside drawer -->
    </q-drawer>

    <!-- Drawer header fill - always at top (0,0), behind header when visible, only visible when drawer is open -->
    <div
      v-show="leftDrawerOpen"
      class="drawer-header-fill"
    >
      <q-btn
        flat
        dense
        icon="menu"
        @click="toggleLeftDrawer"
        aria-label="Close Menu"
        class="drawer-close-btn hamburger-menu-btn"
        :style="{ color: '#30343F' }"
      />
    </div>

    <!-- Floating menu container that stays fixed when scrolling main page - outside drawer to avoid transform context -->
    <div
      ref="drawerMenuContainerRef"
      class="drawer-menu-container"
      :class="{ 'header-hidden': !headerVisible }"
      v-show="leftDrawerOpen"
    >
      <q-list>
        <q-item-label header class="text-grey-8"> Navigation </q-item-label>

        <!-- Home (always at top) -->
        <q-item clickable v-ripple @click="navigateTo('/')">
          <q-item-section avatar>
            <q-icon name="home" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Home</q-item-label>
            <q-item-label caption>Go to main page</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <!-- Shop section (always visible) -->
        <q-expansion-item
          icon="shopping_bag"
          label="Shop"
          :default-opened="true"
          header-class="text-grey-8"
        >
          <!-- Custom Photo Magnets -->
          <div class="shop-category-wrapper">
            <q-item
              clickable
              v-ripple
              @click="$router.push('/products/custom')"
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

            <!-- Show products for Custom (only on hover) -->
            <div v-if="customProductsList.length > 0" class="product-submenu q-pl-xl q-pr-md q-pb-sm">
            <q-item
              v-for="product in customProductsList"
              :key="product.id"
              clickable
              v-ripple
              dense
              @click.stop="$router.push(`/product/custom/${product.id}`)"
              class="product-item"
            >
              <q-item-section>
                <q-item-label class="text-caption">{{ product.description }}</q-item-label>
              </q-item-section>
            </q-item>
            </div>
          </div>

          <!-- Designer Magnets -->
          <div class="shop-category-wrapper">
            <q-item
              clickable
              v-ripple
              @click="$router.push('/products/designer')"
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

            <!-- Show products for Designer (only on hover) -->
            <div v-if="designerProductsList.length > 0" class="product-submenu q-pl-xl q-pr-md q-pb-sm">
            <q-item
              v-for="product in designerProductsList"
              :key="product.id"
              clickable
              v-ripple
              dense
              @click.stop="$router.push(`/product/designer/${product.id}`)"
              class="product-item"
            >
              <q-item-section>
                <q-item-label class="text-caption">{{ product.description }}</q-item-label>
              </q-item-section>
            </q-item>
            </div>
          </div>

          <!-- Specialty Products -->
          <div class="shop-category-wrapper">
            <q-item
              clickable
              v-ripple
              @click="$router.push('/products/specialty')"
              class="shop-category-item"
            >
              <q-item-section avatar>
                <q-icon name="card_giftcard" color="specialty" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Specialty Products</q-item-label>
                <q-item-label caption>Unique specialty items</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Show products for Specialty (only on hover) -->
            <div v-if="specialtyProductsList.length > 0" class="product-submenu q-pl-xl q-pr-md q-pb-sm">
            <q-item
              v-for="product in specialtyProductsList"
              :key="product.id"
              clickable
              v-ripple
              dense
              @click.stop="$router.push(`/product/specialty/${product.id}`)"
              class="product-item"
            >
              <q-item-section>
                <q-item-label class="text-caption">{{ product.description }}</q-item-label>
              </q-item-section>
            </q-item>
            </div>
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

        <!-- Content for non-authenticated users -->
        <template v-if="!isAuthenticated">
        </template>

        <!-- Content for authenticated users -->
        <template v-else>
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

              <q-item clickable v-ripple @click="navigateTo('/reviews-management')">
                <q-item-section avatar>
                  <q-icon name="rate_review" color="blue" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Reviews Management</q-item-label>
                  <q-item-label caption>Manage customer reviews</q-item-label>
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
    </div>

    <q-page-container>
      <!-- Page Title Section removed - no headers on non-landing pages -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
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
    const drawerMenuContainerRef = ref(null);
    const { cartItemCount } = useCart();

    // Header scroll behavior - hide on scroll down, show on scroll up
    const headerVisible = ref(true);
    let lastScrollTop = 0;
    const scrollThreshold = 5; // Reduced threshold for more sensitive detection

    const handleScroll = () => {
      // On small screens, always keep header visible and don't allow main page scrolling
      const isSmallScreen = window.innerWidth <= 599;
      if (isSmallScreen) {
        headerVisible.value = true;
        return;
      }

      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      // Determine scroll direction
      const scrollingDown = currentScrollTop > lastScrollTop;
      const scrollingUp = currentScrollTop < lastScrollTop;

      // Always show header on scroll up - check this FIRST before any threshold checks
      if (scrollingUp) {
        headerVisible.value = true;
        // Allow scrolling to absolute top (scrollTop: 0)
        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        return; // Exit early to ensure header shows immediately on any scroll up
      }

      // For scrolling down, only trigger if scroll distance is significant
      if (scrollingDown && Math.abs(currentScrollTop - lastScrollTop) < scrollThreshold) {
        lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        return;
      }

      if (scrollingDown && currentScrollTop > 100) {
        // Scrolling down and past 100px - hide header
        headerVisible.value = false;
      } else if (currentScrollTop <= 100) {
        // Near the top (within 100px) - always show header
        headerVisible.value = true;
      }

      // Always allow scrolling to absolute top
      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
    };
    const userProfile = ref({
      displayName: null,
      photoURL: null,
      email: null,
    });

    const { setCustomerType, isMarketCustomer } = useCustomerType();

    // Shop section state
    const products = ref([]);

    // Computed product lists for each category
    const customProductsList = computed(() => {
      return products.value.filter((p) => p.category === 'custom');
    });

    const designerProductsList = computed(() => {
      return products.value.filter((p) => p.category === 'designer');
    });

    const specialtyProductsList = computed(() => {
      return products.value.filter((p) => p.category === 'specialty');
    });



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
          timeout: 1000,
        });
      } else {
        setCustomerType('market_customer');
        $q.notify({
          type: 'positive',
          message: 'Switched to Market Event Mode',
          caption: "You'll see pickup and local payment options",
          position: 'top',
          timeout: 1000,
        });
      }
    };

    // Watch for drawer opening and scroll menu to top, reset scroll position
    watch(leftDrawerOpen, (isOpen) => {
      if (isOpen && drawerMenuContainerRef.value) {
        // Use nextTick to ensure DOM is updated
        setTimeout(() => {
          if (drawerMenuContainerRef.value) {
            // Always scroll to top when drawer opens
            drawerMenuContainerRef.value.scrollTop = 0;
          }
        }, 0);
      }
    });

    onMounted(() => {
      // Ensure header is visible on initial page load
      const initialScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isSmallScreen = window.innerWidth <= 599;
      if (isSmallScreen || initialScrollTop <= 100) {
        headerVisible.value = true;
      }
      lastScrollTop = initialScrollTop;

      // Add scroll listener for header hide/show behavior
      window.addEventListener('scroll', handleScroll, { passive: true });

      // Listen for window resize to handle screen size changes
      const handleResize = () => {
        const isSmall = window.innerWidth <= 599;
        if (isSmall) {
          // On small screens, prevent scrolling only if drawer is open
          if (leftDrawerOpen.value) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }
          headerVisible.value = true; // Always show header on small screens
        } else {
          // On larger screens, always allow scrolling
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
      };
      window.addEventListener('resize', handleResize);

      // No custom drawer positioning needed - Quasar's layout view "hHh lpR fFf" handles it automatically
    });

    onUnmounted(() => {
      // Remove scroll listener on unmount
      window.removeEventListener('scroll', handleScroll);
      // Restore body scrolling
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    });

    // Computed classes for header - hardcoded to LineA Modern Black Header
    // Styles are defined in app.scss, these classes just ensure proper base styling
    const headerClasses = computed(() => {
      // LineA Modern Black Header - don't use bg-primary, styles are in app.scss
      return 'text-white';
    });

    // Computed inline style for header - Jet Black from design system
    const headerInlineStyle = computed(() => {
      // Use Jet Black (#30343F) from Moonlight Glow palette
      return {
        background: '#30343F',
        backgroundColor: '#30343F',
        backgroundImage: 'none',
      };
    });

    // Computed styles for header title - hardcoded to LineA Modern Black Header
    const headerTitleStyle = computed(() => {
      return {};
    });

    const headerTitleSpanStyle = computed(() => {
      // Use design system sans font - same as sub-nav items
      return {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", // foundation.typography.fontFamily.sans
        fontWeight: '500', // foundation.typography.fontWeight.medium
        fontStyle: 'normal', // foundation.typography.fontStyle.normal
        letterSpacing: '0.01em', // foundation.typography.letterSpacing.wide
        textTransform: 'none',
        color: '#ffffff', // White text on black header
      };
    });

    // Computed style for user name - hardcoded to white for black header
    const userNameStyle = computed(() => {
      return {
        color: '#ffffff', // White text on black header
      };
    });

    // Computed style for header buttons - use design system sans font, white text
    const headerButtonStyle = computed(() => {
      return {
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", // foundation.typography.fontFamily.sans - same as sub-nav
        fontWeight: '500', // foundation.typography.fontWeight.medium
        fontStyle: 'normal', // foundation.typography.fontStyle.normal
        letterSpacing: '0.01em', // foundation.typography.letterSpacing.wide
        color: '#ffffff', // White text on black header
      };
    });

    // Header always shows "Lil' Magnet Memories"
    const pageTitle = computed(() => {
      return "Li'l Magnet Memories";
    });

    // Get page title for display below header (on the page itself)
    const getPageTitle = (path) => {
      // Remove page titles from all pages except landing page
      // Keep only landing page without title
      if (path === '/') {
        return null; // Landing page - no title
      }
      return null; // All other pages - no page title header
    };

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
            timeout: 1000,
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
            timeout: 1000,
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
            timeout: 1000,
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
      getPageTitle,
      headerClasses,
      headerInlineStyle,
      headerVisible,
      headerTitleStyle,
      headerTitleSpanStyle,
      userNameStyle,
      headerButtonStyle,
      isAtMarketEvent,
      activeMarketEvent,
      hasActiveEvent,
      isMarketCustomer,
      isAuthenticated,
      isAdmin,
      leftDrawerOpen,
      drawerMenuContainerRef,
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
      customProductsList,
      designerProductsList,
      specialtyProductsList,
    };
  },
};
</script>

<style lang="scss">
// Hamburger menu icon - bigger size, consistent positioning
.hamburger-menu-btn {
  position: relative !important; // Keep position stable
  .q-icon {
    font-size: 28px !important; // Increased from default ~24px
  }
  // Ensure button doesn't change size or position on scroll
  min-width: 48px !important;
  min-height: 48px !important;
}

// Ensure header is above drawer
.q-header {
  z-index: 3000 !important; // Header must be above drawer
  position: relative !important; // Ensure z-index works
}

// Drawer positioned under header - Quasar's layout view "hHh lpR fFf" handles this automatically
// The 'p' in 'lpR' means the drawer is positioned below the header
// Make drawer sticky/fixed when open and move with header on scroll
// The drawer should move up/down with the header when scrolling
.q-drawer.drawer-under-header {
  position: fixed !important;
  top: 84px !important; // Position below header (84px on small screens)
  left: 0 !important;
  bottom: 0 !important; // Extend to bottom of viewport
  height: auto !important; // Let bottom handle height
  max-height: calc(100vh - 84px) !important;
  z-index: 2000 !important; // Below header but above content
  background: #FAFAFF !important; // Ghost White from design system
  overflow: hidden !important; // Don't allow drawer itself to scroll - menu container handles it
  overflow-y: hidden !important;
  overflow-x: hidden !important;
  // Always visible when drawer is open - no header synchronization
  transform: translateY(0) !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;

  // When header is hidden, extend to top of viewport
  &.header-hidden {
    top: 0 !important;
    max-height: 100vh !important;
  }

  // On medium+ screens, header is 64px
  @media (min-width: 768px) {
    top: 64px !important; // Position below header (64px on medium+ screens)
    max-height: calc(100vh - 64px) !important;
  }

  // Full width and full height on small screens - extend to bottom
  @media (max-width: 599px) {
    width: 100vw !important;
    height: calc(100vh - 84px) !important; // Full height minus header (84px on small)
    max-height: calc(100vh - 84px) !important;
    bottom: 0 !important; // Ensure it extends to bottom
  }
}

// Floating menu container - stays fixed in place when scrolling main page
// When drawer is open, this container stays fixed and scrolls independently
// Positioned outside drawer to avoid transform context issues
// Starts below drawer-header-fill (84px on small, 64px on medium+)
.drawer-menu-container {
  position: fixed !important; // Fixed to viewport, not sticky to page scroll
  top: 84px !important; // Position below drawer header fill (84px on small screens)
  left: 0 !important; // Align with drawer
  width: 300px !important; // Default width for medium+ screens
  max-height: calc(100vh - 84px) !important; // Full height minus drawer header fill
  overflow-y: auto !important; // Allow scrolling within menu if content is long
  overflow-x: hidden !important;
  z-index: 2001 !important; // Above drawer background but below drawer header fill
  background: #FAFAFF !important; // Ghost White from design system - match drawer background
  // Always visible when drawer is open - no header synchronization
  transform: translateY(0) !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  // Use flex but don't use !important so v-show can override with display: none
  display: flex;
  flex-direction: column !important;
  // Don't force visibility - let v-show control it
  visibility: visible;

  // Ensure the q-list inside always starts at the top
  .q-list {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  // On medium+ screens, drawer header fill is 64px
  @media (min-width: 768px) {
    top: 64px !important; // Position below drawer header fill (64px on medium+)
    max-height: calc(100vh - 64px) !important;
  }

  // Full width and full height on small screens - extend to bottom
  @media (max-width: 599px) {
    width: 100vw !important;
    height: calc(100vh - 84px) !important; // Full height minus drawer header fill
    max-height: calc(100vh - 84px) !important;
    bottom: 0 !important; // Ensure it extends to bottom
  }
}

// Drawer header fill - always at top (0,0), behind header when visible
// Only visible when drawer is open, positioned behind header (z-index below header)
// v-show="leftDrawerOpen" controls visibility - this ensures it's hidden when drawer closes
.drawer-header-fill {
  position: fixed !important;
  top: 0 !important; // Always at very top of screen
  left: 0 !important;
  width: 300px !important; // Match drawer width
  height: 84px !important; // Match header height exactly (84px on small screens)
  background: #FAFAFF !important; // Ghost White from design system
  display: flex; // Don't use !important so v-show can override with display: none
  align-items: center !important;
  padding-left: 16px !important;
  z-index: 2002 !important; // Below header (3000) but above drawer menu container
  border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important; // Subtle separator
  flex-shrink: 0 !important; // Don't shrink
  // Ensure v-show can hide this element
  visibility: visible !important;

  // On medium+ screens, header is 64px
  @media (min-width: 768px) {
    height: 64px !important; // Match header height exactly (64px on medium+ screens)
  }

  // Full width on small screens
  @media (max-width: 599px) {
    width: 100vw !important;
  }
}

// Ensure drawer header fill is hidden when drawer is closed (v-show sets display: none)
.drawer-header-fill[style*="display: none"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

.drawer-close-btn {
  // Match header hamburger button styling exactly
  // Use Jet Black from design system (primary/base color) for visibility on light background
  position: relative !important;
  min-width: 48px !important;
  min-height: 48px !important;
  color: #30343F !important; // Jet Black - semantic.color.primary.base / semantic.color.bg.header
  
  .q-icon {
    font-size: 28px !important; // Match main header hamburger size
    color: #30343F !important; // Jet Black - ensure icon color is set
  }

  &:hover {
    background-color: rgba(0, 0, 0, 0.05) !important; // Light hover for light background
  }
}

// Ensure drawer header fill hamburger is Jet Black even with hamburger-menu-btn class
// Use maximum specificity to override Quasar defaults and any other CSS
body .drawer-header-fill .drawer-close-btn,
body .drawer-header-fill .hamburger-menu-btn,
body .drawer-header-fill .q-btn,
body .drawer-header-fill .q-btn.q-btn--flat,
body .drawer-header-fill .q-btn .q-icon,
body .drawer-header-fill .q-btn__content,
body .drawer-header-fill .q-btn__content .q-icon,
.drawer-header-fill .drawer-close-btn,
.drawer-header-fill .hamburger-menu-btn,
.drawer-header-fill .q-btn,
.drawer-header-fill .q-btn.q-btn--flat,
.drawer-header-fill .q-btn .q-icon,
.drawer-header-fill .q-btn__content,
.drawer-header-fill .q-btn__content .q-icon {
  color: #30343F !important; // Jet Black - override all Quasar defaults
}

// Also target the icon directly with Material Icons class and all possible selectors
body .drawer-header-fill .material-icons,
.drawer-header-fill .material-icons,
.drawer-header-fill .q-icon.material-icons,
.drawer-header-fill .q-btn .material-icons,
.drawer-header-fill .q-btn__content .material-icons {
  color: #30343F !important; // Jet Black
  fill: #30343F !important; // Jet Black (for SVG icons)
}

// Override any text color inheritance
.drawer-header-fill * {
  color: #30343F !important; // Jet Black - catch-all for any child elements
}

// But allow text content to use default colors (only target icons/buttons)
.drawer-header-fill .q-item-label,
.drawer-header-fill .q-item-label * {
  color: inherit !important; // Allow text to use default colors
}

// Ensure drawer content is scrollable and takes full height
// Remove overflow from q-list since drawer-menu-container handles scrolling
.q-drawer.drawer-under-header .q-list {
  height: auto;
  overflow: visible;
}

// Override any Quasar layout positioning that might interfere
// Use very high specificity to override Quasar's layout system
.q-layout .q-drawer.drawer-under-header,
body .q-layout .q-drawer.drawer-under-header,
html body .q-layout .q-drawer.drawer-under-header {
  position: fixed !important;
  margin: 0 !important;
}

// Prevent page container from interfering with drawer
// Add padding to account for fixed header and sub-navigation bar
// Page title section - appears below header on each page
.page-title-section {
  background: #f5f5f5; // Light grey background matching drawer
  padding: 1rem 0;
  text-align: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.page-title-text {
  font-size: 1.5rem;
  font-weight: 500;
  color: #424242; // Dark grey text
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  letter-spacing: 0.01em;
}

.q-page-container {
  // Allow content to scroll under fixed drawer
  position: relative;
  z-index: 1;
  // Minimal padding - just enough to clear header (no extra empty space)
  // Small screens: just header height (84px)
  padding-top: 84px !important;

  // Medium+ screens: header (64px) + sub-nav (48px) - no extra spacing
  @media (min-width: 768px) {
    padding-top: calc(64px + 48px) !important;
  }
}

// Ensure body/html can scroll to absolute top
html, body {
  overflow-x: hidden;
  // Allow scrolling to absolute top (scrollTop: 0)
  scroll-behavior: auto;
  // Note: JavaScript controls overflow on small screens when drawer is open
  // CSS doesn't need to force it since we handle it dynamically
}

// Header scroll behavior - hide on scroll down, show on scroll up
// Note: z-index is set above in the drawer section
.q-header {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  z-index: 3000 !important; // Ensure it's above content
  // Header appears faster (0.25s) than sub-nav (0.3s) when showing, but hides slower (0.3s) than sub-nav (0.25s)
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  // Ensure header is visible by default
  transform: translateY(0) !important;
  opacity: 1 !important;
  visibility: visible !important;
  will-change: transform !important; // Optimize for transform animations

  // When appearing (not hidden), use faster transition so header shows before sub-nav
  &:not(.header-hidden) {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  &.header-hidden {
    // Move up by combined height (132px = 84px header + 48px sub-nav on small, 112px = 64px + 48px on medium+)
    transform: translateY(-132px) !important; // Default for small screens (84px header + 48px sub-nav)
    opacity: 0 !important;
    pointer-events: none !important;

    // On medium+ screens, header is 64px
    @media (min-width: 768px) {
      transform: translateY(-112px) !important; // Header (64px on medium+) + sub-nav (48px)
    }
  }

  // When visible, ensure it's at the top of viewport
  &:not(.header-hidden) {
    transform: translateY(0) !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }
}

// Default header - Jet Black from Moonlight Glow palette (will be overridden by inline styles)
.q-header:not([data-theme-override]) {
  background: #30343F !important; /* Jet Black from Moonlight Glow palette */
  background-color: #30343F !important;
  background-image: none !important;
}

// Ensure toolbar title stays centered
.q-toolbar {
  position: relative;
  padding-left: 8px;
  padding-right: 8px;

  // Ensure right side elements respect title space
}

// Make header title clickable to go home
// Use design system sans font - same as sub-nav items and About button
.header-title-clickable {
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
  pointer-events: auto !important; // Override parent's pointer-events: none
  display: inline-block !important; // Allow width to be determined by content
  max-width: 100% !important; // Ensure it doesn't exceed container, but container allows fit-content
  white-space: nowrap !important; // Prevent text wrapping
  overflow: visible !important; // Allow text to be fully visible
  // Standardized font from design system - same as sub-nav items
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important; // foundation.typography.fontFamily.sans
  font-weight: 500 !important; // foundation.typography.fontWeight.medium
  font-style: normal !important; // foundation.typography.fontStyle.normal
  letter-spacing: 0.01em !important; // foundation.typography.letterSpacing.wide

  &:hover {
    opacity: 0.8;
  }

  // Responsive font size on small screens to prevent text cutoff
  // Font size stays at 1.5rem (24px) above 405px, reduces to 1.2rem (19.2px) below 405px - just a few points smaller
  // Need very high specificity to override Quasar's .text-h5 class AND injected theme CSS
  @media (max-width: 405px) {
    font-size: 1.2rem !important; // Reduced from 1.5rem to 1.2rem (24px to 19.2px) - just a few points smaller
    letter-spacing: 0.02em !important; // Reduce letter spacing to make text more compact
    white-space: nowrap !important; // Prevent wrapping
    overflow: visible !important; // Allow text to be visible
    text-overflow: clip !important; // Clip instead of ellipsis, but font should shrink enough to prevent this
    max-width: calc(100vw - 120px) !important; // Reserve space for hamburger (~48px) and avatar (~72px)
  }

  // Extra small screens - slightly smaller
  @media (max-width: 360px) {
    font-size: 1.1rem !important; // Reduced to 1.1rem (17.6px) on very small screens - still readable, not tiny
    letter-spacing: 0 !important; // No letter spacing on very small screens
  }

  // Override .text-h5 class with even higher specificity - must match or exceed theme CSS specificity
  &.text-h5.text-weight-bold {
    @media (max-width: 405px) {
      font-size: 1.2rem !important; // Reduced from 1.5rem to 1.2rem - just a few points smaller
    }
    @media (max-width: 360px) {
      font-size: 1.1rem !important; // Reduced to 1.1rem on very small screens - still readable
    }
  }

  &:active {
    opacity: 0.6;
  }
}

.q-toolbar-title {
  position: absolute !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: fit-content !important; /* Fit content width */
  min-width: 225px !important; /* Ensure minimum width for title on larger screens */
  max-width: none !important;
  text-align: center;
  z-index: 99999 !important; /* Extremely high z-index - title is ALWAYS on top */
  pointer-events: none; /* Allow clicks to pass through to elements below, but children can override */
  flex-shrink: 0 !important; /* Prevent title from shrinking */
  padding: 0 10px !important; /* Reduced padding to allow menus to shift left */
  background: transparent !important; /* Ensure no background interferes */
  box-sizing: content-box;
  visibility: visible !important; /* Always visible */
  opacity: 1 !important; /* Always fully opaque */
  overflow: visible !important; /* Prevent clipping */
  text-overflow: clip !important; /* Don't truncate text */

  // Remove min-width constraint on small screens to allow title to shrink fully
  // Start resizing at 405px wide
  @media (max-width: 405px) {
    min-width: unset !important; /* Allow title to shrink to fit text */
    max-width: calc(100vw - 120px) !important; /* Reserve space for hamburger and avatar (roughly 60px each side) */
    padding: 0 5px !important; /* Reduce padding on small screens */
  }
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
  
  // Ensure dropdown icon (triangle) is visible and uses Material Icons font
  .q-btn-dropdown__arrow {
    color: white !important;
    opacity: 1 !important;
  }
  
  // Style the dropdown arrow icon specifically - MUST use Material Icons font
  .q-icon[name="arrow_drop_down"],
  .q-btn-dropdown__arrow .q-icon,
  .q-btn-dropdown__arrow {
    font-family: 'Material Icons' !important;
    font-weight: normal !important;
    font-style: normal !important;
    font-size: 24px !important;
    line-height: 1 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
    display: inline-block !important;
    white-space: nowrap !important;
    word-wrap: normal !important;
    direction: ltr !important;
    -webkit-font-feature-settings: 'liga' !important;
    -webkit-font-smoothing: antialiased !important;
    color: white !important;
    opacity: 1 !important;
  }
}

// Ensure hamburger menu icon is visible and uses Material Icons font
.hamburger-menu-btn {
  .q-icon[name="menu"],
  .q-btn__content .q-icon,
  .q-icon {
    font-family: 'Material Icons' !important;
    font-weight: normal !important;
    font-style: normal !important;
    font-size: 24px !important;
    line-height: 1 !important;
    letter-spacing: normal !important;
    text-transform: none !important;
    display: inline-block !important;
    white-space: nowrap !important;
    word-wrap: normal !important;
    direction: ltr !important;
    -webkit-font-feature-settings: 'liga' !important;
    -webkit-font-smoothing: antialiased !important;
    color: white !important;
    opacity: 1 !important;
  }
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
.shop-category-wrapper {
  position: relative;
}

.shop-category-item {
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.product-submenu {
  background-color: rgba(0, 0, 0, 0.02);
  border-left: 2px solid rgba(0, 0, 0, 0.1);
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.2s ease;
  
  .shop-category-wrapper:hover & {
    max-height: 500px;
    opacity: 1;
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

// Sub-Navigation Bar (below header, medium to large screens only)
.sub-navigation-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  // Use Ghost White from Moonlight Glow palette (#FAFAFF)
  background: #FAFAFF !important; // Ghost White from Moonlight Glow palette
  background-color: #FAFAFF !important;
  background-image: none !important;
  border-top: 1px solid rgba(0, 0, 0, 0.1); // Subtle border to separate from header (dark border on light background)
  // Text color is Jet Black (#30343F) from Moonlight Glow palette
  padding: 8px 20px;
  box-sizing: border-box;
  z-index: 2999; // Just below header but above content
  position: fixed !important;
  top: 84px !important; // Position below header (84px on small screens)
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  min-height: 48px; // Consistent height
  // Sub-nav disappears faster (0.25s) than header (0.3s) when hiding
  // Sub-nav appears slower (0.3s) than header (0.25s) when showing
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  // Ensure sub-nav is visible by default
  transform: translateY(0) !important;
  opacity: 1 !important;
  visibility: visible !important;
  will-change: transform !important; // Optimize for transform animations

  // On medium+ screens, header is 64px
  @media (min-width: 768px) {
    top: 64px !important; // Position below header (64px on medium+ screens)
  }

  // When hiding, use faster transition so sub-nav disappears before header
  &.header-hidden {
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  &.header-hidden {
    // Move up by combined height (132px = 84px header + 48px sub-nav on small, 112px = 64px + 48px on medium+)
    transform: translateY(-132px) !important; // Default for small screens (84px header + 48px sub-nav)
    opacity: 0 !important;
    pointer-events: none !important;

    // On medium+ screens, header is 64px
    @media (min-width: 768px) {
      transform: translateY(-112px) !important; // Header (64px on medium+) + sub-nav (48px)
    }
  }

  // When visible, ensure it's positioned correctly
  &:not(.header-hidden) {
    transform: translateY(0) !important;
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
  }
}

// Hide on small screens
@media (max-width: 767px) {
  .sub-navigation-bar {
    display: none !important;
  }
}

.sub-nav-container {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.sub-nav-btn {
  min-width: auto;
  position: relative;
  // Use design system sans font - standardized across navigation
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important; // foundation.typography.fontFamily.sans
  font-weight: 500 !important; // foundation.typography.fontWeight.medium
  font-style: normal !important; // foundation.typography.fontStyle.normal
  letter-spacing: 0.01em !important; // foundation.typography.letterSpacing.wide
  // Text color is Jet Black (#30343F) from Moonlight Glow palette (sub-nav has Ghost White background)
  color: #30343F !important; // Jet Black text on Ghost White background

  .q-btn__content {
    padding: 0 12px;
    color: #30343F !important; // Jet Black text from Moonlight Glow palette
    font-family: inherit !important; // Inherit from parent
    font-weight: inherit !important;
    font-style: inherit !important;
    letter-spacing: inherit !important;
  }
  
  // Ensure text and icons are Jet Black
  .q-icon,
  .q-btn__content * {
    color: #30343F !important; // Jet Black from Moonlight Glow palette
  }

  // Ensure dropdown menu appears below the button
  .q-menu {
    margin-top: 4px;
  }
}

// Responsive header element hiding - hide in order: About -> logo -> (never title)
// Priority order: About button -> Logo -> Title (never hidden)

// Hide About button first
@media (max-width: 1000px) {
  .about-header-btn.header-element-responsive {
    display: none !important;
  }
}

// Hide logo last (before title)
@media (max-width: 800px) {
  .logo-header-btn.header-element-responsive {
    display: none !important;
  }
}

// Title is NEVER hidden - it's always visible

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
    font-size: 1.5rem !important;
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
