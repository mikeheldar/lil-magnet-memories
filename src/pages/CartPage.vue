<template>
  <q-page padding class="cart-page">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="text-h4 q-mb-md">Shopping Cart</div>

        <div v-if="cartItems.length === 0" class="text-center q-pa-xl">
          <q-icon name="shopping_cart" size="64px" color="grey-4" class="q-mb-md" />
          <div class="text-h6 text-grey-6 q-mb-sm">Your cart is empty</div>
          <div class="text-body2 text-grey-6 q-mb-lg">
            Add some products to get started!
          </div>
          <q-btn
            color="primary"
            label="Browse Products"
            icon="store"
            @click="$router.push('/')"
          />
        </div>

        <div v-else>
          <q-card>
            <q-list separator>
              <q-item
                v-for="item in cartItems"
                :key="item.productId"
                class="cart-item"
              >
                <q-item-section avatar>
                  <q-avatar size="80px" square v-if="item.productImage">
                    <img :src="item.productImage" :alt="item.productName" />
                  </q-avatar>
                  <q-avatar size="80px" square color="grey-3" v-else>
                    <q-icon name="image" size="32px" color="grey-6" />
                  </q-avatar>
                </q-item-section>

                <q-item-section>
                  <q-item-label class="text-h6">{{ item.productName }}</q-item-label>
                  <q-item-label caption>
                    <div v-if="item.pricingTier && item.pricingTier > 1">
                      {{ item.pricingTier }}x pricing tier
                    </div>
                    <div class="text-body2 text-primary q-mt-xs">
                      ${{ item.pricePerUnit.toFixed(2) }} each
                    </div>
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row items-center q-gutter-sm">
                    <q-input
                      :model-value="item.quantity"
                      type="number"
                      min="1"
                      dense
                      filled
                      style="width: 80px"
                      @update:model-value="updateQuantity(item.productId, $event)"
                    />
                    <div class="text-h6 text-primary">
                      ${{ item.totalPrice.toFixed(2) }}
                    </div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      @click="removeFromCart(item.productId)"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <q-separator />

            <q-card-section>
              <div class="row justify-end q-gutter-md">
                <div class="text-right">
                  <div class="text-body2 text-grey-7 q-mb-xs">Subtotal:</div>
                  <div class="text-h5 text-primary">
                    ${{ cartSubtotal.toFixed(2) }}
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
              <q-btn
                flat
                label="Continue Shopping"
                @click="$router.push('/')"
                class="q-mr-sm"
              />
              <q-btn
                color="primary"
                label="Proceed to Checkout"
                icon="shopping_cart"
                size="lg"
                @click="goToCheckout"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { useCart } from '../composables/useCart.js';
import { useRouter } from 'vue-router';

export default {
  name: 'CartPage',
  setup() {
    const router = useRouter();
    const {
      cartItems,
      cartSubtotal,
      updateQuantity,
      removeFromCart,
    } = useCart();

    const goToCheckout = () => {
      router.push('/checkout');
    };

    return {
      cartItems,
      cartSubtotal,
      updateQuantity,
      removeFromCart,
      goToCheckout,
    };
  },
};
</script>

<style scoped>
.cart-item {
  padding: 16px;
}

.cart-page {
  min-height: 60vh;
}
</style>

