<template>
  <q-page padding class="pricing-page">
    <div class="pricing-page-container-full">
      <!-- Full Width Product Management Section -->
      <q-card>
        <q-card-section>
          <div class="text-h5 q-mb-md">Product Management</div>
          
          <!-- Product Type Visibility Toggles -->
          <div class="row items-center q-gutter-md q-mb-md q-pa-sm" style="background: #f5f5f5; border-radius: 4px;">
            <div class="text-subtitle2 text-weight-medium">Show in Menus:</div>
            <q-toggle
              v-model="customVisible"
              label="Custom"
              color="primary"
              size="sm"
              @update:model-value="updateVisibility('custom', $event)"
            />
            <q-toggle
              v-model="designerVisible"
              label="Designer"
              color="secondary"
              size="sm"
              @update:model-value="updateVisibility('designer', $event)"
            />
            <q-toggle
              v-model="specialtyVisible"
              label="Specialty"
              color="specialty"
              size="sm"
              @update:model-value="updateVisibility('specialty', $event)"
            />
          </div>
              
              <q-tabs v-model="activeCategory" class="text-primary q-mb-md">
                <q-tab name="custom" label="Custom Photo Products" />
                <q-tab name="designer" label="Designer Magnets" />
                <q-tab name="specialty" label="Specialty Products" />
              </q-tabs>
            <div class="q-gutter-sm q-mb-md">
              <q-btn
                color="primary"
                label="Add New Product"
                icon="add"
                @click="addProduct"
              />
              <q-btn
                color="secondary"
                label="Bulk Add Products"
                icon="upload"
                @click="bulkAddProducts"
              />
            </div>
          </q-card-section>

          <div v-if="Object.keys(productsByCollection).length > 0">
            <q-expansion-item
              v-for="(productsInCollection, collectionName) in productsByCollection"
              :key="collectionName"
              :label="collectionName"
              :caption="`${productsInCollection.length} product${productsInCollection.length !== 1 ? 's' : ''}`"
              default-opened
              class="collection-group q-mb-sm"
            >
              <q-list separator>
                <q-item
                  v-for="product in productsInCollection"
                  :key="product.id"
                  class="product-item"
                >
                  <q-item-section avatar>
                    <!-- Show first image from images array or imageUrl -->
                    <q-avatar 
                      v-if="(product.images && product.images.length > 0) || product.imageUrl" 
                      size="80px"
                      square
                    >
                      <img 
                        :src="product.images && product.images.length > 0 ? product.images[0] : product.imageUrl" 
                        :alt="product.description"
                        style="object-fit: cover; width: 100%; height: 100%;"
                      />
                    </q-avatar>
                    <q-avatar 
                      v-else 
                      size="80px"
                      square
                      color="grey-3"
                      icon="image"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-h6">
                      {{ product.description }}
                      <q-chip
                        v-if="product.isTesting"
                        color="orange"
                        text-color="white"
                        size="sm"
                        class="q-ml-sm"
                      >
                        Testing Only
                      </q-chip>
                      <q-chip
                        v-if="product.isDefault"
                        color="green"
                        text-color="white"
                        size="sm"
                        class="q-ml-sm"
                        icon="star"
                      >
                        Default
                      </q-chip>
                    </q-item-label>
                    <q-item-label caption>
                      <div class="q-mb-xs">
                        <q-chip
                          :color="getCategoryColor(product.category)"
                          text-color="white"
                          size="sm"
                        >
                          {{ getCategoryLabel(product.category) }}
                        </q-chip>
                      </div>
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
                      @click="editProduct(product.originalIndex)"
                    />
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      @click="confirmDelete(product.originalIndex)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-expansion-item>
          </div>
          <div v-else class="text-center q-pa-lg text-grey-6">
            No products in this category yet.
          </div>
        </q-card>

        <!-- EDIT/ADD PRODUCT FORM - Appears between products and shipping -->
        <q-card v-if="editingProduct && !bulkEditingProduct" class="q-mt-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6">{{ editingProduct.index !== undefined ? 'Edit Product' : 'New Product' }}</div>
              <q-btn flat dense label="Cancel" @click="cancelEdit" />
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

            <q-select
              v-model="editingProduct.category"
              :options="[
                { label: 'Custom Photo Products', value: 'custom' },
                { label: 'Designer Magnets', value: 'designer' },
                { label: 'Specialty Products', value: 'specialty' }
              ]"
              label="Category *"
              filled
              class="q-mb-md"
              hint="Which section this product appears in"
            />

            <q-select
              v-model="editingProduct.collection"
              :options="collectionOptions"
              label="Collection"
              filled
              use-input
              input-debounce="0"
              new-value-mode="add"
              @new-value="createCollection"
              class="q-mb-md"
              hint="Group products together (optional). Can create new or select existing."
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Type to create a new collection
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-toggle
              v-model="editingProduct.isTesting"
              label="Testing Only (Admin Only)"
              class="q-mb-md"
              hint="This product will only be visible to admins for testing"
            />

            <q-toggle
              v-if="!bulkEditingProduct"
              v-model="editingProduct.isDefault"
              label="Set as Default Product"
              class="q-mb-md"
              hint="This product will be selected by default in photo upload forms"
            />

            <div class="text-body2 q-mb-sm">Product Images</div>
            <div v-if="editingProduct.images && editingProduct.images.length > 0" class="q-mb-md">
              <div class="row q-col-gutter-sm q-mb-sm">
                <div v-for="(imageUrl, index) in editingProduct.images" :key="index" class="col-6 col-sm-4 col-md-3">
                  <div class="product-image-wrapper">
                    <img
                      :src="imageUrl"
                      alt="Product image"
                      class="product-preview-img"
                    />
                    <q-btn
                      flat
                      round
                      dense
                      icon="close"
                      color="negative"
                      size="sm"
                      @click="removeImageAtIndex(index)"
                      class="remove-image-btn"
                    />
                  </div>
                </div>
              </div>
            </div>
            <q-file
              v-model="imageFiles"
              label="Upload Product Images"
              accept="image/*"
              filled
              multiple
              @update:model-value="handleMultipleImageSelect"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
              <template v-slot:hint>
                You can upload multiple images for this product
              </template>
            </q-file>
            <div v-if="uploadingImage" class="q-mb-md">
              <q-spinner size="24px" />
              <span class="q-ml-sm">Uploading images...</span>
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

        <!-- BULK ADD PRODUCT FORM - Appears between products and shipping -->
        <q-card v-if="bulkEditingProduct" class="q-mt-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h6">Bulk Add Products</div>
              <q-btn flat dense label="Cancel" @click="cancelBulkEdit" />
            </div>
            <div class="text-body2 text-grey-7 q-mb-md">
              Upload multiple product images. All products will share the same details below.
            </div>

            <q-input
              v-model="bulkEditingProduct.description"
              label="Product Description *"
              filled
              class="q-mb-md"
            />

            <q-input
              v-model="bulkEditingProduct.detailedDescription"
              label="Detailed Description"
              type="textarea"
              filled
              rows="4"
              class="q-mb-md"
              hint="This will appear on the landing page"
            />

            <q-select
              v-model="bulkEditingProduct.category"
              :options="[
                { label: 'Custom Photo Products', value: 'custom' },
                { label: 'Designer Magnets', value: 'designer' },
                { label: 'Specialty Products', value: 'specialty' }
              ]"
              label="Category *"
              filled
              class="q-mb-md"
              hint="Which section these products appear in"
            />

            <q-select
              v-model="bulkEditingProduct.collection"
              :options="collectionOptions"
              label="Collection"
              filled
              use-input
              input-debounce="0"
              new-value-mode="add"
              @new-value="createCollection"
              class="q-mb-md"
              hint="Group products together (optional). Can create new or select existing."
            >
              <template v-slot:no-option>
                <q-item>
                  <q-item-section class="text-grey">
                    Type to create a new collection
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-toggle
              v-model="bulkEditingProduct.isTesting"
              label="Testing Only (Admin Only)"
              class="q-mb-md"
              hint="These products will only be visible to admins for testing"
            />

            <div class="text-body2 q-mb-sm">Product Images</div>
            <q-file
              v-model="bulkImageFiles"
              label="Upload Multiple Product Images"
              accept="image/*"
              filled
              multiple
              @update:model-value="handleBulkImageSelect"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
              <template v-slot:hint>
                Each image will create a separate product with the details above
              </template>
            </q-file>
            <div v-if="uploadingBulkImages" class="q-mb-md">
              <q-spinner size="24px" />
              <span class="q-ml-sm">Uploading images...</span>
            </div>
            <div v-if="bulkImageFiles && bulkImageFiles.length > 0" class="q-mb-md">
              <div class="text-body2 q-mb-sm">
                Selected {{ bulkImageFiles.length }} image(s)
              </div>
            </div>

            <div class="text-body2 q-mb-sm">Pricing (shared across all products)</div>
            <div
              v-for="(entry, index) in bulkPricingEntries"
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
                  @update:model-value="updateBulkQuantity(index, $event)"
                />
                <q-input
                  :model-value="entry.price"
                  label="Price"
                  type="number"
                  prefix="$"
                  filled
                  dense
                  class="col-5"
                  @update:model-value="updateBulkPrice(index, $event)"
                />
                <q-btn
                  flat
                  round
                  icon="delete"
                  color="negative"
                  size="sm"
                  @click="removeBulkPricing(index)"
                />
              </div>
            </div>

            <q-btn
              flat
              label="Add Pricing Tier"
              icon="add"
              @click="addBulkPricingTier"
              class="q-mb-md"
            />

            <div class="q-gutter-md">
              <q-btn
                color="primary"
                label="Save All Products"
                :loading="uploadingBulkImages"
                :disable="!bulkImageFiles || bulkImageFiles.length === 0"
                @click="saveBulkProducts"
              />
              <q-btn flat label="Cancel" @click="cancelBulkEdit" />
            </div>
          </q-card-section>
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
                    v-if="option.isTesting"
                    color="orange"
                    text-color="white"
                    size="sm"
                    class="q-ml-sm"
                  >
                    Testing Only
                  </q-chip>
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
            v-model="editingShippingOption.isTesting"
            label="Testing Only (Admin Only)"
            class="q-mb-sm"
            hint="This shipping option will only be visible to admins for testing"
          />
          <q-toggle
            v-model="editingShippingOption.default"
            label="Make this the default option for online orders"
            hint="Only shipping options (not pickup) should be set as default. This will be used when customers order online."
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
import { ref, onMounted, computed, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { authService } from '../services/authService';
import { useRouter } from 'vue-router';
import {
  firebaseService,
  DEFAULT_SHIPPING_OPTIONS,
} from '../services/firebaseService.js';

export default {
  name: 'PricingPage',
  components: {},
  setup() {
    const $q = useQuasar();
    const router = useRouter();
    const products = ref([]);
    const editingProduct = ref(null);
    const showDeleteDialog = ref(false);
    const deleteIndex = ref(-1);
    const imageFile = ref(null);
    const imageFiles = ref(null); // For multiple image uploads
    const uploadingImage = ref(false);
    const bulkEditingProduct = ref(null);
    const bulkImageFiles = ref(null);
    const uploadingBulkImages = ref(false);
    const shippingOptions = ref([]);
    const shippingOptionDialog = ref(false);
    const shippingOptionIndex = ref(-1);
    const editingShippingOption = ref(null);
    const shippingDeleteDialog = ref(false);
    const shippingDeleteIndex = ref(-1);
    const activeCategory = ref('custom');
    
    // Product type visibility settings
    const customVisible = ref(true);
    const designerVisible = ref(true);
    const specialtyVisible = ref(true);
    const updatingVisibility = ref(false);

    // Filter products by active category
    const filteredProducts = computed(() => {
      return products.value.filter(product => product.category === activeCategory.value);
    });

    // Group filtered products by collection
    const productsByCollection = computed(() => {
      const grouped = {};
      filteredProducts.value.forEach((product) => {
        const collection = product.collection || 'Uncategorized';
        if (!grouped[collection]) {
          grouped[collection] = [];
        }
        // Store the original index for editing/deleting
        const originalIndex = products.value.findIndex(p => p.id === product.id);
        grouped[collection].push({ ...product, originalIndex });
      });
      // Sort collections alphabetically, with "Uncategorized" last
      const sorted = Object.keys(grouped).sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
      });
      const result = {};
      sorted.forEach(key => {
        result[key] = grouped[key];
      });
      return result;
    });

    // Extract unique collections from all products
    const collectionOptions = computed(() => {
      const collections = new Set();
      products.value.forEach(product => {
        if (product.collection && product.collection.trim()) {
          collections.add(product.collection.trim());
        }
      });
      return Array.from(collections).sort().map(c => ({ label: c, value: c }));
    });

    const createCollection = (val, done) => {
      if (val.length > 0) {
        done(val, 'add');
      }
    };

    // Get category label
    const getCategoryLabel = (category) => {
      switch (category) {
        case 'custom':
          return 'Custom Photo Products';
        case 'designer':
          return 'Designer Magnets';
        case 'specialty':
          return 'Specialty Products';
        default:
          return 'Custom Products';
      }
    };

    // Get category color
    const getCategoryColor = (category) => {
      switch (category) {
        case 'custom':
          return 'primary';
        case 'designer':
          return 'purple';
        case 'specialty':
          return 'orange';
        default:
          return 'primary';
      }
    };

    // Safe notify helper to prevent errors when $q.notify is not available
    const safeNotify = (options) => {
      try {
        if ($q && typeof $q.notify === 'function') {
          $q.notify(options);
        } else {
          console.warn('Notification not available:', options);
        }
      } catch (error) {
        console.error('Error showing notification:', error, options);
      }
    };

    // Load product type visibility settings
    const loadVisibilitySettings = async () => {
      try {
        const visibility = await firebaseService.getProductTypeVisibility();
        customVisible.value = visibility.custom;
        designerVisible.value = visibility.designer;
        specialtyVisible.value = visibility.specialty;
      } catch (error) {
        console.error('Error loading visibility settings:', error);
      }
    };

    // Update product type visibility
    const updateVisibility = async (category, value) => {
      if (updatingVisibility.value) return;
      
      updatingVisibility.value = true;
      try {
        const visibility = {
          custom: customVisible.value,
          designer: designerVisible.value,
          specialty: specialtyVisible.value,
        };
        visibility[category] = value;
        
        await firebaseService.updateProductTypeVisibility(visibility);
        safeNotify({
          type: 'positive',
          message: 'Visibility settings updated',
          position: 'top',
          timeout: 2000,
        });
      } catch (error) {
        console.error('Error updating visibility:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to update visibility settings',
          position: 'top',
        });
        // Revert the toggle on error
        if (category === 'custom') customVisible.value = !value;
        else if (category === 'designer') designerVisible.value = !value;
        else if (category === 'specialty') specialtyVisible.value = !value;
      } finally {
        updatingVisibility.value = false;
      }
    };

    // Check admin access
    onMounted(async () => {
      if (!authService.isAuthenticated() || !authService.isAdmin()) {
        safeNotify({
          type: 'negative',
          message: 'Access denied. Admin privileges required.',
          position: 'top',
        });
        router.push('/');
        return;
      }
      await Promise.all([loadProducts(), loadShippingOptions(), loadVisibilitySettings()]);
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
        // Admins see all products including testing ones
        const productsData = await firebaseService.getProducts(true);
        products.value = productsData || [];
      } catch (error) {
        console.error('Error loading products:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to load products',
          position: 'top',
        });
      }
    };

    const loadShippingOptions = async () => {
      try {
        // Admins see all shipping options including testing ones
        const options = await firebaseService.getShippingOptions(true);
        shippingOptions.value = Array.isArray(options)
          ? options
          : DEFAULT_SHIPPING_OPTIONS.map((option) => ({ ...option }));
      } catch (error) {
        console.error('Error loading shipping options:', error);
        shippingOptions.value = DEFAULT_SHIPPING_OPTIONS.map((option) => ({
          ...option,
        }));
        safeNotify({
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
          isTesting: option.isTesting || false,
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
          isTesting: false,
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
        safeNotify({
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
        isTesting: option.isTesting || false,
        default: option.default || false,
      };

      // If setting this as default, unset all other defaults
      // Also ensure only shipping options (not pickup) can be default
      if (updatedOption.default) {
        if (updatedOption.type === 'pickup') {
          safeNotify({
            type: 'warning',
            message: 'Pickup options cannot be set as default. Only shipping options can be default for online orders.',
            position: 'top',
          });
          updatedOption.default = false;
        } else {
          // Unset all other defaults
          shippingOptions.value = shippingOptions.value.map((existing, index) =>
            index === shippingOptionIndex.value
              ? existing
              : { ...existing, default: false }
          );
        }
      }

      if (shippingOptionIndex.value >= 0) {
        shippingOptions.value[shippingOptionIndex.value] = updatedOption;
      } else {
        shippingOptions.value.push(updatedOption);
      }

      try {
        await firebaseService.saveShippingOptions(shippingOptions.value);
        safeNotify({
          type: 'positive',
          message: 'Shipping options updated',
          position: 'top',
        });
        closeShippingOptionDialog();
      } catch (error) {
        console.error('Error saving shipping options:', error);
        safeNotify({
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
        safeNotify({
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
        safeNotify({
          type: 'positive',
          message: 'Shipping option removed',
          position: 'top',
        });
      } catch (error) {
        console.error('Error deleting shipping option:', error);
        safeNotify({
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
        safeNotify({
          type: 'positive',
          message: 'Shipping options reset to defaults',
          position: 'top',
        });
      } catch (error) {
        console.error('Error resetting shipping options:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to reset shipping options',
          position: 'top',
        });
      }
    };

    const addProduct = () => {
      bulkEditingProduct.value = null;
      bulkImageFiles.value = null;
      editingProduct.value = {
        description: '',
        detailedDescription: '',
        imageUrl: '',
        images: [], // Support multiple images
        category: activeCategory.value,
        collection: '',
        isTesting: false,
        isDefault: false,
        pricing: {
          1: 0.0,
        },
      };
      imageFile.value = null;
      imageFiles.value = null;
    };

    const bulkAddProducts = () => {
      editingProduct.value = null;
      imageFile.value = null;
      bulkEditingProduct.value = {
        description: '',
        detailedDescription: '',
        category: activeCategory.value,
        collection: '',
        isTesting: false,
        pricing: {
          1: 0.0,
        },
      };
      bulkImageFiles.value = null;
    };

    const cancelBulkEdit = () => {
      bulkEditingProduct.value = null;
      bulkImageFiles.value = null;
      editingProduct.value = null;
      imageFile.value = null;
    };

    const getImagePreview = (file) => {
      if (!file) return '';
      return URL.createObjectURL(file);
    };

    const handleBulkImageSelect = (files) => {
      // files can be a FileList or an array
      if (files) {
        bulkImageFiles.value = Array.isArray(files) ? files : Array.from(files);
      }
    };

    const removeBulkImage = (index) => {
      if (bulkImageFiles.value && bulkImageFiles.value.length > index) {
        bulkImageFiles.value.splice(index, 1);
      }
    };

    const bulkPricingEntries = computed(() => {
      if (!bulkEditingProduct.value) return [];

      return Object.entries(bulkEditingProduct.value.pricing).map(
        ([qty, price]) => ({
          qty: Number(qty),
          price: Number(price),
        })
      );
    });

    const addBulkPricingTier = () => {
      const entries = bulkPricingEntries.value;
      const maxQty =
        entries.length > 0 ? Math.max(...entries.map((e) => e.qty)) : 0;
      bulkEditingProduct.value.pricing[maxQty + 1] = 0.0;
    };

    const removeBulkPricing = (index) => {
      if (bulkPricingEntries.value.length > 1) {
        const entries = bulkPricingEntries.value;
        const qtyToRemove = entries[index].qty;
        delete bulkEditingProduct.value.pricing[qtyToRemove];
        safeNotify({
          type: 'info',
          message: 'Pricing tier removed',
          position: 'top',
        });
      } else {
        safeNotify({
          type: 'negative',
          message: 'At least one pricing tier is required',
          position: 'top',
        });
      }
    };

    const updateBulkQuantity = (index, newQty) => {
      const entries = bulkPricingEntries.value;
      const oldQty = entries[index].qty;
      const price = entries[index].price;
      delete bulkEditingProduct.value.pricing[oldQty];
      bulkEditingProduct.value.pricing[newQty] = price;
    };

    const updateBulkPrice = (index, newPrice) => {
      const entries = bulkPricingEntries.value;
      const qty = entries[index].qty;
      bulkEditingProduct.value.pricing[qty] = parseFloat(newPrice) || 0;
    };

    const saveBulkProducts = async () => {
      if (!bulkEditingProduct.value.description) {
        safeNotify({
          type: 'negative',
          message: 'Please enter a product description',
          position: 'top',
        });
        return;
      }

      if (!bulkImageFiles.value || bulkImageFiles.value.length === 0) {
        safeNotify({
          type: 'negative',
          message: 'Please select at least one image',
          position: 'top',
        });
        return;
      }

      if (!bulkEditingProduct.value.category) {
        safeNotify({
          type: 'negative',
          message: 'Please select a category for the products',
          position: 'top',
        });
        return;
      }

      // Rebuild pricing object from entries
      const pricing = {};
      bulkPricingEntries.value.forEach((entry) => {
        pricing[entry.qty] = entry.price;
      });

      uploadingBulkImages.value = true;

      try {
        const productBase = {
          description: bulkEditingProduct.value.description,
          detailedDescription: bulkEditingProduct.value.detailedDescription || '',
          category: bulkEditingProduct.value.category,
          collection: bulkEditingProduct.value.collection || '',
          isTesting: bulkEditingProduct.value.isTesting || false,
          isDefault: false, // Bulk products cannot be default
          pricing,
        };

        // Upload all images and create products
        const uploadPromises = bulkImageFiles.value.map(async (file) => {
          const imageUrl = await firebaseService.uploadProductImage(file);
          const product = {
            ...productBase,
            imageUrl,
          };
          const id = await firebaseService.addProduct(product);
          return {
            ...product,
            id,
          };
        });

        const newProducts = await Promise.all(uploadPromises);
        products.value.push(...newProducts);

        safeNotify({
          type: 'positive',
          message: `Successfully added ${newProducts.length} product(s)`,
          position: 'top',
        });

        // Clear the bulk form
        bulkEditingProduct.value = null;
        bulkImageFiles.value = null;
        await nextTick();
      } catch (error) {
        console.error('Error saving bulk products:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to save products',
          position: 'top',
        });
      } finally {
        uploadingBulkImages.value = false;
      }
    };

    const editProduct = (index) => {
      editingProduct.value = {
        index,
        description: products.value[index].description,
        detailedDescription: products.value[index].detailedDescription || '',
        imageUrl: products.value[index].imageUrl || '',
        images: products.value[index].images || [], // Load multiple images
        category: products.value[index].category || 'custom',
        collection: products.value[index].collection || '',
        isTesting: products.value[index].isTesting || false,
        isDefault: products.value[index].isDefault || false,
        pricing: { ...products.value[index].pricing },
      };
      imageFile.value = null;
      imageFiles.value = null;
    };

    const cancelEdit = () => {
      editingProduct.value = null;
      imageFile.value = null;
      bulkEditingProduct.value = null;
      bulkImageFiles.value = null;
    };

    const handleMultipleImageSelect = async (files) => {
      if (!files || files.length === 0) return;

      uploadingImage.value = true;
      try {
        // Initialize images array if it doesn't exist
        if (!editingProduct.value.images) {
          editingProduct.value.images = [];
        }

        // Upload all files
        for (const file of files) {
          const imageUrl = await firebaseService.uploadProductImage(file);
          editingProduct.value.images.push(imageUrl);
        }

        safeNotify({
          type: 'positive',
          message: `${files.length} image(s) uploaded successfully`,
          position: 'top',
        });

        // Clear the file input
        imageFiles.value = null;
      } catch (error) {
        console.error('Error uploading images:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to upload images',
          position: 'top',
        });
      } finally {
        uploadingImage.value = false;
      }
    };

    const removeImageAtIndex = (index) => {
      if (editingProduct.value.images) {
        editingProduct.value.images.splice(index, 1);
      }
    };

    const handleImageSelect = async (file) => {
      if (!file) return;

      uploadingImage.value = true;
      try {
        const imageUrl = await firebaseService.uploadProductImage(file);
        // Support old single image format
        editingProduct.value.imageUrl = imageUrl;
        safeNotify({
          type: 'positive',
          message: 'Image uploaded successfully',
          position: 'top',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        safeNotify({
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
        safeNotify({
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

      if (!editingProduct.value.category) {
        safeNotify({
          type: 'negative',
          message: 'Please select a category for the product',
          position: 'top',
        });
        return;
      }

      const product = {
        description: editingProduct.value.description,
        detailedDescription: editingProduct.value.detailedDescription || '',
        imageUrl: editingProduct.value.imageUrl || '',
        images: editingProduct.value.images || [], // Save multiple images
        category: editingProduct.value.category,
        collection: editingProduct.value.collection || '',
        isTesting: editingProduct.value.isTesting || false,
        isDefault: editingProduct.value.isDefault || false,
        pricing,
      };

      try {
        // If setting this product as default, unset all other products' default flag
        if (product.isDefault) {
          for (const p of products.value) {
            if (p.id && p.isDefault && (editingProduct.value.index < 0 || p.id !== products.value[editingProduct.value.index]?.id)) {
              await firebaseService.updateProduct(p.id, { ...p, isDefault: false });
              p.isDefault = false;
            }
          }
        }

        if (editingProduct.value.index >= 0) {
          // Update existing
          const existingProduct = products.value[editingProduct.value.index];
          await firebaseService.updateProduct(existingProduct.id, product);
          // Update the product in the array, preserving all fields including images
          const updatedProduct = {
            ...product,
            id: existingProduct.id,
            imageUrl: product.imageUrl || existingProduct.imageUrl || '',
            images: product.images || existingProduct.images || [],
          };
          products.value[editingProduct.value.index] = updatedProduct;
          safeNotify({
            type: 'positive',
            message: 'Product updated',
            position: 'top',
          });
        } else {
          // Add new
          const id = await firebaseService.addProduct(product);
          const newProduct = { 
            ...product, 
            id,
            imageUrl: product.imageUrl || '',
            images: product.images || [],
          };
          products.value.push(newProduct);
          safeNotify({
            type: 'positive',
            message: 'Product added',
            position: 'top',
          });
        }
        // Clear the editing form
        editingProduct.value = null;
        imageFile.value = null;
        // Force reactivity update
        await nextTick();
      } catch (error) {
        console.error('Error saving product:', error);
        safeNotify({
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
        safeNotify({
          type: 'positive',
          message: 'Product deleted',
          position: 'top',
        });
      } catch (error) {
        console.error('Error deleting product:', error);
        safeNotify({
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
        safeNotify({
          type: 'info',
          message: 'Pricing tier removed',
          position: 'top',
        });
      } else {
        safeNotify({
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
      bulkEditingProduct,
      bulkImageFiles,
      uploadingBulkImages,
      bulkPricingEntries,
      shippingOptions,
      shippingOptionDialog,
      editingShippingOption,
      shippingOptionIndex,
      shippingDeleteDialog,
      addProduct,
      bulkAddProducts,
      editProduct,
      cancelEdit,
      cancelBulkEdit,
      saveProduct,
      saveBulkProducts,
      confirmDelete,
      deleteProduct,
      addPricingTier,
      removePricing,
      updateQuantity,
      updatePrice,
      handleMultipleImageSelect,
      removeImageAtIndex,
      imageFiles,
      handleImageSelect,
      removeImage,
      handleBulkImageSelect,
      getImagePreview,
      removeBulkImage,
      addBulkPricingTier,
      removeBulkPricing,
      updateBulkQuantity,
      updateBulkPrice,
      addShippingOption,
      editShippingOption,
      closeShippingOptionDialog,
      saveShippingOptionChanges,
      confirmShippingDelete,
      deleteShippingOption,
      resetShippingOptions,
      activeCategory,
      filteredProducts,
      productsByCollection,
      getCategoryLabel,
      getCategoryColor,
      collectionOptions,
      createCollection,
      customVisible,
      designerVisible,
      specialtyVisible,
      updateVisibility,
    };
  },
};
</script>

<style scoped>
.pricing-page-container-full {
  max-width: 100%;
  padding: 0;
  margin: 0;
  width: 100%;
}

.pricing-page {
  max-width: 100%;
}

.product-item {
  padding: 16px;
  min-height: 100px;
}

.product-item img {
  object-fit: cover;
  width: 100%;
  height: 100%;
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

.product-image-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.product-image-wrapper .product-preview-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  aspect-ratio: 1 / 1; /* Force square aspect ratio */
}

.product-image-wrapper .remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.9);
}

.product-list-slideshow {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.shipping-option-item {
  padding: 12px 16px;
}

.bulk-image-preview {
  position: relative;
  width: 100%;
  padding-top: 100%; /* Square aspect ratio */
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.bulk-preview-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bulk-remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
}
</style>
