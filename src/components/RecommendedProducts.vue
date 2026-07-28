<template>
  <div v-if="recommendations.length > 0" class="recommended-products q-mt-lg">
    <div class="text-h6 q-mb-md">{{ title }}</div>
    <div class="row q-col-gutter-md">
      <div
        v-for="(product, index) in recommendations"
        :key="product.id"
        class="col-6 col-sm-4 col-md-3"
      >
        <q-card
          class="recommended-card cursor-pointer full-height column"
          @click="goToProduct(product, index)"
        >
          <q-img
            :src="product.imageUrl || ''"
            :alt="product.description"
            ratio="1"
            class="recommended-img"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-6">
                <q-icon name="image" size="32px" />
              </div>
            </template>
          </q-img>
          <q-card-section class="col column justify-between q-pa-sm">
            <div class="text-body2 text-weight-medium ellipsis-2-lines">
              {{ product.description }}
            </div>
            <div
              v-if="startingPrice(product) !== null"
              class="text-primary text-weight-bold q-mt-xs"
            >
              from ${{ startingPrice(product).toFixed(2) }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { productDetailPath } from '../utils/productTypeRoutes.js';
import {
  productToGaItem,
  trackViewItemList,
  trackEvent,
} from '../utils/analytics.js';

const LIST_ID = 'cart_cross_sell';
const LIST_NAME = 'You might also like';

export default {
  name: 'RecommendedProducts',
  props: {
    // Product ids already in the cart — never recommend these back.
    excludeIds: {
      type: Array,
      default: () => [],
    },
    title: {
      type: String,
      default: LIST_NAME,
    },
    limit: {
      type: Number,
      default: 4,
    },
  },
  setup(props) {
    const router = useRouter();
    const recommendations = ref([]);

    // Lowest per-unit price across the product's pricing tiers.
    // pricing is a { qty: totalPrice } map, so per-unit = totalPrice / qty.
    const startingPrice = (product) => {
      const pricing = product.pricing;
      if (!pricing || typeof pricing !== 'object') return null;
      let min = null;
      for (const [qty, total] of Object.entries(pricing)) {
        const q = Number(qty);
        const t = Number(total);
        if (!q || Number.isNaN(t)) continue;
        const perUnit = t / q;
        if (min === null || perUnit < min) min = perUnit;
      }
      return min;
    };

    const goToProduct = (product, index) => {
      trackEvent('select_item', {
        item_list_id: LIST_ID,
        item_list_name: LIST_NAME,
        items: [productToGaItem(product, index)],
      });
      router.push(productDetailPath(product.category, product.id));
    };

    onMounted(async () => {
      try {
        const exclude = new Set((props.excludeIds || []).map((id) => String(id)));
        const products = await firebaseService.getProducts();
        recommendations.value = (products || [])
          .filter((p) => p && p.id && !exclude.has(String(p.id)))
          .filter((p) => startingPrice(p) !== null)
          .slice(0, props.limit);

        if (recommendations.value.length > 0) {
          trackViewItemList({
            listId: LIST_ID,
            listName: LIST_NAME,
            items: recommendations.value.map((p, i) => productToGaItem(p, i)),
          });
        }
      } catch (error) {
        // Cross-sell is non-essential — never let it break the cart page.
        console.error('RecommendedProducts: failed to load products', error);
        recommendations.value = [];
      }
    });

    return {
      recommendations,
      startingPrice,
      goToProduct,
    };
  },
};
</script>

<style scoped>
.recommended-card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.recommended-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.recommended-img {
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
}
.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.6em;
}
</style>
