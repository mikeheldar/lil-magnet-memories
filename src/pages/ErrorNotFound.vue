<template>
  <q-page class="flex flex-center">
    <div class="text-center">
      <div class="text-h1 text-primary q-mb-md">
        <q-icon name="error_outline" size="64px" />
      </div>
      <div class="text-h4 text-weight-bold q-mb-sm">Page Not Found</div>
      <div class="text-h6 text-grey-7 q-mb-lg">
        Sorry, the page you're looking for doesn't exist.
      </div>
      <q-btn
        color="primary"
        size="lg"
        label="Go Home"
        icon="home"
        @click="$router.push('/')"
      />
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ErrorNotFound',
};
</script>
