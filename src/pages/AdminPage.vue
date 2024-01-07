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
        <q-btn
          color="primary"
          glossy
          label="create post from text"
          @click="createPostFromText(messageToVerify)"
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
  data() {
    return {
      messageToVerify: '',
    };
  },

  async mounted() {
    // Not sure if I need this code in all pages on mounted
    if (
      sessionStorage.getItem('loggedIn') === 'false' &&
      sessionStorage.getItem('isAdmin') === 'true'
    ) {
      console.log('Not logged in, redirecting to login page');
      this.$router.push('/login');
    } else {
      console.log('Logged in, doing show page stuff');
    }
  },
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
    async createPostFromText(messageToVerify) {
      console.log('In createPostFromText, messageToVerify: ', messageToVerify);
      try {
        const result = await this.$gptFromText(messageToVerify); // Call your custom method
        // Handle the result here
        console.log(result); // Log the result to the console
      } catch (error) {
        // Handle any errors here
        console.error(error);
      }
    },
  },
};
</script>
