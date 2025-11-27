<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        <q-icon name="delete_sweep" class="q-mr-sm" />
        Photo Management
      </div>
      <div class="text-caption text-grey-7 q-mt-sm">
        Select photos to delete. Optionally delete associated orders.
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="3em" />
      <div class="q-mt-md text-body1">Loading photos...</div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Search Section -->
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
        </div>

        <div class="text-body2 text-grey-7 q-mb-sm">
          Found {{ filteredPhotos.length }} photos from orders
          <span v-if="displayedPhotos.length < filteredPhotos.length">
            • Showing {{ displayedPhotos.length }} of {{ filteredPhotos.length }}
          </span>
        </div>
      </div>

      <!-- Photo Grid -->
      <div class="row q-col-gutter-md">
        <div
          v-for="(photo, index) in displayedPhotos"
          :key="`order-${photo.orderId}-${index}`"
          class="col-4 col-sm-3 col-md-2 col-lg-1"
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

      <div v-if="filteredPhotos.length === 0" class="text-center q-pa-xl">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">No photos available</div>
      </div>

      <!-- Selected Photos Summary -->
      <q-card v-if="selectedPhotosCount > 0" class="q-mt-lg sticky-bottom">
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="col">
              <div class="text-h6">
                Selected: {{ selectedPhotosCount }} photo{{ selectedPhotosCount !== 1 ? 's' : '' }}
              </div>
              <div class="text-caption text-grey-7">
                Ready to delete
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                color="negative"
                icon="delete"
                label="Delete Selected"
                @click="showDeleteDialog"
                :loading="deleting"
                size="lg"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteConfirm" persistent>
      <q-card style="min-width: 500px; max-width: 800px;">
        <q-card-section>
          <div class="text-h6">Delete Photos</div>
        </q-card-section>

        <q-card-section>
          <div class="text-body1 q-mb-md">
            Are you sure you want to delete {{ selectedPhotosCount }} photo{{ selectedPhotosCount !== 1 ? 's' : '' }}?
          </div>

          <q-checkbox
            v-model="deleteAssociatedOrders"
            label="Also delete all orders associated with these photos"
            color="negative"
            class="q-mb-md"
            @update:model-value="onDeleteOrdersToggle"
          />

          <!-- Show associated orders if checkbox is checked -->
          <div v-if="deleteAssociatedOrders" class="q-mt-md">
            <div class="text-body2 text-weight-medium q-mb-sm">
              Associated Orders ({{ associatedOrders.length }}):
            </div>
            <div v-if="associatedOrders.length === 0 && !loadingOrders" class="text-caption text-grey-6 q-pa-sm">
              No associated orders found
            </div>
            <q-scroll-area v-if="associatedOrders.length > 0" style="max-height: 300px;" class="border rounded-borders">
              <q-list>
                <q-item
                  v-for="order in associatedOrders"
                  :key="order.id || order.orderNumber"
                  class="q-pa-sm"
                >
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      Order #{{ order.orderNumber || order.id || 'Unknown' }}
                    </q-item-label>
                    <q-item-label caption>
                      <div v-if="order.submissionDate">
                        <strong>Date Ordered:</strong> {{ formatDate(order.submissionDate) }}
                      </div>
                      <div v-else-if="order.createdAt">
                        <strong>Date Ordered:</strong> {{ formatDate(order.createdAt) }}
                      </div>
                      <div v-else-if="order.updatedAt">
                        <strong>Date Ordered:</strong> {{ formatDate(order.updatedAt) }}
                      </div>
                      <div v-else>
                        <strong>Date Ordered:</strong> N/A
                      </div>
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-scroll-area>
          </div>

          <div v-if="deleteAssociatedOrders && loadingOrders" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
            <div class="q-mt-sm text-caption">Loading associated orders...</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-8" v-close-popup />
          <q-btn
            flat
            label="Delete"
            color="negative"
            @click="confirmDelete"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'PhotoManagementPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const loading = ref(true);
    const searchQuery = ref('');
    const allPhotos = ref([]);
    const displayedPhotosCount = ref(9); // Start with 9 photos
    const selectedPhotos = ref([]); // Array of { photo, index, orderId, orderNumber }
    const showDeleteConfirm = ref(false);
    const deleteAssociatedOrders = ref(false);
    const associatedOrders = ref([]);
    const loadingOrders = ref(false);
    const deleting = ref(false);

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

    // Get selected photos count
    const selectedPhotosCount = computed(() => {
      return selectedPhotos.value.length;
    });

    // Load associated orders when checkbox is toggled
    const onDeleteOrdersToggle = async (value) => {
      if (value && selectedPhotos.value.length > 0) {
        loadingOrders.value = true;
        associatedOrders.value = [];
        
        try {
          const allOrdersMap = new Map(); // Use Map to deduplicate by order ID
          
          // Find orders for each selected photo
          for (const selectedPhoto of selectedPhotos.value) {
            const photo = selectedPhoto.photo;
            const orders = await firebaseService.findOrdersWithPhoto(photo.url, photo.name);
            orders.forEach(order => {
              // Use order ID as key to avoid duplicates
              if (!allOrdersMap.has(order.id)) {
                allOrdersMap.set(order.id, order);
              }
            });
          }
          
          // Convert Map to Array and sort by date (newest first)
          const ordersArray = Array.from(allOrdersMap.values());
          ordersArray.sort((a, b) => {
            const dateA = a.submissionDate?.toDate ? a.submissionDate.toDate() : new Date(a.submissionDate || a.createdAt || 0);
            const dateB = b.submissionDate?.toDate ? b.submissionDate.toDate() : new Date(b.submissionDate || b.createdAt || 0);
            return dateB - dateA; // Descending order (newest first)
          });
          
          associatedOrders.value = ordersArray;
          console.log('✅ Loaded associated orders:', ordersArray.length);
          console.log('✅ Order details:', ordersArray.map(o => ({
            id: o.id,
            orderNumber: o.orderNumber,
            submissionDate: o.submissionDate,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt
          })));
        } catch (error) {
          console.error('Error loading associated orders:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to load associated orders',
            caption: error.message,
          });
        } finally {
          loadingOrders.value = false;
        }
      } else {
        associatedOrders.value = [];
      }
    };

    // Show delete confirmation dialog
    const showDeleteDialog = () => {
      if (selectedPhotos.value.length === 0) {
        $q.notify({
          type: 'warning',
          message: 'Please select at least one photo',
        });
        return;
      }
      
      deleteAssociatedOrders.value = false;
      associatedOrders.value = [];
      showDeleteConfirm.value = true;
    };

    // Format date for display
    const formatDate = (dateValue) => {
      if (!dateValue) return 'N/A';
      try {
        const date = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch (error) {
        return String(dateValue);
      }
    };

    // Get status color for chip
    const getStatusColor = (status) => {
      const statusLower = status?.toLowerCase() || '';
      if (statusLower.includes('completed') || statusLower.includes('fulfilled')) {
        return 'green';
      } else if (statusLower.includes('pending') || statusLower.includes('processing')) {
        return 'orange';
      } else if (statusLower.includes('cancelled') || statusLower.includes('failed')) {
        return 'red';
      }
      return 'grey';
    };

    // Confirm and execute deletion
    const confirmDelete = async () => {
      deleting.value = true;
      
      try {
        const ordersToDelete = new Set();
        
        // Delete photos from Storage
        for (const selectedPhoto of selectedPhotos.value) {
          const photo = selectedPhoto.photo;
          
          // Delete from Storage if URL exists
          if (photo.url && photo.url.startsWith('http')) {
            try {
              await firebaseService.deletePhotoFromStorage(photo.url);
            } catch (error) {
              console.error('Error deleting photo from Storage:', error);
              // Continue with other deletions even if one fails
            }
          }
          
          // Track orders that contain this photo
          if (deleteAssociatedOrders.value) {
            const orders = await firebaseService.findOrdersWithPhoto(photo.url, photo.name);
            orders.forEach(order => ordersToDelete.add(order.id));
          }
        }
        
        // Delete associated orders if requested
        if (deleteAssociatedOrders.value && ordersToDelete.size > 0) {
          for (const orderId of ordersToDelete) {
            try {
              await firebaseService.deleteOrder(orderId);
            } catch (error) {
              console.error('Error deleting order:', error);
              // Continue with other deletions even if one fails
            }
          }
        }
        
        $q.notify({
          type: 'positive',
          message: `Deleted ${selectedPhotos.value.length} photo${selectedPhotos.value.length !== 1 ? 's' : ''}`,
          caption: deleteAssociatedOrders.value && ordersToDelete.size > 0
            ? `Also deleted ${ordersToDelete.size} associated order${ordersToDelete.size !== 1 ? 's' : ''}`
            : '',
        });
        
        // Clear selection and reload photos
        selectedPhotos.value = [];
        showDeleteConfirm.value = false;
        await loadAllPhotos();
      } catch (error) {
        console.error('Error deleting photos:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete photos',
          caption: error.message,
        });
      } finally {
        deleting.value = false;
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
      displayedPhotos,
      hasMorePhotos,
      loadMorePhotos,
      selectedPhotos,
      selectedPhotosCount,
      showDeleteConfirm,
      deleteAssociatedOrders,
      associatedOrders,
      loadingOrders,
      deleting,
      getPhotoUrl,
      handleImageError,
      isPhotoSelected,
      togglePhotoSelection,
      showDeleteDialog,
      onDeleteOrdersToggle,
      confirmDelete,
      formatDate,
      getStatusColor,
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
    border-color: $negative;
    box-shadow: 0 0 0 2px rgba($negative, 0.3);
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

.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>

