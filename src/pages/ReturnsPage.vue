<template>
  <q-page class="returns-page q-pa-lg">
    <div class="page-container">
      <div class="text-h4 text-center q-mb-lg text-primary">
        Returns & Refunds
      </div>
      <div class="text-body1 text-center text-grey-7 q-mb-xl">
        Our return and refund policy
      </div>

      <q-card class="returns-card">
        <q-card-section>
          <div class="text-h6 q-mb-md">Return Policy</div>
          <p class="text-body1 text-grey-8 q-mb-md">
            We want you to be completely satisfied with your magnets! If you're
            not happy with your order, please contact us within 14 days of
            receipt.
          </p>

          <div class="text-h6 q-mb-md q-mt-lg">Refund Process</div>
          <ul class="text-body1 text-grey-8">
            <li class="q-mb-sm">
              Contact us at info@lilmagnetmemories.com with your order number
              and reason for return.
            </li>
            <li class="q-mb-sm">
              We'll provide a return authorization and shipping instructions.
            </li>
            <li class="q-mb-sm">
              Once we receive the returned items, we'll process your refund
              within 5-7 business days.
            </li>
            <li>
              Refunds will be issued to the original payment method.
            </li>
          </ul>

          <div class="text-h6 q-mb-md q-mt-lg">Custom Orders</div>
          <p class="text-body1 text-grey-8 q-mb-md">
            Custom photo magnets are made specifically for you, so they cannot
            be returned unless there's a manufacturing defect or error on our
            part. If you receive a defective product, please contact us
            immediately and we'll make it right!
          </p>

          <div class="text-h6 q-mb-md q-mt-lg">Damaged Items</div>
          <p class="text-body1 text-grey-8">
            If your order arrives damaged, please contact us within 48 hours of
            delivery with photos of the damage. We'll send a replacement or
            issue a full refund.
          </p>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
export default {
  name: 'ReturnsPage',
};
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.returns-card {
  margin-top: 2rem;
}
</style>
