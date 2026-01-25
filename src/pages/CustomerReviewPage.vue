<template>
  <q-page class="customer-review-page">
    <div v-if="!mounted" class="flex flex-center" style="min-height: 400px">
      <q-spinner color="primary" size="3em" />
    </div>
    <div v-if="mounted" class="page-container q-pa-lg">
      <!-- Google Review CTA (Primary) - Smaller Version -->
      <q-card v-if="isGoogleReviewConfigured" class="google-review-card q-mb-xl">
        <q-card-section class="text-center bg-primary text-white">
          <q-icon name="star" size="48px" class="q-mb-sm" />
          <div class="text-h5 text-weight-bold q-mb-sm">Love Li'l Magnet Memories?</div>
          <div class="text-body2 q-mb-md">
            Help others discover us by leaving a Google review!
          </div>
          <q-btn
            size="md"
            color="white"
            text-color="primary"
            label="Leave Google Review"
            icon="open_in_new"
            :href="googleReviewUrl"
            target="_blank"
            rel="noopener noreferrer"
            @click="trackGoogleClick"
            class="google-review-btn"
          />
          <div class="text-caption q-mt-sm opacity-90">
            Takes less than 30 seconds
          </div>
        </q-card-section>
      </q-card>

      <!-- Divider -->
      <div class="text-center q-py-lg">
        <q-separator class="q-mb-md" />
        <div class="text-body2 text-grey-6">OR</div>
        <q-separator class="q-mt-md" />
      </div>

      <!-- Website Review Form (Secondary) -->
      <div class="text-center q-mb-xl">
        <div class="text-h5 text-weight-bold text-primary q-mb-sm">
          <q-icon name="rate_review" size="28px" class="q-mr-sm" />
          Share on Our Website
        </div>
        <div class="text-body2 text-grey-7">
          Leave a testimonial to appear on our site
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
import { ref, onMounted, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { 
  getGoogleReviewUrl, 
  isGoogleReviewConfigured,
  trackGoogleReviewClick 
} from '../utils/googleReviews.js';

const router = useRouter();
const $q = useQuasar();
const mounted = ref(false);

// Google Reviews integration
const googleReviewUrl = computed(() => getGoogleReviewUrl());
const trackGoogleClick = () => trackGoogleReviewClick('review-page');

// Ensure page only renders after layout is fully ready
// This prevents the "QPage needs to be a deep child of QLayout" error
// Using v-show instead of v-if so component is created within QLayout context
onMounted(async () => {
  // Wait for Vue to finish rendering and QLayout to be established
  await nextTick();
  await nextTick();
  // Small delay to ensure QLayout context is fully initialized
  await new Promise(resolve => setTimeout(resolve, 50));
  mounted.value = true;
});

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

.google-review-card {
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(156, 39, 176, 0.2);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.google-review-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(156, 39, 176, 0.3);
}

.google-review-btn {
  font-weight: 600;
  padding: 12px 32px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.google-review-btn:hover {
  transform: scale(1.05);
}

.opacity-90 {
  opacity: 0.9;
}
</style>
