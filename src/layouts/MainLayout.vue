<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title> Spoiler Alert </q-toolbar-title>

        <!-- Profile Avatar with Notification Badge (when logged in) -->
        <q-btn
          v-if="loggedIn == 'true'"
          flat
          dense
          round
          aria-label="Profile"
          @click="toggleRightDrawer"
          class="profile-button"
        >
          <q-avatar size="40px">
            <img v-if="userAvatar" :src="userAvatar" />
            <q-icon v-else name="person" size="24px" />
          </q-avatar>
          <q-badge
            v-if="notificationCount > 0"
            color="red"
            floating
            rounded
            :label="notificationCount > 99 ? '99+' : notificationCount"
          />
        </q-btn>

        <!-- Sign In Button (when not logged in) -->
        <q-btn
          v-if="loggedIn !== 'true'"
          flat
          label="Sign In"
          icon="login"
          aria-label="Sign In"
          @click="goToLoginPage"
          class="sign-in-button"
        />
      </q-toolbar>
      <div class="q-px-lg q-pt-xl q-pb-md" v-if="shrinkHeader == 'false'">
        <div class="text-h3">TV Togetherness.</div>
        <div class="text-subtitle1">No Spoilers.</div>
      </div>
      <q-img src="../statics/tv_kids.jpg" class="header-image absolute-top" />
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-scroll-area
        style="
          height: calc(100% - 192px);
          margin-top: 192px;
          border-right: 1px solid #ddd;
        "
      >
        <q-list padding>
          <q-item exact clickable v-ripple to="/about">
            <q-item-section avatar>
              <q-icon name="info" />
            </q-item-section>
            <q-item-section> About </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/add-show">
            <q-item-section avatar>
              <q-icon name="add_circle" />
            </q-item-section>
            <q-item-section> Add Show </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/my-shows">
            <q-item-section avatar>
              <q-icon name="tv" />
            </q-item-section>
            <q-item-section> My Shows </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/friends">
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section> Friends </q-item-section>
          </q-item>

          <q-item v-if="isAdmin == 'true'" exact clickable v-ripple to="/admin">
            <q-item-section avatar>
              <q-icon name="admin_panel_settings" />
            </q-item-section>
            <q-item-section> Admin Page </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <q-img
        class="header-image absolute-top"
        src="../statics/tv_kids.jpg"
        style="height: 192px"
      >
        <div class="absolute-bottom bg-transparent">
          <q-avatar size="56px" class="q-mb-sm">
            <img src="../statics/mini_tv.png" />
          </q-avatar>
          <div class="text-weight-bold">Spoiler Alert</div>
        </div>
      </q-img>
    </q-drawer>

    <!-- Right Drawer for Profile -->
    <q-drawer v-model="rightDrawerOpen" side="right" overlay elevated>
      <q-scroll-area class="fit">
        <div class="q-pa-lg">
          <!-- Profile Header -->
          <div class="text-center q-mb-lg">
            <q-avatar size="100px" class="q-mb-md">
              <img v-if="userAvatar" :src="userAvatar" />
              <q-icon v-else name="person" size="60px" />
            </q-avatar>
            <div class="text-h6 text-weight-bold">{{ userName || 'User' }}</div>
            <div class="text-caption text-grey-7">{{ userEmail }}</div>
            <q-chip
              v-if="loginMethod"
              size="sm"
              :icon="
                loginMethod === 'google'
                  ? 'img:https://www.google.com/favicon.ico'
                  : 'facebook'
              "
              :color="loginMethod === 'google' ? 'red-1' : 'blue-1'"
              :text-color="loginMethod === 'google' ? 'red-9' : 'blue-9'"
              class="q-mt-sm"
            >
              Signed in with
              {{ loginMethod === 'google' ? 'Google' : 'Facebook' }}
            </q-chip>
          </div>

          <q-separator class="q-mb-md" />

          <!-- Notifications Section -->
          <div class="q-mb-lg">
            <div class="text-subtitle2 text-weight-medium q-mb-sm">
              Notifications
              <q-badge
                v-if="notificationCount > 0"
                color="red"
                :label="notificationCount"
                rounded
              />
            </div>
            <q-list bordered separator class="rounded-borders">
              <!-- Friend Requests Notification -->
              <q-item
                v-if="notificationCount > 0"
                clickable
                v-ripple
                @click="goToFriendsPage"
              >
                <q-item-section avatar>
                  <q-icon name="person_add_alt" color="purple" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium"
                    >Friend Requests</q-item-label
                  >
                  <q-item-label caption>
                    You have {{ notificationCount }} pending friend
                    {{ notificationCount === 1 ? 'request' : 'requests' }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" />
                </q-item-section>
              </q-item>

              <!-- No Notifications -->
              <q-item
                v-if="notificationCount === 0 && notifications.length === 0"
              >
                <q-item-section>
                  <q-item-label class="text-grey-6"
                    >No new notifications</q-item-label
                  >
                </q-item-section>
              </q-item>

              <!-- Other Notifications -->
              <q-item
                v-for="notification in notifications"
                :key="notification.id"
                clickable
                v-ripple
                @click="handleNotificationClick(notification)"
              >
                <q-item-section avatar>
                  <q-icon
                    :name="notification.icon"
                    :color="notification.color"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ notification.title }}</q-item-label>
                  <q-item-label caption>{{
                    notification.message
                  }}</q-item-label>
                  <q-item-label caption class="text-grey-6">{{
                    notification.time
                  }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <q-separator class="q-mb-md" />

          <!-- Profile Actions -->
          <q-list>
            <q-item clickable v-ripple @click="goToProfilePage">
              <q-item-section avatar>
                <q-icon name="settings" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Profile Settings</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="goToMyShows">
              <q-item-section avatar>
                <q-icon name="tv" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>My Shows</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator class="q-my-md" />

            <q-item clickable v-ripple @click="confirmSignOut">
              <q-item-section avatar>
                <q-icon name="logout" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-negative">Sign Out</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </q-scroll-area>
    </q-drawer>

    <!-- Sign Out Confirmation Dialog -->
    <q-dialog v-model="showSignOutDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Sign Out?</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to sign out of Spoiler Alert?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Sign Out" color="negative" @click="signOut" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MainLayout',

  setup() {
    const leftDrawerOpen = ref(false);
    const rightDrawerOpen = ref(false);

    return {
      leftDrawerOpen,
      rightDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
      toggleRightDrawer() {
        rightDrawerOpen.value = !rightDrawerOpen.value;
      },
    };
  },

  data() {
    return {
      loggedIn: sessionStorage.getItem('loggedIn'),
      isAdmin: sessionStorage.getItem('isAdmin'),
      shrinkHeader: sessionStorage.getItem('shrinkHeader'),
      userEmail: sessionStorage.getItem('userEmail') || '',
      userName: sessionStorage.getItem('userName') || '',
      userAvatar: sessionStorage.getItem('userAvatar') || '',
      loginMethod: sessionStorage.getItem('loginMethod') || '', // 'google' or 'facebook'
      notificationCount: 0,
      notifications: [],
      showSignOutDialog: false,
    };
  },
  mounted() {
    this.$eventbus.on('loggedIn', (loggedIn) => {
      this.loggedIn = loggedIn;
      if (loggedIn === 'true') {
        this.loadUserProfile();
      }
    });
    this.$eventbus.on('isAdmin', (isAdmin) => {
      this.isAdmin = isAdmin;
    });
    this.$eventbus.on('shrinkHeader', (shrinkHeader) => {
      this.shrinkHeader = shrinkHeader;
    });
    this.$eventbus.on('friendRequestCount', (count) => {
      console.log('Friend request count updated:', count);
      this.notificationCount = count;
    });

    const loggedIn = sessionStorage.getItem('loggedIn');
    console.log('MainLayout mounted - loggedIn:', loggedIn);

    if (loggedIn !== 'true') {
      console.log('Not logged in, redirecting to login page');
      this.$router.push('/login');
    } else {
      console.log('Logged in, staying on current page');
      this.loadUserProfile();
      this.loadNotifications();
    }
  },

  methods: {
    loadUserProfile() {
      this.userEmail = sessionStorage.getItem('userEmail') || '';
      this.userName = sessionStorage.getItem('userName') || '';
      this.userAvatar = sessionStorage.getItem('userAvatar') || '';
      this.loginMethod = sessionStorage.getItem('loginMethod') || '';

      console.log('User profile loaded:', {
        email: this.userEmail,
        name: this.userName,
        avatar: this.userAvatar,
        method: this.loginMethod,
      });
    },

    loadNotifications() {
      // Load friend request count from sessionStorage
      const friendRequestCount = sessionStorage.getItem('friendRequestCount');
      if (friendRequestCount) {
        this.notificationCount = parseInt(friendRequestCount) || 0;
        console.log('Loaded friend request count:', this.notificationCount);
      } else {
        this.notificationCount = 0;
      }

      // Could also load other notifications from localStorage
      const storedNotifications = localStorage.getItem('user_notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      } else {
        this.notifications = [];
      }
    },

    handleNotificationClick(notification) {
      console.log('Notification clicked:', notification);

      // Mark as read
      notification.read = true;
      localStorage.setItem(
        'user_notifications',
        JSON.stringify(this.notifications)
      );
      this.notificationCount = this.notifications.filter((n) => !n.read).length;

      // Navigate to the relevant page if applicable
      if (notification.link) {
        this.rightDrawerOpen = false;
        this.$router.push(notification.link);
      }
    },

    goToLoginPage() {
      console.log('goToLoginPage');
      this.$router.push('/login');
    },

    goToProfilePage() {
      console.log('goToProfilePage');
      this.rightDrawerOpen = false;
      this.$router.push('/profile');
    },

    goToMyShows() {
      console.log('goToMyShows');
      this.rightDrawerOpen = false;
      this.$router.push('/my-shows');
    },

    goToFriendsPage() {
      console.log('goToFriendsPage');
      this.rightDrawerOpen = false;
      this.$router.push('/friends');
    },

    confirmSignOut() {
      this.showSignOutDialog = true;
    },

    signOut() {
      console.log('Signing out...');

      // Clear session storage
      sessionStorage.clear();

      // Clear user data
      this.userEmail = '';
      this.userName = '';
      this.userAvatar = '';
      this.loginMethod = '';
      this.notifications = [];
      this.notificationCount = 0;

      // Update event bus
      this.$eventbus.emit('loggedIn', 'false');
      this.$eventbus.emit('isAdmin', 'false');

      // Close dialogs
      this.showSignOutDialog = false;
      this.rightDrawerOpen = false;

      // Redirect to login
      this.$router.push('/login');
    },
  },
});
</script>

<style lang="scss">
.header-image {
  height: 100%;
  z-index: -1;
  opacity: 0.6;
  filter: grayscale(50%);
}

.profile-button {
  position: relative;
  margin-right: 4px;

  .q-avatar {
    transition: all 0.3s ease;
  }

  &:hover .q-avatar {
    transform: scale(1.05);
  }

  .q-badge {
    top: 2px;
    right: 2px;
  }
}

.sign-in-button {
  color: white;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}
</style>
