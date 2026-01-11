<template>
  <q-page class="reviews-management-page q-pa-lg">
    <div class="page-container">
      <div class="text-h4 q-mb-lg text-primary">Reviews Management</div>

      <!-- Add New Review Form -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">Add New Review</div>
          <q-form @submit="handleAddReview">
            <q-input
              v-model="newReview.customerName"
              label="Customer Name *"
              filled
              :rules="[(val) => !!val || 'Customer name is required']"
              class="q-mb-md"
            />
            <q-input
              v-model="newReview.reviewText"
              label="Review Text *"
              filled
              type="textarea"
              rows="4"
              :rules="[(val) => !!val || 'Review text is required']"
              class="q-mb-md"
            />
            <q-rating
              v-model="newReview.rating"
              :max="5"
              size="32px"
              class="q-mb-md star-rating"
            />
            <q-toggle
              v-model="newReview.isVerified"
              label="Verified Customer"
              color="primary"
              class="q-mb-md"
            />
            <div class="q-mt-md">
              <q-btn
                type="submit"
                color="primary"
                label="Add Review"
                :loading="addingReview"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Reviews List -->
      <div class="text-h6 q-mb-md">
        All Reviews ({{ reviews.length }})
        <q-chip
          v-if="unverifiedReviews.length > 0"
          color="orange"
          text-color="white"
          size="sm"
          class="q-ml-sm"
        >
          {{ unverifiedReviews.length }} Pending Verification
        </q-chip>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="40px" color="primary" />
        <div class="q-mt-md text-grey-6">Loading reviews...</div>
      </div>

      <!-- Unverified Reviews Section -->
      <div v-if="unverifiedReviews.length > 0" class="q-mb-xl">
        <div class="text-h6 q-mb-md text-orange">
          <q-icon name="pending" class="q-mr-sm" />
          Pending Verification ({{ unverifiedReviews.length }})
        </div>
        <div class="row q-col-gutter-md">
          <div
            v-for="review in unverifiedReviews"
            :key="review.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="review-card unverified-review-card">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-avatar
                    v-if="review.profilePicture"
                    :src="review.profilePicture"
                    size="48px"
                    class="q-mr-sm"
                  />
                  <q-avatar
                    v-else
                    color="orange"
                    text-color="white"
                    size="48px"
                    class="q-mr-sm"
                  >
                    {{ review.customerName.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <div class="col">
                    <div class="text-weight-bold">{{ review.customerName }}</div>
                    <q-rating
                      :model-value="review.rating || 5"
                      :max="5"
                      size="16px"
                      readonly
                      class="star-rating"
                    />
                  </div>
                  <q-chip
                    color="orange"
                    text-color="white"
                    size="sm"
                    icon="pending"
                  >
                    Pending
                  </q-chip>
                </div>
                <div class="text-body2 text-grey-8 q-mb-md">
                  {{ review.reviewText }}
                </div>
                <div class="text-caption text-grey-6 q-mb-md">
                  {{ formatDate(review.createdAt) }}
                  <span v-if="review.email" class="q-ml-sm">
                    ({{ review.email }})
                  </span>
                </div>
                <div class="row q-gutter-sm">
                  <q-btn
                    flat
                    dense
                    color="green"
                    label="Verify"
                    icon="verified"
                    @click="verifyReview(review)"
                  />
                  <q-btn
                    flat
                    dense
                    color="primary"
                    label="Edit"
                    icon="edit"
                    @click="startEditReview(review)"
                  />
                  <q-btn
                    flat
                    dense
                    color="negative"
                    label="Delete"
                    icon="delete"
                    @click="confirmDeleteReview(review)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Verified Reviews Section -->
      <div v-if="verifiedReviews.length > 0">
        <div class="text-h6 q-mb-md text-green">
          <q-icon name="verified" class="q-mr-sm" />
          Verified Reviews ({{ verifiedReviews.length }})
        </div>
        <div class="row q-col-gutter-md">
          <div
            v-for="review in verifiedReviews"
            :key="review.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="review-card">
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <q-avatar
                    v-if="review.profilePicture"
                    :src="review.profilePicture"
                    size="48px"
                    class="q-mr-sm"
                  />
                  <q-avatar
                    v-else
                    color="primary"
                    text-color="white"
                    size="48px"
                    class="q-mr-sm"
                  >
                    {{ review.customerName.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <div class="col">
                    <div class="text-weight-bold">{{ review.customerName }}</div>
                    <q-rating
                      :model-value="review.rating || 5"
                      :max="5"
                      size="16px"
                      readonly
                      class="star-rating"
                    />
                  </div>
                  <q-chip
                    color="green"
                    text-color="white"
                    size="sm"
                    icon="verified"
                  >
                    Verified
                  </q-chip>
                </div>
                <div class="text-body2 text-grey-8 q-mb-md">
                  {{ review.reviewText }}
                </div>
                <div class="text-caption text-grey-6 q-mb-md">
                  {{ formatDate(review.createdAt) }}
                </div>
                <div class="row q-gutter-sm">
                  <q-btn
                    flat
                    dense
                    color="primary"
                    label="Edit"
                    icon="edit"
                    @click="startEditReview(review)"
                  />
                  <q-btn
                    flat
                    dense
                    color="negative"
                    label="Delete"
                    icon="delete"
                    @click="confirmDeleteReview(review)"
                  />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-grey-6 q-pa-xl">
        No reviews yet. Add your first review above!
      </div>

      <!-- Edit Review Dialog -->
      <q-dialog v-model="showEditDialog">
        <q-card style="min-width: 500px">
          <q-card-section>
            <div class="text-h6">Edit Review</div>
          </q-card-section>
          <q-card-section>
            <q-form @submit="handleUpdateReview">
              <q-input
                v-model="editingReview.customerName"
                label="Customer Name *"
                filled
                :rules="[(val) => !!val || 'Customer name is required']"
                class="q-mb-md"
              />
              <q-input
                v-model="editingReview.reviewText"
                label="Review Text *"
                filled
                type="textarea"
                rows="4"
                :rules="[(val) => !!val || 'Review text is required']"
                class="q-mb-md"
              />
              <q-rating
                v-model="editingReview.rating"
                :max="5"
                size="32px"
                class="q-mb-md star-rating"
              />
              <q-toggle
                v-model="editingReview.isVerified"
                label="Verified Customer"
                color="primary"
                class="q-mb-md"
              />
              <q-card-actions align="right">
                <q-btn flat label="Cancel" @click="showEditDialog = false" />
                <q-btn
                  type="submit"
                  color="primary"
                  label="Update"
                  :loading="updatingReview"
                />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Delete Confirmation Dialog -->
      <q-dialog v-model="showDeleteDialog">
        <q-card>
          <q-card-section>
            <div class="text-h6">Delete Review</div>
          </q-card-section>
          <q-card-section>
            Are you sure you want to delete this review? This action cannot be
            undone.
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" @click="showDeleteDialog = false" />
            <q-btn
              color="negative"
              label="Delete"
              @click="handleDeleteReview"
              :loading="deletingReview"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { firebaseService } from '../services/firebaseService.js';
import { useQuasar } from 'quasar';

export default {
  name: 'ReviewsManagementPage',
  setup() {
    const $q = useQuasar();
    const reviews = ref([]);
    const loading = ref(true);
    const addingReview = ref(false);
    const updatingReview = ref(false);
    const deletingReview = ref(false);
    const showEditDialog = ref(false);
    const showDeleteDialog = ref(false);
    const editingReview = ref(null);
    const reviewToDelete = ref(null);

    const newReview = ref({
      customerName: '',
      reviewText: '',
      rating: 5,
      isVerified: true,
      profilePicture: null,
    });

    const loadReviews = async () => {
      loading.value = true;
      try {
        const reviewsData = await firebaseService.getReviews();
        reviews.value = reviewsData;
      } catch (error) {
        console.error('Error loading reviews:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to load reviews',
          position: 'top',
        });
      } finally {
        loading.value = false;
      }
    };

    const handleAddReview = async () => {
      addingReview.value = true;
      try {
        await firebaseService.addReview(newReview.value);
        $q.notify({
          type: 'positive',
          message: 'Review added successfully',
          position: 'top',
        });
        newReview.value = {
          customerName: '',
          reviewText: '',
          rating: 5,
          isVerified: true,
          profilePicture: null,
        };
        await loadReviews();
      } catch (error) {
        console.error('Error adding review:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to add review',
          position: 'top',
        });
      } finally {
        addingReview.value = false;
      }
    };

    const startEditReview = (review) => {
      editingReview.value = { ...review };
      showEditDialog.value = true;
    };

    const handleUpdateReview = async () => {
      updatingReview.value = true;
      try {
        const { id, ...reviewData } = editingReview.value;
        await firebaseService.updateReview(id, reviewData);
        $q.notify({
          type: 'positive',
          message: 'Review updated successfully',
          position: 'top',
        });
        showEditDialog.value = false;
        editingReview.value = null;
        await loadReviews();
      } catch (error) {
        console.error('Error updating review:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to update review',
          position: 'top',
        });
      } finally {
        updatingReview.value = false;
      }
    };

    const confirmDeleteReview = (review) => {
      reviewToDelete.value = review;
      showDeleteDialog.value = true;
    };

    const handleDeleteReview = async () => {
      deletingReview.value = true;
      try {
        await firebaseService.deleteReview(reviewToDelete.value.id);
        $q.notify({
          type: 'positive',
          message: 'Review deleted successfully',
          position: 'top',
        });
        showDeleteDialog.value = false;
        reviewToDelete.value = null;
        await loadReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to delete review',
          position: 'top',
        });
      } finally {
        deletingReview.value = false;
      }
    };

    const formatDate = (timestamp) => {
      if (!timestamp) return 'Unknown date';
      try {
        const date = timestamp.toDate
          ? timestamp.toDate()
          : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (error) {
        return 'Invalid date';
      }
    };

    // Filter reviews by verification status
    const verifiedReviews = computed(() => {
      return reviews.value.filter((review) => review.isVerified === true);
    });

    const unverifiedReviews = computed(() => {
      return reviews.value.filter((review) => review.isVerified !== true);
    });

    const verifyReview = async (review) => {
      try {
        await firebaseService.updateReview(review.id, {
          isVerified: true,
        });
        $q.notify({
          type: 'positive',
          message: 'Review verified successfully',
          position: 'top',
        });
        await loadReviews();
      } catch (error) {
        console.error('Error verifying review:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to verify review',
          position: 'top',
        });
      }
    };

    onMounted(() => {
      loadReviews();
    });

    return {
      reviews,
      loading,
      newReview,
      addingReview,
      updatingReview,
      deletingReview,
      showEditDialog,
      showDeleteDialog,
      editingReview,
      reviewToDelete,
      handleAddReview,
      startEditReview,
      handleUpdateReview,
      confirmDeleteReview,
      handleDeleteReview,
      formatDate,
      verifiedReviews,
      unverifiedReviews,
      verifyReview,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.review-card {
  height: 100%;
}

.unverified-review-card {
  border-left: 4px solid #ff9800;
}
</style>
