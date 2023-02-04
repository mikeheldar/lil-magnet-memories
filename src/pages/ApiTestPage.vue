<template>
  <q-page class="row items-center justify-evenly">
    <div class="column items-center" style="height: 150px">
      <div class="col">
        <q-input filled v-model="emailToFind" label="email to find" />
        <q-btn
          color="primary"
          glossy
          label="test user exists api"
          @click="userExistsTest(emailToFind)"
          style="width: 248px"
        >
        </q-btn>
      </div>

      <div class="col q-pt-xl">
        <q-input filled v-model="emailToAdd" label="email to add" />
        <q-input filled v-model="passwordToAdd" label="password to add" />
        <q-btn
          color="primary"
          glossy
          label="test add user api"
          @click="addUser(emailToAdd, passwordToAdd)"
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
    userExistsTest(userEmail) {
      console.log('In userExistsTest, userEmail', userEmail);

      const payload = {
        email: userEmail,
      };

      console.log('payload to send: ', payload);
      this.$api
        .post('/api-test/user-exists', payload)
        .then((res) => {
          console.log('Response from server: ', res);
        })
        .catch((err) => {
          console.log('Error: ', err);
        });
    },
    addUser(userEmail, userPassword) {
      console.log('In userExistsTest, userEmail', userEmail);

      const payload = {
        email: userEmail,
        password: userPassword,
      };

      console.log('payload to send: ', payload);
      this.$api
        .post('/api-test/add-user', payload)
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
      emailToFind: '',
      emailToAdd: '',
      passwordToAdd: '',
    };
  },
};
</script>
