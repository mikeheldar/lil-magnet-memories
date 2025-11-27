<template>
  <q-page class="q-pa-md bg-grey-2">
    <!-- Loading or No Photo State -->
    <div v-if="!selectedPhoto" class="text-center q-pa-xl">
      <q-spinner v-if="loading" color="primary" size="3em" />
      <div v-else>
        <q-icon name="image_not_supported" size="64px" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-6 q-mt-md">No photo selected</div>
        <div class="text-body2 text-grey-7 q-mt-sm q-mb-md">
          Please select a photo first
        </div>
        <q-btn
          color="primary"
          label="Select Photo"
          icon="arrow_back"
          @click="goToSelectPage"
        />
      </div>
    </div>

    <!-- Cropping Interface -->
    <div v-else>
      <div class="text-center q-mb-lg">
        <div class="text-h4 text-weight-bold text-primary">
          <q-icon name="apps" class="q-mr-sm" />
          Magnet Studio - Crop Settings
        </div>
        <div class="text-caption text-grey-7 q-mt-sm">
          Adjust grid settings and generate square crops
        </div>
      </div>

      <!-- Back Button -->
      <div class="q-mb-md">
        <q-btn
          flat
          icon="arrow_back"
          label="Select Different Photo"
          @click="goToSelectPage"
        />
      </div>

      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Crop Settings</div>

          <!-- Grid Dimensions -->
          <div class="q-mb-md q-gutter-md row">
            <q-input
              v-model.number="gridRows"
              label="Rows"
              type="number"
              min="1"
              max="20"
              style="max-width: 150px"
            />
            <q-input
              v-model.number="gridCols"
              label="Columns"
              type="number"
              min="1"
              max="20"
              style="max-width: 150px"
            />
            <div class="text-caption text-grey-6 q-mt-lg">
              {{ gridRows }}x{{ gridCols }} = {{ gridRows * gridCols }} squares
            </div>
          </div>

          <!-- Large Image Preview with Interactive Grid -->
          <div class="q-mb-md">
            <div class="text-body2 q-mb-sm">Photo: {{ selectedPhoto.name || 'Selected Photo' }}</div>
            <div
              class="crop-container-large"
              @mousemove="handleGridMove"
              @mouseleave="handleGridLeave"
            >
              <div class="image-wrapper-large">
                <img
                  ref="selectedImage"
                  :src="getPhotoUrl(selectedPhoto)"
                  alt="Selected photo for cropping"
                  class="selected-photo-large"
                  @load="initGridOverlay"
                  @error="handleImageError"
                />

                <!-- Grid overlay with draggable and scalable grid -->
                <div
                  v-if="showGrid"
                  class="grid-overlay"
                  :style="gridStyle"
                  @mousedown="startDrag"
                >
                  <!-- Grid border -->
                  <div class="grid-border"></div>

                  <!-- Grid lines inside -->
                  <div
                    v-for="row in gridRows - 1"
                    :key="`row-${row}`"
                    class="grid-line horizontal"
                    :style="{
                      top: `${(row * 100) / gridRows}%`,
                    }"
                  ></div>
                  <div
                    v-for="col in gridCols - 1"
                    :key="`col-${col}`"
                    class="grid-line vertical"
                    :style="{
                      left: `${(col * 100) / gridCols}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Grid size slider -->
          <div class="q-mt-md" v-if="showGrid">
            <div class="text-body2 q-mb-xs">Grid Size</div>
            <q-slider
              v-model="gridScale"
              :min="0.3"
              :max="2"
              :step="0.05"
              label-always
              :label-value="`${Math.round(gridScale * 100)}%`"
              color="primary"
              style="max-width: 400px"
            />
          </div>

          <!-- Action Buttons -->
          <div class="q-mt-md q-gutter-md">
            <q-btn
              color="primary"
              label="Preview Crops"
              icon="preview"
              @click="generateCrops"
              :loading="generating"
            />
            <q-btn
              v-if="croppedSquares.length > 0"
              color="secondary"
              label="Send to Print Template"
              icon="print"
              @click="sendToPrintTemplate"
            />
            <q-btn
              outline
              color="grey-8"
              label="Cancel"
              @click="cancelSelection"
            />
          </div>
        </q-card-section>
      </q-card>

      <!-- Back Button -->
      <div class="q-mb-md">
        <q-btn
          flat
          icon="arrow_back"
          label="Select Different Photo"
          @click="goToSelectPage"
        />
      </div>

      <!-- Cropped Squares Preview - Grid Layout Maintaining Positions -->
      <q-card v-if="croppedSquares.length > 0" class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            Cropped Squares ({{ croppedSquares.length }} total)
          </div>

          <div class="cropped-squares-grid-maintained" :style="croppedSquaresContainerStyle">
            <div
              v-for="(square, index) in croppedSquares"
              :key="index"
              class="cropped-square-maintained"
              :style="getSquarePosition(square)"
            >
              <img
                :src="square.dataUrl"
                :alt="`Square ${square.row},${square.col}`"
                class="square-image-maintained"
                @click="downloadSquare(square)"
              />
              <div class="square-label-maintained">{{ square.row }},{{ square.col }}</div>
              <q-btn
                icon="download"
                size="xs"
                class="square-download-btn-maintained"
                @click="downloadSquare(square)"
                color="primary"
              />
            </div>
          </div>

          <div class="q-mt-md">
            <q-btn
              color="green"
              label="Download All Squares"
              icon="archive"
              @click="downloadAllSquares"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'MagnetStudioPage',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();

    const loading = ref(true);
    const selectedPhoto = ref(null);
    const selectedImage = ref(null);
    const cropSize = ref(300);
    const gridRows = ref(2); // Start with 2 rows
    const gridCols = ref(2); // Start with 2 columns
    const croppedSquares = ref([]);
    const generating = ref(false);
    const showGrid = ref(true);
    const gridScale = ref(1); // Size of grid (0.3 to 2)
    const gridPosition = ref({ x: 0, y: 0 });
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });
    const squareSpacing = ref(20); // Pixels between squares in the grid display

    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          console.log('Magnet Studio - Not authenticated, redirecting...');
          await router.push('/');
          return false;
        }

        // Check if user is admin
        if (!authService.isAdmin()) {
          console.log('Magnet Studio - Not an admin, redirecting...');
          await router.push('/');
          return false;
        }

        console.log('Magnet Studio - Admin access granted');
        return true;
      } catch (error) {
        console.error('Error checking admin access:', error);
        await router.push('/');
        return false;
      }
    };

    // Load photo from route query
    const loadPhotoFromRoute = async () => {
      loading.value = true;
      try {
        const photoParam = route.query.photo;
        console.log('🔍 Photo param from route:', photoParam ? 'exists' : 'missing');
        if (photoParam) {
          const photo = JSON.parse(photoParam);
          console.log('📸 Parsed photo object:', photo);
          // Ensure we have a valid URL for the photo
          if (!photo.url && photo.preview) {
            photo.url = photo.preview;
          }
          // Set the photo and wait for next tick to ensure reactivity
          selectedPhoto.value = photo;
          console.log('✅ Set selectedPhoto.value:', selectedPhoto.value);
          console.log('✅ Photo URL:', photo.url);
          await nextTick();
          console.log('✅ After nextTick, selectedPhoto.value:', selectedPhoto.value);
        } else {
          // No photo in route, redirect to selection page
          console.log('⚠️ No photo in route, redirecting to selection page');
          router.push('/magnet-studio-select');
          return;
        }
      } catch (error) {
        console.error('❌ Error parsing photo from route:', error);
        if ($q && $q.notify) {
          $q.notify({
            type: 'negative',
            message: 'Failed to load photo',
            caption: error.message,
          });
        }
        router.push('/magnet-studio-select');
      } finally {
        loading.value = false;
        console.log('✅ Loading complete, loading.value:', loading.value);
        console.log('✅ selectedPhoto.value:', selectedPhoto.value);
      }
    };

    const goToSelectPage = () => {
      router.push('/magnet-studio-select');
    };

    const cancelSelection = () => {
      goToSelectPage();
    };

    // Get photo URL (handles both url and preview)
    const getPhotoUrl = (photo) => {
      if (!photo) return '';
      if (photo.url && photo.url.startsWith('http')) {
        return photo.url;
      }
      if (photo.preview && !photo.preview.startsWith('blob:')) {
        return photo.preview;
      }
      if (photo.url) {
        return photo.url;
      }
      if (photo.preview) {
        return photo.preview;
      }
      return '';
    };

    const handleImageError = (event) => {
      console.error('Image failed to load:', event.target.src);
      console.error('Photo object:', selectedPhoto.value);
      event.target.style.display = 'none';
    };

    const generateCrops = async () => {
      if (!selectedPhoto.value) return;

      generating.value = true;
      console.log('Generating crops...');
      console.log('Grid:', gridRows.value, 'x', gridCols.value);
      console.log('Crop size:', cropSize.value);

      croppedSquares.value = [];

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = cropSize.value;
            canvas.height = cropSize.value;

            const imageWidth = img.width;
            const imageHeight = img.height;

            // Calculate square size to ensure all grid boxes are square
            // We want to fit the entire grid (rows x cols of squares) within the image
            // Each cell must be square, so we find the largest square size that fits
            const imageAspectRatio = imageWidth / imageHeight;
            const gridAspectRatio = gridCols.value / gridRows.value;

            let squareSize;
            let offsetX, offsetY;

            if (imageAspectRatio > gridAspectRatio) {
              // Image is wider than grid, so height is the limiting factor
              squareSize = imageHeight / gridRows.value;
              const gridWidth = squareSize * gridCols.value;
              offsetX = (imageWidth - gridWidth) / 2;
              offsetY = 0;
            } else {
              // Image is taller than grid, so width is the limiting factor
              squareSize = imageWidth / gridCols.value;
              const gridHeight = squareSize * gridRows.value;
              offsetX = 0;
              offsetY = (imageHeight - gridHeight) / 2;
            }

            const squares = [];

            for (let row = 0; row < gridRows.value; row++) {
              for (let col = 0; col < gridCols.value; col++) {
                const sx = offsetX + col * squareSize;
                const sy = offsetY + row * squareSize;

                ctx.clearRect(0, 0, cropSize.value, cropSize.value);

                ctx.drawImage(
                  img,
                  sx,
                  sy,
                  squareSize,
                  squareSize,
                  0,
                  0,
                  cropSize.value,
                  cropSize.value
                );

                const dataUrl = canvas.toDataURL('image/png');

                squares.push({
                  dataUrl,
                  row: row + 1,
                  col: col + 1,
                  index: row * gridCols.value + col,
                });
              }
            }

            croppedSquares.value = squares;
            console.log(`✅ Generated ${squares.length} cropped squares`);

            // Use $q from the outer scope
            if ($q && $q.notify) {
              $q.notify({
                type: 'positive',
                message: `Generated ${squares.length} square crops`,
                position: 'top',
              });
            }

            generating.value = false;
            resolve();
          } catch (error) {
            console.error('Error generating crops:', error);
            if ($q && $q.notify) {
              $q.notify({
                type: 'negative',
                message: 'Failed to generate crops',
                position: 'top',
              });
            }
            generating.value = false;
            reject(error);
          }
        };

        img.onerror = (error) => {
          console.error('Error loading image:', error);
          if ($q && $q.notify) {
            $q.notify({
              type: 'negative',
              message: 'Failed to load image',
              position: 'top',
            });
          }
          generating.value = false;
          reject(error);
        };

        img.src = getPhotoUrl(selectedPhoto.value);
      });
    };

    const downloadSquare = (square) => {
      const link = document.createElement('a');
      link.href = square.dataUrl;
      link.download = `magnet-square-${square.row}-${square.col}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if ($q && $q.notify) {
        $q.notify({
          type: 'positive',
          message: 'Square downloaded',
          position: 'top',
          timeout: 1000,
        });
      }
    };

    const downloadAllSquares = () => {
      croppedSquares.value.forEach((square, index) => {
        setTimeout(() => {
          downloadSquare(square);
        }, index * 100);
      });

      if ($q && $q.notify) {
        $q.notify({
          type: 'positive',
          message: `Downloading ${croppedSquares.value.length} squares...`,
          position: 'top',
        });
      }
    };

    // Send crops to print template
    const sendToPrintTemplate = () => {
      if (croppedSquares.value.length === 0) {
        if ($q && $q.notify) {
          $q.notify({
            type: 'warning',
            message: 'Please generate crops first',
            position: 'top',
          });
        }
        return;
      }

      // Convert cropped squares to photo format for print template
      const photos = croppedSquares.value.map((square) => ({
        name: `Square ${square.row}-${square.col}`,
        url: square.dataUrl,
        preview: square.dataUrl,
        dataUrl: square.dataUrl,
      }));

      const quantities = croppedSquares.value.map(() => 1);

      // Navigate to print template with photos
      router.push({
        path: '/print-template',
        query: {
          photos: JSON.stringify(photos),
          quantities: JSON.stringify(quantities),
        },
      });
    };

    const initGridOverlay = () => {
      showGrid.value = true;
      gridPosition.value = { x: 0, y: 0 };
      gridScale.value = 1;
    };

    // Compute grid size to maintain square cells
    // The grid can be rectangular (e.g., 3x2) but individual cells are always square
    const gridAspectRatio = computed(() => {
      if (!selectedImage.value) return null;

      return {
        // The grid width is based on number of columns
        // The grid height is based on number of rows
        // They can be different (e.g., 3 columns x 2 rows = rectangular grid)
        // but each individual cell within is square
        cols: gridCols.value,
        rows: gridRows.value,
      };
    });

    const gridStyle = computed(() => {
      if (!selectedImage.value) {
        return {};
      }

      // Get the actual image dimensions (displayed size, not natural)
      const img = selectedImage.value;
      const imgDisplayWidth = img.offsetWidth || img.width || 1;
      const imgDisplayHeight = img.offsetHeight || img.height || 1;
      const imgNaturalWidth = img.naturalWidth || imgDisplayWidth;
      const imgNaturalHeight = img.naturalHeight || imgDisplayHeight;
      const imgAspectRatio = imgNaturalWidth / imgNaturalHeight;

      // Calculate the aspect ratio of the grid (cols/rows)
      const gridAspectRatio = gridCols.value / gridRows.value;

      // Calculate the size of each square cell
      // We want all cells to be perfect squares
      let cellSize;
      let gridWidth, gridHeight;

      if (imgAspectRatio > gridAspectRatio) {
        // Image is wider than grid aspect ratio
        // Height is the limiting factor - use image height
        cellSize = imgNaturalHeight / gridRows.value;
        gridHeight = imgNaturalHeight;
        gridWidth = cellSize * gridCols.value;
      } else {
        // Image is taller than grid aspect ratio
        // Width is the limiting factor - use image width
        cellSize = imgNaturalWidth / gridCols.value;
        gridWidth = imgNaturalWidth;
        gridHeight = cellSize * gridRows.value;
      }

      // Convert to percentage of image size (based on displayed size)
      const widthPercent = (gridWidth / imgNaturalWidth) * 100;
      const heightPercent = (gridHeight / imgNaturalHeight) * 100;
      
      // Calculate scaled dimensions
      const scaledWidth = (imgDisplayWidth * widthPercent / 100) * gridScale.value;
      const scaledHeight = (imgDisplayHeight * heightPercent / 100) * gridScale.value;
      
      // Constrain grid position to keep it within image bounds
      const maxX = (imgDisplayWidth - scaledWidth) / 2;
      const maxY = (imgDisplayHeight - scaledHeight) / 2;
      const constrainedX = Math.max(-maxX, Math.min(maxX, gridPosition.value.x));
      const constrainedY = Math.max(-maxY, Math.min(maxY, gridPosition.value.y));
      
      // Update position if it was constrained
      if (constrainedX !== gridPosition.value.x || constrainedY !== gridPosition.value.y) {
        gridPosition.value = { x: constrainedX, y: constrainedY };
      }

      return {
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        transform: `translate(-50%, -50%) translate(${constrainedX}px, ${constrainedY}px) scale(${gridScale.value})`,
        transformOrigin: 'center center',
      };
    });

    const startDrag = (event) => {
      isDragging.value = true;
      dragStart.value = {
        x: event.clientX - gridPosition.value.x,
        y: event.clientY - gridPosition.value.y,
      };
      event.preventDefault();
    };

    const handleGridMove = (event) => {
      if (isDragging.value) {
        gridPosition.value = {
          x: event.clientX - dragStart.value.x,
          y: event.clientY - dragStart.value.y,
        };
      }
    };

    const handleGridLeave = () => {
      isDragging.value = false;
    };

    // Ensure grid dimensions stay valid numbers
    watch([gridRows, gridCols], ([newRows, newCols]) => {
      if (!newRows || newRows < 1) gridRows.value = 1;
      if (!newCols || newCols < 1) gridCols.value = 1;
      console.log('Grid dimensions changed:', newRows, 'x', newCols);
    });

    // Get square position for grid display (maintaining relative positions)
    const getSquarePosition = (square) => {
      // Calculate position based on row and col, with spacing
      const squareSize = cropSize.value;
      const spacing = squareSpacing.value;
      const left = (square.col - 1) * (squareSize + spacing);
      const top = (square.row - 1) * (squareSize + spacing);
      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${squareSize}px`,
        height: `${squareSize}px`,
      };
    };

    // Get container size for cropped squares grid
    const croppedSquaresContainerStyle = computed(() => {
      if (croppedSquares.value.length === 0) return {};
      const squareSize = cropSize.value;
      const spacing = squareSpacing.value;
      const width = gridCols.value * (squareSize + spacing) - spacing;
      const height = gridRows.value * (squareSize + spacing) - spacing;
      return {
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
      };
    });

    onMounted(async () => {
      const hasAccess = await checkAdminAccess();
      if (hasAccess) {
        loadPhotoFromRoute();
      }

      // Add mouse event listeners for dragging
      if (process.env.CLIENT) {
        document.addEventListener('mousemove', handleGridMove);
        document.addEventListener('mouseup', handleGridLeave);
      }
    });

    return {
      loading,
      selectedPhoto,
      selectedImage,
      cropSize,
      gridRows,
      gridCols,
      gridScale,
      croppedSquares,
      generating,
      showGrid,
      gridAspectRatio,
      gridStyle,
      squareSpacing,
      handleImageError,
      generateCrops,
      downloadSquare,
      downloadAllSquares,
      sendToPrintTemplate,
      initGridOverlay,
      startDrag,
      handleGridMove,
      handleGridLeave,
      getSquarePosition,
      croppedSquaresContainerStyle,
      goToSelectPage,
      cancelSelection,
      getPhotoUrl,
    };
  },
};
</script>

<style scoped>
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.photo-thumbnail {
  position: relative;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
}

.photo-thumbnail:hover {
  border-color: #9c27b0;
  transform: scale(1.05);
}

.thumbnail-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
}

.thumbnail-info {
  padding: 8px;
  background: white;
}

.crop-container-large {
  background: #424242;
  padding: 24px;
  border-radius: 8px;
  text-align: center;
  position: relative;
  overflow: auto;
  max-height: 80vh;
}

.image-wrapper-large {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

.selected-photo-large {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  display: block;
  margin: 0 auto;
}


.grid-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  /* Keep the grid within the image bounds */
  max-width: 100%;
  max-height: 100%;
  pointer-events: auto;
  cursor: move;
  z-index: 2;
}

.grid-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  pointer-events: none;
}

.grid-line.horizontal {
  width: 100%;
  height: 1px;
  left: 0;
}

.grid-line.vertical {
  height: 100%;
  width: 1px;
  top: 0;
}

.cropped-squares-grid-maintained {
  position: relative;
  margin: 0 auto;
  border: 2px dashed #d0d0d0;
  border-radius: 8px;
  padding: 10px;
  background: #f9f9f9;
}

.cropped-square-maintained {
  position: absolute;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.cropped-square-maintained:hover {
  border-color: #9c27b0;
  transform: scale(1.05);
  z-index: 10;
}

.square-image-maintained {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.square-label-maintained {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
}

.square-download-btn-maintained {
  position: absolute;
  bottom: 4px;
  right: 4px;
}

/* Page Preview Dialog Styles */
.page-preview-card {
  background: white;
}

.page-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  background: #f5f5f5;
  padding: 20px;
}

.page-content {
  width: 8.5in;
  height: 11in;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 0.5in;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(auto-fill, 1fr);
  gap: 0.1in;
  align-content: start;
}

.square-on-page {
  width: 2.5in;
  height: 2.5in;
  border: 1px solid #ddd;
  overflow: hidden;
}

.square-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1200px) {
  .page-content {
    width: 100%;
    max-width: 8.5in;
    height: auto;
    aspect-ratio: 8.5 / 11;
  }

  .square-on-page {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
  }
}
</style>
