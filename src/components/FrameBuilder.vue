<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    maximized
    class="frame-builder-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="column frame-builder-card">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6 col">Create Frame from Photo</div>
        <div class="row items-center q-gutter-xs">
          <q-btn flat dense icon="undo" :disable="!canUndo" @click="undo">
            <q-tooltip>Undo (Ctrl+Z)</q-tooltip>
          </q-btn>
          <q-btn flat dense icon="redo" :disable="!canRedo" @click="redo">
            <q-tooltip>Redo (Ctrl+Shift+Z)</q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="close" @click="close" />
        </div>
      </q-card-section>

      <q-card-section class="col scroll">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-7">
            <div v-if="!sourcePreviewUrl" class="q-pa-lg text-center">
              <q-file
                v-model="sourceFile"
                label="Upload source photo"
                accept="image/*"
                filled
                @update:model-value="onSourceSelected"
              />
            </div>
            <template v-else>
              <div
                ref="viewportRef"
                class="frame-builder-viewport q-mx-auto"
                :class="{ 'frame-builder-viewport--drag-over': dragOverViewport }"
                @dragover.prevent="onViewportDragOver"
                @dragleave="onViewportDragLeave"
                @drop.prevent="onViewportDrop"
              >
                <div
                  class="frame-builder-interaction"
                  @mousedown="onBackgroundMouseDown"
                  @touchstart="onTouchStart"
                  @wheel.prevent="editor.handleWheel"
                >
                  <div class="frame-builder-stencil" :style="imageStyle">
                    <img
                      :src="sourcePreviewUrl"
                      alt="Frame source"
                      class="frame-builder-image"
                      draggable="false"
                      @load="onSourceImageLoad"
                    />
                  </div>
                  <div class="frame-cutout-tint" :style="cutoutStyle" />
                  <div
                    v-for="(layer, index) in layers"
                    :key="`${layer.id}-${layer.type === 'text' ? layer.font : ''}`"
                    class="frame-content-layer"
                    :class="{
                      'frame-content-layer--selected': selectedLayerId === layer.id,
                      'frame-content-layer--text': layer.type === 'text',
                      'frame-content-layer--image': layer.type === 'image',
                    }"
                    :style="previewLayerStyle(layer, index)"
                    @mousedown.stop="(e) => startLayerDrag(e, layer.id)"
                    @touchstart.stop="(e) => startLayerDragTouch(e, layer.id)"
                  >
                    <img
                      v-if="layer.type === 'image'"
                      :src="layer.url"
                      alt=""
                      draggable="false"
                      class="frame-overlay-image"
                    />
                    <span v-else>{{ layer.text }}</span>
                  </div>
                  <div class="frame-cutout-chrome" :style="cutoutStyle">
                    <div
                      v-for="edge in cutoutEdges"
                      :key="edge"
                      class="frame-cutout-edge"
                      :class="`frame-cutout-edge--${edge}`"
                      @mousedown.stop="startCutoutDrag"
                      @touchstart.stop="startCutoutDragTouch"
                    />
                    <div
                      v-for="handle in cutoutHandles"
                      :key="handle"
                      class="frame-cutout-handle"
                      :class="`frame-cutout-handle--${handle}`"
                      @mousedown.stop="(e) => startCutoutResize(e, handle)"
                      @touchstart.stop="(e) => startCutoutResizeTouch(e, handle)"
                    />
                  </div>
                </div>
              </div>
              <div class="text-caption text-grey-7 text-center q-mt-xs">
                Dropped images start on the top layer — drag them anywhere. The cutout area is cleared when saved.
              </div>
              <div class="row q-gutter-sm q-mt-sm justify-center">
                <q-btn dense outline icon="restart_alt" label="Reset zoom" @click="resetZoom" />
                <q-btn dense outline icon="crop_square" label="Fill square" @click="fillSquare" />
              </div>
            </template>
          </div>

          <div class="col-12 col-md-5">
            <q-input v-model="frameName" label="Frame name" filled dense class="q-mb-md" />

            <q-toggle
              v-model="isPublic"
              label="Available on public upload"
              color="primary"
              class="q-mb-md"
            />

            <div class="text-subtitle2 q-mb-sm">Center cutout</div>
            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <q-slider
                  v-model="cutout.width"
                  :min="0.2"
                  :max="0.95"
                  :step="0.01"
                  label
                  label-always
                  @change="commitHistory"
                />
                <div class="text-caption">Width</div>
              </div>
              <div class="col-6">
                <q-slider
                  v-model="cutout.height"
                  :min="0.2"
                  :max="0.95"
                  :step="0.01"
                  label
                  label-always
                  @change="commitHistory"
                />
                <div class="text-caption">Height</div>
              </div>
            </div>

            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2">Layers</div>
              <div class="text-caption text-grey-7">Top = front</div>
            </div>

            <div class="row q-gutter-sm q-mb-sm">
              <q-file
                v-model="overlayFileInput"
                label="Add image"
                accept="image/*"
                filled
                dense
                class="col"
                @update:model-value="onOverlayFileSelected"
              />
              <q-btn dense outline icon="text_fields" label="Add text" @click="addTextLayer" />
            </div>

            <draggable
              v-model="layers"
              item-key="id"
              handle=".layer-drag-handle"
              class="frame-layer-list q-mb-md"
              @start="onLayerReorderStart"
            >
              <template #item="{ element: layer }">
                <div
                  class="frame-layer-row"
                  :class="{ 'frame-layer-row--selected': selectedLayerId === layer.id }"
                  @click="selectLayer(layer.id)"
                >
                  <q-icon name="drag_indicator" class="layer-drag-handle cursor-grab text-grey-6" size="sm" />
                  <q-icon
                    :name="layer.type === 'text' ? 'text_fields' : 'image'"
                    size="18px"
                    class="text-grey-7"
                  />
                  <div class="col text-body2 ellipsis">{{ layerLabel(layer) }}</div>
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    icon="delete"
                    color="negative"
                    @click.stop="removeLayer(layer.id)"
                  />
                </div>
              </template>
            </draggable>

            <div v-if="selectedLayer" class="q-mb-md frame-layer-controls">
              <div class="text-caption q-mb-sm">
                Selected layer — drag on preview to move
              </div>

              <template v-if="selectedLayer.type === 'text'">
                <q-input
                  :model-value="selectedLayer.text"
                  label="Text"
                  filled
                  dense
                  class="q-mb-sm"
                  @focus="commitHistory"
                  @update:model-value="(val) => updateLayerProp('text', val)"
                />
                <q-select
                  :model-value="selectedLayer.font"
                  :options="fontOptions"
                  label="Font"
                  filled
                  dense
                  emit-value
                  map-options
                  class="q-mb-sm"
                  @update:model-value="(val) => updateLayerPropWithHistory('font', val)"
                >
                  <template #option="scope">
                    <q-item v-bind="scope.itemProps">
                      <q-item-section :style="{ fontFamily: scope.opt.value }">
                        {{ scope.opt.label }}
                      </q-item-section>
                    </q-item>
                  </template>
                  <template #selected-item="scope">
                    <span :style="{ fontFamily: scope.opt.value }">{{ scope.opt.label }}</span>
                  </template>
                </q-select>
                <div class="row q-gutter-sm q-mb-sm items-center">
                  <q-input
                    :model-value="selectedLayer.color"
                    label="Color"
                    filled
                    dense
                    style="max-width: 120px"
                    @update:model-value="(val) => updateLayerPropWithHistory('color', val)"
                  />
                  <input
                    :value="selectedLayer.color"
                    type="color"
                    class="frame-color-input"
                    @mousedown="commitHistory"
                    @input="(e) => updateLayerProp('color', e.target.value)"
                  />
                </div>
              </template>

              <q-slider
                :model-value="selectedLayer.scale"
                :min="selectedLayer.type === 'image' ? 0.05 : 0.5"
                :max="selectedLayer.type === 'image' ? 0.85 : 3"
                :step="selectedLayer.type === 'image' ? 0.01 : 0.1"
                label
                label-always
                class="q-mb-sm"
                @update:model-value="(val) => updateLayerProp('scale', val)"
                @change="commitHistory"
              />
              <div class="text-caption q-mb-sm">Size</div>

              <q-slider
                :model-value="selectedLayer.rotation"
                :min="0"
                :max="360"
                :step="1"
                label
                label-always
                class="q-mb-sm"
                @update:model-value="(val) => updateLayerProp('rotation', val)"
                @change="commitHistory"
              />
              <div class="text-caption q-mb-sm">Rotation</div>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="close" />
        <q-btn
          color="primary"
          label="Save frame"
          :loading="saving"
          :disable="!sourcePreviewUrl || !frameName.trim()"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
import { useSquarePhotoEditor } from '../composables/useSquarePhotoEditor.js';
import { useFrameBuilderHistory } from '../composables/useFrameBuilderHistory.js';
import {
  bakeFrameOverlayFile,
  DEFAULT_FRAME_CUTOUT,
} from '../utils/squarePhotoCanvas.js';
import {
  FONT_OPTIONS,
  cloneLayers,
  createImageLayer,
  createTextLayer,
  layerLabel,
  layerZIndex,
  layersFromLegacyRecipe,
  layersToLegacyRecipe,
  serializeLayersForRecipe,
} from '../utils/frameBuilderLayers.js';
import { firebaseService } from '../services/firebaseService.js';
import { invalidateFrameCache } from '../services/frameCatalogService.js';

export default {
  name: 'FrameBuilder',
  components: { draggable },
  props: {
    modelValue: { type: Boolean, default: false },
    editFrame: { type: Object, default: null },
  },
  emits: ['update:modelValue', 'saved'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const saving = ref(false);
    const viewportRef = ref(null);
    const viewportSize = ref(320);
    const sourceFile = ref(null);
    const sourcePreviewUrl = ref('');
    const frameName = ref('');
    const isPublic = ref(false);
    const cutout = ref({ ...DEFAULT_FRAME_CUTOUT });
    const layers = ref([]);
    const selectedLayerId = ref(null);
    const overlayFileInput = ref(null);
    const dragOverViewport = ref(false);
    const cutoutHandles = ['nw', 'ne', 'sw', 'se'];
    const cutoutEdges = ['n', 's', 'e', 'w'];
    const fontOptions = FONT_OPTIONS;
    const pendingEditRecipe = ref(null);
    const history = useFrameBuilderHistory();
    const canUndo = history.canUndo;
    const canRedo = history.canRedo;

    const editor = useSquarePhotoEditor(viewportSize);
    const imageStyle = editor.imageStyle;

    const selectedLayer = computed(() =>
      layers.value.find((layer) => layer.id === selectedLayerId.value) || null
    );

    const cutoutStyle = computed(() => ({
      left: `${cutout.value.x * 100}%`,
      top: `${cutout.value.y * 100}%`,
      width: `${cutout.value.width * 100}%`,
      height: `${cutout.value.height * 100}%`,
    }));

    const getSnapshot = () => ({
      layers: cloneLayers(layers.value),
      cutout: { ...cutout.value },
      stencil: { ...editor.transform.value },
      selectedLayerId: selectedLayerId.value,
    });

    const applySnapshot = (snapshot) => {
      revokeBlobUrls(layers.value);
      layers.value = cloneLayers(snapshot.layers);
      cutout.value = { ...snapshot.cutout };
      editor.loadTransform({ ...snapshot.stencil });
      selectedLayerId.value = snapshot.selectedLayerId;
    };

    const commitHistory = () => {
      history.pushSnapshot(getSnapshot());
    };

    const undo = () => {
      const previous = history.undo(getSnapshot());
      if (previous) applySnapshot(previous);
    };

    const redo = () => {
      const next = history.redo(getSnapshot());
      if (next) applySnapshot(next);
    };

    const previewLayerStyle = (layer, index) => {
      const base = {
        zIndex: layerZIndex(index, layers.value.length),
        left: `${(layer.x ?? 0.5) * 100}%`,
        top: `${(layer.y ?? 0.5) * 100}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)`,
      };
      if (layer.type === 'image') {
        return { ...base, width: `${(layer.scale ?? 0.25) * 100}%` };
      }
      return {
        ...base,
        color: layer.color || '#ffffff',
        fontFamily: layer.font || 'sans-serif',
        fontSize: `${Math.max(10, (layer.scale ?? 1) * 18)}px`,
      };
    };

    const updateViewportSize = () => {
      const el = viewportRef.value;
      if (el) viewportSize.value = el.clientWidth || 320;
    };

    const revokeBlobUrls = (layerList = []) => {
      for (const layer of layerList) {
        if (layer.type === 'image' && layer.url?.startsWith('blob:')) {
          URL.revokeObjectURL(layer.url);
        }
      }
    };

    const resetBuilder = () => {
      sourceFile.value = null;
      if (sourcePreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(sourcePreviewUrl.value);
      }
      sourcePreviewUrl.value = '';
      frameName.value = '';
      isPublic.value = false;
      cutout.value = { ...DEFAULT_FRAME_CUTOUT };
      revokeBlobUrls(layers.value);
      layers.value = [];
      selectedLayerId.value = null;
      pendingEditRecipe.value = null;
      editor.resetTransform();
      history.reset();
    };

    const applyRecipeTransform = (recipe) => {
      if (!recipe?.stencil) {
        editor.resetTransform();
        return;
      }
      updateViewportSize();
      const savedViewport = Number(recipe.viewportSize) || viewportSize.value || 320;
      const currentViewport = viewportSize.value || savedViewport;
      const ratio = currentViewport / savedViewport;
      editor.loadTransform({
        scale: recipe.stencil.scale ?? 1,
        x: (recipe.stencil.x ?? 0) * ratio,
        y: (recipe.stencil.y ?? 0) * ratio,
      });
    };

    const loadLayersFromRecipe = async (recipe = {}) => {
      revokeBlobUrls(layers.value);
      let nextLayers = [];
      if (Array.isArray(recipe.layers) && recipe.layers.length) {
        nextLayers = recipe.layers.map((layer) =>
          layer.type === 'text' ? createTextLayer(layer) : createImageLayer(layer)
        );
      } else {
        nextLayers = layersFromLegacyRecipe(recipe);
      }

      const { getDownloadURL, ref: storageRefFn } = await import('firebase/storage');
      const storageInstance = firebaseService.getFrameStorage();
      layers.value = await Promise.all(
        nextLayers.map(async (layer) => {
          if (layer.type !== 'image' || !layer.storagePath) return layer;
          try {
            const url = await getDownloadURL(storageRefFn(storageInstance, layer.storagePath));
            return { ...layer, url };
          } catch {
            return { ...layer, url: layer.url || '' };
          }
        })
      );
    };

    const loadEditFrame = async () => {
      const frame = props.editFrame;
      if (!frame) return;
      frameName.value = frame.name || '';
      isPublic.value = frame.isPublic === true;
      if (frame.builderRecipe) {
        pendingEditRecipe.value = frame.builderRecipe;
        cutout.value = { ...DEFAULT_FRAME_CUTOUT, ...frame.builderRecipe.cutout };
        await loadLayersFromRecipe(frame.builderRecipe);
        const sourcePath = frame.builderRecipe.sourceImagePath;
        if (sourcePath) {
          try {
            const { getDownloadURL, ref: storageRefFn } = await import('firebase/storage');
            const storageInstance = firebaseService.getFrameStorage();
            sourcePreviewUrl.value = await getDownloadURL(storageRefFn(storageInstance, sourcePath));
          } catch {
            pendingEditRecipe.value = null;
            sourcePreviewUrl.value = frame.imageUrl || '';
            $q.notify({
              type: 'warning',
              message: 'Original source photo unavailable',
              caption: 'Showing saved frame preview only; zoom may not match.',
              position: 'top',
            });
          }
        } else {
          pendingEditRecipe.value = null;
          sourcePreviewUrl.value = frame.imageUrl || '';
          $q.notify({
            type: 'warning',
            message: 'Original source photo was not saved with this frame',
            caption: 'Re-upload the source photo to adjust the border.',
            position: 'top',
          });
        }
      } else {
        pendingEditRecipe.value = null;
        sourcePreviewUrl.value = frame.imageUrl || '';
      }
      setTimeout(() => {
        updateViewportSize();
        commitHistory();
      }, 50);
    };

    watch(
      () => props.modelValue,
      (open) => {
        if (open) {
          resetBuilder();
          if (props.editFrame) loadEditFrame();
        }
      }
    );

    const onSourceSelected = (file) => {
      const upload = Array.isArray(file) ? file[0] : file;
      if (!upload) return;
      if (sourcePreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(sourcePreviewUrl.value);
      }
      sourceFile.value = upload;
      sourcePreviewUrl.value = URL.createObjectURL(upload);
      setTimeout(updateViewportSize, 50);
    };

    const selectLayer = (layerId) => {
      selectedLayerId.value = layerId;
    };

    const addImageLayer = (file) => {
      if (!file || !file.type?.startsWith('image/')) return;
      commitHistory();
      const layer = createImageLayer({
        url: URL.createObjectURL(file),
        file,
      });
      layers.value.unshift(layer);
      selectedLayerId.value = layer.id;
    };

    const addTextLayer = () => {
      commitHistory();
      const layer = createTextLayer({ text: 'Text' });
      layers.value.unshift(layer);
      selectedLayerId.value = layer.id;
    };

    const onOverlayFileSelected = (file) => {
      const upload = Array.isArray(file) ? file[0] : file;
      overlayFileInput.value = null;
      if (upload) addImageLayer(upload);
    };

    const onViewportDragOver = () => {
      dragOverViewport.value = true;
    };

    const onViewportDragLeave = (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        dragOverViewport.value = false;
      }
    };

    const onViewportDrop = (event) => {
      dragOverViewport.value = false;
      const file = event.dataTransfer?.files?.[0];
      if (file) addImageLayer(file);
    };

    const onSourceImageLoad = (event) => {
      if (pendingEditRecipe.value) {
        editor.onImageLoad(event, { preserveTransform: true });
        applyRecipeTransform(pendingEditRecipe.value);
        pendingEditRecipe.value = null;
        return;
      }
      editor.onImageLoad(event);
    };

    const onBackgroundMouseDown = (event) => {
      if (event.target.closest('.frame-content-layer, .frame-cutout-chrome, .frame-cutout-edge, .frame-cutout-handle')) {
        return;
      }
      selectedLayerId.value = null;
      editor.startDrag(event);
    };

    const onTouchStart = (event) => {
      if (event.target.closest('.frame-content-layer, .frame-cutout-chrome, .frame-cutout-edge, .frame-cutout-handle')) {
        return;
      }
      if (event.touches.length === 2) editor.startPinch(event);
      else editor.startDrag(event);
    };

    const updateLayerProp = (prop, value) => {
      const idx = layers.value.findIndex((layer) => layer.id === selectedLayerId.value);
      if (idx < 0) return;
      layers.value[idx] = { ...layers.value[idx], [prop]: value };
    };

    const updateLayerPropWithHistory = (prop, value) => {
      commitHistory();
      updateLayerProp(prop, value);
    };

    const removeLayer = (layerId) => {
      const idx = layers.value.findIndex((layer) => layer.id === layerId);
      if (idx < 0) return;
      commitHistory();
      const layer = layers.value[idx];
      if (layer.type === 'image' && layer.url?.startsWith('blob:')) {
        URL.revokeObjectURL(layer.url);
      }
      layers.value.splice(idx, 1);
      if (selectedLayerId.value === layerId) {
        selectedLayerId.value = null;
      }
    };

    const onLayerReorderStart = () => {
      commitHistory();
    };

    const resetZoom = () => {
      commitHistory();
      editor.resetTransform();
    };

    const fillSquare = () => {
      commitHistory();
      editor.fillSquare();
    };

    const clampCutout = (next) => {
      const width = Math.max(0.1, Math.min(0.95, next.width));
      const height = Math.max(0.1, Math.min(0.95, next.height));
      const x = Math.max(0, Math.min(1 - width, next.x));
      const y = Math.max(0, Math.min(1 - height, next.y));
      return { x, y, width, height };
    };

    let cutoutDragState = null;
    let layerDragState = null;

    const startCutoutDrag = (event) => {
      commitHistory();
      cutoutDragState = {
        mode: 'move',
        startX: event.clientX,
        startY: event.clientY,
        startCutout: { ...cutout.value },
      };
      document.addEventListener('mousemove', onCutoutMouseMove);
      document.addEventListener('mouseup', endCutoutDrag);
    };

    const startCutoutDragTouch = (event) => {
      commitHistory();
      const touch = event.touches[0];
      cutoutDragState = {
        mode: 'move',
        startX: touch.clientX,
        startY: touch.clientY,
        startCutout: { ...cutout.value },
      };
      document.addEventListener('touchmove', onCutoutTouchMove, { passive: false });
      document.addEventListener('touchend', endCutoutDrag);
    };

    const startCutoutResize = (event, handle) => {
      commitHistory();
      cutoutDragState = {
        mode: 'resize',
        handle,
        startX: event.clientX,
        startY: event.clientY,
        startCutout: { ...cutout.value },
      };
      document.addEventListener('mousemove', onCutoutMouseMove);
      document.addEventListener('mouseup', endCutoutDrag);
    };

    const startCutoutResizeTouch = (event, handle) => {
      commitHistory();
      const touch = event.touches[0];
      cutoutDragState = {
        mode: 'resize',
        handle,
        startX: touch.clientX,
        startY: touch.clientY,
        startCutout: { ...cutout.value },
      };
      document.addEventListener('touchmove', onCutoutTouchMove, { passive: false });
      document.addEventListener('touchend', endCutoutDrag);
    };

    const applyCutoutDelta = (clientX, clientY) => {
      if (!cutoutDragState || !viewportRef.value) return;
      const rect = viewportRef.value.getBoundingClientRect();
      const dx = (clientX - cutoutDragState.startX) / rect.width;
      const dy = (clientY - cutoutDragState.startY) / rect.height;
      const start = cutoutDragState.startCutout;

      if (cutoutDragState.mode === 'move') {
        cutout.value = clampCutout({
          ...start,
          x: start.x + dx,
          y: start.y + dy,
        });
        return;
      }

      let next = { ...start };
      const handle = cutoutDragState.handle;
      if (handle.includes('e')) next.width = start.width + dx;
      if (handle.includes('w')) {
        next.x = start.x + dx;
        next.width = start.width - dx;
      }
      if (handle.includes('s')) next.height = start.height + dy;
      if (handle.includes('n')) {
        next.y = start.y + dy;
        next.height = start.height - dy;
      }
      cutout.value = clampCutout(next);
    };

    const onCutoutMouseMove = (event) => applyCutoutDelta(event.clientX, event.clientY);
    const onCutoutTouchMove = (event) => {
      if (event.touches.length === 1) {
        applyCutoutDelta(event.touches[0].clientX, event.touches[0].clientY);
        event.preventDefault();
      }
    };

    const endCutoutDrag = () => {
      cutoutDragState = null;
      document.removeEventListener('mousemove', onCutoutMouseMove);
      document.removeEventListener('mouseup', endCutoutDrag);
      document.removeEventListener('touchmove', onCutoutTouchMove);
      document.removeEventListener('touchend', endCutoutDrag);
    };

    const startLayerDrag = (event, layerId) => {
      commitHistory();
      selectedLayerId.value = layerId;
      const layer = layers.value.find((item) => item.id === layerId);
      if (!layer) return;
      layerDragState = {
        layerId,
        startX: event.clientX,
        startY: event.clientY,
        startXNorm: layer.x ?? 0.5,
        startYNorm: layer.y ?? 0.5,
      };
      document.addEventListener('mousemove', onLayerMouseMove);
      document.addEventListener('mouseup', endLayerDrag);
    };

    const startLayerDragTouch = (event, layerId) => {
      commitHistory();
      selectedLayerId.value = layerId;
      const touch = event.touches[0];
      const layer = layers.value.find((item) => item.id === layerId);
      if (!layer || !touch) return;
      layerDragState = {
        layerId,
        startX: touch.clientX,
        startY: touch.clientY,
        startXNorm: layer.x ?? 0.5,
        startYNorm: layer.y ?? 0.5,
      };
      document.addEventListener('touchmove', onLayerTouchMove, { passive: false });
      document.addEventListener('touchend', endLayerDrag);
    };

    const applyLayerDrag = (clientX, clientY) => {
      if (!layerDragState || !viewportRef.value) return;
      const rect = viewportRef.value.getBoundingClientRect();
      const dx = (clientX - layerDragState.startX) / rect.width;
      const dy = (clientY - layerDragState.startY) / rect.height;
      const idx = layers.value.findIndex((layer) => layer.id === layerDragState.layerId);
      if (idx < 0) return;
      const layer = layers.value[idx];
      layers.value[idx] = {
        ...layer,
        x: Math.max(0.02, Math.min(0.98, layerDragState.startXNorm + dx)),
        y: Math.max(0.02, Math.min(0.98, layerDragState.startYNorm + dy)),
      };
    };

    const onLayerMouseMove = (event) => applyLayerDrag(event.clientX, event.clientY);
    const onLayerTouchMove = (event) => {
      if (event.touches.length === 1) {
        applyLayerDrag(event.touches[0].clientX, event.touches[0].clientY);
        event.preventDefault();
      }
    };

    const endLayerDrag = () => {
      layerDragState = null;
      document.removeEventListener('mousemove', onLayerMouseMove);
      document.removeEventListener('mouseup', endLayerDrag);
      document.removeEventListener('touchmove', onLayerTouchMove);
      document.removeEventListener('touchend', endLayerDrag);
    };

    const resolveLayersForSave = async (frameId) => {
      const resolved = [];
      for (const layer of layers.value) {
        if (layer.type === 'image') {
          let storagePath = layer.storagePath;
          let url = layer.url;
          if (layer.file) {
            storagePath = `frames/${frameId}/overlays/${layer.id}.png`;
            const upload = await firebaseService.uploadFrameFileAtPath(storagePath, layer.file);
            url = upload.url;
          }
          resolved.push({ ...layer, storagePath, url });
        } else {
          resolved.push({ ...layer });
        }
      }
      return resolved;
    };

    const onKeyDown = (event) => {
      if (!props.modelValue) return;
      const key = event.key.toLowerCase();
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        redo();
      } else if (key === 'z') {
        event.preventDefault();
        undo();
      } else if (key === 'y') {
        event.preventDefault();
        redo();
      }
    };

    const close = () => {
      emit('update:modelValue', false);
    };

    const save = async () => {
      if (!sourcePreviewUrl.value || !frameName.value.trim()) return;
      saving.value = true;
      try {
        updateViewportSize();
        const frameId = props.editFrame?.id || null;
        const resolvedLayers = frameId
          ? await resolveLayersForSave(frameId)
          : layers.value.map((layer) => ({ ...layer }));

        const bakedFile = await bakeFrameOverlayFile({
          source: sourcePreviewUrl.value,
          stencil: { ...editor.transform.value },
          cutout: { ...cutout.value },
          layers: resolvedLayers,
          viewportSize: viewportSize.value,
          fileName: `${frameName.value.trim()}.png`,
        });

        const legacy = layersToLegacyRecipe(resolvedLayers);
        const builderRecipe = {
          stencil: { ...editor.transform.value },
          cutout: { ...cutout.value },
          layers: serializeLayersForRecipe(resolvedLayers),
          overlayLayers: legacy.overlayLayers,
          textLayers: legacy.textLayers,
          viewportSize: viewportSize.value,
          sourceImagePath: null,
        };

        let savedFrame;
        if (props.editFrame?.id) {
          await firebaseService.replaceFrameImage(props.editFrame.id, bakedFile);
          if (sourceFile.value) {
            const sourceUpload = await firebaseService.uploadFrameSourceImage(
              props.editFrame.id,
              sourceFile.value
            );
            builderRecipe.sourceImagePath = sourceUpload.storagePath;
          } else if (props.editFrame.builderRecipe?.sourceImagePath) {
            builderRecipe.sourceImagePath = props.editFrame.builderRecipe.sourceImagePath;
          }
          await firebaseService.updateFrame(props.editFrame.id, {
            name: frameName.value.trim(),
            isPublic: isPublic.value,
            sourceType: 'built',
            builderRecipe,
          });
          savedFrame = await firebaseService.getFrame(props.editFrame.id);
        } else {
          savedFrame = await firebaseService.uploadFrame(bakedFile, frameName.value.trim(), {
            isPublic: isPublic.value,
            sourceType: 'built',
            builderRecipe,
          });
          const uploadedLayers = await resolveLayersForSave(savedFrame.id);
          const uploadedLegacy = layersToLegacyRecipe(uploadedLayers);
          builderRecipe.layers = serializeLayersForRecipe(uploadedLayers);
          builderRecipe.overlayLayers = uploadedLegacy.overlayLayers;
          builderRecipe.textLayers = uploadedLegacy.textLayers;
          if (sourceFile.value) {
            const sourceUpload = await firebaseService.uploadFrameSourceImage(
              savedFrame.id,
              sourceFile.value
            );
            builderRecipe.sourceImagePath = sourceUpload.storagePath;
          }
          await firebaseService.updateFrame(savedFrame.id, { builderRecipe });
          savedFrame = await firebaseService.getFrame(savedFrame.id);
        }

        invalidateFrameCache();
        emit('saved', savedFrame);
        emit('update:modelValue', false);
        $q.notify({ type: 'positive', message: 'Frame saved', position: 'top' });
      } catch (error) {
        console.error('Failed to save frame:', error);
        $q.notify({
          type: 'negative',
          message: 'Could not save frame',
          caption: error?.message || 'Please try again',
          position: 'top',
        });
      } finally {
        saving.value = false;
      }
    };

    onMounted(() => {
      window.addEventListener('resize', updateViewportSize);
      window.addEventListener('keydown', onKeyDown);
    });
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateViewportSize);
      window.removeEventListener('keydown', onKeyDown);
      endCutoutDrag();
      endLayerDrag();
      if (sourcePreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(sourcePreviewUrl.value);
      }
      revokeBlobUrls(layers.value);
    });

    return {
      saving,
      viewportRef,
      sourceFile,
      sourcePreviewUrl,
      frameName,
      isPublic,
      cutout,
      layers,
      selectedLayerId,
      selectedLayer,
      overlayFileInput,
      dragOverViewport,
      fontOptions,
      cutoutHandles,
      cutoutEdges,
      canUndo,
      canRedo,
      editor,
      imageStyle,
      cutoutStyle,
      previewLayerStyle,
      layerLabel,
      onSourceSelected,
      onOverlayFileSelected,
      onViewportDragOver,
      onViewportDragLeave,
      onViewportDrop,
      onSourceImageLoad,
      onBackgroundMouseDown,
      onTouchStart,
      startCutoutDrag,
      startCutoutDragTouch,
      startCutoutResize,
      startCutoutResizeTouch,
      startLayerDrag,
      startLayerDragTouch,
      selectLayer,
      updateLayerProp,
      updateLayerPropWithHistory,
      addTextLayer,
      removeLayer,
      onLayerReorderStart,
      resetZoom,
      fillSquare,
      commitHistory,
      undo,
      redo,
      close,
      save,
    };
  },
};
</script>

<style scoped lang="scss">
.frame-builder-card {
  max-height: 100vh;
}

.frame-builder-viewport {
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1;
  overflow: hidden;
  background: #fff;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &--drag-over {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.25);
  }
}

.frame-builder-interaction {
  position: absolute;
  inset: 0;
  touch-action: none;
}

.frame-builder-stencil {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.frame-builder-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}

.frame-content-layer {
  position: absolute;
  cursor: grab;
  user-select: none;
  touch-action: none;
  pointer-events: auto;

  &:active {
    cursor: grabbing;
  }

  &--selected {
    outline: 2px dashed #667eea;
    outline-offset: 2px;
  }

  &--text {
    font-weight: bold;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    white-space: nowrap;
  }
}

.frame-overlay-image {
  display: block;
  width: 100%;
  height: auto;
  pointer-events: none;
  user-select: none;
}

.frame-cutout-tint {
  position: absolute;
  box-sizing: border-box;
  z-index: 20;
  background: rgba(180, 180, 180, 0.72);
  pointer-events: none;
}

.frame-cutout-chrome {
  position: absolute;
  border: 2px dashed rgba(102, 126, 234, 0.95);
  box-sizing: border-box;
  z-index: 100;
  pointer-events: none;
  background: transparent;
}

.frame-cutout-edge {
  position: absolute;
  pointer-events: auto;

  &--n {
    top: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: move;
  }

  &--s {
    bottom: -5px;
    left: 0;
    right: 0;
    height: 10px;
    cursor: move;
  }

  &--e {
    top: 0;
    right: -5px;
    bottom: 0;
    width: 10px;
    cursor: move;
  }

  &--w {
    top: 0;
    left: -5px;
    bottom: 0;
    width: 10px;
    cursor: move;
  }
}

.frame-cutout-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 1px solid #667eea;
  border-radius: 2px;
  pointer-events: auto;

  &--nw { top: -6px; left: -6px; cursor: nwse-resize; }
  &--ne { top: -6px; right: -6px; cursor: nesw-resize; }
  &--sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
  &--se { bottom: -6px; right: -6px; cursor: nwse-resize; }
}

.frame-layer-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.frame-layer-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  cursor: pointer;

  &--selected {
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.08);
  }
}

.frame-layer-controls {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
}

.frame-color-input {
  width: 40px;
  height: 40px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
}
</style>
