<template>
  <q-page class="landing-page">
    <!-- Market Event Banner (only on small screens) -->
    <div v-if="hasActiveEvent" class="market-event-banner lt-sm">
      <div class="market-event-content">
        <q-icon name="event" size="24px" class="q-mr-sm banner-icon" />
        <div class="text-body1 text-white flex items-center q-gutter-sm banner-text">
            <strong>Market Event Live!</strong>
          <span class="gt-xs">We're at {{ activeMarketEventName }}.</span>
          <a
            v-if="activeMarketEventLink"
            :href="activeMarketEventLink"
            target="_blank"
            rel="noopener noreferrer"
            class="text-white text-weight-medium banner-link gt-md"
            style="text-decoration: underline; white-space: nowrap;"
          >
            Event Details
            <q-icon name="open_in_new" size="14px" class="q-ml-xs" />
          </a>
          <q-toggle
            v-model="isCustomerAtEvent"
            color="white"
            checked-icon="check_circle"
            unchecked-icon="radio_button_unchecked"
            @update:model-value="toggleCustomerAtEvent"
            class="banner-toggle q-ml-sm"
          >
            <span class="text-white text-body2 q-ml-sm gt-xs"
              >I'm at the event</span
            >
            <span class="text-white text-body2 q-ml-sm lt-sm">At event</span>
          </q-toggle>
        </div>
      </div>
    </div>

    <!-- Hero Section with Big Magnet Images -->
    <div class="hero-section" :class="{ 'test-environment': isTestEnvironment }">
      <!-- Content: text and easel gallery side-by-side on wide screens -->
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title">Turn Your Memories Into Beautiful Magnets!</h1>

        </div>

        <div class="hero-images">
          <div
            class="easel-container"
            @click="nextImage"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <div class="easel-image-wrapper">
              <transition name="slide" @enter="onSlideEnter" @leave="onSlideLeave">
                <img
                  :key="`easel-${easelImageIndex}`"
                  :src="currentEaselImage"
                  alt="Custom photo magnets on easel display"
                  class="easel-image"
                  :class="{ 'ken-burns-active': isKenBurnsActive }"
                  @load="handleImageLoad"
                  ref="easelImageRef"
                />
              </transition>
            </div>
            <!-- Image carousel dots (only show if more than 1 image) -->
            <div v-if="easelImages.length > 1" class="easel-carousel-dots">
              <button
                v-for="(image, index) in easelImages"
                :key="index"
                :class="[
                  'carousel-dot',
                  { 'dot-active': index === easelImageIndex },
                ]"
                @click.stop="goToImage(index)"
                aria-label="Go to image"
              />
            </div>
            <!-- Start Creating Magnets Now button (shown when checked into event) -->
            <div v-if="isCustomerAtEvent" class="start-creating-button-wrapper">
              <q-btn
                color="primary"
                size="lg"
                label="Start Creating Magnets Now"
                icon="camera_alt"
                class="start-creating-button"
                @click.stop="handleStartCreating"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="landing-container">
      <!-- How It Works Section -->
      <div class="how-it-works-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">How It Works</div>
        <div class="text-body1 text-center text-grey-7 q-mb-xl">
          Create personalized magnets in just a few simple steps
        </div>

        <!-- How It Works Steps -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="step-card text-center">
              <q-card-section>
                <div class="step-number">1</div>
                <q-icon name="photo" size="36px" class="text-primary q-mb-md" />
                <div class="text-h6 q-mb-sm">Select Product Type</div>
                <div class="text-body2 text-grey-7">
                  Choose your preferred magnet style and size
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="step-card text-center">
              <q-card-section>
                <div class="step-number">2</div>
                <q-icon
                  name="create"
                  size="36px"
                  class="text-primary q-mb-md"
                />
                <div class="text-h6 q-mb-sm">Create Your Magnets</div>
                <div class="text-body2 text-grey-7">
                  Upload photos and select quantity for best pricing
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="step-card text-center">
              <q-card-section>
                <div class="step-number">3</div>
                <q-icon
                  name="payment"
                  size="36px"
                  class="text-primary q-mb-md"
                />
                <div class="text-h6 q-mb-sm">Delivery & Payment</div>
                <div class="text-body2 text-grey-7">
                  Pay online or at market event pickup
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-card class="step-card text-center">
              <q-card-section>
                <div class="step-number">4</div>
                <q-icon
                  name="local_shipping"
                  size="36px"
                  class="text-primary q-mb-md"
                />
                <div class="text-h6 q-mb-sm">Get Your Magnets</div>
                <div class="text-body2 text-grey-7">
                  Shipped to you or pickup at market event
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Product Type Links Section -->
      <div class="product-links-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">
          Shop Our Products
        </div>
        <div class="row q-col-gutter-md justify-center">
          <div v-if="visibilityLoaded && productTypeVisibility.custom" class="col-12 col-md-4">
            <q-card class="product-link-card" @click="$router.push('/products/custom')">
              <q-card-section class="text-center">
                <q-icon name="camera_alt" size="64px" color="primary" class="q-mb-md" />
                <div class="text-h6 q-mb-sm">Custom Photo Magnets</div>
                <div class="text-body2 text-grey-7 q-mb-md">
                  Create personalized magnets from your own photos
                </div>
                <q-btn color="primary" label="Shop Now" outline />
              </q-card-section>
            </q-card>
          </div>
          <div v-if="visibilityLoaded && productTypeVisibility.designer" class="col-12 col-md-4">
            <q-card class="product-link-card" @click="$router.push('/products/designer')">
              <q-card-section class="text-center">
                <q-icon name="brush" size="64px" color="primary" class="q-mb-md" />
                <div class="text-h6 q-mb-sm">Designer Magnets</div>
                <div class="text-body2 text-grey-7 q-mb-md">
                  Shop our collection of beautifully designed ready-made magnets
                </div>
                <q-btn color="primary" label="Shop Now" outline />
              </q-card-section>
            </q-card>
          </div>
          <div v-if="visibilityLoaded && productTypeVisibility.specialty" class="col-12 col-md-4">
            <q-card class="product-link-card" @click="$router.push('/products/specialty')">
              <q-card-section class="text-center">
                <q-icon name="card_giftcard" size="64px" color="primary" class="q-mb-md" />
                <div class="text-h6 q-mb-sm">Specialty Products</div>
                <div class="text-body2 text-grey-7 q-mb-md">
                  Discover our unique specialty magnet products
                </div>
                <q-btn color="primary" label="Shop Now" outline />
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">
          What Our Customers Say
        </div>
        <div v-if="loadingReviews || !reviewsLoaded" class="text-center q-pa-lg">
          <q-spinner-dots size="40px" color="primary" />
          <div class="q-mt-md text-grey-6">Loading reviews...</div>
        </div>
        <div v-else-if="reviewsLoaded && verifiedReviews && verifiedReviews.length > 0" class="row q-col-gutter-md justify-center" :key="`reviews-${reviews.length}`">
          <div
            v-for="review in verifiedReviews"
            :key="review.id"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card class="review-card">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-avatar
                    v-if="review.profilePicture"
                    :src="review.profilePicture"
                    size="48px"
                    class="q-mr-sm"
                  />
                  <q-avatar
                    v-else
                    color="primary"
                    text-color="white"
                    size="48px"
                    class="q-mr-sm"
                  >
                    {{ review.customerName.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <div class="col">
                    <div class="text-weight-bold">{{ review.customerName }}</div>
                    <q-rating
                      :model-value="review.rating || 5"
                      :max="5"
                      size="16px"
                      readonly
                      class="star-rating"
                    />
                  </div>
                </div>
                <div class="text-body2 text-grey-8 q-mb-sm">
                  {{ review.reviewText }}
                </div>
                <q-chip
                  v-if="review.isVerified"
                  color="green"
                  text-color="white"
                  size="sm"
                  icon="verified"
                >
                  Verified Customer
                </q-chip>
              </q-card-section>
            </q-card>
          </div>
          <!-- Leave Your Review Card -->
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <q-card class="leave-review-card" @click="goToLeaveReview">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="col text-center">
                    <div class="text-weight-bold text-grey-8 q-mb-xs">Leave Your Review</div>
                    <q-rating
                      :model-value="0"
                      :max="5"
                      size="16px"
                      readonly
                      class="leave-review-stars"
                    />
                  </div>
                </div>
                <div class="text-body2 text-grey-7 text-center">
                  Share your experience with us!
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
        <div v-else-if="reviewsLoaded && (!verifiedReviews || verifiedReviews.length === 0)" class="text-center q-pa-xl">
          <div class="text-grey-6 q-mb-md">No verified reviews yet.</div>
          <!-- Leave Your Review Card (shown when no reviews) -->
          <div class="row justify-center">
            <div class="col-12 col-sm-8 col-md-6 col-lg-4">
              <q-card class="leave-review-card" @click="goToLeaveReview">
                <q-card-section class="text-center">
                  <q-icon name="rate_review" size="64px" color="primary" class="q-mb-md" />
                  <div class="text-h5 text-weight-bold q-mb-sm">Be the First to Review!</div>
                  <div class="text-body1 text-grey-7 q-mb-md">
                    Share your experience with us
                  </div>
                  <q-btn color="primary" label="Leave Your Review" icon="rate_review" />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>

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
  </q-page>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { firebaseService } from '../services/firebaseService.js';
import { config } from '../config/environment.js';
import { marketEventService } from '../services/marketEventService.js';
import { userPreferencesService } from '../services/userPreferencesService.js';
import { useQuasar } from 'quasar';
import { useCustomerType } from '../composables/useCustomerType.js';
import { useProductTypeVisibility } from '../composables/useProductTypeVisibility.js';
import { ensureNetworkReady } from '../firebase/config.js';

export default {
  name: 'LandingPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const quasar = $q; // Capture in local variable for safe access
    const signingIn = ref(false);
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);
    const reviews = ref([]);
    const loadingReviews = ref(true); // Start as true to prevent showing "no reviews" before load completes
    const reviewsLoaded = ref(false); // Track if reviews have been loaded at least once
    const { shouldShowMarketEventPrompt, setCustomerType, isMarketCustomer } =
      useCustomerType();
    
    // Use global product type visibility composable
    const { productTypeVisibility, visibilityLoaded, initializeVisibility } = useProductTypeVisibility();

    // Customer at event toggle - sync with customer type
    // Check if we're in test environment
    const isTestEnvironment = computed(() => config.isTest);

    const isCustomerAtEvent = computed({
      get: () => isMarketCustomer.value,
      set: () => {
        // This is handled by toggleCustomerAtEvent, but we need setter for v-model
      },
    });

    // Easel image rotation
    const easelImages = [
      '/biglogo.png',
      '/magnetboard.png',
      '/easel-gallery/0042F3E9-FEC0-4DE4-8AEB-2F3E0AA3ED01_1_105_c.jpeg',
      '/easel-gallery/1763CFC3-43BD-42A1-863F-48321A24C345_1_105_c.jpeg',
      '/easel-gallery/2BFB5E47-D6E7-4455-B35B-349E465B2DE8_1_105_c.jpeg',
      '/easel-gallery/3BA43977-727C-42F1-B2CB-1038CEF467B5_1_105_c.jpeg',
      '/easel-gallery/44CB83DA-24D2-4FA2-8C23-972607D3D8B0_1_105_c.jpeg',
      '/easel-gallery/49965978-B29E-4978-A194-94A9FE037F63_1_105_c.jpeg',
      '/easel-gallery/4DEB76BA-4D82-4894-A5BE-AB981B5A7F52_1_105_c.jpeg',
      '/easel-gallery/9E45E770-52EE-4A8A-B8E0-F0BF583C2B79_1_105_c.jpeg',
      '/easel-gallery/A34A11CE-C98C-43B7-83CF-7A372D1ECDA5_1_105_c.jpeg',
      '/easel-gallery/A8D8FCA6-9449-4759-9F96-0CCA3D972047_1_102_o.jpeg',
      '/easel-gallery/B8861A01-AF23-42A5-B84A-C7B1A17A7990_4_5005_c.jpeg',
      '/easel-gallery/C374BFFD-1749-4450-89D4-A87D1561EAF4_1_105_c.jpeg',
    ];
    const easelImageIndex = ref(0);
    const isKenBurnsActive = ref(false);
    const currentEaselImage = computed(
      () => easelImages[easelImageIndex.value]
    );

    // Navigation functions for easel gallery
    const goToImage = (index) => {
      if (index !== easelImageIndex.value) {
        easelImageIndex.value = index;
      }
    };

    const nextImage = () => {
      if (easelImages.length > 1) {
        const oldIndex = easelImageIndex.value;
        easelImageIndex.value =
          (easelImageIndex.value + 1) % easelImages.length;
        console.log('🔄 [LandingPage Easel] nextImage:', {
          from: oldIndex,
          to: easelImageIndex.value,
          totalImages: easelImages.length,
          component: 'LandingPage Easel Gallery - Simple Fade',
        });
      }
    };

    const previousImage = () => {
      if (easelImages.length > 1) {
        easelImageIndex.value =
          easelImageIndex.value === 0
            ? easelImages.length - 1
            : easelImageIndex.value - 1;
      }
    };

    // Touch/swipe handling for mobile
    const touchStartX = ref(0);
    const touchEndX = ref(0);
    const minSwipeDistance = 50; // Minimum distance in pixels to trigger swipe

    const handleTouchStart = (e) => {
      touchStartX.value = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      touchEndX.value = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (!touchStartX.value || !touchEndX.value) return;

      const distance = touchStartX.value - touchEndX.value;

      if (Math.abs(distance) > minSwipeDistance) {
        if (distance > 0) {
          // Swiped left - go to next image
          nextImage();
        } else {
          // Swiped right - go to previous image
          previousImage();
        }
      }

      // Reset touch values
      touchStartX.value = 0;
      touchEndX.value = 0;
    };

    // Handle image load
    const easelImageRef = ref(null);
    const handleImageLoad = () => {
      console.log('✅ [LandingPage Easel] Image loaded:', currentEaselImage.value);
    };

    // Handle slide transition events
    const onSlideEnter = (el) => {
      // Reset transform before starting Ken Burns
      if (el) {
        el.style.transform = '';
        void el.offsetHeight; // Force reflow
      }
      // Start Ken Burns after slide completes
      setTimeout(() => {
        isKenBurnsActive.value = true;
        console.log('▶️ [LandingPage Easel] Ken Burns started');
        
        // Reset Ken Burns after animation completes (7s) so it's ready for next slide
        setTimeout(() => {
          isKenBurnsActive.value = false;
          if (el) {
            el.style.animation = 'none';
            el.style.transform = 'scale(1) translate(0, 0)';
            void el.offsetHeight; // Force reflow
          }
          console.log('⏸️ [LandingPage Easel] Ken Burns completed, reset to original size');
        }, 7000); // After Ken Burns animation completes (7s)
      }, 1600); // After slide transition completes (1.5s + small buffer)
    };

    const onSlideLeave = (el) => {
      // Stop Ken Burns and reset transform before slide
      isKenBurnsActive.value = false;
      if (el) {
        // Reset any Ken Burns transform
        el.style.animation = 'none';
        el.style.transform = 'translateX(0)';
        void el.offsetHeight; // Force reflow
      }
      console.log('⏸️ [LandingPage Easel] Ken Burns paused for slide');
    };

    const handleGoogleSignIn = async () => {
      signingIn.value = true;

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (signingIn.value) {
          console.log('Sign-in timeout, resetting state');
          signingIn.value = false;
          safeNotify({
            type: 'negative',
            message: 'Sign-in timed out',
            caption:
              'The popup may have been blocked. Please check your browser settings.',
            position: 'top',
            timeout: 8000,
            actions: [
              {
                label: 'Try Again',
                color: 'white',
                handler: () => handleGoogleSignIn(),
              },
            ],
          });
        }
      }, 15000); // 15 second timeout

      try {
        console.log('Starting Google sign-in from landing page...');
        await authService.signInWithGoogle();

        safeNotify({
          type: 'positive',
          message: 'Successfully signed in!',
          caption: 'You can now access your orders and dashboard.',
          position: 'top',
        });

        // Redirect to orders page after successful sign-in
        router.push('/orders');
      } catch (error) {
        console.error('Sign in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific error cases with better guidance
        let errorMessage = 'Failed to sign in. Please try again.';
        let caption = '';

        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in was cancelled';
          caption = 'Please complete the sign-in process in the popup window.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Sign-in popup was blocked';
          caption = 'Please allow popups for this site and try again.';
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = 'Domain not authorized';
          caption = 'This domain is not authorized for Google sign-in.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Google sign-in not enabled';
          caption = 'Google sign-in is not enabled for this project.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error';
          caption = 'Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Sign-in timed out';
          caption = 'The sign-in process took too long. Please try again.';
        }

        safeNotify({
          type: 'negative',
          message: errorMessage,
          caption: caption,
          position: 'top',
          timeout: 8000,
          actions: [
            {
              label: 'Try Again',
              color: 'white',
              handler: () => handleGoogleSignIn(),
            },
          ],
        });
      } finally {
        console.log('Resetting signingIn state');
        clearTimeout(timeoutId);
        signingIn.value = false;
      }
    };

    // Navigation functions
    const goToOrdersList = () => {
      router.push('/orders');
    };

    const goToMyOrders = () => {
      router.push('/my-orders');
    };

    const goToLeaveReview = () => {
      router.push('/leave-review');
    };

    const showMarketEventDialog = ref(false);
    const activeMarketEvent = ref(null);
    const pendingProduct = ref(null);

    const goToUpload = (product = null) => {
      // Check if there's an active market event
      const activeEvent = marketEventService.getCheckedInEvent();

      const queryParams = product?.id ? { productId: product.id } : {};

      if (activeEvent) {
        // If user has toggled "I'm at the event", go directly to market upload
        if (isCustomerAtEvent.value) {
          setCustomerType('market_customer');
          router.push({
            path: '/photo-upload',
            query: queryParams,
          });
        } else {
          // User has explicitly toggled to say they're NOT at the event
          // Respect their choice and go directly to online mode (no dialog)
          setCustomerType('online_customer');
          router.push({
            path: '/photo-upload',
            query: queryParams,
          });
        }
      } else {
        // No active event - go to online order
        setCustomerType('online_customer');
        router.push({
          path: '/photo-upload',
          query: queryParams,
        });
      }
    };

    const confirmAtMarketEvent = () => {
      // Set the toggle state (this persists via localStorage in customerType composable)
      setCustomerType('market_customer');
      // Close dialog and navigate to market event upload
      showMarketEventDialog.value = false;
      const queryParams = pendingProduct.value?.id
        ? { productId: pendingProduct.value.id }
        : {};
      router.push({
        path: '/photo-upload',
        query: queryParams,
      });
      pendingProduct.value = null;
    };

    const goToOnlineOrder = () => {
      // User said they're not at the event - go to online ordering
      showMarketEventDialog.value = false;
      setCustomerType('online_customer');
      const queryParams = pendingProduct.value?.id
        ? { productId: pendingProduct.value.id }
        : {};
      router.push({
        path: '/online-order',
        query: queryParams,
      });
      pendingProduct.value = null;
    };

    const loadReviews = async () => {
      loadingReviews.value = true;
      reviewsLoaded.value = false;
      try {
        // Ensure Firestore network is ready before loading reviews
        // This prevents loading reviews before network is initialized on hard refresh
        console.log('⏳ Waiting for Firestore network to be ready...');
        await ensureNetworkReady();
        console.log('✅ Firestore network ready, loading reviews...');
        
        const reviewsData = await firebaseService.getReviews();
        // Use a new array reference to ensure reactivity
        reviews.value = Array.isArray(reviewsData) ? [...reviewsData] : [];
        console.log('✅ Reviews loaded:', reviews.value.length, 'total reviews');
        
        // Wait for computed to update
        await nextTick();
        
        const verifiedCount = verifiedReviews.value.length;
        console.log('✅ Verified reviews:', verifiedCount);
        console.log('✅ Reviews data:', reviews.value);
        
        // Mark as loaded after a brief delay to ensure reactivity
        await nextTick();
        reviewsLoaded.value = true;
      } catch (error) {
        console.error('Error loading reviews:', error);
        reviews.value = [];
        reviewsLoaded.value = true; // Still mark as loaded even on error
      } finally {
        loadingReviews.value = false;
        // Force reactivity update
        await nextTick();
      }
    };

    // Filter to only show verified reviews on landing page
    const verifiedReviews = computed(() => {
      if (!reviews.value || !Array.isArray(reviews.value) || reviews.value.length === 0) {
        return [];
      }
      // Filter for verified reviews, handling both boolean true and string 'true'
      const verified = reviews.value.filter((review) => {
        const isVerified = review.isVerified === true || review.isVerified === 'true' || review.isVerified === 1;
        return isVerified;
      });
      return verified;
    });

    // Watch reviews to ensure reactivity and log changes
    watch(reviews, (newReviews, oldReviews) => {
      console.log('🔄 Reviews changed:', {
        oldCount: oldReviews?.length || 0,
        newCount: newReviews?.length || 0,
        verifiedCount: verifiedReviews.value.length
      });
    }, { immediate: true, deep: true });

    // Initialize visibility settings - uses global cached state
    const loadVisibilitySettings = async () => {
      await initializeVisibility();
    };

    // Reactive ref to trigger updates when market events change
    const marketEventCheckTrigger = ref(0);
    let marketEventUnsubscribe = null;

    // Check if there's an active market event
    const hasActiveEvent = computed(() => {
      // Trigger reactivity
      marketEventCheckTrigger.value;
      return marketEventService.getCheckedInEvent() !== null;
    });

    // Get the active market event name for display
    const activeMarketEventName = computed(() => {
      // Trigger reactivity
      marketEventCheckTrigger.value;
      const event = marketEventService.getCheckedInEvent();
      return event ? event.name : '';
    });

    // Get the active market event link for display
    const activeMarketEventLink = computed(() => {
      // Trigger reactivity
      marketEventCheckTrigger.value;
      const event = marketEventService.getCheckedInEvent();
      return event?.eventLink || null;
    });

    // Show CTA button on larger screens OR when at market event
    const showCTAButton = computed(() => {
      // Check window width safely (may not be available during SSR)
      if (typeof window !== 'undefined') {
        // Always show on larger screens (gt-sm = > 600px)
        if (window.innerWidth > 600) {
          return true;
        }
      }
      // On small screens, only show if at market event
      return hasActiveEvent.value;
    });

    // Safe notify wrapper
    const safeNotify = (options) => {
      try {
        if (quasar && typeof quasar.notify === 'function') {
          quasar.notify(options);
        } else {
          console.log('Notification not available:', options);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    // Toggle customer at event
    const toggleCustomerAtEvent = async (value) => {
      if (value) {
        setCustomerType('market_customer');
        safeNotify({
          type: 'positive',
          message: 'Market event mode enabled!',
          caption: "You'll see pickup and local payment options",
          position: 'top',
          timeout: 3000,
        });
      } else {
        setCustomerType('online_customer');
        safeNotify({
          type: 'info',
          message: 'Switched to online mode',
          caption: "You'll see shipping options for orders",
          position: 'top',
          timeout: 2000,
        });
      }
    };

    // Handle Start Creating Magnets Now button click
    const handleStartCreating = () => {
      router.push('/photo-upload');
    };

    // Check if user is already authenticated
    onMounted(async () => {
      // Set up real-time listener for immediate updates
      marketEventUnsubscribe = marketEventService.addListener(() => {
        // Trigger reactivity when events change
        marketEventCheckTrigger.value++;
        console.log('🔄 Market events updated on landing page');
      });

      // Set up listener for user preferences (for syncing across devices)
      const userPrefsUnsubscribe = userPreferencesService.addListener(() => {
        // Trigger reactivity when preferences change
        console.log('🔄 User preferences updated on landing page');
        // Force update of isCustomerAtEvent computed
        marketEventCheckTrigger.value++;
      });

      // Initial check - cache should be populated quickly by real-time listener
      // But trigger an update to ensure UI reflects current state
      marketEventCheckTrigger.value++;

      // Cleanup listeners on unmount
      onUnmounted(() => {
        if (marketEventUnsubscribe) {
          marketEventUnsubscribe();
          marketEventUnsubscribe = null;
        }
        if (userPrefsUnsubscribe) {
          userPrefsUnsubscribe();
        }
      });

      // Load visibility settings first to prevent menu flash
      await loadVisibilitySettings();
      // Then load reviews to ensure they're ready before rendering
      await loadReviews();
      // Force a reactivity update after reviews are loaded
      await nextTick();
      // Log the final state
      console.log('📊 Final reviews state:', {
        totalReviews: reviews.value.length,
        verifiedReviews: verifiedReviews.value.length,
        loadingReviews: loadingReviews.value
      });

      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log(
          'User already authenticated on landing page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
        isAdmin.value = authService.isAdmin();

        // Only set customer type to admin if it's not already set to market_customer
        // This preserves the user's "at the event" toggle state
        if (isAdmin.value && !isMarketCustomer.value) {
          setCustomerType('admin');
        }
      }

      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user;
        isAdmin.value = authService.isAdmin();
        if (user) {
          console.log('User is already signed in:', user.email);
          console.log('Is admin:', isAdmin.value);

          // Only set customer type to admin if it's not already set to market_customer
          // This preserves the user's "at the event" toggle state
          if (isAdmin.value && !isMarketCustomer.value) {
            setCustomerType('admin');
          }
        }
      });

      // Don't auto-show dialog on load - only show when user clicks "Start Creating Magnets"

      console.log('🎬 [LandingPage Easel] Component mounted, using slide transitions with Ken Burns');

      // Start Ken Burns for initial image
      setTimeout(() => {
        isKenBurnsActive.value = true;
      }, 500);

      // Rotate easel images with slide transition
      // Only if more than 1 image
      if (easelImages.length > 1) {
        setInterval(() => {
          easelImageIndex.value =
            (easelImageIndex.value + 1) % easelImages.length;
        }, 8000); // 8 seconds between images (allows time for Ken Burns)
      }
    });

    return {
      easelImageRef,
      signingIn,
      isAuthenticated,
      isAdmin,
      reviews,
      loadingReviews,
      reviewsLoaded,
      verifiedReviews,
      hasActiveEvent,
      activeMarketEventName,
      activeMarketEventLink,
      isCustomerAtEvent,
      isTestEnvironment,
      showCTAButton,
      easelImages,
      currentEaselImage,
      easelImageIndex,
      isKenBurnsActive,
      showMarketEventDialog,
      activeMarketEvent,
      handleGoogleSignIn,
      goToOrdersList,
      goToMyOrders,
      goToLeaveReview,
      goToUpload,
      confirmAtMarketEvent,
      goToOnlineOrder,
      goToImage,
      nextImage,
      previousImage,
      toggleCustomerAtEvent,
      handleStartCreating,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleImageLoad,
      onSlideEnter,
      onSlideLeave,
      productTypeVisibility,
      visibilityLoaded,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '../css/quasar.variables.scss';
.landing-page {
  background: #ffffff; // Bright white
  background-image:
    // Criss-cross pattern - diagonal lines going right (45deg)
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 9px,
      rgba(0, 0, 0, 0.02) 9px,
      rgba(0, 0, 0, 0.02) 10px
    ),
    // Criss-cross pattern - diagonal lines going left (-45deg) to create X pattern
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 9px,
      rgba(0, 0, 0, 0.02) 9px,
      rgba(0, 0, 0, 0.02) 10px
    );
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.hero-section {
  min-height: auto; // Remove min-height to allow content to determine height
  display: flex;
  flex-direction: column; // Stack logo container and hero-content vertically
  align-items: stretch; // Stretch children to full width
  justify-content: flex-start;
  padding: 0 10px 20px 10px; // Reduced bottom padding from 40px to 20px to reduce space
  padding-top: 0 !important; // Ensure no top padding on any screen size

  // Remove test environment top padding override
  &.test-environment {
    padding-top: 0 !important;
  }

  // No top padding on any screen size
  @media (max-width: 600px) {
    padding-top: 0 !important;
    &.test-environment {
      padding-top: 0 !important;
    }
  }
  
  // Add 20px margin-top on all screens when subheader is present
  // This prevents text from touching the bottom of the subheader
  margin-top: 20px;

  width: 100%;
  max-width: 100%;
  background: #ffffff; // Bright white
  background-image:
    // Light source from upper left
    radial-gradient(
      ellipse 800px 600px at 0% 0%,
      rgba(255, 255, 255, 0.4) 0%,
      transparent 50%
    ),
    // Criss-cross pattern - diagonal lines going right (45deg)
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 9px,
      rgba(0, 0, 0, 0.02) 9px,
      rgba(0, 0, 0, 0.02) 10px
    ),
    // Criss-cross pattern - diagonal lines going left (-45deg) to create X pattern
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 9px,
      rgba(0, 0, 0, 0.02) 9px,
      rgba(0, 0, 0, 0.02) 10px
    );
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

.hero-logo-container {
  width: 100%;
  max-width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  padding: 0 20px;
  box-sizing: border-box;
  position: relative;
  align-self: stretch; // Stretch to full width of parent (hero-section)
  // Ensure it spans full width of hero-section, not constrained by hero-content
}

.hero-content {
  max-width: 100%; // Full width to allow easel to break out
  width: 100%; // Full width
  margin: 0 auto; // Center the container
  display: flex;
  flex-direction: column; // Stack content vertically (text, then easel)
  gap: 0; // Removed 40px spacing between hero-text and hero-images
  align-items: center; // Center all content
  z-index: 2;
  box-sizing: border-box;
  padding: 0; // No padding to allow edge-to-edge
}

// On all screen sizes, keep content stacked vertically and centered
.hero-content {
  display: flex;
  flex-direction: column; // Always stack vertically
  align-items: center; // Always center content
  gap: 0; // Removed 40px spacing
}

.hero-text {
  text-align: center; // Always center text
  align-items: center; // Always center items
  display: flex;
  flex-direction: column;
  align-content: center;
  justify-content: center;
}

.hero-images {
  width: 100%; // Full width for easel to break out
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 12px !important; // Reduced from 50px to 12px to reduce space below dots
}

.hero-text {
  color: white;
  text-align: center;
  width: 100%;
  max-width: 1200px; // Constrain text width for readability
  margin: 0 auto 20px auto; // Center the text content, 20px bottom margin
  padding: 0 20px; // Removed vertical padding (was 1rem)
  overflow: visible;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 0; // Removed gap (was 1rem)
  align-items: center; // Always center content
  align-content: center;
  justify-content: center;
}

.hero-logo {
  height: auto;
  margin-bottom: 0.5rem; // Minimal margin to move up
  margin-top: 0; // No top margin
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.hero-logo-wide {
  max-width: 70% !important; // 70% of visible content area - force override
  width: 70% !important; // 70% of visible content area - force override
  display: block;
  margin-left: auto !important;
  margin-right: auto !important;
}

// On wide screens, ensure logo stays at 80% of visible content area
@media (min-width: 1024px) {
  .hero-logo-container {
    width: 100%;
    max-width: 100%;
    display: flex;
    justify-content: center;
  }

  .hero-logo-wide {
    max-width: 70% !important; // 70% of visible content area (not viewport)
    width: 70% !important; // 70% of visible content area (not viewport)
    margin-left: auto; // Center it
    margin-right: auto; // Center it
  }
}

.hero-logo-small {
  display: none;
}

// Market event banner (only visible on small screens)
.market-event-banner {
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  background: $positive; // Green for larger screens
  
  // Hide on medium+ screens (gt-xs = > 599px)
  @media (min-width: 600px) {
    display: none !important;
  }

  @media (max-width: 600px) {
    padding: 0 12px;
    height: 50px;
    background: $light-purple; // Light purple on small screens
    display: flex;
    align-items: center;
    
    // Darker text for better contrast on light purple background
    .banner-text {
      color: $dark !important;
      
      strong {
        color: $dark !important;
      }
      
      span {
        color: $dark !important;
      }
      
      a {
        color: $primary !important;
      }
    }
    
    .banner-icon {
      color: $dark !important;
    }
    
    // Toggle should use dark color on light background
    .banner-toggle {
      .q-toggle__label {
        color: $dark !important;
      }
    }
  }
}

.market-event-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 8px;
  overflow: hidden;

  @media (max-width: 600px) {
    gap: 4px;
    flex-wrap: wrap;
  }
}

.banner-icon {
  @media (max-width: 600px) {
    font-size: 18px !important;
  }
}

.banner-text {
  flex-wrap: nowrap;
  white-space: nowrap;
  min-width: 0; // Allow flex items to shrink

  // Reduce font size on medium screens to fit everything on one line
  @media (min-width: 601px) and (max-width: 959px) {
    font-size: 0.85rem;
    gap: 4px !important;
  }

  @media (max-width: 600px) {
    font-size: 0.875rem;
    gap: 4px !important;
    flex-wrap: wrap;
    white-space: normal;
  }
}

.banner-link {
  white-space: nowrap;
  flex-shrink: 0; // Don't shrink the link
}

// Truncate event name on medium screens if it's too long
.banner-text > span.gt-xs {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  @media (min-width: 601px) and (max-width: 959px) {
    // Limit width on medium screens to prevent wrapping
    max-width: 250px;
  }
}

.banner-toggle {
  @media (max-width: 600px) {
    transform: scale(0.85);
  }
}

.hero-title {
  font-size: clamp(1.2rem, 3vw, 1.75rem); // Reduced max size from 2rem to 1.75rem (a few points smaller)
  font-weight: 600 !important; // Semi-bold for headings
  font-family: 'Josefin Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important; // Josefin Sans for headings
  margin-top: 0; // No top margin to align with easel container
  padding-top: 0; // No top padding
  font-style: normal !important; // Normal style (not italic)
  transform: none !important; // No skew transform
  margin: 0; // Remove margins, let flex gap handle spacing
  line-height: 1.3;
  color: #2c3e50; // Dark grey-blue for better readability
  // Silver border/outline around the text itself
  -webkit-text-stroke: 1px rgba(192, 192, 192, 0.5);
  text-stroke: 1px rgba(192, 192, 192, 0.5);
  // Reduced shadow/blur - lighter and less prominent
  text-shadow:
    -1px -1px 2px rgba(0, 0, 0, 0.1),
    0 1px 2px rgba(255, 255, 255, 0.5);
  white-space: normal;
  text-align: center;
  width: 100%;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  position: relative;
}


.hero-actions {
    margin-bottom: 10px; // Reduced margin
    margin-top: 0; // No top margin
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: visible; // Allow shadows to extend beyond container

    // Dark silver text for caption
    .text-caption.text-silver-dark {
      color: #6b6b6b !important; // Dark silver color
      font-weight: 500;
    }

  .cta-button {
    font-size: 1.3rem;
    font-weight: 600;
    padding: 16px 32px;
      // Use filter drop-shadow for natural, unclipped shadows
      filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.25))
              drop-shadow(0 8px 40px rgba(0, 0, 0, 0.15))
              drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1));
      // Use theme primary color
      background: var(--q-primary, #000000) !important;
    border: 3px solid white;
    color: white;
      overflow: visible; // Ensure button doesn't clip its own shadows
      position: relative; // Allow shadows to extend

    &:hover {
      transform: translateY(-2px);
      // More diffuse, natural shadows on hover
      filter: drop-shadow(0 6px 30px rgba(0, 0, 0, 0.3))
              drop-shadow(0 12px 50px rgba(0, 0, 0, 0.2))
              drop-shadow(0 4px 15px rgba(255, 255, 255, 0.15))
              drop-shadow(0 2px 10px rgba(255, 255, 255, 0.1));
      border-color: rgba(255, 255, 255, 0.9);
    }
  }

  // Force border-radius override - must be separate to override Quasar's rounded prop
  .cta-button,
  .cta-button.q-btn--rounded,
  .q-btn.cta-button.q-btn--rounded {
    border-radius: 30px !important; // Very rounded corners for testing - override Quasar's rounded prop
  }
}

.hero-images {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  overflow: visible; // Allow shadows from easel images to extend
  margin-bottom: 12px !important; // Reduced from 25px to 12px to reduce space below dots
}

.easel-container {
  width: 100%;
  max-height: 620px; // Set max height to 620px
  aspect-ratio: 16 / 9; // Wide rectangular format
  display: flex;
  position: relative; // For positioning the floating button
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  margin-top: 0;
  position: relative; // Ensure dots can be positioned relative to container
  padding-top: 0;
  padding-bottom: 60px; // Add padding at bottom to make room for dots (20px gap + 40px for dot height/padding)
  margin-bottom: 0;
  cursor: pointer;
  -webkit-user-select: none;
  user-select: none;
  overflow: visible; // Allow dots to be visible below container

  img {
    display: block;
    pointer-events: none; // Prevent image from blocking container clicks
  }
}

// Easel image wrapper - clips overflow for smooth simultaneous sliding and Ken Burns zoom
.easel-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden !important; // Clip images during transition
  flex: 1; // Take up available space in flex container
}

// On medium and large screens, ensure easel aligns properly
@media (min-width: 600px) {
  .easel-container {
    align-items: flex-start !important; // Align to top
    max-height: 620px !important; // Keep 620px max height
  }

  .easel-image {
    // Transform-based Ken Burns animation (no need to change object-position)
  }
}

// Image fills the wide rectangular container - simple, no animations
.easel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
  border-radius: 0;
  border: none;
  padding: 0;
  box-sizing: border-box;
  // Use filter drop-shadow for natural, unclipped shadows
  filter: drop-shadow(0 4px 30px rgba(0, 0, 0, 0.12))
          drop-shadow(0 8px 50px rgba(0, 0, 0, 0.08))
          drop-shadow(0 2px 15px rgba(0, 0, 0, 0.1));
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
}

// Slide transition - both images move together (slower)
.slide-enter-active {
  transition: transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.slide-leave-active {
  transition: transform 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-enter-to {
  transform: translateX(0);
}

.slide-leave-from {
  transform: translateX(0) !important;
}

.slide-leave-to {
  transform: translateX(-150%) !important;
}

// Ken Burns effect - zoom in more, then unzoom to original size before slide transition
.easel-image.ken-burns-active {
  animation: kenBurnsSlow 7s ease-in-out;
  animation-fill-mode: forwards;
}

@keyframes kenBurnsSlow {
  0% {
    transform: scale(1) translate(0, 0);
  }
  50% {
    transform: scale(1.15) translate(-3%, -2%); // Zoom in more (was 1.1)
  }
  100% {
    transform: scale(1) translate(0, 0); // Return to original size
  }
}

// Stop Ken Burns during slide transition and ensure slide transform takes precedence
.slide-enter-active,
.slide-leave-active {
  .ken-burns-active {
    animation: none !important;
  }
}

// Ensure slide transform overrides Ken Burns transform
.slide-enter-active .easel-image,
.slide-leave-active .easel-image {
  animation: none !important;
}

// Smoothly transition from Ken Burns transform to slide transform
// This prevents the jerk by ensuring the transform state is preserved
.slide-leave-active .easel-image {
  // Preserve any existing transform from Ken Burns and combine with slide
  // The transition will smoothly animate from the current Ken Burns state
  will-change: transform;
}

// All screen sizes: full width, edge to edge, wide rectangular format
.easel-container {
  width: 100vw !important; // Full viewport width, edge to edge
  max-width: 100vw !important;
  max-height: 620px !important; // Set max height to 620px on all screens
  margin-left: calc(-50vw + 50%) !important; // Break out of container to be edge-to-edge
  margin-right: calc(-50vw + 50%) !important;
  aspect-ratio: 16 / 9 !important; // Wide rectangular format
  overflow: visible !important; // Allow dots to be visible below
  padding-bottom: 50px !important; // Add padding to prevent dots from being cut off
}

// Small screens: maintain wide format but ensure it fits
@media (max-width: 600px) {
  .easel-container {
    width: 100vw !important;
    max-width: 100vw !important;
    margin-left: calc(-50vw + 50%) !important;
    margin-right: calc(-50vw + 50%) !important;
    aspect-ratio: 16 / 9 !important;
    overflow: visible !important; // Allow dots to be visible below
    padding-bottom: 0 !important; // No padding needed - dots are absolutely positioned 20px below image
  }
}

// Carousel dots - positioned below the image, always visible
.easel-carousel-dots {
  position: absolute;
  top: calc(100% - 6px) !important; // Position 6px above bottom (reduced from 12px to reduce space)
  left: 50%;
  transform: translateX(-50%);
  display: flex !important;
  justify-content: center;
  align-items: center;
  gap: 12px !important; // Slightly larger gap for better visibility
  z-index: 10 !important;
  width: fit-content; // Fit content width
  padding: 8px 16px; // Add padding for better visibility
  padding-bottom: 10px !important; // Extra bottom padding to ensure dots aren't cut off
  box-sizing: border-box;
  white-space: nowrap; // Keep dots on one line
  pointer-events: auto; // Ensure dots are clickable
  background: rgba(255, 255, 255, 0.9); // Light background to make dots stand out
  border-radius: 20px; // Rounded background
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); // Subtle shadow for visibility
}

.carousel-dot {
  // Larger, more visible dots
  width: 12px !important;
  height: 12px !important;
  min-width: 12px !important;
  min-height: 12px !important;
  border-radius: 50%;
  background: transparent; // No fill for inactive dots
  border: 2px solid rgba(128, 128, 128, 0.7); // More visible border
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 0;
  margin: 0;
  flex-shrink: 0; // Prevent dots from shrinking

  &:hover {
    border-color: rgba(128, 128, 128, 1); // Fully opaque on hover
    transform: scale(1.2);
  }

  &.dot-active {
    background: #2c3e50 !important; // Dark blue-grey from palette (no purple)
    border-color: #2c3e50 !important; // Dark blue-grey from palette
    box-shadow: 0 0 8px rgba(44, 62, 80, 0.8) !important; // Shadow matching dark blue-grey
  }
}

.landing-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 10px 20px 20px 20px; // Reduced top padding from 20px to 10px and bottom from 40px to 20px to consolidate space
  background: white;
}

.how-it-works-section {
  margin-top: 10px; // Push down to avoid being covered by green section above
  margin-bottom: 60px;
}

.custom-products-section,
.designer-products-section,
.specialty-products-section {
  margin-bottom: 60px;
}

.step-card {
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }

  .step-number {
    position: absolute;
    top: 12px;
    left: 12px;
    width: 32px;
    height: 32px;
    background: #2c3e50 !important; // Dark blue-grey from palette (no purple)
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1rem;
    box-shadow: 0 2px 8px rgba(44, 62, 80, 0.3); // Shadow matching dark blue-grey
    z-index: 10;
  }

  .q-card-section {
    padding-top: 24px;
    padding-bottom: 16px;
  }

  .q-icon {
    margin-top: 8px;
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.landing-logo {
  max-width: 250px;
  width: 100%;
  height: auto;
  margin-bottom: 1rem;
}

.landing-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #667eea;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.landing-subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
  font-weight: 300;
}

.upload-section {
  margin-bottom: 1.5rem;
}

.upload-card {
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.2);
  border-radius: 20px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 48px rgba(102, 126, 234, 0.25);
  }
}

.upload-btn {
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
  }
}

.signin-section {
  margin-bottom: 3rem;
}

.signin-card {
  max-width: 400px;
  margin: 0 auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
}

.features-section {
  .feature-card {
    height: 100%;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }
  }
}

.products-section {
  margin-bottom: 3rem;
}

.custom-products-header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.2);
}

.collection-header {
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(102, 126, 234, 0.15);
}

.collection-group {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 8px;
}

.product-card {
  height: 100%;
  min-height: 500px;
  max-width: 400px;
  margin: 0 auto; // Center the card when it's constrained
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
}

.product-card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 400px;
  margin: 0 auto; // Center the content when it's constrained
}

.product-card-actions {
  margin-top: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.product-card-row {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }
}

.product-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin-bottom: 16px;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 6px;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.product-image-wrapper-small {
  display: flex;
  justify-content: center;
  align-items: center;
}

.product-image-small {
  max-width: 120px;
  max-height: 120px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

.product-image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0 auto 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.product-image-placeholder-small {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 120px;
  height: 120px;
  background: #f5f5f5;
  border-radius: 8px;
}

.product-description {
  flex: 1;
  padding-top: 8px;
  padding-bottom: 8px;
  min-height: 40px;
}

.product-pricing {
  background: #f9f9f9;
}

.product-pricing-inline {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

// Mobile responsive adjustments
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 0; // Removed 40px spacing
    text-align: center;
    padding: 0 15px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0; // Removed gap (was 0.75rem)
    width: 100%;
    max-width: 100%;
  }

  .hero-logo {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-title {
    font-size: clamp(1.4rem, 3.5vw, 1.75rem); // Reduced max size from 2.2rem to 1.75rem (a few points smaller)
    font-family: 'Josefin Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important; // Josefin Sans for headings
    font-weight: 600 !important; // Semi-bold for headings
    font-style: normal !important; // Normal style
    transform: none !important; // No skew transform
    white-space: normal;
    text-align: center;
    width: 100%;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .easel-container {
    max-width: 320px; // 20% smaller (400px * 0.8 = 320px)
    max-height: 620px !important; // Set to 620px as requested
    height: 100%;
    aspect-ratio: 16 / 9 !important; // Maintain wide format
  }

  .easel-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

@media (max-width: 599px) {
  .hero-section {
    padding: 10px 15px 100px 15px !important; // Reduced top padding to minimize whitespace
    overflow-x: hidden;
    &.test-environment {
      padding-top: 15px !important; // Slightly more in test, but still reduced
    }
  }

  .hero-content {
    padding: 0 10px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    margin: 0 auto;
  }

  .hero-text {
    width: 100%;
    max-width: 100%;
    padding: 0 10px; // Removed vertical padding (was 0.75rem)
  }

  .hero-actions {
    margin-bottom: 10px;
    width: 100%;
  }

  .hero-title {
    font-size: clamp(1.2rem, 5vw, 1.65rem); // Reduced max size from 1.8rem to 1.65rem (a few points smaller)
    font-family: 'Josefin Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important; // Josefin Sans for headings
    font-weight: 600 !important; // Semi-bold for headings
    font-style: normal !important; // Normal style
    transform: none !important; // No skew transform
    white-space: normal;
    text-align: center;
    width: 100%;
    max-width: 100%;
    padding: 0 10px;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .hero-logo-wide {
    display: none;
  }

  .hero-logo-small {
    display: block;
  }

  .hero-logo {
    max-width: 70vw !important; // 70% of viewport width on small screens
    width: 70vw !important;
    margin-bottom: 1rem;
    margin-left: auto;
    margin-right: auto;
  }

  .landing-container {
    padding: 10px;
  }

  .logo-section {
    margin-bottom: 1rem;
  }

  .landing-title {
    font-size: 1.8rem;
  }

  .landing-subtitle {
    font-size: 0.9rem;
  }

  .landing-logo {
    max-width: 200px;
    margin-bottom: 0.5rem;
  }

  .upload-section {
    margin-bottom: 1rem;
  }

  .upload-card {
    max-width: 100%;
    margin: 0;
  }

  .easel-container {
    width: 100vw !important; // Full viewport width, edge to edge
    max-width: 100vw !important;
    max-height: 620px !important; // Keep 620px max height even on small screens
    aspect-ratio: 16 / 9 !important; // Wide rectangular format
    margin-left: calc(-50vw + 50%) !important; // Break out of container to be edge-to-edge
    margin-right: calc(-50vw + 50%) !important;
  }

  .easel-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
  }

  // Ensure dots are visible 20px below the image on small screens
  .easel-carousel-dots {
    position: absolute !important;
    top: calc(100% + 20px) !important; // Position exactly 20px below the image wrapper
    left: 50% !important;
    transform: translateX(-50%) !important;
    display: flex !important;
    justify-content: center !important;
    gap: 12px !important;
    z-index: 10 !important;
    width: fit-content !important;
    padding: 12px 16px !important; // Add padding for better visibility
    background: rgba(255, 255, 255, 0.95) !important; // More opaque background for visibility
    border-radius: 20px !important; // Rounded background
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important; // Stronger shadow for visibility
  }
}

// Product Links Section
.product-links-section {
  margin-top: 3rem;
}

.product-link-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.product-link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

// Reviews Section
.reviews-section {
  margin-top: 3rem;
}

.review-card {
  background: $light-purple; // Light purple from design system
  height: 100%;
  border-radius: 12px;
  display: flex;
  flex-direction: column;

  .q-card-section {
    display: flex;
    flex-direction: column;
    height: 100%;
    flex-grow: 1;
    min-height: 0; // Important for flex children

    // Make review text grow to fill space, pushing badge to bottom
    // Target any div with text-body2 class that contains review text
    div.text-body2 {
      flex-grow: 1;
      flex-shrink: 1;
      margin-bottom: 0 !important; // Remove margin so badge sits at bottom
      min-height: 0; // Allow flex item to shrink if needed
    }

    // Keep header section (avatar/name/rating) from shrinking
    > div.row {
      flex-shrink: 0; // Don't shrink the header section
    }

    // Push verified badge to bottom
    .q-chip {
      margin-top: auto;
      flex-shrink: 0; // Prevent badge from shrinking
      margin-bottom: 0; // Ensure no bottom margin
    }
  }
}

.leave-review-card {
  background: #ffffff;
  height: 100%;
  border-radius: 12px;
  border: 2px solid $light-purple; // Light purple border from design system
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(243, 229, 245, 0.4);
    border-color: #e1bee7;
  }
}

// Lighter grey stars for leave-review card (using design system token)
.leave-review-stars {
  .q-rating__icon {
    color: $light-grey !important; // Light grey from design system
  }
  
  .q-rating__icon--inactive {
    color: $light-grey !important; // Light grey for inactive stars
  }
  
  .q-rating__icon--active {
    color: $light-grey !important; // Light grey for active stars (all inactive)
  }
}

// Start Creating Magnets Now button - floating over easel gallery
.start-creating-button-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: auto;
}

.start-creating-button {
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  
  // Purple border with pulsing animation
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -4px;
    right: -4px;
    bottom: -4px;
    border: 3px solid $light-purple;
    border-radius: inherit;
    animation: pulse-border 2s ease-in-out infinite;
    pointer-events: none;
  }
  
  // Outer glow effect
  &::after {
    content: '';
    position: absolute;
    top: -8px;
    left: -8px;
    right: -8px;
    bottom: -8px;
    border: 2px solid $light-purple;
    border-radius: inherit;
    opacity: 0.5;
    animation: pulse-glow 2s ease-in-out infinite;
    pointer-events: none;
  }
}

@keyframes pulse-border {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 0.2;
    transform: scale(1.1);
  }
}

</style>
