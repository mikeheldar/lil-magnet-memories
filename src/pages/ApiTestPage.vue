<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center" style="height: 150px">
      <div class="col q-pt-xl">
        <q-input filled v-model="messageToVerify" label="message to verify" />
        <q-btn
          color="primary"
          glossy
          label="test message verify api"
          @click="verifyMessage(messageToVerify)"
          style="width: 248px"
        >
        </q-btn>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'LoginPage',
  methods: {
    verifyMessage(messageToVerify) {
      console.log('In verifyMessage, messageToVerify: ', messageToVerify);

      const payload = {
        message: messageToVerify,
      };
      const headers = {
        authorization: sessionStorage.getItem('token'),
      };

      console.log('payload to send: ', payload);
      console.log('headers to send: ', headers);

      this.$api
        .get('/api-test/verify', { headers })
        .then((res) => {
          console.log('Response from server: ', res);
        })
        .catch((err) => {
          console.log('Error: ', err);
        });
    },
  },

  data() {
    return {
      messageToVerify: '',
    };
  },
};
</script>
