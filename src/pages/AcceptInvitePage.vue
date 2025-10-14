<template>
  <q-page class="q-pa-md flex flex-center">
    <div class="row justify-center" style="max-width: 600px">
      <div class="col-12">
        <!-- Loading State -->
        <q-card v-if="loading" class="text-center q-pa-xl">
          <q-spinner color="primary" size="3em" />
          <div class="text-h6 q-mt-md">Processing invitation...</div>
        </q-card>

        <!-- Need to Login State -->
        <q-card v-else-if="!isLoggedIn" class="q-pa-lg">
          <q-card-section class="text-center">
            <q-icon
              name="person_add"
              color="primary"
              size="64px"
              class="q-mb-md"
            />
            <div class="text-h5 q-mb-sm">Friend Request</div>
            <div class="text-body1 text-grey-7 q-mb-lg">
              <strong>{{ inviterName }}</strong> wants to connect with you on
              Spoiler Alert!
            </div>
            <div class="text-body2 text-grey-8 q-mb-xl">
              Please log in or sign up to accept this friend request.
            </div>
            <div class="column q-gutter-md">
              <q-btn
                color="primary"
                label="Log In"
                icon="login"
                size="lg"
                @click="goToLogin"
              />
              <q-btn
                flat
                color="primary"
                label="Sign Up"
                @click="goToRegister"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Success State -->
        <q-card v-else-if="accepted" class="q-pa-lg">
          <q-card-section class="text-center">
            <q-icon
              name="check_circle"
              color="positive"
              size="64px"
              class="q-mb-md"
            />
            <div class="text-h5 q-mb-sm">Friend Request Accepted!</div>
            <div class="text-body1 q-mb-lg">
              You're now friends with <strong>{{ inviterName }}</strong>
            </div>
            <q-btn
              color="primary"
              label="Go to Friends"
              icon="people"
              @click="goToFriends"
            />
          </q-card-section>
        </q-card>

        <!-- Error State -->
        <q-card v-else-if="error" class="q-pa-lg">
          <q-card-section class="text-center">
            <q-icon name="error" color="negative" size="64px" class="q-mb-md" />
            <div class="text-h5 q-mb-sm">Oops!</div>
            <div class="text-body1 q-mb-lg">{{ error }}</div>
            <q-btn color="primary" label="Go to Friends" @click="goToFriends" />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'AcceptInvitePage',
  data() {
    return {
      invitationToken: this.$route.params.token,
      loading: true,
      isLoggedIn: false,
      accepted: false,
      error: null,
      inviterName: '',
    };
  },
  async mounted() {
    // Check if user is logged in
    this.isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
    const userEmail = sessionStorage.getItem('userEmail');

    console.log('Accept invite page mounted:', {
      token: this.invitationToken,
      isLoggedIn: this.isLoggedIn,
      userEmail,
    });

    // Store the invitation token for after login
    if (!this.isLoggedIn) {
      sessionStorage.setItem('pendingInvitation', this.invitationToken);

      // Try to get inviter name from the token (for display)
      try {
        const decoded = atob(this.invitationToken);
        const parts = decoded.split(':');
        if (parts[0]) {
          this.inviterName = parts[0].split('@')[0];
        }
      } catch (e) {
        this.inviterName = 'Someone';
      }

      this.loading = false;
      return;
    }

    // User is logged in, accept the invitation
    await this.acceptInvitation(userEmail);
  },
  methods: {
    async acceptInvitation(userEmail) {
      this.loading = true;

      try {
        const response = await this.$api.post('/accept-friend-request', {
          invitationToken: this.invitationToken,
          userEmail: userEmail,
        });

        if (response.data.success) {
          this.accepted = true;
          this.inviterName = response.data.friend.name;

          // Clear the pending invitation
          sessionStorage.removeItem('pendingInvitation');

          console.log('✅ Friend request accepted!', response.data.friend);
        } else {
          this.error = 'Failed to accept friend request. Please try again.';
        }
      } catch (error) {
        console.error('❌ Error accepting friend request:', error);

        if (error.response?.status === 404) {
          this.error = 'This invitation is no longer valid.';
        } else if (error.response?.status === 403) {
          this.error = 'This invitation was not sent to your email address.';
        } else {
          this.error = 'Something went wrong. Please try again later.';
        }
      } finally {
        this.loading = false;
      }
    },
    goToLogin() {
      this.$router.push('/login');
    },
    goToRegister() {
      this.$router.push('/register');
    },
    goToFriends() {
      this.$router.push('/friends');
    },
  },
};
</script>
