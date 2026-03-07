<template>
  <q-page class="product-detail-page">
    <div class="page-container q-pa-lg">
      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading product...</div>
      </div>

      <!-- Product Not Found -->
      <div v-else-if="!product" class="text-center q-pa-xl">
        <q-icon name="error_outline" size="64px" color="grey-5" class="q-mb-md" />
        <div class="text-h5 q-mb-sm">Product Not Found</div>
        <div class="text-body1 text-grey-7 q-mb-lg">
          The product you're looking for doesn't exist or has been removed.
        </div>
        <q-btn
          color="primary"
          label="Back to Products"
          @click="$router.push('/')"
        />
      </div>

      <!-- Product Detail -->
      <div v-else class="product-detail-container">
        <div class="row q-col-gutter-lg product-detail-section">
          <!-- Product Image (20% smaller on md+ so it doesn't go to the edge; 320px square on small screens) -->
          <div class="col-12 col-md-6 product-image-col">
            <div class="product-image-wrapper">
              <SimpleSlideshow
                :image-url="product.imageUrl"
                :image-urls="product.images && product.images.length > 0 ? product.images : (product.imageUrls || [])"
                :alt="product.description"
                class="product-image-slideshow-small"
              />
            </div>
          </div>

          <!-- Product Info (below image on small screens) – same setup as multi-product first section -->
          <div class="col-12 col-md-6 product-info-col">
            <div class="product-title text-h6 text-primary q-mb-sm">
              {{ product.description }}
            </div>

            <div
              v-if="product.detailedDescription"
              class="text-body2 text-grey-7 product-desc q-mb-sm"
            >
              {{ product.detailedDescription }}
            </div>

            <div
              class="product-pricing-inline q-mb-sm"
              :class="{ 'pricing-one-tier': product.pricing && Object.keys(product.pricing).length === 1 }"
            >
              <span class="text-caption text-grey-8">Pricing:</span>
              <template v-if="product.pricing && Object.keys(product.pricing).length === 1">
                <span
                  v-for="(price, qty) in product.pricing"
                  :key="qty"
                  class="text-body2"
                >
                  <strong>{{ qty }}x</strong> for
                  <strong class="text-primary">${{ price.toFixed(2) }}</strong>
                </span>
              </template>
              <div v-else class="pricing-value-block">
                <div
                  v-for="(price, qty) in product.pricing"
                  :key="qty"
                  class="text-body2 q-mb-xs"
                >
                  <strong>{{ qty }}x</strong> for
                  <strong class="text-primary">${{ price.toFixed(2) }}</strong>
                </div>
              </div>
            </div>

            <!-- CTA Button (reduced top margin so button is visible above the fold) -->
            <div class="product-detail-actions q-mt-md">
              <q-btn
                v-if="product.category === 'custom'"
                color="primary"
                size="lg"
                label="Start Creating Magnets"
                icon="camera_alt"
                class="full-width"
                @click="goToUpload"
              />
              <q-btn
                v-else
                color="secondary"
                size="lg"
                label="Add to Cart"
                icon="add_shopping_cart"
                class="full-width"
                @click="addToCart"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMeta } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService';
import { useCart } from '../composables/useCart.js';
import { useQuasar } from 'quasar';
import SimpleSlideshow from '../components/SimpleSlideshow.vue';

export default {
  name: 'ProductDetailPage',
  components: {
    SimpleSlideshow,
  },
  setup() {
    useMeta({
      title: 'Product Details - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'View product details for custom photo magnets. See pricing, sizes, and options. Add to cart and start creating your memories.'
        },
        keywords: {
          name: 'keywords',
          content: 'product details, magnet info, pricing, add to cart'
        }
      }
    });

    const route = useRoute();
    const router = useRouter();
    const $q = useQuasar();
    const products = ref([]);
    const loading = ref(true);
    const { addToCart: addToCartComposable } = useCart();

    const productType = computed(() => route.params.productType);
    const productId = computed(() => route.params.productId);

    const product = computed(() => {
      const found = products.value.find((p) => p.id === productId.value);
      if (found && found.category === productType.value) {
        return found;
      }
      return null;
    });

    const loadProducts = async (retryCount = 0) => {
      const maxRetries = 3;
      try {
        const isAdmin = authService.isAdmin();
        const productsData = await firebaseService.getProducts(isAdmin);

        if (productsData && productsData.length > 0) {
          products.value = productsData;
          loading.value = false;
        } else {
          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * (retryCount + 1))
            );
            return loadProducts(retryCount + 1);
          } else {
            products.value = [];
            loading.value = false;
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
        if (retryCount < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return loadProducts(retryCount + 1);
        } else {
          products.value = [];
          loading.value = false;
        }
      }
    };

    const addToCart = () => {
      if (product.value) {
        addToCartComposable(product.value, 1);
        $q.notify({
          type: 'positive',
          message: 'Added to cart!',
          caption: product.value.description,
          position: 'top',
          icon: 'add_shopping_cart',
          timeout: 2000,
        });
      }
    };

    const goToUpload = () => {
      if (product.value) {
        router.push({
          path: '/photo-upload',
          query: { productId: product.value.id },
        });
      }
    };

    onMounted(() => {
      loadProducts();
    });

    return {
      product,
      loading,
      addToCart,
      goToUpload,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.product-detail-container {
  margin-top: 2rem;
}
@media (max-width: 599px) {
  .product-detail-page .page-container {
    padding-left: 12px;
    padding-right: 12px;
    padding-bottom: 1rem;
  }
  .product-detail-container {
    margin-top: 1rem;
  }
}

/* On medium and large screens, limit image to 80% width (20% smaller) so it doesn't touch the edges */
@media (min-width: 768px) {
  .product-image-wrapper {
    max-width: 80%;
    margin-left: auto;
    margin-right: auto;
  }
}

/* Same compact pricing as multi-product page; single tier inline next to "Pricing:" */
.product-pricing-inline {
  margin-top: 2px;
}
.product-pricing-inline.pricing-one-tier {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 0.35rem;
}
.product-pricing-inline .pricing-value-block {
  margin-top: 2px;
}
.product-detail-actions {
  margin-bottom: 1rem;
}

/* Small screens: same as multi-product page – image 320px square on top, title/pricing/buttons below */
@media (max-width: 599px) {
  .product-detail-section {
    flex-direction: column !important;
    align-items: stretch !important;
  }
  .product-image-col {
    order: 0;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
  }
  .product-info-col {
    order: 1;
  }
  .product-image-slideshow-small {
    width: 320px !important;
    max-width: 320px !important;
    height: 320px !important;
  }
  .product-image-slideshow-small :deep(.slideshow-wrapper) {
    width: 320px !important;
    height: 320px !important;
    max-width: 320px !important;
    max-height: 320px !important;
    min-height: 320px !important;
  }
  .product-image-slideshow-small :deep(.slideshow-image) {
    width: 320px !important;
    height: 320px !important;
    max-width: 320px !important;
    max-height: 320px !important;
    min-height: 320px !important;
    object-fit: cover;
  }
}
</style>
