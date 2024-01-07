<template>
  <q-page class="flex flex-center">
    <div>
      <div v-if="profile.id">
        <div class="q-title">
          {{ profile.first_name + ' ' + profile.last_name }}
        </div>
        <div class="q-subtitle">{{ profile.email }}</div>
        <p><img :src="profile.picture" /></p>
      </div>
      <div class="q-mt-xl">
        <q-btn label="Logout" size="md" @click="logout()"> </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ProfilePage',
  data() {
    return {
      profile: {},
    };
  },
  mounted() {
    this.getProfile('facebook');
  },
  methods: {
    getProfile(network) {
      if (this.$hello.getAuthResponse(network) == null) {
        return;
      }
      this.$hello(network)
        .api('me')
        .then((res) => {
          //console.log(res);
          this.profile = res;
        });
    },
    logout() {
      this.$hello.logout('facebook', { force: true });
      console.log(
        'Session loggedIn now: ' + sessionStorage.getItem('loggedIn')
      );
      sessionStorage.setItem('loggedIn', 'false');
      this.$eventbus.emit('loggedIn', 'false');

      sessionStorage.setItem('isAdmin', 'false');
      this.$eventbus.emit('isAdmin', 'false');

      console.log(
        'Session loggedIn now: ' + sessionStorage.getItem('loggedIn')
      );

      this.$router.push('/login');
    },
  },
};
</script>
