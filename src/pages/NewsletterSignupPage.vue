<template>
  <q-page padding class="newsletter-signup-page">
    <div class="newsletter-container">
      <div class="text-center q-mb-lg">
        <q-icon name="email" size="64px" color="primary" class="q-mb-md" />
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Subscribe to Our Newsletter
        </div>
        <div class="text-body1 text-grey-7 q-mx-auto" style="max-width: 600px">
          Get the latest info on events and new cool things Li'l Magnet Memories is doing!
        </div>
      </div>

      <div class="row justify-center">
        <div class="col-12 col-md-8 col-lg-6">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="mail" class="q-mr-sm" />
                Sign Up for Updates
              </div>
              <q-form @submit="onSubmit" class="q-gutter-md">
                <q-input
                  v-model="form.email"
                  label="Your Email"
                  type="email"
                  filled
                  :rules="[
                    (val) => !!val || 'Email is required',
                    (val) => isValidEmail(val) || 'Please enter a valid email',
                  ]"
                />
                <q-btn
                  type="submit"
                  color="primary"
                  label="Subscribe"
                  class="full-width"
                  :loading="submitting"
                  size="lg"
                />
              </q-form>
            </q-card-section>
          </q-card>

          <div class="text-center q-mt-lg">
            <div class="text-body2 text-grey-6">
              By subscribing, you'll receive updates about:
            </div>
            <div class="q-mt-sm q-gutter-sm">
              <q-chip icon="event" color="primary" text-color="white">
                Upcoming Events
              </q-chip>
              <q-chip icon="new_releases" color="secondary" text-color="white">
                New Products
              </q-chip>
              <q-chip icon="local_offer" color="accent" text-color="white">
                Special Offers
              </q-chip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { authService } from '../services/authService';

const $q = useQuasar();
const submitting = ref(false);
const form = ref({
  email: '',
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Pre-populate email if user is authenticated
onMounted(() => {
  const currentUser = authService.getCurrentUser();
  if (currentUser && currentUser.email) {
    form.value.email = currentUser.email;
  }
});

const onSubmit = async () => {
  submitting.value = true;
  try {
    // TODO: Implement newsletter subscription functionality
    // This could integrate with an email service like Mailchimp, SendGrid, etc.
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    $q.notify({
      type: 'positive',
      message: 'Successfully subscribed!',
      caption: `You'll receive updates at ${form.value.email}`,
      position: 'top',
      timeout: 5000,
    });

    // Reset form after successful submission
    // Don't reset if user is authenticated (keep their email)
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.email) {
      form.value.email = '';
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    $q.notify({
      type: 'negative',
      message: 'Subscription failed',
      caption: 'Please try again later',
      position: 'top',
      timeout: 5000,
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.newsletter-signup-page {
  min-height: calc(100vh - 100px);
}

.newsletter-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
