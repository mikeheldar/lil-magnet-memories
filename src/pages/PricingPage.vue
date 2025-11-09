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
              <q-item-section avatar v-if="product.imageUrl">
                <q-avatar size="60px">
                  <img :src="product.imageUrl" :alt="product.description" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-h6">{{
                  product.description
                }}</q-item-label>
                <q-item-label caption>
                  <div
                    v-for="(price, qty) in product.pricing"
                    :key="qty"
                    class="price-info"
                  >
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

        <q-card class="q-mt-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-h5">Shipping Options</div>
              <div class="q-gutter-sm">
                <q-btn
                  color="primary"
                  label="Add Shipping Option"
                  icon="local_shipping"
                  size="sm"
                  @click="addShippingOption"
                />
                <q-btn
                  flat
                  color="grey-7"
                  label="Reset to Default"
                  size="sm"
                  @click="resetShippingOptions"
                />
              </div>
            </div>
            <div class="text-body2 text-grey-7">
              Adjust shipping speeds, pickup options, and costs for checkout.
            </div>
          </q-card-section>
          <q-separator />
          <q-list separator>
            <q-item
              v-for="(option, index) in shippingOptions"
              :key="option.value || index"
              class="shipping-option-item"
            >
              <q-item-section>
                <q-item-label class="text-weight-medium">
                  {{ option.label || option.value }}
                  <q-chip
                    v-if="option.default"
                    color="primary"
                    text-color="white"
                    size="sm"
                    class="q-ml-sm"
                  >
                    Default
                  </q-chip>
                </q-item-label>
                <q-item-label caption class="text-grey-7">
                  <div v-if="option.description">{{ option.description }}</div>
                  <div v-if="option.estimatedTimeline">
                    {{ option.estimatedTimeline }}
                  </div>
                  <div class="text-caption text-grey-6 q-mt-xs">
                    Type:
                    {{
                      option.type === 'pickup'
                        ? 'Event pickup'
                        : 'Ship to address'
                    }}
                    &nbsp;•&nbsp; Requires address:
                    {{ option.allowAddress !== false ? 'Yes' : 'No' }}
                  </div>
                </q-item-label>
              </q-item-section>
              <q-item-section side class="text-right">
                <div class="text-body2 text-primary">
                  {{ `$${Number(option.cost || 0).toFixed(2)}` }}
                </div>
                <div class="q-gutter-xs q-mt-sm">
                  <q-btn
                    flat
                    round
                    icon="edit"
                    color="primary"
                    size="sm"
                    @click="editShippingOption(index)"
                  />
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="confirmShippingDelete(index)"
                  />
                </div>
              </q-item-section>
            </q-item>
            <q-item v-if="!shippingOptions.length">
              <q-item-section>
                <q-item-label caption>
                  No shipping options configured yet.
                </q-item-label>
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

            <q-input
              v-model="editingProduct.detailedDescription"
              label="Detailed Description"
              type="textarea"
              filled
              rows="4"
              class="q-mb-md"
              hint="This will appear on the landing page"
            />

            <div class="text-body2 q-mb-sm">Product Image</div>
            <div v-if="editingProduct.imageUrl" class="q-mb-md">
              <img
                :src="editingProduct.imageUrl"
                alt="Product preview"
                class="product-preview-img"
              />
              <q-btn
                flat
                label="Remove Image"
                color="negative"
                size="sm"
                @click="removeImage"
                class="q-mt-xs"
              />
            </div>
            <q-file
              v-else
              v-model="imageFile"
              label="Upload Product Image"
              accept="image/*"
              filled
              @update:model-value="handleImageSelect"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            <div v-if="uploadingImage" class="q-mb-md">
              <q-spinner size="24px" />
              <span class="q-ml-sm">Uploading image...</span>
            </div>

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
                  :model-value="entry.price"
                  label="Price"
                  type="number"
                  prefix="$"
                  filled
                  dense
                  class="col-5"
                  @update:model-value="updatePrice(index, $event)"
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
              <q-btn color="primary" label="Save" @click="saveProduct" />
              <q-btn flat label="Cancel" @click="cancelEdit" />
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
          <span class="q-ml-sm"
            >Are you sure you want to delete this product?</span
          >
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="deleteProduct" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="shippingOptionDialog">
      <q-card style="min-width: 360px">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            {{
              shippingOptionIndex >= 0
                ? 'Edit Shipping Option'
                : 'New Shipping Option'
            }}
          </div>
          <q-input
            v-model="editingShippingOption.label"
            label="Label *"
            filled
            class="q-mb-md"
          />
          <q-input
            v-model="editingShippingOption.value"
            label="Identifier"
            hint="Optional unique key (auto-generated if left blank)"
            filled
            class="q-mb-md"
          />
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6">
              <q-input
                v-model.number="editingShippingOption.cost"
                type="number"
                label="Cost"
                prefix="$"
                filled
              />
            </div>
            <div class="col-6">
              <q-select
                v-model="editingShippingOption.type"
                :options="[
                  { label: 'Ship to address', value: 'shipping' },
                  { label: 'Event pickup', value: 'pickup' },
                ]"
                label="Type"
                filled
              />
            </div>
          </div>
          <q-input
            v-model="editingShippingOption.estimatedTimeline"
            label="Estimated timeline"
            filled
            class="q-mb-md"
          />
          <q-input
            v-model="editingShippingOption.description"
            label="Description"
            type="textarea"
            filled
            rows="3"
            class="q-mb-md"
          />
          <q-toggle
            v-model="editingShippingOption.allowAddress"
            :disable="editingShippingOption.type === 'pickup'"
            label="Requires customer address"
            class="q-mb-sm"
          />
          <q-toggle
            v-model="editingShippingOption.default"
            label="Make this the default option"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            @click="closeShippingOptionDialog"
          />
          <q-btn
            color="primary"
            label="Save"
            @click="saveShippingOptionChanges"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="shippingDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="local_shipping" color="negative" text-color="white" />
          <span class="q-ml-sm">Remove this shipping option?</span>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Cancel"
            color="primary"
            v-close-popup
            @click="shippingDeleteDialog = false"
          />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="deleteShippingOption"
          />
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
import {
  firebaseService,
  DEFAULT_SHIPPING_OPTIONS,
} from '../services/firebaseService.js';

export default {
  name: 'PricingPage',
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const products = ref([]);
    const editingProduct = ref(null);
    const showDeleteDialog = ref(false);
    const deleteIndex = ref(-1);
    const imageFile = ref(null);
    const uploadingImage = ref(false);
    const shippingOptions = ref([]);
    const shippingOptionDialog = ref(false);
    const shippingOptionIndex = ref(-1);
    const editingShippingOption = ref(null);
    const shippingDeleteDialog = ref(false);
    const shippingDeleteIndex = ref(-1);

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
      await Promise.all([loadProducts(), loadShippingOptions()]);
    });

    const pricingEntries = computed(() => {
      if (!editingProduct.value) return [];

      // Convert the pricing object to an array for easier editing
      return Object.entries(editingProduct.value.pricing).map(
        ([qty, price]) => ({
          qty: Number(qty),
          price: Number(price),
        })
      );
    });

    const loadProducts = async () => {
      try {
        const productsData = await firebaseService.getProducts();
        products.value = productsData || [];
      } catch (error) {
        console.error('Error loading products:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load products',
          position: 'top',
        });
      }
    };

    const loadShippingOptions = async () => {
      try {
        const options = await firebaseService.getShippingOptions();
        shippingOptions.value = Array.isArray(options)
          ? options
          : DEFAULT_SHIPPING_OPTIONS.map((option) => ({ ...option }));
      } catch (error) {
        console.error('Error loading shipping options:', error);
        shippingOptions.value = DEFAULT_SHIPPING_OPTIONS.map((option) => ({
          ...option,
        }));
        $q.notify({
          type: 'warning',
          message: 'Using default shipping options',
          position: 'top',
        });
      }
    };

    const slugify = (value) =>
      value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const startShippingOptionEdit = (option = null, index = -1) => {
      if (option) {
        editingShippingOption.value = {
          label: option.label || '',
          value: option.value || option.id || '',
          description: option.description || '',
          estimatedTimeline: option.estimatedTimeline || '',
          cost: Number(option.cost ?? 0),
          type: option.type || 'shipping',
          allowAddress: option.allowAddress !== false,
          default: option.default || false,
        };
        shippingOptionIndex.value = index;
      } else {
        editingShippingOption.value = {
          label: '',
          value: '',
          description: '',
          estimatedTimeline: '',
          cost: 0,
          type: 'shipping',
          allowAddress: true,
          default: shippingOptions.value.length === 0,
        };
        shippingOptionIndex.value = -1;
      }
      shippingOptionDialog.value = true;
    };

    const addShippingOption = () => {
      startShippingOptionEdit();
    };

    const editShippingOption = (index) => {
      const option = shippingOptions.value[index];
      if (!option) {
        return;
      }
      startShippingOptionEdit(option, index);
    };

    const closeShippingOptionDialog = () => {
      shippingOptionDialog.value = false;
      editingShippingOption.value = null;
      shippingOptionIndex.value = -1;
    };

    const saveShippingOptionChanges = async () => {
      const option = editingShippingOption.value;
      if (!option) {
        return;
      }
      if (!option.label.trim()) {
        $q.notify({
          type: 'negative',
          message: 'Please enter a label for the shipping option',
          position: 'top',
        });
        return;
      }
      let value = option.value.trim();
      if (!value) {
        value = slugify(option.label);
      }
      if (
        shippingOptions.value.some(
          (existing, index) =>
            existing.value === value && index !== shippingOptionIndex.value
        )
      ) {
        value = `${value}_${Date.now()}`;
      }

      const updatedOption = {
        label: option.label.trim(),
        value,
        description: option.description.trim(),
        estimatedTimeline: option.estimatedTimeline.trim(),
        cost: Number(option.cost ?? 0),
        type: option.type || 'shipping',
        allowAddress: option.allowAddress !== false,
        default: option.default || false,
      };

      if (updatedOption.default) {
        shippingOptions.value = shippingOptions.value.map((existing, index) =>
          index === shippingOptionIndex.value
            ? existing
            : { ...existing, default: false }
        );
      }

      if (shippingOptionIndex.value >= 0) {
        shippingOptions.value[shippingOptionIndex.value] = updatedOption;
      } else {
        shippingOptions.value.push(updatedOption);
      }

      try {
        await firebaseService.saveShippingOptions(shippingOptions.value);
        $q.notify({
          type: 'positive',
          message: 'Shipping options updated',
          position: 'top',
        });
        closeShippingOptionDialog();
      } catch (error) {
        console.error('Error saving shipping options:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to save shipping options',
          position: 'top',
        });
      }
    };

    const confirmShippingDelete = (index) => {
      shippingDeleteIndex.value = index;
      shippingDeleteDialog.value = true;
    };

    const deleteShippingOption = async () => {
      if (shippingOptions.value.length <= 1) {
        $q.notify({
          type: 'warning',
          message: 'At least one shipping option is required.',
          position: 'top',
        });
        shippingDeleteDialog.value = false;
        return;
      }
      const index = shippingDeleteIndex.value;
      if (index < 0) {
        shippingDeleteDialog.value = false;
        return;
      }
      const wasDefault = shippingOptions.value[index]?.default;
      shippingOptions.value.splice(index, 1);
      if (wasDefault && shippingOptions.value.length > 0) {
        shippingOptions.value[0].default = true;
      }
      try {
        await firebaseService.saveShippingOptions(shippingOptions.value);
        $q.notify({
          type: 'positive',
          message: 'Shipping option removed',
          position: 'top',
        });
      } catch (error) {
        console.error('Error deleting shipping option:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete shipping option',
          position: 'top',
        });
      } finally {
        shippingDeleteDialog.value = false;
        shippingDeleteIndex.value = -1;
      }
    };

    const resetShippingOptions = async () => {
      shippingOptions.value = DEFAULT_SHIPPING_OPTIONS.map((option) => ({
        ...option,
      }));
      try {
        await firebaseService.saveShippingOptions(shippingOptions.value);
        $q.notify({
          type: 'positive',
          message: 'Shipping options reset to defaults',
          position: 'top',
        });
      } catch (error) {
        console.error('Error resetting shipping options:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to reset shipping options',
          position: 'top',
        });
      }
    };

    const addProduct = () => {
      editingProduct.value = {
        description: '',
        detailedDescription: '',
        imageUrl: '',
        pricing: {
          1: 0.0,
        },
      };
      imageFile.value = null;
    };

    const editProduct = (index) => {
      editingProduct.value = {
        index,
        description: products.value[index].description,
        detailedDescription: products.value[index].detailedDescription || '',
        imageUrl: products.value[index].imageUrl || '',
        pricing: { ...products.value[index].pricing },
      };
      imageFile.value = null;
    };

    const cancelEdit = () => {
      editingProduct.value = null;
      imageFile.value = null;
    };

    const handleImageSelect = async (file) => {
      if (!file) return;

      uploadingImage.value = true;
      try {
        const imageUrl = await firebaseService.uploadProductImage(file);
        editingProduct.value.imageUrl = imageUrl;
        $q.notify({
          type: 'positive',
          message: 'Image uploaded successfully',
          position: 'top',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to upload image',
          position: 'top',
        });
      } finally {
        uploadingImage.value = false;
      }
    };

    const removeImage = () => {
      editingProduct.value.imageUrl = '';
      imageFile.value = null;
    };

    const saveProduct = async () => {
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
      pricingEntries.value.forEach((entry) => {
        pricing[entry.qty] = entry.price;
      });

      const product = {
        description: editingProduct.value.description,
        detailedDescription: editingProduct.value.detailedDescription || '',
        imageUrl: editingProduct.value.imageUrl || '',
        pricing,
      };

      try {
        if (editingProduct.value.index >= 0) {
          // Update existing
          const existingProduct = products.value[editingProduct.value.index];
          await firebaseService.updateProduct(existingProduct.id, product);
          products.value[editingProduct.value.index] = {
            ...product,
            id: existingProduct.id,
          };
          $q.notify({
            type: 'positive',
            message: 'Product updated',
            position: 'top',
          });
        } else {
          // Add new
          const id = await firebaseService.addProduct(product);
          products.value.push({ ...product, id });
          $q.notify({
            type: 'positive',
            message: 'Product added',
            position: 'top',
          });
        }
        editingProduct.value = null;
        imageFile.value = null;
      } catch (error) {
        console.error('Error saving product:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to save product',
          position: 'top',
        });
      }
    };

    const confirmDelete = (index) => {
      deleteIndex.value = index;
      showDeleteDialog.value = true;
    };

    const deleteProduct = async () => {
      try {
        const productToDelete = products.value[deleteIndex.value];
        if (productToDelete.id) {
          await firebaseService.deleteProduct(productToDelete.id);
        }
        products.value.splice(deleteIndex.value, 1);
        showDeleteDialog.value = false;
        deleteIndex.value = -1;
        $q.notify({
          type: 'positive',
          message: 'Product deleted',
          position: 'top',
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete product',
          position: 'top',
        });
      }
    };

    const addPricingTier = () => {
      const entries = pricingEntries.value;
      const maxQty =
        entries.length > 0 ? Math.max(...entries.map((e) => e.qty)) : 0;
      editingProduct.value.pricing[maxQty + 1] = 0.0;
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

    const updatePrice = (index, newPrice) => {
      const entries = pricingEntries.value;
      const qty = entries[index].qty;
      editingProduct.value.pricing[qty] = parseFloat(newPrice) || 0;
    };

    return {
      products,
      editingProduct,
      showDeleteDialog,
      pricingEntries,
      imageFile,
      uploadingImage,
      shippingOptions,
      shippingOptionDialog,
      editingShippingOption,
      shippingOptionIndex,
      shippingDeleteDialog,
      addProduct,
      editProduct,
      cancelEdit,
      saveProduct,
      confirmDelete,
      deleteProduct,
      addPricingTier,
      removePricing,
      updateQuantity,
      updatePrice,
      handleImageSelect,
      removeImage,
      addShippingOption,
      editShippingOption,
      closeShippingOptionDialog,
      saveShippingOptionChanges,
      confirmShippingDelete,
      deleteShippingOption,
      resetShippingOptions,
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

.product-preview-img {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 8px;
}

.shipping-option-item {
  padding: 12px 16px;
}
</style>
