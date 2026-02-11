<template>
  <q-page class="q-pa-md print-template-page">
    <div class="text-center q-mb-lg no-print">
      <div v-if="orderNumber" class="text-body1 text-grey-7 q-mb-sm">
        Order #{{ orderNumber }}
      </div>
      <div class="q-mt-md">
        <q-btn
          color="primary"
          icon="print"
          label="Print"
          @click="handlePrint"
        />
        <q-btn
          flat
          icon="arrow_back"
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
        class="print-page-wrapper"
      >
        <div class="print-controls">
          <div class="controls-header">Fine Adjustments</div>
          <div class="controls-subheader">
            <span class="label">Selected:</span>
            <span class="value" :title="selectedPhotoLabel">{{ selectedPhotoLabel }}</span>
          </div>
          <div class="controls-group">
            <div class="controls-row">
              <q-btn
                dense
                round
                icon="zoom_in"
                color="primary"
                @click="adjustScale(zoomStep)"
                :disable="!selectedPhotoKey"
              />
              <q-btn
                dense
                round
                icon="zoom_out"
                color="primary"
                @click="adjustScale(-zoomStep)"
                :disable="!selectedPhotoKey"
              />
            </div>
            <div class="controls-row move-controls">
              <q-btn
                dense
                round
                icon="keyboard_arrow_up"
                color="primary"
                @click="adjustPosition('y', moveStep * -1)"
                :disable="!selectedPhotoKey"
              />
              <div class="controls-row-horizontal">
                <q-btn
                  dense
                  round
                  icon="keyboard_arrow_left"
                  color="primary"
                  @click="adjustPosition('x', moveStep * -1)"
                  :disable="!selectedPhotoKey"
                />
                <q-btn
                  dense
                  round
                  icon="keyboard_arrow_right"
                  color="primary"
                  @click="adjustPosition('x', moveStep)"
                  :disable="!selectedPhotoKey"
                />
              </div>
              <q-btn
                dense
                round
                icon="keyboard_arrow_down"
                color="primary"
                @click="adjustPosition('y', moveStep)"
                :disable="!selectedPhotoKey"
              />
            </div>
            <div class="controls-row">
              <q-btn
                dense
                color="negative"
                icon="restart_alt"
                label="Reset Selected"
                @click="resetSelectedTransform"
                :disable="!selectedPhotoKey"
              />
            </div>
            <div class="controls-row q-mt-sm">
              <q-btn
                dense
                color="primary"
                icon="zoom_in"
                label="Auto Zoom"
                @click="autoZoom"
                :disable="!selectedPhotoKey"
              />
            </div>
          </div>
          <!-- Color Controls -->
          <div class="controls-group q-mt-md" style="border-top: 1px solid #d0d0d0; padding-top: 0.75rem;">
            <div class="controls-header" style="font-size: 0.9rem;">Color Adjustments</div>
            <div class="q-mt-sm">
              <div class="text-caption q-mb-xs">Brightness</div>
              <q-slider
                v-model="getColorSettings().brightness"
                :min="0"
                :max="200"
                :step="1"
                :label-value="`${getColorSettings().brightness}%`"
                @update:model-value="updateColorSettings"
                :disable="!selectedPhotoKey"
                dense
              />
            </div>
            <div class="q-mt-sm">
              <div class="text-caption q-mb-xs">Contrast</div>
              <q-slider
                v-model="getColorSettings().contrast"
                :min="0"
                :max="200"
                :step="1"
                :label-value="`${getColorSettings().contrast}%`"
                @update:model-value="updateColorSettings"
                :disable="!selectedPhotoKey"
                dense
              />
            </div>
            <div class="q-mt-sm">
              <div class="text-caption q-mb-xs">Saturation</div>
              <q-slider
                v-model="getColorSettings().saturation"
                :min="0"
                :max="200"
                :step="1"
                :label-value="`${getColorSettings().saturation}%`"
                @update:model-value="updateColorSettings"
                :disable="!selectedPhotoKey"
                dense
              />
            </div>
            <div class="controls-row q-mt-sm">
              <q-btn
                dense
                color="primary"
                icon="restart_alt"
                label="Reset Color"
                @click="resetColorSettings"
                :disable="!selectedPhotoKey"
              />
            </div>
          </div>
        </div>
        <div class="print-page">
          <div class="print-grid">
            <div
              v-for="(photo, gridIndex) in 6"
              :key="`${pageIndex}-${gridIndex}`"
              class="print-square-container"
            >
              <!-- Outer cutting square template -->
              <svg class="outer-frame primary" viewBox="0 0 100 100">
                <rect
                  x="0.5"
                  y="0.5"
                  width="99"
                  height="99"
                  rx="0.5"
                  ry="0.5"
                />
              </svg>
              <svg class="outer-frame secondary" viewBox="0 0 100 100">
                <rect
                  x="0.5"
                  y="0.5"
                  width="99"
                  height="99"
                  rx="0.5"
                  ry="0.5"
                />
              </svg>

              <!-- Corner triangles for cutting alignment -->
              <div class="corner-triangle corner-triangle-top-left"></div>
              <div class="corner-triangle corner-triangle-top-right"></div>
              <div class="corner-triangle corner-triangle-bottom-left"></div>
              <div class="corner-triangle corner-triangle-bottom-right"></div>

              <!-- Border text labels -->
              <div class="border-text border-text-top">Li'l Magnet Memories</div>
              <div class="border-text border-text-bottom">Li'l Magnet Memories</div>
              <div class="border-text border-text-left">lilmagnetmemories.com</div>
              <div class="border-text border-text-right">lilmagnetmemories.com</div>

              <!-- Inner square frame for image -->
              <div
                class="print-square"
                :class="{
                  'selected-photo': isPhotoSelected(page[gridIndex]),
                  'test-environment': isTestEnvironment
                }"
              >
                <!-- Guide lines for test environment - window with window effect -->
                <svg
                  v-if="isTestEnvironment"
                  class="guide-lines"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <!-- Horizontal lines (two parallel lines) -->
                  <line
                    x1="0"
                    y1="33.33"
                    x2="100"
                    y2="33.33"
                    stroke="#ffffff"
                    stroke-width="0.3"
                    vector-effect="non-scaling-stroke"
                  />
                  <line
                    x1="0"
                    y1="66.67"
                    x2="100"
                    y2="66.67"
                    stroke="#ffffff"
                    stroke-width="0.3"
                    vector-effect="non-scaling-stroke"
                  />
                  <!-- Vertical lines (two parallel lines) -->
                  <line
                    x1="33.33"
                    y1="0"
                    x2="33.33"
                    y2="100"
                    stroke="#ffffff"
                    stroke-width="0.3"
                    vector-effect="non-scaling-stroke"
                  />
                  <line
                    x1="66.67"
                    y1="0"
                    x2="66.67"
                    y2="100"
                    stroke="#ffffff"
                    stroke-width="0.3"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
                <div
                  v-if="page[gridIndex]"
                  class="image-wrapper"
                  :style="getImageStyle(page[gridIndex])"
                  @mousedown="startDrag($event, page[gridIndex])"
                  @touchstart="startDrag($event, page[gridIndex])"
                  @wheel.prevent="handleWheel($event, page[gridIndex])"
                  @click.stop="selectPhoto(page[gridIndex])"
                >
                  <img
                    :src="getImageSource(page[gridIndex])"
                    :alt="page[gridIndex].name || `Photo ${gridIndex + 1}`"
                    class="print-image"
                    draggable="false"
                    @load="handleImageLoad($event, page[gridIndex])"
                    @error="handleImageError($event, page[gridIndex])"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from 'quasar';
import { config } from '../config/environment.js';

export default {
  name: 'PrintTemplatePage',
  setup() {
    useMeta({
      title: 'Print Template - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Print template for custom photo magnets. Optimized layout for printing customer orders.'
        },
        robots: {
          name: 'robots',
          content: 'noindex, nofollow'
        }
      }
    });

    const route = useRoute();
    const photos = ref([]);
    const orderNumber = ref('');

    // Transformation tracking: map photo URL to transform state
    const photoTransforms = ref({});
    const selectedPhotoKey = ref(null);

    const INNER_SQUARE_SIZE_INCHES = 2.5625; // 2 9/16 inches target print size
    const INNER_SQUARE_SIZE_PX = INNER_SQUARE_SIZE_INCHES * 96;
    const ZOOM_STEP = 0.05;
    const MOVE_STEP = 5;

    // Drag state
    const isDragging = ref(false);
    const dragPhoto = ref(null); // Store the photo object being dragged
    const dragPhotoUrl = ref(null);
    const dragStartX = ref(0);
    const dragStartY = ref(0);
    const dragStartTransform = ref({ scale: 1, x: 0, y: 0 });
    const hasMoved = ref(false); // Track if touch has moved (to distinguish drag from scroll attempt)

    // Color settings for photos
    const photoColorSettings = ref({}); // key -> { brightness, contrast, saturation }

    // Image dimensions storage: key -> { width, height }
    const photoDimensions = ref({});

    // Get unique photo identifier
    const getPhotoKey = (photo) => {
      return photo.url || photo.name || 'unknown';
    };

    // Calculate scale for normal mode (contain - fits long dimension, whitespace on short)
    const calculateNormalScale = (imgWidth, imgHeight) => {
      const containerSize = INNER_SQUARE_SIZE_PX;
      const scaleX = containerSize / imgWidth;
      const scaleY = containerSize / imgHeight;
      // Use smaller scale to fit entire image (contain behavior)
      return Math.min(scaleX, scaleY);
    };

    // Calculate scale to fill square completely (touches all four sides, no whitespace)
    const calculateAutoScale = (imgWidth, imgHeight) => {
      const containerSize = INNER_SQUARE_SIZE_PX;
      const scaleX = containerSize / imgWidth;
      const scaleY = containerSize / imgHeight;
      // Use larger scale to ensure image touches all four sides of the blue inner square
      return Math.max(scaleX, scaleY);
    };

    // Extract storage path from Firebase Storage URL
    const extractStoragePath = (url) => {
      try {
        const urlObj = new URL(url);
        // Firebase Storage URLs have format: /v0/b/{bucket}/o/{path}?alt=media&token=...
        // The path is URL-encoded, so we need to decode it
        const match = urlObj.pathname.match(/\/o\/(.+?)(?:\?|$)/);
        if (match && match[1]) {
          // Decode the path (handles %2F for slashes, etc.)
          const decodedPath = decodeURIComponent(match[1]);
          return decodedPath;
        }
      } catch (e) {
        console.warn('Failed to extract path from URL:', url, e);
      }
      return null;
    };

    // Refresh expired Firebase Storage URL
    const refreshPhotoUrl = async (photo) => {
      try {
        // Try to get path from photo.fullPath first, then extract from URL
        let path = photo.fullPath;
        if (!path && photo.url) {
          path = extractStoragePath(photo.url);
        }

        if (!path) {
          console.warn('⚠️ Cannot refresh URL: no path available for photo:', photo?.name);
          return null;
        }

        // Ensure storage is initialized by getting the instance
        const { getStorage: getStorageInstance } = await import('firebase/storage');
        const { default: getApp } = await import('../firebase/config.js');
        const storageInstance = getStorageInstance(getApp());
        
        // Get fresh download URL from Firebase Storage
        const fileRef = storageRef(storageInstance, path);
        
        if (!fileRef) {
          console.error('❌ Failed to create storage reference for path:', path);
          return null;
        }
        
        const freshUrl = await getDownloadURL(fileRef);
        
        console.log('✅ Refreshed URL for photo:', photo?.name);
        return freshUrl;
      } catch (error) {
        console.error('❌ Failed to refresh URL for photo:', photo?.name, error);
        if (error.code) {
          console.error('Error code:', error.code);
        }
        return null;
      }
    };

    // Get image source with proper fallback handling
    const getImageSource = (photo) => {
      if (!photo) return '';

      // Filter out blob URLs - they're temporary and won't work
      if (photo.url && photo.url.startsWith('blob:')) {
        console.warn('⚠️ Photo has blob URL (temporary, will not work):', {
          name: photo.name,
          blobUrl: photo.url,
          hasPreview: !!photo.preview,
        });
        // Try preview if available
        if (photo.preview && !photo.preview.startsWith('blob:')) {
          return photo.preview;
        }
        // Return empty to trigger error handler
        return '';
      }

      // Prefer Firebase Storage URL, fallback to preview
      if (photo.url && photo.url.startsWith('http')) {
        try {
          // Verify URL is valid
          new URL(photo.url);
          return photo.url;
        } catch (e) {
          console.warn('⚠️ Invalid URL format:', photo.url, e);
          // Try preview as fallback
          if (photo.preview && !photo.preview.startsWith('blob:')) {
            return photo.preview;
          }
          return '';
        }
      }

      // Fallback to preview if available
      if (photo.preview && !photo.preview.startsWith('blob:')) {
        return photo.preview;
      }

      return photo.url || photo.preview || '';
    };

    // Handle image loading errors
    const handleImageError = async (event, photo) => {
      const failedSrc = event.target.src;
      const photoName = photo?.name || 'Unknown';

      console.error('❌ Failed to load photo in PrintTemplate:', {
        name: photoName,
        failedSource: failedSrc,
        hasUrl: !!photo?.url,
        url: photo?.url,
        hasPreview: !!photo?.preview,
        isBlobUrl: failedSrc.startsWith('blob:'),
      });

      // Try to refresh expired Firebase Storage URL first
      if (failedSrc && failedSrc.includes('firebasestorage.googleapis.com')) {
        const freshUrl = await refreshPhotoUrl(photo);
        if (freshUrl && event.target) {
          event.target.src = freshUrl;
          return; // Successfully refreshed, exit early
        }
      }

      // Try fallback if available
      if (photo?.url && photo.url !== failedSrc && !photo.url.startsWith('blob:')) {
        console.log('⚠️ Trying fallback URL for:', photoName);
        event.target.src = photo.url;
      } else if (
        photo?.preview &&
        photo.preview !== failedSrc &&
        !photo.preview.startsWith('blob:')
      ) {
        console.log('⚠️ Trying fallback preview for:', photoName);
        event.target.src = photo.preview;
      } else {
        console.error('❌ All image sources failed for photo:', photoName);
        // Image will show broken image icon
      }
    };

    // Handle image load to set initial scale and store dimensions
    const handleImageLoad = (event, photo) => {
      const img = event.target;
      const key = getPhotoKey(photo);
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Store dimensions for later use
      if (naturalWidth > 0 && naturalHeight > 0) {
        photoDimensions.value[key] = {
          width: naturalWidth,
          height: naturalHeight,
        };
      }

      // Only set initial scale if transform doesn't exist yet (first load)
      if (!photoTransforms.value[key]) {
        if (naturalWidth > 0 && naturalHeight > 0) {
          // Default to normal mode (contain)
          const initialScale = calculateNormalScale(naturalWidth, naturalHeight);
          photoTransforms.value[key] = {
            scale: initialScale,
            x: 0,
            y: 0,
          };
          // Default to normal mode (false = normal/contain)
          photoAutoScaleMode.value[key] = false;
        } else {
          // Fallback if dimensions not available
          photoTransforms.value[key] = {
            scale: 1,
            x: 0,
            y: 0,
          };
          photoAutoScaleMode.value[key] = false;
        }
      }
    };

    // Auto zoom to fill square - zooms until image touches all four blue sides (no whitespace)
    const autoZoom = () => {
      if (!selectedPhotoKey.value) {
        return;
      }

      const key = selectedPhotoKey.value;
      const dimensions = photoDimensions.value[key];

      if (!dimensions) {
        return; // Can't zoom if dimensions not available
      }

      const containerSize = INNER_SQUARE_SIZE_PX;
      const imgWidth = dimensions.width;
      const imgHeight = dimensions.height;

      // Calculate what the displayed size would be with object-fit: contain
      // (image is 100% width/height of container, scaled to fit)
      const aspectRatio = imgWidth / imgHeight;
      let displayedWidth, displayedHeight;

      if (aspectRatio > 1) {
        // Landscape: width fills container
        displayedWidth = containerSize;
        displayedHeight = containerSize / aspectRatio;
      } else {
        // Portrait: height fills container
        displayedWidth = containerSize * aspectRatio;
        displayedHeight = containerSize;
      }

      // Calculate scale needed to make displayed image fill the square (cover behavior)
      const scaleX = containerSize / displayedWidth;
      const scaleY = containerSize / displayedHeight;
      const newScale = Math.max(scaleX, scaleY);

      // Update transform with new scale, reset position to center
      updateTransformByKey(key, {
        scale: newScale,
        x: 0,
        y: 0,
      });
    };

    // Initialize transform for a photo if not exists
    const getTransformByKey = (key) => {
      if (!key) {
        return { scale: 1, x: 0, y: 0 };
      }
      if (!photoTransforms.value[key]) {
        photoTransforms.value[key] = {
          scale: 1,
          x: 0,
          y: 0,
        };
      }
      return photoTransforms.value[key];
    };

    const getTransform = (photo) => {
      const key = getPhotoKey(photo);
      return getTransformByKey(key);
    };

    // Apply transform to all instances of this photo
    const updateTransformByKey = (key, updates) => {
      if (!key) {
        return;
      }
      const transform = getTransformByKey(key);
      Object.assign(transform, updates);
    };

    const updateTransform = (photo, updates) => {
      const key = getPhotoKey(photo);
      updateTransformByKey(key, updates);
    };

    const selectPhoto = (photo) => {
      if (!photo) {
        selectedPhotoKey.value = null;
        return;
      }
      const key = getPhotoKey(photo);
      selectedPhotoKey.value = key;
      getTransformByKey(key);
    };

    const isPhotoSelected = (photo) => {
      if (!photo) {
        return false;
      }
      return selectedPhotoKey.value === getPhotoKey(photo);
    };

    const findPhotoByKey = (key) =>
      photos.value.find((p) => getPhotoKey(p) === key);

    const selectedPhotoLabel = computed(() => {
      if (!selectedPhotoKey.value) {
        return 'None';
      }
      const photo = findPhotoByKey(selectedPhotoKey.value);
      if (!photo) {
        return 'Photo';
      }
      return photo.name || photo.displayName || 'Photo';
    });

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

    // Get CSS transform style for an image
    const getImageStyle = (photo) => {
      const transform = getTransform(photo);
      const colorSettings = getColorSettingsByKey(getPhotoKey(photo));
      const filter = `brightness(${colorSettings.brightness}%) contrast(${colorSettings.contrast}%) saturate(${colorSettings.saturation}%)`;
      return {
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        transformOrigin: 'center center',
        transition: isDragging.value ? 'none' : 'transform 0.1s ease-out',
        filter: filter,
      };
    };

    // Color settings management
    const getColorSettingsByKey = (key) => {
      if (!key) {
        return { brightness: 100, contrast: 100, saturation: 100 };
      }
      if (!photoColorSettings.value[key]) {
        photoColorSettings.value[key] = {
          brightness: 100,
          contrast: 100,
          saturation: 100,
        };
      }
      return photoColorSettings.value[key];
    };

    const getColorSettings = () => {
      if (!selectedPhotoKey.value) {
        return { brightness: 100, contrast: 100, saturation: 100 };
      }
      return getColorSettingsByKey(selectedPhotoKey.value);
    };

    const updateColorSettings = () => {
      // Settings are already updated via v-model
      // This function is called to trigger reactivity if needed
    };

    const resetColorSettings = () => {
      if (selectedPhotoKey.value) {
        photoColorSettings.value[selectedPhotoKey.value] = {
          brightness: 100,
          contrast: 100,
          saturation: 100,
        };
      }
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

        // Check if touch has moved enough to be considered a drag (vs a scroll)
        const deltaX = touch.clientX - dragStartX.value;
        const deltaY = touch.clientY - dragStartY.value;
        const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Only consider it a drag if moved more than 5px
        if (movement > 5) {
          hasMoved.value = true;
        }

        // Only prevent scrolling if touch is over an image wrapper area AND we've detected movement
        if (isOverImage && hasMoved.value) {
          handleDrag(event.touches[0], dragPhoto.value);
          event.preventDefault(); // Prevent scrolling while dragging over image
        } else {
          // Touch moved outside image area or not enough movement yet - allow scrolling
          // Don't end drag here - keep it active in case they come back over an image
          // The drag will end naturally on touchend
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
      hasMoved.value = false;
      dragPhoto.value = photo;
      dragPhotoUrl.value = getPhotoKey(photo);
      selectPhoto(photo);

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
        event.preventDefault(); // Prevent default for mouse
      } else if (event.type === 'touchstart') {
        document.addEventListener('touchmove', handleDocumentTouchMove, {
          passive: false,
        });
        document.addEventListener('touchend', handleDocumentTouchEnd);
        // Don't prevent default on touchstart - let scrolling work naturally
        // We'll only prevent default on touchmove if actually dragging over image
      }
    };

    // Calculate max translation based on scale and container size
    // Container corresponds to the inner print square size
    const getMaxTranslate = (scale) => {
      const containerSize = INNER_SQUARE_SIZE_PX;
      // Allow base movement of 100px even at scale 1, and more as we zoom in
      // At scale 1: 100px movement (allows panning even when not zoomed)
      // At scale 2: increases based on container size
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

    const adjustScale = (delta) => {
      if (!selectedPhotoKey.value) {
        return;
      }
      const transform = { ...getTransformByKey(selectedPhotoKey.value) };
      const newScale = clamp(transform.scale + delta, 0.5, 3);
      const maxTranslate = getMaxTranslate(newScale);
      const clampedX = clamp(transform.x, -maxTranslate, maxTranslate);
      const clampedY = clamp(transform.y, -maxTranslate, maxTranslate);
      updateTransformByKey(selectedPhotoKey.value, {
        scale: newScale,
        x: clampedX,
        y: clampedY,
      });
    };

    const adjustPosition = (axis, delta) => {
      if (!selectedPhotoKey.value || (axis !== 'x' && axis !== 'y')) {
        return;
      }
      const transform = { ...getTransformByKey(selectedPhotoKey.value) };
      const maxTranslate = getMaxTranslate(transform.scale);
      const newValue = clamp(
        transform[axis] + delta,
        -maxTranslate,
        maxTranslate
      );
      updateTransformByKey(selectedPhotoKey.value, { [axis]: newValue });
    };

    const resetSelectedTransform = () => {
      if (!selectedPhotoKey.value) {
        return;
      }
      updateTransformByKey(selectedPhotoKey.value, { scale: 1, x: 0, y: 0 });
    };

    // End dragging
    const endDrag = () => {
      // Remove document-level listeners (both mouse and touch)
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
      document.removeEventListener('touchmove', handleDocumentTouchMove);
      document.removeEventListener('touchend', handleDocumentTouchEnd);

      isDragging.value = false;
      hasMoved.value = false;
      dragPhoto.value = null;
      dragPhotoUrl.value = null;
    };

    // Handle wheel zoom
    const handleWheel = (event, photo) => {
      event.preventDefault();
      selectPhoto(photo);
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

    // Handle print button click - open system print dialog
    const handlePrint = () => {
      window.print();
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

        if (expandedPhotos.length > 0) {
          selectedPhotoKey.value = getPhotoKey(expandedPhotos[0]);
        } else {
          selectedPhotoKey.value = null;
        }

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

    // Computed property for test environment check
    const isTestEnvironment = computed(() => {
      return config?.isTest === true;
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
      selectedPhotoKey,
      selectedPhotoLabel,
      selectPhoto,
      isPhotoSelected,
      adjustScale,
      adjustPosition,
      resetSelectedTransform,
      zoomStep: ZOOM_STEP,
      moveStep: MOVE_STEP,
      getImageStyle,
      startDrag,
      handleDrag,
      endDrag,
      handleWheel,
      resetAllTransforms,
      getColorSettings,
      updateColorSettings,
      resetColorSettings,
      handlePrint,
      getImageSource,
      handleImageError,
      handleImageLoad,
      autoZoom,
      isTestEnvironment, // Computed property for test environment check
    };
  },
};
</script>

<style>
@page {
  size: letter;
  margin: 0;
}

:root {
  --inner-square-size: 246px; /* 2 9/16 in at 96dpi */
  --outer-square-size: 313px;
  --outer-square-size-secondary: calc(var(--outer-square-size) + 7.6px);
  --triangle-size: 34px;
  --grid-gap: 19.2px;
  --page-padding-x: 43.2px; /* 0.45in */
  --page-padding-y: 14.4px; /* 0.15in */
}

/* Print-specific styles */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  html,
  body {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;
    overflow: visible !important;
  }

  /* Hide everything by default */
  body * {
    visibility: hidden !important;
  }

  /* Show only print container and its contents */
  .print-container,
  .print-container * {
    visibility: visible !important;
  }

  /* Explicitly hide screen-only elements */
  .no-print,
  .no-print *,
  .q-header,
  .q-layout__header,
  .q-toolbar,
  .q-drawer,
  .q-footer,
  .print-controls,
  .print-controls *,
  .print-page-wrapper > :first-child:not(.print-page) {
    display: none !important;
    visibility: hidden !important;
    position: absolute !important;
    left: -9999px !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
  }

  .print-container {
    position: static !important;
    display: block !important;
    width: 100% !important;
    height: auto !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  #q-app,
  .q-layout,
  .q-page-container,
  .q-page-container > *,
  .print-template-page {
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
    padding-top: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    padding-bottom: 0 !important;
    background: white !important;
    width: 100% !important;
    height: auto !important;
    transform: none !important;
    min-height: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }

  .q-page {
    padding: 0 !important;
    padding-top: 0 !important;
    padding-left: 0 !important;
    margin: 0 !important;
  }

  /* Override Quasar's inline layout offsets for header/drawer */
  .q-page-container {
    padding-top: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-top: 0 !important;
    margin-left: 0 !important;
    transform: none !important;
  }

  /* Hide Quasar layout sections that reserve space */
  .q-header,
  .q-layout__header,
  .q-drawer,
  .q-drawer-container,
  .q-drawer__backdrop,
  .q-layout__section--marginal,
  .q-footer {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    min-width: 0 !important;
    min-height: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
  }

  .print-controls {
    display: none !important;
    visibility: hidden !important;
    width: 0 !important;
    height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    overflow: hidden !important;
    max-width: 0 !important;
    max-height: 0 !important;
    min-width: 0 !important;
    min-height: 0 !important;
    flex: 0 0 0 !important;
  }

  .print-page-wrapper {
    display: block !important;
    width: 100% !important;
    page-break-inside: avoid !important;
    position: static !important;
    margin: 0 !important;
    padding: 0 !important;
    gap: 0 !important;
  }

  .print-page {
    width: 8.5in !important;
    height: 11in !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;
    margin: 0 auto !important;
    padding: var(--page-padding-y) var(--page-padding-x) !important;
    background: white !important;
    border: none !important;
    display: flex !important;
    flex-direction: column !important;
    position: static !important;
    left: 0 !important;
    top: 0 !important;
  }

  .print-page:last-child {
    page-break-after: auto !important;
  }

  .print-grid {
    display: grid !important;
    grid-template-columns: repeat(2, var(--outer-square-size)) !important;
    grid-template-rows: repeat(3, var(--outer-square-size)) !important;
    gap: var(--grid-gap) !important;
    justify-content: center !important;
    align-content: start !important;
    width: 100% !important;
    margin: 0 auto !important;
  }

  .print-square-container {
    width: var(--outer-square-size) !important;
    height: var(--outer-square-size) !important;
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    page-break-inside: avoid !important;
  }

  /* Outer cutting square template - dashed border for cutting guide */
  .outer-frame {
    position: absolute !important;
    width: var(--outer-square-size) !important;
    height: var(--outer-square-size) !important;
    pointer-events: none !important;
    z-index: 1 !important;
    top: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    left: 0 !important;
    margin: auto !important;
  }

  .outer-frame rect {
    fill: none !important;
    stroke: #333 !important;
    stroke-width: 1 !important;
    stroke-dasharray: 4 4 !important;
    vector-effect: non-scaling-stroke !important;
  }

  .outer-frame.secondary rect {
    stroke-dasharray: none !important;
  }

  .outer-frame.secondary {
    width: var(--outer-square-size-secondary) !important;
    height: var(--outer-square-size-secondary) !important;
    opacity: 0.6 !important;
    z-index: 0 !important;
    left: -3.5px !important;
    top: -2px !important;
    right: -2px !important;
    bottom: -2px !important;
    margin: auto !important;
  }

  .outer-frame.primary {
    left: -0.5px !important;
    top: 0 !important;
    right: auto !important;
    bottom: 0 !important;
    margin: 0 !important;
  }

  /* Corner triangles for cutting alignment */
  .corner-triangle {
    position: absolute !important;
    width: 0 !important;
    height: 0 !important;
    pointer-events: none !important;
    z-index: 3 !important;
  }

  .corner-triangle-top-left {
    top: 0 !important;
    left: 0 !important;
    border-top: var(--triangle-size) solid #333 !important;
    border-left: var(--triangle-size) solid #333 !important;
    border-right: var(--triangle-size) solid transparent !important;
    border-bottom: var(--triangle-size) solid transparent !important;
  }

  .corner-triangle-top-right {
    top: 0 !important;
    right: 0 !important;
    border-top: var(--triangle-size) solid #333 !important;
    border-right: var(--triangle-size) solid #333 !important;
    border-left: var(--triangle-size) solid transparent !important;
    border-bottom: var(--triangle-size) solid transparent !important;
  }

  .corner-triangle-bottom-left {
    bottom: 0 !important;
    left: 0 !important;
    border-bottom: var(--triangle-size) solid #333 !important;
    border-left: var(--triangle-size) solid #333 !important;
    border-right: var(--triangle-size) solid transparent !important;
    border-top: var(--triangle-size) solid transparent !important;
  }

  .corner-triangle-bottom-right {
    bottom: 0 !important;
    right: 0 !important;
    border-bottom: var(--triangle-size) solid #333 !important;
    border-right: var(--triangle-size) solid #333 !important;
    border-left: var(--triangle-size) solid transparent !important;
    border-top: var(--triangle-size) solid transparent !important;
  }

  /* Border text labels */
  .border-text {
    position: absolute !important;
    color: #333 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    letter-spacing: 0.5px !important;
    pointer-events: none !important;
    z-index: 2 !important;
    white-space: nowrap !important;
  }

  .border-text-top {
    top: calc(((var(--outer-square-size) - var(--inner-square-size)) / 3.8)) !important;
    left: 50% !important;
    transform: translate(-50%) rotate(180deg) !important;
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2) !important;
    text-align: center !important;
  }

  .border-text-bottom {
    bottom: calc((var(--outer-square-size) - var(--inner-square-size)) / 4) !important;
    left: 50% !important;
    transform: translate(-50%) !important;
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2) !important;
    text-align: center !important;
  }

  .border-text-left {
    left: calc((var(--outer-square-size) - var(--inner-square-size)) / 2.7) !important;
    top: 30% !important;
    transform: translateY(-50%) rotate(90deg) !important;
    transform-origin: left !important;
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2) !important;
    text-align: left !important;
  }

  .border-text-right {
    right: calc((var(--outer-square-size) - var(--inner-square-size)) / 2.7) !important;
    top: 30% !important;
    transform: translateY(-50%) rotate(-90deg) !important;
    transform-origin: right !important;
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2) !important;
    text-align: right !important;
  }


  .print-square {
    width: var(--inner-square-size) !important;
    height: var(--inner-square-size) !important;
    border: 1px solid #333 !important;
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    overflow: hidden !important;
    background: white !important;
    position: relative !important;
    z-index: 2 !important;
  }

  /* Test environment: blue border and guide lines */
  .print-square.test-environment {
    border: 2px solid #1976d2 !important; /* Blue border in test - 1px thicker */
  }

  /* Guide lines SVG - HIDE in print */
  .guide-lines {
    display: none !important;
    visibility: hidden !important;
  }

  .image-wrapper {
    width: 100% !important;
    height: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .print-image {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
  }

  .selected-photo {
    border: 1px solid #333 !important;
  }
}

/* Screen styles */
@media screen {
  .print-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .print-page-wrapper {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
    position: relative;
  }

  .print-page {
    width: 8.5in;
    height: 11in;
    background: white;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    padding: var(--page-padding-y) var(--page-padding-x);
    border: 1px solid #ddd;
  }

  .print-grid {
    display: grid;
    grid-template-columns: repeat(2, var(--outer-square-size));
    grid-template-rows: repeat(3, var(--outer-square-size));
    gap: var(--grid-gap);
    justify-content: center;
    flex: 0 0 auto;
    min-height: 0;
    margin-bottom: 0;
  }

  .print-square-container {
    width: var(--outer-square-size);
    height: var(--outer-square-size);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Outer cutting square template - dashed border for cutting guide */
  .outer-frame {
    position: absolute;
    width: var(--outer-square-size);
    height: var(--outer-square-size);
    pointer-events: none;
    z-index: 1;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    margin: auto;
  }

  .outer-frame rect {
    fill: none;
    stroke: #333;
    stroke-width: 1;
    stroke-dasharray: 4 4;
    vector-effect: non-scaling-stroke;
  }

  .outer-frame.secondary rect {
    stroke-dasharray: none;
  }

  .outer-frame.secondary {
    width: var(--outer-square-size-secondary);
    height: var(--outer-square-size-secondary);
    opacity: 0.6;
    z-index: 0;
    left: -3.5px;
    top: -2px;
    right: -2px;
    bottom: -2px;
    margin: auto;
  }

  .outer-frame.primary {
    left: -0.5px;
    top: 0;
    right: auto;
    bottom: 0;
    margin: 0;
  }

  /* Corner triangles for cutting alignment - upper corners */
  .corner-triangle {
    position: absolute;
    width: 0;
    height: 0;
    pointer-events: none;
    z-index: 3;
  }

  .corner-triangle-top-left {
    top: 0;
    left: 0;
    border-top: var(--triangle-size) solid #333;
    border-left: var(--triangle-size) solid #333;
    border-right: var(--triangle-size) solid transparent;
    border-bottom: var(--triangle-size) solid transparent;
  }

  .corner-triangle-top-right {
    top: 0;
    right: 0;
    border-top: var(--triangle-size) solid #333;
    border-right: var(--triangle-size) solid #333;
    border-left: var(--triangle-size) solid transparent;
    border-bottom: var(--triangle-size) solid transparent;
  }

  .corner-triangle-bottom-left {
    bottom: 0;
    left: 0;
    border-bottom: var(--triangle-size) solid #333;
    border-left: var(--triangle-size) solid #333;
    border-right: var(--triangle-size) solid transparent;
    border-top: var(--triangle-size) solid transparent;
  }

  .corner-triangle-bottom-right {
    bottom: 0;
    right: 0;
    border-bottom: var(--triangle-size) solid #333;
    border-right: var(--triangle-size) solid #333;
    border-left: var(--triangle-size) solid transparent;
    border-top: var(--triangle-size) solid transparent;
  }

  /* Border text labels */
  .border-text {
    position: absolute;
    color: #333;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    pointer-events: none;
    z-index: 2;
    white-space: nowrap;
  }

  .border-text-top {
    top: calc(((var(--outer-square-size) - var(--inner-square-size)) / 3.8));
    left: 50%;
    transform: translate(-50%) rotate(180deg);
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2);
    text-align: center;
  }

  .border-text-bottom {
    bottom: calc((var(--outer-square-size) - var(--inner-square-size)) / 4);
    left: 50%;
    transform: translate(-50%);
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2);
    text-align: center;
  }

  .border-text-left {
    left: calc((var(--outer-square-size) - var(--inner-square-size)) / 2.7);
    top: 30%;
    transform: translateY(-50%) rotate(90deg);
    transform-origin: left;
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2);
    text-align: left;
  }

  .border-text-right {
    right: calc((var(--outer-square-size) - var(--inner-square-size)) / 2.7);
    top: 30%;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: right;
    width: calc(var(--outer-square-size) - var(--triangle-size) * 2);
    text-align: right;
  }

  .print-square {
    width: var(--inner-square-size);
    height: var(--inner-square-size);
    border: 1px solid #333;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: white;
    position: relative;
    z-index: 2;
  }

  /* Test environment: blue border and guide lines */
  .print-square.test-environment {
    border: 2px solid #1976d2; /* Blue border in test - 1px thicker */
  }

  /* Guide lines SVG - positioned absolutely to stay in place */
  .guide-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Don't interfere with image dragging */
    z-index: 1; /* Behind image but visible */
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
    padding-top: 0.15in;
    font-size: 10pt;
    color: #666;
    margin-top: 0.15in;
    flex-shrink: 0;
  }

  .print-controls {
    width: 180px;
    padding: 1rem;
    background: white;
    border: 1px solid #d0d0d0;
    border-radius: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    position: sticky;
    top: 80px;
    left: 0;
    align-self: flex-start;
  }

  .controls-header {
    font-weight: 600;
    margin-bottom: 0.5rem;
  }

  .controls-subheader {
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .controls-subheader .label {
    color: #666;
    margin-right: 0.25rem;
  }

  .controls-subheader .value {
    color: #333;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .controls-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    
    // Add 20px spacing above on medium+ screens to move it down from subheader
    @media (min-width: 768px) {
      margin-top: 20px;
    }
  }

  .controls-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
  }

  .controls-row-horizontal {
    display: flex;
    gap: 0.5rem;
  }

  .move-controls {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .selected-photo {
    border: 2px solid #1976d2;
  }
}
</style>
