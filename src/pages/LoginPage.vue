<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center">
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
      <div class="col q-pt-lg">
        <q-input filled v-model="userEmail" label="email address (login)" />
        <q-input filled v-model="userPassword" label="password" />
        <q-btn
          color="primary"
          glossy
          label="login"
          @click="serverLogin(userEmail, '')"
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
      console.log('Handle the token', userData.jti);
      this.serverLogin(userData.email, userData.jti);
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
          console.log('saving access_token: ' + res.authResponse.access_token);
          const access_token = res.authResponse.access_token;

          this.$hello(network)
            .api('me')
            .then((res) => {
              console.log(res.email);
              console.log('facebook me res: ' + JSON.stringify(res));
              this.serverLogin(res.email, access_token);
            });
        });
    },
    serverLogin(userEmail, userToken) {
      console.log('In serverLogin, userEmail', userEmail);

      const payload = {
        email: userEmail,
        token: userToken,
        password: this.userPassword,
      };
      console.log('userToken', JSON.stringify(userToken));
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
  data() {
    return {
      userPassword: '',
    };
  },
};
</script>
