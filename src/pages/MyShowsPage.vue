<template>
  <q-page class="flex flex-top">
    <div class="col">
      <div class="header">My Shows</div>
      <div class="column items-center q-pt-sm">
        <q-btn
          @click="addShows"
          label="Add Shows to My List"
          color="primary"
          class="q-ma-md"
        />
      </div>

      <q-list class="bg-white" separator bordered v-if="myShows.length > 0">
        <q-item v-for="show in myShows" :key="show.name" v-ripple>
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
              @click="goToShow(show)"
              flat
              rounded
              color="primary"
              icon="message"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'MyShowsPage',
  data() {
    return {
      myShows: [],
    };
  },

  mounted() {
    this.getMyShows();
  },
  methods: {
    getMyShows() {
      console.log('In getMyShows');
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      this.$api
        .get('/api/get-my-shows', { headers })
        .then((res) => {
          console.log('get-my-shows response from server: ', res.data);
          this.myShows = res.data;
          console.log('this.myShows: ', this.myShows);
        })
        .catch((err) => {
          console.log('Error: ', err);
          this.logout();
        });
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
