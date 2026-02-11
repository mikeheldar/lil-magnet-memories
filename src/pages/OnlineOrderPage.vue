<template>
  <q-page class="row justify-center">
    <div class="col-12 col-md-8 col-lg-6 q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <div class="text-h5 text-grey-7">Online Order Magnet Creation</div>
        <div class="text-body1 text-grey-6 q-mt-sm">
          Create custom magnets for home delivery
        </div>

        <!-- Login Section for Non-Authenticated Users -->
        <div v-if="!isAuthenticated" class="q-mb-lg">
          <q-card class="q-pa-md bg-blue-1">
            <q-card-section class="text-center">
              <div class="text-h6 q-mb-sm text-primary">
                <q-icon name="login" class="q-mr-sm" />
                Already have an account?
              </div>
              <div class="text-body2 q-mb-md text-grey-7">
                Sign in to track your orders and get faster service
              </div>
              <q-btn
                @click="handleGoogleSignIn"
                color="primary"
                size="lg"
                class="q-px-xl q-py-md"
                :loading="signingIn"
                :disable="signingIn"
              >
                <q-icon name="login" class="q-mr-sm" />
                {{ signingIn ? 'Signing in...' : 'Sign in with Google' }}
              </q-btn>

              <!-- Help text for popup blockers -->
              <div class="text-caption text-grey-6 q-mt-sm text-center">
                <q-icon name="info" size="14px" class="q-mr-xs" />
                If sign-in hangs, check that popups are allowed for this site
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- User Info Pre-fill Notice for Authenticated Users -->
        <div v-if="isAuthenticated" class="q-mb-md">
          <q-card class="q-pa-sm bg-green-1">
            <q-card-section class="text-center">
              <q-icon name="check_circle" color="positive" class="q-mr-sm" />
              <span class="text-positive text-weight-medium">
                Signed in as
                {{ currentUser?.displayName || currentUser?.email }}
              </span>
              <span class="text-grey-7 q-ml-sm">
                - Your information will be saved and you can track your orders
              </span>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Upload Form Card -->
      <q-card class="q-pa-lg">
        <q-card-section>
          <div class="text-h5 text-weight-medium q-mb-md text-center">
            <q-icon
              name="camera_alt"
              size="32px"
              class="q-mr-sm text-primary"
            />
            Photo Upload Form
          </div>

          <q-form @submit.prevent.stop="onSubmit" class="q-gutter-md">
            <!-- Customer Information -->
            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="person" class="q-mr-sm" />
              Your Information
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.firstName"
                  label="First Name *"
                  filled
                  ref="firstNameInput"
                  :rules="[(val) => !!val || 'First name is required']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.lastName"
                  label="Last Name *"
                  filled
                  ref="lastNameInput"
                  :rules="[(val) => !!val || 'Last name is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.email"
                  label="Email Address *"
                  type="email"
                  filled
                  ref="emailInput"
                  :rules="[
                    (val) => !!val || 'Email is required',
                    (val) => isValidEmail(val) || 'Please enter a valid email',
                  ]"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.phone"
                  label="Phone Number"
                  filled
                  mask="(###) ###-####"
                />
              </div>
            </div>

            <!-- Product Selection -->
            <q-separator class="q-my-md" />

            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="inventory_2" class="q-mr-sm" />
              Product Selection
            </div>

            <!-- Current Product Display as Label -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm text-weight-medium">
                Selected Product
              </div>
              <div v-if="selectedProduct" class="q-mb-sm">
                <div class="text-h6 text-weight-bold text-primary">
                  Selected Product: {{ selectedProduct.description }}
                  <q-chip v-if="selectedProduct.isDefault" color="green" text-color="white" size="sm" icon="star" class="q-ml-sm">
                    Default
                  </q-chip>
                </div>
                <div class="text-caption text-grey-7 q-mt-xs">
                  <div
                    v-for="(price, qty) in selectedProduct.pricing"
                    :key="qty"
                  >
                    {{ qty }}x for ${{ Number(price).toFixed(2) }}
                  </div>
                </div>
              </div>
              <div v-else class="text-body2 text-grey-6">
                No product selected
              </div>
            </div>
            
            <!-- Product Selector Dropdown -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm text-weight-medium">
                {{ selectedProduct ? 'Change Product' : 'Select Product' }} <span class="text-negative">*</span>
              </div>
              <q-select
                v-model="selectedProductId"
                :options="productOptions"
                option-label="description"
                option-value="id"
                emit-value
                map-options
                :label="selectedProduct ? 'Choose a different product' : 'Select a product'"
                filled
                :rules="[(val) => !!val || 'Please select a product']"
                :loading="loadingProducts"
                @update:model-value="onProductChange"
                :disable="loadingProducts || !productOptions || productOptions.length === 0"
              >
                <template v-slot:option="scope">
                  <q-item 
                    v-bind="scope.itemProps" 
                    v-if="scope && scope.opt && scope.opt.id && scope.opt.description"
                  >
                    <q-item-section>
                      <q-item-label>{{ scope.opt.description }}</q-item-label>
                      <q-item-label caption v-if="scope.opt.pricing && typeof scope.opt.pricing === 'object'">
                        <div
                          v-for="(price, qty) in scope.opt.pricing"
                          :key="String(qty)"
                          class="text-caption"
                        >
                          {{ qty }}x for ${{ Number(price).toFixed(2) }}
                        </div>
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="scope.opt.isDefault">
                      <q-chip color="green" text-color="white" size="sm" icon="star">
                        Default
                      </q-chip>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>

            <!-- Photo Upload Section -->
            <q-separator class="q-my-md" />

            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="photo_library" class="q-mr-sm" />
              Your Photos
            </div>

            <div class="text-body2 text-grey-7 q-mb-md">
              Upload your photos below. You can select multiple photos at once.
              We'll turn them into beautiful custom magnets!
            </div>

            <!-- File Upload -->
            <q-file
              v-model="selectedFiles"
              label="Choose Photos"
              filled
              multiple
              accept="image/*"
              @rejected="onRejected"
              @update:model-value="onFileSelected"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <!-- Selected Files Preview -->
            <div
              v-if="selectedFiles && selectedFiles.length > 0"
              class="q-mb-md"
            >
              <div class="text-subtitle2 q-mb-sm">
                Selected Photos ({{ selectedFiles.length }}):
              </div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="col-6 col-md-4 col-lg-3"
                >
                  <q-card class="q-pa-sm">
                    <!-- Square frame with centered photo -->
                    <div
                      class="square-photo-frame q-mb-sm"
                      style="
                        width: 100%;
                        aspect-ratio: 1;
                        position: relative;
                        overflow: hidden;
                        border: 2px solid #e0e0e0;
                        border-radius: 4px;
                        background: #f5f5f5;
                      "
                    >
                      <img
                        :src="getFilePreview(file)"
                        style="
                          position: absolute;
                          top: 50%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          width: 100%;
                          height: 100%;
                          object-fit: contain;
                        "
                        class="rounded-borders"
                      />
                    </div>
                    <div class="text-caption text-center q-mb-xs">
                      {{ file.name }}
                    </div>
                    <div class="text-center">
                      <div class="text-caption q-mb-xs">Quantity:</div>
                      <q-btn-group>
                        <q-btn
                          dense
                          size="sm"
                          icon="remove"
                          @click="decreaseQuantity(index)"
                          :disable="fileQuantities[index] <= 1"
                        />
                        <q-btn
                          dense
                          size="sm"
                          :label="fileQuantities[index]"
                          class="q-px-md"
                        />
                        <q-btn
                          dense
                          size="sm"
                          icon="add"
                          @click="increaseQuantity(index)"
                        />
                      </q-btn-group>
                    </div>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div v-if="totalMagnets > 0" class="q-mb-md">
              <q-card class="q-pa-md">
                <div class="text-h6 text-center text-primary">
                  <q-icon name="style" class="q-mr-sm" />
                  Total Magnets: {{ totalMagnets }}
                </div>
                <div v-if="totalCost.total > 0" class="q-mt-sm">
                  <div
                    v-if="totalCost.breakdown.length > 0"
                    class="text-center q-mb-xs"
                  >
                    <div
                      v-for="(item, index) in totalCost.breakdown"
                      :key="index"
                      class="text-caption text-grey-7"
                    >
                      {{ item.count }} × ({{ item.qty }} for ${{
                        (item.price / item.count).toFixed(2)
                      }})
                    </div>
                  </div>
                  <div class="text-h6 text-center text-primary q-mt-xs">
                    <q-icon name="attach_money" class="q-mr-sm" />
                    Total Cost: ${{ totalCost.total.toFixed(2) }}
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Special Instructions -->
            <q-input
              v-model="formData.specialInstructions"
              label="Special Instructions (Optional)"
              type="textarea"
              filled
              rows="3"
              placeholder="Any special requests for your magnets? Size preferences, color adjustments, etc."
            />

            <!-- Submit Button -->
            <div class="q-mt-lg text-center">
              <q-btn
                type="button"
                color="primary"
                :class="{ 'bg-grey-5': hasAddedToCart }"
                :disable="!canSubmit || hasAddedToCart"
                :loading="submitting"
                icon="add_shopping_cart"
                label="Add to Cart"
                size="lg"
                class="q-px-xl"
                @click.prevent.stop="handleAddToCart"
                @click="handleSubmitClick"
              />
            </div>

            <!-- Re-add Warning Dialog -->
            <q-dialog v-model="showReAddWarning">
              <q-card>
                <q-card-section class="row items-center q-pb-none">
                  <q-icon
                    name="warning"
                    color="warning"
                    size="32px"
                    class="q-mr-sm"
                  />
                  <span class="text-h6">Re-adding to Cart</span>
                </q-card-section>

                <q-card-section>
                  <div class="text-body1">
                    You've already added these items to your cart. Adding them
                    again will create duplicate items.
                  </div>
                  <div class="text-body2 text-grey-7 q-mt-sm">
                    Are you sure you want to add these items again?
                  </div>
                </q-card-section>

                <q-card-actions align="right">
                  <q-btn flat label="Cancel" color="primary" v-close-popup />
                  <q-btn
                    flat
                    label="Add Again"
                    color="primary"
                    @click="confirmReAdd"
                    v-close-popup
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useQuasar, useMeta } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { useCart } from '../composables/useCart.js';

export default {
  name: 'OnlineOrderPage',
  setup() {
    useMeta({
      title: 'Online Order - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Admin interface for managing online orders, processing payments, and tracking fulfillment.'
        },
        robots: {
          name: 'robots',
          content: 'noindex, nofollow'
        }
      }
    });

    const $q = useQuasar();
    const router = useRouter();
    const route = useRoute();
    const { addCustomUploadToCart } = useCart();

    // Safe notify helper to prevent errors when $q.notify is not available
    const safeNotify = (options) => {
      if ($q && typeof $q.notify === 'function') {
        $q.notify(options);
      } else {
        console.warn('Notify plugin unavailable', options);
      }
    };

    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialInstructions: '',
    });

    const selectedFiles = ref([]);
    const fileQuantities = ref([]);
    const submitting = ref(false);
    const products = ref([]);
    const selectedProductId = ref(null);
    const loadingProducts = ref(false);
    const hasAddedToCart = ref(false);
    const showReAddWarning = ref(false);
    
    // Product options for dropdown - ensure it's always an array with valid structure
    const productOptions = computed(() => {
      if (!products.value || !Array.isArray(products.value)) {
        return [];
      }
      return products.value
        .filter(p => {
          // Only include products that have all required fields
          return p && 
                 p.id && 
                 p.description && 
                 (p.category === 'custom' || (!p.category && (!p.productType || p.productType === 'custom')));
        })
        .map(p => {
          // Ensure all properties exist and are valid
          return {
            id: String(p.id || ''),
            description: String(p.description || 'Unknown Product'),
            pricing: p.pricing && typeof p.pricing === 'object' ? p.pricing : {},
            isDefault: Boolean(p.isDefault),
            category: p.category || null,
            productType: p.productType || null
          };
        })
        .filter(p => p.id && p.description); // Final safety check
    });
    
    // Get selected product object from ID
    const selectedProduct = computed(() => {
      if (!selectedProductId.value) {
        console.log('🔍 selectedProduct: No selectedProductId');
        return null;
      }
      
      // Try to find in productOptions first
      const foundInOptions = productOptions.value.find(p => {
        const match = String(p.id) === String(selectedProductId.value);
        if (!match && p.id) {
          console.log('🔍 Comparing:', String(p.id), 'vs', String(selectedProductId.value));
        }
        return match;
      });
      
      if (foundInOptions) {
        console.log('✅ selectedProduct: Found in productOptions:', foundInOptions.description);
        return foundInOptions;
      }
      
      // Fallback: try to find in original products array
      const foundInProducts = products.value.find(p => String(p.id) === String(selectedProductId.value));
      if (foundInProducts) {
        console.log('✅ selectedProduct: Found in products array:', foundInProducts.description);
        // Normalize it to match productOptions structure
        return {
          id: String(foundInProducts.id || ''),
          description: String(foundInProducts.description || 'Unknown Product'),
          pricing: foundInProducts.pricing && typeof foundInProducts.pricing === 'object' ? foundInProducts.pricing : {},
          isDefault: Boolean(foundInProducts.isDefault),
          category: foundInProducts.category || null,
          productType: foundInProducts.productType || null
        };
      }
      
      console.log('⚠️ selectedProduct: Not found! ID:', selectedProductId.value, 'Options count:', productOptions.value.length);
      return null;
    });

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const totalMagnets = computed(() => {
      return fileQuantities.value.reduce((sum, qty) => sum + qty, 0);
    });

    const totalCost = computed(() => {
      if (
        !selectedProduct.value ||
        !selectedProduct.value.pricing ||
        totalMagnets.value === 0
      ) {
        return { total: 0, breakdown: [] };
      }

      const pricing = selectedProduct.value.pricing;
      const totalQty = totalMagnets.value;

      // Sort tiers from largest to smallest
      const sortedTiers = Object.keys(pricing)
        .map(Number)
        .sort((a, b) => b - a);

      let remainingQty = totalQty;
      let totalCost = 0;
      const breakdown = [];

      // Use a greedy algorithm to find the best combination
      for (const tier of sortedTiers) {
        const count = Math.floor(remainingQty / tier);
        if (count > 0) {
          const tierPrice = pricing[tier] * count;
          totalCost += tierPrice;
          breakdown.push({ qty: tier, count, price: tierPrice });
          remainingQty -= tier * count;
        }
      }

      // Handle any remaining items with the smallest tier
      if (remainingQty > 0 && sortedTiers.length > 0) {
        const smallestTier = sortedTiers[sortedTiers.length - 1];
        const remainingPrice =
          (pricing[smallestTier] / smallestTier) * remainingQty;
        totalCost += remainingPrice;
        breakdown.push({ qty: remainingQty, count: 1, price: remainingPrice });
      }

      return { total: totalCost, breakdown };
    });

    const canSubmit = computed(() => {
      return (
        formData.value.firstName &&
        formData.value.lastName &&
        formData.value.email &&
        isValidEmail(formData.value.email) &&
        selectedFiles.value &&
        selectedFiles.value.length > 0 &&
        totalMagnets.value > 0
      );
    });

    // Refs for input fields
    const firstNameInput = ref(null);
    const lastNameInput = ref(null);
    const emailInput = ref(null);

    // Handle submit button click - show validation errors if disabled
    const handleSubmitClick = (event) => {
      if (!canSubmit.value) {
        event.preventDefault();
        event.stopPropagation();
        
        const missingFields = [];
        if (!formData.value.firstName) missingFields.push('First Name');
        if (!formData.value.lastName) missingFields.push('Last Name');
        if (!formData.value.email) {
          missingFields.push('Email');
        } else if (!isValidEmail(formData.value.email)) {
          missingFields.push('Valid Email');
        }
        
        if (missingFields.length > 0) {
          const message = `Please fill in: ${missingFields.join(', ')}`;
          $q.notify({
            type: 'warning',
            message: 'Required fields missing',
            caption: message,
            position: 'top',
            timeout: 4000,
          });
          
          // Scroll to first missing field
          setTimeout(() => {
            if (!formData.value.firstName && firstNameInput.value) {
              firstNameInput.value.$el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              firstNameInput.value.focus();
            } else if (!formData.value.lastName && lastNameInput.value) {
              lastNameInput.value.$el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              lastNameInput.value.focus();
            } else if ((!formData.value.email || !isValidEmail(formData.value.email)) && emailInput.value) {
              emailInput.value.$el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              emailInput.value.focus();
            }
          }, 100);
        }
      }
    };

    // Convert File to base64 for persistence across devices
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const getFilePreview = (file) => {
      // If file is already a base64 string or URL, return it
      if (typeof file === 'string') {
        return file;
      }
      // If file is a File object, create blob URL for preview
      return URL.createObjectURL(file);
    };

    const onRejected = () => {
      safeNotify({
        type: 'negative',
        message:
          'Some files were rejected. Please make sure they are image files.',
        caption: 'Accepted formats: JPG, PNG, GIF, WebP',
      });
    };

    const onFileSelected = (files) => {
      selectedFiles.value = files;
      // Initialize quantities to 1 for each file
      fileQuantities.value = files.map(() => 1);
      // Reset add to cart state when files change
      hasAddedToCart.value = false;
    };

    const increaseQuantity = (index) => {
      fileQuantities.value[index]++;
    };

    const decreaseQuantity = (index) => {
      if (fileQuantities.value[index] > 1) {
        fileQuantities.value[index]--;
      }
    };

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1);
      fileQuantities.value.splice(index, 1);
    };

    // Handler for when product selection changes
    const onProductChange = (newProductId) => {
      console.log('🔄 Product changed to:', newProductId);
      // Force reactivity update by accessing the computed property
      // This ensures totalCost recalculates with the new product pricing
      if (selectedProduct.value) {
        console.log('✅ Selected product updated:', selectedProduct.value.description);
        console.log('✅ New product pricing:', selectedProduct.value.pricing);
        // Force totalCost to recalculate by accessing it
        const _ = totalCost.value;
      }
    };

    const handleAddToCart = () => {
      if (hasAddedToCart.value) {
        // Show warning dialog if trying to add again
        showReAddWarning.value = true;
        return;
      }
      onSubmit();
    };

    const confirmReAdd = () => {
      // Reset the state and add again
      hasAddedToCart.value = false;
      onSubmit();
    };

    const onSubmit = async () => {
      // Save form data to localStorage for non-authenticated users
      saveFormDataToLocalStorage();
      
      // Upload photos to Firebase Storage first to get persistent URLs
      // This ensures images work across devices (base64 can be too large for Firestore)
      submitting.value = true;
      try {
        console.log('📤 Uploading photos to Firebase Storage for cart...');
        const uploadedPhotos = await firebaseService.uploadPhotos(selectedFiles.value);
        console.log('✅ Photos uploaded successfully:', uploadedPhotos.length);
        
        // Convert files to base64 for immediate preview, but prioritize Firebase URLs
        const photos = await Promise.all(
          uploadedPhotos.map(async (uploadedPhoto, index) => {
            const file = selectedFiles.value[index];
            let base64Preview = null;
            if (file) {
              try {
                base64Preview = await fileToBase64(file);
              } catch (error) {
                console.warn('Failed to convert file to base64 for preview:', error);
              }
            }
            return {
              name: uploadedPhoto.name,
              url: uploadedPhoto.url, // Persistent Firebase Storage URL (primary)
              preview: base64Preview || uploadedPhoto.url, // Base64 for immediate display, fallback to URL
              fileName: uploadedPhoto.fileName,
              size: uploadedPhoto.size,
              type: uploadedPhoto.type,
              quantity: fileQuantities.value[index],
            };
          })
        );

        submitting.value = false;

        addCustomUploadToCart({
        productName:
          selectedProduct.value?.description || 'Custom Photo Magnets',
        photos: photos,
        quantities: fileQuantities.value,
        specialInstructions: formData.value.specialInstructions,
        totalMagnets: totalMagnets.value,
        totalCost: totalCost.value,
        costBreakdown: totalCost.value.breakdown,
        pricing: selectedProduct.value?.pricing || {},
        formData: {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          email: formData.value.email,
          phone: formData.value.phone,
        },
      });

        // Mark as added to cart
        hasAddedToCart.value = true;

        // Show success notification and redirect to cart
        safeNotify({
          type: 'positive',
          message: 'Added to cart!',
          caption: `${totalMagnets.value} magnets added to your cart`,
          position: 'top',
          timeout: 3000,
        });

        // Navigate to cart
        try {
          await router.push('/cart');
        } catch (error) {
          console.error('Failed to navigate to cart:', error);
          safeNotify({
            type: 'warning',
            message: 'Added to cart, but navigation failed',
            caption: 'Please open the cart manually.',
            position: 'top',
            timeout: 4000,
          });
        }
      } catch (error) {
        console.error('❌ Error uploading photos for cart:', error);
        submitting.value = false;
        safeNotify({
          type: 'negative',
          message: 'Failed to upload photos',
          caption: error.message || 'Please try again',
          position: 'top',
        });
      }
    };

    // Authentication state
    const isAuthenticated = ref(false);
    const currentUser = ref(null);
    const signingIn = ref(false);

    const handleGoogleSignIn = async () => {
      // Check if popups are likely blocked
      const popupBlocked = checkPopupBlocked();
      if (popupBlocked) {
        safeNotify({
          type: 'warning',
          message: 'Popup blocked detected',
          caption: 'Please allow popups for this site and try again.',
          position: 'top',
          timeout: 5000,
        });
        return;
      }

      signingIn.value = true;

      // Shorter timeout for better UX
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
        console.log('Starting Google sign-in...');
        console.log('Current domain:', window.location.origin);

        await authService.signInWithGoogle();
        console.log('Google sign-in successful');

        safeNotify({
          type: 'positive',
          message: 'Successfully signed in!',
          caption: 'Your information has been filled automatically.',
          position: 'top',
        });
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

    // Helper function to detect popup blocking
    const checkPopupBlocked = () => {
      try {
        const popup = window.open('', '_blank', 'width=1,height=1');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          return true;
        }
        popup.close();
        return false;
      } catch (e) {
        return true;
      }
    };

    const fillFormWithUserData = (user) => {
      if (user) {
        // Fill name fields
        if (user.displayName) {
          const nameParts = user.displayName.split(' ');
          formData.value.firstName = nameParts[0] || '';
          formData.value.lastName = nameParts.slice(1).join(' ') || '';
        }

        // Fill email field
        if (user.email) {
          formData.value.email = user.email;
        }
      }
    };

    // Save form data to localStorage for non-authenticated users
    const saveFormDataToLocalStorage = () => {
      if (!isAuthenticated.value) {
        try {
          const dataToSave = {
            firstName: formData.value.firstName,
            lastName: formData.value.lastName,
            email: formData.value.email,
            phone: formData.value.phone,
          };
          localStorage.setItem('guestFormData', JSON.stringify(dataToSave));
        } catch (error) {
          console.error('Error saving form data to localStorage:', error);
        }
      }
    };

    // Load form data from localStorage for non-authenticated users
    const loadFormDataFromLocalStorage = () => {
      if (!isAuthenticated.value) {
        try {
          const savedData = localStorage.getItem('guestFormData');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.firstName) formData.value.firstName = parsed.firstName;
            if (parsed.lastName) formData.value.lastName = parsed.lastName;
            if (parsed.email) formData.value.email = parsed.email;
            if (parsed.phone) formData.value.phone = parsed.phone;
          }
        } catch (error) {
          console.error('Error loading form data from localStorage:', error);
        }
      }
    };

    const loadProducts = async (retryCount = 0) => {
      const maxRetries = 3;
      loadingProducts.value = true;
      try {
        // Non-admins should not see testing products
        const isAdmin = authService.isAdmin();
        const productsData = await firebaseService.getProducts(isAdmin);
        
        if (productsData && productsData.length > 0) {
          products.value = productsData;
          console.log(`✅ Loaded ${productsData.length} products on online order page`);
          
          // Determine which product to select
          let productToSelect = null;
          
          // First, check if productId is in route query (from landing page)
          if (route.query.productId) {
            productToSelect = products.value.find(p => p.id === route.query.productId);
            console.log('🔍 Found product from route query:', productToSelect?.description);
          }
          
          // If not found in route, check for default product
          if (!productToSelect) {
            productToSelect = products.value.find(p => p.isDefault === true);
            console.log('🔍 Found default product:', productToSelect?.description);
          }
          
          // If still not found, use first custom product
          if (!productToSelect) {
            productToSelect = products.value.find(
              (p) => p.category === 'custom' || (!p.category && (!p.productType || p.productType === 'custom'))
            );
          }
          
          // Set selected product after products are loaded
          // Use a small delay to ensure productOptions computed has updated
          await nextTick();
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (productToSelect) {
            // Set the product ID (q-select will handle the rest)
            selectedProductId.value = productToSelect.id;
            console.log('✅ Selected product ID:', productToSelect.id, productToSelect.description, productToSelect.isDefault ? '(default)' : '');
          } else {
            console.warn('⚠️ No product to select - no default product found and no route query productId');
          }
        } else {
          // If no products returned, retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.log(`⚠️ No products returned, retrying (${retryCount + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
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
          console.log(`⚠️ Error loading products, retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return loadProducts(retryCount + 1);
        } else {
          console.error('❌ Failed to load products after retries');
          products.value = [];
        }
      } finally {
        loadingProducts.value = false;
      }
    };

    onMounted(() => {
      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log(
          'User already authenticated on upload page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
        currentUser.value = currentAuthUser;
        fillFormWithUserData(currentAuthUser);
      } else {
        // Load saved form data from localStorage for non-authenticated users
        loadFormDataFromLocalStorage();
      }

      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user;
        currentUser.value = user;

        // Pre-fill form data if user is authenticated
        if (user) {
          fillFormWithUserData(user);
        } else {
          // Load saved form data from localStorage when user signs out
          loadFormDataFromLocalStorage();
        }
      });

      // Load products
      // Load products with retry logic
      loadProducts().catch(err => {
        console.error('Failed to load products:', err);
      });
      
      // Watch selectedProductId to ensure totalCost updates when product changes
      watch(selectedProductId, (newId, oldId) => {
        if (newId !== oldId && newId) {
          console.log('🔄 Product ID changed from', oldId, 'to', newId);
          // Force reactivity update - access totalCost to trigger recalculation
          if (selectedProduct.value) {
            console.log('✅ Product changed, totalCost will recalculate for:', selectedProduct.value.description);
            console.log('✅ New pricing:', selectedProduct.value.pricing);
            // Force totalCost computed to recalculate
            const _ = totalCost.value;
          }
        }
      });
      
      // Also watch selectedProduct directly to ensure totalCost updates
      watch(selectedProduct, (newProduct, oldProduct) => {
        if (newProduct && newProduct !== oldProduct) {
          console.log('🔄 Selected product object changed, recalculating total cost');
          // Force totalCost to recalculate
          const _ = totalCost.value;
        }
      }, { deep: true });
      
      // Watch productOptions to sync selectedProductId when options change
      watch(productOptions, (newOptions) => {
        if (newOptions.length > 0) {
          // If product ID is set, verify it still exists in options
          if (selectedProductId.value) {
            const stillExists = newOptions.find(p => p.id === selectedProductId.value);
            if (!stillExists) {
              // Selected product no longer in options, reset
              selectedProductId.value = null;
              console.log('⚠️ Watched: Selected product no longer available, resetting');
            }
          }
          
          // If no product selected, try to set default
          if (!selectedProductId.value) {
            const defaultProduct = newOptions.find(p => p.isDefault === true);
            if (defaultProduct) {
              selectedProductId.value = defaultProduct.id;
              console.log('✅ Watched: Set default product:', defaultProduct.description);
            } else if (route.query.productId) {
              const routeProduct = newOptions.find(p => p.id === route.query.productId);
              if (routeProduct) {
                selectedProductId.value = routeProduct.id;
                console.log('✅ Watched: Set route product:', routeProduct.description);
              }
            } else if (newOptions.length > 0) {
              selectedProductId.value = newOptions[0].id;
              console.log('✅ Watched: Set first product:', newOptions[0].description);
            }
          }
        }
      }, { immediate: true });
    });

    return {
      formData,
      selectedFiles,
      fileQuantities,
      submitting,
      canSubmit,
      totalMagnets,
      totalCost,
      selectedProduct,
      productOptions,
      selectedProductId,
      loadingProducts,
      isAuthenticated,
      currentUser,
      signingIn,
      hasAddedToCart,
      showReAddWarning,
      isValidEmail,
      getFilePreview,
      onRejected,
      onFileSelected,
      onProductChange,
      increaseQuantity,
      decreaseQuantity,
      removeFile,
      onSubmit,
      handleAddToCart,
      confirmReAdd,
      handleGoogleSignIn,
      handleSubmitClick,
      firstNameInput,
      lastNameInput,
      emailInput,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .text-h3 {
    font-size: 1.8rem;
  }

  .text-h5 {
    font-size: 1.3rem;
  }

  .q-btn {
    font-size: 14px;
  }
}
</style>
