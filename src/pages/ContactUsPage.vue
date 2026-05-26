<template>
  <q-page class="contact-us-page">
    <div class="q-pa-md">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Contact Us
        </div>
        <div class="text-body1 text-grey-7">
          We'd love to hear from you! Get in touch with us.
        </div>
      </div>

      <div class="row justify-center">
        <!-- Success State -->
        <div v-if="success" class="col-12 col-md-8 col-lg-6">
          <q-card>
            <q-card-section class="text-center q-pa-xl">
              <q-icon name="check_circle" color="positive" size="64px" class="q-mb-md" />
              <div class="text-h5 text-weight-bold text-primary q-mb-sm">
                Message Sent Successfully!
              </div>
              <div class="text-body1 text-grey-7 q-mb-lg">
                Thank you for contacting us. We'll get back to you soon.
              </div>
              <q-btn
                color="primary"
                label="Contact Again"
                @click="resetForm"
                class="q-mt-md"
              />
            </q-card-section>
          </q-card>
        </div>

        <!-- Contact Form -->
        <div v-else class="col-12 col-md-8 col-lg-6">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="send" class="q-mr-sm" />
                Send us a Message
              </div>
              <q-form @submit="onSubmit" class="q-gutter-md">
                <q-input
                  v-model="form.name"
                  label="Your Name"
                  filled
                  :rules="[(val) => !!val || 'Name is required']"
                />
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
                <q-input
                  v-model="form.subject"
                  label="Subject"
                  filled
                  :rules="[(val) => !!val || 'Subject is required']"
                />
                <q-input
                  v-model="form.message"
                  label="Message"
                  type="textarea"
                  filled
                  rows="5"
                  :rules="[(val) => !!val || 'Message is required']"
                />
                <q-btn
                  type="submit"
                  color="primary"
                  label="Send Message"
                  class="full-width"
                  :loading="submitting"
                />
              </q-form>
            </q-card-section>
          </q-card>

          <!-- Contact Email -->
          <div class="text-center q-mt-lg">
            <div class="text-body1 text-grey-7 q-mb-sm">or contact us at</div>
            <div class="text-body1">
              <a href="mailto:info@lilmagnetmemories.com" class="text-primary">
                info@lilmagnetmemories.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { config } from '../config/environment.js';
import { useSiteSeo } from '../composables/useSiteSeo.js';

const $q = useQuasar();
const route = useRoute();

useSiteSeo(() => ({
  title: 'Contact Us - Lil Magnet Memories',
  description:
    "Get in touch with Lil Magnet Memories. We'd love to hear from you! Email us at info@lilmagnetmemories.com or send us a message.",
  keywords: 'contact lil magnet memories, customer support, email, message',
  path: route.path,
  image: '/assets/lil-magnet-memories-logo.png',
}));
const submitting = ref(false);
const success = ref(false);
const form = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
});

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const resetForm = () => {
  success.value = false;
  form.value = {
    name: '',
    email: '',
    subject: '',
    message: '',
  };
};

const onSubmit = async () => {
  submitting.value = true;
  try {
    const response = await fetch(
      `${config.paymentsAndEmailApiBaseUrl}/send-contact-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.value.name,
          email: form.value.email,
          subject: form.value.subject,
          message: form.value.message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || `HTTP error! status: ${response.status}`;
      const errorDetails = errorData.details || '';
      throw new Error(
        `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`
      );
    }

    const result = await response.json();
    console.log('Contact email sent successfully:', result);
    
    // Show success state
    success.value = true;
  } catch (error) {
    console.error('Error sending contact email:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to send message',
      caption: error.message || 'Please try again later.',
      position: 'top',
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.contact-us-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
