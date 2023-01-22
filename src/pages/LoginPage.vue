<template>
  <q-page class="row items-center justify-evenly">
    <GoogleLogin :callback="callback" />
    <div class="col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12 q-pa-xl dark">
      <div class="q-mt-xl">
        <q-btn
          color="primary"
          glossy
          push
          class="full-width"
          icon="fab fa-facebook-f"
          label="Login with Facebook"
          size="md"
          @click="auth('facebook')"
        >
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { decodeCredential } from 'vue3-google-login';
const callback = (response) => {
  // This callback will be triggered when the user selects or login to
  // his Google account from the popup
  console.log('Handle the response', response);
  const userData = decodeCredential(response.credential);
  console.log('Handle the userData', userData);
};
</script>

<script>
export default {
  name: 'LoginPage',
  methods: {
    auth(network) {
      this.$hello(network)
        .login({ scope: 'friends' })
        .then((res) => {
          console.log(res);
        });
    },
  },
};
</script>
