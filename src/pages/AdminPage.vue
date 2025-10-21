<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        <q-icon name="admin_panel_settings" size="32px" class="q-mr-sm" />
        Admin Settings
      </div>
      <div class="text-subtitle1 text-grey-7">
        Manage system configuration and admin users
      </div>
    </div>

    <!-- Admin Status Card -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="person" class="q-mr-sm" />
          Current User Status
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <div class="text-weight-medium">Email:</div>
            <div class="text-body1">
              {{ currentUser?.email || 'Not logged in' }}
            </div>
          </div>
          <div class="col-12 col-md-6">
            <div class="text-weight-medium">Admin Status:</div>
            <q-chip
              :color="isAdmin ? 'positive' : 'negative'"
              text-color="white"
              :icon="isAdmin ? 'check_circle' : 'cancel'"
            >
              {{ isAdmin ? 'Admin User' : 'Regular User' }}
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Admin Email Management -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="email" class="q-mr-sm" />
          Admin Email Management
        </div>

        <div class="q-mb-md">
          <div class="text-weight-medium q-mb-sm">Current Admin Emails:</div>
          <div v-if="adminEmails.length === 0" class="text-grey-6">
            No admin emails configured
          </div>
          <div v-else>
            <div
              v-for="email in adminEmails"
              :key="email"
              class="row items-center q-mb-sm"
            >
              <q-chip color="primary" text-color="white" class="col">
                {{ email }}
                <q-icon
                  v-if="email === currentUser?.email"
                  name="person"
                  size="xs"
                  class="q-ml-xs"
                />
              </q-chip>
              <q-btn
                v-if="email !== currentUser?.email"
                icon="close"
                size="sm"
                color="negative"
                flat
                round
                @click="removeAdminEmail(email)"
                class="q-ml-sm"
              >
                <q-tooltip>Remove admin access</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Add New Admin Email -->
        <q-form @submit="addAdminEmail" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-8">
              <q-input
                v-model="newAdminEmail"
                label="Add New Admin Email"
                type="email"
                filled
                hint="Enter an email address to grant admin access"
                :rules="[
                  (val) => !!val || 'Email is required',
                  (val) => isValidEmail(val) || 'Please enter a valid email',
                ]"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-btn
                type="submit"
                color="primary"
                label="Add Admin"
                class="full-width"
                :disable="!newAdminEmail || !isValidEmail(newAdminEmail)"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- System Information -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="info" class="q-mr-sm" />
          System Information
        </div>

        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label>Firebase Project:</q-item-label>
              <q-item-label caption>lil-magnet-memories</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Database:</q-item-label>
              <q-item-label caption
                >lil-magnet-memories (Firestore)</q-item-label
              >
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>Authentication:</q-item-label>
              <q-item-label caption
                >Google Sign-In (Firebase Auth)</q-item-label
              >
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Quick Actions -->
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="flash_on" class="q-mr-sm" />
          Quick Actions
        </div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-btn
              color="secondary"
              icon="bug_report"
              label="Firebase Diagnostic"
              @click="$router.push('/firebase-test')"
              class="full-width"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-btn
              color="accent"
              icon="inventory"
              label="View Orders"
              @click="$router.push('/orders')"
              class="full-width"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { authService } from '../services/authService';
import { ADMIN_CONFIG } from '../config/admin';
import { useQuasar } from 'quasar';

export default {
  name: 'AdminPage',
  setup() {
    const $q = useQuasar();
    const currentUser = ref(null);
    const isAdmin = ref(false);
    const newAdminEmail = ref('');
    const adminEmails = ref([]);

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const addAdminEmail = async () => {
      if (!newAdminEmail.value || !isValidEmail(newAdminEmail.value)) {
        $q.notify({
          type: 'negative',
          message: 'Please enter a valid email address',
          position: 'top',
        });
        return;
      }

      try {
        await ADMIN_CONFIG.addAdminEmail(newAdminEmail.value);
        adminEmails.value = ADMIN_CONFIG.getAdminEmails();

        $q.notify({
          type: 'positive',
          message: 'Admin email added successfully',
          caption: `${newAdminEmail.value} now has admin access`,
          position: 'top',
        });

        newAdminEmail.value = '';
      } catch (error) {
        console.error('Error adding admin email:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to add admin email',
          caption: error.message || 'An error occurred',
          position: 'top',
        });
      }
    };

    const removeAdminEmail = async (email) => {
      // Confirm removal
      $q.dialog({
        title: 'Remove Admin Access',
        message: `Are you sure you want to remove admin access from ${email}?`,
        cancel: true,
        persistent: true,
        ok: {
          label: 'Remove',
          color: 'negative',
        },
      }).onOk(async () => {
        try {
          await ADMIN_CONFIG.removeAdminEmail(email);
          adminEmails.value = ADMIN_CONFIG.getAdminEmails();

          $q.notify({
            type: 'positive',
            message: 'Admin access removed successfully',
            caption: `${email} no longer has admin access`,
            position: 'top',
          });
        } catch (error) {
          console.error('Error removing admin email:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to remove admin access',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        }
      });
    };

    onMounted(() => {
      // Get current user info
      const user = authService.getCurrentUser();
      currentUser.value = user;
      isAdmin.value = authService.isAdmin();

      // Load admin emails
      adminEmails.value = ADMIN_CONFIG.getAdminEmails();
    });

    return {
      currentUser,
      isAdmin,
      newAdminEmail,
      adminEmails,
      isValidEmail,
      addAdminEmail,
      removeAdminEmail,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}
</style>
