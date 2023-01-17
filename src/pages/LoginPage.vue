<template>
  <q-page class="row items-center justify-evenly">
    <h5>Login</h5>
  </q-page>
  <q-btn @click="loginToGoogle()" flat rounded color="primary" icon="delete" />
</template>

<script>
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// GoogleSignin.configure();
</script>
