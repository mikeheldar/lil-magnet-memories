<template>
  <q-page class="faq-page">
    <div class="q-pa-md">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Frequently Asked Questions
        </div>
        <div class="text-body1 text-grey-7">
          Find answers to common questions about our products and services
        </div>
      </div>

      <div class="row">
        <div class="col-12 col-md-8 offset-md-2">
          <q-list>
            <q-expansion-item
              v-for="(faq, index) in faqs"
              :key="index"
              :label="faq.question"
              :caption="faq.category"
              default-opened
              class="q-mb-md"
            >
              <q-card>
                <q-card-section>
                  <div class="text-body1" v-html="faq.answer"></div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>

          <q-card class="q-mt-lg">
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="help" class="q-mr-sm" />
                Still have questions?
              </div>
              <div class="text-body2 q-mb-md">
                Can't find the answer you're looking for? We're here to help!
              </div>
              <q-btn
                color="primary"
                label="Contact Us"
                icon="email"
                @click="$router.push('/contact-us')"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSiteSeo } from '../composables/useSiteSeo.js';

const router = useRouter();
const route = useRoute();

useSiteSeo(() => ({
  title: 'FAQ - Lil Magnet Memories',
  description:
    'Frequently asked questions about custom photo magnets. Learn about ordering, shipping, pricing, and our products.',
  keywords: 'magnet FAQ, custom magnet questions, shipping info, pricing questions',
  path: route.path,
  image: '/assets/lil-magnet-memories-logo.png',
}));

const faqs = ref([
  {
    question: 'How do I create custom magnets?',
    category: 'Product',
    answer: 'Creating custom magnets is easy! Simply upload your photos through our photo upload form, select your product type and quantity, and we\'ll create beautiful magnets from your images. You can upload multiple photos at once and customize quantities for each.',
  },
  {
    question: 'What image formats do you accept?',
    category: 'Product',
    answer: 'We accept most common image formats including JPG, PNG, GIF, and WebP. For best results, we recommend using high-resolution images (at least 300 DPI) in JPG or PNG format.',
  },
  {
    question: 'How long does it take to receive my order?',
    category: 'Shipping',
    answer: 'Processing time is typically 1-2 business days, plus shipping time. Standard shipping takes 5-7 business days, while expedited shipping takes 2-3 business days. You can also pick up your order at market events for free!',
  },
  {
    question: 'Can I pick up my order at a market event?',
    category: 'Shipping',
    answer: 'Yes! If we\'re at a market event, you can select "Collect at Market Event" as your shipping option. This is free and allows you to pick up your magnets in person. Check our Event Calendar page to see where we\'ll be next!',
  },
  {
    question: 'What payment methods do you accept?',
    category: 'Payment',
    answer: 'We accept all major credit cards, Apple Pay, and cash payments at market events. All online payments are processed securely through Square.',
  },
  {
    question: 'Can I return or exchange my order?',
    category: 'Returns',
    answer: 'Yes, we offer returns and exchanges within 30 days of delivery. Items must be unused and in their original condition. Please visit our Returns page or contact us for more information.',
  },
  {
    question: 'Do you offer bulk discounts?',
    category: 'Pricing',
    answer: 'Yes! Our pricing includes volume discounts. The more magnets you order, the better the price per magnet. Check our product pages to see our tiered pricing structure.',
  },
  {
    question: 'How do I track my order?',
    category: 'Shipping',
    answer: 'Once your order ships, you\'ll receive an email with a tracking number. You can use this tracking number to monitor your shipment\'s progress. If you have questions about your order status, please contact us.',
  },
]);
</script>

<style lang="scss" scoped>
.faq-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
