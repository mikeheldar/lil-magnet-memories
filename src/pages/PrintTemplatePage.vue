<template>
  <q-page class="q-pa-md bg-grey-2">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary">
        Print Template - Order #{{ orderNumber }}
      </div>
      <div class="q-mt-md">
        <q-btn
          color="primary"
          icon="print"
          label="Print"
          @click="window.print()"
        />
        <q-btn
          flat
          label="Back to Orders"
          @click="$router.push('/orders')"
          class="q-ml-sm"
        />
        <q-btn
          flat
          label="Reset All Images"
          @click="resetAllTransforms"
          class="q-ml-sm"
        />
      </div>
      <div class="q-mt-sm text-caption text-grey-7">
        Click and drag to pan, scroll to zoom. Changes apply to all copies of
        the same image.
      </div>
    </div>

    <!-- Print Pages Container -->
    <div class="print-container">
      <!-- Generate pages (6 photos per page) -->
      <div
        v-for="(page, pageIndex) in pages"
        :key="pageIndex"
        class="print-page"
      >
        <div class="print-grid">
          <div
            v-for="(photo, gridIndex) in 6"
            :key="`${pageIndex}-${gridIndex}`"
            class="print-square"
          >
            <div
              v-if="page[gridIndex]"
              class="image-wrapper"
              :style="getImageStyle(page[gridIndex])"
              @mousedown="startDrag($event, page[gridIndex])"
              @touchstart.prevent="startDrag($event, page[gridIndex])"
              @wheel.prevent="handleWheel($event, page[gridIndex])"
            >
              <img
                :src="page[gridIndex].url"
                :alt="page[gridIndex].name || `Photo ${gridIndex + 1}`"
                class="print-image"
                draggable="false"
              />
            </div>
          </div>
        </div>
        <div class="print-footer">
          Order #{{ orderNumber }} - Page {{ pageIndex + 1 }} of
          {{ pages.length }}
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'PrintTemplatePage',
  setup() {
    const route = useRoute();
    const photos = ref([]);
    const orderNumber = ref('');

    // Transformation tracking: map photo URL to transform state
    const photoTransforms = ref({});

    // Drag state
    const isDragging = ref(false);
    const dragPhoto = ref(null); // Store the photo object being dragged
    const dragPhotoUrl = ref(null);
    const dragStartX = ref(0);
    const dragStartY = ref(0);
    const dragStartTransform = ref({ scale: 1, x: 0, y: 0 });

    // Get unique photo identifier
    const getPhotoKey = (photo) => {
      return photo.url || photo.name || 'unknown';
    };

    // Initialize transform for a photo if not exists
    const getTransform = (photo) => {
      const key = getPhotoKey(photo);
      if (!photoTransforms.value[key]) {
        photoTransforms.value[key] = {
          scale: 1,
          x: 0,
          y: 0,
        };
      }
      return photoTransforms.value[key];
    };

    // Apply transform to all instances of this photo
    const updateTransform = (photo, updates) => {
      const key = getPhotoKey(photo);
      if (!photoTransforms.value[key]) {
        photoTransforms.value[key] = { scale: 1, x: 0, y: 0 };
      }
      Object.assign(photoTransforms.value[key], updates);
    };

    // Get CSS transform style for an image
    const getImageStyle = (photo) => {
      const transform = getTransform(photo);
      return {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: 'center center',
        transition: isDragging.value ? 'none' : 'transform 0.1s ease-out',
      };
    };

    // Document-level drag handlers (mouse)
    const handleDocumentMouseMove = (event) => {
      if (isDragging.value && dragPhoto.value) {
        handleDrag(event, dragPhoto.value);
      }
    };

    const handleDocumentMouseUp = () => {
      if (isDragging.value) {
        endDrag();
      }
    };

    // Check if touch point is within any image wrapper's bounding box
    const isTouchOverImageArea = (clientX, clientY) => {
      const imageWrappers = document.querySelectorAll('.image-wrapper');
      for (const wrapper of imageWrappers) {
        const rect = wrapper.getBoundingClientRect();
        // Add a small buffer (20px) around the wrapper for easier dragging
        const buffer = 20;
        if (
          clientX >= rect.left - buffer &&
          clientX <= rect.right + buffer &&
          clientY >= rect.top - buffer &&
          clientY <= rect.bottom + buffer
        ) {
          return true;
        }
      }
      return false;
    };

    // Document-level drag handlers (touch)
    const handleDocumentTouchMove = (event) => {
      if (isDragging.value && dragPhoto.value && event.touches.length === 1) {
        const touch = event.touches[0];
        const isOverImage = isTouchOverImageArea(touch.clientX, touch.clientY);
        
        // Only prevent scrolling if touch is over an image wrapper area
        if (isOverImage) {
          handleDrag(event.touches[0], dragPhoto.value);
          event.preventDefault(); // Prevent scrolling while dragging over image
        } else {
          // Touch moved outside image area - allow scrolling and end drag
          endDrag();
        }
      }
    };

    const handleDocumentTouchEnd = () => {
      if (isDragging.value) {
        endDrag();
      }
    };

    // Start dragging
    const startDrag = (event, photo) => {
      // Handle mouse events - only left button
      if (event.type === 'mousedown' && event.button !== 0) {
        return;
      }

      // For touch events, only handle single touch (multi-touch is for pinch zoom)
      if (event.type === 'touchstart' && event.touches.length !== 1) {
        return;
      }

      isDragging.value = true;
      dragPhoto.value = photo;
      dragPhotoUrl.value = getPhotoKey(photo);

      // Get coordinates from either mouse or touch event
      const clientX =
        event.clientX || (event.touches && event.touches[0].clientX);
      const clientY =
        event.clientY || (event.touches && event.touches[0].clientY);

      dragStartX.value = clientX;
      dragStartY.value = clientY;
      const transform = getTransform(photo);
      dragStartTransform.value = { ...transform };

      // Attach document-level listeners for smooth dragging
      if (event.type === 'mousedown') {
        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);
      } else if (event.type === 'touchstart') {
        document.addEventListener('touchmove', handleDocumentTouchMove, {
          passive: false,
        });
        document.addEventListener('touchend', handleDocumentTouchEnd);
      }

      event.preventDefault();
    };

    // Calculate max translation based on scale and container size
    // Container is 2.6in = ~249.6px at 96dpi
    const getMaxTranslate = (scale) => {
      const containerSize = 249.6; // 2.6in in pixels at 96dpi
      // Allow base movement of 100px even at scale 1, and more as we zoom in
      // At scale 1: 100px movement (allows panning even when not zoomed)
      // At scale 2: 100 + 124.8 = ~225px movement
      // At scale 3: 100 + 249.6 = ~350px movement
      const baseMovement = 100;
      const scaleBasedMovement = (containerSize / 2) * (scale - 1);
      return baseMovement + Math.max(0, scaleBasedMovement);
    };

    // Handle dragging (works with both mouse events and touch objects)
    const handleDrag = (eventOrTouch, photo) => {
      if (!isDragging.value || !photo || !dragPhoto.value) {
        return;
      }

      // Verify we're dragging the correct photo
      if (getPhotoKey(photo) !== dragPhotoUrl.value) {
        return;
      }

      // Get coordinates from either mouse event or touch object
      // Both have clientX/clientY directly
      const clientX = eventOrTouch.clientX;
      const clientY = eventOrTouch.clientY;

      if (clientX === undefined || clientY === undefined) {
        return;
      }

      const deltaX = clientX - dragStartX.value;
      const deltaY = clientY - dragStartY.value;

      const transform = dragStartTransform.value;
      const maxTranslate = getMaxTranslate(transform.scale);

      // Clamp translation to keep image within bounds
      const newX = Math.max(
        -maxTranslate,
        Math.min(maxTranslate, transform.x + deltaX)
      );
      const newY = Math.max(
        -maxTranslate,
        Math.min(maxTranslate, transform.y + deltaY)
      );

      updateTransform(photo, { x: newX, y: newY });
    };

    // End dragging
    const endDrag = () => {
      // Remove document-level listeners (both mouse and touch)
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);

      isDragging.value = false;
      dragPhoto.value = null;
      dragPhotoUrl.value = null;
    };

    // Handle wheel zoom
    const handleWheel = (event, photo) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const transform = getTransform(photo);
      const newScale = Math.max(0.5, Math.min(3, transform.scale + delta));

      // When zooming, adjust position to zoom toward cursor
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      // Calculate new position to zoom toward cursor
      // The factor of 0.3 provides smooth zoom-to-cursor behavior
      const scaleDiff = newScale - transform.scale;
      const newX = transform.x - x * scaleDiff * 0.3;
      const newY = transform.y - y * scaleDiff * 0.3;

      // Clamp position using the new scale
      const maxTranslate = getMaxTranslate(newScale);
      const clampedX = Math.max(-maxTranslate, Math.min(maxTranslate, newX));
      const clampedY = Math.max(-maxTranslate, Math.min(maxTranslate, newY));

      updateTransform(photo, {
        scale: newScale,
        x: clampedX,
        y: clampedY,
      });
    };

    // Reset all transformations
    const resetAllTransforms = () => {
      photoTransforms.value = {};
    };

    // Parse photos and quantities from query parameters
    const parseOrderData = () => {
      try {
        const photosParam = route.query.photos;
        const quantitiesParam = route.query.quantities;

        const parsedPhotos = photosParam ? JSON.parse(photosParam) : [];
        const parsedQuantities = quantitiesParam
          ? JSON.parse(quantitiesParam)
          : [];

        // Expand photos based on quantities
        const expandedPhotos = [];
        parsedPhotos.forEach((photo, index) => {
          const quantity = parsedQuantities[index] || 1;
          // Add the photo the number of times specified by quantity
          for (let i = 0; i < quantity; i++) {
            expandedPhotos.push(photo);
          }
        });

        photos.value = expandedPhotos;

        if (route.query.orderNumber) {
          orderNumber.value = route.query.orderNumber;
        }

        console.log(
          'Parsed photos (expanded):',
          photos.value.length,
          'total photos'
        );
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    };

    // Organize photos into pages (6 per page)
    const pages = computed(() => {
      const pagesArray = [];
      const photosPerPage = 6;

      for (let i = 0; i < photos.value.length; i += photosPerPage) {
        const pagePhotos = photos.value.slice(i, i + photosPerPage);
        // Pad with nulls if less than 6 photos
        while (pagePhotos.length < photosPerPage) {
          pagePhotos.push(null);
        }
        pagesArray.push(pagePhotos);
      }

      return pagesArray;
    });

    onMounted(() => {
      parseOrderData();
    });

    onUnmounted(() => {
      // Clean up document listeners if component unmounts while dragging
      if (isDragging.value) {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        document.removeEventListener('touchmove', handleDocumentTouchMove);
        document.removeEventListener('touchend', handleDocumentTouchEnd);
      }
    });

    return {
      photos,
      orderNumber,
      pages,
      photoTransforms,
      isDragging,
      getImageStyle,
      startDrag,
      handleDrag,
      endDrag,
      handleWheel,
      resetAllTransforms,
    };
  },
};
</script>

<style scoped>
/* Print-specific styles */
@media print {
  body {
    margin: 0;
    padding: 0;
  }

  .q-page {
    background: white;
    padding: 0;
  }

  .text-center,
  .q-btn {
    display: none !important;
  }

  .print-container {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .print-page {
    width: 8.5in;
    height: 11in;
    page-break-after: always;
    margin: 0;
    padding: 0.75in 1in 1in 1in;
    background: white;
    border: none;
    display: flex;
    flex-direction: column;
  }

  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 2.6in);
    grid-template-rows: repeat(3, 2.6in);
    gap: 0.55in;
    justify-content: center;
    flex: 1 1 auto;
    min-height: 0;
    margin-bottom: 0.3in;
  }

  .print-square {
    width: 2.6in;
    height: 2.6in;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: white;
    position: relative;
  }

  .image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .image-wrapper:active {
    cursor: grabbing;
  }

  .print-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .print-footer {
    text-align: center;
    padding-top: 0.4in;
    font-size: 10pt;
    color: #666;
    border-top: 1px solid #ccc;
    margin-top: 0.2in;
    flex-shrink: 0;
  }
}

/* Screen styles */
@media screen {
  .print-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
  }

  .print-page {
    width: 8.5in;
    height: 11in;
    background: white;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    padding: 0.75in 1in 1in 1in;
    border: 1px solid #ddd;
  }

  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, 2.6in);
    grid-template-rows: repeat(3, 2.6in);
    gap: 0.55in;
    justify-content: center;
    flex: 1 1 auto;
    min-height: 0;
    margin-bottom: 0.3in;
  }

  .print-square {
    width: 2.6in;
    height: 2.6in;
    border: 1px solid #333;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: white;
    position: relative;
  }

  .image-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .image-wrapper:active {
    cursor: grabbing;
  }

  .print-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }

  .print-footer {
    text-align: center;
    padding-top: 0.4in;
    font-size: 10pt;
    color: #666;
    border-top: 1px solid #ddd;
    margin-top: 0.2in;
    flex-shrink: 0;
  }
}
</style>
