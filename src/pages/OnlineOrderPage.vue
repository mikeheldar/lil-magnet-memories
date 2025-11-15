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
                  :rules="[(val) => !!val || 'First name is required']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.lastName"
                  label="Last Name *"
                  filled
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
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { useCart } from '../composables/useCart.js';

export default {
  name: 'OnlineOrderPage',
  setup() {
    const $q = useQuasar();
    const router = useRouter();
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
    const selectedProduct = ref(null);
    const hasAddedToCart = ref(false);
    const showReAddWarning = ref(false);

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

    const getFilePreview = (file) => {
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
      // Add to cart instead of submitting order
      const photos = selectedFiles.value.map((file, index) => ({
        name: file.name,
        preview: getFilePreview(file),
        quantity: fileQuantities.value[index],
      }));

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

    const goToCheckout = async () => {
      try {
        await router.push('/checkout');
      } catch (error) {
        console.error('Failed to navigate to checkout:', error);
      }
    };

    const loadProducts = async () => {
      try {
        const productsData = await firebaseService.getProducts();
        products.value = productsData || [];
        // Select the first custom product by default
        if (products.value.length > 0) {
          const customProduct = products.value.find(
            (p) => !p.productType || p.productType === 'custom'
          );
          if (customProduct) {
            selectedProduct.value = customProduct;
          }
        }
      } catch (error) {
        console.error('Error loading products:', error);
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
      }

      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user;
        currentUser.value = user;

        // Pre-fill form data if user is authenticated
        if (user) {
          fillFormWithUserData(user);
        }
      });

      // Load products
      loadProducts();
    });

    return {
      formData,
      selectedFiles,
      fileQuantities,
      submitting,
      canSubmit,
      totalMagnets,
      totalCost,
      isAuthenticated,
      currentUser,
      signingIn,
      hasAddedToCart,
      showReAddWarning,
      isValidEmail,
      getFilePreview,
      onRejected,
      onFileSelected,
      increaseQuantity,
      decreaseQuantity,
      removeFile,
      onSubmit,
      handleAddToCart,
      confirmReAdd,
      handleGoogleSignIn,
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
