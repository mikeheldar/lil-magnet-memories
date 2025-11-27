<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        <q-icon name="photo_library" class="q-mr-sm" />
        Photo Selector for Print Template
      </div>
      <div class="text-caption text-grey-7 q-mt-sm">
        Select photos from existing orders or upload new photos directly
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-md text-body1">Loading photos...</div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Tabs: Existing Photos vs Upload New -->
      <q-tabs v-model="activeTab" class="q-mb-md">
        <q-tab name="existing" label="Select from Orders" icon="photo_library" />
        <q-tab name="upload" label="Upload New Photos" icon="cloud_upload" />
      </q-tabs>

      <q-tab-panels v-model="activeTab" animated>
        <!-- Existing Photos Tab -->
        <q-tab-panel name="existing">
          <div class="q-mb-md">
            <q-input
              v-model="searchQuery"
              filled
              placeholder="Search by order number, customer name, or photo name..."
              clearable
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>

            <div class="text-body2 text-grey-7 q-mb-sm">
              Found {{ filteredPhotos.length }} photos
            </div>
          </div>

          <!-- Photo Grid -->
          <div class="row q-col-gutter-md">
            <div
              v-for="(photo, index) in filteredPhotos"
              :key="`${photo.orderId}-${index}`"
              class="col-6 col-sm-4 col-md-3 col-lg-2"
            >
              <q-card
                :class="{ 'selected-photo': isPhotoSelected(photo, index) }"
                class="photo-card cursor-pointer"
                @click="togglePhotoSelection(photo, index)"
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
                    v-if="isPhotoSelected(photo, index)"
                    class="absolute-full flex flex-center"
                    style="background: rgba(0,0,0,0.5)"
                  >
                    <q-icon name="check_circle" size="48px" color="white" />
                  </div>
                </q-img>
                <q-card-section class="q-pa-xs">
                  <div class="text-caption text-truncate" :title="photo.name">
                    {{ photo.name }}
                  </div>
                  <div class="text-caption text-grey-6">
                    Order #{{ photo.orderNumber }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div v-if="filteredPhotos.length === 0" class="text-center q-pa-xl">
            <q-icon name="photo_library" size="64px" color="grey-5" />
            <div class="text-h6 text-grey-6 q-mt-md">No photos found</div>
            <div class="text-body2 text-grey-7 q-mt-sm">
              Try adjusting your search or upload new photos
            </div>
          </div>
        </q-tab-panel>

        <!-- Upload New Photos Tab -->
        <q-tab-panel name="upload">
          <div class="q-mb-md">
            <q-file
              v-model="uploadFiles"
              label="Select Photos to Upload"
              multiple
              accept="image/*"
              filled
              @update:model-value="onFilesSelected"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>

          <!-- Uploaded Photos Preview -->
          <div v-if="uploadedPhotos.length > 0" class="q-mb-md">
            <div class="text-subtitle1 q-mb-sm">Selected Photos ({{ uploadedPhotos.length }})</div>
            <div class="row q-col-gutter-md">
              <div
                v-for="(photo, index) in uploadedPhotos"
                :key="`upload-${index}`"
                class="col-6 col-sm-4 col-md-3 col-lg-2"
              >
                <q-card class="photo-card">
                  <q-img
                    :src="photo.preview"
                    ratio="1"
                    class="photo-thumbnail"
                  />
                  <q-card-section class="q-pa-xs">
                    <div class="text-caption text-truncate" :title="photo.name">
                      {{ photo.name }}
                    </div>
                  </q-card-section>
                  <q-card-actions>
                    <q-btn
                      flat
                      dense
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeUploadedPhoto(index)"
                    />
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <!-- Selected Photos Summary -->
      <q-card v-if="selectedPhotosCount > 0" class="q-mt-lg sticky-bottom">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h6">
                {{ selectedPhotosCount }} photo{{ selectedPhotosCount !== 1 ? 's' : '' }} selected
              </div>
              <div class="text-caption text-grey-7">
                Ready to send to print template
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                color="primary"
                icon="print"
                label="Send to Print Template"
                @click="sendToPrintTemplate"
                :loading="sending"
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
  name: 'PhotoSelectorPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const loading = ref(true);
    const activeTab = ref('existing');
    const searchQuery = ref('');
    const allPhotos = ref([]);
    const selectedPhotos = ref([]); // Array of { photo, index, orderId, orderNumber }
    const uploadFiles = ref([]);
    const uploadedPhotos = ref([]);
    const sending = ref(false);

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

    // Check if photo is selected
    const isPhotoSelected = (photo, index) => {
      return selectedPhotos.value.some(
        (sp) => sp.orderId === photo.orderId && sp.index === index
      );
    };

    // Toggle photo selection
    const togglePhotoSelection = (photo, index) => {
      const existingIndex = selectedPhotos.value.findIndex(
        (sp) => sp.orderId === photo.orderId && sp.index === index
      );

      if (existingIndex >= 0) {
        selectedPhotos.value.splice(existingIndex, 1);
      } else {
        selectedPhotos.value.push({
          photo,
          index,
          orderId: photo.orderId,
          orderNumber: photo.orderNumber,
        });
      }
    };

    // Handle file selection for upload
    const onFilesSelected = (files) => {
      if (!files || files.length === 0) {
        uploadedPhotos.value = [];
        return;
      }

      uploadedPhotos.value = Array.from(files).map((file) => {
        return {
          name: file.name,
          preview: URL.createObjectURL(file),
          file: file, // Keep file reference for upload
        };
      });
    };

    // Remove uploaded photo
    const removeUploadedPhoto = (index) => {
      uploadedPhotos.value.splice(index, 1);
    };

    // Get selected photos count (existing + uploaded)
    const selectedPhotosCount = computed(() => {
      return selectedPhotos.value.length + uploadedPhotos.value.length;
    });

    // Send to print template
    const sendToPrintTemplate = async () => {
      if (selectedPhotosCount.value === 0) {
        $q.notify({
          type: 'warning',
          message: 'Please select at least one photo',
        });
        return;
      }

      sending.value = true;

      try {
        // Prepare photos array
        const photos = [];
        const quantities = [];

        // Add selected photos from orders
        selectedPhotos.value.forEach((sp) => {
          photos.push(sp.photo);
          quantities.push(1); // Default quantity of 1
        });

        // Upload new photos and add them
        if (uploadedPhotos.value.length > 0) {
          console.log('Uploading new photos to Firebase Storage...');
          const uploaded = await firebaseService.uploadPhotos(
            uploadedPhotos.value.map((up) => up.file)
          );

          uploaded.forEach((uploadedPhoto) => {
            photos.push({
              name: uploadedPhoto.name,
              url: uploadedPhoto.url,
              fileName: uploadedPhoto.fileName,
              size: uploadedPhoto.size,
              type: uploadedPhoto.type,
            });
            quantities.push(1);
          });
        }

        // Generate order number
        const orderNumber = `SELECT-${Date.now()}`;

        // Navigate to print template
        router.push({
          name: 'print-template',
          query: {
            orderNumber,
            photos: JSON.stringify(photos),
            quantities: JSON.stringify(quantities),
          },
        });

        $q.notify({
          type: 'positive',
          message: 'Photos sent to print template',
          caption: `${photos.length} photo${photos.length !== 1 ? 's' : ''} ready`,
        });
      } catch (error) {
        console.error('Error sending to print template:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to process photos',
          caption: error.message,
        });
      } finally {
        sending.value = false;
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
      activeTab,
      searchQuery,
      filteredPhotos,
      selectedPhotos,
      uploadFiles,
      uploadedPhotos,
      sending,
      selectedPhotosCount,
      getPhotoUrl,
      handleImageError,
      isPhotoSelected,
      togglePhotoSelection,
      onFilesSelected,
      removeUploadedPhoto,
      sendToPrintTemplate,
    };
  },
};
</script>

<style lang="scss" scoped>
.photo-card {
  transition: all 0.2s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.selected-photo {
    border-color: $primary;
    box-shadow: 0 0 0 2px rgba($primary, 0.3);
  }
}

.photo-thumbnail {
  cursor: pointer;
}

.sticky-bottom {
  position: sticky;
  bottom: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>

