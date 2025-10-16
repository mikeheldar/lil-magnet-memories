<template>
  <q-page class="row justify-center">
    <div class="col-12 col-md-8 col-lg-6 q-pa-md">
      <!-- Header -->
      <div class="text-center q-mb-lg">
        <div class="text-h3 text-weight-bold text-primary q-mb-sm">
          Lil Magnet Memories
        </div>
        <div class="text-h6 text-grey-7">
          Upload your photos to create custom magnets!
        </div>
      </div>

      <!-- Upload Form Card -->
      <q-card class="q-pa-lg">
        <q-card-section>
          <div class="text-h5 text-weight-medium q-mb-md text-center">
            <q-icon name="camera_alt" size="32px" class="q-mr-sm text-primary" />
            Photo Upload Form
          </div>

          <q-form @submit="onSubmit" class="q-gutter-md">
            <!-- Customer Information -->
            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="person" class="q-mr-sm" />
              Your Information
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.firstName"
                  label="First Name *"
                  filled
                  :rules="[val => !!val || 'First name is required']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.lastName"
                  label="Last Name *"
                  filled
                  :rules="[val => !!val || 'Last name is required']"
                />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.email"
                  label="Email Address *"
                  type="email"
                  filled
                  :rules="[val => !!val || 'Email is required', val => isValidEmail(val) || 'Please enter a valid email']"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  v-model="formData.phone"
                  label="Phone Number"
                  filled
                  mask="(###) ###-####"
                />
              </div>
            </div>

            <!-- Photo Upload Section -->
            <q-separator class="q-my-md" />

            <div class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="photo_library" class="q-mr-sm" />
              Your Photos
            </div>

            <div class="text-body2 text-grey-7 q-mb-md">
              Upload your photos below. You can select multiple photos at once.
              We'll turn them into beautiful custom magnets!
            </div>

            <!-- File Upload -->
            <q-file
              v-model="selectedFiles"
              label="Choose Photos"
              filled
              multiple
              accept="image/*"
              @rejected="onRejected"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>

            <!-- Selected Files Preview -->
            <div v-if="selectedFiles && selectedFiles.length > 0" class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm">Selected Photos ({{ selectedFiles.length }}):</div>
              <div class="row q-col-gutter-sm">
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="col-6 col-md-4 col-lg-3"
                >
                  <q-img
                    :src="getFilePreview(file)"
                    style="height: 100px"
                    class="rounded-borders"
                  />
                  <div class="text-caption text-center q-mt-xs">
                    {{ file.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Special Instructions -->
            <q-input
              v-model="formData.specialInstructions"
              label="Special Instructions (Optional)"
              type="textarea"
              filled
              rows="3"
              placeholder="Any special requests for your magnets? Size preferences, color adjustments, etc."
            />

            <!-- Submit Button -->
            <div class="text-center q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                size="lg"
                :loading="submitting"
                :disable="!canSubmit"
                class="q-px-xl"
              >
                <q-icon name="send" class="q-mr-sm" />
                Submit Photos for Magnet Creation
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Information Card -->
      <q-card class="q-mt-md q-pa-md bg-grey-1">
        <q-card-section>
          <div class="text-h6 text-weight-medium q-mb-sm text-primary">
            <q-icon name="info" class="q-mr-sm" />
            What Happens Next?
          </div>
          <q-list dense>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>We'll review your photos and contact you within 24 hours</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>We'll provide a quote and timeline for your custom magnets</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Once approved, we'll create your beautiful custom magnets!</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { emailService } from '../services/emailService.js';

export default {
  name: 'UploadPage',
  setup() {
    const $q = useQuasar();

    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialInstructions: ''
    });

    const selectedFiles = ref([]);
    const submitting = ref(false);

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const canSubmit = computed(() => {
      return formData.value.firstName &&
             formData.value.lastName &&
             formData.value.email &&
             isValidEmail(formData.value.email) &&
             selectedFiles.value &&
             selectedFiles.value.length > 0;
    });

    const getFilePreview = (file) => {
      return URL.createObjectURL(file);
    };

    const onRejected = () => {
      $q.notify({
        type: 'negative',
        message: 'Some files were rejected. Please make sure they are image files.',
        caption: 'Accepted formats: JPG, PNG, GIF, WebP'
      });
    };

    const onSubmit = async () => {
      submitting.value = true;

      try {
        // Prepare customer data
        const customerData = {
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          email: formData.value.email,
          phone: formData.value.phone,
          specialInstructions: formData.value.specialInstructions,
          photos: selectedFiles.value
        };

        // Send email via EmailJS
        const emailSent = await emailService.sendCustomerSubmission(customerData);

        if (emailSent) {
          $q.notify({
            type: 'positive',
            message: 'Photos submitted successfully!',
            caption: 'We\'ll contact you within 24 hours with next steps.',
            position: 'top'
          });

          // Reset form
          formData.value = {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            specialInstructions: ''
          };
          selectedFiles.value = [];
        } else {
          throw new Error('Email service failed');
        }

      } catch (error) {
        console.error('Upload error:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to submit photos',
          caption: 'Please try again or contact us directly.',
          position: 'top'
        });
      } finally {
        submitting.value = false;
      }
    };

    return {
      formData,
      selectedFiles,
      submitting,
      canSubmit,
      isValidEmail,
      getFilePreview,
      onRejected,
      onSubmit
    };
  }
};
</script>

<style lang="scss" scoped>
.q-page {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .text-h3 {
    font-size: 1.8rem;
  }

  .text-h5 {
    font-size: 1.3rem;
  }

  .q-btn {
    font-size: 14px;
  }
}
</style>
