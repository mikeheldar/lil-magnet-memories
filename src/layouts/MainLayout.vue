<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center">
          <div class="row items-center justify-center">
            <q-icon name="photo_camera" size="28px" class="q-mr-sm" />
            <span class="text-h5 text-weight-bold">Lil Magnet Memories</span>
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: 'MainLayout',
};
</script>

<style lang="scss">
.q-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}
</style>
