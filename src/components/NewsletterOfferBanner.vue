<template>
  <transition name="offer-banner-slide">
    <q-card v-if="showBanner" class="newsletter-offer-banner shadow-8" role="dialog" aria-label="Newsletter offer">
      <q-btn
        flat
        round
        dense
        icon="close"
        class="offer-close-btn"
        aria-label="Dismiss offer"
        @click="dismiss"
      />

      <q-card-section v-if="!subscribed" class="q-pb-sm">
        <div class="row items-center q-gutter-sm no-wrap">
          <q-icon name="local_offer" color="primary" size="28px" />
          <div class="text-subtitle1 text-weight-bold">
            Get {{ offerText }} your first order
          </div>
        </div>
        <div class="text-body2 text-grey-8 q-mt-xs">
          Join our newsletter and we'll send you a promo code to use at checkout.
        </div>
        <form class="row q-gutter-sm q-mt-sm no-wrap items-start" @submit.prevent="submit">
          <q-input
            v-model="email"
            type="email"
            dense
            outlined
            placeholder="you@example.com"
            class="col"
            :error="!!error"
            :error-message="error"
            :disable="submitting"
            autocomplete="email"
          />
          <q-btn
            type="submit"
            color="primary"
            unelevated
            label="Get my code"
            :loading="submitting"
          />
        </form>
      </q-card-section>

      <q-card-section v-else class="q-pb-md">
        <div class="row items-center q-gutter-sm no-wrap">
          <q-icon name="check_circle" color="positive" size="28px" />
          <div class="text-subtitle1 text-weight-bold">You're in! Here's your code:</div>
        </div>
        <div class="row items-center q-gutter-sm q-mt-sm no-wrap">
          <div class="offer-code text-h6">{{ offer.code }}</div>
          <q-btn
            flat
            dense
            color="primary"
            :icon="copied ? 'check' : 'content_copy'"
            :label="copied ? 'Copied' : 'Copy'"
            @click="copyCode"
          />
        </div>
        <div class="text-body2 text-grey-8 q-mt-xs">
          Enter it in the promo code box at checkout for {{ offerText }} your order.
        </div>
      </q-card-section>
    </q-card>
  </transition>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { copyToClipboard } from 'quasar';
import { firebaseService } from '../services/firebaseService.js';
import { trackEvent } from '../utils/analytics.js';

const DONE_KEY = 'lmm_welcome_offer_done';
const DISMISSED_AT_KEY = 'lmm_welcome_offer_dismissed_at';
const DISMISS_DAYS = 14;
const SHOW_DELAY_MS = 5000;

// Never show the banner over purchase completion, admin, or in-person market flows.
const SUPPRESSED_PATH_PREFIXES = [
  '/checkout',
  '/thank-you',
  '/admin',
  '/order',
  '/errored-transactions',
  '/customers',
  '/print-template',
  '/at-market',
  '/market-event-upload',
  '/photo-upload-market',
  '/email-test',
  '/firebase-test',
  '/firestore-debug',
  '/test-runner',
];

export default {
  name: 'NewsletterOfferBanner',
  setup() {
    const route = useRoute();
    const offer = ref(null);
    const visible = ref(false);
    const email = ref('');
    const error = ref('');
    const submitting = ref(false);
    const subscribed = ref(false);
    const copied = ref(false);
    let showTimer = null;

    const storage = {
      get(key) {
        try { return window.localStorage.getItem(key); } catch { return null; }
      },
      set(key, value) {
        try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
      },
    };

    const alreadyHandled = () => {
      if (storage.get(DONE_KEY)) return true;
      const dismissedAt = Number(storage.get(DISMISSED_AT_KEY));
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return true;
      return false;
    };

    const routeSuppressed = computed(() =>
      SUPPRESSED_PATH_PREFIXES.some((prefix) => route.path.startsWith(prefix))
    );

    const showBanner = computed(() => visible.value && !!offer.value && !routeSuppressed.value);

    const offerText = computed(() => {
      if (!offer.value) return '';
      const value = Number(offer.value.value);
      if (offer.value.type === 'percent') return `${value}% off`;
      if (offer.value.type === 'fixed') return `$${value.toFixed(2)} off`;
      return `a flat $${value.toFixed(2)} on`;
    });

    const dismiss = () => {
      visible.value = false;
      // A subscriber closing the code panel is done for good; a browser is done for two weeks.
      if (subscribed.value) storage.set(DONE_KEY, '1');
      else storage.set(DISMISSED_AT_KEY, String(Date.now()));
    };

    const submit = async () => {
      error.value = '';
      const normalized = (email.value || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        error.value = 'Please enter a valid email address.';
        return;
      }
      submitting.value = true;
      try {
        await firebaseService.subscribeToNewsletter(normalized, 'welcome-offer');
        subscribed.value = true;
        storage.set(DONE_KEY, '1');
        trackEvent('sign_up', { method: 'welcome_offer_banner' });
      } catch (e) {
        console.error('Welcome offer signup failed:', e);
        error.value = 'Something went wrong — please try again.';
      } finally {
        submitting.value = false;
      }
    };

    const copyCode = async () => {
      try {
        await copyToClipboard(offer.value.code);
        copied.value = true;
        setTimeout(() => { copied.value = false; }, 2000);
      } catch (e) {
        console.error('Copy failed:', e);
      }
    };

    onMounted(async () => {
      if (alreadyHandled()) return;
      const found = await firebaseService.getWelcomeOfferPromo();
      if (!found) return;
      offer.value = found;
      showTimer = setTimeout(() => { visible.value = true; }, SHOW_DELAY_MS);
    });

    onUnmounted(() => {
      if (showTimer) clearTimeout(showTimer);
    });

    return {
      offer,
      showBanner,
      offerText,
      email,
      error,
      submitting,
      subscribed,
      copied,
      dismiss,
      submit,
      copyCode,
    };
  },
};
</script>

<style lang="scss" scoped>
.newsletter-offer-banner {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 380px;
  max-width: calc(100vw - 32px);
  z-index: 5000;
  border-radius: 12px;
  border: 1px solid $light-purple;
}

.offer-close-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
  color: #757575;
}

.offer-code {
  letter-spacing: 2px;
  font-weight: 700;
  background: rgba(103, 58, 183, 0.08);
  border: 1px dashed $primary;
  border-radius: 8px;
  padding: 2px 12px;
}

.offer-banner-slide-enter-active,
.offer-banner-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.offer-banner-slide-enter-from,
.offer-banner-slide-leave-to {
  transform: translateY(24px);
  opacity: 0;
}
</style>
