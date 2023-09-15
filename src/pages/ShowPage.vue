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
    <div class="col">
      <q-list>
        <q-item class="header">{{ show_name }}</q-item>
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
            v-model="my_post"
            autogrow
            label="Talk about it!"
            filled
            style="width: 100%"
          />
        </q-item>
        <q-item>
          <q-btn
            v-if="!posting && episode !== '0 - Not Started'"
            color="primary"
            glossy
            label="Talk about it"
            icon="edit"
            @click="startPost"
            style="width: 100%"
          />
          <q-btn
            v-if="posting"
            color="primary"
            glossy
            label="Post it!"
            icon="chat"
            @click="addPost"
            style="width: 100%"
          />
        </q-item>
      </q-list>
      <q-list v-if="Array.isArray(posts)" class="bg-white" separator bordered>
        <q-item
          v-ripple
          v-for="post in posts
            .filter((p) => p.season <= season)
            .filter((p) => p.episode <= user_latest_season_episode.value)"
          :key="post.created_at"
        >
          <div class="col">
            <div class="row">
              <q-item-section top>
                <q-item-label class="user-handle-label">{{
                  'season ' + post.season + ', episode ' + post.episode
                }}</q-item-label>
                <q-item-label class="user-handle-label">{{
                  post.user_handle
                }}</q-item-label>
                <q-item-label>{{
                  new Date(post.created_at).toLocaleString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true,
                  })
                }}</q-item-label>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ post.post_text }}</q-item-label>
              </q-item-section>
              <q-btn
                flat
                rounded
                color="primary"
                icon="comment"
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
            <div class="row q-pt-lg">
              <q-item-section>
                <q-list v-if="showComments && showCommentsForPost === post.id">
                  <q-item
                    class="comment-border"
                    v-for="item in nestedItems"
                    :key="item.id"
                  >
                    {{ item.content }}
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
    };
  },

  async mounted() {
    await this.getEpisodes();
    await this.getPosts();
    await this.getUserLatestSeasonEpisode();
    this.checkProgress();
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
    addPost() {
      console.log('In addPost');
      console.log('this.my_post: ', this.my_post);

      const payload = {
        show_id: this.show_id,
        season: this.season,
        episode: this.selected_episode.value,
        post: this.my_post,
      };
      console.log('payload to send: ', payload);

      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      this.$api
        .post('/api/add-post', payload, { headers })
        .then((res) => {
          console.log('Response from server: ', res);
          this.getPosts();
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
      this.posting = false;
    },
    async getEpisodes() {
      console.log('__________In getEpisodes__________');

      const apikey = '24c87807-e9cd-4e9c-8d19-28ef0f44d186';
      const authtoken =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZ2UiOiIiLCJhcGlrZXkiOiIyNGM4NzgwNy1lOWNkLTRlOWMtOGQxOS0yOGVmMGY0NGQxODYiLCJjb21tdW5pdHlfc3VwcG9ydGVkIjp0cnVlLCJleHAiOjE2OTYwNzI2MTAsImdlbmRlciI6IiIsImhpdHNfcGVyX2RheSI6MTAwMDAwMDAwLCJoaXRzX3Blcl9tb250aCI6MTAwMDAwMDAwLCJpZCI6IjIzMTYyMjEiLCJpc19tb2QiOmZhbHNlLCJpc19zeXN0ZW1fa2V5IjpmYWxzZSwiaXNfdHJ1c3RlZCI6ZmFsc2UsInBpbiI6IlZLR0dPUVNFIiwicm9sZXMiOltdLCJ0ZW5hbnQiOiJ0dmRiIiwidXVpZCI6IiJ9.Fi_ZVrzzmafrcq84RGHhqxB-Pv8wpooi0tXEOZq9gE0dbq2lPdGu6U1HFWKAhTRHJKjxZk3oMB89wuyfAe1ZM0rvmoL0WLLqzoffwNI9mbhhqIvqqU_0Ei0CPtRtOQ_XyJkCMh4Ve5rxFqaxqbhY9xchOIAajKYN9lXanDs9MZO7Tlse7O1KwRh4afAETKxjIpOkDjlobQJWB6Tfy4fcohLZWei-Ut5hTljyAlNB9uzkoJRaPx_Bm5uH3iAzxvhkvnH92stEPB15abasDIquQysHv33B0Ai-t3hwbe6_9w3sFzyPlpFExBRt7hq8qdYwVFtC1sw51KRlNO6Bj08gwWfTmjAx9rcdlKcal77X09GC362dxtLsJnhEiod-H5JFkp0Qxbu1FUpB66xbf3EvjtIzRJwYG9odcr-gEoXg9YZhtpsPRaLJeopviugwc8S6EcA7uu7nWwPuPR2rv58q34axcR6KNQ4nms1l0pOfwTAY43lPmg8eP08rJEKnxdcbsO2H9nL10OAzsGw2eYLzVyLHPLFthondjAC1OpJo33gNDm0WRW6_gU5XYbWf8eYSQQ-ssgLBYDYyY7AEgQ5zK7H65IqprdJcAnmuOpiezFrAN2WFM2PDnEZweECwONe0SsV6a29Jvxaka42thrl0qdVdCPj382udR4JAKAue4m0';

      const payload = {
        apikey: apikey,
        pin: 'VKGGOUSEF',
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
      console.log('__________In getPosts__________');
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      await this.$api
        .get('/api/get-posts/' + this.show_id, { headers })
        .then((res) => {
          console.log('get-posts response from server: ', res.data);
          this.posts = res.data;
          console.log('this.posts: ', this.posts);
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
      console.log('__________Out getPosts__________');
    },
    async getCommentsForPost() {
      console.log('__________In getCommentsForPost__________');
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      await this.$api
        .get('/api/get-comments/' + this.show_id, { headers })
        .then((res) => {
          console.log('get-comments response from server: ', res.data);
          this.posts = res.data;
          console.log('this.posts: ', this.posts);
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
      console.log('__________Out getCommentsForPost__________');
    },
    async getUserLatestSeasonEpisode() {
      console.log('__________In getUserLatestSeasonEpisode__________');
      this.inGetUserLatestSeasonEpisode = true;
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      await this.$api
        .get('/api/get-user-latest-season-episode/' + this.show_id, { headers })
        .then((res) => {
          console.log(
            'get-user-latest-season-episode response from server: ',
            res.data[0]
          );
          this.user_latest_season_episode = res.data[0];
          console.log(
            'set user_latest_season_episode: ',
            this.user_latest_season_episode
          );
          this.season = this.user_latest_season_episode.season;
          console.log('set season: ', this.season);
          this.selected_episode = this.user_latest_season_episode;
          console.log('set selected_episode: ', this.selected_episode);
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
      this.inGetUserLatestSeasonEpisode = false;
      console.log('__________Out getUserLatestSeasonEpisode__________');
    },
    async setUserLatestSeasonEpisode() {
      console.log('__________In setUserLatestSeasonEpisode__________');
      console.log('this.selected_episode: ', this.selected_episode);
      this.user_latest_episode = this.selected_episode;

      const payload = {
        show_id: this.show_id,
        season: this.season,
        episode: this.user_latest_episode.value,
        episode_label: this.user_latest_episode.label,
        episode_index: this.user_latest_episode.episode_index,
      };
      console.log('payload to send: ', payload);

      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      await this.$api
        .post('/api/set-season-episode', payload, { headers })
        .then((res) => {
          console.log('Response from server: ', res);
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
      this.checkProgress();
      await this.getPosts();
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
      // this.getCommentsForPost(post.id);
      this.nestedItems = [
        { id: 1, content: 'Item 1' },
        { id: 2, content: 'Item 2' },
        { id: 3, content: 'Item 3' },
      ];
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

.user-handle-label {
  font-size: 12px;
  font-weight: bold;
  font-style: italic;
}

.card-label {
  padding-left: 20px;
  font-size: 12px;
  font-weight: bold;
  font-style: italic;
}

.comment-border {
  border: 1px solid #ccc; /* Replace with your preferred border style and color */
  padding: 10px; /* Add padding for spacing */
}
</style>
