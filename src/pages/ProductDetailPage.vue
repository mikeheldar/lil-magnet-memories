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
        <div class="row q-col-gutter-lg">
          <!-- Product Image -->
          <div class="col-12 col-md-6">
            <SimpleSlideshow
              :image-url="product.imageUrl"
              :image-urls="product.images && product.images.length > 0 ? product.images : (product.imageUrls || [])"
              :alt="product.description"
            />
          </div>

          <!-- Product Info -->
          <div class="col-12 col-md-6">
            <div class="text-h4 text-primary q-mb-md">
              {{ product.description }}
            </div>

            <div
              v-if="product.detailedDescription"
              class="text-body1 text-grey-8 q-mb-lg"
            >
              {{ product.detailedDescription }}
            </div>

            <div class="product-pricing-section q-mb-lg">
              <div class="text-h6 q-mb-md">Pricing</div>
              <div
                v-for="(price, qty) in product.pricing"
                :key="qty"
                class="text-body1 q-mb-sm"
              >
                <strong>{{ qty }}x</strong> for
                <strong class="text-primary">${{ price.toFixed(2) }}</strong>
              </div>
            </div>

            <!-- CTA Button -->
            <div class="q-mt-xl">
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

.product-pricing-section {
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}
</style>
