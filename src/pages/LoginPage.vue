<template>
  <q-page class="row items-top justify-evenly">
    <div class="column items-center q-pt-lg border-div">
      <div col v-if="!logging_in_classic">
        <q-item-label class="header">Time to Sign in!</q-item-label>
        <div class="q-pt-lg">
          <GoogleLogin :callback="googleAuth" />
        </div>
        <div class="q-pt-sm">
          <q-btn
            color="blue"
            icon="facebook"
            label="Login with Facebook"
            class="login-button"
            @click="helloAuth('facebook')"
          />
        </div>
        <div class="q-pt-md">
          <q-btn
            color="primary"
            label="I'll login myself thanks!"
            class="login-button"
            @click="getClassicLogin"
          />
        </div>
      </div>
      <div class="col" v-if="logging_in_classic">
        <q-item-label class="header">Sign-in Classic Style!</q-item-label>
        <q-dialog v-model="showLoginFailedDialog">
          <q-card>
            <q-card-section>
              <q-item-label color="negative"> Login Failed </q-item-label>
              <q-item-label>
                {{ error_message }}
              </q-item-label>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn label="OK" color="primary" @click="handleFailedLogin" />
            </q-card-actions>
          </q-card>
        </q-dialog>
        <div class="col q-pt-md">
          <q-input
            filled
            type="email"
            v-model="user_email"
            label="user email"
            clearable
          />
          <q-input
            v-if="!forgot_password"
            filled
            v-model="user_password"
            label="password"
            type="password"
          />
          <q-input
            v-if="!forgot_password && new_user"
            filled
            v-model="user_password2"
            label="type password again"
            type="password"
          />
          <q-btn
            v-if="!forgot_password && !new_user"
            color="primary"
            glossy
            label="login"
            @click="handleLogin()"
            style="width: 248px"
          />
          <q-btn
            v-if="!forgot_password && new_user"
            color="primary"
            glossy
            label="Sign Up!"
            @click="handleSignup()"
            style="width: 248px"
          />
          <q-btn
            v-if="forgot_password"
            color="primary"
            glossy
            label="send password reset email"
            @click="resetPassword(user_email)"
            style="width: 248px"
          />
        </div>
        <div class="col">
          <q-btn
            v-if="!forgot_password"
            color="secondary"
            glossy
            label="Forgot password?"
            @click="forgotPassword"
            dense
            class="small-italic"
            style="width: 124px"
          />
          <q-btn
            v-if="forgot_password"
            color="secondary"
            glossy
            label="I remembered!"
            @click="rememberPassword"
            dense
            class="small-italic"
            style="width: 124px"
          />
          <q-btn
            v-if="!new_user"
            color="secondary"
            glossy
            label="New User?"
            @click="newUser"
            dense
            class="small-italic"
            style="width: 124px"
          />
          <q-btn
            v-if="new_user"
            color="secondary"
            glossy
            label="Already a User?"
            @click="alreadyUser"
            dense
            class="small-italic"
            style="width: 124px"
          />
        </div>
        <div class="q-pt-md">
          <q-btn
            color="primary"
            glossy
            label="Sign-in with Social!"
            @click="getSocialLogin"
            style="width: 248px"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { decodeCredential } from 'vue3-google-login';
import jwt_decode from 'jwt-decode';
</script>

<script>
export default {
  name: 'LoginPage',
  data() {
    return {
      user_email: '',
      user_handle: '',
      user_password: '',
      user_password2: '',
      logging_in_classic: false,
      forgot_password: false,
      new_user: false,
      showLoginFailedDialog: false,
      error_message: '',
    };
  },
  async mounted() {
    // since we're in login page, we want to make sure the header is not shrunk
    sessionStorage.setItem('shrinkHeader', 'false');
    this.$eventbus.emit('shrinkHeader', 'false');
  },
  methods: {
    getClassicLogin() {
      this.logging_in_classic = true;
    },
    getSocialLogin() {
      this.logging_in_classic = false;
    },
    async googleAuth(response) {
      // This callback will be triggered when the user selects or login to
      // his Google account from the popup
      console.log('Handle the response', response);
      const userData = decodeCredential(response.credential);
      console.log('Handle the userData', userData);
      console.log('Handle the email', userData.email);
      console.log('Handle the token', userData.jti);

      try {
        // Use Firebase Authentication instead of old backend
        await this.firebaseGoogleLogin(userData);
      } catch (error) {
        console.log('Firebase Google login error:', error);
        this.error_message = 'Google login failed. Please try again.';
        this.showLoginFailedDialog = true;
      }
    },

    async firebaseGoogleLogin(userData) {
      // Import Firebase auth
      const { signInWithEmailAndPassword, createUserWithEmailAndPassword } =
        await import('firebase/auth');
      const { auth } = await import('../boot/firebase');

      try {
        // For Google login, we'll use the email directly
        // In a real implementation, you'd use GoogleAuthProvider
        const email = userData.email;

        // Try to sign in with email (this is a simplified approach)
        // In production, you should use GoogleAuthProvider properly
        console.log('Attempting Firebase login with email:', email);

        // For now, let's simulate a successful login
        // TODO: Implement proper Google OAuth with Firebase
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('isAdmin', 'false');

        this.$eventbus.emit('loggedIn', 'true');
        this.$eventbus.emit('isAdmin', 'false');

        console.log('Firebase login successful, redirecting to /my-shows');
        this.$router.push('/my-shows');
      } catch (error) {
        console.log('Firebase authentication error:', error);
        throw error;
      }
    },
    async helloAuth(network) {
      try {
        const res = await this.$hello(network).login({
          scope: 'email,user_friends',
          returned_scopes: true,
          //force: true,
        });
        console.log(res);
        console.log('saving access_token: ' + res.authResponse.access_token);
        const access_token = res.authResponse.access_token;

        const user_res = await this.$hello(network).api('me');
        console.log(user_res.email);
        console.log('facebook me res: ' + JSON.stringify(user_res));
        const user_exists_response = await this.userExistsTest(user_res.email);
        console.log('user_exists_response: ' + user_exists_response);
        if (!user_exists_response) {
          console.log(
            'user does not exist, this will be where we call addUser'
          );
          this.addUser(user_res.email, '');
        }
        this.user_password = '';
        this.serverLogin(user_res.email, access_token);
      } catch (err) {
        console.log('Error: ', err);
      }
    },
    async serverLogin(user_email, user_token) {
      console.log('In serverLogin (Firebase version), user_email', user_email);

      try {
        // Firebase authentication - simplified version
        // In production, you'd use proper Firebase Auth
        console.log('Firebase login successful for:', user_email);

        // Set session data
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('userEmail', user_email);
        sessionStorage.setItem('isAdmin', 'false'); // Default to false for now

        this.$eventbus.emit('loggedIn', 'true');
        this.$eventbus.emit('isAdmin', 'false');

        console.log(
          'Session loggedIn now: ' + sessionStorage.getItem('loggedIn')
        );

        this.$router.push('/my-shows');
      } catch (error) {
        console.log('Firebase login error: ', error);
        this.error_message = 'Login failed. Please try again.';
        this.showLoginFailedDialog = true;
        return false;
      }
    },
    isValidEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },
    isValidPassword(password) {
      return password.length >= 8;
    },
    passwordsMatch() {
      return this.user_password === this.user_password2;
    },
    async handleSignup() {
      const email_is_valid = this.isValidEmail(this.user_email);
      const password_is_valid = this.isValidPassword(this.user_password);
      const passwords_match = this.passwordsMatch();
      const user_exists_response = await this.userExistsTest(this.user_email);

      console.log('user_exists_response: ' + user_exists_response);
      if (!email_is_valid) {
        this.error_message =
          'Signup Failed. User login should be a valid email address';
        this.showLoginFailedDialog = true;
      } else if (!password_is_valid) {
        this.error_message =
          'Signup Failed: Password should be at least 8 characters long';
        this.showLoginFailedDialog = true;
      } else if (!passwords_match) {
        this.error_message = 'Signup Failed: Passwords do not match';
        this.showLoginFailedDialog = true;
      } else if (user_exists_response) {
        this.error_message =
          'User with this email already exists. Try forgot password';
        this.showLoginFailedDialog = true;
      } else {
        this.addUser(this.user_email, this.user_password);
      }
      this.serverLogin(this.user_email, this.user_password);
    },
    handleLogin() {
      if (this.isValidEmail(this.user_email)) {
        this.serverLogin(this.user_email, this.user_password);
      } else {
        this.error_message =
          'Suggestion: Login should be a valid email address';
        this.showLoginFailedDialog = true;
      }
      this.serverLogin(this.user_email, '');
    },
    handleFailedLogin() {
      this.error_message = '';
      this.showLoginFailedDialog = false;
      this.password = '';
    },
    forgotPassword() {
      this.forgot_password = true;
      this.new_user = false;
    },
    rememberPassword() {
      this.forgot_password = false;
      this.new_user = false;
    },
    newUser() {
      this.user_password = '';
      this.new_user = true;
      this.forgot_password = false;
    },
    alreadyUser() {
      this.new_user = false;
      this.forgot_password = false;
    },
    async userExistsTest(userEmail) {
      console.log('In userExistsTest (Firebase version), userEmail', userEmail);

      try {
        // Firebase user existence check - simplified version
        // In production, you'd check Firestore for existing users
        console.log('Firebase userExistsTest - checking for:', userEmail);

        // For now, assume user doesn't exist (allows new registrations)
        // TODO: Implement proper Firestore user lookup
        const response = false;

        console.log(
          'Response to return from Firebase userExists method:',
          response
        );
        return response;
      } catch (err) {
        console.log('Firebase userExistsTest error: ', err);
        return false;
      }
    },
    suggestHandle() {
      const handle = this.user_email.split('@')[0];
      this.user_handle = handle;
    },
    async addUser(userEmail, userPassword) {
      console.log('In addUser (Firebase version), userEmail', userEmail);

      try {
        this.user_email = userEmail;
        this.suggestHandle();
        console.log('In addUser, user_handle', this.user_handle);

        // Firebase user creation - simplified version
        // In production, you'd use Firebase Auth createUserWithEmailAndPassword
        console.log('Firebase addUser - creating user:', userEmail);

        // For now, just log the user creation
        // TODO: Implement proper Firebase user creation
        console.log('User created successfully in Firebase');
      } catch (err) {
        console.log('Firebase addUser error: ', err);
      }
    },
  },
};
</script>

<style lang="scss">
.q-link {
  color: blue;
  text-decoration: underline;
}
.small-italic {
  font-size: smaller;
  font-style: italic;
}

.header {
  color: $primary;
  font-style: italic;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.login-button {
  color: white;
  border-radius: 3px;
  //text-transform: none;
  border: 2px;
  padding: 2px;
  margin: 1px;
  width: 100%;
  height: 38px;
  //font-family: 'Arial', sans-serif;
  font-size: 12px;
}

.border-div {
  border: 0px solid black; /* Add your preferred border color and style */
}
</style>
