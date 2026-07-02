<template>
  <q-page padding class="frame-library-page">
    <q-card>
      <q-card-section>
        <div class="frame-library-header q-mb-md">
          <div class="frame-library-header-text">
            <div class="text-h5">Frame Library</div>
            <div class="text-caption text-grey-7">
              Upload or create frames, set public availability, and schedule featured frames.
            </div>
          </div>
          <div class="frame-library-actions">
            <q-btn
              outline
              icon="upload"
              label="Upload Frame PNG"
              class="frame-library-action-btn"
              @click="triggerUpload"
            />
            <q-btn
              color="primary"
              icon="add_photo_alternate"
              label="Create from photo"
              class="frame-library-action-btn"
              @click="openBuilder()"
            />
          </div>
        </div>

        <q-banner v-if="usingStaticFallback" class="bg-orange-1 text-orange-10 q-mb-md" rounded dense>
          Showing built-in default frames. Firestore frame library will sync once rules are deployed.
        </q-banner>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/png,image/webp"
          class="hidden"
          @change="onFileInputChange"
        />

        <q-banner v-if="frames.length === 0 && !loading" class="bg-grey-2 q-mb-md" rounded>
          No frames in the library yet. Upload a PNG or create one from a photo.
        </q-banner>

        <q-inner-loading :showing="loading">
          <q-spinner size="40px" color="primary" />
        </q-inner-loading>

        <draggable
          v-if="frames.length"
          v-model="frames"
          item-key="id"
          handle=".frame-drag-handle"
          class="frame-draggable-list"
          @end="onDragEnd"
        >
          <template #item="{ element: frame }">
            <div class="frame-list-item q-mb-sm">
              <q-icon name="drag_indicator" class="frame-drag-handle cursor-grab text-grey-6" size="sm" />
              <img :src="frame.imageUrl" :alt="frame.name" class="frame-list-thumb" />
              <div class="col">
                <div class="text-subtitle2">{{ frame.name }}</div>
                <div class="text-caption text-grey-7">
                  {{ frame.sourceType === 'built' ? 'Built' : 'Uploaded' }}
                  <span v-if="frame.isPublic"> · Public</span>
                </div>
              </div>
              <div class="frame-list-actions">
                <q-btn
                  v-if="frame.sourceType === 'built'"
                  flat
                  dense
                  icon="edit"
                  class="frame-edit-btn"
                  @click="openBuilder(frame)"
                />
                <span v-else class="frame-edit-spacer" aria-hidden="true" />
                <q-toggle
                  :model-value="frame.isPublic === true"
                  label="Public"
                  dense
                  class="frame-public-toggle"
                  :disable="!isAdmin"
                  @update:model-value="(val) => togglePublic(frame, val)"
                />
                <q-btn flat dense color="negative" icon="delete" class="frame-delete-btn" @click="confirmDelete(frame)" />
              </div>
            </div>
          </template>
        </draggable>
      </q-card-section>
    </q-card>

    <q-card v-if="isAdmin" class="q-mt-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Featured schedules</div>
        <div class="text-caption text-grey-7 q-mb-md">
          Pin frames to the top of the public catalog during date ranges (e.g. holidays).
          Use <strong>MM-DD</strong> for recurring yearly dates (e.g. 12-01) or <strong>YYYY-MM-DD</strong> for one-time ranges.
        </div>

        <div
          v-for="(schedule, index) in featuredSchedules"
          :key="index"
          class="row q-col-gutter-sm q-mb-sm items-center"
        >
          <div class="col-12 col-md-4">
            <q-select
              v-model="schedule.frameId"
              :options="frameSelectOptions"
              label="Frame"
              filled
              dense
              emit-value
              map-options
            />
          </div>
          <div class="col-6 col-md-2">
            <q-input
              v-model="schedule.startDate"
              label="Start"
              filled
              dense
              placeholder="MM-DD or YYYY-MM-DD"
              hint="Recurring: 02-01"
            />
          </div>
          <div class="col-6 col-md-2">
            <q-input
              v-model="schedule.endDate"
              label="End"
              filled
              dense
              placeholder="MM-DD or YYYY-MM-DD"
              hint="Recurring: 02-14"
            />
          </div>
          <div class="col-6 col-md-2">
            <q-input v-model.number="schedule.priority" type="number" label="Priority" filled dense />
          </div>
          <div class="col-6 col-md-2">
            <q-btn flat dense color="negative" icon="delete" @click="removeSchedule(index)" />
          </div>
        </div>

        <div class="row q-gutter-sm q-mt-sm">
          <q-btn outline icon="add" label="Add schedule" @click="addSchedule" />
          <q-btn color="primary" label="Save schedules" :loading="savingSchedules" @click="saveSchedules" />
        </div>
      </q-card-section>
    </q-card>

    <FrameBuilder
      v-model="showBuilder"
      :edit-frame="builderEditFrame"
      @saved="onFrameSaved"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import draggable from 'vuedraggable';
import FrameBuilder from '../components/FrameBuilder.vue';
import { firebaseService } from '../services/firebaseService.js';
import {
  getLibraryFrames,
  invalidateFrameCache,
  getFrameCatalogConfig,
  ensureStaticManifestFrames,
  migrateLegacyEventFrames,
  libraryLoadUsedStaticFallback,
} from '../services/frameCatalogService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'FrameLibraryPage',
  components: { draggable, FrameBuilder },
  setup() {
    const $q = useQuasar();
    const loading = ref(true);
    const savingSchedules = ref(false);
    const frames = ref([]);
    const featuredSchedules = ref([]);
    const showBuilder = ref(false);
    const builderEditFrame = ref(null);
    const fileInputRef = ref(null);
    const isAdmin = ref(false);
    const usingStaticFallback = ref(false);

    const frameSelectOptions = computed(() =>
      frames.value.map((frame) => ({ label: frame.name, value: frame.id }))
    );

    const loadFrames = async () => {
      loading.value = true;
      try {
        frames.value = await getLibraryFrames(true);
        usingStaticFallback.value = libraryLoadUsedStaticFallback();
      } finally {
        loading.value = false;
      }
    };

    const loadSchedules = async () => {
      const config = await getFrameCatalogConfig();
      featuredSchedules.value = (config.featuredSchedules || []).map((schedule) => ({
        frameId: schedule.frameId || '',
        startDate: schedule.startDate || '',
        endDate: schedule.endDate || '',
        priority: Number(schedule.priority) || 0,
      }));
    };

    onMounted(async () => {
      isAdmin.value = await authService.isAdminAsync();
      await ensureStaticManifestFrames();
      await migrateLegacyEventFrames();
      await loadFrames();
      await loadSchedules();
    });

    const triggerUpload = () => fileInputRef.value?.click();

    const onFileInputChange = async (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      $q.dialog({
        title: 'Frame name',
        prompt: { model: file.name.replace(/\.[^.]+$/, ''), type: 'text' },
        cancel: true,
      }).onOk(async (name) => {
        try {
          await firebaseService.uploadFrame(file, name, { isPublic: false, sourceType: 'upload' });
          invalidateFrameCache();
          await loadFrames();
          $q.notify({ type: 'positive', message: 'Frame uploaded', position: 'top' });
        } catch (error) {
          $q.notify({
            type: 'negative',
            message: 'Upload failed',
            caption: error?.message,
            position: 'top',
          });
        }
      });
    };

    const onDragEnd = async () => {
      const updates = frames.value.map((frame, index) => ({
        id: frame.id,
        sortOrder: index,
      }));
      try {
        await firebaseService.updateFrameSortOrders(updates);
        invalidateFrameCache();
      } catch (error) {
        console.error('Failed to update sort order:', error);
        await loadFrames();
      }
    };

    const togglePublic = async (frame, isPublic) => {
      try {
        await firebaseService.updateFrame(frame.id, { isPublic });
        frame.isPublic = isPublic;
        invalidateFrameCache();
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Could not update frame', position: 'top' });
      }
    };

    const confirmDelete = (frame) => {
      $q.dialog({
        title: 'Delete frame',
        message: `Remove "${frame.name}" from the library?`,
        cancel: true,
        persistent: true,
      }).onOk(async () => {
        try {
          await firebaseService.deleteFrame(frame.id);
          invalidateFrameCache();
          await loadFrames();
          $q.notify({ type: 'positive', message: 'Frame deleted', position: 'top' });
        } catch (error) {
          $q.notify({ type: 'negative', message: 'Delete failed', position: 'top' });
        }
      });
    };

    const openBuilder = (frame = null) => {
      builderEditFrame.value = frame;
      showBuilder.value = true;
    };

    const onFrameSaved = async () => {
      invalidateFrameCache();
      await loadFrames();
    };

    const addSchedule = () => {
      featuredSchedules.value.push({
        frameId: frames.value[0]?.id || '',
        startDate: '',
        endDate: '',
        priority: 1,
      });
    };

    const removeSchedule = (index) => {
      featuredSchedules.value.splice(index, 1);
    };

    const saveSchedules = async () => {
      savingSchedules.value = true;
      try {
        await firebaseService.updateFrameCatalogConfig({
          featuredSchedules: featuredSchedules.value.filter((schedule) => schedule.frameId),
        });
        $q.notify({ type: 'positive', message: 'Schedules saved', position: 'top' });
      } catch (error) {
        $q.notify({ type: 'negative', message: 'Could not save schedules', position: 'top' });
      } finally {
        savingSchedules.value = false;
      }
    };

    return {
      loading,
      savingSchedules,
      frames,
      featuredSchedules,
      showBuilder,
      builderEditFrame,
      fileInputRef,
      isAdmin,
      usingStaticFallback,
      frameSelectOptions,
      triggerUpload,
      onFileInputChange,
      onDragEnd,
      togglePublic,
      confirmDelete,
      openBuilder,
      onFrameSaved,
      addSchedule,
      removeSchedule,
      saveSchedules,
    };
  },
};
</script>

<style scoped lang="scss">
.frame-library-header {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.frame-library-header-text {
  min-width: 0;
}

.frame-library-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;

  @media (min-width: 768px) {
    width: auto;
    max-width: 420px;
    justify-content: flex-end;
  }
}

.frame-library-action-btn {
  flex: 1 1 calc(50% - 4px);
  min-width: 0;

  @media (min-width: 768px) {
    flex: 1 1 0;
    min-width: 180px;
  }
}

.hidden {
  display: none;
}

.frame-draggable-list {
  display: flex;
  flex-direction: column;
}

.frame-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;

  .col {
    flex: 1;
    min-width: 0;
  }
}

.frame-list-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.frame-edit-btn,
.frame-edit-spacer {
  width: 36px;
  flex-shrink: 0;
}

.frame-edit-spacer {
  display: inline-block;
}

.frame-public-toggle {
  flex-shrink: 0;
}

.frame-delete-btn {
  flex-shrink: 0;
}

.frame-list-thumb {
  width: 52px;
  height: 52px;
  object-fit: contain;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #fff;
}

.frame-drag-handle {
  flex-shrink: 0;
}
</style>
