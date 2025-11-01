<template>
  <q-page class="landing-page">
    <!-- Market Event Banner -->
    <div v-if="hasActiveEvent" class="market-event-banner bg-green-5">
      <div class="market-event-content">
        <q-icon name="event" size="24px" class="q-mr-sm" />
        <div class="text-body1 text-white">
          <strong>Market Event Live!</strong> We're at
          {{ activeMarketEventName }}. Order for pickup or pay locally at our
          tent!
        </div>
      </div>
    </div>

    <!-- Hero Section with Big Magnet Images -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <img
            src="/biglogo.png"
            alt="Lil Magnet Memories"
            class="hero-logo hero-logo-wide"
          />
          <img
            src="/assets/lil-magnet-memories-logo.png"
            alt="Lil Magnet Memories"
            class="hero-logo hero-logo-small"
          />
          <h1 class="hero-title">Turn Your Memories Into Beautiful Magnets</h1>
          <p class="hero-subtitle">
            Create custom photo magnets from your favorite moments.
            High-quality, personalized magnets for your fridge, office, or
            anywhere you want to display your memories.
          </p>

          <div class="hero-actions">
            <q-btn
              @click="$router.push('/upload')"
              color="primary"
              size="xl"
              class="cta-button"
              rounded
            >
              <q-icon name="camera_alt" size="24px" class="q-mr-sm" />
              Start Creating Magnets
            </q-btn>

            <div class="text-caption text-grey-6 q-mt-md">
              No sign-in required • Upload photos and specify quantities
            </div>
          </div>
        </div>

        <div class="hero-images">
          <div class="easel-container">
            <img
              :src="currentEaselImage"
              alt="Custom photo magnets on easel display"
              class="easel-image"
              :key="easelImageIndex"
            />
            <!-- Image carousel dots -->
            <div class="easel-carousel-dots">
              <q-btn
                v-for="(image, index) in easelImages"
                :key="index"
                :class="[
                  'carousel-dot',
                  { 'dot-active': index === easelImageIndex },
                ]"
                round
                dense
                size="sm"
                @click="goToImage(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="landing-container">
      <!-- Custom Products Section -->
      <div class="custom-products-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">
          Custom Photo Magnets
        </div>
        <div class="text-body1 text-center text-grey-7 q-mb-xl">
          Create personalized magnets from your own photos
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

        <!-- Custom Products List -->
        <div v-if="customProducts.length > 0" class="q-mb-xl">
          <div class="custom-products-header text-center q-mb-lg">
            <div class="text-h5 text-weight-bold text-primary q-mb-xs">
              Our Custom Products
            </div>
            <div class="text-subtitle1 text-grey-6">
              Choose your style and create personalized magnets
            </div>
          </div>
          <div class="q-col-gutter-md">
            <div
              v-for="product in customProducts"
              :key="product.id"
              class="q-mb-md"
            >
              <q-card class="product-card-row">
                <q-card-section class="row items-center q-gutter-md">
                  <!-- Product Image (Left Side) -->
                  <div class="col-auto">
                    <div
                      v-if="product.imageUrl"
                      class="product-image-wrapper-small"
                    >
                      <img
                        :src="product.imageUrl"
                        :alt="product.description"
                        class="product-image-small"
                      />
                    </div>
                    <div v-else class="product-image-placeholder-small">
                      <q-icon name="image" size="48px" color="grey-4" />
                    </div>
                  </div>

                  <!-- Product Info (Right Side) -->
                  <div class="col">
                    <div class="text-h6 q-mb-sm">
                      {{ product.description }}
                    </div>

                    <div
                      v-if="product.detailedDescription"
                      class="text-body2 text-grey-7 q-mb-sm"
                    >
                      {{ product.detailedDescription }}
                    </div>

                    <div class="product-pricing-inline q-mb-md">
                      <div class="text-caption text-grey-8 q-mb-xs">
                        Pricing:
                      </div>
                      <div
                        v-for="(price, qty) in product.pricing"
                        :key="qty"
                        class="text-body2 q-mb-xs"
                      >
                        <strong>{{ qty }}x</strong> for
                        <strong class="text-primary"
                          >${{ price.toFixed(2) }}</strong
                        >
                      </div>
                    </div>

                    <q-btn
                      color="primary"
                      label="Start Creating Magnets"
                      icon="camera_alt"
                      @click="goToUpload"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Pre-Designed Products Section -->
      <div class="predesigned-products-section">
        <div class="text-h4 text-center q-mb-lg text-primary">
          Designer Magnets
        </div>
        <div class="text-body1 text-center text-grey-7 q-mb-lg">
          Shop our collection of beautifully designed ready-made magnets
        </div>

        <div class="text-center q-mb-xl">
          <q-btn
            color="secondary"
            size="lg"
            label="Shop Pre-Designed Magnets"
            icon="shopping_bag"
            @click="goToPreDesigned"
            class="q-px-xl"
          />
        </div>

        <!-- Note: Pre-designed products will be shown here when implemented -->
        <div v-if="preDesignedProducts.length > 0" class="q-mb-xl">
          <div class="row q-col-gutter-md">
            <div
              v-for="product in preDesignedProducts"
              :key="product.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <q-card class="product-card">
                <q-card-section class="text-center">
                  <div v-if="product.imageUrl" class="product-image-wrapper">
                    <img
                      :src="product.imageUrl"
                      :alt="product.description"
                      class="product-image"
                    />
                  </div>
                  <div v-else class="product-image-placeholder">
                    <q-icon name="image" size="64px" color="grey-4" />
                  </div>
                  <div class="text-h6 q-mt-md q-mb-sm">
                    {{ product.description }}
                  </div>
                </q-card-section>

                <q-card-section
                  v-if="product.detailedDescription"
                  class="product-description"
                >
                  <div class="text-body2 text-grey-7">
                    {{ product.detailedDescription }}
                  </div>
                </q-card-section>

                <q-card-section class="product-pricing">
                  <div class="text-caption text-grey-8 q-mb-sm">Pricing:</div>
                  <div
                    v-for="(price, qty) in product.pricing"
                    :key="qty"
                    class="text-body2 q-mb-xs"
                  >
                    <strong>{{ qty }}x</strong> for
                    <strong class="text-primary"
                      >${{ price.toFixed(2) }}</strong
                    >
                  </div>
                </q-card-section>

                <q-card-actions class="q-pa-md">
                  <q-btn
                    color="secondary"
                    label="Add to Cart"
                    icon="add_shopping_cart"
                    class="full-width"
                    @click="addProductToCart(product)"
                  />
                </q-card-actions>
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
            Are you at the market event and want to pick up your order there?
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Order Online"
            color="grey-8"
            @click="goToOnlineOrder"
          />
          <q-btn
            flat
            label="At Event - Pickup"
            color="primary"
            @click="goToMarketEventUpload"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { firebaseService } from '../services/firebaseService.js';
import { useCart } from '../composables/useCart.js';
import { marketEventService } from '../services/marketEventService.js';
import { useQuasar } from 'quasar';
import { useCustomerType } from '../composables/useCustomerType.js';

export default {
  name: 'LandingPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const signingIn = ref(false);
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);
    const products = ref([]);
    const { addToCart } = useCart();
    const { shouldShowMarketEventPrompt, setCustomerType } = useCustomerType();

    // Easel image rotation
    const easelImages = [
      '/magnetboard.png',
      '/easel-gallery/image1.jpg',
      '/easel-gallery/image2.jpg',
      '/easel-gallery/image3.jpg',
    ];
    const easelImageIndex = ref(0);
    const currentEaselImage = computed(
      () => easelImages[easelImageIndex.value]
    );

    // Navigation function for carousel dots
    const goToImage = (index) => {
      easelImageIndex.value = index;
    };

    const handleGoogleSignIn = async () => {
      signingIn.value = true;

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (signingIn.value) {
          console.log('Sign-in timeout, resetting state');
          signingIn.value = false;
          $q.notify({
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

        $q.notify({
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

        $q.notify({
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

    const showMarketEventDialog = ref(false);
    const activeMarketEvent = ref(null);

    const goToUpload = () => {
      // Check if there's an active market event
      activeMarketEvent.value = marketEventService.getCheckedInEvent();

      if (activeMarketEvent.value) {
        // Show popup asking if they're at the event
        showMarketEventDialog.value = true;
      } else {
        // No active event, go to online order page
        router.push('/online-order');
      }
    };

    const goToMarketEventUpload = () => {
      showMarketEventDialog.value = false;
      setCustomerType('market_customer');
      router.push('/market-event-upload');
    };

    const goToOnlineOrder = () => {
      showMarketEventDialog.value = false;
      setCustomerType('online_customer');
      router.push('/online-order');
    };

    const addProductToCart = (product) => {
      addToCart(product, 1);
      $q.notify({
        type: 'positive',
        message: 'Added to cart!',
        caption: product.description,
        position: 'top',
        icon: 'add_shopping_cart',
        timeout: 2000,
      });
    };

    const loadProducts = async () => {
      try {
        const productsData = await firebaseService.getProducts();
        products.value = productsData || [];
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    // Separate products into custom and pre-designed
    // For now, all products are custom. Pre-designed products will have a productType field
    const customProducts = computed(() => {
      return products.value.filter(
        (p) => !p.productType || p.productType === 'custom'
      );
    });

    const preDesignedProducts = computed(() => {
      return products.value.filter((p) => p.productType === 'predesigned');
    });

    // Check if there's an active market event
    const hasActiveEvent = computed(() => {
      return marketEventService.getCheckedInEvent() !== null;
    });

    // Get the active market event name for display
    const activeMarketEventName = computed(() => {
      const event = marketEventService.getCheckedInEvent();
      return event ? event.name : '';
    });

    // Navigation function for pre-designed products
    const goToPreDesigned = () => {
      // TODO: Navigate to pre-designed products page when implemented
      $q.notify({
        type: 'info',
        message: 'Coming soon!',
        caption: 'Pre-designed magnets section coming soon',
        position: 'top',
      });
    };

    // Check if user is already authenticated
    onMounted(() => {
      loadProducts();

      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log(
          'User already authenticated on landing page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
        isAdmin.value = authService.isAdmin();

        // Set customer type based on admin status
        if (isAdmin.value) {
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

          // Set customer type based on admin status
          if (isAdmin.value) {
            setCustomerType('admin');
          }
        }
      });

      // Check if we should show market event prompt on initial load
      const activeEvent = marketEventService.getCheckedInEvent();
      if (activeEvent && shouldShowMarketEventPrompt.value) {
        activeMarketEvent.value = activeEvent;
        showMarketEventDialog.value = true;
      }

      // Rotate easel images every 5 seconds
      setInterval(() => {
        easelImageIndex.value =
          (easelImageIndex.value + 1) % easelImages.length;
      }, 5000);
    });

    return {
      signingIn,
      isAuthenticated,
      isAdmin,
      products,
      customProducts,
      preDesignedProducts,
      hasActiveEvent,
      activeMarketEventName,
      easelImages,
      currentEaselImage,
      easelImageIndex,
      showMarketEventDialog,
      activeMarketEvent,
      handleGoogleSignIn,
      goToOrdersList,
      goToMyOrders,
      goToUpload,
      addProductToCart,
      goToPreDesigned,
      goToMarketEventUpload,
      goToOnlineOrder,
      goToImage,
    };
  },
};
</script>

<style lang="scss" scoped>
.landing-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  z-index: 2;
}

.hero-text {
  color: white;
}

.hero-logo {
  max-width: 300px;
  width: 100%;
  height: auto;
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.hero-logo-wide {
  max-width: 500px;
  width: 100%;
  display: block;
}

.hero-logo-small {
  display: none;
}

// Market event banner
.market-event-banner {
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.market-event-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 1.5rem 0;
  line-height: 1.1;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.3rem;
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
  opacity: 0.95;
  font-weight: 300;
}

.hero-actions {
  .cta-button {
    font-size: 1.3rem;
    font-weight: 600;
    padding: 16px 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }
  }
}

.hero-images {
  display: flex;
  justify-content: center;
  align-items: center;
}

.easel-container {
  max-width: 500px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.easel-image {
  width: 100%;
  height: auto;
  max-height: 600px;
  object-fit: contain;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  transition: opacity 0.8s ease, transform 0.4s ease;

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
}

.easel-container {
  position: relative;

  img {
    display: block;
  }
}

// Carousel dots
.easel-carousel-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.2);
  }

  &.dot-active {
    background: white;
    border-color: white;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  }
}

.landing-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 20px;
  background: white;
}

.custom-products-section,
.predesigned-products-section {
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 1rem;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
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

.product-card {
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
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
  margin-bottom: 16px;
}

.product-image {
  max-width: 180px;
  max-height: 180px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
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
  width: 180px;
  height: 180px;
  margin: 0 auto 16px;
  background: #f5f5f5;
  border-radius: 8px;
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
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  padding-top: 16px;
  padding-bottom: 16px;
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
    gap: 40px;
    text-align: center;
  }

  .hero-logo {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .easel-container {
    max-width: 350px;
  }

  .easel-image {
    max-height: 400px;
  }
}

@media (max-width: 599px) {
  .hero-section {
    padding: 20px 15px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-logo-wide {
    display: none;
  }

  .hero-logo-small {
    display: block;
  }

  .hero-logo {
    max-width: 250px;
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
    max-width: 300px;
  }

  .easel-image {
    max-height: 300px;
  }
}
</style>
