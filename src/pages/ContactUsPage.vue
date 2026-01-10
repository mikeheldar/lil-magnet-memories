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

      <div class="row q-col-gutter-lg">
        <!-- Contact Information -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="email" class="q-mr-sm" />
                Get in Touch
              </div>
              <div class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">Email:</div>
                <div class="text-body1">
                  <a href="mailto:info@lilmagnetmemories.com" class="text-primary">
                    info@lilmagnetmemories.com
                  </a>
                </div>
              </div>
              <div class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">Phone:</div>
                <div class="text-body1">
                  <a href="tel:+1234567890" class="text-primary">
                    (123) 456-7890
                  </a>
                </div>
              </div>
              <div class="q-mb-md">
                <div class="text-weight-medium q-mb-xs">Business Hours:</div>
                <div class="text-body1">
                  Monday - Friday: 9:00 AM - 5:00 PM<br />
                  Saturday: 10:00 AM - 2:00 PM<br />
                  Sunday: Closed
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Contact Form -->
        <div class="col-12 col-md-6">
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
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const submitting = ref(false);
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

const onSubmit = async () => {
  submitting.value = true;
  try {
    // TODO: Implement email sending functionality
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
    
    $q.notify({
      type: 'positive',
      message: 'Message sent successfully!',
      caption: 'We\'ll get back to you soon.',
      position: 'top',
    });
    
    // Reset form
    form.value = {
      name: '',
      email: '',
      subject: '',
      message: '',
    };
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to send message',
      caption: 'Please try again later.',
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
