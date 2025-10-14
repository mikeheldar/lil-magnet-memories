<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h4 text-purple q-mb-md text-weight-bold">Friends</div>
        <div class="text-subtitle2 text-grey-7 q-mb-lg">
          Connect with friends to share your TV watching experience!
        </div>

        <!-- Search/Add Friend Section -->
        <q-card class="q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="person_add" class="q-mr-sm" />
              {{ loginMethod ? 'Search Friends' : 'Add Friend by Email' }}
            </div>

            <div v-if="loginMethod === 'google' || loginMethod === 'facebook'">
              <div class="text-body2 text-grey-7 q-mb-md">
                <q-spinner-dots
                  v-if="isLoadingContacts"
                  color="primary"
                  size="sm"
                  class="q-mr-sm"
                />
                <span v-if="isLoadingContacts">Loading your contacts...</span>
                <span v-else>
                  Search for friends from your
                  {{ loginMethod === 'google' ? 'Google' : 'Facebook' }}
                  contacts ({{ allContacts.length }} contacts loaded)
                </span>
              </div>
              <q-input
                v-model="searchQuery"
                filled
                label="Search by name or email"
                placeholder="Filter contacts or enter any email..."
                @input="filterContacts"
                @keyup="filterContacts"
                :disable="isLoadingContacts"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
                <template v-slot:append>
                  <q-icon
                    v-if="searchQuery"
                    name="clear"
                    @click="clearSearch"
                    class="cursor-pointer"
                  />
                </template>
              </q-input>

              <!-- All Contacts / Search Results -->
              <q-list
                v-if="displayedContacts.length > 0"
                bordered
                separator
                class="rounded-borders q-mt-md"
              >
                <q-item
                  v-for="contact in displayedContacts"
                  :key="contact.email"
                  clickable
                  v-ripple
                >
                  <q-item-section avatar>
                    <q-avatar>
                      <img v-if="contact.avatar" :src="contact.avatar" />
                      <q-icon v-else name="person" size="24px" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ contact.name }}</q-item-label>
                    <q-item-label caption>{{ contact.email }}</q-item-label>
                    <q-item-label
                      v-if="contact.isNewEmail"
                      caption
                      class="text-primary"
                    >
                      Not in contacts - will send invitation
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      v-if="
                        !isFriend(contact.email) && !isPending(contact.email)
                      "
                      color="primary"
                      label="Send Request"
                      size="sm"
                      @click="inviteFriend(contact)"
                    />
                    <q-chip
                      v-else-if="isPending(contact.email)"
                      color="orange"
                      text-color="white"
                      size="sm"
                    >
                      Pending
                    </q-chip>
                    <q-chip v-else color="green" text-color="white" size="sm">
                      Friends
                    </q-chip>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div v-else>
              <div class="text-body2 text-grey-7 q-mb-md">
                Enter your friend's email address to send them an invitation
              </div>
              <div class="row q-gutter-sm">
                <div class="col">
                  <q-input
                    v-model="friendEmail"
                    filled
                    type="email"
                    label="Friend's Email"
                    placeholder="friend@example.com"
                  >
                    <template v-slot:prepend>
                      <q-icon name="email" />
                    </template>
                  </q-input>
                </div>
                <div class="col-auto">
                  <q-btn
                    color="primary"
                    label="Send Request"
                    icon="send"
                    size="lg"
                    @click="inviteFriendByEmail"
                    :disable="!isValidEmail(friendEmail)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Friends List -->
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="people" class="q-mr-sm" />
              Your Friends
              <q-badge
                v-if="friends.length > 0"
                color="primary"
                :label="friends.length"
                class="q-ml-sm"
              />
            </div>

            <q-list
              v-if="friends.length > 0"
              bordered
              separator
              class="rounded-borders"
            >
              <q-item
                v-for="friend in friends"
                :key="friend.email"
                clickable
                v-ripple
                @click="viewFriendShows(friend)"
                class="friend-list-item"
              >
                <q-item-section avatar>
                  <q-avatar>
                    <img v-if="friend.avatar" :src="friend.avatar" />
                    <q-icon v-else name="person" size="24px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section class="friend-info-section">
                  <q-item-label>{{ friend.name }}</q-item-label>
                  <q-item-label caption class="ellipsis">{{
                    friend.email
                  }}</q-item-label>
                  <q-item-label caption v-if="friend.addedAt">
                    Friends since {{ formatDate(friend.addedAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="friend-actions-section">
                  <div class="row q-gutter-sm no-wrap">
                    <q-btn
                      flat
                      round
                      color="primary"
                      icon="tv"
                      size="sm"
                      @click.stop="viewFriendShows(friend)"
                    >
                      <q-tooltip>View Their Shows</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      color="primary"
                      icon="message"
                      size="sm"
                      @click.stop="messageAlertNotImplemented"
                    >
                      <q-tooltip>Message (Coming Soon)</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      round
                      color="negative"
                      icon="person_remove"
                      size="sm"
                      @click.stop="confirmRemoveFriend(friend)"
                    >
                      <q-tooltip>Remove Friend</q-tooltip>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center q-pa-lg text-grey-6">
              <q-icon name="people_outline" size="64px" class="q-mb-md" />
              <div class="text-h6">No friends yet</div>
              <div class="text-body2">
                Search and invite friends to start watching together!
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Incoming Friend Requests -->
        <q-card v-if="incomingRequests.length > 0" class="q-mt-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="person_add_alt" class="q-mr-sm" />
              Friend Requests
              <q-badge
                color="red"
                :label="incomingRequests.length"
                class="q-ml-sm"
              />
            </div>

            <q-list bordered separator class="rounded-borders">
              <q-item
                v-for="request in incomingRequests"
                :key="request.id"
                class="friend-list-item"
              >
                <q-item-section avatar>
                  <q-avatar>
                    <img v-if="request.avatar" :src="request.avatar" />
                    <q-icon v-else name="person" size="24px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section class="friend-info-section">
                  <q-item-label>{{ request.name }}</q-item-label>
                  <q-item-label caption class="ellipsis">{{
                    request.email
                  }}</q-item-label>
                  <q-item-label caption>
                    Sent {{ formatDate(request.invitedAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="friend-actions-section">
                  <div class="row q-gutter-sm no-wrap">
                    <q-btn
                      color="positive"
                      label="Accept"
                      size="sm"
                      @click="acceptFriendRequest(request)"
                      class="mobile-icon-only"
                      icon="check"
                    >
                      <span class="gt-xs">Accept</span>
                    </q-btn>
                    <q-btn
                      flat
                      color="negative"
                      label="Decline"
                      size="sm"
                      @click="declineFriendRequest(request)"
                      class="mobile-icon-only"
                      icon="close"
                    >
                      <span class="gt-xs">Decline</span>
                    </q-btn>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Pending Invitations -->
        <q-card v-if="pendingInvitations.length > 0" class="q-mt-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md">
              <q-icon name="mail" class="q-mr-sm" />
              Sent Invitations
              <q-badge
                color="orange"
                :label="pendingInvitations.length"
                class="q-ml-sm"
              />
            </div>

            <q-list bordered separator class="rounded-borders">
              <q-item v-for="invite in pendingInvitations" :key="invite.email">
                <q-item-section avatar>
                  <q-avatar>
                    <img v-if="invite.avatar" :src="invite.avatar" />
                    <q-icon v-else name="person" size="24px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ invite.name }}</q-item-label>
                  <q-item-label caption>{{ invite.email }}</q-item-label>
                  <q-item-label caption>
                    Invited {{ formatDate(invite.invitedAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    flat
                    color="negative"
                    label="Cancel"
                    size="sm"
                    @click="cancelInvitation(invite)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Remove Friend Confirmation Dialog -->
    <q-dialog v-model="showRemoveDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Remove Friend?</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          Are you sure you want to remove
          <strong>{{ friendToRemove?.name }}</strong> from your friends list?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn
            flat
            label="Remove"
            color="negative"
            @click="removeFriend"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Success Notification -->
    <q-dialog v-model="showSuccessDialog">
      <q-card>
        <q-card-section class="text-center">
          <q-icon name="check_circle" color="positive" size="64px" />
          <div class="text-h6 q-mt-md">{{ successMessage }}</div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
export default {
  name: 'FriendsPage',
  data() {
    return {
      userEmail: sessionStorage.getItem('userEmail') || '',
      loginMethod: sessionStorage.getItem('loginMethod') || '',
      searchQuery: '',
      friendEmail: '',
      searchResults: [],
      displayedContacts: [], // Contacts to show (all or filtered)
      friends: [],
      pendingInvitations: [],
      showRemoveDialog: false,
      showSuccessDialog: false,
      friendToRemove: null,
      successMessage: '',
      allContacts: [], // Store all contacts from Google/Facebook
      isLoadingContacts: false,
      refreshInterval: null, // For auto-refresh
      myShows: [],
      incomingRequests: [], // Friend requests sent TO this user
    };
  },
  mounted() {
    // Set header to shrink
    sessionStorage.setItem('shrinkHeader', 'true');
    this.$eventbus.emit('shrinkHeader', 'true');

    // Load friends data
    this.loadFriends();
    this.loadPendingInvitations();
    this.loadIncomingRequests();
    this.loadMyShows();

    // Load contacts from social platforms if logged in
    if (this.loginMethod === 'google') {
      this.loadGoogleContacts();
    } else if (this.loginMethod === 'facebook') {
      this.loadFacebookFriends();
    }

    // Start auto-refresh every 10 seconds
    this.refreshInterval = setInterval(() => {
      this.loadFriends();
      this.loadPendingInvitations();
      this.loadIncomingRequests();
    }, 10000);
  },
  beforeUnmount() {
    // Clean up the auto-refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  },
  methods: {
    async loadFriends() {
      // Load friends from API
      try {
        console.log('Loading friends from API for:', this.userEmail);
        const response = await this.$api.get(`/friends/${this.userEmail}`);

        if (response.data.friends) {
          this.friends = response.data.friends.map((friend) => ({
            name: friend.name,
            email: friend.email,
            avatar: '',
            addedAt: friend.addedAt,
          }));

          console.log(`✅ Loaded ${this.friends.length} friends from API`);
        }
      } catch (error) {
        console.error('Error loading friends from API:', error);
        // Fallback to localStorage for backwards compatibility
        const storageKey = `friends_${this.userEmail}`;
        const storedFriends = localStorage.getItem(storageKey);
        if (storedFriends) {
          this.friends = JSON.parse(storedFriends);
          console.log(
            `📦 Loaded ${this.friends.length} friends from localStorage (fallback)`
          );
        }
      }
    },

    async loadPendingInvitations() {
      // Load pending invitations from API
      try {
        console.log(
          'Loading pending invitations from API for:',
          this.userEmail
        );
        const response = await this.$api.get(
          `/pending-invitations/${this.userEmail}`
        );

        if (response.data.invitations) {
          this.pendingInvitations = response.data.invitations.map((inv) => ({
            email: inv.email,
            name: inv.name,
            avatar: '',
            invitedAt: inv.invitedAt,
          }));

          console.log(
            `✅ Loaded ${this.pendingInvitations.length} pending invitations from API`
          );
        }
      } catch (error) {
        console.error('Error loading pending invitations from API:', error);
        // Fallback to localStorage for backwards compatibility
        const storageKey = `pending_invitations_${this.userEmail}`;
        const storedInvitations = localStorage.getItem(storageKey);
        if (storedInvitations) {
          this.pendingInvitations = JSON.parse(storedInvitations);
          console.log(
            `📦 Loaded ${this.pendingInvitations.length} pending invitations from localStorage (fallback)`
          );
        }
      }
    },

    async loadIncomingRequests() {
      // Load incoming friend requests (sent TO this user)
      try {
        console.log('Loading incoming friend requests for:', this.userEmail);
        const response = await this.$api.get(
          `/friend-requests/${this.userEmail}`
        );

        if (response.data.requests) {
          const previousCount = this.incomingRequests.length;
          this.incomingRequests = response.data.requests.map((req) => ({
            id: req.id,
            email: req.fromEmail,
            name: req.fromName,
            avatar: '',
            invitedAt: req.createdAt,
          }));

          console.log(
            `✅ Loaded ${this.incomingRequests.length} incoming friend requests from API`
          );

          // Update notification count in sessionStorage
          sessionStorage.setItem(
            'friendRequestCount',
            this.incomingRequests.length
          );
          this.$eventbus.emit(
            'friendRequestCount',
            this.incomingRequests.length
          );

          // If there are new requests, show a notification
          if (this.incomingRequests.length > previousCount) {
            console.log(`🔔 New friend request(s)!`);
          }
        }
      } catch (error) {
        console.error('Error loading incoming requests from API:', error);
      }
    },

    async loadGoogleContacts() {
      // Load Google Contacts using Google People API
      console.log('Loading Google contacts...');
      this.isLoadingContacts = true;

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Note: In production, this would use Google People API
        // For now, we'll simulate with demo data
        // Real implementation requires OAuth2 with 'contacts.readonly' scope

        // Simulated Google Contacts - MORE DEMO DATA
        this.allContacts = [
          {
            name: 'Jane Smith',
            email: 'jane.smith@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'John Doe',
            email: 'john.doe@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'Sarah Johnson',
            email: 'sarah.j@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'Mike Williams',
            email: 'mike.w@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'Emily Davis',
            email: 'emily.davis@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'Alex Brown',
            email: 'alex.brown@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'Lisa Anderson',
            email: 'lisa.a@gmail.com',
            avatar: '',
            source: 'google',
          },
          {
            name: 'James Wilson',
            email: 'james.wilson@gmail.com',
            avatar: '',
            source: 'google',
          },
        ];

        console.log('✅ Google contacts loaded:', this.allContacts.length);
        console.log(
          '💡 Contacts ready - type to search or enter an email to invite'
        );

        // Don't auto-populate - keep list empty until user types
        this.displayedContacts = [];
      } catch (error) {
        console.error('Error loading Google contacts:', error);
      } finally {
        this.isLoadingContacts = false;
      }
    },

    async loadFacebookFriends() {
      // Load Facebook friends using Facebook Graph API
      console.log('Loading Facebook friends...');
      this.isLoadingContacts = true;

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        if (!window.FB) {
          console.warn('Facebook SDK not loaded, using demo data');
          // Load demo data as fallback
          this.allContacts = [
            {
              name: 'Jane Smith',
              email: 'jane.smith@facebook.com',
              avatar: '',
              source: 'facebook',
            },
            {
              name: 'John Doe',
              email: 'john.doe@facebook.com',
              avatar: '',
              source: 'facebook',
            },
            {
              name: 'Mike Williams',
              email: 'mike.w@facebook.com',
              avatar: '',
              source: 'facebook',
            },
            {
              name: 'Lisa Anderson',
              email: 'lisa.a@facebook.com',
              avatar: '',
              source: 'facebook',
            },
            {
              name: 'Sarah Johnson',
              email: 'sarah.j@facebook.com',
              avatar: '',
              source: 'facebook',
            },
            {
              name: 'Tom Martinez',
              email: 'tom.m@facebook.com',
              avatar: '',
              source: 'facebook',
            },
          ];
          console.log(
            '✅ Facebook demo contacts loaded:',
            this.allContacts.length
          );
          console.log(
            '💡 Contacts ready - type to search or enter an email to invite'
          );

          // Don't auto-populate - keep list empty until user types
          this.displayedContacts = [];
          this.isLoadingContacts = false;
          return;
        }

        // Request friends list from Facebook
        window.FB.api(
          '/me/friends',
          { fields: 'name,email,picture' },
          (response) => {
            if (response && !response.error) {
              this.allContacts = response.data.map((friend) => ({
                name: friend.name,
                email: friend.email || '',
                avatar: friend.picture?.data?.url || '',
                facebookId: friend.id,
                source: 'facebook',
              }));
              console.log(
                '✅ Facebook friends loaded:',
                this.allContacts.length
              );
            } else {
              console.error('Error loading Facebook friends:', response?.error);
              // Load demo data as fallback
              this.allContacts = [
                {
                  name: 'Jane Smith',
                  email: 'jane.smith@facebook.com',
                  avatar: '',
                  source: 'facebook',
                },
                {
                  name: 'Mike Williams',
                  email: 'mike.w@facebook.com',
                  avatar: '',
                  source: 'facebook',
                },
                {
                  name: 'Lisa Anderson',
                  email: 'lisa.a@facebook.com',
                  avatar: '',
                  source: 'facebook',
                },
              ];
              console.log(
                '✅ Facebook demo contacts loaded:',
                this.allContacts.length
              );
            }

            console.log(
              '💡 Contacts ready - type to search or enter an email to invite'
            );

            // Don't auto-populate - keep list empty until user types
            this.displayedContacts = [];
            this.isLoadingContacts = false;
          }
        );
      } catch (error) {
        console.error('Error loading Facebook friends:', error);
        this.isLoadingContacts = false;
      }
    },

    filterContacts() {
      console.log('🔍 === filterContacts called ===');
      console.log('🔍 Search query:', this.searchQuery);
      console.log('📇 Available contacts:', this.allContacts.length);
      console.log('📇 All contacts:', this.allContacts);

      // If no search query, keep list empty
      if (!this.searchQuery) {
        this.displayedContacts = [];
        console.log('📋 No query - list empty');
        return;
      }

      const query = this.searchQuery.toLowerCase().trim();
      console.log('🔍 Trimmed query:', query);

      // Filter contacts by name or email
      let filtered = this.allContacts.filter((contact) => {
        const nameMatch = contact.name.toLowerCase().includes(query);
        const emailMatch =
          contact.email && contact.email.toLowerCase().includes(query);
        console.log(
          `Checking ${contact.name}: name=${nameMatch}, email=${emailMatch}`
        );
        return nameMatch || emailMatch;
      });

      console.log('🎯 Filtered results before email check:', filtered.length);

      // Check if query is a valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidEmail = emailRegex.test(query);

      // If it's a valid email and not already in contacts, add it
      if (isValidEmail) {
        const emailExists = this.allContacts.some(
          (c) => c.email.toLowerCase() === query
        );

        if (!emailExists) {
          // Add the email as a new contact option
          filtered.push({
            name: query.split('@')[0],
            email: query,
            avatar: '',
            isNewEmail: true, // Flag to show it's not from contacts
          });
          console.log('✉️ Added email as invitable contact:', query);
        }
      }

      this.displayedContacts = filtered;

      console.log(
        '✅ Final displayed contacts:',
        this.displayedContacts.length
      );
      if (this.displayedContacts.length > 0) {
        console.log(
          '📋 Contacts shown:',
          this.displayedContacts.map((r) => r.name).join(', ')
        );
      } else {
        console.log('❌ No matches found for query:', query);
      }
    },

    clearSearch() {
      console.log('🧹 Clearing search');
      this.searchQuery = '';
      this.displayedContacts = []; // Keep list empty when cleared
    },

    async inviteFriend(friend) {
      console.log('Inviting friend:', friend);

      // Check if user exists in our system
      const userExists = await this.checkIfUserExists(friend.email);

      const invitation = {
        ...friend,
        invitedAt: new Date().toISOString(),
        userExists: userExists,
      };

      // Add to pending invitations
      this.pendingInvitations.push(invitation);

      // Save to localStorage
      const storageKey = `pending_invitations_${this.userEmail}`;
      localStorage.setItem(storageKey, JSON.stringify(this.pendingInvitations));

      // Send invitation email
      await this.sendInvitationEmail(friend, userExists);

      // Show success message
      if (userExists) {
        this.successMessage = `Friend request sent to ${friend.name}! They'll be notified on the site.`;
      } else {
        this.successMessage = `Invitation email sent to ${friend.name} to join Spoiler Alert!`;
      }
      this.showSuccessDialog = true;

      // Clear search
      this.searchQuery = '';
      this.searchResults = [];

      console.log('Friend invited successfully');
    },

    async checkIfUserExists(email) {
      // Check if user exists in Firebase
      // For now, check localStorage for demo purposes
      console.log('Checking if user exists:', email);

      // In production, this would query Firebase:
      // const userDoc = await db.collection('users').where('email', '==', email).get();
      // return !userDoc.empty;

      // Demo: randomly determine if user exists (for testing both flows)
      // In reality, this would be a real database lookup
      const demoExistingUsers = ['jane.smith@gmail.com', 'john.doe@gmail.com'];

      return demoExistingUsers.includes(email.toLowerCase());
    },

    async sendInvitationEmail(friend, userExists) {
      console.log('Sending invitation email to:', friend.email);

      const invitationData = {
        to: friend.email,
        from: this.userEmail,
        fromName:
          sessionStorage.getItem('userName') || this.userEmail.split('@')[0],
        toName: friend.name,
        invitationType: userExists ? 'friend_request' : 'site_invitation',
        siteUrl: window.location.origin,
      };

      console.log('📧 Email invitation data:', invitationData);

      // Real email sending is now enabled!
      try {
        // Call the Firebase Cloud Function (no auth token needed)
        const response = await this.$api.post(
          '/send-invitation-email',
          invitationData
        );

        if (response.data.success) {
          console.log('✅ Email sent successfully!', response.data.messageId);
          return true;
        } else {
          console.error('❌ Failed to send email:', response.data.error);
          return false;
        }
      } catch (error) {
        console.error('❌ Error calling email function:', error);
        if (error.response) {
          console.error('Error details:', error.response.data);
        }
        return false;
      }

      // In production, would also create a notification in Firestore:
      // await db.collection('notifications').add({
      //   userId: friendUserId,
      //   type: 'friend_request',
      //   from: currentUserId,
      //   createdAt: serverTimestamp(),
      //   read: false
      // });

      return true;
    },

    async inviteFriendByEmail() {
      if (!this.isValidEmail(this.friendEmail)) return;

      // Check if already friend or pending
      if (this.isFriend(this.friendEmail)) {
        alert('This person is already your friend!');
        return;
      }

      if (this.isPending(this.friendEmail)) {
        alert('You already sent an invitation to this email!');
        return;
      }

      const friend = {
        name: this.friendEmail.split('@')[0],
        email: this.friendEmail,
        avatar: '',
      };

      // Use the same invite flow as social contacts
      await this.inviteFriend(friend);

      // Clear input
      this.friendEmail = '';

      console.log('Friend invited by email:', friend);
    },

    isFriend(email) {
      return this.friends.some((f) => f.email === email);
    },

    isPending(email) {
      return this.pendingInvitations.some((i) => i.email === email);
    },

    isValidEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },

    confirmRemoveFriend(friend) {
      this.friendToRemove = friend;
      this.showRemoveDialog = true;
    },

    async removeFriend() {
      if (!this.friendToRemove) return;

      try {
        // Remove friendship via API (removes both directions)
        const response = await this.$api.post('/remove-friend', {
          userEmail: this.userEmail,
          friendEmail: this.friendToRemove.email,
        });

        if (response.data.success) {
          console.log(
            '✅ Friend removed from both sides:',
            this.friendToRemove.email
          );

          // Update local friends list immediately
          this.friends = this.friends.filter(
            (f) => f.email !== this.friendToRemove.email
          );

          // Also reload from API to ensure sync
          await this.loadFriends();
        } else {
          console.error('❌ Failed to remove friend');
          alert('Failed to remove friend. Please try again.');
        }
      } catch (error) {
        console.error('❌ Error removing friend:', error);
        alert('Failed to remove friend. Please try again.');
      }

      this.friendToRemove = null;
    },

    cancelInvitation(invite) {
      // Remove from pending
      this.pendingInvitations = this.pendingInvitations.filter(
        (i) => i.email !== invite.email
      );

      // Save to localStorage
      const storageKey = `pending_invitations_${this.userEmail}`;
      localStorage.setItem(storageKey, JSON.stringify(this.pendingInvitations));

      console.log('Invitation cancelled:', invite);
    },

    formatDate(isoDate) {
      if (!isoDate) return 'Recently';

      // Handle Firebase Timestamp objects
      let dateValue;
      if (isoDate._seconds) {
        // Firebase Timestamp format
        dateValue = new Date(isoDate._seconds * 1000);
      } else if (isoDate.seconds) {
        // Another Firebase Timestamp format
        dateValue = new Date(isoDate.seconds * 1000);
      } else {
        // Regular date string or timestamp
        dateValue = new Date(isoDate);
      }

      // Check if date is valid
      if (isNaN(dateValue.getTime())) {
        return 'Recently';
      }

      return dateValue.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    },

    messageAlertNotImplemented() {
      alert('Messaging feature coming soon!');
    },

    async loadMyShows() {
      // Load user's own shows for comparison
      try {
        const response = await this.$api.get(`/user-shows/${this.userEmail}`);
        if (response.data.shows) {
          this.myShows = response.data.shows;
          console.log(`✅ Loaded ${this.myShows.length} of my shows`);
        }
      } catch (error) {
        console.error('Error loading my shows:', error);
        // Fallback to localStorage
        const storageKey = `myShows_${this.userEmail}`;
        this.myShows = JSON.parse(localStorage.getItem(storageKey) || '[]');
      }
    },

    async viewFriendShows(friend) {
      console.log('Viewing shows for friend:', friend);

      // Navigate to MyShows page - all friends' shows are shown automatically
      this.$router.push('/my-shows');
    },

    isSharedShow(showId) {
      // Check if this show is in both user's and friend's lists
      return this.myShows.some((show) => show.id === showId);
    },

    goToShow(show) {
      // Navigate to the show discussion page
      sessionStorage.setItem('show_id', show.id);
      sessionStorage.setItem('show_name', show.name);
      sessionStorage.setItem('show_year', show.year);
      sessionStorage.setItem('show_image_url', show.image_url || '');
      sessionStorage.setItem('show_thumbnail', show.thumbnail || '');
      sessionStorage.setItem('show_overview', show.overview || '');

      this.$router.push('/show/' + show.id);
    },

    async acceptFriendRequest(request) {
      console.log('Accepting friend request from:', request.name);

      try {
        const response = await this.$api.post('/accept-friend-request', {
          invitationToken: request.id,
          userEmail: this.userEmail,
        });

        if (response.data.success) {
          console.log('✅ Friend request accepted!', response.data.friend);

          // Show success message
          this.successMessage = `You're now friends with ${request.name}!`;
          this.showSuccessDialog = true;

          // Reload friends and incoming requests
          await this.loadFriends();
          await this.loadIncomingRequests();
        } else {
          console.error('❌ Failed to accept friend request');
          alert('Failed to accept friend request. Please try again.');
        }
      } catch (error) {
        console.error('❌ Error accepting friend request:', error);
        alert('Failed to accept friend request. Please try again.');
      }
    },

    async declineFriendRequest(request) {
      console.log('Declining friend request from:', request.name);

      try {
        // Update the request status to declined in Firebase
        const response = await this.$api.post('/decline-friend-request', {
          invitationToken: request.id,
          userEmail: this.userEmail,
        });

        if (response.data.success) {
          console.log('✅ Friend request declined');

          // Reload incoming requests
          await this.loadIncomingRequests();
        } else {
          console.error('❌ Failed to decline friend request');
          alert('Failed to decline friend request. Please try again.');
        }
      } catch (error) {
        console.error('❌ Error declining friend request:', error);
        alert('Failed to decline friend request. Please try again.');
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.cursor-pointer {
  cursor: pointer;
}

.friend-list-item {
  .friend-info-section {
    flex: 1 1 auto;
    min-width: 0; // Important for ellipsis to work
    padding-right: 8px;

    .q-item__label--caption {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .friend-actions-section {
    flex: 0 0 auto;
  }
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .friend-list-item {
    padding: 12px 8px;

    .friend-info-section {
      max-width: calc(100vw - 200px); // Reserve space for avatar + buttons

      .q-item__label--caption {
        font-size: 11px;
        max-width: 100%;
      }
    }

    .friend-actions-section {
      .row {
        gap: 2px !important;
      }

      .q-btn {
        min-width: 32px;
        padding: 4px;
      }
    }
  }
}

// Tablet adjustments
@media (min-width: 600px) and (max-width: 1023px) {
  .friend-list-item {
    .friend-info-section {
      max-width: calc(100vw - 300px);
    }
  }
}
</style>
