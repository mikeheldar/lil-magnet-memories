<template>
  <q-page class="flex flex-top">
    <div class="col">
      <!-- Firebase Test Component -->
      <FirebaseTest />

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
import FirebaseTest from '../components/FirebaseTest.vue';

export default {
  name: 'MyShowsPage',
  components: {
    FirebaseTest,
  },
  data() {
    return {
      myShows: [],
    };
  },

  mounted() {
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
      this.getMyShows();
    }
  },
  methods: {
    async getMyShows() {
      console.log('In getMyShows - Firebase version');

      try {
        // Firebase Firestore calls using localStorage temporarily
        // In production, you'd query Firestore user_shows collection
        console.log('Firebase getMyShows - getting shows from localStorage');

        // Get from localStorage
        const userEmail = sessionStorage.getItem('userEmail') || 'default_user';
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
