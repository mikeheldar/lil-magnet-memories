<template>
  <q-page class="row justify-center">
    <div class="col-12 col-md-8 col-lg-6 q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <div class="text-h5 text-grey-7">
          Online Order Magnet Creation
        </div>
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

          <q-form @submit="onSubmit" class="q-gutter-md">
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
                    <img
                      :src="getFilePreview(file)"
                      style="height: 100px; width: 100%; object-fit: cover"
                      class="rounded-borders q-mb-sm"
                    />
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
                <div v-if="totalCost > 0" class="text-h6 text-center text-primary q-mt-sm">
                  <q-icon name="attach_money" class="q-mr-sm" />
                  Total Cost: ${{ totalCost.toFixed(2) }}
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
            <div class="text-center q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                size="lg"
                :loading="submitting"
                :disable="!canSubmit"
                class="q-px-xl"
              >
                <q-icon name="send" class="q-mr-sm" />
                Submit Photos for Magnet Creation
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Order Summary Dialog -->
      <q-dialog v-model="showOrderSummary" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center">
            <q-avatar icon="assignment" color="primary" text-color="white" />
            <span class="q-ml-sm text-h6">Order Summary</span>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-h6 text-primary">Order #{{ orderNumber }}</div>
              <div class="text-caption text-grey-6">
                {{ formatDate(new Date()) }}
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium">
                Customer Information
              </div>
              <div>
                <strong>Name:</strong> {{ formData.firstName }}
                {{ formData.lastName }}
              </div>
              <div><strong>Email:</strong> {{ formData.email }}</div>
              <div v-if="formData.phone">
                <strong>Phone:</strong> {{ formData.phone }}
              </div>
              <div v-if="formData.specialInstructions">
                <strong>Special Instructions:</strong>
                <div class="text-grey-7 q-mt-xs">
                  {{ formData.specialInstructions }}
                </div>
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium">Order Details</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="col-6"
                >
                  <q-img
                    :src="getFilePreview(file)"
                    style="height: 60px"
                    class="rounded-borders q-mb-xs"
                  />
                  <div class="text-caption">{{ file.name }}</div>
                  <div class="text-caption text-primary">
                    <q-icon name="style" size="12px" class="q-mr-xs" />
                    {{ fileQuantities[index] }} magnet{{
                      fileQuantities[index] > 1 ? 's' : ''
                    }}
                  </div>
                </div>
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <div class="text-center">
              <div class="text-h6 text-primary">
                <q-icon name="style" class="q-mr-sm" />
                Total: {{ totalMagnets }} Magnets
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="showOrderSummary = false"
            />
            <q-btn
              label="Confirm Order"
              color="primary"
              @click="confirmOrder"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Information Card -->
      <q-card class="q-mt-md q-pa-md bg-grey-1">
        <q-card-section>
          <div class="text-h6 text-weight-medium q-mb-sm text-primary">
            <q-icon name="info" class="q-mr-sm" />
            What Happens Next?
          </div>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >We'll review your photos and contact you within 24
                  hours</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >We'll provide a quote and timeline for your custom
                  magnets</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                  >Once approved, we'll create your beautiful custom
                  magnets!</q-item-label
                >
              </q-item-section>
            </q-item>
          </q-list>
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

export default {
  name: 'OnlineOrderPage',
  setup() {
    const $q = useQuasar();
    const router = useRouter();

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
    const showOrderSummary = ref(false);
    const orderNumber = ref('');
    const products = ref([]);
    const selectedProduct = ref(null);

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const totalMagnets = computed(() => {
      return fileQuantities.value.reduce((sum, qty) => sum + qty, 0);
    });

    const totalCost = computed(() => {
      if (!selectedProduct.value || !selectedProduct.value.pricing || totalMagnets.value === 0) {
        return 0;
      }

      const pricing = selectedProduct.value.pricing;
      const totalQty = totalMagnets.value;

      // Find the best pricing tier
      const sortedTiers = Object.keys(pricing)
        .map(Number)
        .sort((a, b) => b - a);

      // Find the highest tier that applies
      for (const tier of sortedTiers) {
        if (totalQty >= tier) {
          const pricePerUnit = pricing[tier] / tier;
          return pricePerUnit * totalQty;
        }
      }

      // If no tier matches, use the lowest tier
      const lowestTier = Math.min(...Object.keys(pricing).map(Number));
      const pricePerUnit = pricing[lowestTier] / lowestTier;
      return pricePerUnit * totalQty;
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
      $q.notify({
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

    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const time = now.getTime().toString().slice(-4);
      return `LMM-${year}${month}${day}-${time}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString();
    };

    const confirmOrder = async () => {
      showOrderSummary.value = false;
      submitting.value = true;

      try {
        // Prepare customer data
        const customerData = {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          email: formData.value.email,
          phone: formData.value.phone,
          specialInstructions: formData.value.specialInstructions,
          photos: selectedFiles.value,
          quantities: fileQuantities.value,
          orderNumber: orderNumber.value,
          totalMagnets: totalMagnets.value,
          userId: currentUser.value?.uid || null,
        };

        console.log('Submitting order with userId:', customerData.userId);
        console.log('Current user:', currentUser.value);
        console.log('Customer data:', customerData);

        let savedOrder = null;

        // Save to Firebase
        try {
          console.log('Attempting to save order to Firebase...');
          savedOrder = await firebaseService.saveOrder(customerData);
          console.log('Order saved to Firebase successfully:', savedOrder);
        } catch (error) {
          console.error('Firebase save failed:', error);
          throw error; // Re-throw to show error to user
        }

        // Prepare order data for thank you page
        const orderData = {
          orderNumber: orderNumber.value,
          customerName: `${formData.value.firstName} ${formData.value.lastName}`,
          customerEmail: formData.value.email,
          totalMagnets: totalMagnets.value,
        };

        // Store in localStorage as backup
        localStorage.setItem('lastOrderData', JSON.stringify(orderData));

        // Reset form
        formData.value = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          specialInstructions: '',
        };
        selectedFiles.value = [];
        fileQuantities.value = [];

        // Show success notification
        try {
          if (typeof $q !== 'undefined' && $q.notify) {
            $q.notify({
              type: 'positive',
              message: 'Order submitted successfully!',
              caption:
                'Your order has been saved and we will contact you soon.',
              position: 'top',
            });
          }
        } catch (notifyError) {
          console.log('Notification error (non-critical):', notifyError);
        }

        // Redirect to thank you page with order details
        try {
          router.push({
            path: '/thank-you',
            query: orderData,
          });
        } catch (routerError) {
          console.error('Router error:', routerError);
          // Fallback: redirect using window.location
          const queryString = new URLSearchParams(orderData).toString();
          window.location.href = `/thank-you?${queryString}`;
        }
      } catch (error) {
        console.error('Order submission error:', error);
        // Only show notification if $q is available
        if (typeof $q !== 'undefined' && $q.notify) {
          $q.notify({
            type: 'negative',
            message: 'Failed to submit order',
            caption: 'Please try again or contact us directly.',
            position: 'top',
          });
        }
      } finally {
        submitting.value = false;
      }
    };

    const onSubmit = () => {
      // Generate order number and show summary dialog
      orderNumber.value = generateOrderNumber();
      showOrderSummary.value = true;
    };

    // Authentication state
    const isAuthenticated = ref(false);
    const currentUser = ref(null);
    const signingIn = ref(false);

    const handleGoogleSignIn = async () => {
      // Check if popups are likely blocked
      const popupBlocked = checkPopupBlocked();
      if (popupBlocked) {
        $q.notify({
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
          $q.notify({
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

        $q.notify({
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

        $q.notify({
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

    const loadProducts = async () => {
      try {
        const productsData = await firebaseService.getProducts();
        products.value = productsData || [];
        // Select the first custom product by default
        if (products.value.length > 0) {
          const customProduct = products.value.find(p => !p.productType || p.productType === 'custom');
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
      showOrderSummary,
      orderNumber,
      isAuthenticated,
      currentUser,
      signingIn,
      isValidEmail,
      getFilePreview,
      onRejected,
      onFileSelected,
      increaseQuantity,
      decreaseQuantity,
      removeFile,
      generateOrderNumber,
      formatDate,
      confirmOrder,
      onSubmit,
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
