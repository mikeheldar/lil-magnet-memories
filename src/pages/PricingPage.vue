<template>
  <q-page padding class="pricing-page">
    <div class="row q-col-gutter-md">
      <!-- Left: Pricing List -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h5 q-mb-md">Product Pricing</div>
            <q-btn
              color="primary"
              label="Add New Product"
              icon="add"
              @click="addProduct"
              class="q-mb-md"
            />
          </q-card-section>

          <q-list separator>
            <q-item
              v-for="(product, index) in products"
              :key="index"
              class="product-item"
            >
              <q-item-section>
                <q-item-label class="text-h6">{{ product.description }}</q-item-label>
                <q-item-label caption>
                  <div v-for="(price, qty) in product.pricing" :key="qty" class="price-info">
                    {{ qty }} for ${{ price.toFixed(2) }}
                  </div>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn
                  flat
                  round
                  icon="edit"
                  color="primary"
                  @click="editProduct(index)"
                />
                <q-btn
                  flat
                  round
                  icon="delete"
                  color="negative"
                  @click="confirmDelete(index)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Right: Product Form -->
      <div class="col-12 col-md-4">
        <q-card v-if="editingProduct">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              {{ editingProduct.index >= 0 ? 'Edit Product' : 'New Product' }}
            </div>

            <q-input
              v-model="editingProduct.description"
              label="Product Description"
              filled
              class="q-mb-md"
            />

            <div class="text-body2 q-mb-sm">Pricing</div>
            <div
              v-for="(entry, index) in pricingEntries"
              :key="index"
              class="pricing-entry q-mb-md"
            >
              <div class="row q-col-gutter-sm items-center">
                <q-input
                  :model-value="entry.qty"
                  label="Quantity"
                  type="number"
                  filled
                  dense
                  class="col-5"
                  @update:model-value="updateQuantity(index, $event)"
                />
                <q-input
                  v-model.number="entry.price"
                  label="Price"
                  type="number"
                  prefix="$"
                  filled
                  dense
                  class="col-5"
                />
                <q-btn
                  flat
                  round
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click="removePricing(index)"
                />
              </div>
            </div>

            <q-btn
              flat
              label="Add Pricing Tier"
              icon="add"
              @click="addPricingTier"
              class="q-mb-md"
            />

            <div class="q-gutter-md">
              <q-btn
                color="primary"
                label="Save"
                @click="saveProduct"
              />
              <q-btn
                flat
                label="Cancel"
                @click="cancelEdit"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="delete" color="negative" text-color="white" />
          <span class="q-ml-sm">Are you sure you want to delete this product?</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteProduct" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { authService } from '../services/authService';
import { useRouter } from 'vue-router';

export default {
  name: 'PricingPage',
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const products = ref([]);
    const editingProduct = ref(null);
    const showDeleteDialog = ref(false);
    const deleteIndex = ref(-1);

    // Check admin access
    onMounted(async () => {
      if (!authService.isAuthenticated() || !authService.isAdmin()) {
        $q.notify({
          type: 'negative',
          message: 'Access denied. Admin privileges required.',
          position: 'top',
        });
        router.push('/');
        return;
      }
      loadProducts();
    });

    const pricingEntries = computed(() => {
      if (!editingProduct.value) return [];
      
      // Convert the pricing object to an array for easier editing
      return Object.entries(editingProduct.value.pricing).map(([qty, price]) => ({
        qty: Number(qty),
        price: Number(price),
      }));
    });

    const loadProducts = () => {
      // For now, use sample data
      products.value = [
        {
          description: 'Photo Magnet',
          pricing: {
            1: 5.00,
            3: 14.00,
          },
        },
        {
          description: 'Kid Drawing Magnet',
          pricing: {
            1: 4.00,
          },
        },
      ];
    };

    const addProduct = () => {
      editingProduct.value = {
        description: '',
        pricing: {
          1: 0.00,
        },
      };
    };

    const editProduct = (index) => {
      editingProduct.value = {
        index,
        description: products.value[index].description,
        pricing: { ...products.value[index].pricing },
      };
    };

    const cancelEdit = () => {
      editingProduct.value = null;
    };

    const saveProduct = () => {
      if (!editingProduct.value.description) {
        $q.notify({
          type: 'negative',
          message: 'Please enter a product description',
          position: 'top',
        });
        return;
      }

      // Rebuild pricing object from entries to ensure it's in sync
      const pricing = {};
      pricingEntries.value.forEach(entry => {
        pricing[entry.qty] = entry.price;
      });

      const product = {
        description: editingProduct.value.description,
        pricing,
      };

      if (editingProduct.value.index >= 0) {
        // Update existing
        products.value[editingProduct.value.index] = product;
        $q.notify({
          type: 'positive',
          message: 'Product updated',
          position: 'top',
        });
      } else {
        // Add new
        products.value.push(product);
        $q.notify({
          type: 'positive',
          message: 'Product added',
          position: 'top',
        });
      }

      editingProduct.value = null;
    };

    const confirmDelete = (index) => {
      deleteIndex.value = index;
      showDeleteDialog.value = true;
    };

    const deleteProduct = () => {
      products.value.splice(deleteIndex.value, 1);
      showDeleteDialog.value = false;
      deleteIndex.value = -1;
      $q.notify({
        type: 'positive',
        message: 'Product deleted',
        position: 'top',
      });
    };

    const addPricingTier = () => {
      const entries = pricingEntries.value;
      const maxQty = entries.length > 0 ? Math.max(...entries.map(e => e.qty)) : 0;
      editingProduct.value.pricing[maxQty + 1] = 0.00;
    };

    const removePricing = (index) => {
      if (pricingEntries.value.length > 1) {
        const entries = pricingEntries.value;
        const qtyToRemove = entries[index].qty;
        delete editingProduct.value.pricing[qtyToRemove];
        $q.notify({
          type: 'info',
          message: 'Pricing tier removed',
          position: 'top',
        });
      } else {
        $q.notify({
          type: 'negative',
          message: 'At least one pricing tier is required',
          position: 'top',
        });
      }
    };

    const updateQuantity = (index, newQty) => {
      const entries = pricingEntries.value;
      const oldQty = entries[index].qty;
      const price = entries[index].price;
      delete editingProduct.value.pricing[oldQty];
      editingProduct.value.pricing[newQty] = price;
    };

    return {
      products,
      editingProduct,
      showDeleteDialog,
      pricingEntries,
      addProduct,
      editProduct,
      cancelEdit,
      saveProduct,
      confirmDelete,
      deleteProduct,
      addPricingTier,
      removePricing,
      updateQuantity,
    };
  },
};
</script>

<style scoped>
.product-item {
  padding: 16px;
}

.price-info {
  margin: 4px 0;
  font-weight: 500;
}

.pricing-entry {
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>

