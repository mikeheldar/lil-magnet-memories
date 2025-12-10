<template>
  <q-page padding class="cart-page">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="text-h4 q-mb-md">Shopping Cart</div>

        <div v-if="loading" class="text-center q-pa-xl">
          <q-spinner color="primary" size="3em" />
          <div class="text-h6 text-grey-6 q-mt-md">Loading cart...</div>
        </div>

        <div v-else-if="cartItems.length === 0" class="text-center q-pa-xl">
          <q-icon
            name="shopping_cart"
            size="64px"
            color="grey-4"
            class="q-mb-md"
          />
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
              <template v-for="item in cartItems" :key="item.productId">
                <!-- Custom Upload Item -->
                <q-item v-if="item.isCustomUpload" class="cart-item">
                  <q-item-section>
                    <q-item-label class="text-h6">{{
                      item.productName
                    }}</q-item-label>
                    <q-item-label caption>
                      <div class="q-mt-sm">
                        <!-- Photo Previews -->
                        <div class="row q-col-gutter-xs q-mb-sm">
                          <div
                            v-for="(photo, photoIndex) in item.photos"
                            :key="photoIndex"
                            class="col-auto"
                          >
                            <div style="position: relative; height: 60px; width: 60px;">
                              <q-img
                                :src="getImageSource(photo)"
                                style="height: 60px; width: 60px"
                                class="rounded-borders"
                                @error="handleImageError($event, photo)"
                              >
                                <template v-slot:error>
                                  <div class="absolute-full flex flex-center bg-grey-3 text-grey-8">
                                    <q-icon name="broken_image" size="24px" />
                                  </div>
                                </template>
                              </q-img>
                            </div>
                          </div>
                        </div>

                        <!-- Photo names and quantities -->
                        <div class="text-caption text-grey-7 q-mb-xs">
                          <div
                            v-for="(photo, photoIndex) in item.photos"
                            :key="photoIndex"
                          >
                            {{ photo.name }} ({{ photo.quantity }}x)
                          </div>
                        </div>

                        <!-- Cost Breakdown -->
                        <div
                          v-if="
                            item.costBreakdown && item.costBreakdown.length > 0
                          "
                          class="text-caption text-grey-7 q-mb-xs"
                        >
                          <div
                            v-for="(breakdown, index) in item.costBreakdown"
                            :key="index"
                          >
                            {{ breakdown.count }} × ({{ breakdown.qty }} for ${{
                              (breakdown.price / breakdown.count).toFixed(2)
                            }})
                          </div>
                        </div>

                        <!-- Special Instructions -->
                        <div
                          v-if="item.specialInstructions"
                          class="text-caption text-grey-7 q-mt-xs"
                        >
                          <strong>Notes:</strong> {{ item.specialInstructions }}
                        </div>
                      </div>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="text-h6 text-primary q-mb-xs">
                      ${{ item.totalCost?.total?.toFixed(2) || '0.00' }}
                    </div>
                    <div class="text-caption text-grey-6 q-mb-xs">
                      {{ item.quantity }} magnet{{
                        item.quantity > 1 ? 's' : ''
                      }}
                    </div>
                    <q-btn
                      flat
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="removeFromCart(item.productId)"
                    />
                  </q-item-section>
                </q-item>

                <!-- Regular Product Item -->
                <q-item v-else class="cart-item">
                  <q-item-section avatar>
                    <q-avatar size="80px" square v-if="item.productImage">
                      <img :src="item.productImage" :alt="item.productName" />
                    </q-avatar>
                    <q-avatar size="80px" square color="grey-3" v-else>
                      <q-icon name="image" size="32px" color="grey-6" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-h6">{{
                      item.productName
                    }}</q-item-label>
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
                        @update:model-value="
                          updateQuantity(item.productId, $event)
                        "
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
              </template>
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

            <q-card-actions vertical class="q-pa-md">
              <q-btn
                color="primary"
                label="Proceed to Checkout"
                icon="shopping_cart"
                size="lg"
                class="full-width"
                @click="goToCheckout"
              />
              <q-btn
                flat
                label="Continue Shopping"
                class="full-width q-mt-sm"
                @click="$router.push('/')"
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
import { onMounted, ref } from 'vue';
import { auth } from '../firebase/config.js';
import { firebaseService } from '../services/firebaseService.js';

export default {
  name: 'CartPage',
  setup() {
    const router = useRouter();
    const { cartItems, cartSubtotal, updateQuantity, removeFromCart } =
      useCart();
    const loading = ref(true);

    // Ensure cart is loaded when page mounts
    onMounted(async () => {
      console.log('🛒 CartPage mounted, checking cart...');
      const user = auth.currentUser;
      if (user && !user.isAnonymous) {
        console.log('👤 User logged in, loading cart from Firestore:', user.uid);
        try {
          const firestoreCart = await firebaseService.loadUserCart(user.uid);
          console.log('📦 Cart loaded on CartPage mount:', firestoreCart?.length || 0, 'items');
          if (firestoreCart && firestoreCart.length > 0) {
            // Update cart items if Firestore has more recent data
            cartItems.value = firestoreCart;
            console.log('✅ Cart updated from Firestore on CartPage');
          }
        } catch (error) {
          console.error('❌ Error loading cart on CartPage mount:', error);
        }
      } else {
        console.log('ℹ️ User not logged in or anonymous, using localStorage cart');
      }
      loading.value = false;
    });

    const goToCheckout = () => {
      router.push('/checkout');
    };

    const getImageSource = (photo) => {
      // Prioritize Firebase Storage URL, fallback to base64 preview
      if (photo.url && photo.url.startsWith('http')) {
        return photo.url;
      }
      if (photo.preview) {
        return photo.preview;
      }
      // Return empty string to trigger error handler
      return '';
    };

    const handleImageError = (event, photo) => {
      const failedSrc = event.target.src;
      const photoName = photo.name || 'Unknown';
      
      // Log detailed error information
      console.error('❌ Failed to load photo:', {
        name: photoName,
        failedSource: failedSrc,
        hasUrl: !!photo.url,
        url: photo.url,
        hasPreview: !!photo.preview,
        previewType: photo.preview ? (photo.preview.substring(0, 50) + '...') : 'none',
        fullPhoto: photo
      });
      
      // If url failed and preview exists (and is different), try preview
      if (photo.url && photo.preview && failedSrc === photo.url && photo.preview !== photo.url) {
        console.log('⚠️ Photo URL failed, trying preview:', photoName);
        console.log('   Failed URL:', photo.url);
        console.log('   Trying preview (base64):', photo.preview.substring(0, 50) + '...');
        event.target.src = photo.preview;
      } else if (photo.preview && failedSrc === photo.preview && photo.url && photo.url !== photo.preview) {
        // If preview failed, try URL
        console.log('⚠️ Photo preview failed, trying URL:', photoName);
        console.log('   Failed preview (base64):', photo.preview.substring(0, 50) + '...');
        console.log('   Trying URL:', photo.url);
        event.target.src = photo.url;
      } else {
        console.error('❌ All image sources failed for photo:', photoName);
        console.error('   Final failed source:', failedSrc);
        // q-img error template will show broken_image icon
      }
    };

    return {
      cartItems,
      cartSubtotal,
      updateQuantity,
      removeFromCart,
      goToCheckout,
      loading,
      handleImageError,
      getImageSource,
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
