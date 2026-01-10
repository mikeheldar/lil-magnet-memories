<template>
  <q-page class="returns-page">
    <div class="q-pa-md">
      <div class="text-center q-mb-xl">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Returns & Refunds
        </div>
        <div class="text-body1 text-grey-7">
          Our return and refund policy
        </div>
      </div>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-8 offset-md-2">
          <q-card>
            <q-card-section>
              <div class="text-h6 q-mb-md">
                <q-icon name="assignment_return" class="q-mr-sm" />
                Return Policy
              </div>
              <div class="text-body1 q-mb-md">
                We want you to be completely satisfied with your purchase. If you're not happy with your order, we're here to help.
              </div>

              <div class="q-mb-lg">
                <div class="text-weight-medium q-mb-sm">Return Window:</div>
                <div class="text-body2">
                  You have 30 days from the date of delivery to request a return or exchange.
                </div>
              </div>

              <div class="q-mb-lg">
                <div class="text-weight-medium q-mb-sm">Return Conditions:</div>
                <ul class="text-body2">
                  <li>Items must be unused and in their original condition</li>
                  <li>Items must be in their original packaging</li>
                  <li>Proof of purchase is required</li>
                </ul>
              </div>

              <div class="q-mb-lg">
                <div class="text-weight-medium q-mb-sm">How to Return:</div>
                <div class="text-body2">
                  <ol>
                    <li>Contact us at <a href="mailto:info@lilmagnetmemories.com" class="text-primary">info@lilmagnetmemories.com</a> to initiate a return</li>
                    <li>We'll provide you with a return authorization and shipping instructions</li>
                    <li>Package your item securely and ship it back to us</li>
                    <li>Once we receive your return, we'll process your refund or exchange</li>
                  </ol>
                </div>
              </div>

              <div class="q-mb-lg">
                <div class="text-weight-medium q-mb-sm">Refunds:</div>
                <div class="text-body2">
                  Refunds will be processed to the original payment method within 5-10 business days after we receive your return. Shipping costs are non-refundable unless the item was defective or we made an error.
                </div>
              </div>

              <div class="q-mb-lg">
                <div class="text-weight-medium q-mb-sm">Exchanges:</div>
                <div class="text-body2">
                  If you need to exchange an item for a different size or style, please contact us and we'll be happy to help you find the perfect match.
                </div>
              </div>

              <div class="q-mt-xl">
                <q-btn
                  color="primary"
                  label="Contact Us"
                  icon="email"
                  @click="$router.push('/contact-us')"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style lang="scss" scoped>
.returns-page {
  max-width: 1200px;
  margin: 0 auto;
}

ul, ol {
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}
</style>
