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
        <q-space />
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
      <div class="q-px-lg q-pt-xl q-pb-md">
        <div class="text-h3">TV Togetherness.</div>
        <div class="text-subtitle1">No Spoilers.</div>
        <div>Session Data: {{ loggedIn }}</div>
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
          <q-item exact clickable v-ripple to="/">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> Home </q-item-section>
          </q-item>

          <q-item exact clickable v-ripple to="/register">
            <q-item-section avatar>
              <q-icon name="list" />
            </q-item-section>
            <q-item-section> Sign-up </q-item-section>
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
      <q-list>
        <q-item-label header> Essential Links </q-item-label>

        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue';
import EssentialLink from 'components/EssentialLink.vue';

const linksList = [
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev',
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework',
  },
  {
    title: 'Discord Chat Channel',
    caption: 'chat.quasar.dev',
    icon: 'chat',
    link: 'https://chat.quasar.dev',
  },
  {
    title: 'Forum',
    caption: 'forum.quasar.dev',
    icon: 'record_voice_over',
    link: 'https://forum.quasar.dev',
  },
  {
    title: 'Twitter',
    caption: '@quasarframework',
    icon: 'rss_feed',
    link: 'https://twitter.quasar.dev',
  },
  {
    title: 'Facebook',
    caption: '@QuasarFramework',
    icon: 'public',
    link: 'https://facebook.quasar.dev',
  },
  {
    title: 'Quasar Awesome',
    caption: 'Community Quasar projects',
    icon: 'favorite',
    link: 'https://awesome.quasar.dev',
  },
];

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink,
  },

  setup() {
    const leftDrawerOpen = ref(false);

    return {
      essentialLinks: linksList,
      leftDrawerOpen,
      toggleLeftDrawer() {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      },
    };
  },

  data() {
    return {
      loggedIn: sessionStorage.getItem('loggedIn'),
    };
  },
  mounted() {
    this.loggedIn = sessionStorage.getItem('loggedIn');
    this.$eventbus.on('loggedIn', (loggedIn) => {
      this.loggedIn = loggedIn;
    });
    console.log('local loggedIn now: ', this.loggedIn);
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
