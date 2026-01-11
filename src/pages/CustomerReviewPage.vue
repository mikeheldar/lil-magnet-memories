<template>
  <q-page class="customer-review-page q-pa-lg">
    <div class="page-container">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          <q-icon name="rate_review" size="32px" class="q-mr-sm" />
          Leave Your Review
        </div>
        <div class="text-body1 text-grey-7">
          We'd love to hear about your experience with Li'l Magnet Memories!
        </div>
      </div>

      <q-card class="review-form-card">
        <q-card-section>
          <q-form @submit="handleSubmitReview">
            <div class="q-mb-md">
              <q-input
                v-model="reviewForm.customerName"
                label="Your Name *"
                filled
                :rules="[(val) => !!val || 'Name is required']"
                hint="This will be displayed with your review"
              />
            </div>

            <div class="q-mb-md">
              <q-input
                v-model="reviewForm.email"
                label="Your Email *"
                type="email"
                filled
                :rules="[
                  (val) => !!val || 'Email is required',
                  (val) => /.+@.+\..+/.test(val) || 'Please enter a valid email',
                ]"
                hint="We'll use this to verify your review (not displayed publicly)"
              />
            </div>

            <div class="q-mb-md">
              <div class="text-body2 q-mb-sm">Your Rating *</div>
              <q-rating
                v-model="reviewForm.rating"
                :max="5"
                size="40px"
                color="primary"
                class="star-rating"
              />
            </div>

            <div class="q-mb-md">
              <q-input
                v-model="reviewForm.reviewText"
                label="Your Review *"
                filled
                type="textarea"
                rows="6"
                :rules="[(val) => !!val || 'Review text is required']"
                hint="Share your experience with our products and service"
              />
            </div>

            <div class="q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                size="lg"
                label="Submit Review"
                icon="send"
                :loading="submitting"
                class="full-width"
              />
            </div>

            <div class="text-caption text-grey-6 q-mt-md text-center">
              Your review will be submitted for verification before being published.
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';

const router = useRouter();
const $q = useQuasar();

const submitting = ref(false);
const reviewForm = ref({
  customerName: '',
  email: '',
  rating: 5,
  reviewText: '',
});

const handleSubmitReview = async () => {
  submitting.value = true;
  try {
    // Submit review with isVerified: false
    await firebaseService.addReview({
      customerName: reviewForm.value.customerName,
      reviewText: reviewForm.value.reviewText,
      rating: reviewForm.value.rating,
      email: reviewForm.value.email, // Store email for verification purposes
      isVerified: false, // Reviews from customers start as unverified
    });

    $q.notify({
      type: 'positive',
      message: 'Review submitted successfully!',
      caption: 'Your review will be verified and published soon.',
      position: 'top',
      timeout: 5000,
    });

    // Reset form
    reviewForm.value = {
      customerName: '',
      email: '',
      rating: 5,
      reviewText: '',
    };

    // Redirect to home page after a short delay
    setTimeout(() => {
      router.push('/');
    }, 2000);
  } catch (error) {
    console.error('Error submitting review:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to submit review',
      caption: 'Please try again later.',
      position: 'top',
    });
  } finally {
    submitting.value = false;
  }
};
</script>

<style lang="scss" scoped>
.customer-review-page {
  background: #ffffff;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
}

.review-form-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.star-rating {
  display: flex;
  justify-content: center;
}
</style>
