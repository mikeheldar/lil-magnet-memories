<template>
  <q-page class="landing-page">
    <!-- Hero Section with Big Magnet Images -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <img
            src="/assets/lil-magnet-memories-logo.png"
            alt="Lil Magnet Memories"
            class="hero-logo"
          />
          <h1 class="hero-title">Turn Your Memories Into Beautiful Magnets</h1>
          <p class="hero-subtitle">
            Create custom photo magnets from your favorite moments. High-quality, personalized magnets for your fridge, office, or anywhere you want to display your memories.
          </p>
          
          <div class="hero-actions">
            <q-btn
              @click="$router.push('/upload')"
              color="primary"
              size="xl"
              class="cta-button"
              rounded
            >
              <q-icon name="camera_alt" size="24px" class="q-mr-sm" />
              Start Creating Magnets
            </q-btn>
            
            <div class="text-caption text-grey-6 q-mt-md">
              No sign-in required • Upload photos and specify quantities
            </div>
          </div>
        </div>
        
        <div class="hero-images">
          <div class="magnet-grid">
            <div class="magnet-item magnet-1">
              <img src="/statics/cheers.jpg" alt="Celebration magnet" class="magnet-image" />
              <div class="magnet-overlay">
                <q-icon name="favorite" color="red" size="24px" />
              </div>
            </div>
            <div class="magnet-item magnet-2">
              <img src="/statics/fantasy.jpg" alt="Fantasy magnet" class="magnet-image" />
              <div class="magnet-overlay">
                <q-icon name="star" color="gold" size="24px" />
              </div>
            </div>
            <div class="magnet-item magnet-3">
              <img src="/statics/mountains.png" alt="Nature magnet" class="magnet-image" />
              <div class="magnet-overlay">
                <q-icon name="landscape" color="green" size="24px" />
              </div>
            </div>
            <div class="magnet-item magnet-4">
              <img src="/statics/tv_kids.jpg" alt="Family magnet" class="magnet-image" />
              <div class="magnet-overlay">
                <q-icon name="family_restroom" color="blue" size="24px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Photos Section - Most Prominent -->
    <div class="upload-section">
      <q-card class="upload-card">
        <q-card-section class="text-center">
          <div class="text-h4 q-mb-sm text-primary">
            <q-icon name="camera_alt" size="32px" class="q-mr-sm" />
            Upload Your Photos
          </div>
          <div class="text-body1 q-mb-md text-grey-7">
            Get started right away - no sign-in required!
          </div>

          <q-btn
            @click="$router.push('/upload')"
            color="primary"
            size="lg"
            class="upload-btn q-px-xl q-py-md"
          >
            <q-icon name="camera_alt" size="20px" class="q-mr-sm" />
            Upload Photos Now
          </q-btn>

          <div class="text-caption text-grey-6 q-mt-sm">
            Upload photos and specify magnet quantities
          </div>
        </q-card-section>
      </q-card>
    </div>

      <!-- Sign In Section -->
      <div class="signin-section">
        <q-card class="signin-card">
          <q-card-section class="text-center">
            <div class="text-h5 q-mb-md text-primary">
              <q-icon name="login" size="28px" class="q-mr-sm" />
              Log In
            </div>
            <div class="text-body1 q-mb-lg text-grey-7">
              Sign in to access your orders and dashboard
            </div>

            <!-- Only show sign-in button if user is not authenticated -->
            <div v-if="!isAuthenticated">
              <q-btn
                @click="handleGoogleSignIn"
                color="secondary"
                size="lg"
                class="q-px-xl q-py-md"
                :loading="signingIn"
                :disable="signingIn"
              >
                <q-icon name="login" class="q-mr-sm" />
                {{ signingIn ? 'Signing in...' : 'Sign in with Google' }}
              </q-btn>

              <!-- Help text for popup blockers -->
              <div class="text-caption text-grey-6 q-mt-sm text-center">
                <q-icon name="info" size="14px" class="q-mr-xs" />
                If sign-in hangs, check that popups are allowed for this site
              </div>
            </div>

            <!-- Show authenticated user message with appropriate links -->
            <div v-else class="text-center">
              <q-icon
                name="check_circle"
                color="positive"
                size="32px"
                class="q-mb-sm"
              />
              <div class="text-h6 text-positive q-mb-sm">Welcome back!</div>
              <div class="text-body2 text-grey-7 q-mb-md">
                You're signed in and can access your dashboard
              </div>

              <!-- Show different links based on admin status -->
              <div class="q-gutter-sm">
                <!-- Admin users see Orders List -->
                <q-btn
                  v-if="isAdmin"
                  color="primary"
                  size="md"
                  class="q-px-lg q-py-sm"
                  @click="goToOrdersList"
                >
                  <q-icon name="list_alt" class="q-mr-sm" />
                  Orders List
                </q-btn>

                <!-- Regular users see My Orders -->
                <q-btn
                  v-else
                  color="purple"
                  size="lg"
                  class="q-px-xl q-py-md"
                  @click="goToMyOrders"
                >
                  <q-icon name="list_alt" class="q-mr-sm" />
                  My Orders
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Features Section -->
      <div class="features-section">
        <div class="text-h6 text-center q-mb-lg text-primary">
          What we offer
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card class="feature-card">
              <q-card-section class="text-center">
                <q-icon
                  name="camera_alt"
                  size="48px"
                  class="text-primary q-mb-md"
                />
                <div class="text-h6 q-mb-sm">Photo Upload</div>
                <div class="text-body2 text-grey-7">
                  Upload your favorite photos and specify how many magnets you
                  want for each
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card class="feature-card">
              <q-card-section class="text-center">
                <q-icon name="style" size="48px" class="text-primary q-mb-md" />
                <div class="text-h6 q-mb-sm">Custom Magnets</div>
                <div class="text-body2 text-grey-7">
                  High-quality custom magnets made from your photos
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card class="feature-card">
              <q-card-section class="text-center">
                <q-icon
                  name="local_shipping"
                  size="48px"
                  class="text-primary q-mb-md"
                />
                <div class="text-h6 q-mb-sm">Fast Delivery</div>
                <div class="text-body2 text-grey-7">
                  Quick turnaround and shipping for your custom magnets
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '../services/authService';
import { useQuasar } from 'quasar';

export default {
  name: 'LandingPage',
  setup() {
    const router = useRouter();
    const $q = useQuasar();
    const signingIn = ref(false);
    const isAuthenticated = ref(false);
    const isAdmin = ref(false);

    const handleGoogleSignIn = async () => {
      signingIn.value = true;

      // Add timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        if (signingIn.value) {
          console.log('Sign-in timeout, resetting state');
          signingIn.value = false;
          $q.notify({
            type: 'negative',
            message: 'Sign-in timed out',
            caption:
              'The popup may have been blocked. Please check your browser settings.',
            position: 'top',
            timeout: 8000,
            actions: [
              {
                label: 'Try Again',
                color: 'white',
                handler: () => handleGoogleSignIn(),
              },
            ],
          });
        }
      }, 15000); // 15 second timeout

      try {
        console.log('Starting Google sign-in from landing page...');
        await authService.signInWithGoogle();

        $q.notify({
          type: 'positive',
          message: 'Successfully signed in!',
          caption: 'You can now access your orders and dashboard.',
          position: 'top',
        });

        // Redirect to orders page after successful sign-in
        router.push('/orders');
      } catch (error) {
        console.error('Sign in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific error cases with better guidance
        let errorMessage = 'Failed to sign in. Please try again.';
        let caption = '';

        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in was cancelled';
          caption = 'Please complete the sign-in process in the popup window.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Sign-in popup was blocked';
          caption = 'Please allow popups for this site and try again.';
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = 'Domain not authorized';
          caption = 'This domain is not authorized for Google sign-in.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Google sign-in not enabled';
          caption = 'Google sign-in is not enabled for this project.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error';
          caption = 'Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Sign-in timed out';
          caption = 'The sign-in process took too long. Please try again.';
        }

        $q.notify({
          type: 'negative',
          message: errorMessage,
          caption: caption,
          position: 'top',
          timeout: 8000,
          actions: [
            {
              label: 'Try Again',
              color: 'white',
              handler: () => handleGoogleSignIn(),
            },
          ],
        });
      } finally {
        console.log('Resetting signingIn state');
        clearTimeout(timeoutId);
        signingIn.value = false;
      }
    };

    // Navigation functions
    const goToOrdersList = () => {
      router.push('/orders');
    };

    const goToMyOrders = () => {
      router.push('/my-orders');
    };

    // Check if user is already authenticated
    onMounted(() => {
      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser) {
        console.log(
          'User already authenticated on landing page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
        isAdmin.value = authService.isAdmin();
      }

      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        isAuthenticated.value = !!user;
        isAdmin.value = authService.isAdmin();
        if (user) {
          console.log('User is already signed in:', user.email);
          console.log('Is admin:', isAdmin.value);
          // Don't auto-redirect - let user choose where to go
        }
      });
    });

    return {
      signingIn,
      isAuthenticated,
      isAdmin,
      handleGoogleSignIn,
      goToOrdersList,
      goToMyOrders,
    };
  },
};
</script>

<style lang="scss" scoped>
.landing-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  z-index: 2;
}

.hero-text {
  color: white;
}

.hero-logo {
  max-width: 300px;
  width: 100%;
  height: auto;
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 1.5rem 0;
  line-height: 1.1;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.3rem;
  line-height: 1.6;
  margin: 0 0 2.5rem 0;
  opacity: 0.95;
  font-weight: 300;
}

.hero-actions {
  .cta-button {
    font-size: 1.3rem;
    font-weight: 600;
    padding: 16px 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
    }
  }
}

.hero-images {
  display: flex;
  justify-content: center;
  align-items: center;
}

.magnet-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  max-width: 400px;
}

.magnet-item {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.4s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-8px) scale(1.05);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }
  
  &.magnet-1 {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
  }
  
  &.magnet-2 {
    grid-row: 1 / 2;
    grid-column: 2 / 3;
  }
  
  &.magnet-3 {
    grid-row: 2 / 3;
    grid-column: 1 / 2;
  }
  
  &.magnet-4 {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
  }
}

.magnet-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.magnet-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.upload-section {
  padding: 80px 20px;
  background: white;
  margin-bottom: 0;
}

.upload-card {
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.15);
  }
}

.upload-btn {
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(102, 126, 234, 0.4);
  }
}

.signin-section {
  padding: 60px 20px;
  background: #f8f9ff;
  margin-bottom: 0;
}

.signin-card {
  max-width: 500px;
  margin: 0 auto;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  border: none;
}

.features-section {
  padding: 80px 20px;
  background: white;
  
  .feature-card {
    height: 100%;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border-radius: 16px;
    border: none;

    &:hover {
      transform: translateY(-8px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
    }
  }
}

// Mobile responsive adjustments
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.1rem;
  }
  
  .magnet-grid {
    max-width: 300px;
    gap: 15px;
  }
  
  .magnet-image {
    height: 150px;
  }
}

@media (max-width: 599px) {
  .hero-section {
    padding: 20px 15px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-logo {
    max-width: 250px;
    margin-bottom: 1rem;
  }
  
  .upload-section,
  .signin-section,
  .features-section {
    padding: 40px 15px;
  }
  
  .magnet-grid {
    max-width: 280px;
    gap: 12px;
  }
  
  .magnet-image {
    height: 120px;
  }
  
  .magnet-overlay {
    width: 40px;
    height: 40px;
    top: 8px;
    right: 8px;
  }
}
</style>
