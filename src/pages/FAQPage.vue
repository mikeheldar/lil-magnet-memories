<template>
  <q-page class="faq-page q-pa-lg">
    <div class="page-container">
      <div class="text-h4 text-center q-mb-lg text-primary">
        Frequently Asked Questions
      </div>
      <div class="text-body1 text-center text-grey-7 q-mb-xl">
        Find answers to common questions about our products and services
      </div>

      <div class="faq-list">
        <q-expansion-item
          v-for="(faq, index) in faqs"
          :key="index"
          :label="faq.question"
          :caption="faq.category"
          class="faq-item q-mb-md"
        >
          <q-card>
            <q-card-section>
              <div class="text-body1 text-grey-8">{{ faq.answer }}</div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </div>

      <q-card class="q-mt-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">Still have questions?</div>
          <p class="text-body1 text-grey-7">
            Can't find what you're looking for? Feel free to
            <router-link to="/contact-us" class="text-primary"
              >contact us</router-link
            >
            and we'll be happy to help!
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'FAQPage',
  setup() {
    const faqs = ref([
      {
        question: 'How long does it take to receive my order?',
        answer:
          'Orders are typically processed within 1-2 business days. Shipping times vary based on the option you choose: Standard Shipping (5-7 business days), Expedited Shipping (2-3 business days), or Market Event Pickup (available when we\'re at an event).',
        category: 'Shipping',
      },
      {
        question: 'Can I customize my magnets?',
        answer:
          'Yes! Our custom photo magnets allow you to upload your own photos. You can also choose quantities to get the best pricing. For designer and specialty products, customization options may vary.',
        category: 'Products',
      },
      {
        question: 'What sizes are available?',
        answer:
          'Our standard magnet size is 2.6 inches. Some specialty products may come in different sizes. Check individual product pages for specific dimensions.',
        category: 'Products',
      },
      {
        question: 'Do you offer bulk pricing?',
        answer:
          'Yes! We offer quantity discounts on all products. The more magnets you order, the better the price per unit. Check each product page for specific pricing tiers.',
        category: 'Pricing',
      },
      {
        question: 'Can I pick up my order at a market event?',
        answer:
          'Absolutely! If we\'re at a market event, you can select "Collect at Market Event" during checkout for free pickup. Check our Event Calendar to see where we\'ll be next!',
        category: 'Shipping',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards, Apple Pay, and Square payments. Payment is processed securely at checkout.',
        category: 'Payment',
      },
      {
        question: 'What if I receive a damaged product?',
        answer:
          'If your order arrives damaged, please contact us within 48 hours of delivery with photos. We\'ll send a replacement or issue a full refund.',
        category: 'Returns',
      },
      {
        question: 'Can I return custom magnets?',
        answer:
          'Custom photo magnets are made specifically for you, so they cannot be returned unless there\'s a manufacturing defect. If you receive a defective product, contact us immediately and we\'ll make it right!',
        category: 'Returns',
      },
    ]);

    return {
      faqs,
    };
  },
};
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.faq-item {
  margin-bottom: 1rem;
}
</style>
