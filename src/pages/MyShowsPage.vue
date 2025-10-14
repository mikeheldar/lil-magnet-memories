<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h4 text-purple q-mb-md text-weight-bold">My Shows</div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">
          Track and discuss your favorite TV shows
        </div>

        <!-- Add Shows Button Card -->
        <q-card class="q-mb-lg">
          <q-card-section class="text-center">
            <q-btn
              @click="addShows"
              color="primary"
              size="lg"
              icon="add"
              class="full-width"
              style="max-width: 400px"
            >
              <span class="gt-xs">Add Shows to My List</span>
              <span class="lt-sm">Add Shows</span>
            </q-btn>
          </q-card-section>
        </q-card>

        <!-- My Shows List -->
        <q-card>
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h6">
                <q-icon name="tv" class="q-mr-sm" />
                Your Shows
                <q-badge
                  v-if="activeShows.length > 0"
                  color="primary"
                  :label="activeShows.length"
                  class="q-ml-sm"
                />
              </div>
              <q-space />
              <q-toggle
                v-model="showCompleted"
                label="Show Completed"
                color="purple"
                @update:model-value="getMyShows"
              />
            </div>

            <q-list
              v-if="displayedShows.length > 0"
              bordered
              separator
              class="rounded-borders"
            >
              <q-item
                v-for="show in displayedShows"
                :key="show.id"
                v-ripple
                :class="{
                  'bg-grey-3':
                    show.status === 'completed' || show.status === 'archived',
                }"
              >
                <q-item-section avatar v-if="show.thumbnail">
                  <q-avatar rounded size="80px">
                    <img :src="show.thumbnail" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    {{ show.name }}
                    <q-badge
                      v-if="getFriendsWatchingCount(show.id) > 0"
                      color="purple"
                      text-color="white"
                      :label="`${getFriendsWatchingCount(show.id)} ${
                        getFriendsWatchingCount(show.id) === 1
                          ? 'friend'
                          : 'friends'
                      } watching`"
                      class="q-ml-sm"
                    >
                      <q-tooltip
                        >{{ getFriendsWatchingCount(show.id) }} of your friends
                        are watching this show</q-tooltip
                      >
                    </q-badge>
                    <q-chip
                      v-if="show.status === 'completed'"
                      color="green"
                      text-color="white"
                      size="sm"
                      icon="check_circle"
                    >
                      Completed
                    </q-chip>
                    <q-chip
                      v-if="show.status === 'archived'"
                      color="grey"
                      text-color="white"
                      size="sm"
                      icon="archive"
                    >
                      Archived
                    </q-chip>
                  </q-item-label>
                  <q-item-label caption>{{ show.year }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn
                      @click="goToShow(show)"
                      flat
                      round
                      color="primary"
                      icon="forum"
                      size="sm"
                    >
                      <q-tooltip>Discuss Show</q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="show.status !== 'completed'"
                      flat
                      round
                      color="positive"
                      icon="check_circle"
                      size="sm"
                      @click="markComplete(show)"
                    >
                      <q-tooltip>Mark Complete</q-tooltip>
                    </q-btn>
                    <q-btn
                      v-if="show.status === 'completed'"
                      flat
                      round
                      color="orange"
                      icon="replay"
                      size="sm"
                      @click="markActive(show)"
                    >
                      <q-tooltip>Mark as Watching</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      color="grey"
                      icon="archive"
                      size="sm"
                      @click="archiveShow(show)"
                    >
                      <q-tooltip>Archive</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-lg text-grey-6">
              <q-icon name="tv_off" size="64px" class="q-mb-md" />
              <div class="text-h6">No shows yet</div>
              <div class="text-body2">
                Add shows to start tracking and discussing episodes!
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- All Friends' Shows Section -->
        <q-card
          v-if="friends.length > 0 && allFriendsShows.length > 0"
          class="q-mt-lg"
          ref="friendShowsSection"
        >
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h6">
                <q-icon name="people" class="q-mr-sm" />
                Friends' Shows
                <q-badge
                  v-if="allFriendsShows.length > 0"
                  color="purple"
                  :label="allFriendsShows.length"
                  class="q-ml-sm"
                />
              </div>
              <q-space />
              <q-btn
                flat
                round
                :icon="friendSectionCollapsed ? 'expand_more' : 'expand_less'"
                @click="friendSectionCollapsed = !friendSectionCollapsed"
              >
                <q-tooltip>{{
                  friendSectionCollapsed ? 'Expand' : 'Collapse'
                }}</q-tooltip>
              </q-btn>
            </div>

            <!-- Collapsed/Expanded Content -->
            <div v-if="!friendSectionCollapsed">
              <!-- Friends' Shows List -->
              <q-list bordered separator class="rounded-borders">
                <q-item
                  v-for="show in allFriendsShows"
                  :key="`${show.friendEmail}-${show.id}`"
                  v-ripple
                  :class="{ 'bg-purple-1': isSharedShow(show.id) }"
                >
                  <q-item-section avatar v-if="show.thumbnail">
                    <q-avatar rounded size="80px">
                      <img :src="show.thumbnail" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">
                      {{ show.name }}
                      <q-chip
                        v-if="isSharedShow(show.id)"
                        color="purple"
                        text-color="white"
                        size="sm"
                        icon="people"
                        class="q-ml-sm"
                      >
                        You both watch this!
                      </q-chip>
                    </q-item-label>
                    <q-item-label caption>{{ show.year }}</q-item-label>
                    <q-item-label caption class="text-grey-6">
                      <q-icon name="person" size="xs" />
                      {{ show.friendName }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div v-if="isSharedShow(show.id)">
                      <q-btn
                        @click="goToShow(show)"
                        flat
                        color="primary"
                        icon="forum"
                        size="md"
                        class="mobile-icon-only"
                      >
                        <span class="gt-xs">Discuss</span>
                        <q-tooltip>You both watch this - discuss it!</q-tooltip>
                      </q-btn>
                    </div>
                    <div v-else>
                      <q-btn
                        @click="addShowToMyList(show)"
                        color="primary"
                        icon="bookmark_add"
                        size="md"
                        class="mobile-icon-only"
                      >
                        <span class="gt-xs">Add to My Shows</span>
                        <q-tooltip>Add this show to your list</q-tooltip>
                      </q-btn>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'MyShowsPage',
  data() {
    return {
      myShows: [],
      viewingFriend: null,
      friendShows: [],
      loadingFriendShows: false,
      friendSectionCollapsed: false,
      showCompleted: false,
      friends: [],
      friendsShowsData: {}, // Map of friend email -> their shows array
    };
  },
  computed: {
    activeShows() {
      return this.myShows.filter(
        (show) => show.status !== 'completed' && show.status !== 'archived'
      );
    },
    displayedShows() {
      if (this.showCompleted) {
        return this.myShows;
      }
      return this.activeShows;
    },
    allFriendsShows() {
      // Combine all friends' shows into one list with friend info
      const allShows = [];
      for (const friendEmail in this.friendsShowsData) {
        const friend = this.friends.find((f) => f.email === friendEmail);
        const friendName = friend ? friend.name : friendEmail;

        const friendShows = this.friendsShowsData[friendEmail] || [];
        friendShows.forEach((show) => {
          allShows.push({
            ...show,
            friendEmail: friendEmail,
            friendName: friendName,
          });
        });
      }

      // Sort by whether it's a shared show (shared shows first)
      return allShows.sort((a, b) => {
        const aShared = this.isSharedShow(a.id);
        const bShared = this.isSharedShow(b.id);
        if (aShared && !bShared) return -1;
        if (!aShared && bShared) return 1;
        return 0;
      });
    },
  },
  async mounted() {
    const loggedIn = sessionStorage.getItem('loggedIn');
    console.log('MyShowsPage mounted - loggedIn:', loggedIn);

    if (loggedIn !== 'true') {
      console.log('Not logged in, redirecting to login page');
      this.$router.push('/login');
    } else {
      console.log('Logged in, getting my shows');
      // since we're in my shows page let's shrink the header
      sessionStorage.setItem('shrinkHeader', 'true');
      this.$eventbus.emit('shrinkHeader', 'true');

      // Auto-migrate shows from localStorage to Firebase if needed
      await this.autoMigrateShows();

      this.getMyShows();

      // Load friends and their shows for display and counting
      await this.loadFriendsAndTheirShows();

      // Clear any viewingFriend data from session since we now show all friends
      sessionStorage.removeItem('viewingFriend');
    }
  },
  methods: {
    async getMyShows() {
      console.log('In getMyShows - Firebase version');

      try {
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';

        // Try to load from Firebase API first
        try {
          const params = this.showCompleted ? '?includeCompleted=true' : '';
          const response = await this.$api.get(
            `/user-shows/${userEmail}${params}`
          );
          if (response.data.shows) {
            this.myShows = response.data.shows;
            console.log(`✅ Loaded ${this.myShows.length} shows from Firebase`);
            return;
          }
        } catch (apiError) {
          console.error(
            'Failed to load from Firebase API, trying localStorage:',
            apiError
          );
        }

        // Fallback to localStorage
        const storageKey = `myShows_${userEmail}`;
        this.myShows = JSON.parse(localStorage.getItem(storageKey) || '[]');

        console.log('this.myShows: ', this.myShows);

        if (this.myShows.length === 0) {
          console.log('No shows found - add some shows to see them here!');
        }
      } catch (error) {
        console.log('Firebase getMyShows error: ', error);
        // Don't logout on error, just show empty state
        this.myShows = [];
      }
    },
    goToShow(show) {
      console.log('In goToShow');
      sessionStorage.setItem('show_id', show.id);
      sessionStorage.setItem('show_name', show.name);
      sessionStorage.setItem('show_year', show.year);
      sessionStorage.setItem('show_image_url', show.image_url);
      sessionStorage.setItem('show_thumbnail', show.thumbnail);
      sessionStorage.setItem('show_overview', show.overview);

      this.$router.push('/show/' + show.id);
    },
    addShows() {
      console.log('In addShows');
      this.$router.push('/add-show');
    },
    logout() {
      this.$hello.logout('facebook', { force: true });
      console.log(
        'Session loggedIn now: ' + sessionStorage.getItem('loggedIn')
      );
      sessionStorage.setItem('loggedIn', 'false');
      this.$eventbus.emit('loggedIn', 'false');
      console.log(
        'Session loggedIn now: ' + sessionStorage.getItem('loggedIn')
      );

      this.$router.push('/login');
    },

    async loadFriendShows() {
      if (!this.viewingFriend) return;

      this.loadingFriendShows = true;

      try {
        const response = await this.$api.get(
          `/user-shows/${this.viewingFriend.email}`
        );
        if (response.data.shows) {
          this.friendShows = response.data.shows;
          console.log(
            `✅ Loaded ${this.friendShows.length} shows for ${this.viewingFriend.name}`
          );
        }
      } catch (error) {
        console.error('Error loading friend shows:', error);
        this.friendShows = [];
      } finally {
        this.loadingFriendShows = false;
      }
    },

    isSharedShow(showId) {
      // Check if this show is in user's list
      return this.myShows.some((show) => show.id === showId);
    },

    closeFriendShows() {
      this.viewingFriend = null;
      this.friendShows = [];
      sessionStorage.removeItem('viewingFriend');
    },

    scrollToFriendSection() {
      if (this.$refs.friendShowsSection) {
        this.$refs.friendShowsSection.$el.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    },

    async autoMigrateShows() {
      try {
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';
        const storageKey = `myShows_${userEmail}`;
        const localShows = JSON.parse(localStorage.getItem(storageKey) || '[]');

        if (localShows.length === 0) {
          console.log('No shows in localStorage to migrate');
          return;
        }

        console.log(
          `🔄 Auto-migrating ${localShows.length} shows to Firebase...`
        );

        let migratedCount = 0;
        for (const show of localShows) {
          try {
            const payload = {
              id: show.id,
              name: show.name,
              year: show.year,
              image_url: show.image_url,
              thumbnail: show.thumbnail,
              overview: show.overview,
              userEmail: userEmail,
            };

            await this.$api.post('/add-show-public', payload);
            migratedCount++;
          } catch (error) {
            // Silently continue if show already exists or other errors
            console.log(
              `Show ${show.name} already in Firebase or failed to migrate`
            );
          }
        }

        if (migratedCount > 0) {
          console.log(`✅ Auto-migrated ${migratedCount} shows to Firebase`);
        }
      } catch (error) {
        console.error('Auto-migration error:', error);
        // Don't show alert, just log - this is background work
      }
    },

    async markComplete(show) {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        const response = await this.$api.post('/update-show-status', {
          userEmail,
          showId: show.id,
          status: 'completed',
        });

        if (response.data.success) {
          console.log('✅ Show marked as completed');
          await this.getMyShows();
        }
      } catch (error) {
        console.error('Error marking show complete:', error);
        alert('Failed to update show status');
      }
    },

    async markActive(show) {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        const response = await this.$api.post('/update-show-status', {
          userEmail,
          showId: show.id,
          status: 'active',
        });

        if (response.data.success) {
          console.log('✅ Show marked as active');
          await this.getMyShows();
        }
      } catch (error) {
        console.error('Error marking show active:', error);
        alert('Failed to update show status');
      }
    },

    async archiveShow(show) {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        const response = await this.$api.post('/update-show-status', {
          userEmail,
          showId: show.id,
          status: 'archived',
        });

        if (response.data.success) {
          console.log('✅ Show archived');
          await this.getMyShows();
        }
      } catch (error) {
        console.error('Error archiving show:', error);
        alert('Failed to archive show');
      }
    },

    async addShowToMyList(show) {
      try {
        const userEmail = sessionStorage.getItem('userEmail');

        console.log('Adding show to my list:', show.name);

        const payload = {
          id: show.id,
          name: show.name,
          year: show.year,
          image_url: show.image_url,
          thumbnail: show.thumbnail,
          overview: show.overview,
          userEmail: userEmail,
        };

        const response = await this.$api.post('/add-show-public', payload);

        if (response.data.success) {
          console.log('✅ Show added to your list!');

          // Reload your shows to show the new one
          await this.getMyShows();

          // Show success message
          alert(`${show.name} has been added to your shows!`);
        }
      } catch (error) {
        console.error('Error adding show:', error);
        alert('Failed to add show. It might already be in your list.');
      }
    },

    async loadFriendsAndTheirShows() {
      try {
        const userEmail = sessionStorage.getItem('userEmail');
        if (!userEmail) return;

        // Load friends list
        const friendsResponse = await this.$api.get(`/friends/${userEmail}`);
        if (friendsResponse.data.friends) {
          this.friends = friendsResponse.data.friends;
          console.log(
            `✅ Loaded ${this.friends.length} friends for show counting`
          );

          // Load shows for each friend
          for (const friend of this.friends) {
            try {
              const showsResponse = await this.$api.get(
                `/user-shows/${friend.email}`
              );
              if (showsResponse.data.shows) {
                this.friendsShowsData[friend.email] = showsResponse.data.shows;
              }
            } catch (error) {
              console.error(
                `Error loading shows for friend ${friend.email}:`,
                error
              );
              this.friendsShowsData[friend.email] = [];
            }
          }
        }
      } catch (error) {
        console.error('Error loading friends and their shows:', error);
      }
    },

    getFriendsWatchingCount(showId) {
      let count = 0;
      for (const friendEmail in this.friendsShowsData) {
        const friendShows = this.friendsShowsData[friendEmail];
        if (friendShows.some((show) => show.id === showId)) {
          count++;
        }
      }
      return count;
    },
  },
};
</script>

<style lang="scss">
.header {
  color: $primary;
  padding: 10px;
  left: 10px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}
</style>
