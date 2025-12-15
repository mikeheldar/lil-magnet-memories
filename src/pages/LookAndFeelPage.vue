<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        <q-icon name="palette" size="32px" class="q-mr-sm" />
        Look and Feel
      </div>
      <div class="text-subtitle1 text-grey-7">
        Manage site themes and visual styling
      </div>
    </div>

    <!-- Current Theme Display -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="color_lens" class="q-mr-sm" />
          Current Active Theme
        </div>
        <div v-if="activeTheme" class="row items-center q-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-weight-medium q-mb-xs">Theme Name:</div>
            <div class="text-body1">{{ activeTheme.name }}</div>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-weight-medium q-mb-xs">Created:</div>
            <div class="text-body1">{{ formatDate(activeTheme.createdAt) }}</div>
          </div>
        </div>
        <div v-else class="text-body2 text-grey-6">
          No theme selected
        </div>
      </q-card-section>
    </q-card>

    <!-- Theme Selection -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="style" class="q-mr-sm" />
          Available Themes
        </div>

        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner color="primary" size="48px" />
          <div class="text-h6 text-grey-6 q-mt-md">Loading themes...</div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="theme in themes"
            :key="theme.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card
              :class="{
                'theme-card-active': activeTheme?.id === theme.id,
              }"
              class="theme-card"
            >
              <q-card-section>
                <div class="row items-center justify-between q-mb-sm">
                  <div class="text-h6 text-weight-medium">{{ theme.name }}</div>
                  <q-chip
                    v-if="activeTheme?.id === theme.id"
                    color="positive"
                    text-color="white"
                    size="sm"
                    icon="check_circle"
                  >
                    Active
                  </q-chip>
                </div>
                <div class="text-caption text-grey-7 q-mb-sm">
                  Created: {{ formatDate(theme.createdAt) }}
                </div>
                <div class="text-body2 q-mb-md">
                  {{ theme.description || 'No description' }}
                </div>
              </q-card-section>

              <q-card-actions>
                <q-btn
                  flat
                  label="Edit Name"
                  icon="edit"
                  color="primary"
                  @click="openEditDialog(theme)"
                />
                <q-space />
                <q-btn
                  v-if="activeTheme?.id !== theme.id"
                  label="Activate"
                  color="primary"
                  @click="activateTheme(theme.id)"
                />
                <q-btn
                  v-else
                  label="Active"
                  color="positive"
                  disable
                />
              </q-card-actions>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Edit Theme Name Dialog -->
    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Edit Theme Name</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="editingThemeName"
            label="Theme Name"
            outlined
            dense
            :rules="[(val) => !!val || 'Theme name is required']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            label="Save"
            color="primary"
            @click="saveThemeName"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { themeService } from '../services/themeService.js';

export default {
  name: 'LookAndFeelPage',
  setup() {
    const $q = useQuasar();
    const themes = ref([]);
    const activeTheme = ref(null);
    const loading = ref(true);
    const showEditDialog = ref(false);
    const editingTheme = ref(null);
    const editingThemeName = ref('');

    const loadThemes = async () => {
      try {
        loading.value = true;
        const allThemes = await themeService.getAllThemes();
        themes.value = allThemes;

        const active = await themeService.getActiveTheme();
        activeTheme.value = active;
      } catch (error) {
        console.error('Error loading themes:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load themes',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const activateTheme = async (themeId) => {
      try {
        await themeService.activateTheme(themeId);
        await loadThemes();
        $q.notify({
          type: 'positive',
          message: 'Theme activated successfully',
          position: 'top',
        });
      } catch (error) {
        console.error('Error activating theme:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to activate theme',
          position: 'top',
        });
      }
    };

    const openEditDialog = (theme) => {
      editingTheme.value = theme;
      editingThemeName.value = theme.name;
      showEditDialog.value = true;
    };

    const saveThemeName = async () => {
      if (!editingThemeName.value.trim()) {
        $q.notify({
          type: 'negative',
          message: 'Theme name cannot be empty',
          position: 'top',
        });
        return;
      }

      try {
        await themeService.updateThemeName(
          editingTheme.value.id,
          editingThemeName.value.trim()
        );
        await loadThemes();
        showEditDialog.value = false;
        $q.notify({
          type: 'positive',
          message: 'Theme name updated',
          position: 'top',
        });
      } catch (error) {
        console.error('Error updating theme name:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to update theme name',
          position: 'top',
        });
      }
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown';
      try {
        let date;
        if (timestamp && typeof timestamp.toDate === 'function') {
          // Firestore Timestamp
          date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          date = timestamp;
        } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
          date = new Date(timestamp);
        } else {
          return 'Unknown';
        }
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown';
      }
    };

    onMounted(() => {
      loadThemes();
    });

    return {
      themes,
      activeTheme,
      loading,
      showEditDialog,
      editingThemeName,
      activateTheme,
      openEditDialog,
      saveThemeName,
      formatDate,
    };
  },
};
</script>

<style lang="scss" scoped>
.theme-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.theme-card-active {
  border: 2px solid #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}
</style>
