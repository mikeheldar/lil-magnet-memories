<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-card>
        <q-card-section>
          <div class="text-h4 q-mb-md">
            <q-icon name="apps" size="32px" class="q-mr-sm text-purple-7" />
            Magnet Studio
          </div>
          <div class="text-body2 text-grey-6">
            Crop images from recent orders into perfect square sections for
            magnets
          </div>
        </q-card-section>
      </q-card>

      <!-- Cropping Interface - Moved to Top -->
      <q-card v-if="selectedPhoto" class="q-mt-md">
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

          <!-- Image Preview with Interactive Grid -->
          <div
            class="crop-container"
            @mousemove="handleGridMove"
            @mouseleave="handleGridLeave"
          >
            <div class="image-wrapper">
              <img
                ref="selectedImage"
                :src="selectedPhoto.url"
                alt="Selected photo for cropping"
                class="selected-photo"
                @load="initGridOverlay"
              />

              <!-- Red overlay for area outside grid -->
              <div v-if="showGrid" class="red-overlay-container">
                <!-- Top red bar -->
                <div class="red-overlay-top" :style="redOverlayTopStyle"></div>
                <!-- Right red bar -->
                <div
                  class="red-overlay-right"
                  :style="redOverlayRightStyle"
                ></div>
                <!-- Bottom red bar -->
                <div
                  class="red-overlay-bottom"
                  :style="redOverlayBottomStyle"
                ></div>
                <!-- Left red bar -->
                <div
                  class="red-overlay-left"
                  :style="redOverlayLeftStyle"
                ></div>
              </div>

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
              label="Generate Crops"
              @click="generateCrops"
              :loading="generating"
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

      <!-- Recent Order Photos -->
      <q-card class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">Recent Order Photos</div>

          <div v-if="loadingOrders" class="text-center q-pa-lg">
            <q-spinner color="primary" size="48px" />
            <div class="q-mt-md">Loading recent order photos...</div>
          </div>

          <div
            v-else-if="orderPhotos.length === 0"
            class="text-center q-pa-lg text-grey-6"
          >
            No recent order photos found
          </div>

          <div v-else class="photo-grid q-gutter-md">
            <div
              v-for="photo in orderPhotos"
              :key="photo.id"
              class="photo-thumbnail"
              @click="selectPhoto(photo)"
            >
              <img
                :src="photo.url"
                :alt="photo.name"
                class="thumbnail-image"
                @error="handleImageError"
              />
              <div class="thumbnail-info">
                <div class="text-caption">{{ photo.orderNumber }}</div>
                <div class="text-caption text-grey-6">{{ photo.name }}</div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Generate Crops Popup -->
      <q-dialog v-model="showPreviewDialog" maximized>
        <q-card class="page-preview-card">
          <q-card-section>
            <div class="text-h6 q-mb-md">Preview - 8.5" x 11" Page</div>
            <q-btn
              close-icon="close"
              flat
              round
              dense
              v-close-popup
              class="absolute-top-right q-ma-sm"
            />
          </q-card-section>

          <q-card-section class="q-pt-none">
            <div class="page-container">
              <div class="page-content">
                <div
                  v-for="(square, index) in croppedSquares"
                  :key="index"
                  class="square-on-page"
                >
                  <img
                    :src="square.dataUrl"
                    :alt="`Square ${index + 1}`"
                    class="square-image"
                  />
                </div>
              </div>
            </div>

            <div class="q-mt-md q-gutter-md">
              <q-btn
                color="primary"
                label="Download All Squares"
                icon="archive"
                @click="downloadAllSquares"
              />
              <q-btn
                outline
                color="grey-8"
                label="Close"
                @click="showPreviewDialog = false"
              />
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Cropped Squares Preview -->
      <q-card v-if="croppedSquares.length > 0" class="q-mt-md">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            Cropped Squares ({{ croppedSquares.length }} total)
          </div>

          <div class="cropped-squares-grid">
            <div
              v-for="(square, index) in croppedSquares"
              :key="index"
              class="cropped-square-preview"
            >
              <img
                :src="square.dataUrl"
                :alt="`Square ${index + 1}`"
                @click="downloadSquare(square)"
              />
              <div class="square-label">{{ square.row }},{{ square.col }}</div>
              <q-btn
                icon="download"
                size="xs"
                class="square-download-btn"
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
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'MagnetStudioPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();

    const loadingOrders = ref(false);
    const orderPhotos = ref([]);
    const selectedPhoto = ref(null);
    const selectedImage = ref(null);
    const cropSize = ref(300);
    const gridRows = ref(2); // Start with 2 rows
    const gridCols = ref(2); // Start with 2 columns
    const croppedSquares = ref([]);
    const generating = ref(false);
    const showGrid = ref(true);
    const showPreviewDialog = ref(false);
    const gridScale = ref(1); // Size of grid (0.3 to 2)
    const gridPosition = ref({ x: 0, y: 0 });
    const isDragging = ref(false);
    const dragStart = ref({ x: 0, y: 0 });

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

    const loadRecentOrderPhotos = async () => {
      loadingOrders.value = true;
      try {
        console.log('Loading recent order photos...');

        const orders = await firebaseService.getOrders();
        console.log('Loaded orders:', orders.length);

        const photoArray = [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        orders.forEach((order) => {
          if (order.photos && order.photos.length > 0) {
            const orderDate = order.submissionDate?.toDate
              ? order.submissionDate.toDate()
              : new Date(order.submissionDate);

            if (orderDate >= thirtyDaysAgo) {
              order.photos.forEach((photo, index) => {
                photoArray.push({
                  id: `${order.id}_${index}`,
                  name:
                    photo.name ||
                    `Order ${order.orderNumber} - Photo ${index + 1}`,
                  url: photo.url,
                  orderNumber: order.orderNumber,
                  uploadedAt: orderDate.toLocaleDateString(),
                });
              });
            }
          }
        });

        orderPhotos.value = photoArray;
        console.log(`✅ Loaded ${photoArray.length} photos from recent orders`);

        if (photoArray.length === 0) {
          $q.notify({
            type: 'info',
            message: 'No photos from recent orders',
            caption: 'Try uploading some orders first',
          });
        }
      } catch (error) {
        console.error('Error loading recent order photos:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load recent order photos',
          position: 'top',
        });
      } finally {
        loadingOrders.value = false;
      }
    };

    const selectPhoto = (photo) => {
      selectedPhoto.value = photo;
      croppedSquares.value = [];
      console.log('Selected photo:', photo);
    };

    const cancelSelection = () => {
      selectedPhoto.value = null;
      croppedSquares.value = [];
    };

    const handleImageError = (event) => {
      console.error('Image failed to load:', event.target.src);
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

            $q.notify({
              type: 'positive',
              message: `Generated ${squares.length} square crops`,
              position: 'top',
            });

            // Show the preview dialog
            showPreviewDialog.value = true;

            resolve();
          } catch (error) {
            console.error('Error generating crops:', error);
            $q.notify({
              type: 'negative',
              message: 'Failed to generate crops',
              position: 'top',
            });
            reject(error);
          } finally {
            generating.value = false;
          }
        };

        img.onerror = (error) => {
          console.error('Error loading image:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to load image',
            position: 'top',
          });
          generating.value = false;
          reject(error);
        };

        img.src = selectedPhoto.value.url;
      });
    };

    const downloadSquare = (square) => {
      const link = document.createElement('a');
      link.href = square.dataUrl;
      link.download = `magnet-square-${square.row}-${square.col}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      $q.notify({
        type: 'positive',
        message: 'Square downloaded',
        position: 'top',
        timeout: 1000,
      });
    };

    const downloadAllSquares = () => {
      croppedSquares.value.forEach((square, index) => {
        setTimeout(() => {
          downloadSquare(square);
        }, index * 100);
      });

      $q.notify({
        type: 'positive',
        message: `Downloading ${croppedSquares.value.length} squares...`,
        position: 'top',
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
      // Calculate the aspect ratio of the grid (cols/rows)
      const aspectRatio = gridCols.value / gridRows.value;

      // Determine the size based on the image container's aspect ratio
      // We want each cell to be a square, so we set width and height proportionally
      let width = '100%';
      let height = '100%';

      // If we have a 3x2 grid, the grid should be wider than tall
      // We scale to fit within the image while maintaining the aspect ratio
      if (aspectRatio > 1) {
        // Grid is wider than tall
        height = `${(1 / aspectRatio) * 100}%`;
      } else if (aspectRatio < 1) {
        // Grid is taller than wide
        width = `${aspectRatio * 100}%`;
      }

      return {
        width,
        height,
        transform: `translate(-50%, -50%) translate(${gridPosition.value.x}px, ${gridPosition.value.y}px) scale(${gridScale.value})`,
        transformOrigin: 'center center',
      };
    });

    // Compute red overlay regions to shade areas outside the white grid
    // Grid can be rectangular (e.g., 3x2) but cells are always square
    const redOverlayTopStyle = computed(() => {
      const scale = gridScale.value;
      const aspectRatio = gridCols.value / gridRows.value;
      
      // Calculate grid dimensions in percentage
      let gridWidth, gridHeight;
      if (aspectRatio > 1) {
        // Grid is wider than tall
        gridHeight = 100 * scale;
        gridWidth = gridHeight * aspectRatio;
      } else {
        // Grid is taller than wide or square
        gridWidth = 100 * scale;
        gridHeight = gridWidth / aspectRatio;
      }
      
      const gridTop = 50 - gridHeight / 2;
      
      return {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: `${gridTop}%`,
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
      };
    });

    const redOverlayRightStyle = computed(() => {
      const scale = gridScale.value;
      const aspectRatio = gridCols.value / gridRows.value;
      
      // Calculate grid dimensions in percentage
      let gridWidth, gridHeight;
      if (aspectRatio > 1) {
        gridHeight = 100 * scale;
        gridWidth = gridHeight * aspectRatio;
      } else {
        gridWidth = 100 * scale;
        gridHeight = gridWidth / aspectRatio;
      }
      
      const gridRight = 50 + gridWidth / 2;
      const gridTop = 50 - gridHeight / 2;
      
      return {
        position: 'absolute',
        top: `${gridTop}%`,
        right: '0',
        width: `${100 - gridRight}%`,
        height: `${gridHeight}%`,
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
      };
    });

    const redOverlayBottomStyle = computed(() => {
      const scale = gridScale.value;
      const aspectRatio = gridCols.value / gridRows.value;
      
      // Calculate grid dimensions in percentage
      let gridWidth, gridHeight;
      if (aspectRatio > 1) {
        gridHeight = 100 * scale;
        gridWidth = gridHeight * aspectRatio;
      } else {
        gridWidth = 100 * scale;
        gridHeight = gridWidth / aspectRatio;
      }
      
      const gridBottom = 50 + gridHeight / 2;
      
      return {
        position: 'absolute',
        bottom: '0',
        left: '0',
        width: '100%',
        height: `${100 - gridBottom}%`,
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
      };
    });

    const redOverlayLeftStyle = computed(() => {
      const scale = gridScale.value;
      const aspectRatio = gridCols.value / gridRows.value;
      
      // Calculate grid dimensions in percentage
      let gridWidth, gridHeight;
      if (aspectRatio > 1) {
        gridHeight = 100 * scale;
        gridWidth = gridHeight * aspectRatio;
      } else {
        gridWidth = 100 * scale;
        gridHeight = gridWidth / aspectRatio;
      }
      
      const gridLeft = 50 - gridWidth / 2;
      const gridTop = 50 - gridHeight / 2;
      
      return {
        position: 'absolute',
        top: `${gridTop}%`,
        left: '0',
        width: `${gridLeft}%`,
        height: `${gridHeight}%`,
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
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
    });

    onMounted(async () => {
      const hasAccess = await checkAdminAccess();
      if (hasAccess) {
        await loadRecentOrderPhotos();
      }

      // Add mouse event listeners for dragging
      if (process.env.CLIENT) {
        document.addEventListener('mousemove', handleGridMove);
        document.addEventListener('mouseup', handleGridLeave);
      }
    });

    return {
      loadingOrders,
      orderPhotos,
      selectedPhoto,
      selectedImage,
      cropSize,
      gridRows,
      gridCols,
      gridScale,
      croppedSquares,
      generating,
      showGrid,
      showPreviewDialog,
      gridAspectRatio,
      gridStyle,
      redOverlayTopStyle,
      redOverlayRightStyle,
      redOverlayBottomStyle,
      redOverlayLeftStyle,
      selectPhoto,
      cancelSelection,
      handleImageError,
      generateCrops,
      downloadSquare,
      downloadAllSquares,
      initGridOverlay,
      startDrag,
      handleGridMove,
      handleGridLeave,
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

.crop-container {
  background: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.image-wrapper {
  position: relative;
  display: inline-block;
}

.selected-photo {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  display: block;
}

.red-overlay-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.red-overlay-top,
.red-overlay-right,
.red-overlay-bottom,
.red-overlay-left {
  pointer-events: none;
  z-index: 1;
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

.cropped-squares-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}

.cropped-square-preview {
  position: relative;
  display: inline-block;
}

.cropped-square-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border: 2px solid #1976d2;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
}

.cropped-square-preview img:hover {
  transform: scale(1.1);
}

.square-label {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
}

.square-download-btn {
  position: absolute;
  top: 4px;
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
