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
      <!-- Admin page loaded -->
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
          <div class="text-weight-medium q-mb-sm">Admins and Operators:</div>
          <div v-if="adminsAndOperators.length === 0" class="text-grey-6">
            No admins or operators configured
          </div>
          <div v-else>
            <div
              v-for="user in adminsAndOperators"
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
                icon="edit"
                size="sm"
                :color="canEditOrRemove(user.email) ? 'primary' : 'grey-5'"
                flat
                round
                :disable="!canEditOrRemove(user.email)"
                @click="canEditOrRemove(user.email) && editUserRole(user)"
                class="q-ml-sm"
              >
                <q-tooltip>{{ getEditTooltip(user.email) }}</q-tooltip>
              </q-btn>
              <q-btn
                icon="close"
                size="sm"
                :color="canEditOrRemove(user.email) ? 'negative' : 'grey-5'"
                flat
                round
                :disable="!canEditOrRemove(user.email)"
                @click="canEditOrRemove(user.email) && removeUserRole(user.email)"
                class="q-ml-sm"
              >
                <q-tooltip>{{ getRemoveTooltip(user.email) }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <!-- Add New Admin or Operator -->
        <q-form @submit="addUserRole" class="q-gutter-md">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-5">
              <q-input
                v-model="newUserEmail"
                label="Email Address"
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
                hint="Admin has full access, Operator has limited admin access"
              />
            </div>
            <div class="col-12 col-md-3">
              <q-btn
                type="submit"
                color="primary"
                :label="editingUser ? 'Update Role' : 'Add User'"
                class="full-width"
                :disable="!newUserEmail || !isValidEmail(newUserEmail) || !newUserRole"
                :loading="addingUser"
              />
            </div>
          </div>
          <q-btn
            v-if="editingUser"
            type="button"
            color="grey"
            label="Cancel"
            flat
            @click="cancelEdit"
            class="q-mt-sm"
          />
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
import { USERS_CONFIG, USER_ROLES } from '../config/users';
import { useQuasar } from 'quasar';

export default {
  name: 'AdminPage',
  setup() {
    const $q = useQuasar();
    const currentUser = ref(null);
    const isAdmin = ref(false);
    const newUserEmail = ref('');
    const newUserRole = ref('');
    const addingUser = ref(false);
    const allUsers = ref([]);
    const editingUser = ref(null);

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    // Initial admin emails (hardcoded for security)
    const INITIAL_ADMIN_EMAILS = [
      'michael.helmandarley@gmail.com',
      'lilmagnetmemories@gmail.com',
    ];

    const isInitialAdmin = (email) => {
      if (!email) return false;
      const normalizedEmail = email.toLowerCase().trim();
      return INITIAL_ADMIN_EMAILS.includes(normalizedEmail);
    };

    const canEditOrRemove = (userEmail) => {
      if (!userEmail) return false;
      const normalizedEmail = userEmail.toLowerCase().trim();
      // Can't edit/remove if it's the current user
      if (currentUser.value?.email?.toLowerCase().trim() === normalizedEmail) {
        return false;
      }
      // Can't edit/remove if it's an initial admin
      if (isInitialAdmin(normalizedEmail)) {
        return false;
      }
      return true;
    };

    const getEditTooltip = (userEmail) => {
      if (!userEmail) return 'Edit role';
      const normalizedEmail = userEmail.toLowerCase().trim();
      if (currentUser.value?.email?.toLowerCase().trim() === normalizedEmail) {
        return 'You cannot remove or edit your own admin account';
      }
      if (isInitialAdmin(normalizedEmail)) {
        return 'Initial admin - cannot be removed or edited';
      }
      return 'Edit role';
    };

    const getRemoveTooltip = (userEmail) => {
      if (!userEmail) return 'Remove role (becomes customer)';
      const normalizedEmail = userEmail.toLowerCase().trim();
      if (currentUser.value?.email?.toLowerCase().trim() === normalizedEmail) {
        return 'You cannot remove or edit your own admin account';
      }
      if (isInitialAdmin(normalizedEmail)) {
        return 'Initial admin - cannot be removed or edited';
      }
      return 'Remove role (becomes customer)';
    };

    const roleOptions = [
      { label: 'Operator', value: USER_ROLES.OPERATOR },
      { label: 'Admin', value: USER_ROLES.ADMIN },
    ];

    const getRoleLabel = (role) => {
      switch (role) {
        case USER_ROLES.ADMIN:
          return 'Admin';
        case USER_ROLES.OPERATOR:
          return 'Operator';
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
        default:
          return 'grey-6';
      }
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
      
      // Add timeout to prevent infinite spinning
      const timeoutId = setTimeout(() => {
        if (addingUser.value) {
          console.error('Add user role timeout - operation took too long');
          addingUser.value = false;
          $q.notify({
            type: 'negative',
            message: 'Operation timed out',
            caption: 'The request took too long. Please check your connection and try again.',
            position: 'top',
            timeout: 5000,
          });
        }
      }, 30000); // 30 second timeout
      
      try {
        console.log(`Adding user role: ${newUserEmail.value} as ${newUserRole.value}`);
        console.log('Environment:', window.location.hostname);
        
        const setRolePromise = USERS_CONFIG.setUserRole(newUserEmail.value, newUserRole.value);
        await setRolePromise;
        clearTimeout(timeoutId);
        
        console.log('User role added successfully, reloading users...');
        
        // Try to reload users, but don't fail if it errors
        try {
          await loadAllUsers();
          console.log('Users reloaded successfully');
        } catch (reloadError) {
          console.warn('Failed to reload users list (non-critical):', reloadError);
          // Still show success - the user was added even if we can't reload the list
        }

        $q.notify({
          type: 'positive',
          message: editingUser.value ? 'Role updated successfully' : 'User added successfully',
          caption: `${newUserEmail.value} is now a ${getRoleLabel(newUserRole.value)}`,
          position: 'top',
        });

        newUserEmail.value = '';
        newUserRole.value = '';
        editingUser.value = null;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Error adding/updating user:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack,
          name: error.name,
        });
        console.error('Full error object:', error);
        
        let errorMessage = error.message || 'An error occurred. Please check console for details.';
        if (error.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please check Firestore security rules.';
        } else if (error.code === 'unavailable' || error.message?.includes('offline')) {
          errorMessage = 'Firebase is offline. Please check your internet connection.';
        } else if (error.code === 'failed-precondition') {
          errorMessage = 'Firebase is not available. Please check your connection and try again.';
        } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
          errorMessage = 'Request timed out. Please try again.';
        }
        
        $q.notify({
          type: 'negative',
          message: editingUser.value ? 'Failed to update role' : 'Failed to add user',
          caption: errorMessage,
          position: 'top',
          timeout: 5000,
        });
      } finally {
        clearTimeout(timeoutId);
        addingUser.value = false;
      }
    };

    const editUserRole = (user) => {
      if (!canEditOrRemove(user.email)) {
        const showNotification = (type, message, caption) => {
          try {
            if ($q && $q.notify && typeof $q.notify === 'function') {
              $q.notify({
                type,
                message,
                caption,
                position: 'top',
                timeout: 5000,
              });
            } else {
              alert(`${message}: ${caption}`);
            }
          } catch (err) {
            console.error('Notification error:', err);
            alert(`${message}: ${caption}`);
          }
        };
        const normalizedEmail = user.email?.toLowerCase().trim();
        if (currentUser.value?.email?.toLowerCase().trim() === normalizedEmail) {
          showNotification('negative', 'Cannot edit', 'You cannot remove or edit your own admin account');
        } else if (isInitialAdmin(normalizedEmail)) {
          showNotification('negative', 'Cannot edit', 'Initial admin - cannot be removed or edited');
        }
        return;
      }
      editingUser.value = user;
      newUserEmail.value = user.email;
      newUserRole.value = user.role;
    };

    const cancelEdit = () => {
      editingUser.value = null;
      newUserEmail.value = '';
      newUserRole.value = '';
    };

    const removeUserRole = async (email) => {
      // Create a closure that captures $q to ensure it's always available
      const showNotification = (type, message, caption) => {
        try {
          if ($q && $q.notify && typeof $q.notify === 'function') {
            $q.notify({
              type,
              message,
              caption,
              position: 'top',
              timeout: 5000,
            });
          } else {
            alert(`${message}: ${caption}`);
          }
        } catch (err) {
          console.error('Notification error:', err);
          alert(`${message}: ${caption}`);
        }
      };
      
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
          showNotification('positive', 'User role removed successfully', `${email} is now a regular customer`);
        } catch (error) {
          console.error('Error removing user role:', error);
          showNotification('negative', 'Failed to remove user role', error.message || 'An error occurred');
        }
      });
    };

    const loadAllUsers = async () => {
      try {
        console.log('Loading all users...');
        const rolesConfig = await USERS_CONFIG.getAllUsersWithRoles();
        console.log('Users loaded:', rolesConfig);
        allUsers.value = Object.entries(rolesConfig)
          .map(([email, role]) => ({
            email,
            role: role || USER_ROLES.CUSTOMER, // Ensure role is always defined
          }))
          .filter((user) => {
            // Only include users with valid roles (exclude undefined/null)
            return user.role && Object.values(USER_ROLES).includes(user.role);
          })
          .sort((a, b) => {
            // Sort: admins first, then operators, then customers
            // Within each group, sort alphabetically
            const roleOrder = { [USER_ROLES.ADMIN]: 0, [USER_ROLES.OPERATOR]: 1, [USER_ROLES.CUSTOMER]: 2 };
            const roleDiff = (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2);
            if (roleDiff !== 0) return roleDiff;
            return a.email.localeCompare(b.email);
          });
        console.log('Users list updated:', allUsers.value.length, 'users');
      } catch (error) {
        console.error('Error loading users:', error);
        // Don't fail silently - show empty list if error
        allUsers.value = [];
        throw error; // Re-throw so caller knows it failed
      }
    };

    const adminsAndOperators = computed(() => {
      return allUsers.value.filter(
        (user) => user.role === USER_ROLES.ADMIN || user.role === USER_ROLES.OPERATOR
      );
    });

    onMounted(async () => {
      // Get current user info
      const user = authService.getCurrentUser();
      currentUser.value = user;
      
      // Check admin status immediately (sync check works offline)
      isAdmin.value = authService.isAdmin();
      
      // Show initial admins immediately (from hardcoded list) so UI appears fast
      const initialAdmins = [
        'michael.helmandarley@gmail.com',
        'lilmagnetmemories@gmail.com',
      ];
      allUsers.value = initialAdmins.map(email => ({
        email,
        role: USER_ROLES.ADMIN,
      }));
      console.log('Showing initial admins immediately:', initialAdmins);
      
      // Load all users with roles from Firebase in background (non-blocking)
      // This will update the list once Firebase responds
      loadAllUsers().catch((error) => {
        console.error('Error loading users (non-blocking):', error);
        // Keep initial admins visible even if Firebase fails
      });
      
      // Also check async for Firebase-based admins (non-blocking)
      authService.isAdminAsync().then((adminStatus) => {
        if (adminStatus !== isAdmin.value) {
          isAdmin.value = adminStatus;
        }
        // Reload users after async check completes
        return loadAllUsers();
      }).catch((error) => {
        console.error('Error in async admin check (non-blocking):', error);
      });
    });

    return {
      currentUser,
      isAdmin,
      isValidEmail,
      newUserEmail,
      newUserRole,
      addingUser,
      allUsers,
      adminsAndOperators,
      editingUser,
      roleOptions,
      getRoleLabel,
      getRoleIcon,
      getRoleColor,
      getRoleBadgeColor,
      addUserRole,
      removeUserRole,
      editUserRole,
      cancelEdit,
      canEditOrRemove,
      getEditTooltip,
      getRemoveTooltip,
      isInitialAdmin,
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
