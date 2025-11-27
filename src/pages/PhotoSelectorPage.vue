<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        <q-icon name="print" class="q-mr-sm" />
        Print Template
      </div>
      <div class="text-caption text-grey-7 q-mt-sm">
        Select photos from existing orders or upload new photos to send to print template
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
              label="Upload New Photos"
              multiple
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
          <span v-if="uploadedPhotos.length > 0">
            • {{ uploadedPhotos.length }} uploaded photo{{ uploadedPhotos.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Combined Photo Grid: Orders + Uploaded -->
      <div class="row q-col-gutter-md">
        <!-- Photos from Orders -->
        <div
          v-for="(photo, index) in filteredPhotos"
          :key="`order-${photo.orderId}-${index}`"
          :class="isOrderPhotoSelected(photo, index) ? 'col-4 col-sm-3 col-md-2 col-lg-1' : 'col-6 col-sm-4 col-md-3 col-lg-2'"
        >
          <q-card
            :class="{ 'selected-photo': isOrderPhotoSelected(photo, index) }"
            class="photo-card"
          >
            <q-img
              :src="getPhotoUrl(photo)"
              ratio="1"
              class="photo-thumbnail cursor-pointer"
              @click="toggleOrderPhotoSelection(photo, index)"
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
            <q-card-section class="q-pa-xs" v-if="!isOrderPhotoSelected(photo, index)">
              <div class="text-caption text-truncate" :title="photo.name">
                {{ photo.name }}
              </div>
              <div class="text-caption text-grey-6">
                Order #{{ photo.orderNumber }}
              </div>
            </q-card-section>
            <q-card-section class="q-pa-xs" v-else>
              <div class="text-caption text-truncate text-center" :title="photo.name" style="font-size: 0.7rem;">
                {{ photo.name }}
              </div>
              <div class="text-caption text-grey-6 text-center q-mt-xs" style="font-size: 0.65rem;">
                Order #{{ photo.orderNumber }}
              </div>
              <div class="text-caption text-center q-mt-xs" style="font-size: 0.65rem;">Qty:</div>
              <div class="row items-center justify-center q-gutter-xs q-mt-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  size="xs"
                  style="min-width: 20px; height: 20px;"
                  @click.stop="decrementOrderPhotoQuantityInGrid(photo, index)"
                  :disable="getOrderPhotoQuantityInGrid(photo, index) <= 1"
                />
                <div class="text-caption text-weight-bold" style="min-width: 18px; text-align: center; font-size: 0.7rem;">
                  {{ getOrderPhotoQuantityInGrid(photo, index) }}
                </div>
                <q-btn
                  flat
                  dense
                  round
                  icon="add"
                  size="xs"
                  style="min-width: 20px; height: 20px;"
                  @click.stop="incrementOrderPhotoQuantityInGrid(photo, index)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Uploaded Photos -->
        <div
          v-for="(photo, index) in uploadedPhotos"
          :key="`upload-${index}`"
          :class="isUploadedPhotoSelected(index) ? 'col-4 col-sm-3 col-md-2 col-lg-1' : 'col-6 col-sm-4 col-md-3 col-lg-2'"
        >
          <q-card
            :class="{ 'selected-photo': isUploadedPhotoSelected(index) }"
            class="photo-card"
          >
            <q-img
              :src="photo.preview"
              ratio="1"
              class="photo-thumbnail cursor-pointer"
              @click="toggleUploadedPhotoSelection(index)"
            >
              <div
                v-if="isUploadedPhotoSelected(index)"
                class="absolute-top-right q-ma-xs"
              >
                <q-icon name="check_circle" size="32px" color="white" style="text-shadow: 0 0 4px rgba(0,0,0,0.8);" />
              </div>
            </q-img>
            <q-card-section class="q-pa-xs" v-if="!isUploadedPhotoSelected(index)">
              <div class="text-caption text-truncate" :title="photo.name">
                {{ photo.name }}
              </div>
              <div class="text-caption text-grey-6">
                New Upload
              </div>
            </q-card-section>
            <q-card-section class="q-pa-xs" v-else>
              <div class="text-caption text-truncate text-center" :title="uploadedPhotos[index]?.name" style="font-size: 0.7rem;">
                {{ uploadedPhotos[index]?.name }}
              </div>
              <div class="text-caption text-grey-6 text-center q-mt-xs" style="font-size: 0.65rem;">
                New Upload
              </div>
              <div class="text-caption text-center q-mt-xs" style="font-size: 0.65rem;">Qty:</div>
              <div class="row items-center justify-center q-gutter-xs q-mt-xs">
                <q-btn
                  flat
                  dense
                  round
                  icon="remove"
                  size="xs"
                  style="min-width: 20px; height: 20px;"
                  @click.stop="decrementUploadedPhotoQuantityInGrid(index)"
                  :disable="getUploadedPhotoQuantityInGrid(index) <= 1"
                />
                <div class="text-caption text-weight-bold" style="min-width: 18px; text-align: center; font-size: 0.7rem;">
                  {{ getUploadedPhotoQuantityInGrid(index) }}
                </div>
                <q-btn
                  flat
                  dense
                  round
                  icon="add"
                  size="xs"
                  style="min-width: 20px; height: 20px;"
                  @click.stop="incrementUploadedPhotoQuantityInGrid(index)"
                />
              </div>
            </q-card-section>
            <q-card-actions class="q-pa-xs" v-if="!isUploadedPhotoSelected(index)">
              <q-btn
                flat
                dense
                icon="delete"
                color="negative"
                size="sm"
                @click.stop="removeUploadedPhoto(index)"
                class="full-width"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <div v-if="filteredPhotos.length === 0 && uploadedPhotos.length === 0" class="text-center q-pa-xl">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">No photos available</div>
        <div class="text-body2 text-grey-7 q-mt-sm">
          Upload photos or search for photos from existing orders
        </div>
      </div>

      <!-- Selected Photos Summary -->
      <q-card v-if="selectedPhotosCount > 0" class="q-mt-lg sticky-bottom">
        <q-card-section>
          <div class="text-h6 q-mb-md">Selected Photos ({{ selectedPhotosCount }}):</div>
          
          <!-- Selected Photos List with Quantities -->
          <div class="q-mb-md">
            <div class="row q-col-gutter-md">
              <!-- Selected Order Photos -->
              <div
                v-for="(selected, idx) in selectedOrderPhotos"
                :key="`order-${selected.orderId}-${selected.index}`"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card class="selected-photo-item">
                  <q-img
                    :src="getPhotoUrl(selected.photo)"
                    ratio="1"
                    class="selected-photo-image"
                    fit="cover"
                  />
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-truncate text-center q-mb-xs" :title="selected.photo.name">
                      {{ selected.photo.name }}
                    </div>
                    <div class="text-caption text-grey-6 text-center q-mb-sm">
                      Order #{{ selected.orderNumber }}
                    </div>
                    <div class="text-caption text-center q-mb-xs">Quantity:</div>
                    <div class="row items-center justify-center q-gutter-sm">
                      <q-btn
                        round
                        dense
                        icon="remove"
                        size="md"
                        color="primary"
                        @click="decrementOrderPhotoQuantity(idx)"
                        :disable="selected.quantity <= 1"
                      />
                      <div class="text-h5 text-weight-bold" style="min-width: 50px; text-align: center;">
                        {{ selected.quantity }}
                      </div>
                      <q-btn
                        round
                        dense
                        icon="add"
                        size="md"
                        color="primary"
                        @click="incrementOrderPhotoQuantity(idx)"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>

              <!-- Selected Uploaded Photos -->
              <div
                v-for="item in selectedUploadedPhotos"
                :key="`upload-${item.index}`"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card class="selected-photo-item">
                  <q-img
                    :src="uploadedPhotos[item.index]?.preview"
                    ratio="1"
                    class="selected-photo-image"
                    fit="cover"
                  />
                  <q-card-section class="q-pa-sm">
                    <div class="text-caption text-truncate text-center q-mb-xs" :title="uploadedPhotos[item.index]?.name">
                      {{ uploadedPhotos[item.index]?.name }}
                    </div>
                    <div class="text-caption text-grey-6 text-center q-mb-sm">
                      New Upload
                    </div>
                    <div class="text-caption text-center q-mb-xs">Quantity:</div>
                    <div class="row items-center justify-center q-gutter-sm">
                      <q-btn
                        round
                        dense
                        icon="remove"
                        size="md"
                        color="primary"
                        @click="decrementUploadedPhotoQuantity(item.index)"
                        :disable="item.quantity <= 1"
                      />
                      <div class="text-h5 text-weight-bold" style="min-width: 50px; text-align: center;">
                        {{ item.quantity }}
                      </div>
                      <q-btn
                        round
                        dense
                        icon="add"
                        size="md"
                        color="primary"
                        @click="incrementUploadedPhotoQuantity(item.index)"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <div class="row items-center justify-between q-pt-md" style="border-top: 1px solid rgba(0,0,0,0.12);">
            <div class="col">
              <div class="text-h6">
                Total: {{ totalQuantity }} photo{{ totalQuantity !== 1 ? 's' : '' }}
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
    const searchQuery = ref('');
    const allPhotos = ref([]);
    const selectedOrderPhotos = ref([]); // Array of { photo, index, orderId, orderNumber, quantity }
    const selectedUploadedPhotos = ref([]); // Array of { index, quantity }
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

    // Check if order photo is selected
    const isOrderPhotoSelected = (photo, index) => {
      return selectedOrderPhotos.value.some(
        (sp) => sp.orderId === photo.orderId && sp.index === index
      );
    };

    // Toggle order photo selection
    const toggleOrderPhotoSelection = (photo, index) => {
      const existingIndex = selectedOrderPhotos.value.findIndex(
        (sp) => sp.orderId === photo.orderId && sp.index === index
      );

      if (existingIndex >= 0) {
        selectedOrderPhotos.value.splice(existingIndex, 1);
      } else {
        selectedOrderPhotos.value.push({
          photo,
          index,
          orderId: photo.orderId,
          orderNumber: photo.orderNumber,
          quantity: 1, // Default quantity
        });
      }
    };

    // Quantity management for order photos
    const incrementOrderPhotoQuantity = (idx) => {
      if (selectedOrderPhotos.value[idx]) {
        selectedOrderPhotos.value[idx].quantity++;
      }
    };

    const decrementOrderPhotoQuantity = (idx) => {
      if (selectedOrderPhotos.value[idx] && selectedOrderPhotos.value[idx].quantity > 1) {
        selectedOrderPhotos.value[idx].quantity--;
      }
    };

    // Check if uploaded photo is selected
    const isUploadedPhotoSelected = (index) => {
      return selectedUploadedPhotos.value.some(item => item.index === index);
    };

    // Toggle uploaded photo selection
    const toggleUploadedPhotoSelection = (index) => {
      const existingIndex = selectedUploadedPhotos.value.findIndex(item => item.index === index);
      if (existingIndex >= 0) {
        selectedUploadedPhotos.value.splice(existingIndex, 1);
      } else {
        // Use the quantity from the uploaded photo, or default to 1
        const quantity = uploadedPhotos.value[index]?.quantity || 1;
        selectedUploadedPhotos.value.push({ index, quantity });
      }
    };

    // Quantity management for uploaded photos
    const getUploadedPhotoQuantity = (uploadIndex) => {
      const item = selectedUploadedPhotos.value.find(item => item.index === uploadIndex);
      return item ? item.quantity : 1;
    };

    const incrementUploadedPhotoQuantity = (uploadIndex) => {
      const item = selectedUploadedPhotos.value.find(item => item.index === uploadIndex);
      if (item) {
        item.quantity++;
      }
    };

    const decrementUploadedPhotoQuantity = (uploadIndex) => {
      const item = selectedUploadedPhotos.value.find(item => item.index === uploadIndex);
      if (item && item.quantity > 1) {
        item.quantity--;
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
          quantity: 1, // Default quantity for each uploaded photo
        };
      });
    };

    // Quantity management for uploaded photos in the grid
    const getUploadedPhotoQuantityInGrid = (index) => {
      // If selected, get quantity from selectedUploadedPhotos, otherwise from uploadedPhotos
      const selectedItem = selectedUploadedPhotos.value.find(item => item.index === index);
      if (selectedItem) {
        return selectedItem.quantity || 1;
      }
      return uploadedPhotos.value[index]?.quantity || 1;
    };

    const incrementUploadedPhotoQuantityInGrid = (index) => {
      const selectedItem = selectedUploadedPhotos.value.find(item => item.index === index);
      if (selectedItem) {
        selectedItem.quantity = (selectedItem.quantity || 1) + 1;
      } else if (uploadedPhotos.value[index]) {
        uploadedPhotos.value[index].quantity = (uploadedPhotos.value[index].quantity || 1) + 1;
      }
    };

    const decrementUploadedPhotoQuantityInGrid = (index) => {
      const selectedItem = selectedUploadedPhotos.value.find(item => item.index === index);
      if (selectedItem && selectedItem.quantity > 1) {
        selectedItem.quantity--;
      } else if (uploadedPhotos.value[index] && uploadedPhotos.value[index].quantity > 1) {
        uploadedPhotos.value[index].quantity--;
      }
    };

    // Quantity management for order photos in the grid
    const getOrderPhotoQuantityInGrid = (photo, index) => {
      const selected = selectedOrderPhotos.value.find(
        sp => sp.orderId === photo.orderId && sp.index === index
      );
      return selected ? (selected.quantity || 1) : 1;
    };

    const incrementOrderPhotoQuantityInGrid = (photo, index) => {
      const selectedIndex = selectedOrderPhotos.value.findIndex(
        sp => sp.orderId === photo.orderId && sp.index === index
      );
      if (selectedIndex >= 0) {
        selectedOrderPhotos.value[selectedIndex].quantity = (selectedOrderPhotos.value[selectedIndex].quantity || 1) + 1;
      }
    };

    const decrementOrderPhotoQuantityInGrid = (photo, index) => {
      const selectedIndex = selectedOrderPhotos.value.findIndex(
        sp => sp.orderId === photo.orderId && sp.index === index
      );
      if (selectedIndex >= 0 && selectedOrderPhotos.value[selectedIndex].quantity > 1) {
        selectedOrderPhotos.value[selectedIndex].quantity--;
      }
    };

    // Remove uploaded photo
    const removeUploadedPhoto = (index) => {
      // Remove from selected photos if it was selected
      const selectedIndex = selectedUploadedPhotos.value.findIndex(item => item.index === index);
      if (selectedIndex >= 0) {
        selectedUploadedPhotos.value.splice(selectedIndex, 1);
      }
      // Adjust indices of selected photos that come after this one
      selectedUploadedPhotos.value = selectedUploadedPhotos.value.map(item => {
        if (item.index > index) {
          return { ...item, index: item.index - 1 };
        }
        return item;
      });
      // Remove the photo
      uploadedPhotos.value.splice(index, 1);
    };

    // Get selected photos count (orders + uploaded)
    const selectedPhotosCount = computed(() => {
      return selectedOrderPhotos.value.length + selectedUploadedPhotos.value.length;
    });

    // Get total quantity of all selected photos
    const totalQuantity = computed(() => {
      const orderTotal = selectedOrderPhotos.value.reduce((sum, sp) => sum + (sp.quantity || 1), 0);
      const uploadedTotal = selectedUploadedPhotos.value.reduce((sum, item) => sum + (item.quantity || 1), 0);
      return orderTotal + uploadedTotal;
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

        // Add selected photos from orders (with quantities)
        selectedOrderPhotos.value.forEach((sp) => {
          const qty = sp.quantity || 1;
          // Add the photo multiple times based on quantity
          for (let i = 0; i < qty; i++) {
            photos.push(sp.photo);
            quantities.push(1);
          }
        });

        // Upload selected new photos and add them (with quantities)
        const photosToUpload = selectedUploadedPhotos.value
          .map(item => ({
            photo: uploadedPhotos.value[item.index],
            quantity: item.quantity || 1,
          }))
          .filter(item => item.photo && item.photo.file);

        if (photosToUpload.length > 0) {
          console.log('Uploading selected new photos to Firebase Storage...');
          // Upload each photo the number of times specified by quantity
          for (const item of photosToUpload) {
            const uploaded = await firebaseService.uploadPhotos([item.photo.file]);
            uploaded.forEach((uploadedPhoto) => {
              // Add the photo multiple times based on quantity
              for (let i = 0; i < item.quantity; i++) {
                photos.push({
                  name: uploadedPhoto.name,
                  url: uploadedPhoto.url,
                  fileName: uploadedPhoto.fileName,
                  size: uploadedPhoto.size,
                  type: uploadedPhoto.type,
                });
                quantities.push(1);
              }
            });
          }
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
      searchQuery,
      filteredPhotos,
      selectedOrderPhotos,
      selectedUploadedPhotos,
      uploadFiles,
      uploadedPhotos,
      sending,
      selectedPhotosCount,
      getPhotoUrl,
      handleImageError,
      isOrderPhotoSelected,
      toggleOrderPhotoSelection,
      incrementOrderPhotoQuantity,
      decrementOrderPhotoQuantity,
      isUploadedPhotoSelected,
      toggleUploadedPhotoSelection,
      getUploadedPhotoQuantity,
      incrementUploadedPhotoQuantity,
      decrementUploadedPhotoQuantity,
      getUploadedPhotoQuantityInGrid,
      incrementUploadedPhotoQuantityInGrid,
      decrementUploadedPhotoQuantityInGrid,
      getOrderPhotoQuantityInGrid,
      incrementOrderPhotoQuantityInGrid,
      decrementOrderPhotoQuantityInGrid,
      totalQuantity,
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

.selected-photo-item {
  border: 2px solid $primary;
  transition: all 0.2s ease-in-out;
  overflow: hidden;
}

.selected-photo-image {
  border-radius: 4px 4px 0 0;
}
</style>

