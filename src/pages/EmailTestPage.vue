<template>
  <q-page class="q-pa-md">
    <div class="text-center q-mb-lg">
      <div class="text-h4 text-weight-bold text-primary q-mb-sm">
        Email Test Page
      </div>
      <div class="text-subtitle1 text-grey-7">
        Test email functionality (Admin Only)
      </div>
    </div>

    <!-- Email Test Form -->
    <q-card class="q-pa-lg">
      <q-card-section>
        <div class="text-h6 text-weight-medium q-mb-md text-center">
          <q-icon name="email" size="32px" class="q-mr-sm text-primary" />
          Send Test Email
        </div>

        <q-form @submit="onSubmit" class="q-gutter-md">
          <!-- Destination Email -->
          <div class="text-h6 text-weight-medium q-mb-sm text-primary">
            <q-icon name="person" class="q-mr-sm" />
            Email Details
          </div>

          <q-input
            v-model="emailData.destinationEmail"
            label="Destination Email *"
            filled
            type="email"
            :rules="[
              (val) => !!val || 'Email is required',
              (val) =>
                isValidEmail(val) || 'Please enter a valid email address',
            ]"
            hint="Enter the email address to send the test email to"
          />

          <q-input
            v-model="emailData.subject"
            label="Subject"
            filled
            hint="Optional subject line for the test email"
          />

          <q-input
            v-model="emailData.message"
            label="Message"
            filled
            type="textarea"
            rows="4"
            hint="Optional message content for the test email"
          />

          <!-- Submit Button -->
          <div class="text-center q-mt-lg">
            <q-btn
              type="submit"
              color="primary"
              size="lg"
              class="q-px-xl q-py-md"
              :loading="submitting"
              :disable="!canSubmit"
            >
              <q-icon name="send" class="q-mr-sm" />
              {{ submitting ? 'Sending...' : 'Send Test Email' }}
            </q-btn>
          </div>
        </q-form>
      </q-card-section>
    </q-card>

    <!-- Admin Notice -->
    <q-card class="q-pa-md q-mt-md bg-blue-1">
      <q-card-section class="text-center">
        <q-icon
          name="admin_panel_settings"
          color="primary"
          size="24px"
          class="q-mb-sm"
        />
        <div class="text-body2 text-primary">
          This page is only accessible to admin users
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';

export default {
  name: 'EmailTestPage',
  setup() {
    const $q = useQuasar();

    const emailData = ref({
      destinationEmail: '',
      subject: 'Test Email from Lil Magnet Memories',
      message: 'This is a test email from the Lil Magnet Memories admin panel.',
    });

    const submitting = ref(false);

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const canSubmit = computed(() => {
      return (
        emailData.value.destinationEmail &&
        isValidEmail(emailData.value.destinationEmail) &&
        !submitting.value
      );
    });

    const onSubmit = async () => {
      if (!canSubmit.value) return;

      submitting.value = true;

      try {
        console.log('Sending test email:', emailData.value);

        // Call Firebase Cloud Function to send email
        const response = await fetch(
          'https://us-central1-lil-magnet-memories.cloudfunctions.net/api/send-order-email',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstName: 'Test',
              lastName: 'User',
              email: emailData.value.destinationEmail,
              phone: '',
              specialInstructions: emailData.value.message,
              photos: [],
              quantities: [],
              orderNumber: `TEST-${Date.now()}`,
              totalMagnets: 0,
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
        console.log('Email sent successfully:', result);

        // Try to show success notification
        try {
          if ($q && $q.notify) {
            $q.notify({
              type: 'positive',
              message: 'Test email sent successfully!',
              caption: `Message ID: ${result.messageId}`,
              position: 'top',
            });
          }
        } catch (notifyError) {
          console.error('Failed to show success notification:', notifyError);
        }

        // Clear the form
        emailData.value.destinationEmail = '';
        emailData.value.subject = 'Test Email from Lil Magnet Memories';
        emailData.value.message =
          'This is a test email from the Lil Magnet Memories admin panel.';
      } catch (error) {
        console.error('Email test error:', error);
        // Use console.error as fallback notification
        console.error(
          'Email test failed:',
          error.message || 'An error occurred'
        );

        // Try to show notification, but don't fail if it doesn't work
        try {
          if ($q && $q.notify) {
            $q.notify({
              type: 'negative',
              message: 'Email test failed',
              caption: error.message || 'An error occurred',
              position: 'top',
            });
          }
        } catch (notifyError) {
          console.error('Failed to show error notification:', notifyError);
        }
      } finally {
        submitting.value = false;
      }
    };

    return {
      emailData,
      submitting,
      canSubmit,
      isValidEmail,
      onSubmit,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.q-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .q-card {
    margin: 0 10px;
  }
}
</style>
