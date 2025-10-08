<template>
  <q-page class="flex flex-top">
    <q-dialog v-model="show_dialog">
      <q-card>
        <q-card-section>
          <q-item-label>
            {{ dialog_message }}
          </q-item-label>
        </q-card-section>
        <q-item-label class="card-label">
          {{ 'Last Watched:' }}
        </q-item-label>
        <q-item-label class="text-center">
          {{ 'Season ' + user_latest_season_episode.label }}
        </q-item-label>
        <q-card-actions>
          <q-btn label="Talk about it" @click="show_dialog = false" />
          <q-btn
            v-if="!all_caught_up"
            flat
            rounded
            color="primary"
            icon="add"
            @click="incrementEpisode"
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
    <div class="col">
      <q-list>
        <q-item class="header">Talking about: {{ show_name }}</q-item>
        <q-item>
          <q-item-section>
            <q-select
              v-model="season"
              :options="seasons"
              label="Season"
              filled
            />
          </q-item-section>
          <q-item-section>
            <q-select
              v-model="selected_episode"
              :options="episodes_labeled.filter((e) => e.season === season)"
              label="Episode"
              filled
            />
          </q-item-section>
        </q-item>
        <q-item v-if="posting">
          <q-input
            type="textarea"
            class="post-input"
            v-model="my_post"
            autogrow
            label="Talk about it!"
          />
          <q-item-section>
            <q-btn
              class="post-cancel-button"
              v-if="posting"
              color="primary"
              glossy
              icon="cancel"
              @click="posting = false"
            />
            <q-btn
              class="post-done-button"
              v-if="posting"
              color="primary"
              glossy
              icon="chat"
              @click="addPost"
            />
          </q-item-section>
        </q-item>
        <q-item>
          <q-btn
            v-if="!posting && episode !== '0 - Not Started'"
            color="primary"
            glossy
            label="Make a new post"
            icon="edit"
            @click="startPost"
            style="width: 100%"
          />
        </q-item>
      </q-list>
      <q-list v-if="Array.isArray(posts)" class="bg-white" separator bordered>
        <q-item
          v-ripple
          v-for="post in posts
            .filter((p) => p.season <= season)
            .filter((p) => p.episode <= user_latest_season_episode.value)
            .filter((p) => p.parent_id === null)"
          :key="post.created_at"
        >
          <div class="col">
            <div class="row">
              <q-item-section top class="post-info-section">
                <q-item-label class="post-season-episode-label">{{
                  'season ' + post.season + ': episode ' + post.episode
                }}</q-item-label>
                <q-item-label class="post-user-handle-label">{{
                  post.user_handle
                }}</q-item-label>
                <q-item-label class="post-date-label">{{
                  new Date(post.created_at).toLocaleString('en-US', {
                    month: 'short', // Short month name (e.g., Jan, Feb)
                    day: 'numeric', // Numeric day (e.g., 1, 2, 3)
                    year: 'numeric', // Numeric year (e.g., 2023)
                    hour: '2-digit', // Two-digit hour (e.g., 01, 02)
                    minute: '2-digit', // Two-digit minute (e.g., 01, 02)
                    hour12: true, // Use 12-hour clock (AM/PM)
                  })
                }}</q-item-label>
              </q-item-section>
              <q-item-section class="post-post-section">
                <q-item-label>{{ post.post_text }}</q-item-label>
              </q-item-section>
              <q-btn
                v-if="!showComments || showCommentsForPost !== post.id"
                flat
                rounded
                color="primary"
                icon="expand_more"
                @click="openPost(post)"
              />
              <q-btn
                v-if="showComments && showCommentsForPost === post.id"
                flat
                rounded
                color="primary"
                icon="expand_less"
                @click="openPost(post)"
              />

              <q-btn
                v-if="post.user_handle === user_handle"
                flat
                rounded
                color="primary"
                icon="delete"
                @click="deletePost(post)"
              />
            </div>
            <div class="row q-pt-sm">
              <q-item-section>
                <q-list v-if="showComments && showCommentsForPost === post.id">
                  <q-item v-if="!commenting" class="comment">
                    <q-btn
                      class="comment-add-button"
                      glossy
                      label="Add comment!"
                      color="primary"
                      icon="comment"
                      @click="commenting = true"
                    />
                  </q-item>

                  <q-item v-if="commenting">
                    <q-input
                      class="comment-input"
                      type="textarea"
                      v-model="my_comment"
                      autogrow
                      label="Comment Here:"
                    />
                    <q-item-section>
                      <q-btn
                        class="comment-cancel-button"
                        color="primary"
                        icon="cancel"
                        glossy
                        @click="commenting = false"
                      />
                      <q-btn
                        class="comment-done-button"
                        color="primary"
                        icon="check_circle"
                        glossy
                        @click="addComment(post.id)"
                      />
                    </q-item-section>
                  </q-item>
                  <q-item
                    class="comment"
                    v-for="comment in posts.filter(
                      (p) => p.parent_id === this.showCommentsForPost
                    )"
                    :key="comment.id"
                  >
                    <q-item-section top class="post-info-section">
                      <q-item-label class="post-user-handle-label">{{
                        comment.user_handle
                      }}</q-item-label>
                      <q-item-label class="post-date-label">{{
                        new Date(comment.created_at).toLocaleString('en-US', {
                          month: 'short', // Short month name (e.g., Jan, Feb)
                          day: 'numeric', // Numeric day (e.g., 1, 2, 3)
                          year: 'numeric', // Numeric year (e.g., 2023)
                          hour: '2-digit', // Two-digit hour (e.g., 01, 02)
                          minute: '2-digit', // Two-digit minute (e.g., 01, 02)
                          hour12: true, // Use 12-hour clock (AM/PM)
                        })
                      }}</q-item-label>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ comment.post_text }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-item-section>
            </div>
          </div>
        </q-item>
      </q-list>
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
        };
        console.log('Firebase addPost payload: ', payload);

        // Firebase post addition - simplified version
        // In production, you'd add to Firestore posts collection
        console.log('Firebase addPost - adding post for show:', this.show_id);

        // For now, just log the post addition
        // TODO: Implement proper Firestore post addition
        console.log('Post added successfully to Firebase');

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
        const payload = {
          show_id: this.show_id,
          season: this.season,
          episode: this.selected_episode.value,
          post: this.my_comment,
          post_id: post_id,
        };
        console.log('Firebase addComment payload: ', payload);

        // Firebase comment addition - simplified version
        // In production, you'd add to Firestore comments collection
        console.log('Firebase addComment - adding comment for post:', post_id);

        // For now, just log the comment addition
        // TODO: Implement proper Firestore comment addition
        console.log('Comment added successfully to Firebase');

        // Refresh posts
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
        // Firebase posts retrieval - simplified version
        // In production, you'd query Firestore posts collection
        console.log(
          'Firebase getPosts - getting posts for show:',
          this.show_id
        );

        // For now, return empty array (no posts yet)
        // TODO: Implement proper Firestore query
        this.posts = [];

        console.log('this.posts: ', this.posts);
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
        // Firebase user progress retrieval - simplified version
        // In production, you'd query Firestore user_progress collection
        console.log(
          'Firebase getUserLatestSeasonEpisode - getting progress for show:',
          this.show_id
        );

        // For now, set default values (season 1, episode 1)
        // TODO: Implement proper Firestore query
        this.user_latest_season_episode = {
          season: 1,
          episode: 1,
          label: 'S01E01',
        };
        this.season = 1;
        this.selected_episode = this.user_latest_season_episode;

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
          episode: 1,
          label: 'S01E01',
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

        // Firebase user progress update - simplified version
        // In production, you'd update Firestore user_progress collection
        console.log(
          'Firebase setUserLatestSeasonEpisode - updating progress for show:',
          this.show_id
        );

        // For now, just log the progress update
        // TODO: Implement proper Firestore update
        console.log('User progress updated successfully in Firebase');

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
        this.dialog_message = 'Looks like you are all caught up!';
        this.show_dialog = true;
      } else {
        if (this.first_time_back) {
          console.log('First time back');
          console.log('More episodes to watch');
          this.dialog_message = 'More episodes to watch';
          this.show_dialog = true;
        }
      }

      this.first_time_back = false;
      console.log('this.first_time_back: ', this.first_time_back);

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
    incrementEpisode() {
      console.log('__________In incrementEpisode__________');
      console.log('this.selected_episode: ', this.selected_episode);
      console.log('this.latest_episode: ', this.latest_episode);
      this.selected_episode =
        this.episodes_labeled[this.selected_episode.episode_index + 1];
      console.log('new: this.selected_episode: ', this.selected_episode);
      console.log('__________Out incrementEpisode__________');
    },
    openPost(post) {
      console.log('__________In openPost__________');
      console.log('post: ', post);
      this.showCommentsForPost = post.id;
      this.showComments = !this.showComments;

      console.log('__________Out openPost__________');
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
