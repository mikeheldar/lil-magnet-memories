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
        </div>
      </div>

      <!-- Combined Photo Grid: Orders + Uploaded -->
      <div class="row q-col-gutter-md">
        <!-- Photos from Orders -->
        <div
          v-for="(photo, index) in filteredPhotos"
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

      <div v-if="filteredPhotos.length === 0 && !uploadedPhoto" class="text-center q-pa-xl">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">No photos available</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Upload a photo or search for photos from existing orders
        </div>
      </div>

      <!-- Continue Button -->
      <q-card v-if="selectedPhoto" class="q-mt-lg sticky-bottom">
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
                color="primary"
                icon="arrow_forward"
                label="Continue to Crop Settings"
                @click="goToCropSettings"
                size="lg"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'MagnetStudioSelectPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const loading = ref(true);
    const searchQuery = ref('');
    const allPhotos = ref([]);
    const selectedOrderPhoto = ref(null); // { photo, index, orderId, orderNumber }
    const selectedUploadedPhoto = ref(false);
    const uploadFiles = ref([]);
    const uploadedPhoto = ref(null);
    const uploading = ref(false);

    // Load all photos from orders
    const loadAllPhotos = async () => {
      loading.value = true;
      try {
        const orders = await firebaseService.getOrders();
        const photos = [];

        orders.forEach((order) => {
          // Handle legacy photo-based orders
          if (order.photos && order.photos.length > 0) {
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
      } catch (error) {
        console.error('Error loading photos:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load photos',
          caption: error.message,
        });
      } finally {
        loading.value = false;
      }
    };

    // Filter photos based on search query
    const filteredPhotos = computed(() => {
      if (!searchQuery.value) {
        return allPhotos.value;
      }

      const query = searchQuery.value.toLowerCase();
      return allPhotos.value.filter((photo) => {
        return (
          photo.name?.toLowerCase().includes(query) ||
          photo.orderNumber?.toLowerCase().includes(query) ||
          photo.customerName?.toLowerCase().includes(query)
        );
      });
    });

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

    // Navigate to crop settings
    const goToCropSettings = async () => {
      if (!selectedPhoto.value) {
        $q.notify({
          type: 'warning',
          message: 'Please select a photo',
        });
        return;
      }

      uploading.value = true;

      try {
        let photoData = null;

        // If it's an uploaded photo, upload it first
        if (selectedUploadedPhoto.value && uploadedPhoto.value?.file) {
          $q.notify({
            type: 'info',
            message: 'Uploading photo...',
            position: 'top',
            timeout: 2000,
          });
          const uploaded = await firebaseService.uploadPhotos([uploadedPhoto.value.file]);
          if (uploaded.length > 0) {
            photoData = {
              name: uploaded[0].name,
              url: uploaded[0].url,
              fileName: uploaded[0].fileName,
              size: uploaded[0].size,
              type: uploaded[0].type,
            };
          }
        } else if (selectedOrderPhoto.value) {
          // Use the order photo
          photoData = selectedOrderPhoto.value.photo;
        }

        if (!photoData) {
          $q.notify({
            type: 'negative',
            message: 'Failed to prepare photo',
          });
          return;
        }

        // Navigate to crop settings with photo data
        router.push({
          path: '/magnet-studio',
          query: {
            photo: JSON.stringify(photoData),
          },
        });
      } catch (error) {
        console.error('Error preparing photo:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to prepare photo',
          caption: error.message,
        });
      } finally {
        uploading.value = false;
      }
    };

    onMounted(async () => {
      // Check admin access
      if (!authService.isAuthenticated() || !authService.isAdmin()) {
        router.push('/');
        return;
      }

      await loadAllPhotos();
    });

    return {
      loading,
      searchQuery,
      filteredPhotos,
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
      goToCropSettings,
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

