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
        <q-btn flat round dense icon="close" @click="close" />
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
              <div ref="viewportRef" class="frame-builder-viewport q-mx-auto">
                <div
                  class="frame-builder-interaction"
                  @mousedown="editor.startDrag"
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
                  <div
                    class="frame-cutout"
                    :style="cutoutStyle"
                    @mousedown.stop="startCutoutDrag"
                    @touchstart.stop="startCutoutDragTouch"
                  >
                    <div class="frame-cutout-inner-tint" />
                    <div
                      v-for="handle in cutoutHandles"
                      :key="handle"
                      class="frame-cutout-handle"
                      :class="`frame-cutout-handle--${handle}`"
                      @mousedown.stop="(e) => startCutoutResize(e, handle)"
                      @touchstart.stop="(e) => startCutoutResizeTouch(e, handle)"
                    />
                  </div>
                  <div
                    v-for="(layer, index) in textLayers"
                    :key="index"
                    class="frame-text-layer"
                    :class="{ 'frame-text-layer--selected': selectedTextIndex === index }"
                    :style="textLayerStyle(layer)"
                    @mousedown.stop="(e) => startTextDrag(e, index)"
                    @touchstart.stop="(e) => startTextDragTouch(e, index)"
                  >
                    {{ layer.text }}
                  </div>
                </div>
              </div>
              <div class="row q-gutter-sm q-mt-sm justify-center">
                <q-btn dense outline icon="restart_alt" label="Reset zoom" @click="editor.resetTransform()" />
                <q-btn dense outline icon="crop_square" label="Fill square" @click="editor.fillSquare()" />
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
                <q-slider v-model="cutout.width" :min="0.2" :max="0.95" :step="0.01" label label-always />
                <div class="text-caption">Width</div>
              </div>
              <div class="col-6">
                <q-slider v-model="cutout.height" :min="0.2" :max="0.95" :step="0.01" label label-always />
                <div class="text-caption">Height</div>
              </div>
            </div>

            <div class="text-subtitle2 q-mb-sm">Text</div>
            <q-input v-model="newText" label="Text to add" filled dense class="q-mb-sm" />
            <div class="row q-gutter-sm q-mb-sm items-center">
              <q-input v-model="newTextColor" label="Color" filled dense style="max-width: 120px" />
              <input v-model="newTextColor" type="color" class="frame-color-input" />
            </div>
            <q-select
              v-model="newTextFont"
              :options="fontOptions"
              label="Font"
              filled
              dense
              emit-value
              map-options
              class="q-mb-sm"
            />
            <q-btn dense outline label="Add text" class="q-mb-md" @click="addTextLayer" />
            <div v-if="selectedTextLayer" class="q-mb-md">
              <q-input
                v-model="selectedTextLayer.text"
                label="Selected text"
                filled
                dense
                class="q-mb-sm"
              />
              <q-select
                v-model="selectedTextLayer.font"
                :options="fontOptions"
                label="Font"
                filled
                dense
                emit-value
                map-options
                class="q-mb-sm"
              />
              <div class="q-mb-sm">
                <q-slider
                  v-model="selectedTextLayer.scale"
                  :min="0.5"
                  :max="3"
                  :step="0.1"
                  label
                  label-always
                />
                <div class="text-caption">Text size — drag text on preview to reposition</div>
              </div>
              <div class="row q-gutter-sm items-center">
                <q-input v-model="selectedTextLayer.color" label="Color" filled dense style="max-width: 120px" />
                <input v-model="selectedTextLayer.color" type="color" class="frame-color-input" />
                <q-btn flat dense color="negative" icon="delete" @click="removeSelectedText" />
              </div>
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
import { useSquarePhotoEditor } from '../composables/useSquarePhotoEditor.js';
import {
  bakeFrameOverlayFile,
  DEFAULT_FRAME_CUTOUT,
} from '../utils/squarePhotoCanvas.js';
import { firebaseService } from '../services/firebaseService.js';
import { invalidateFrameCache } from '../services/frameCatalogService.js';

const FONT_OPTIONS = [
  { label: 'Sans Serif', value: 'sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Script', value: '"Brush Script MT", cursive' },
  { label: 'Bold Display', value: 'Impact, sans-serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Comic', value: '"Comic Sans MS", cursive' },
  { label: 'Elegant', value: '"Palatino Linotype", Palatino, serif' },
];

export default {
  name: 'FrameBuilder',
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
    const textLayers = ref([]);
    const selectedTextIndex = ref(-1);
    const newText = ref('');
    const newTextColor = ref('#ffffff');
    const newTextFont = ref('sans-serif');
    const cutoutHandles = ['nw', 'ne', 'sw', 'se'];
    const fontOptions = FONT_OPTIONS;
    const pendingEditRecipe = ref(null);

    const editor = useSquarePhotoEditor(viewportSize);
    const imageStyle = editor.imageStyle;

    const selectedTextLayer = computed(() =>
      selectedTextIndex.value >= 0 ? textLayers.value[selectedTextIndex.value] : null
    );

    const cutoutStyle = computed(() => ({
      left: `${cutout.value.x * 100}%`,
      top: `${cutout.value.y * 100}%`,
      width: `${cutout.value.width * 100}%`,
      height: `${cutout.value.height * 100}%`,
    }));

    const textLayerStyle = (layer) => ({
      left: `${(layer.x ?? 0.5) * 100}%`,
      top: `${(layer.y ?? 0.5) * 100}%`,
      color: layer.color || '#ffffff',
      fontFamily: layer.font || 'sans-serif',
      fontSize: `${Math.max(10, (layer.scale ?? 1) * 18)}px`,
      transform: 'translate(-50%, -50%)',
    });

    const updateViewportSize = () => {
      const el = viewportRef.value;
      if (el) viewportSize.value = el.clientWidth || 320;
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
      textLayers.value = [];
      selectedTextIndex.value = -1;
      pendingEditRecipe.value = null;
      editor.resetTransform();
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

    const loadEditFrame = async () => {
      const frame = props.editFrame;
      if (!frame) return;
      frameName.value = frame.name || '';
      isPublic.value = frame.isPublic === true;
      if (frame.builderRecipe) {
        pendingEditRecipe.value = frame.builderRecipe;
        cutout.value = { ...DEFAULT_FRAME_CUTOUT, ...frame.builderRecipe.cutout };
        textLayers.value = Array.isArray(frame.builderRecipe.textLayers)
          ? frame.builderRecipe.textLayers.map((layer) => ({ ...layer }))
          : [];
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
      setTimeout(updateViewportSize, 50);
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

    const onSourceImageLoad = (event) => {
      if (pendingEditRecipe.value) {
        editor.onImageLoad(event, { preserveTransform: true });
        applyRecipeTransform(pendingEditRecipe.value);
        pendingEditRecipe.value = null;
        return;
      }
      editor.onImageLoad(event);
    };

    const onTouchStart = (event) => {
      if (event.touches.length === 2) editor.startPinch(event);
      else editor.startDrag(event);
    };

    const clampCutout = (next) => {
      const width = Math.max(0.1, Math.min(0.95, next.width));
      const height = Math.max(0.1, Math.min(0.95, next.height));
      const x = Math.max(0, Math.min(1 - width, next.x));
      const y = Math.max(0, Math.min(1 - height, next.y));
      return { x, y, width, height };
    };

    let cutoutDragState = null;
    let textDragState = null;

    const startCutoutDrag = (event) => {
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

    const startTextDrag = (event, index) => {
      selectedTextIndex.value = index;
      const layer = textLayers.value[index];
      if (!layer) return;
      textDragState = {
        index,
        startX: event.clientX,
        startY: event.clientY,
        startXNorm: layer.x ?? 0.5,
        startYNorm: layer.y ?? 0.5,
      };
      document.addEventListener('mousemove', onTextMouseMove);
      document.addEventListener('mouseup', endTextDrag);
    };

    const startTextDragTouch = (event, index) => {
      selectedTextIndex.value = index;
      const touch = event.touches[0];
      const layer = textLayers.value[index];
      if (!layer || !touch) return;
      textDragState = {
        index,
        startX: touch.clientX,
        startY: touch.clientY,
        startXNorm: layer.x ?? 0.5,
        startYNorm: layer.y ?? 0.5,
      };
      document.addEventListener('touchmove', onTextTouchMove, { passive: false });
      document.addEventListener('touchend', endTextDrag);
    };

    const applyTextDrag = (clientX, clientY) => {
      if (!textDragState || !viewportRef.value) return;
      const rect = viewportRef.value.getBoundingClientRect();
      const dx = (clientX - textDragState.startX) / rect.width;
      const dy = (clientY - textDragState.startY) / rect.height;
      const layer = textLayers.value[textDragState.index];
      if (!layer) return;
      layer.x = Math.max(0.05, Math.min(0.95, textDragState.startXNorm + dx));
      layer.y = Math.max(0.05, Math.min(0.95, textDragState.startYNorm + dy));
    };

    const onTextMouseMove = (event) => applyTextDrag(event.clientX, event.clientY);
    const onTextTouchMove = (event) => {
      if (event.touches.length === 1) {
        applyTextDrag(event.touches[0].clientX, event.touches[0].clientY);
        event.preventDefault();
      }
    };

    const endTextDrag = () => {
      textDragState = null;
      document.removeEventListener('mousemove', onTextMouseMove);
      document.removeEventListener('mouseup', endTextDrag);
      document.removeEventListener('touchmove', onTextTouchMove);
      document.removeEventListener('touchend', endTextDrag);
    };

    const addTextLayer = () => {
      if (!newText.value.trim()) return;
      textLayers.value.push({
        text: newText.value.trim(),
        color: newTextColor.value,
        font: newTextFont.value,
        x: 0.5,
        y: 0.12,
        scale: 1,
        rotation: 0,
      });
      selectedTextIndex.value = textLayers.value.length - 1;
      newText.value = '';
    };

    const selectTextLayer = (index) => {
      selectedTextIndex.value = index;
    };

    const removeSelectedText = () => {
      if (selectedTextIndex.value < 0) return;
      textLayers.value.splice(selectedTextIndex.value, 1);
      selectedTextIndex.value = -1;
    };

    const close = () => {
      emit('update:modelValue', false);
    };

    const save = async () => {
      if (!sourcePreviewUrl.value || !frameName.value.trim()) return;
      saving.value = true;
      try {
        updateViewportSize();
        const bakedFile = await bakeFrameOverlayFile({
          source: sourcePreviewUrl.value,
          stencil: { ...editor.transform.value },
          cutout: { ...cutout.value },
          textLayers: textLayers.value,
          viewportSize: viewportSize.value,
          fileName: `${frameName.value.trim()}.png`,
        });

        const builderRecipe = {
          stencil: { ...editor.transform.value },
          cutout: { ...cutout.value },
          textLayers: textLayers.value.map((layer) => ({ ...layer })),
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
          if (sourceFile.value) {
            const sourceUpload = await firebaseService.uploadFrameSourceImage(
              savedFrame.id,
              sourceFile.value
            );
            builderRecipe.sourceImagePath = sourceUpload.storagePath;
            await firebaseService.updateFrame(savedFrame.id, { builderRecipe });
            savedFrame = await firebaseService.getFrame(savedFrame.id);
          }
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

    onMounted(() => window.addEventListener('resize', updateViewportSize));
    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateViewportSize);
      endCutoutDrag();
      endTextDrag();
      if (sourcePreviewUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(sourcePreviewUrl.value);
      }
    });

    return {
      saving,
      viewportRef,
      sourceFile,
      sourcePreviewUrl,
      frameName,
      isPublic,
      cutout,
      textLayers,
      selectedTextIndex,
      selectedTextLayer,
      newText,
      newTextColor,
      newTextFont,
      fontOptions,
      cutoutHandles,
      editor,
      imageStyle,
      cutoutStyle,
      textLayerStyle,
      onSourceSelected,
      onSourceImageLoad,
      onTouchStart,
      startCutoutDrag,
      startCutoutDragTouch,
      startCutoutResize,
      startCutoutResizeTouch,
      startTextDrag,
      startTextDragTouch,
      addTextLayer,
      selectTextLayer,
      removeSelectedText,
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

.frame-cutout {
  position: absolute;
  border: 2px dashed rgba(102, 126, 234, 0.95);
  cursor: move;
  z-index: 2;
  box-sizing: border-box;
  pointer-events: auto;
}

.frame-cutout-inner-tint {
  position: absolute;
  inset: 0;
  background: rgba(180, 180, 180, 0.72);
  pointer-events: none;
}

.frame-cutout-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  border: 1px solid #667eea;
  border-radius: 2px;

  &--nw { top: -6px; left: -6px; cursor: nwse-resize; }
  &--ne { top: -6px; right: -6px; cursor: nesw-resize; }
  &--sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
  &--se { bottom: -6px; right: -6px; cursor: nwse-resize; }
}

.frame-text-layer {
  position: absolute;
  z-index: 4;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  cursor: grab;
  user-select: none;
  white-space: nowrap;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }

  &--selected {
    outline: 2px dashed #667eea;
  }
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
