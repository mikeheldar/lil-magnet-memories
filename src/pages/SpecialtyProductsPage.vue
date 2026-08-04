<template>
  <q-page class="specialty-products-page">
    <div class="page-container q-pa-lg">
      <div class="text-h4 text-center q-mb-lg text-primary">
        Specialty Products
      </div>
      <div class="text-body1 text-center text-grey-7 q-mb-xl">
        Discover our unique specialty magnet products
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading products...</div>
      </div>

      <!-- Products List -->
      <div v-else-if="specialtyProducts.length > 0" class="q-mb-xl">
        <!-- Multiple collections: show in collapsible groups -->
        <template v-if="Object.keys(specialtyProductsByCollection).length > 1">
          <q-expansion-item
            v-for="(productsInCollection, collectionName) in specialtyProductsByCollection"
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
                <q-card class="product-card" @click="goToProductDetail(product)">
                  <q-card-section class="product-card-content text-center">
                    <SimpleSlideshow
                      :image-url="product.imageUrl"
                      :image-urls="product.images && product.images.length > 0 ? product.images : (product.imageUrls || [])"
                      :alt="product.description"
                    />
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
                      color="primary"
                      label="View Details"
                      icon="arrow_forward"
                      class="full-width"
                      @click.stop="goToProductDetail(product)"
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
            <q-card class="product-card" @click="goToProductDetail(product)">
              <q-card-section class="product-card-content text-center">
                <SimpleSlideshow
                  :image-url="product.imageUrl"
                  :image-urls="product.images && product.images.length > 0 ? product.images : (product.imageUrls || [])"
                  :alt="product.description"
                />
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
                  color="primary"
                  label="View Details"
                  icon="arrow_forward"
                  class="full-width"
                  @click.stop="goToProductDetail(product)"
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
      <div v-else class="text-center text-grey-6 q-pa-xl">
        No specialty products available at this time.
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSiteSeo } from '../composables/useSiteSeo.js';
import { firebaseService } from '../services/firebaseService.js';
import { trackViewItemList, productToGaItem } from '../utils/analytics.js';
import { authService } from '../services/authService';
import SimpleSlideshow from '../components/SimpleSlideshow.vue';

export default {
  name: 'SpecialtyProductsPage',
  components: {
    SimpleSlideshow,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();

    useSiteSeo(() => ({
      title: 'Specialty Products - Lil Magnet Memories',
      description:
        'Discover specialty magnet products with unique shapes and finishes, perfect for team events, family milestones, holiday gifting, and local celebrations.',
      keywords:
        'specialty magnets, unique custom magnets, team event gifts, family milestone gifts, holiday photo gifts, Dunwoody events, Sandy Springs events',
      path: route.path,
      image: '/assets/lil-magnet-memories-logo.png',
      breadcrumb: [
        { name: 'Home', path: '/' },
        { name: 'Specialty Products', path: route.path },
      ],
    }));
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

    const specialtyProducts = computed(() => {
      return products.value.filter((p) => p.category === 'specialty');
    });

    let listViewTracked = false;
    watch(specialtyProducts, (list) => {
      if (listViewTracked || !list.length) return;
      listViewTracked = true;
      trackViewItemList({
        listId: 'specialty',
        listName: 'Specialty Magnets',
        items: list.map((p, i) => productToGaItem(p, i)),
      });
    });

    const specialtyProductsByCollection = computed(() => {
      return groupProductsByCollection(specialtyProducts.value);
    });

    const goToProductDetail = (product) => {
      router.push(`/product/specialty/${product.id}`);
    };

    onMounted(() => {
      loadProducts();
    });

    return {
      products,
      specialtyProducts,
      specialtyProductsByCollection,
      loading,
      goToProductDetail,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.product-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  max-width: 500px;
  margin: 0 auto;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.product-card-content {
  max-width: 100%;
}

.product-pricing {
  margin-top: 16px;
}
</style>
