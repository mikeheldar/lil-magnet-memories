<template>
  <q-page class="flex flex-top">
    <div class="col">
      <q-input filled v-model="showToFind" label="show to find" />
      <q-btn
        color="primary"
        glossy
        label="Find Show"
        @click="getTVShows(showToFind)"
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
    this.getMyShowIDs();
  },
  methods: {
    getTVShows(query) {
      console.log('In getTVShows');
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
    addShow(showToAdd) {
      console.log('In addShow, show: ', showToAdd);

      const payload = {
        id: showToAdd.id.replace('series-', ''),
        name: showToAdd.name,
        year: showToAdd.year,
        image_url: showToAdd.image_url,
        thumbnail: showToAdd.thumbnail,
        overview: showToAdd.overview,
      };
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      this.$api
        .post('/api/add-show', payload, { headers })
        .then((res) => {
          console.log('Response from server: ', res);
          console.log(this.myShowIDs);
          console.log('showToAdd.id: ', showToAdd.id);
          this.getMyShowIDs();
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
    },
    getMyShowIDs() {
      console.log('In getMyShowIDs');
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      this.$api
        .get('/api/get-my-show-ids', { headers })
        .then((res) => {
          console.log('get-my-show-ids response from server: ', res.data);
          this.myShowIDs = res.data;
          console.log('this.myShowIDs: ', this.myShowIDs);
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
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
