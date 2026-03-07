<template>
  <q-page class="custom-products-page">
    <div class="page-container q-pa-lg">
      <div class="page-header text-h4 text-center text-primary">
        Custom Photo Magnets
      </div>
      <div class="page-subtitle text-body1 text-center text-grey-7">
        Create personalized magnets from your own photos
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading products...</div>
      </div>

      <!-- Products List -->
      <div v-else-if="customProducts.length > 0" class="products-list q-mb-xl">
        <!-- Multiple collections: show in collapsible groups -->
        <template v-if="Object.keys(customProductsByCollection).length > 1">
          <q-expansion-item
            v-for="(productsInCollection, collectionName) in customProductsByCollection"
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
                <q-card class="product-card-row" @click="goToProductDetail(product)">
                  <q-card-section class="product-card-section row items-center q-gutter-md">
                    <!-- Product Image -->
                    <div class="col-auto product-image-col">
                      <SimpleSlideshow
                        :image-url="product.imageUrl"
                        :image-urls="product.images && product.images.length > 0 ? product.images : (product.imageUrls || [])"
                        :alt="product.description"
                        class="product-image-slideshow-small"
                      />
                    </div>

                    <!-- Product Info (below image on small screens) -->
                    <div class="col product-info-col">
                      <div class="product-title text-h6">
                        {{ product.description }}
                      </div>
                      <div
                        v-if="product.detailedDescription"
                        class="text-body2 text-grey-7 product-desc"
                      >
                        {{ product.detailedDescription }}
                      </div>
                      <div
                        class="product-pricing-inline"
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
                      <div class="product-actions row no-wrap q-gutter-sm">
                        <q-btn
                          color="primary"
                          label="View Details"
                          icon="arrow_forward"
                          @click.stop="goToProductDetail(product)"
                        />
                        <q-btn
                          outline
                          color="primary"
                          label="Purchase"
                          icon="add_shopping_cart"
                          @click.stop="goToPurchase(product)"
                        />
                      </div>
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
            <q-card class="product-card-row" @click="goToProductDetail(product)">
              <q-card-section class="product-card-section row items-center q-gutter-md">
                <!-- Product Image -->
                <div class="col-auto product-image-col">
                  <SimpleSlideshow
                    :image-url="product.imageUrl"
                    :image-urls="product.images && product.images.length > 0 ? product.images : (product.imageUrls || [])"
                    :alt="product.description"
                    class="product-image-slideshow-small"
                  />
                </div>

                <!-- Product Info (below image on small screens) -->
                <div class="col product-info-col">
                  <div class="product-title text-h6">
                    {{ product.description }}
                  </div>
                  <div
                    v-if="product.detailedDescription"
                    class="text-body2 text-grey-7 product-desc"
                  >
                    {{ product.detailedDescription }}
                  </div>
                  <div
                    class="product-pricing-inline"
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
                  <div class="product-actions row no-wrap q-gutter-sm">
                    <q-btn
                      color="primary"
                      label="View Details"
                      icon="arrow_forward"
                      @click.stop="goToProductDetail(product)"
                    />
                    <q-btn
                      outline
                      color="primary"
                      label="Purchase"
                      icon="add_shopping_cart"
                      @click.stop="goToPurchase(product)"
                    />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-grey-6 q-pa-xl">
        No custom products available at this time.
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMeta } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService';
import SimpleSlideshow from '../components/SimpleSlideshow.vue';

export default {
  name: 'CustomProductsPage',
  components: {
    SimpleSlideshow,
  },
  setup() {
    useMeta({
      title: 'Custom Photo Magnets - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Create personalized magnets from your own photos. Choose from various sizes and styles. High-quality prints that capture your precious memories.'
        },
        keywords: {
          name: 'keywords',
          content: 'custom photo magnets, personalized magnets, photo gifts, custom magnet sizes'
        }
      }
    });

    const router = useRouter();
    const products = ref([]);
    const loading = ref(true);

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

    const groupProductsByCollection = (productList) => {
      if (!productList || !Array.isArray(productList)) {
        return {};
      }
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

    const customProducts = computed(() => {
      return products.value.filter((p) => p.category === 'custom');
    });

    const customProductsByCollection = computed(() => {
      return groupProductsByCollection(customProducts.value);
    });

    const goToProductDetail = (product) => {
      router.push(`/product/custom/${product.id}`);
    };

    const goToPurchase = (product) => {
      router.push({ path: '/photo-upload', query: { productId: product.id } });
    };

    onMounted(() => {
      loadProducts();
    });

    return {
      products,
      customProducts,
      customProductsByCollection,
      loading,
      goToProductDetail,
      goToPurchase,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Tighter spacing for header and subtitle */
.page-header {
  margin-bottom: 0.25rem;
}
.page-subtitle {
  margin-bottom: 1rem;
}
@media (max-width: 599px) {
  .page-header {
    margin-bottom: 0.15rem;
  }
  .page-subtitle {
    margin-bottom: 1rem; /* Space so product list doesn't cover "Create personalized magnets..." */
  }
  .products-list {
    margin-top: 1.25rem; /* Move product list down so it doesn't cover the subtitle text */
  }
}

.product-card-row {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-title {
  margin-bottom: 0.25rem;
}
.product-desc {
  margin-bottom: 0.35rem;
}
.product-pricing-inline {
  margin-top: 4px;
  margin-bottom: 0.5rem;
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
@media (max-width: 599px) {
  .product-title {
    margin-bottom: 0.2rem;
  }
  .product-desc {
    margin-bottom: 0.25rem;
  }
  .product-pricing-inline {
    margin-top: 2px;
    margin-bottom: 0.35rem;
  }
}

.product-actions {
  flex-wrap: nowrap;
}

/* Limit product image width; smaller on small screens so everything fits without scroll */
.product-image-slideshow-small {
  max-width: 500px;
  width: 100%;
}
@media (max-width: 599px) {
  /* Card: column layout – image on top, then title/pricing, then View Details & Purchase below */
  .product-card-section {
    flex-direction: column !important;
    align-items: stretch !important;
    padding: 10px !important;
    gap: 8px !important;
  }
  .product-image-col {
    order: 0; /* image first */
    margin-left: auto;
    margin-right: auto;
    display: flex;
    justify-content: center;
  }
  .product-info-col {
    order: 1; /* title, pricing, buttons below the picture */
    align-self: stretch;
  }
  /* Image at 80% of previous size (was 400px) so it’s not tiny */
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
  .product-card-row :deep(.q-card-section) {
    padding: 10px;
  }
}
</style>
