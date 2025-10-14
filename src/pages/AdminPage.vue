<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h4 text-purple q-mb-md text-weight-bold">
          Admin Panel
        </div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">
          Testing and administrative tools
        </div>

        <!-- Firebase Test Card -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="cloud" class="q-mr-sm" />
              Firebase Connection Test
            </div>
            <FirebaseTest />
          </q-card-section>
        </q-card>

        <!-- API Testing Card -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="api" class="q-mr-sm" />
              API Testing Tools
            </div>
            <q-input
              filled
              v-model="messageToVerify"
              label="Test Message"
              placeholder="Enter message to test"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="message" />
              </template>
            </q-input>
            <div class="column q-gutter-md">
              <q-btn
                color="primary"
                label="Test Message Verify API"
                icon="verified"
                @click="verifyMessage(messageToVerify)"
                size="md"
              />
              <q-btn
                color="secondary"
                label="Create Post from Text"
                icon="post_add"
                @click="createPostFromText(messageToVerify)"
                size="md"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import FirebaseTest from '../components/FirebaseTest.vue';

export default {
  name: 'AdminPage',
  components: {
    FirebaseTest,
  },
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
