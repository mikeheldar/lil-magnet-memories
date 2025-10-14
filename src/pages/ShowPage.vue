<template>
  <q-page class="q-pa-md">
    <q-dialog v-model="show_dialog">
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ show_name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-sm">
          <div class="text-center q-mb-md">
            <div class="text-body1 text-grey-7 q-mb-sm">
              {{ dialog_message }}
            </div>

            <div
              v-if="user_latest_season_episode.value === 0"
              class="text-h6 text-purple q-mt-md"
            >
              <q-icon name="play_circle_outline" size="32px" class="q-mb-sm" />
              <div>Not Started</div>
              <div class="text-caption text-grey-6 q-mt-sm">
                Ready to begin watching?
              </div>
            </div>

            <div v-else class="q-mt-md">
              <q-badge color="purple" class="q-pa-sm" style="font-size: 14px">
                Season {{ user_latest_season_episode.season }}, Episode
                {{ user_latest_season_episode.value }}
              </q-badge>
              <div class="text-subtitle2 q-mt-sm text-weight-medium">
                {{ getEpisodeName() }}
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="center" class="q-pa-md">
          <q-btn
            outline
            color="grey-7"
            label="Talk about it"
            icon="forum"
            @click="show_dialog = false"
            class="q-mr-sm"
          />
          <q-btn
            v-if="!all_caught_up"
            color="primary"
            icon="add"
            label="Next Episode"
            @click="incrementEpisode"
            unelevated
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <q-dialog v-model="no_input">
      <q-card>
        <q-card-section>
          <q-item-label> You didn't say anything, try again. </q-item-label>
        </q-card-section>
        <q-card-actions>
          <q-btn label="OK" @click="no_input = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="text-h4 text-purple q-mb-md text-weight-bold">
          {{ show_name }}
        </div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">
          Discuss episodes and share your thoughts
        </div>

        <!-- Episode Selector Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="video_library" class="q-mr-sm" />
              Select Episode
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <q-select
                  v-model="season"
                  :options="seasons"
                  label="Season"
                  filled
                  dense
                />
              </div>
              <div class="col-6">
                <q-select
                  v-model="selected_episode"
                  :options="episodes_labeled.filter((e) => e.season === season)"
                  label="Episode"
                  filled
                  dense
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- New Post Card -->
        <q-card v-if="posting || episode !== '0 - Not Started'" class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="edit" class="q-mr-sm" />
              New Post
            </div>
            <div v-if="posting">
              <q-input
                type="textarea"
                v-model="my_post"
                autogrow
                filled
                label="Share your thoughts..."
                rows="3"
              />
              <div class="row q-gutter-sm q-mt-md">
                <q-btn
                  color="grey"
                  icon="cancel"
                  @click="posting = false"
                  class="mobile-icon-only"
                >
                  <span class="gt-xs">Cancel</span>
                </q-btn>
                <q-btn
                  color="primary"
                  icon="send"
                  @click="addPost"
                  class="mobile-icon-only"
                >
                  <span class="gt-xs">Post</span>
                </q-btn>
              </div>
            </div>
            <q-btn
              v-else
              color="primary"
              icon="edit"
              @click="startPost"
              class="full-width"
            >
              <span class="gt-xs">Make a new post</span>
              <span class="lt-sm">New Post</span>
            </q-btn>
          </q-card-section>
        </q-card>

        <!-- Posts Card -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="forum" class="q-mr-sm" />
              Discussion Posts
              <q-badge
                v-if="
                  Array.isArray(posts) &&
                  posts.filter((p) => p.parent_id === null).length > 0
                "
                color="primary"
                :label="posts.filter((p) => p.parent_id === null).length"
                class="q-ml-sm"
              />
            </div>

            <q-list
              v-if="
                Array.isArray(posts) &&
                posts.filter((p) => p.parent_id === null).length > 0
              "
              bordered
              separator
              class="rounded-borders"
            >
              <q-item
                v-for="post in posts
                  .filter((p) => p.season <= season)
                  .filter((p) => p.episode <= user_latest_season_episode.value)
                  .filter((p) => p.parent_id === null)"
                :key="post.created_at"
                class="q-py-md"
              >
                <q-item-section>
                  <div class="row items-start">
                    <div class="col">
                      <q-badge color="purple" class="q-mb-sm">
                        Season {{ post.season }}, Episode {{ post.episode }}
                      </q-badge>
                      <div class="text-weight-bold q-mb-xs">
                        {{ post.user_handle }}
                      </div>
                      <div class="text-caption text-grey-7 q-mb-sm">
                        {{
                          new Date(post.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })
                        }}
                      </div>
                      <div class="text-body1 q-mb-md">{{ post.post_text }}</div>

                      <div class="row q-gutter-xs">
                        <q-btn
                          flat
                          dense
                          color="primary"
                          :icon="
                            showComments && showCommentsForPost === post.id
                              ? 'expand_less'
                              : 'expand_more'
                          "
                          size="sm"
                          @click="openPost(post)"
                          class="mobile-icon-only"
                        >
                          <span class="gt-xs">{{
                            showComments && showCommentsForPost === post.id
                              ? 'Hide Comments'
                              : 'Show Comments'
                          }}</span>
                        </q-btn>
                        <q-btn
                          v-if="post.user_handle === user_handle"
                          flat
                          dense
                          color="negative"
                          icon="delete"
                          size="sm"
                          @click="deletePost(post)"
                          class="mobile-icon-only"
                        >
                          <span class="gt-xs">Delete</span>
                        </q-btn>
                      </div>

                      <!-- Comments Section -->
                      <div
                        v-if="showComments && showCommentsForPost === post.id"
                        class="q-mt-md q-ml-md q-pl-md"
                        style="border-left: 3px solid #9c27b0"
                      >
                        <div v-if="!commenting" class="q-mb-sm">
                          <q-btn
                            flat
                            color="primary"
                            icon="comment"
                            size="sm"
                            @click="commenting = true"
                            class="mobile-icon-only"
                          >
                            <span class="gt-xs">Add Comment</span>
                          </q-btn>
                        </div>

                        <div v-if="commenting" class="q-mb-md">
                          <q-input
                            type="textarea"
                            v-model="my_comment"
                            autogrow
                            filled
                            dense
                            label="Add your comment..."
                            rows="2"
                          />
                          <div class="row q-gutter-xs q-mt-sm">
                            <q-btn
                              flat
                              color="grey"
                              icon="cancel"
                              size="sm"
                              @click="commenting = false"
                              class="mobile-icon-only"
                            >
                              <span class="gt-xs">Cancel</span>
                            </q-btn>
                            <q-btn
                              flat
                              color="primary"
                              icon="send"
                              size="sm"
                              @click="addComment(post.id)"
                              class="mobile-icon-only"
                            >
                              <span class="gt-xs">Post</span>
                            </q-btn>
                          </div>
                        </div>

                        <div
                          v-for="comment in posts.filter(
                            (p) => p.parent_id === post.id
                          )"
                          :key="comment.id"
                          class="q-mb-sm q-pa-sm bg-grey-2 rounded-borders"
                        >
                          <div class="text-weight-bold text-caption">
                            {{ comment.user_handle }}
                          </div>
                          <div class="text-caption text-grey-7 q-mb-xs">
                            {{
                              new Date(comment.created_at).toLocaleString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                }
                              )
                            }}
                          </div>
                          <div class="text-body2">{{ comment.post_text }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-lg text-grey-6">
              <q-icon name="forum" size="64px" class="q-mb-md" />
              <div class="text-h6">No posts yet</div>
              <div class="text-body2">
                Be the first to share your thoughts about this show!
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ShowPage',
  data() {
    return {
      show_id: this.$route.params.show_id,
      show_name: sessionStorage.getItem('show_name'),
      episodes: [],
      episodes_labeled: [],
      user_latest_season_episode: {},
      seasons: [],
      season: 1,
      selected_episode: '0 - Not Started',
      posting: false,
      my_post: '',
      posts: [],
      latest_episode: {},
      latest_season: 1,
      inGetUserLatestSeasonEpisode: false,
      show_dialog: false,
      first_time_back: true,
      dialog_message: '',
      all_caught_up: false,
      nestedItems: [], // Nested items for the clicked post
      showComments: false, // Controls the visibility of the nested list
      commenting: false, // Controls the visibility of the comment input
      no_input: false, // Controls the visibility of the no input dialog
      episode: 0, // Episode number of the selected episode
      user_handle: sessionStorage.getItem('user_handle'),
    };
  },

  async mounted() {
    // Not sure if I need this code in all pages on mounted
    if (sessionStorage.getItem('loggedIn') === 'false') {
      console.log('Not logged in, redirecting to login page');
      this.$router.push('/login');
    } else {
      console.log('Logged in, doing show page stuff');

      // since we're in show page let's shrink the header
      sessionStorage.setItem('shrinkHeader', 'true');
      this.$eventbus.emit('shrinkHeader', 'true');

      await this.getEpisodes();
      await this.getPosts();
      await this.getUserLatestSeasonEpisode();

      // Check if we've already shown the dialog this session
      const dialogKey = `showDialog_${this.show_id}_shown`;
      const hasShownThisSession = sessionStorage.getItem(dialogKey);

      if (!hasShownThisSession) {
        this.first_time_back = true;
        sessionStorage.setItem(dialogKey, 'true');
      } else {
        this.first_time_back = false;
      }

      this.checkProgress();
    }
  },
  watch: {
    async selected_episode() {
      console.log('__________In selected_episode watcher__________');
      console.log(
        'this.inGetUserLatestSeasonEpisode: ',
        this.inGetUserLatestSeasonEpisode
      );
      if (!this.inGetUserLatestSeasonEpisode) {
        console.log('this.season: ', this.season);
        console.log('this.selected_episode: ', this.selected_episode);
        this.user_latest_season_episode = this.selected_episode;
        console.log(
          'this.user_latest_season_episode now set to: ',
          this.user_latest_season_episode
        );
        await this.setUserLatestSeasonEpisode();
      }
      console.log('__________Out selected_episode watcher__________');
    },
    season() {
      console.log('__________In season watcher__________');
      console.log(
        'this.inGetUserLatestSeasonEpisode: ',
        this.inGetUserLatestSeasonEpisode
      );
      if (!this.inGetUserLatestSeasonEpisode && this.episodes.length > 0) {
        this.selected_episode = this.episodes_labeled.filter(
          (e) => e.season === this.season
        )[0].label;
        console.log('set this.selected_episode: ', this.selected_episode);
      }
      console.log('__________Out season watcher__________');
    },
  },
  methods: {
    startPost() {
      this.posting = true;
    },
    async addPost() {
      console.log('In addPost (Firebase version)');
      console.log('this.my_post: ', this.my_post);
      if (this.my_post === '') {
        this.no_input = true;
        return;
      }

      try {
        const payload = {
          show_id: this.show_id,
          season: this.season,
          episode: this.selected_episode.value,
          post: this.my_post,
          user_handle:
            sessionStorage.getItem('userEmail')?.split('@')[0] || 'Anonymous',
          post_text: this.my_post,
          created_at: new Date().toISOString(),
          id: Date.now(), // Simple unique ID
          parent_id: null, // This is a top-level post, not a comment
        };
        console.log('Firebase addPost payload: ', payload);

        // Save to localStorage temporarily
        // In production, you'd add to Firestore posts collection
        const storageKey = `posts_${this.show_id}`;
        let posts = JSON.parse(localStorage.getItem(storageKey) || '[]');
        posts.unshift(payload); // Add to beginning (newest first)
        localStorage.setItem(storageKey, JSON.stringify(posts));

        console.log('Post added successfully to localStorage');

        // Clear the input
        this.my_post = '';

        // Refresh posts
        this.getPosts();
        this.posting = false;
      } catch (err) {
        console.log('Firebase addPost error: ', err);
        // Don't logout on error, just show message
        console.log('Failed to add post, but staying logged in');
        this.posting = false;
      }
    },
    async addComment(post_id) {
      console.log('In addComment (Firebase version)');
      console.log('this.my_comment: ', this.my_comment);
      if (this.my_comment === '' || this.my_comment === undefined) {
        this.no_input = true;
        return;
      }

      try {
        const commentData = {
          post_id: post_id,
          parent_id: post_id, // Important: marks this as a comment to a post
          show_id: this.show_id,
          season: this.season,
          episode: this.selected_episode.value,
          post_text: this.my_comment,
          user_handle:
            sessionStorage.getItem('userEmail')?.split('@')[0] || 'Anonymous',
          created_at: new Date().toISOString(),
          id: Date.now(), // Simple unique ID
        };
        console.log('Firebase addComment payload: ', commentData);

        // Save comment to localStorage - merge with posts since they're displayed together
        const storageKey = `posts_${this.show_id}`;
        let posts = JSON.parse(localStorage.getItem(storageKey) || '[]');
        posts.push(commentData);
        localStorage.setItem(storageKey, JSON.stringify(posts));

        console.log('Comment added successfully to localStorage');

        // Clear the input
        this.my_comment = '';

        // Refresh posts to show new comment
        this.getPosts();
        this.commenting = false;
      } catch (err) {
        console.log('Firebase addComment error: ', err);
        // Don't logout on error, just show message
        console.log('Failed to add comment, but staying logged in');
        this.commenting = false;
      }
    },
    async getEpisodes() {
      console.log('__________In getEpisodes__________');

      const apikey = '24c87807-e9cd-4e9c-8d19-28ef0f44d186';
      const authtoken =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2UiOiIiLCJhcGlrZXkiOiIyNGM4NzgwNy1lOWNkLTRlOWMtOGQxOS0yOGVmMGY0NGQxODYiLCJjb21tdW5pdHlfc3VwcG9ydGVkIjp0cnVlLCJleHAiOjE3NjI1MTgwODEsImdlbmRlciI6IiIsImhpdHNfcGVyX2RheSI6MTAwMDAwMDAwLCJoaXRzX3Blcl9tb250aCI6MTAwMDAwMDAwLCJpZCI6IjIzMTYyMjEiLCJpc19tb2QiOmZhbHNlLCJpc19zeXN0ZW1fa2V5IjpmYWxzZSwiaXNfdHJ1c3RlZCI6ZmFsc2UsInBpbiI6IlZLR0dPUVNFIiwicm9sZXMiOltdLCJ0ZW5hbnQiOiJ0dmRiIiwidXVpZCI6IiJ9.ZszKaNgTXg5lt9lDxjYMHL4g-fWRSSMvZhV3QCgGAAUf8Pm98r_zP3MNfS7YrdImlbABdVlN-d_-PiNag2NJjI0GvT3HlAyzzhgKPWcRawbdcwk154ZYqewIP3pQ7Kqn5w3O3baUcQVLBrz5xyoZ6MVDlFm_pAYBTtL-D5Av0IOyuCrMCllzM-swuDWjTlAicObTvgqsn1G4iyjmceT5HWpoov-XRuEdOMhLDv2UP6viXIFIjfRIYjVFh-VKlidJ2bIHrHmV6Vi_zk1EE527Ymus_Ummy0EuZuhk9OZ2TgneKljuc7rWmLJEswKiYJ_-x_FJIhiQyZ0BcjGNuLT8qsECYu_mIUVl0okEKHO5JnVW_if_adXrpIaXPbVK282A0GJCeAfkF0A9BV5BXv8cy6qqMLB4EMmtaHyOyiPklClXHgxc_g5BHWvNPJFq8LhI7lB3C79qpatyL6NFK0oLwIuJYQJPLFQ44yW5GQ8yhzfhRLQto0hemVgx93plzEph-pPkE7_Ee3iZ6nBPWfB0Dzg793DVN72LqAVOIcBZiF5HsxrdN0PBgsjzgCUjWeTY9Noobm29NVyafJM0TiKlj6p6cV5bZhcN0Lq5X7gqJOaM7_mD5ab-i3cEoRxrAyS9o4OE94H-3S9bgQDMiJeb1mHL7TIu8cW488G7Tzklddg';

      const payload = {
        apikey: apikey,
        pin: 'VKGGOQSE',
      };
      console.log('payload to send: ', payload);

      const headers = {
        accept: 'application/json',
        Authorization: 'Bearer ' + authtoken,
      };
      console.log('headers to send: ', headers);

      const api_call_string = '/series/' + this.show_id + '/episodes/default';
      console.log('api_call_string: ', api_call_string);
      await this.$tvdb
        .get(api_call_string, { headers })
        .then((response) => {
          console.log('response.data.data: ', response.data.data.episodes);
          this.episodes = response.data.data.episodes;
          this.episodes_labeled = this.episodes.map((e, index) => ({
            season: e.seasonNumber,
            value: e.number,
            label: e.number + ' - ' + e.name,
            episode_index: index,
          }));
          console.log('this.episodes: ', this.episodes);
          console.log('this.episodes_labeled: ', this.episodes_labeled);

          this.seasons = Array.from(
            new Set(this.episodes.map((e) => e.seasonNumber))
          );
          console.log('this.seasons: ', this.seasons);
          this.latest_season = Math.max(...this.seasons);
          this.latest_episode = Math.max(
            ...this.episodes
              .filter((e) => e.seasonNumber === this.latest_season)
              .map((e) => e.number)
          );

          console.log('this.latest_season: ', this.latest_season);
          console.log('this.latest_episode: ', this.latest_episode);
        })
        .catch((error) => {
          console.log(error);
        });

      console.log('__________Out getEpisodes__________');
    },
    async getPosts() {
      console.log('__________In getPosts (Firebase version)__________');

      try {
        // Firebase posts retrieval using localStorage temporarily
        // In production, you'd query Firestore posts collection
        console.log(
          'Firebase getPosts - getting posts for show:',
          this.show_id
        );

        // Get posts from localStorage
        const storageKey = `posts_${this.show_id}`;
        this.posts = JSON.parse(localStorage.getItem(storageKey) || '[]');

        console.log('this.posts: ', this.posts);

        if (this.posts.length === 0) {
          console.log('No posts found for this show yet');
        }
      } catch (err) {
        console.log('Firebase getPosts error: ', err);
        // Don't logout on error, just show empty state
        this.posts = [];
      }
      console.log('__________Out getPosts__________');
    },

    async getUserLatestSeasonEpisode() {
      console.log(
        '__________In getUserLatestSeasonEpisode (Firebase version)__________'
      );
      this.inGetUserLatestSeasonEpisode = true;

      try {
        // Firebase user progress retrieval using localStorage temporarily
        // In production, you'd query Firestore user_progress collection
        console.log(
          'Firebase getUserLatestSeasonEpisode - getting progress for show:',
          this.show_id
        );

        // Get from localStorage
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';
        const storageKey = `user_progress_${userEmail}_${this.show_id}`;
        const savedProgress = localStorage.getItem(storageKey);

        if (savedProgress) {
          const progress = JSON.parse(savedProgress);
          this.user_latest_season_episode = {
            season: progress.season,
            episode: progress.episode,
            label:
              progress.episode_label ||
              `S${String(progress.season).padStart(2, '0')}E${String(
                progress.episode
              ).padStart(2, '0')}`,
            value: progress.episode,
            episode_index: progress.episode_index || 0,
          };
          this.season = progress.season;
          this.selected_episode = this.user_latest_season_episode;
          console.log('Loaded saved progress:', progress);
        } else {
          // Set default values (season 1, episode 0 - not started)
          this.user_latest_season_episode = {
            season: 1,
            episode: 0,
            label: '0 - Not Started',
            value: 0,
            episode_index: 0,
          };
          this.season = 1;
          this.selected_episode = this.user_latest_season_episode;
          console.log('No saved progress, using defaults');
        }

        console.log(
          'set user_latest_season_episode: ',
          this.user_latest_season_episode
        );
        console.log('set season: ', this.season);
        console.log('set selected_episode: ', this.selected_episode);
      } catch (err) {
        console.log('Firebase getUserLatestSeasonEpisode error: ', err);
        // Don't logout on error, just use defaults
        this.user_latest_season_episode = {
          season: 1,
          episode: 0,
          label: '0 - Not Started',
          value: 0,
          episode_index: 0,
        };
        this.season = 1;
        this.selected_episode = this.user_latest_season_episode;
      }

      this.inGetUserLatestSeasonEpisode = false;
      console.log('__________Out getUserLatestSeasonEpisode__________');
    },
    async setUserLatestSeasonEpisode() {
      console.log(
        '__________In setUserLatestSeasonEpisode (Firebase version)__________'
      );
      console.log('this.selected_episode: ', this.selected_episode);
      this.user_latest_episode = this.selected_episode;

      try {
        const payload = {
          show_id: this.show_id,
          season: this.season,
          episode: this.user_latest_episode.value,
          episode_label: this.user_latest_episode.label,
          episode_index: this.user_latest_episode.episode_index,
        };
        console.log('Firebase setUserLatestSeasonEpisode payload: ', payload);

        // Save to localStorage temporarily
        // In production, you'd update Firestore user_progress collection
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';
        const storageKey = `user_progress_${userEmail}_${this.show_id}`;
        localStorage.setItem(storageKey, JSON.stringify(payload));

        console.log('User progress saved successfully to localStorage');

        this.checkProgress();
        await this.getPosts();
      } catch (err) {
        console.log('Firebase setUserLatestSeasonEpisode error: ', err);
        // Don't logout on error, just continue
        console.log('Failed to update progress, but staying logged in');
        this.checkProgress();
        await this.getPosts();
      }
      console.log('__________Out setUserLatestSeasonEpisode__________');
    },
    checkProgress() {
      console.log('__________In checkProgress__________');
      console.log('this.latest_season: ', this.latest_season);
      console.log('this.latest_episode: ', this.latest_episode);
      console.log(
        'this.user_latest_season_episode: ',
        this.user_latest_season_episode
      );
      console.log(
        'this.user_latest_season_episode.label: ',
        this.user_latest_season_episode.label
      );

      console.log('this.first_time_back: ', this.first_time_back);
      if (
        this.user_latest_season_episode.season === this.latest_season &&
        this.user_latest_season_episode.value === this.latest_episode
      ) {
        this.all_caught_up = true;
        console.log('No more episodes to watch');
        this.dialog_message = 'All caught up! 🎉';
        if (this.first_time_back) {
          this.show_dialog = true;
        }
      } else {
        if (this.first_time_back) {
          console.log('First time back');
          console.log('More episodes to watch');
          this.dialog_message = 'Last watched:';
          this.show_dialog = true;
        }
      }

      console.log('__________Out checkProgress__________');
    },
    openDialog() {
      this.$q
        .dialog({
          title: 'Enter Season and Episode',
          message: 'Please enter the season and episode numbers:',
          form: {
            season: {
              label: 'Season',
              type: 'number',
              value: 1,
            },
            episode: {
              label: 'Episode',
              type: 'number',
              value: 1,
            },
          },
          cancel: true,
          persistent: true,
        })
        .then((data) => {
          // The user clicked OK
          console.log(data.season, data.episode);
        })
        .catch(() => {
          // The user clicked Cancel
          console.log('Cancelled');
        });
    },
    handleOK() {
      console.log('__________In handleOK__________');
      this.show_dialog = false;
      console.log('__________Out handleOK__________');
    },
    async incrementEpisode() {
      console.log('__________In incrementEpisode__________');
      console.log('this.selected_episode: ', this.selected_episode);
      console.log('this.latest_episode: ', this.latest_episode);

      // Increment to next episode
      let nextIndex;

      // If at episode 0 (Not Started), go to first episode (index 0)
      if (
        this.selected_episode.value === 0 ||
        this.selected_episode.episode === 0
      ) {
        nextIndex = 0;
        console.log(
          'Starting from episode 0, going to first episode (index 0)'
        );
      } else {
        // Otherwise increment from current episode_index
        nextIndex = (this.selected_episode.episode_index || 0) + 1;
        console.log(
          `Incrementing from index ${this.selected_episode.episode_index} to ${nextIndex}`
        );
      }

      if (this.episodes_labeled && this.episodes_labeled[nextIndex]) {
        this.selected_episode = this.episodes_labeled[nextIndex];
        console.log('new: this.selected_episode: ', this.selected_episode);

        // Update the user_latest_season_episode to reflect the new selection
        this.user_latest_season_episode = this.selected_episode;

        // Save the progress
        await this.setUserLatestSeasonEpisode();

        // Check if we're now caught up
        this.checkProgress();

        // Update dialog message
        if (this.all_caught_up) {
          this.dialog_message = 'All caught up! 🎉';
        } else {
          this.dialog_message = 'Last watched:';
        }

        // Keep dialog open so user can increment again
        // Dialog will only close when user clicks "Talk about it" or when caught up
      } else {
        console.log('No more episodes available');
        this.all_caught_up = true;
        this.dialog_message = 'Looks like you are all caught up!';
      }

      console.log('__________Out incrementEpisode__________');
    },
    openPost(post) {
      console.log('__________In openPost__________');
      console.log('post: ', post);
      this.showCommentsForPost = post.id;
      this.showComments = !this.showComments;

      console.log('__________Out openPost__________');
    },
    getEpisodeName() {
      // Extract just the episode name from the label (format: "number - name")
      if (this.user_latest_season_episode.label) {
        const parts = this.user_latest_season_episode.label.split(' - ');
        return parts.length > 1
          ? parts.slice(1).join(' - ')
          : this.user_latest_season_episode.label;
      }
      return '';
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

.post-season-episode-label {
  font-size: 14px;
  font-weight: bold;
  text-decoration: underline;
}
.post-user-handle-label {
  font-size: 12px;
  font-weight: bold;
  font-style: italic;
  overflow: hidden;
}

.post-date-label {
  font-size: 12px;
}

.card-label {
  padding-left: 20px;
  font-size: 12px;
  font-weight: bold;
  font-style: italic;
}

.comment {
  width: 90%;
  background-color: rgb(235, 236, 236);
  border: 4px solid rgb(235, 236, 236);
  border-radius: 4px;
  margin-left: 17px;
  margin-bottom: 2px;
}

.comment-input {
  width: 90%;
  background-color: rgb(235, 236, 236);
  border: 4px solid rgb(235, 236, 236);
  border-radius: 4px;
}

.comment-add-button {
  height: 50%;
  width: 100%;
}

.post-input {
  width: 94%;
  background-color: rgb(235, 236, 236);
  border: 4px solid rgb(235, 236, 236);
  border-radius: 4px;
}

.post-cancel-button {
  width: 20px;
  height: 50%;
}

.post-done-button {
  width: 20px;
  height: 50%;
}

.comment-cancel-button {
  width: 10px;
  height: 50%;
}

.comment-done-button {
  width: 10px;
  height: 50%;
}

.post-info-section {
  flex: 30%;
  max-width: 30%;
  margin-right: 10px;
}

.post-post-section {
  width: 100%;
}
</style>
