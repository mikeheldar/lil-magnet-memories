<template>
  <q-page class="flex flex-top">
    <div class="col">
      <q-input filled v-model="showToFind" label="show to find" />
      <q-btn
        color="primary"
        glossy
        label="Get back to my shows!"
        @click="myShows()"
        style="width: 100%"
      >
      </q-btn>

      <q-list class="bg-white" separator bordered>
        <q-item v-for="show in shows" :key="show.name" v-ripple>
          <!-- <q-item-section>
            <q-img :src="show.thumbnail" />
          </q-item-section> -->

          <q-item-section>
            <q-item-label>{{ show.name }}</q-item-label>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ show.year }}</q-item-label>
          </q-item-section>

          <q-item-section>
            <q-btn
              v-if="!inMyShows(show.id.replace('series-', ''))"
              @click="addShow(show)"
              flat
              rounded
              color="primary"
              icon="bookmark_add"
            />
            <q-btn
              v-if="inMyShows(show.id.replace('series-', ''))"
              flat
              rounded
              color="accent"
              icon="bookmark_added"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ProfilePage',
  data() {
    return {
      showToFind: '',
      shows: [],
      myShowIDs: [],
    };
  },
  watch: {
    showToFind() {
      this.getTVShows(this.showToFind);
    },
  },
  mounted() {
    if (sessionStorage.getItem('loggedIn') === 'false') {
      console.log('Not logged in, redirecting to login page');
      this.$router.push('/login');
    } else {
      console.log('Logged in, getting my shows');
      this.getMyShowIDs();
    }
  },
  methods: {
    myShows() {
      this.$router.push('/my-shows');
    },
    getTVShows(query) {
      console.log('In getTVShows');
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

      const api_call_string =
        '/search?query=' + query + '&type=series&language=eng&limit=5';
      this.$tvdb
        .get(api_call_string, { headers })
        .then((response) => {
          console.log('response.data.data: ', response.data.data);
          this.shows = response.data.data;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async addShow(showToAdd) {
      console.log('In addShow (Firebase version), show: ', showToAdd);

      try {
        const payload = {
          id: showToAdd.id.replace('series-', ''),
          name: showToAdd.name,
          year: showToAdd.year,
          image_url: showToAdd.image_url,
          thumbnail: showToAdd.thumbnail,
          overview: showToAdd.overview,
        };
        console.log('Firebase addShow payload: ', payload);

        // Firebase show addition - simplified version using localStorage
        // In production, you'd add to Firestore user_shows collection
        console.log('Firebase addShow - adding show:', showToAdd.name);

        // Save to localStorage as temporary storage
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';
        const storageKey = `myShows_${userEmail}`;
        let myShows = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Check if show already exists
        if (!myShows.some((show) => show.id === payload.id)) {
          myShows.push(payload);
          localStorage.setItem(storageKey, JSON.stringify(myShows));
          console.log('Show added successfully to localStorage');
        } else {
          console.log('Show already in list');
        }

        // Refresh the show list
        this.getMyShowIDs();
      } catch (err) {
        console.log('Firebase addShow error: ', err);
        // Don't logout on error, just show message
        console.log('Failed to add show, but staying logged in');
      }
    },
    async getMyShowIDs() {
      console.log('In getMyShowIDs (Firebase version)');

      try {
        // Firebase show IDs retrieval - simplified version using localStorage
        // In production, you'd query Firestore user_shows collection
        console.log('Firebase getMyShowIDs - getting user shows');

        // Get from localStorage
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';
        const storageKey = `myShows_${userEmail}`;
        const myShows = JSON.parse(localStorage.getItem(storageKey) || '[]');

        // Convert to show IDs format
        this.myShowIDs = myShows.map((show) => ({
          show_id: parseInt(show.id),
        }));

        console.log('this.myShowIDs: ', this.myShowIDs);
      } catch (err) {
        console.log('Firebase getMyShowIDs error: ', err);
        // Don't logout on error, just show empty state
        this.myShowIDs = [];
      }
    },
    inMyShows(showID) {
      const show_id_num = parseInt(showID);
      console.log('In inMyShows, showID: ', show_id_num);
      console.log(this.myShowIDs);

      if (
        this.myShowIDs != -1 &&
        this.myShowIDs.some((item) => item.show_id === show_id_num)
      ) {
        console.log('showID is in myShowIDs');
        return true;
      } else {
        console.log('showID is NOT in myShowIDs');
        return false;
      }
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
<style lang="scss"></style>
