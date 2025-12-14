<template>
  <q-page class="landing-page">
    <!-- Market Event Banner -->
    <div v-if="hasActiveEvent" class="market-event-banner bg-green-5">
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
          <h1 class="hero-title">Turn Your Memories Into Beautiful Magnets!</h1>

          <div class="hero-actions">
            <q-btn
              @click="goToUpload"
              color="primary"
              size="xl"
              class="cta-button"
              rounded
            >
              <q-icon name="camera_alt" size="24px" class="q-mr-sm" />
              Start Creating Magnets
            </q-btn>

            <div class="text-caption text-white q-mt-md">
              No sign-in required • Upload photos and specify quantities
            </div>
          </div>
        </div>

        <div class="hero-images">
          <div
            class="easel-container"
            @click="nextImage"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <img
              :src="currentEaselImage"
              alt="Custom photo magnets on easel display"
              class="easel-image"
              :key="easelImageIndex"
            />
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

      <!-- Custom Products Section -->
      <div class="custom-products-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">
          Custom Photo Magnets
        </div>
        <div class="text-body1 text-center text-grey-7 q-mb-xl">
          Create personalized magnets from your own photos
        </div>

        <!-- Custom Products List -->
        <div v-if="customProducts.length > 0" class="q-mb-xl">
          <!-- Multiple collections: show in collapsible groups -->
          <template v-if="Object.keys(customProductsByCollection).length > 1">
            <q-expansion-item
              v-for="(
                productsInCollection, collectionName
              ) in customProductsByCollection"
              :key="collectionName"
              :label="collectionName"
              :caption="`${productsInCollection.length} product${
                productsInCollection.length !== 1 ? 's' : ''
              }`"
              default-opened
              class="collection-group q-mb-md"
            >
              <div class="q-col-gutter-md q-pt-md">
                <div
                  v-for="product in productsInCollection"
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
                          @click="() => goToUpload(product)"
                        />
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-expansion-item>
          </template>
          <!-- Single collection: show products directly -->
          <div v-else class="q-col-gutter-md">
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
                      @click="() => goToUpload(product)"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </div>

      <!-- Designer Magnets Section -->
      <div class="designer-products-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">
          Designer Magnets
        </div>
        <div class="text-body1 text-center text-grey-7 q-mb-lg">
          Shop our collection of beautifully designed ready-made magnets
        </div>

        <div v-if="designerProducts.length > 0" class="q-mb-xl">
          <!-- Multiple collections: show in collapsible groups -->
          <template v-if="Object.keys(designerProductsByCollection).length > 1">
            <q-expansion-item
              v-for="(
                productsInCollection, collectionName
              ) in designerProductsByCollection"
              :key="collectionName"
              :label="collectionName"
              :caption="`${productsInCollection.length} product${
                productsInCollection.length !== 1 ? 's' : ''
              }`"
              default-opened
              class="collection-group q-mb-md"
            >
              <div class="row q-col-gutter-md q-pt-md">
                <div
                  v-for="product in productsInCollection"
                  :key="product.id"
                  class="col-12 col-md-6 col-lg-4"
                >
                  <q-card class="product-card">
                    <q-card-section class="product-card-content text-center">
                      <div
                        v-if="product.imageUrl"
                        class="product-image-wrapper"
                      >
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

                      <div
                        v-if="product.detailedDescription"
                        class="product-description"
                      >
                        <div class="text-body2 text-grey-7">
                          {{ product.detailedDescription }}
                        </div>
                      </div>

                      <div class="product-pricing">
                        <div class="text-caption text-grey-8 q-mb-sm">
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
                    </q-card-section>

                    <q-card-actions class="product-card-actions q-pa-md">
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
            </q-expansion-item>
          </template>
          <!-- Single collection: show products directly -->
          <div v-else class="row q-col-gutter-md">
            <div
              v-for="product in designerProducts"
              :key="product.id"
              class="col-12 col-md-6 col-lg-4"
            >
              <q-card class="product-card">
                <q-card-section class="product-card-content text-center">
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

                  <div
                    v-if="product.detailedDescription"
                    class="product-description"
                  >
                    <div class="text-body2 text-grey-7">
                      {{ product.detailedDescription }}
                    </div>
                  </div>

                  <div class="product-pricing">
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
                  </div>
                </q-card-section>

                <q-card-actions class="product-card-actions q-pa-md">
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
        <div v-else class="text-center text-grey-6 q-mb-xl">
          No designer magnets available at this time.
        </div>
      </div>

      <!-- Specialty Products Section -->
      <div class="specialty-products-section q-mb-xl">
        <div class="text-h4 text-center q-mb-lg text-primary">
          Specialty Products
        </div>
        <div class="text-body1 text-center text-grey-7 q-mb-lg">
          Discover our unique specialty magnet products
        </div>

        <div v-if="specialtyProducts.length > 0" class="q-mb-xl">
          <!-- Multiple collections: show in collapsible groups -->
          <template
            v-if="Object.keys(specialtyProductsByCollection).length > 1"
          >
            <q-expansion-item
              v-for="(
                productsInCollection, collectionName
              ) in specialtyProductsByCollection"
              :key="collectionName"
              :label="collectionName"
              :caption="`${productsInCollection.length} product${
                productsInCollection.length !== 1 ? 's' : ''
              }`"
              default-opened
              class="collection-group q-mb-md"
            >
              <div class="row q-col-gutter-md q-pt-md">
                <div
                  v-for="product in productsInCollection"
                  :key="product.id"
                  class="col-12 col-md-6 col-lg-4"
                >
                  <q-card class="product-card">
                    <q-card-section class="text-center">
                      <div
                        v-if="product.imageUrl"
                        class="product-image-wrapper"
                      >
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
                      <div class="text-caption text-grey-8 q-mb-sm">
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
                    </q-card-section>

                    <q-card-actions class="q-pa-md">
                      <q-btn
                        color="primary"
                        label="Add to Cart"
                        icon="add_shopping_cart"
                        class="full-width"
                        @click="addProductToCart(product)"
                      />
                    </q-card-actions>
                  </q-card>
                </div>
              </div>
            </q-expansion-item>
          </template>
          <!-- Single collection: show products directly -->
          <div v-else class="row q-col-gutter-md">
            <div
              v-for="product in specialtyProducts"
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
                    color="primary"
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
        <div v-else class="text-center text-grey-6 q-mb-xl">
          No specialty products available at this time.
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { firebaseService } from '../services/firebaseService.js';
import { useCart } from '../composables/useCart.js';
import { marketEventService } from '../services/marketEventService.js';
import { userPreferencesService } from '../services/userPreferencesService.js';
import { useQuasar } from 'quasar';
import { useCustomerType } from '../composables/useCustomerType.js';

export default {
  name: 'LandingPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const quasar = $q; // Capture in local variable for safe access
    const signingIn = ref(false);
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);
    const products = ref([]);
    const { addToCart } = useCart();
    const { shouldShowMarketEventPrompt, setCustomerType, isMarketCustomer } =
      useCustomerType();

    // Customer at event toggle - sync with customer type
    const isCustomerAtEvent = computed({
      get: () => isMarketCustomer.value,
      set: () => {
        // This is handled by toggleCustomerAtEvent, but we need setter for v-model
      },
    });

    // Easel image rotation
    const easelImages = [
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
    const currentEaselImage = computed(
      () => easelImages[easelImageIndex.value]
    );

    // Navigation functions for easel gallery
    const goToImage = (index) => {
      easelImageIndex.value = index;
    };

    const nextImage = () => {
      if (easelImages.length > 1) {
        easelImageIndex.value =
          (easelImageIndex.value + 1) % easelImages.length;
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

    const addProductToCart = (product) => {
      addToCart(product, 1);
      safeNotify({
        type: 'positive',
        message: 'Added to cart!',
        caption: product.description,
        position: 'top',
        icon: 'add_shopping_cart',
        timeout: 2000,
      });
    };

    const loadProducts = async (retryCount = 0) => {
      const maxRetries = 3;
      try {
        // Non-admins should not see testing products
        const isAdmin = authService.isAdmin();
        const productsData = await firebaseService.getProducts(isAdmin);

        if (productsData && productsData.length > 0) {
          products.value = productsData;
          console.log(`✅ Loaded ${productsData.length} products`);
        } else {
          // If no products returned, retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(
              `⚠️ No products returned, retrying (${
                retryCount + 1
              }/${maxRetries})...`
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            );
            return loadProducts(retryCount + 1);
          } else {
            console.warn('⚠️ No products found after retries');
            products.value = [];
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
        // Retry on error if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(
            `⚠️ Error loading products, retrying (${
              retryCount + 1
            }/${maxRetries})...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return loadProducts(retryCount + 1);
        } else {
          console.error('❌ Failed to load products after retries');
          products.value = [];
        }
      }
    };

    // Separate products by category
    const customProducts = computed(() => {
      return products.value.filter((p) => p.category === 'custom');
    });

    const designerProducts = computed(() => {
      return products.value.filter((p) => p.category === 'designer');
    });

    const specialtyProducts = computed(() => {
      return products.value.filter((p) => p.category === 'specialty');
    });

    // Group products by collection for each category
    const customProductsByCollection = computed(() => {
      return groupProductsByCollection(customProducts.value);
    });

    const designerProductsByCollection = computed(() => {
      return groupProductsByCollection(designerProducts.value);
    });

    const specialtyProductsByCollection = computed(() => {
      return groupProductsByCollection(specialtyProducts.value);
    });

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

      // Load products with retry logic
      loadProducts().catch((err) => {
        console.error('Failed to load products:', err);
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

      // Rotate easel images every 5 seconds (only if more than 1 image)
      if (easelImages.length > 1) {
        setInterval(() => {
          easelImageIndex.value =
            (easelImageIndex.value + 1) % easelImages.length;
        }, 5000);
      }
    });

    return {
      signingIn,
      isAuthenticated,
      isAdmin,
      products,
      customProducts,
      designerProducts,
      specialtyProducts,
      customProductsByCollection,
      designerProductsByCollection,
      specialtyProductsByCollection,
      hasActiveEvent,
      activeMarketEventName,
      activeMarketEventLink,
      isCustomerAtEvent,
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
      confirmAtMarketEvent,
      goToOnlineOrder,
      goToImage,
      nextImage,
      previousImage,
      toggleCustomerAtEvent,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
    };
  },
};
</script>

<style lang="scss" scoped>
.landing-page {
  background: linear-gradient(135deg, #e8e5f1 0%, #f0eef8 100%);
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.03) 10px,
      rgba(255, 255, 255, 0.03) 20px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.02) 10px,
      rgba(0, 0, 0, 0.02) 20px
    ),
    linear-gradient(135deg, #e8e5f1 0%, #f0eef8 100%);
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px 100px 20px;
  background: linear-gradient(135deg, #e8e5f1 0%, #f0eef8 100%);
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.03) 10px,
      rgba(255, 255, 255, 0.03) 20px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      rgba(0, 0, 0, 0.02) 10px,
      rgba(0, 0, 0, 0.02) 20px
    ),
    linear-gradient(135deg, #e8e5f1 0%, #f0eef8 100%);
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

.hero-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  z-index: 2;
  box-sizing: border-box;
  padding: 0 20px;
}

.hero-text {
  color: white;
  text-align: center;
  width: 100%;
  max-width: 100%;
  overflow: visible; // Allow shadows from button to extend
  margin-bottom: 0;
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

  @media (max-width: 600px) {
    padding: 8px 12px;
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
  font-size: clamp(1.5rem, 4vw, 2.8rem);
  font-weight: 800;
  margin: 0 0 1.5rem 0;
  line-height: 1.2;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  white-space: normal;
  text-align: center;
  width: 100%;
  max-width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}


  .hero-actions {
    margin-bottom: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: visible; // Allow shadows to extend beyond container

    .cta-button {
      font-size: 1.3rem;
      font-weight: 600;
      padding: 16px 32px;
      // Use filter drop-shadow for natural, unclipped shadows
      filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.25))
              drop-shadow(0 8px 40px rgba(0, 0, 0, 0.15))
              drop-shadow(0 2px 8px rgba(255, 255, 255, 0.1));
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
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
}

.hero-images {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  overflow: visible; // Allow shadows from easel images to extend
}

.easel-container {
  max-width: 500px;
  width: 100%;
  height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  cursor: pointer;
  user-select: none;
  overflow: visible; // Allow shadows to extend beyond container

  img {
    display: block;
    pointer-events: none; // Prevent image from blocking container clicks
  }
}

.easel-image {
  width: calc(100% - 6px); // Account for border width
  max-height: calc(600px - 6px); // Account for border width
  height: auto;
  object-fit: contain;
  border-radius: 17px; // Slightly smaller to account for border
  // Add silver border around images with padding to keep image inside
  border: 3px solid rgba(192, 192, 192, 0.8);
  padding: 2px; // Small padding to ensure image corners stay inside border
  box-sizing: border-box;
  // Use filter drop-shadow for natural, unclipped shadows that fade smoothly
  filter: drop-shadow(0 4px 30px rgba(0, 0, 0, 0.12))
          drop-shadow(0 8px 50px rgba(0, 0, 0, 0.08))
          drop-shadow(0 2px 15px rgba(0, 0, 0, 0.1));
  transition: opacity 0.5s ease;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden; // Clip image to border radius
  // No background color - let the image show through naturally
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
  width: 12px;
  height: 12px;
  min-width: 12px;
  min-height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  cursor: pointer;
  padding: 0;
  margin: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    transform: scale(1.1);
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

.how-it-works-section,
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
    gap: 20px;
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
    width: 100%;
    max-width: 100%;
  }

  .hero-logo {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-title {
    font-size: clamp(1.4rem, 3.5vw, 2.2rem);
    white-space: normal;
    text-align: center;
    width: 100%;
    max-width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .easel-container {
    max-width: 350px;
    height: 400px;
  }

  .easel-image {
    max-height: 400px;
  }
}

@media (max-width: 599px) {
  .hero-section {
    padding: 20px 15px 100px 15px;
    overflow-x: hidden;
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
    padding: 0;
  }

  .hero-actions {
    margin-bottom: 10px;
    width: 100%;
  }

  .hero-title {
    font-size: clamp(1.2rem, 5vw, 1.8rem);
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
