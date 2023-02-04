<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center" style="height: 150px">
      <div class="col">
        <GoogleLogin :callback="googleAuth" style="width: 248px" />
      </div>
      <div class="col">
        <q-btn
          color="blue"
          glossy
          icon="fa-facebook-f"
          label="Login with Facebook"
          @click="helloAuth('facebook')"
          style="width: 248px"
        >
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { decodeCredential } from 'vue3-google-login';
// const callback = (response) => {
//   // This callback will be triggered when the user selects or login to
//   // his Google account from the popup
//   console.log('Handle the response', response);
//   const userData = decodeCredential(response.credential);
//   console.log('Handle the userData', userData);
//   console.log('Handle the email', userData.email);
//   serverLogin(userData.email);
// };
</script>

<script>
export default {
  name: 'LoginPage',
  methods: {
    googleAuth(response) {
      // This callback will be triggered when the user selects or login to
      // his Google account from the popup
      console.log('Handle the response', response);
      const userData = decodeCredential(response.credential);
      console.log('Handle the userData', userData);
      console.log('Handle the email', userData.email);
      this.serverLogin(userData.email);
    },
    helloAuth(network) {
      this.$hello(network)
        .login({
          scope: 'email,user_friends',
          returned_scopes: true,
          //force: true,
        })
        .then((res) => {
          console.log(res);
          this.$hello(network)
            .api('me')
            .then((res) => {
              console.log(res.email);
              this.serverLogin(res.email);
            });
        });
    },
    serverLogin(userEmail) {
      console.log('In serverLogin, userEmail', userEmail);

      const payload = {
        email: userEmail,
      };

      console.log('payload to send: ', payload);
      this.$api
        .post('/api/login', payload)
        .then((res) => {
          console.log('Response from server: ', res);
          //this.$router.push('/profile');
        })
        .catch((err) => {
          console.log('Error: ', err);
        });
    },
  },
};
</script>
