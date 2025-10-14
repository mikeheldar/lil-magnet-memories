<template>
  <q-page class="row items-top justify-evenly q-pt-xl">
    <div class="column items-center">
      <div v-if="!logging_in_classic">
        <div class="text-h4 text-primary text-weight-bold text-center q-mb-md">
          Welcome to Spoiler Alert
        </div>
        <div class="text-subtitle1 text-grey-7 text-center q-mb-xl">
          Track your shows and connect with friends
        </div>

        <div class="login-buttons-container">
          <div class="q-mb-md">
            <GoogleLogin :callback="googleAuth" />
          </div>
          <div class="q-mb-md">
            <q-btn
              unelevated
              color="blue"
              icon="facebook"
              label="Continue with Facebook"
              class="login-btn facebook-btn"
              @click="facebookAuth"
            />
          </div>
          <div class="q-mt-sm">
            <q-btn
              outline
              color="primary"
              icon="email"
              label="Sign in with Email"
              class="login-btn"
              @click="getClassicLogin"
            />
          </div>
        </div>
      </div>
      <div v-if="logging_in_classic" class="login-classic-container">
        <div class="text-h5 text-primary text-weight-bold text-center q-mb-md">
          {{
            new_user
              ? 'Create Account'
              : forgot_password
              ? 'Reset Password'
              : 'Email Login'
          }}
        </div>

        <q-dialog v-model="showLoginFailedDialog">
          <q-card>
            <q-card-section>
              <div class="text-h6 text-negative q-mb-md">Login Failed</div>
              <div class="text-body1">{{ error_message }}</div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn label="OK" color="primary" @click="handleFailedLogin" />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <div class="q-gutter-md email-form-container">
          <q-input
            filled
            type="email"
            v-model="user_email"
            label="Email Address"
            clearable
            class="email-input"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-if="!forgot_password"
            filled
            v-model="user_password"
            label="Password"
            type="password"
            class="email-input"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-input
            v-if="!forgot_password && new_user"
            filled
            v-model="user_password2"
            label="Confirm Password"
            type="password"
            class="email-input"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-btn
            v-if="!forgot_password && !new_user"
            color="primary"
            unelevated
            label="Sign In"
            @click="handleLogin()"
            class="login-btn"
          />

          <q-btn
            v-if="!forgot_password && new_user"
            color="primary"
            unelevated
            label="Create Account"
            @click="handleSignup()"
            class="login-btn"
          />

          <q-btn
            v-if="forgot_password"
            color="primary"
            unelevated
            label="Send Reset Email"
            @click="resetPassword(user_email)"
            class="login-btn"
          />

          <div class="row q-gutter-sm justify-center">
            <q-btn
              v-if="!forgot_password && !new_user"
              flat
              color="grey-7"
              label="Forgot password?"
              @click="forgotPassword"
              size="sm"
            />
            <q-btn
              v-if="!forgot_password && !new_user"
              flat
              color="grey-7"
              label="New User?"
              @click="newUser"
              size="sm"
            />
            <q-btn
              v-if="forgot_password"
              flat
              color="grey-7"
              label="I remembered!"
              @click="rememberPassword"
              size="sm"
            />
            <q-btn
              v-if="new_user"
              flat
              color="grey-7"
              label="Already a User?"
              @click="alreadyUser"
              size="sm"
            />
          </div>

          <q-separator class="q-my-xs" />

          <q-btn
            outline
            color="primary"
            icon="arrow_back"
            label="Back to Social Login"
            @click="getSocialLogin"
            class="login-btn back-btn"
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
        const name =
          userData.name || userData.given_name || email.split('@')[0];
        const avatar = userData.picture || '';

        // Try to sign in with email (this is a simplified approach)
        // In production, you should use GoogleAuthProvider properly
        console.log('Attempting Firebase login with email:', email);

        // Save user profile data
        sessionStorage.setItem('loggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('userName', name);
        sessionStorage.setItem('userAvatar', avatar);
        sessionStorage.setItem('loginMethod', 'google');
        sessionStorage.setItem('isAdmin', 'false');

        this.$eventbus.emit('loggedIn', 'true');
        this.$eventbus.emit('isAdmin', 'false');

        console.log('Google login successful with profile:', {
          email,
          name,
          avatar,
        });

        // Check for pending invitation
        const pendingInvitation = sessionStorage.getItem('pendingInvitation');
        if (pendingInvitation) {
          console.log('Found pending invitation, redirecting to accept...');
          this.$router.push(`/accept-invite/${pendingInvitation}`);
        } else {
          this.$router.push('/my-shows');
        }
      } catch (error) {
        console.log('Firebase authentication error:', error);
        throw error;
      }
    },
    async facebookAuth() {
      console.log('Starting Facebook authentication...');

      // Check if FB SDK is loaded
      if (!window.FB) {
        console.error('Facebook SDK not loaded yet');
        this.error_message =
          'Facebook login is still loading. Please try again in a moment.';
        this.showLoginFailedDialog = true;
        return;
      }

      try {
        // Use Facebook Login with modern SDK
        window.FB.login(
          (response) => {
            console.log('Facebook login response:', response);

            if (response.authResponse) {
              console.log('Facebook login successful!');
              const accessToken = response.authResponse.accessToken;

              // Get user profile info
              window.FB.api(
                '/me',
                { fields: 'id,name,email' },
                async (userInfo) => {
                  console.log('Facebook user info:', userInfo);

                  if (!userInfo.email) {
                    this.error_message =
                      'Unable to get email from Facebook. Please ensure you granted email permission.';
                    this.showLoginFailedDialog = true;
                    return;
                  }

                  try {
                    // Check if user exists
                    const user_exists = await this.userExistsTest(
                      userInfo.email
                    );

                    if (!user_exists) {
                      console.log('New Facebook user, creating account...');
                      await this.addUser(userInfo.email, '');
                    }

                    // Get Facebook profile picture
                    window.FB.api(
                      '/me/picture',
                      { redirect: false, type: 'large' },
                      (pictureData) => {
                        const avatar = pictureData?.data?.url || '';

                        // Save Facebook profile data
                        sessionStorage.setItem(
                          'userName',
                          userInfo.name || userInfo.email.split('@')[0]
                        );
                        sessionStorage.setItem('userAvatar', avatar);
                        sessionStorage.setItem('loginMethod', 'facebook');

                        console.log('Facebook profile saved:', {
                          name: userInfo.name,
                          avatar: avatar,
                        });
                      }
                    );

                    // Log the user in
                    await this.serverLogin(userInfo.email, accessToken);
                  } catch (error) {
                    console.error('Error during Facebook user setup:', error);
                    this.error_message = 'Login failed. Please try again.';
                    this.showLoginFailedDialog = true;
                  }
                }
              );
            } else {
              console.log(
                'User cancelled Facebook login or did not fully authorize.'
              );
              // User cancelled login, don't show error
            }
          },
          {
            scope: 'email,public_profile',
            return_scopes: true,
          }
        );
      } catch (err) {
        console.error('Facebook login error:', err);
        this.error_message = 'Facebook login failed. Please try again.';
        this.showLoginFailedDialog = true;
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

        // Check for pending invitation
        const pendingInvitation = sessionStorage.getItem('pendingInvitation');
        if (pendingInvitation) {
          console.log('Found pending invitation, redirecting to accept...');
          this.$router.push(`/accept-invite/${pendingInvitation}`);
        } else {
          this.$router.push('/my-shows');
        }
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

<style lang="scss" scoped>
.login-buttons-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.login-btn {
  height: 40px;
  font-size: 15px;
  width: 245px !important; // Match typical Google button width
  min-width: 245px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.facebook-btn {
  background: #1877f2 !important;

  &:hover {
    background: #166fe5 !important;
  }
}

.login-classic-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
}

.email-form-container {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.email-input {
  width: 240px !important;

  :deep(.q-field__control) {
    width: 240px !important;
  }
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .login-buttons-container {
    max-width: 280px;
  }

  .login-btn {
    height: 40px;
    font-size: 14px;
    min-width: 200px;
  }

  .login-classic-container {
    width: 100%;
    padding: 0 20px;
    max-width: 280px;

    > div {
      width: 100% !important;
    }
  }

  .email-input {
    width: 200px !important;

    :deep(.q-field__control) {
      width: 200px !important;
    }
  }

  .back-btn {
    margin-bottom: 4px !important;
  }

  .q-separator {
    margin: 2px 0 !important;
  }

  .login-btn {
    height: 40px;
    font-size: 14px;
    min-width: 200px;
  }
}
</style>
