<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h4 text-purple q-mb-md text-weight-bold">Profile</div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">
          Manage your account settings
        </div>

        <!-- Profile Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="account_circle" class="q-mr-sm" />
              Account Information
            </div>

            <div v-if="profile.id" class="text-center q-py-lg">
              <q-avatar size="120px" class="q-mb-md">
                <img :src="profile.picture" />
              </q-avatar>
              <div class="text-h5 q-mb-sm">
                {{ profile.first_name + ' ' + profile.last_name }}
              </div>
              <div class="text-body1 text-grey-7">{{ profile.email }}</div>
            </div>

            <div v-else class="text-center q-py-lg text-grey-6">
              <q-icon name="account_circle" size="120px" class="q-mb-md" />
              <div class="text-h6">Profile not loaded</div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Actions Card -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="settings" class="q-mr-sm" />
              Actions
            </div>
            <q-btn
              label="Logout"
              size="lg"
              color="negative"
              icon="logout"
              @click="logout()"
              class="full-width"
            />
          </q-card-section>
        </q-card>
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
