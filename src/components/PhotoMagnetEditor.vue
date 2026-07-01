<template>
  <!-- Mobile: full-screen dialog -->
  <q-dialog
    v-if="isMobile"
    :model-value="modelValue"
    full-screen
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="column photo-magnet-editor-card">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6 col">Edit Photo</div>
        <q-btn flat round dense icon="close" @click="cancel" />
      </q-card-section>
      <q-card-section class="col scroll editor-body">
        <div ref="viewportRef" class="editor-viewport q-mx-auto">
          <div
            class="editor-interaction-layer"
            @mousedown="editor.startDrag"
            @touchstart="onTouchStart"
            @wheel.prevent="editor.handleWheel"
          >
            <div class="editor-image-wrapper" :style="imageStyle">
              <img
                :src="previewSrc"
                alt="Photo preview"
                class="editor-image"
                draggable="false"
                @load="onEditorImageLoad"
              />
            </div>
            <div
              v-if="selectedFrame?.url"
              class="editor-frame-overlay"
              :style="{ backgroundImage: `url('${selectedFrame.url}')` }"
            />
          </div>
        </div>
        <div class="row q-gutter-sm q-mt-md justify-center">
          <q-btn dense outline icon="restart_alt" label="Reset" @click="editor.resetTransform()" />
          <q-btn dense outline icon="crop_square" label="Fill square" @click="editor.fillSquare()" />
        </div>
        <div v-if="frameOptions.length" class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">Frames</div>
          <div class="row q-col-gutter-sm">
            <div class="col-auto">
              <q-btn
                dense
                :outline="!!selectedFrame"
                :color="!selectedFrame ? 'primary' : 'grey'"
                label="None"
                @click="clearFrame"
              />
            </div>
            <div v-for="frame in frameOptions" :key="`${frame.source}-${frame.id}`" class="col-auto">
              <q-btn
                dense
                :outline="selectedFrame?.id !== frame.id"
                :color="selectedFrame?.id === frame.id ? 'primary' : 'grey'"
                @click="selectFrame(frame)"
              >
                <img :src="frame.url" :alt="frame.name" class="frame-thumb" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" @click="cancel" />
        <q-btn color="primary" label="Save" :loading="saving" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Desktop: inline expanded panel -->
  <div v-else-if="modelValue" class="photo-magnet-editor-inline q-mt-md q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="text-h6 col">Edit Photo — {{ photoItem?.originalFile?.name || photoItem?.file?.name }}</div>
      <q-btn flat round dense icon="close" @click="cancel" />
    </div>
    <div ref="viewportRef" class="editor-viewport editor-viewport--desktop q-mx-auto">
      <div
        class="editor-interaction-layer"
        @mousedown="editor.startDrag"
        @touchstart="onTouchStart"
        @wheel.prevent="editor.handleWheel"
      >
        <div class="editor-image-wrapper" :style="imageStyle">
          <img
            :src="previewSrc"
            alt="Photo preview"
            class="editor-image"
            draggable="false"
            @load="onEditorImageLoad"
          />
        </div>
        <div
          v-if="selectedFrame?.url"
          class="editor-frame-overlay"
          :style="{ backgroundImage: `url('${selectedFrame.url}')` }"
        />
      </div>
    </div>
    <div class="row q-gutter-sm q-mt-md justify-center">
      <q-btn dense outline icon="restart_alt" label="Reset" @click="editor.resetTransform()" />
      <q-btn dense outline icon="crop_square" label="Fill square" @click="editor.fillSquare()" />
    </div>
    <div v-if="frameOptions.length" class="q-mt-md">
      <div class="text-subtitle2 q-mb-sm">Frames</div>
      <div class="row q-col-gutter-sm items-center">
        <q-btn
          dense
          :outline="!!selectedFrame"
          :color="!selectedFrame ? 'primary' : 'grey'"
          label="None"
          @click="clearFrame"
        />
        <q-btn
          v-for="frame in frameOptions"
          :key="`${frame.source}-${frame.id}`"
          dense
          :outline="selectedFrame?.id !== frame.id"
          :color="selectedFrame?.id === frame.id ? 'primary' : 'grey'"
          @click="selectFrame(frame)"
        >
          <img :src="frame.url" :alt="frame.name" class="frame-thumb" />
        </q-btn>
      </div>
    </div>
    <div class="row justify-end q-gutter-sm q-mt-md">
      <q-btn flat label="Cancel" @click="cancel" />
      <q-btn color="primary" label="Save" :loading="saving" @click="save" />
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { useSquarePhotoEditor } from '../composables/useSquarePhotoEditor.js';
import { bakeSquarePhotoFile } from '../utils/squarePhotoCanvas.js';
import { resolveUploadFrameOptions } from '../utils/frameAssets.js';
import { marketEventService } from '../services/marketEventService.js';

export default {
  name: 'PhotoMagnetEditor',
  props: {
    modelValue: { type: Boolean, default: false },
    photoItem: { type: Object, default: null },
    eventFrames: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue', 'saved', 'cancel'],
  setup(props, { emit }) {
    const $q = useQuasar();
    const saving = ref(false);
    const viewportSize = ref(320);
    const viewportRef = ref(null);
    const frameOptions = ref([]);
    const selectedFrame = ref(null);
    const editorSourceUrl = ref('');

    const isMobile = computed(() => $q.screen.lt.md);

    const editor = useSquarePhotoEditor(viewportSize);
    const imageStyle = editor.imageStyle;

    const previewSrc = computed(() => {
      if (!props.photoItem) return '';
      return props.photoItem.previewUrl || editorSourceUrl.value || '';
    });

    const updateViewportSize = () => {
      const el = viewportRef.value;
      if (el) {
        viewportSize.value = el.clientWidth || 320;
      }
    };

    const loadFrames = async () => {
      const event = marketEventService.getCheckedInEvent();
      const eventFrameList = props.eventFrames?.length
        ? props.eventFrames
        : event?.frames || [];
      frameOptions.value = await resolveUploadFrameOptions(eventFrameList);
    };

    const syncFrameFromEdit = (edit) => {
      if (!edit?.frameId) {
        selectedFrame.value = null;
        return;
      }
      selectedFrame.value =
        frameOptions.value.find(
          (f) => f.id === edit.frameId && f.source === (edit.frameSource || 'global')
        ) || null;
    };

    const prepareEditor = async () => {
      if (!props.photoItem) return;
      await loadFrames();
      const edit = props.photoItem.edit || {};
      editorSourceUrl.value = '';
      editor.loadTransform(edit);
      syncFrameFromEdit(edit);
      setTimeout(updateViewportSize, 50);
    };

    watch(
      () => props.modelValue,
      (open) => {
        if (open) prepareEditor();
      }
    );

    const onEditorImageLoad = (event) => {
      editor.onImageLoad(event);
      if (!props.photoItem?.edit?.isEdited) {
        editor.resetTransform();
      }
    };

    const onTouchStart = (event) => {
      if (event.touches.length === 2) {
        editor.startPinch(event);
      } else {
        editor.startDrag(event);
      }
    };

    onMounted(() => {
      window.addEventListener('resize', updateViewportSize);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('resize', updateViewportSize);
      if (editorSourceUrl.value?.startsWith('blob:')) {
        URL.revokeObjectURL(editorSourceUrl.value);
      }
    });

    const selectFrame = (frame) => {
      selectedFrame.value = frame;
    };

    const clearFrame = () => {
      selectedFrame.value = null;
    };

    const cancel = () => {
      emit('update:modelValue', false);
      emit('cancel');
    };

    const save = async () => {
      if (!props.photoItem) return;
      saving.value = true;
      try {
        updateViewportSize();
        const sourceFile = props.photoItem.originalFile || props.photoItem.file;
        const tempUrl = URL.createObjectURL(sourceFile);
        const bakedFile = await bakeSquarePhotoFile({
          source: tempUrl,
          transform: { ...editor.transform.value },
          viewportSize: viewportSize.value,
          frameUrl: selectedFrame.value?.url || null,
          fileName: sourceFile?.name,
        });
        URL.revokeObjectURL(tempUrl);

        emit('saved', {
          file: bakedFile,
          previewUrl: URL.createObjectURL(bakedFile),
          edit: {
            scale: editor.transform.value.scale,
            x: editor.transform.value.x,
            y: editor.transform.value.y,
            frameId: selectedFrame.value?.id || null,
            frameSource: selectedFrame.value?.source || null,
            frameUrl: selectedFrame.value?.url || null,
            isEdited: true,
          },
        });
        emit('update:modelValue', false);
      } catch (error) {
        console.error('Failed to save photo edit:', error);
        $q.notify({
          type: 'negative',
          message: 'Could not save photo edit',
          caption: error?.message || 'Please try again',
        });
      } finally {
        saving.value = false;
      }
    };

    return {
      isMobile,
      saving,
      viewportRef,
      frameOptions,
      selectedFrame,
      previewSrc,
      imageStyle,
      editor,
      selectFrame,
      clearFrame,
      cancel,
      save,
      onEditorImageLoad,
      onTouchStart,
    };
  },
};
</script>

<style scoped lang="scss">
.photo-magnet-editor-card {
  min-height: 100%;
}

.photo-magnet-editor-inline {
  border: 2px solid #667eea;
  border-radius: 12px;
  background: #fafafa;
}

.editor-viewport {
  position: relative;
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.editor-viewport--desktop {
  max-width: 480px;
}

.editor-interaction-layer {
  position: absolute;
  inset: 0;
  touch-action: none;
}

.editor-image-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.editor-image-wrapper:active {
  cursor: grabbing;
}

.editor-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  display: block;
}

.editor-frame-overlay {
  position: absolute;
  inset: 0;
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: center;
  pointer-events: none;
}

.frame-thumb {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}
</style>
