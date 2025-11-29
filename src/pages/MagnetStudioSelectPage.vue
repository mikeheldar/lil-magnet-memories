<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        <q-icon name="apps" class="q-mr-sm" />
        Magnet Studio - Select Photo
      </div>
      <div class="text-caption text-grey-7 q-mt-sm">
        Select one photo from existing orders or upload a new one to crop into squares
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-md text-body1">Loading photos...</div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Search and Upload Section -->
      <div class="q-mb-md">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-8">
            <q-input
              v-model="searchQuery"
              filled
              placeholder="Search by order number, customer name, or photo name..."
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-md-4">
            <q-file
              v-model="uploadFiles"
              label="Upload New Photo"
              accept="image/*"
              filled
              @update:model-value="onFilesSelected"
            >
              <template v-slot:prepend>
                <q-icon name="cloud_upload" />
              </template>
            </q-file>
          </div>
        </div>

        <div class="text-body2 text-grey-7 q-mb-sm">
          Found {{ filteredPhotos.length }} photos from orders
          <span v-if="uploadedPhoto">
            • 1 uploaded photo
          </span>
          <span v-if="displayedPhotos.length < filteredPhotos.length">
            • Showing {{ displayedPhotos.length }} of {{ filteredPhotos.length }}
          </span>
        </div>
      </div>

      <!-- Combined Photo Grid: Orders + Uploaded -->
      <div class="row q-col-gutter-md">
        <!-- Photos from Orders -->
        <div
          v-for="(photo, index) in displayedPhotos"
          :key="`order-${photo.orderId}-${index}`"
          class="col-4 col-sm-3 col-md-2 col-lg-1"
        >
          <q-card
            :class="{ 'selected-photo': isOrderPhotoSelected(photo, index) }"
            class="photo-card cursor-pointer"
            @click="selectOrderPhoto(photo, index)"
          >
            <q-img
              :src="getPhotoUrl(photo)"
              ratio="1"
              class="photo-thumbnail"
              @error="handleImageError($event, photo)"
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                  <q-icon name="broken_image" size="24px" />
                </div>
              </template>
              <div
                v-if="isOrderPhotoSelected(photo, index)"
                class="absolute-top-right q-ma-xs"
              >
                <q-icon name="check_circle" size="32px" color="white" style="text-shadow: 0 0 4px rgba(0,0,0,0.8);" />
              </div>
            </q-img>
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-truncate text-center" :title="photo.name" style="font-size: 0.7rem;">
                {{ photo.name }}
              </div>
              <div class="text-caption text-grey-6 text-center q-mt-xs" style="font-size: 0.65rem;">
                Order #{{ photo.orderNumber }}
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Uploaded Photo -->
        <div
          v-if="uploadedPhoto"
          class="col-4 col-sm-3 col-md-2 col-lg-1"
        >
          <q-card
            :class="{ 'selected-photo': isUploadedPhotoSelected }"
            class="photo-card cursor-pointer"
            @click="selectUploadedPhoto"
          >
            <q-img
              :src="uploadedPhoto.preview"
              ratio="1"
              class="photo-thumbnail"
            >
              <div
                v-if="isUploadedPhotoSelected"
                class="absolute-top-right q-ma-xs"
              >
                <q-icon name="check_circle" size="32px" color="white" style="text-shadow: 0 0 4px rgba(0,0,0,0.8);" />
              </div>
            </q-img>
            <q-card-section class="q-pa-xs">
              <div class="text-caption text-truncate text-center" :title="uploadedPhoto.name" style="font-size: 0.7rem;">
                {{ uploadedPhoto.name }}
              </div>
              <div class="text-caption text-grey-6 text-center q-mt-xs" style="font-size: 0.65rem;">
                New Upload
              </div>
            </q-card-section>
            <q-card-actions class="q-pa-xs">
              <q-btn
                flat
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="removeUploadedPhoto"
                class="full-width"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMorePhotos" class="text-center q-mt-md">
        <q-btn
          color="primary"
          outline
          label="Load More Photos"
          icon="expand_more"
          @click="loadMorePhotos"
        />
      </div>

      <div v-if="filteredPhotos.length === 0 && !uploadedPhoto" class="text-center q-pa-xl">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">No photos available</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Upload a photo or search for photos from existing orders
        </div>
      </div>

      <!-- Continue Button -->
      <q-card v-if="selectedPhoto" class="q-mt-lg sticky-bottom">
        <!-- Debug info -->
        <div v-if="false" style="display: none;">
          selectedPhoto: {{ selectedPhoto }}
          selectedUploadedPhoto: {{ selectedUploadedPhoto }}
          uploadedPhoto: {{ uploadedPhoto }}
        </div>
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="col">
              <div class="text-h6">
                Photo Selected
              </div>
              <div class="text-caption text-grey-7">
                Ready to proceed to crop settings
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                ref="continueButton"
                color="primary"
                icon="arrow_forward"
                label="Continue to Crop Settings"
                @click.stop.prevent="handleContinueClick"
                @mousedown="() => console.log('🖱️ Mouse down on button')"
                @mouseup="() => console.log('🖱️ Mouse up on button')"
                :loading="uploading"
                :disable="uploading"
                size="lg"
                style="z-index: 1000; position: relative; cursor: pointer;"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'MagnetStudioSelectPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    // Helper function to safely show notifications
    const safeNotify = (options) => {
      try {
        if ($q && $q.notify && typeof $q.notify === 'function') {
          $q.notify(options);
        } else {
          console.warn('Notification not available:', options);
        }
      } catch (e) {
        console.warn('Could not show notification:', e, options);
      }
    };

    const loading = ref(true);
    const searchQuery = ref('');
    const allPhotos = ref([]);
    const displayedPhotosCount = ref(9); // Start with 9 photos
    const selectedOrderPhoto = ref(null); // { photo, index, orderId, orderNumber }
    const selectedUploadedPhoto = ref(false);
    const uploadFiles = ref([]);
    const uploadedPhoto = ref(null);
    const uploading = ref(false);
    const continueButton = ref(null);

    // Load all photos from orders
    const loadAllPhotos = async () => {
      loading.value = true;
      console.log('🔄 Starting to load photos...');
      try {
        const orders = await firebaseService.getOrders();
        console.log(`📦 Loaded ${orders.length} orders from Firebase`);
        const photos = [];

        orders.forEach((order) => {
          // Handle legacy photo-based orders
          if (order.photos && order.photos.length > 0) {
            console.log(`📸 Order ${order.orderNumber} has ${order.photos.length} photos in photos array`);
            order.photos.forEach((photo, index) => {
              photos.push({
                ...photo,
                orderId: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customer
                  ? `${order.customer.firstName} ${order.customer.lastName}`
                  : 'Unknown',
                index,
              });
            });
          }

          // Handle cart-based orders
          if (order.cartItems && order.cartItems.length > 0) {
            order.cartItems.forEach((item) => {
              if (item.isCustomUpload && item.photos) {
                console.log(`📸 Order ${order.orderNumber} has ${item.photos.length} photos in cartItems`);
                item.photos.forEach((photo, index) => {
                  photos.push({
                    ...photo,
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    customerName: order.customer
                      ? `${order.customer.firstName} ${order.customer.lastName}`
                      : 'Unknown',
                    index,
                  });
                });
              }
            });
          }
        });

        allPhotos.value = photos;
        console.log(`✅ Loaded ${photos.length} photos from ${orders.length} orders`);
        if (photos.length > 0) {
          console.log('Sample photo:', photos[0]);
          console.log('Sample photo URL:', photos[0].url || photos[0].preview);
        } else {
          console.warn('⚠️ No photos found in any orders');
        }
      } catch (error) {
        console.error('❌ Error loading photos:', error);
        console.error('Error stack:', error.stack);
        safeNotify({
          type: 'negative',
          message: 'Failed to load photos',
          caption: error.message,
        });
      } finally {
        loading.value = false;
        console.log('✅ Photo loading complete, loading set to false');
      }
    };

    // Filter photos based on search query
    const filteredPhotos = computed(() => {
      let photos = allPhotos.value;
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        photos = photos.filter((photo) => {
          return (
            photo.name?.toLowerCase().includes(query) ||
            photo.orderNumber?.toLowerCase().includes(query) ||
            photo.customerName?.toLowerCase().includes(query)
          );
        });
      }
      
      return photos;
    });

    // Get displayed photos (paginated)
    const displayedPhotos = computed(() => {
      return filteredPhotos.value.slice(0, displayedPhotosCount.value);
    });

    // Check if there are more photos to load
    const hasMorePhotos = computed(() => {
      return displayedPhotosCount.value < filteredPhotos.value.length;
    });

    // Load more photos
    const loadMorePhotos = () => {
      displayedPhotosCount.value += 9;
    };

    // Get photo URL
    const getPhotoUrl = (photo) => {
      if (!photo) return '';
      if (photo.url && photo.url.startsWith('http')) {
        return photo.url;
      }
      if (photo.preview && !photo.preview.startsWith('blob:')) {
        return photo.preview;
      }
      return photo.url || photo.preview || '';
    };

    // Handle image errors
    const handleImageError = (event, photo) => {
      console.warn('Failed to load photo:', photo.name, photo.url);
    };

    // Check if order photo is selected
    const isOrderPhotoSelected = (photo, index) => {
      return selectedOrderPhoto.value?.orderId === photo.orderId && selectedOrderPhoto.value?.index === index;
    };

    // Select order photo (deselects uploaded photo)
    const selectOrderPhoto = (photo, index) => {
      selectedOrderPhoto.value = {
        photo,
        index,
        orderId: photo.orderId,
        orderNumber: photo.orderNumber,
      };
      selectedUploadedPhoto.value = false;
    };

    // Check if uploaded photo is selected
    const isUploadedPhotoSelected = computed(() => {
      return selectedUploadedPhoto.value && uploadedPhoto.value !== null;
    });

    // Select uploaded photo (deselects order photo)
    const selectUploadedPhoto = () => {
      if (uploadedPhoto.value) {
        selectedUploadedPhoto.value = true;
        selectedOrderPhoto.value = null;
      }
    };

    // Handle file selection for upload
    const onFilesSelected = async (files) => {
      if (!files || files.length === 0) {
        uploadedPhoto.value = null;
        selectedUploadedPhoto.value = false;
        return;
      }

      // Only take the first file
      const file = Array.isArray(files) ? files[0] : files;
      uploadedPhoto.value = {
        name: file.name,
        preview: URL.createObjectURL(file),
        file: file, // Keep file reference for upload
      };
      selectedUploadedPhoto.value = true;
      selectedOrderPhoto.value = null;
    };

    // Remove uploaded photo
    const removeUploadedPhoto = () => {
      uploadedPhoto.value = null;
      selectedUploadedPhoto.value = false;
    };

    // Get selected photo (for display and navigation)
    const selectedPhoto = computed(() => {
      if (selectedOrderPhoto.value) {
        return selectedOrderPhoto.value.photo;
      }
      if (selectedUploadedPhoto.value && uploadedPhoto.value) {
        return uploadedPhoto.value;
      }
      return null;
    });

    // Wrapper to test if click is being registered
    const handleContinueClick = (event) => {
      // Immediate log - this should fire first
      console.log('🖱️🖱️🖱️ BUTTON CLICKED! 🖱️🖱️🖱️', event);
      console.log('Event type:', event?.type);
      console.log('Event target:', event?.target);
      console.log('📸 selectedPhoto.value:', selectedPhoto.value);
      console.log('📤 selectedUploadedPhoto.value:', selectedUploadedPhoto.value);
      console.log('📁 uploadedPhoto.value:', uploadedPhoto.value);
      console.log('⏳ uploading.value:', uploading.value);
      
      // Prevent if already uploading
      if (uploading.value) {
        console.warn('⚠️ Already uploading, ignoring click');
        return;
      }
      
      // Check if photo is selected
      if (!selectedPhoto.value) {
        console.error('❌ No photo selected!');
        safeNotify({
          type: 'warning',
          message: 'Please select a photo first',
        });
        return;
      }
      
      console.log('✅ All checks passed, calling goToCropSettings...');
      goToCropSettings();
    };

    // Navigate to crop settings
    const goToCropSettings = async () => {
      console.log('🚀 goToCropSettings called');
      console.log('📸 selectedPhoto.value:', selectedPhoto.value);
      console.log('📤 selectedUploadedPhoto.value:', selectedUploadedPhoto.value);
      console.log('📁 uploadedPhoto.value:', uploadedPhoto.value);

      if (!selectedPhoto.value) {
        console.warn('⚠️ No photo selected');
        safeNotify({
          type: 'warning',
          message: 'Please select a photo',
        });
        return;
      }

      uploading.value = true;
      console.log('⏳ Uploading state set to true');

      try {
        let photoData = null;

        // If it's an uploaded photo, upload it first
        if (selectedUploadedPhoto.value && uploadedPhoto.value?.file) {
          console.log('📤 Uploading new photo to Firebase...');
          console.log('📁 File:', uploadedPhoto.value.file.name, uploadedPhoto.value.file.size, 'bytes');
          
          safeNotify({
            type: 'info',
            message: 'Uploading photo...',
            position: 'top',
            timeout: 2000,
          });

          try {
            const uploaded = await firebaseService.uploadPhotos([uploadedPhoto.value.file]);
            console.log('✅ Upload complete, received:', uploaded);
            console.log('📊 Uploaded array length:', uploaded.length);
            
            if (uploaded && uploaded.length > 0) {
              console.log('📸 First uploaded photo:', uploaded[0]);
              photoData = {
                name: uploaded[0].name,
                url: uploaded[0].url,
                fileName: uploaded[0].fileName,
                size: uploaded[0].size,
                type: uploaded[0].type,
              };
              console.log('✅ Created photoData:', photoData);
            } else {
              console.error('❌ Upload returned empty array');
              throw new Error('Upload failed: No photos returned');
            }
          } catch (uploadError) {
            console.error('❌ Error during upload:', uploadError);
            throw uploadError;
          }
        } else if (selectedOrderPhoto.value) {
          // Use the order photo
          console.log('📸 Using order photo:', selectedOrderPhoto.value.photo);
          photoData = selectedOrderPhoto.value.photo;
        }

        if (!photoData) {
          console.error('❌ No photoData available');
          safeNotify({
            type: 'negative',
            message: 'Failed to prepare photo',
          });
          uploading.value = false;
          return;
        }

        // Validate that we have a valid URL
        if (!photoData.url || (!photoData.url.startsWith('http') && !photoData.url.startsWith('blob:'))) {
          console.error('❌ Invalid photo URL:', photoData.url);
          safeNotify({
            type: 'negative',
            message: 'Invalid photo URL',
            caption: 'The photo URL is not valid. Please try uploading again.',
          });
          uploading.value = false;
          return;
        }

        console.log('🚀 Navigating to crop settings with photoData:', photoData);
        console.log('🔗 Photo URL:', photoData.url);

        // Navigate to crop settings with photo data
        await router.push({
          path: '/magnet-studio',
          query: {
            photo: JSON.stringify(photoData),
          },
        });
        
        console.log('✅ Navigation complete');
      } catch (error) {
        console.error('❌ Error preparing photo:', error);
        console.error('Error stack:', error.stack);
        safeNotify({
          type: 'negative',
          message: 'Failed to prepare photo',
          caption: error.message || 'Unknown error occurred',
          timeout: 5000,
        });
      } finally {
        uploading.value = false;
        console.log('✅ Uploading state set to false');
      }
    };

    onMounted(async () => {
      // Check admin access
      if (!authService.isAuthenticated() || !authService.isAdmin()) {
        router.push('/');
        return;
      }

      await loadAllPhotos();
      
      // Debug: Log that component is mounted and function is available
      console.log('✅ MagnetStudioSelectPage mounted');
      console.log('🔧 handleContinueClick function available:', typeof handleContinueClick === 'function');
      console.log('🔧 goToCropSettings function available:', typeof goToCropSettings === 'function');
      console.log('🔧 continueButton ref:', continueButton.value);
      
      // Test if we can access the button after next tick
      await nextTick();
      console.log('🔧 continueButton ref after nextTick:', continueButton.value);
      if (continueButton.value) {
        console.log('🔧 Button element:', continueButton.value.$el);
        // Try to add a direct event listener as a test
        if (continueButton.value.$el) {
          continueButton.value.$el.addEventListener('click', (e) => {
            console.log('🎯 DIRECT EVENT LISTENER FIRED!', e);
            handleContinueClick(e);
          }, true);
        }
      }
    });

    return {
      loading,
      searchQuery,
      filteredPhotos,
      displayedPhotos,
      hasMorePhotos,
      loadMorePhotos,
      selectedOrderPhoto,
      selectedUploadedPhoto,
      uploadFiles,
      uploadedPhoto,
      uploading,
      selectedPhoto,
      getPhotoUrl,
      handleImageError,
      isOrderPhotoSelected,
      selectOrderPhoto,
      isUploadedPhotoSelected,
      selectUploadedPhoto,
      onFilesSelected,
      removeUploadedPhoto,
      handleContinueClick,
      goToCropSettings,
      continueButton,
    };
  },
};
</script>

<style lang="scss" scoped>
.photo-card {
  border: 2px solid transparent;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.photo-card:hover {
  border-color: $primary;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.selected-photo {
  border-color: $primary;
  box-shadow: 0 0 10px rgba($primary, 0.5);
}

.photo-thumbnail {
  border-radius: 4px 4px 0 0;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>

