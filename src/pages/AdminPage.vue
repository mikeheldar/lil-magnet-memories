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

    <!-- User Role Management -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="people" class="q-mr-sm" />
          User Role Management
        </div>

        <div class="q-mb-md">
          <div class="text-weight-medium q-mb-sm">Current Users:</div>
          <div v-if="allUsers.length === 0" class="text-grey-6">
            No users configured
          </div>
          <div v-else>
            <div
              v-for="user in allUsers"
              :key="user.email"
              class="row items-center q-mb-sm"
            >
              <q-chip 
                :color="getRoleColor(user.role)" 
                text-color="white" 
                class="col"
              >
                {{ user.email }}
                <q-icon
                  v-if="user.email === currentUser?.email"
                  name="person"
                  size="xs"
                  class="q-ml-xs"
                />
              </q-chip>
              <q-chip 
                :color="getRoleBadgeColor(user.role)" 
                text-color="white" 
                :icon="getRoleIcon(user.role)"
              >
                {{ getRoleLabel(user.role) }}
              </q-chip>
              <q-btn
                v-if="user.email !== currentUser?.email"
                icon="close"
                size="sm"
                color="negative"
                flat
                round
                @click="removeUserRole(user.email)"
                class="q-ml-sm"
              >
                <q-tooltip>Remove user role</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Add New User with Role -->
        <q-form @submit="addUserRole" class="q-gutter-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-5">
              <q-input
                v-model="newUserEmail"
                label="User Email"
                type="email"
                filled
                hint="Enter an email address"
                :rules="[
                  (val) => !!val || 'Email is required',
                  (val) => isValidEmail(val) || 'Please enter a valid email',
                ]"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="newUserRole"
                :options="roleOptions"
                label="Select Role"
                filled
                emit-value
                map-options
              />
            </div>
            <div class="col-12 col-md-3">
              <q-btn
                type="submit"
                color="primary"
                label="Add User"
                class="full-width"
                :disable="!newUserEmail || !isValidEmail(newUserEmail) || !newUserRole"
                :loading="addingUser"
              />
            </div>
          </div>
        </q-form>

        <!-- Legacy Admin Email Management (for backward compatibility) -->
        <q-expansion-item
          label="Legacy Admin Emails"
          caption="Traditional email-based admin list"
          icon="info"
          class="q-mt-md"
        >
          <div class="q-mb-md">
            <div class="text-weight-medium q-mb-sm">Legacy Admin Emails:</div>
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
        </q-expansion-item>
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
import { USERS_CONFIG, USER_ROLES } from '../config/users';
import { useQuasar } from 'quasar';

export default {
  name: 'AdminPage',
  setup() {
    const $q = useQuasar();
    const currentUser = ref(null);
    const isAdmin = ref(false);
    const newAdminEmail = ref('');
    const adminEmails = ref([]);
    const newUserEmail = ref('');
    const newUserRole = ref('');
    const addingUser = ref(false);
    const allUsers = ref([]);

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const roleOptions = [
      { label: 'Customer', value: USER_ROLES.CUSTOMER },
      { label: 'Operator', value: USER_ROLES.OPERATOR },
      { label: 'Admin', value: USER_ROLES.ADMIN },
    ];

    const getRoleLabel = (role) => {
      switch (role) {
        case USER_ROLES.ADMIN:
          return 'Admin';
        case USER_ROLES.OPERATOR:
          return 'Operator';
        case USER_ROLES.CUSTOMER:
          return 'Customer';
        default:
          return 'Customer';
      }
    };

    const getRoleIcon = (role) => {
      switch (role) {
        case USER_ROLES.ADMIN:
          return 'admin_panel_settings';
        case USER_ROLES.OPERATOR:
          return 'work';
        case USER_ROLES.CUSTOMER:
          return 'person';
        default:
          return 'person';
      }
    };

    const getRoleColor = (role) => {
      switch (role) {
        case USER_ROLES.ADMIN:
          return 'purple';
        case USER_ROLES.OPERATOR:
          return 'blue';
        case USER_ROLES.CUSTOMER:
          return 'grey-7';
        default:
          return 'grey-7';
      }
    };

    const getRoleBadgeColor = (role) => {
      switch (role) {
        case USER_ROLES.ADMIN:
          return 'purple-7';
        case USER_ROLES.OPERATOR:
          return 'blue-7';
        case USER_ROLES.CUSTOMER:
          return 'grey-6';
        default:
          return 'grey-6';
      }
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

    const addUserRole = async () => {
      if (!newUserEmail.value || !isValidEmail(newUserEmail.value)) {
        $q.notify({
          type: 'negative',
          message: 'Please enter a valid email address',
          position: 'top',
        });
        return;
      }

      if (!newUserRole.value) {
        $q.notify({
          type: 'negative',
          message: 'Please select a role',
          position: 'top',
        });
        return;
      }

      addingUser.value = true;
      try {
        await USERS_CONFIG.setUserRole(newUserEmail.value, newUserRole.value);
        await loadAllUsers();

        $q.notify({
          type: 'positive',
          message: 'User added successfully',
          caption: `${newUserEmail.value} is now a ${getRoleLabel(newUserRole.value)}`,
          position: 'top',
        });

        newUserEmail.value = '';
        newUserRole.value = '';
      } catch (error) {
        console.error('Error adding user:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to add user',
          caption: error.message || 'An error occurred',
          position: 'top',
        });
      } finally {
        addingUser.value = false;
      }
    };

    const removeUserRole = async (email) => {
      $q.dialog({
        title: 'Remove User Role',
        message: `Are you sure you want to remove the role from ${email}?`,
        cancel: true,
        persistent: true,
        ok: {
          label: 'Remove',
          color: 'negative',
        },
      }).onOk(async () => {
        try {
          await USERS_CONFIG.removeUserRole(email);
          await loadAllUsers();

          $q.notify({
            type: 'positive',
            message: 'User role removed successfully',
            caption: `${email} is now a regular customer`,
            position: 'top',
          });
        } catch (error) {
          console.error('Error removing user role:', error);
          $q.notify({
            type: 'negative',
            message: 'Failed to remove user role',
            caption: error.message || 'An error occurred',
            position: 'top',
          });
        }
      });
    };

    const loadAllUsers = async () => {
      try {
        const rolesConfig = await USERS_CONFIG.getAllUsersWithRoles();
        allUsers.value = Object.entries(rolesConfig).map(([email, role]) => ({
          email,
          role,
        }));
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    onMounted(async () => {
      // Get current user info
      const user = authService.getCurrentUser();
      currentUser.value = user;
      isAdmin.value = authService.isAdmin();

      // Load admin emails
      adminEmails.value = ADMIN_CONFIG.getAdminEmails();
      
      // Load all users with roles
      await loadAllUsers();
    });

    return {
      currentUser,
      isAdmin,
      newAdminEmail,
      adminEmails,
      isValidEmail,
      addAdminEmail,
      removeAdminEmail,
      newUserEmail,
      newUserRole,
      addingUser,
      allUsers,
      roleOptions,
      getRoleLabel,
      getRoleIcon,
      getRoleColor,
      getRoleBadgeColor,
      addUserRole,
      removeUserRole,
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
