<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title> Spoiler Alert </q-toolbar-title>

        <q-btn
          v-if="loggedIn == 'true'"
          flat
          dense
          round
          icon="person"
          aria-label="Profile"
          @click="goToProfilePage"
        />
        <q-btn
          v-if="loggedIn == 'false'"
          flat
          dense
          round
          icon="login"
          aria-label="Login"
          @click="goToLoginPage"
        />
      </q-toolbar>
      <div class="q-px-lg q-pt-xl q-pb-md" v-if="shrinkHeader == 'false'">
        <div class="text-h3">TV Togetherness.</div>
        <div class="text-subtitle1">No Spoilers.</div>
      </div>
      <q-img src="../statics/tv_kids.jpg" class="header-image absolute-top" />
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-scroll-area
        style="
          height: calc(100% - 192px);
          margin-top: 192px;
          border-right: 1px solid #ddd;
        "
      >
        <q-list padding>
          <q-item exact clickable v-ripple to="/about">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> About </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/login">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> Login </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/add-show">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> Add Show </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/my-shows">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> My Shows </q-item-section>
          </q-item>

          <q-item v-if="isAdmin == 'true'" exact clickable v-ripple to="/admin">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> Admin Page </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>

      <q-img
        class="header-image absolute-top"
        src="../statics/tv_kids.jpg"
        style="height: 192px"
      >
        <div class="absolute-bottom bg-transparent">
          <q-avatar size="56px" class="q-mb-sm">
            <img src="../statics/mini_tv.png" />
          </q-avatar>
          <div class="text-weight-bold">Spoiler Alert</div>
        </div>
      </q-img>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'MainLayout',

  setup() {
    const leftDrawerOpen = ref(false);

    return {
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },

  data() {
    return {
      loggedIn: sessionStorage.getItem('loggedIn'),
      isAdmin: sessionStorage.getItem('isAdmin'),
      shrinkHeader: sessionStorage.getItem('shrinkHeader'),
    };
  },
  mounted() {
    this.$eventbus.on('loggedIn', (loggedIn) => {
      this.loggedIn = loggedIn;
    });
    this.$eventbus.on('isAdmin', (isAdmin) => {
      this.isAdmin = isAdmin;
    });
    this.$eventbus.on('shrinkHeader', (shrinkHeader) => {
      this.shrinkHeader = shrinkHeader;
    });

    const loggedIn = sessionStorage.getItem('loggedIn');
    console.log('MainLayout mounted - loggedIn:', loggedIn);

    if (loggedIn !== 'true') {
      console.log('Not logged in, redirecting to login page');
      this.$router.push('/login');
    } else {
      console.log('Logged in, staying on current page');
      // Don't redirect here - let the current page handle its own logic
    }
  },

  methods: {
    goToLoginPage() {
      console.log('goToLoginPage');
      this.$router.push('/login');
    },
    goToProfilePage() {
      console.log('goToProfilePage');
      this.$router.push('/profile');
    },
  },
});
</script>

<style lang="scss">
.header-image {
  height: 100%;
  z-index: -1;
  opacity: 0.6;
  filter: grayscale(50%);
}
</style>
