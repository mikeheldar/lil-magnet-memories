<template>
  <q-page class="row justify-center">
    <div class="col-12 col-md-8 col-lg-6 q-pa-md" style="padding-top: 0;">
      <!-- Compact Login Section for Non-Authenticated Users -->
      <div v-if="!isAuthenticated" class="q-mb-sm compact-sign-in">
        <q-card class="q-pa-xs bg-blue-1">
          <q-card-section class="q-pa-sm">
            <div class="row items-center justify-between">
              <div class="col-auto">
                <span class="text-caption text-grey-7">Already have an account?</span>
              </div>
              <div class="col-auto">
                <q-btn
                  @click="handleGoogleSignIn"
                  color="primary"
                  size="sm"
                  dense
                  class="q-px-sm"
                  :loading="signingIn"
                  :disable="signingIn"
                >
                  <q-icon name="login" size="16px" class="q-mr-xs" />
                  <span class="text-caption">{{ signingIn ? 'Signing in...' : 'Sign in' }}</span>
                </q-btn>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Upload Form Card -->
      <q-card class="q-pa-lg">
        <q-card-section>
          <div class="text-h5 text-weight-medium q-mb-md text-center">
            <q-icon
              name="camera_alt"
              size="32px"
              class="q-mr-sm text-primary"
            />
            Photo Upload Form
          </div>
          
          <div class="text-body2 text-grey-6 text-center q-mb-md">
            <span v-if="isAtMarketEvent"
              >Create custom magnets for market event pickup</span
            >
            <span v-else>Create custom magnets for home delivery</span>
          </div>

          <q-form @submit="onSubmit" class="q-gutter-sm">
            <!-- Customer Information -->
            <div ref="personalInfoSection" class="text-h6 text-weight-medium q-mb-sm text-primary">
              <q-icon name="person" class="q-mr-sm" />
              Your Information
            </div>

            <div class="form-fields-container">
              <div class="row q-col-gutter-md">
                <!-- Top row: First Name and Last Name -->
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="formData.firstName"
                    label="First Name *"
                    filled
                    ref="firstNameInput"
                    :rules="[(val) => !!val || 'First name is required']"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="formData.lastName"
                    label="Last Name *"
                    filled
                    ref="lastNameInput"
                    :rules="[(val) => !!val || 'Last name is required']"
                  />
                </div>
                <!-- Bottom row: Email and Phone Number -->
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="formData.email"
                    label="Email Address *"
                    type="email"
                    filled
                    ref="emailInput"
                    :rules="[
                      (val) => !!val || 'Email is required',
                      (val) => isValidEmail(val) || 'Please enter a valid email',
                    ]"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="formData.phone"
                    label="Phone Number"
                    filled
                    mask="(###) ###-####"
                  />
                </div>
              </div>
            </div>

            <!-- Photo Upload Section -->
            <q-separator class="q-my-md" />

            <div ref="photoUploadSection" class="photo-upload-section q-pa-md q-mt-md">
              <div class="text-h6 text-weight-medium q-mb-sm text-primary">
                <q-icon name="photo_library" class="q-mr-sm" />
                Your Photos
              </div>

              <div class="text-body2 text-grey-7 q-mb-md">
                Upload your photos below. You can select multiple photos at
                once. We'll turn them into beautiful custom magnets!
              </div>

              <!-- File Upload -->
              <q-file
                v-model="selectedFiles"
                label="Choose Photos"
                filled
                multiple
                accept="image/*"
                @rejected="onRejected"
                @update:model-value="onFileSelected"
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>

              <!-- Selected Files Preview -->
              <div
                v-if="selectedFiles && selectedFiles.length > 0"
                class="q-mb-md"
              >
                <div class="text-subtitle2 q-mb-sm">
                  Selected Photos ({{ selectedFiles.length }}):
                </div>
                <div class="row q-col-gutter-sm">
                  <div
                    v-for="(file, index) in selectedFiles"
                    :key="index"
                    class="col-6 col-md-4 col-lg-3"
                  >
                    <q-card class="q-pa-sm photo-preview-card" style="position: relative;">
                      <!-- Remove button in upper right corner -->
                      <q-btn
                        flat
                        dense
                        round
                        icon="close"
                        color="white"
                        size="sm"
                        class="photo-remove-btn"
                        @click="removeFile(index)"
                        style="
                          position: absolute;
                          top: 4px;
                          right: 4px;
                          z-index: 10;
                          background: rgba(0, 0, 0, 0.6);
                          min-width: 24px;
                          width: 24px;
                          height: 24px;
                        "
                      >
                        <q-tooltip>Remove photo</q-tooltip>
                      </q-btn>
                      <!-- Square frame with centered photo -->
                      <div
                        class="square-photo-frame q-mb-sm"
                        style="
                          width: 100%;
                          aspect-ratio: 1;
                          position: relative;
                          overflow: hidden;
                          border: 2px solid #e0e0e0;
                          border-radius: 4px;
                          background: #f5f5f5;
                        "
                      >
                        <img
                          :src="getFilePreview(file)"
                          style="
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                          "
                          class="rounded-borders"
                        />
                      </div>
                      <div class="text-caption text-center q-mb-xs">
                        {{ file.name }}
                      </div>
                      <div class="text-center">
                        <div class="text-caption q-mb-xs">Quantity:</div>
                        <q-btn-group>
                          <q-btn
                            dense
                            size="sm"
                            icon="remove"
                            @click="decreaseQuantity(index)"
                            :disable="fileQuantities[index] <= 1"
                          />
                          <q-btn
                            dense
                            size="sm"
                            :label="fileQuantities[index]"
                            class="q-px-md"
                          />
                          <q-btn
                            dense
                            size="sm"
                            icon="add"
                            @click="increaseQuantity(index)"
                          />
                        </q-btn-group>
                      </div>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
            <div v-if="totalMagnets > 0" class="q-mb-md">
              <q-card class="q-pa-md">
                <div class="text-h6 text-center text-primary">
                  <q-icon name="style" class="q-mr-sm" />
                  Total Magnets: {{ totalMagnets }}
                </div>
                <div v-if="totalCost.total > 0" class="q-mt-sm">
                  <div
                    v-if="totalCost.breakdown.length > 0"
                    class="text-center q-mb-xs"
                  >
                    <div
                      v-for="(item, index) in totalCost.breakdown"
                      :key="index"
                      class="text-caption text-grey-7"
                    >
                      {{ item.count }} × ({{ item.qty }} for ${{
                        (item.price / item.count).toFixed(2)
                      }})
                    </div>
                  </div>
                  <div class="text-h6 text-center text-primary q-mt-xs">
                    <q-icon name="attach_money" class="q-mr-sm" />
                    Total Cost: ${{ totalCost.total.toFixed(2) }}
                  </div>
                </div>
              </q-card>
            </div>

            <!-- Special Instructions -->
            <q-input
              v-model="formData.specialInstructions"
              label="Special Instructions (Optional)"
              type="textarea"
              filled
              rows="3"
              placeholder="Any special requests for your magnets? Size preferences, color adjustments, etc."
            />

            <!-- Product Selection -->
            <div class="q-mb-md">
              <div class="text-subtitle2 q-mb-sm text-weight-medium">
                Product <span class="text-negative">*</span>
                </div>
                <q-select
                  v-model="selectedProductId"
                  :options="productOptions"
                  option-label="description"
                  option-value="id"
                  emit-value
                  map-options
                :label="selectedProduct ? selectedProduct.description : 'Select a product'"
                  filled
                  :rules="[(val) => !!val || 'Please select a product']"
                  :loading="loadingProducts"
                  @update:model-value="onProductChange"
                  :disable="
                    loadingProducts ||
                    !productOptions ||
                    productOptions.length === 0
                  "
                >
                <template v-slot:selected>
                  <div v-if="selectedProduct" class="row items-center full-width">
                    <q-icon name="inventory_2" class="q-mr-sm text-primary" />
                    <span class="text-weight-medium">{{ selectedProduct.description }}</span>
                    <q-chip
                      v-if="selectedProduct.isDefault"
                      color="green"
                      text-color="white"
                      size="sm"
                      icon="star"
                      class="q-ml-sm"
                    >
                      Default
                    </q-chip>
                  </div>
                </template>
                  <template v-slot:option="scope">
                    <q-item
                      v-bind="scope.itemProps"
                      v-if="
                        scope &&
                        scope.opt &&
                        scope.opt.id &&
                        scope.opt.description
                      "
                    >
                      <q-item-section>
                        <q-item-label>{{ scope.opt.description }}</q-item-label>
                        <q-item-label
                          caption
                          v-if="
                            scope.opt.pricing &&
                            typeof scope.opt.pricing === 'object'
                          "
                        >
                          <div
                            v-for="(price, qty) in scope.opt.pricing"
                            :key="String(qty)"
                            class="text-caption"
                          >
                            {{ qty }}x for ${{ Number(price).toFixed(2) }}
                          </div>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side v-if="scope.opt.isDefault">
                        <q-chip
                          color="green"
                          text-color="white"
                          size="sm"
                          icon="star"
                        >
                          Default
                        </q-chip>
                      </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              <!-- Show pricing info below the dropdown when product is selected -->
              <div
                v-if="selectedProduct && selectedProduct.pricing && Object.keys(selectedProduct.pricing).length > 0"
                class="text-caption text-grey-7 q-mt-xs q-ml-sm"
              >
                <div
                  v-for="(price, qty) in selectedProduct.pricing"
                  :key="String(qty)"
                >
                  {{ qty }}x for ${{ Number(price).toFixed(2) }}
                </div>
              </div>
            </div>

            <!-- Payment Options (only show if at market event) -->
            <div v-if="isAtMarketEvent" class="q-mb-md">
              <q-card class="q-pa-md bg-blue-1">
                <div class="text-h6 q-mb-sm text-primary">
                  <q-icon name="payment" class="q-mr-sm" />
                  Payment Options
                </div>
                <q-radio
                  v-model="paymentChoice"
                  val="pay_at_tent"
                  label="Pay at Li'l Magnet Memories Tent"
                  class="q-mb-sm"
                />
                <q-radio
                  v-model="paymentChoice"
                  val="pay_online"
                  label="Pay Online Now"
                  class="q-mb-sm"
                />
                <div
                  v-if="paymentChoice === 'pay_online'"
                  class="text-body2 text-grey-7 q-mt-sm"
                >
                  You'll be taken to the payment form to complete your order.
                </div>
              </q-card>
            </div>

            <!-- Submit Button -->
            <div class="q-mt-lg">
              <q-btn
                color="primary"
                size="lg"
                :loading="submitting"
                type="button"
                class="full-width"
                @click="handleSubmitClick"
              >
                <q-icon name="send" class="q-mr-sm" />
                {{
                  isAtMarketEvent && paymentChoice === 'pay_online'
                    ? 'Continue to Payment'
                    : isAtMarketEvent
                    ? 'Submit Photos for Magnet Creation'
                    : 'Add to Cart'
                }}
              </q-btn>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Order Summary Dialog -->
      <q-dialog v-model="showOrderSummary" persistent>
        <q-card
          class="order-summary-dialog-card"
          style="
            min-width: 400px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
          "
        >
          <q-card-section class="row items-center">
            <q-avatar icon="assignment" color="primary" text-color="white" />
            <span class="q-ml-sm text-h6">Order Summary</span>
          </q-card-section>

          <q-card-section style="flex: 1; overflow-y: auto">
            <div class="q-mb-md">
              <div class="text-h6 text-primary">Order #{{ orderNumber }}</div>
              <div class="text-caption text-grey-6">
                {{ formatDate(new Date()) }}
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium">
                Customer Information
              </div>
              <div>
                <strong>Name:</strong> {{ formData.firstName }}
                {{ formData.lastName }}
              </div>
              <div><strong>Email:</strong> {{ formData.email }}</div>
              <div v-if="formData.phone">
                <strong>Phone:</strong> {{ formData.phone }}
              </div>
              <div v-if="formData.specialInstructions">
                <strong>Special Instructions:</strong>
                <div class="text-grey-7 q-mt-xs">
                  {{ formData.specialInstructions }}
                </div>
              </div>
            </div>

            <div class="q-mb-md">
              <div class="text-subtitle1 text-weight-medium q-mb-sm">Order Details</div>
              
              <!-- Debug info to see what's in cart -->
              <div class="text-caption text-grey-7 q-mb-sm" style="font-size: 10px;">
                Cart: {{ cartItems.length }} item(s) | 
                <span v-if="cartItems && cartItems.length > 0 && cartItems[0]">
                  First item: {{ cartItems[0].isCustomUpload ? 'Custom' : 'Regular' }} | 
                  Has photos: {{ cartItems[0].photos ? 'Yes (' + cartItems[0].photos.length + ')' : 'No' }}
                </span>
              </div>
              
              <!-- Show all cart items -->
              <div v-if="cartItems && cartItems.length > 0">
                <div v-for="(cartItem, cartIndex) in cartItems" :key="cartItem.productId || cartIndex" class="q-mb-md">
                  <!-- Custom Upload Items (with photos) -->
                  <div v-if="cartItem.isCustomUpload">
                    <q-card flat bordered class="q-pa-sm">
                      <div class="row items-center justify-between q-mb-sm">
                        <div class="text-body2 text-weight-medium">
                          {{ cartItem.productName || 'Photo Magnets' }}
                        </div>
                        <q-btn
                          flat
                          dense
                          round
                          size="sm"
                          icon="close"
                          color="negative"
                          @click="removeFromCart(cartItem.productId)"
                        >
                          <q-tooltip>Remove from cart</q-tooltip>
                        </q-btn>
                      </div>
                      
                      <div v-if="cartItem.photos && cartItem.photos.length > 0" class="row q-col-gutter-sm">
                        <div
                          v-for="(photo, photoIndex) in cartItem.photos"
                          :key="photoIndex"
                          class="col-6"
                        >
                          <div class="photo-thumbnail-container" style="position: relative;">
                            <img
                              :src="photo.url || photo.preview || ''"
                              class="photo-thumbnail rounded-borders"
                              alt="Photo thumbnail"
                              style="width: 100%; height: 120px; object-fit: cover;"
                              @error="$event.target.style.display='none'"
                            />
                          </div>
                          <div class="text-caption text-truncate q-mt-xs" :title="photo.name || ''">
                            {{ photo.name || 'Photo' }}
                          </div>
                          <div class="text-caption text-primary">
                            <q-icon name="style" size="12px" class="q-mr-xs" />
                            {{ photo.quantity || 0 }} magnet{{ (photo.quantity || 0) !== 1 ? 's' : '' }}
                          </div>
                        </div>
                      </div>
                      
                      <!-- Show message if no photos in custom upload -->
                      <div v-else class="text-caption text-grey-6 q-pa-sm">
                        No photos attached
                      </div>
                      
                      <div v-if="cartItem.specialInstructions" class="q-mt-sm">
                        <div class="text-caption text-grey-7">
                          <q-icon name="note" size="14px" class="q-mr-xs" />
                          {{ cartItem.specialInstructions }}
                        </div>
                      </div>
                      
                      <div class="q-mt-sm text-right">
                        <span class="text-body2 text-weight-medium">
                          {{ cartItem.quantity || 0 }} magnet{{ (cartItem.quantity || 0) !== 1 ? 's' : '' }}
                        </span>
                      </div>
                    </q-card>
                  </div>
                  
                  <!-- Regular Product Items -->
                  <div v-else>
                    <q-card flat bordered class="q-pa-sm">
                      <div class="row items-center">
                        <div v-if="cartItem.productImage" class="col-auto q-mr-md">
                          <img
                            :src="cartItem.productImage"
                            style="width: 60px; height: 60px; object-fit: cover;"
                            class="rounded-borders"
                            alt="Product"
                          />
                        </div>
                        <div class="col">
                          <div class="text-body2 text-weight-medium">
                            {{ cartItem.productName || 'Product' }}
                          </div>
                          <div class="text-caption text-grey-7">
                            Quantity: {{ cartItem.quantity || 0 }}
                          </div>
                        </div>
                        <div class="col-auto">
                          <q-btn
                            flat
                            dense
                            round
                            size="sm"
                            icon="close"
                            color="negative"
                            @click="removeFromCart(cartItem.productId)"
                          >
                            <q-tooltip>Remove from cart</q-tooltip>
                          </q-btn>
                        </div>
                      </div>
                    </q-card>
                  </div>
                </div>
              </div>
              
              <!-- Fallback: Show message if no cart items -->
              <div v-else class="text-center text-grey-6 q-pa-md">
                <q-icon name="shopping_cart" size="48px" color="grey-4" class="q-mb-sm" />
                <div>No items in cart</div>
              </div>
            </div>

            <q-separator class="q-mb-md" />

            <div class="text-center">
              <div class="text-h6 text-primary">
                <q-icon name="style" class="q-mr-sm" />
                Total: {{ cartTotalMagnets || 0 }} Magnet{{ (cartTotalMagnets || 0) !== 1 ? 's' : '' }}
              </div>
              <div v-if="cartItems && cartItems.length > 0" class="text-body2 text-grey-7 q-mt-xs">
                from {{ cartItems.length }} order{{ cartItems.length !== 1 ? 's' : '' }}
              </div>
            </div>
          </q-card-section>

          <q-card-actions
            align="center"
            class="q-pa-md order-summary-dialog-actions"
            style="flex-shrink: 0; border-top: 1px solid rgba(0, 0, 0, 0.12)"
          >
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="handleCancelOrder"
              class="q-mr-sm"
            />
            <q-btn
              outline
              label="Keep Shopping"
              color="primary"
              icon="shopping_cart"
              @click="handleKeepShopping"
              class="q-mr-sm"
            />
            <q-btn
              label="Submit Order"
              color="primary"
              @click="confirmOrder"
              :loading="submitting"
              class="q-px-lg"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Upload Progress Dialog -->
      <q-dialog v-model="showUploadProgress" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center">
            <q-avatar icon="cloud_upload" color="primary" text-color="white" />
            <span class="q-ml-sm text-h6">Uploading Photos</span>
          </q-card-section>

          <q-card-section>
            <div class="q-mb-md">
              <div class="text-body1 q-mb-sm">
                Uploading {{ uploadProgress.completed }} of
                {{ uploadProgress.total }} photos...
              </div>
              <q-linear-progress
                :value="uploadProgress.overall / 100"
                color="primary"
                size="25px"
                class="q-mt-sm"
              >
                <div class="absolute-full flex flex-center">
                  <span class="text-white text-body2"
                    >{{ uploadProgress.overall }}%</span
                  >
                </div>
              </q-linear-progress>
              <div class="text-caption text-grey-6 q-mt-xs text-center">
                {{ formatBytes(uploadProgress.uploaded) }} of
                {{ formatBytes(uploadProgress.totalSize) }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Market Event Ended Dialog -->
      <q-dialog v-model="showEventEndedDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center">
            <q-avatar icon="event_busy" color="orange" text-color="white" />
            <span class="q-ml-sm text-h6">Market Event Has Ended</span>
          </q-card-section>

          <q-card-section>
            <div class="text-body1 q-mb-md">
              The market event has ended, but we'd love for you to try our easy
              online purchase experience!
            </div>
            <div class="text-body2 text-grey-7">
              You can order custom magnets online from our homepage and have
              them shipped directly to you.
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              label="Return to Main Page"
              color="primary"
              @click="goToMainPage"
              class="q-px-lg"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Information Card -->
      <q-card class="q-mt-md q-pa-md bg-grey-1">
        <q-card-section>
          <div class="text-h6 text-weight-medium q-mb-sm text-primary">
            <q-icon name="info" class="q-mr-sm" />
            What Happens Next?
          </div>
          <q-list dense>
            <!-- Market Event Mode - Pay Online -->
            <template v-if="isAtMarketEvent && paymentChoice === 'pay_online'">
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                    >We'll add this to cart and take you to the payment
                    page</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                    >We'll send you an email notification about your magnets
                    when your order is accepted, in progress, and
                    ready!</q-item-label
                >
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              <q-item-section>
                <q-item-label
                    >Pickup your magnets at the tent</q-item-label
                >
              </q-item-section>
            </q-item>
            </template>

            <!-- Market Event Mode - Pay at Tent -->
            <template v-else-if="isAtMarketEvent && paymentChoice === 'pay_at_tent'">
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >We'll confirm your order details and share with the Magnet
                    Maker at the tent!</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >We'll send you an email notification about your magnets
                    when your order is accepted, in progress, and
                    ready!</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >Pay at the tent and pickup your magnets at the
                    tent</q-item-label
                  >
                </q-item-section>
              </q-item>
            </template>

            <!-- Online Mode (Default) -->
            <template v-else>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >We'll process your payment and send you an order
                    confirmation email</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >We'll create your custom magnets (typically 3-5 business
                    days)</q-item-label
                  >
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
                <q-item-section>
                  <q-item-label
                    >Your magnets will be shipped to your address and you'll
                    receive tracking information</q-item-label
                  >
                </q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useQuasar, useMeta } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { firebaseService } from '../services/firebaseService.js';
import { authService } from '../services/authService.js';
import { auth } from '../firebase/config.js';
import { useCart } from '../composables/useCart.js';
import { signInAnonymously } from 'firebase/auth';
import { marketEventService } from '../services/marketEventService.js';
import {
  useCustomerType,
  CUSTOMER_TYPES,
} from '../composables/useCustomerType.js';

export default {
  name: 'PhotoUploadPage',
  setup() {
    useMeta({
      title: 'Upload Photos - Lil Magnet Memories',
      meta: {
        description: {
          name: 'description',
          content: 'Upload your photos for custom photo magnets. Easy photo upload with preview and cropping tools. Start creating your memories!'
        },
        keywords: {
          name: 'keywords',
          content: 'photo upload, upload images, custom photo magnets, image upload'
        }
      }
    });

    const $q = useQuasar();
    const quasar = $q; // Capture in local variable for safe access
    const router = useRouter();
    const route = useRoute();
    
    // Cart composable
    const { addCustomUploadToCart, removeFromCart, cartItems } = useCart();
    
    // Track the cart item ID if we add one (for removal on cancel)
    const currentCartItemId = ref(null);

    // Get customer type composable once at setup (for reactivity)
    const { isMarketCustomer, setCustomerType } = useCustomerType();

    // Safe notify wrapper
    const safeNotify = (options) => {
      try {
        if (quasar && typeof quasar.notify === 'function') {
          quasar.notify(options);
        } else {
          console.log('Notification not available:', options);
        }
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    };

    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialInstructions: '',
    });

    const selectedFiles = ref([]);
    const fileQuantities = ref([]);
    const submitting = ref(false);
    const showOrderSummary = ref(false);
    const showEventEndedDialog = ref(false);
    const orderNumber = ref('');
    const products = ref([]);
    // Initialize product selection from localStorage immediately (like customer type)
    // This ensures it persists across page refreshes
    const getStoredProductId = () => {
      console.log('🔍 [INIT] getStoredProductId called');
      try {
        const savedData = localStorage.getItem('guestFormData');
        console.log('🔍 [INIT] localStorage guestFormData:', savedData ? 'exists' : 'null');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          console.log('🔍 [INIT] Parsed data:', parsed);
          if (parsed.selectedProductId) {
            console.log('✅ [INIT] Found selectedProductId in localStorage:', parsed.selectedProductId);
            return parsed.selectedProductId;
          } else {
            console.log('⚠️ [INIT] No selectedProductId in parsed data');
          }
        }
      } catch (error) {
        console.error('❌ [INIT] Error reading stored product ID:', error);
      }
      console.log('⚠️ [INIT] Returning null - no product ID found');
      return null;
    };
    const selectedProductId = ref(getStoredProductId());
    console.log('📦 [INIT] selectedProductId initialized to:', selectedProductId.value);
    const loadingProducts = ref(false);
    const paymentChoice = ref('pay_at_tent'); // Default to pay at tent

    // Upload progress tracking
    const uploadProgress = ref({
      overall: 0,
      completed: 0,
      total: 0,
      uploaded: 0,
      totalSize: 0,
    });
    const showUploadProgress = ref(false);

    // Product options for dropdown - ensure it's always an array with valid structure
    const productOptions = computed(() => {
      if (!products.value || !Array.isArray(products.value)) {
        return [];
      }
      return products.value
        .filter((p) => {
          // Only include products that have all required fields
          return (
            p &&
            p.id &&
            p.description &&
            (p.category === 'custom' ||
              (!p.category && (!p.productType || p.productType === 'custom')))
          );
        })
        .map((p) => {
          // Ensure all properties exist and are valid
          return {
            id: String(p.id || ''),
            description: String(p.description || 'Unknown Product'),
            pricing:
              p.pricing && typeof p.pricing === 'object' ? p.pricing : {},
            isDefault: Boolean(p.isDefault),
            category: p.category || null,
            productType: p.productType || null,
          };
        })
        .filter((p) => p.id && p.description); // Final safety check
    });

    // Get selected product object from ID
    const selectedProduct = computed(() => {
      if (!selectedProductId.value) {
        console.log('🔍 selectedProduct: No selectedProductId');
        return null;
      }

      // Try to find in productOptions first
      const foundInOptions = productOptions.value.find((p) => {
        const match = String(p.id) === String(selectedProductId.value);
        if (!match && p.id) {
          console.log(
            '🔍 Comparing:',
            String(p.id),
            'vs',
            String(selectedProductId.value)
          );
        }
        return match;
      });

      if (foundInOptions) {
        console.log(
          '✅ selectedProduct: Found in productOptions:',
          foundInOptions.description
        );
        return foundInOptions;
      }

      // Fallback: try to find in original products array
      const foundInProducts = products.value.find(
        (p) => String(p.id) === String(selectedProductId.value)
      );
      if (foundInProducts) {
        console.log(
          '✅ selectedProduct: Found in products array:',
          foundInProducts.description
        );
        // Normalize it to match productOptions structure
        return {
          id: String(foundInProducts.id || ''),
          description: String(foundInProducts.description || 'Unknown Product'),
          pricing:
            foundInProducts.pricing &&
            typeof foundInProducts.pricing === 'object'
              ? foundInProducts.pricing
              : {},
          isDefault: Boolean(foundInProducts.isDefault),
          category: foundInProducts.category || null,
          productType: foundInProducts.productType || null,
        };
      }

      console.log(
        '⚠️ selectedProduct: Not found! ID:',
        selectedProductId.value,
        'Options count:',
        productOptions.value.length
      );
      return null;
    });
    let marketEventUnsubscribe = null;
    let eventCheckInterval = null;
    const hadEventOnLoad = ref(false);

    // Handler for when product selection changes
    const onProductChange = (newProductId) => {
      console.log('🔄 Product changed to:', newProductId);
      // Force reactivity update by accessing the computed property
      // This ensures totalCost recalculates with the new product pricing
      if (selectedProduct.value) {
        console.log(
          '✅ Selected product updated:',
          selectedProduct.value.description
        );
        console.log('✅ New product pricing:', selectedProduct.value.pricing);
        // Force totalCost to recalculate by accessing it
        const _ = totalCost.value;
      }
    };

    const isValidEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    const totalMagnets = computed(() => {
      return fileQuantities.value.reduce((sum, qty) => sum + qty, 0);
    });
    
    // Calculate total magnets across all cart items for order summary
    const cartTotalMagnets = computed(() => {
      return cartItems.value.reduce((total, item) => {
        if (item.isCustomUpload && item.quantity) {
          return total + item.quantity;
        }
        return total + (item.quantity || 0);
      }, 0);
    });

    // Track checked-in event reactively so computed property updates when events change
    const checkedInEvent = ref(marketEventService.getCheckedInEvent());

    const isMarketRoute = computed(() => route.name === 'photo-upload-market');

    function applyMarketRouteIntent() {
      if (!isMarketRoute.value) return;
      if (!marketEventService.getCheckedInEvent()) return;
      if (isMarketCustomer.value) return;
      setCustomerType(CUSTOMER_TYPES.MARKET);
    }

    // Subscribe to market event changes to update checkedInEvent ref
    const unsubscribeMarketEvents = marketEventService.addListener(() => {
      const currentEvent = marketEventService.getCheckedInEvent();
      checkedInEvent.value = currentEvent;
      applyMarketRouteIntent();
      console.log('🔄 Market event changed, updated checkedInEvent:', currentEvent?.name || 'none');
    });

    // Check if user is at a market event
    // This should respect the user's customer type preference, not just whether there's an active event
    // Use the isMarketCustomer from useCustomerType() called at setup for proper reactivity
    // Use the reactive checkedInEvent ref so it updates when events change
    const isAtMarketEvent = computed(() => {
      const hasActiveEvent = checkedInEvent.value !== null;
      // Only treat as market event if there's an active event AND user is a market customer
      return hasActiveEvent && isMarketCustomer.value;
    });

    // Function to check if event has ended and show dialog
    const checkEventStatus = () => {
      const checkedInEvent = marketEventService.getCheckedInEvent();

      // If there's no checked-in event AND we had an event when page loaded, show dialog
      // This prevents showing dialog on initial load when there's no event (route guard handles that)
      if (!checkedInEvent && hadEventOnLoad.value) {
        // Only show dialog if it's not already showing (to prevent multiple triggers)
        if (!showEventEndedDialog.value) {
          console.log('⚠️ Market event has ended, showing dialog');
          showEventEndedDialog.value = true;
        }
      }
    };

    // Function to redirect to main page
    const goToMainPage = () => {
      router.push('/');
    };

    const totalCost = computed(() => {
      if (
        !selectedProduct.value ||
        !selectedProduct.value.pricing ||
        totalMagnets.value === 0
      ) {
        return { total: 0, breakdown: [] };
      }

      const pricing = selectedProduct.value.pricing;
      const totalQty = totalMagnets.value;

      // Sort tiers from largest to smallest
      const sortedTiers = Object.keys(pricing)
        .map(Number)
        .sort((a, b) => b - a);

      let remainingQty = totalQty;
      let totalCost = 0;
      const breakdown = [];

      // Use a greedy algorithm to find the best combination
      for (const tier of sortedTiers) {
        const count = Math.floor(remainingQty / tier);
        if (count > 0) {
          const tierPrice = pricing[tier] * count;
          totalCost += tierPrice;
          breakdown.push({ qty: tier, count, price: tierPrice });
          remainingQty -= tier * count;
        }
      }

      // Handle any remaining items with the smallest tier
      if (remainingQty > 0 && sortedTiers.length > 0) {
        const smallestTier = sortedTiers[sortedTiers.length - 1];
        const remainingPrice =
          (pricing[smallestTier] / smallestTier) * remainingQty;
        totalCost += remainingPrice;
        breakdown.push({ qty: remainingQty, count: 1, price: remainingPrice });
      }

      return { total: totalCost, breakdown };
    });

    const canSubmit = computed(() => {
      return (
        formData.value.firstName &&
        formData.value.lastName &&
        formData.value.email &&
        isValidEmail(formData.value.email) &&
        selectedFiles.value &&
        selectedFiles.value.length > 0 &&
        totalMagnets.value > 0
      );
    });

    // Refs for input fields and sections
    const firstNameInput = ref(null);
    const lastNameInput = ref(null);
    const emailInput = ref(null);
    const photoUploadSection = ref(null);
    const personalInfoSection = ref(null);

    // Handle submit button click - show validation errors if validation fails
    const handleSubmitClick = (event) => {
        event.preventDefault();
        event.stopPropagation();

      // Check for photos first
      const hasPhotos = selectedFiles.value && selectedFiles.value.length > 0;

      // Check for personal information
      const hasPersonalInfo =
        formData.value.firstName &&
        formData.value.lastName &&
        formData.value.email &&
        isValidEmail(formData.value.email);

      // If no photos, show message and scroll to photo section
      if (!hasPhotos) {
        safeNotify({
          type: 'warning',
          message: 'Please add pictures',
          caption: 'You need to upload at least one photo to continue.',
          position: 'top',
          timeout: 4000,
        });

        setTimeout(() => {
          if (photoUploadSection.value) {
            photoUploadSection.value.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }, 100);
        return;
      }

      // If photos exist but personal info is missing
      if (!hasPersonalInfo) {
        const missingFields = [];
        if (!formData.value.firstName) missingFields.push('First Name');
        if (!formData.value.lastName) missingFields.push('Last Name');
        if (!formData.value.email) {
          missingFields.push('Email');
        } else if (!isValidEmail(formData.value.email)) {
          missingFields.push('Valid Email');
        }

          safeNotify({
            type: 'warning',
          message: 'Please add your personal information',
          caption: `Please fill in: ${missingFields.join(', ')}`,
            position: 'top',
            timeout: 4000,
          });

        // Scroll to personal info section
          setTimeout(() => {
          if (personalInfoSection.value) {
            personalInfoSection.value.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
          }
          // Also focus on first missing field
          if (!formData.value.firstName && firstNameInput.value) {
            setTimeout(() => {
              firstNameInput.value.focus();
            }, 300);
            } else if (!formData.value.lastName && lastNameInput.value) {
            setTimeout(() => {
              lastNameInput.value.focus();
            }, 300);
            } else if (
              (!formData.value.email || !isValidEmail(formData.value.email)) &&
              emailInput.value
            ) {
            setTimeout(() => {
              emailInput.value.focus();
            }, 300);
            }
          }, 100);
        return;
        }

      // If all validation passes, proceed with submission
      if (canSubmit.value) {
        onSubmit();
      }
    };

    const getFilePreview = (file) => {
      return URL.createObjectURL(file);
    };

    const onRejected = () => {
      safeNotify({
        type: 'negative',
        message:
          'Some files were rejected. Please make sure they are image files.',
        caption: 'Accepted formats: JPG, PNG, GIF, WebP',
      });
    };

    const onFileSelected = (files) => {
      selectedFiles.value = files;
      // Initialize quantities to 1 for each file
      fileQuantities.value = files.map(() => 1);
    };

    const increaseQuantity = (index) => {
      fileQuantities.value[index]++;
    };

    const decreaseQuantity = (index) => {
      if (fileQuantities.value[index] > 1) {
        fileQuantities.value[index]--;
      }
    };

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1);
      fileQuantities.value.splice(index, 1);
    };

    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const time = now.getTime().toString().slice(-4);
      return `LMM-${year}${month}${day}-${time}`;
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString();
    };

    const formatBytes = (bytes) => {
      if (!bytes || bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };
    
    const handleCancelOrder = () => {
      // Remove item from cart if it was added
      if (currentCartItemId.value) {
        console.log('Removing cart item due to cancel:', currentCartItemId.value);
        removeFromCart(currentCartItemId.value);
        currentCartItemId.value = null;
      }
      showOrderSummary.value = false;
    };
    
    const handleKeepShopping = () => {
      // Item stays in cart - just close dialog and navigate to main page
      console.log('Keeping item in cart and returning to main page');
      showOrderSummary.value = false;
      // Reset the current cart item ID since we're keeping it
      currentCartItemId.value = null;
      // Navigate to main page
      router.push('/');
    };

    const confirmOrder = async () => {
      showOrderSummary.value = false;
      submitting.value = true;
      showUploadProgress.value = false; // Don't show upload progress since photos are already uploaded

      // Save form data to localStorage for non-authenticated users
      saveFormDataToLocalStorage();

      try {
        // Prepare customer data from ALL cart items
        const allPhotos = [];
        const allQuantities = [];
        let totalMagnetsCount = 0;
        let totalCostAmount = 0;
        
        // Collect all photos and quantities from cart items
        cartItems.value.forEach(item => {
          if (item.isCustomUpload && item.photos) {
            item.photos.forEach(photo => {
              // Only include defined fields
              const photoData = {
                url: photo.url || '',
                name: photo.name || '',
              };
              // Only add path if it's defined and not empty
              if (photo.path) {
                photoData.path = photo.path;
              }
              allPhotos.push(photoData);
              allQuantities.push(photo.quantity || 1);
              totalMagnetsCount += (photo.quantity || 1);
            });
            // Add the item's total cost
            if (item.totalCost) {
              totalCostAmount += typeof item.totalCost === 'object' ? item.totalCost.total : item.totalCost;
            }
          }
        });

        const customerData = {
          firstName: formData.value.firstName || '',
          lastName: formData.value.lastName || '',
          email: formData.value.email || '',
          phone: formData.value.phone || '',
          specialInstructions: formData.value.specialInstructions || '',
          photos: allPhotos,
          quantities: allQuantities,
          orderNumber: orderNumber.value,
          totalMagnets: totalMagnetsCount,
          userId: currentUser.value?.uid || null,
          subtotal: totalCostAmount,
          shipping: 0, // Market event orders don't have shipping
          tax: 0,
          totalAmount: totalCostAmount,
          paymentOption: isAtMarketEvent.value && paymentChoice.value === 'pay_at_tent'
            ? {
                type: 'pay_at_event',
                amount: totalCostAmount,
              }
            : null,
          shippingOption: null, // Market event orders are pickup
          photosAlreadyUploaded: true, // Flag to skip re-uploading photos
        };

        console.log('Submitting order with all cart items:', {
          totalItems: cartItems.value.length,
          totalPhotos: allPhotos.length,
          totalMagnets: totalMagnetsCount,
          totalCost: totalCostAmount
        });

        let savedOrder = null;

        // Save to Firebase (photos already uploaded, just save order)
        try {
          console.log('Attempting to save order to Firebase...');
          savedOrder = await firebaseService.saveOrder(customerData);
          console.log('Order saved to Firebase successfully:', savedOrder);
        } catch (error) {
          console.error('Firebase save failed:', error);
          throw error; // Re-throw to show error to user
        }

        // Prepare order data for thank you page
        const orderData = {
          orderNumber: orderNumber.value,
          customerName: `${formData.value.firstName} ${formData.value.lastName}`,
          customerEmail: formData.value.email,
          totalMagnets: totalMagnetsCount,
          subtotal: customerData.subtotal,
          shipping: customerData.shipping,
          tax: customerData.tax,
          totalAmount: customerData.totalAmount,
          paymentOption: customerData.paymentOption,
          shippingOption: customerData.shippingOption,
        };

        // Store in localStorage as backup
        localStorage.setItem('lastOrderData', JSON.stringify(orderData));

        // Reset form
        formData.value = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          specialInstructions: '',
        };
        selectedFiles.value = [];
        fileQuantities.value = [];
        
        // Clear ALL cart items after successful order
        const { clearCart } = useCart();
        await clearCart();
        currentCartItemId.value = null;
        console.log('All cart items cleared after order submission');

        // Show success notification
        try {
          safeNotify({
            type: 'positive',
            message: 'Order submitted successfully!',
            caption: 'Your order has been saved and we will contact you soon.',
            position: 'top',
          });
        } catch (notifyError) {
          console.log('Notification error (non-critical):', notifyError);
        }

        // Redirect to thank you page with order details
        try {
          router.push({
            path: '/thank-you',
            query: orderData,
          });
        } catch (routerError) {
          console.error('Router error:', routerError);
          // Fallback: redirect using window.location
          const queryString = new URLSearchParams(orderData).toString();
          window.location.href = `/thank-you?${queryString}`;
        }
      } catch (error) {
        console.error('Order submission error:', error);
        // Only show notification if $q is available
        safeNotify({
          type: 'negative',
          message: 'Failed to submit order',
          caption: 'Please try again or contact us directly.',
          position: 'top',
        });
      } finally {
        submitting.value = false;
        showUploadProgress.value = false;
      }
    };

    const onSubmit = async () => {
      // Save form data to localStorage for non-authenticated users
      saveFormDataToLocalStorage();

      // If at market event and user chose to pay online, route to checkout
      if (isAtMarketEvent.value && paymentChoice.value === 'pay_online') {
        // Generate order number
        orderNumber.value = generateOrderNumber();

        // Calculate total cost
        const total = totalCost.value.total;

        // Upload photos to Firebase Storage first to get persistent URLs
        submitting.value = true;
        showUploadProgress.value = true;
        uploadProgress.value = {
          overall: 0,
          completed: 0,
          total: selectedFiles.value.length,
          uploaded: 0,
          totalSize: selectedFiles.value.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          ),
        };
        try {
          console.log('📤 Uploading photos to Firebase Storage for cart...');
          const uploadedPhotos = await firebaseService.uploadPhotos(
            selectedFiles.value,
            (progress) => {
              uploadProgress.value = progress;
            }
          );
          console.log(
            '✅ Photos uploaded successfully:',
            uploadedPhotos.length
          );

          // Prepare photos with download URLs and quantities for cart
          // Convert files to base64 for persistence across devices
          const photosForCart = await Promise.all(
            uploadedPhotos.map(async (uploadedPhoto, index) => {
              const file = selectedFiles.value[index];
              let base64Preview = null;
              if (file) {
                try {
                  base64Preview = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                } catch (error) {
                  console.warn('Failed to convert file to base64:', error);
                }
              }
              return {
                name: uploadedPhoto.name,
                url: uploadedPhoto.url, // Persistent Firebase Storage URL
                preview: base64Preview || uploadedPhoto.url, // Use base64 for cross-device compatibility
                fileName: uploadedPhoto.fileName,
                size: uploadedPhoto.size,
                type: uploadedPhoto.type,
                quantity: fileQuantities.value[index] || 1,
              };
            })
          );

          // Add order to cart with persistent photo URLs and market event context
          addCustomUploadToCart({
            productName:
              selectedProduct.value?.description || 'Custom Photo Magnets',
            photos: photosForCart,
            quantities: fileQuantities.value,
            specialInstructions: formData.value.specialInstructions,
            totalMagnets: totalMagnets.value,
            totalCost: totalCost.value,
            costBreakdown: totalCost.value.breakdown,
            pricing: selectedProduct.value?.pricing || {},
            marketEventContext: true, // Flag to remember this is from market event
            formData: {
              firstName: formData.value.firstName,
              lastName: formData.value.lastName,
              email: formData.value.email,
              phone: formData.value.phone,
              specialInstructions: formData.value.specialInstructions,
            },
          });

          submitting.value = false;
          showUploadProgress.value = false;

          // Show success notification
          safeNotify({
            type: 'positive',
            message: 'Photos added to cart!',
            position: 'top',
          });

          // Route directly to checkout with skipShipping and customTotal
          router.push({
            path: '/checkout',
            query: {
              customTotal: total.toFixed(2),
              skipShipping: '1',
              orderNumber: orderNumber.value,
              context: 'market_event',
              firstName: formData.value.firstName,
              lastName: formData.value.lastName,
              email: formData.value.email,
              phone: formData.value.phone || '',
            },
          });
          return;
        } catch (error) {
          console.error('❌ Error uploading photos for cart:', error);
          submitting.value = false;
          showUploadProgress.value = false;
          safeNotify({
            type: 'negative',
            message: 'Failed to upload photos',
            caption: error.message || 'Please try again',
            position: 'top',
          });
        }
      }

      // If NOT at market event (online order), add to cart and go to cart
      if (!isAtMarketEvent.value) {
        // Upload photos to Firebase Storage first to get persistent URLs
        submitting.value = true;
        showUploadProgress.value = true;
        uploadProgress.value = {
          overall: 0,
          completed: 0,
          total: selectedFiles.value.length,
          uploaded: 0,
          totalSize: selectedFiles.value.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          ),
        };
        try {
          console.log('📤 Uploading photos to Firebase Storage for cart...');
          const uploadedPhotos = await firebaseService.uploadPhotos(
            selectedFiles.value,
            (progress) => {
              uploadProgress.value = progress;
            }
          );
          console.log(
            '✅ Photos uploaded successfully:',
            uploadedPhotos.length
          );

          // Prepare photos with download URLs and quantities for cart
          const photosForCart = await Promise.all(
            uploadedPhotos.map(async (uploadedPhoto, index) => {
              const file = selectedFiles.value[index];
              let base64Preview = null;
              if (file) {
                try {
                  base64Preview = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });
                } catch (error) {
                  console.warn('Failed to convert file to base64:', error);
                }
              }
              return {
                name: uploadedPhoto.name,
                url: uploadedPhoto.url, // Persistent Firebase Storage URL
                preview: base64Preview || uploadedPhoto.url,
                fileName: uploadedPhoto.fileName,
                size: uploadedPhoto.size,
                type: uploadedPhoto.type,
                quantity: fileQuantities.value[index] || 1,
              };
            })
          );

          // Add order to cart (no market event context for online orders)
          addCustomUploadToCart({
            productName:
              selectedProduct.value?.description || 'Custom Photo Magnets',
            photos: photosForCart,
            quantities: fileQuantities.value,
            specialInstructions: formData.value.specialInstructions,
            totalMagnets: totalMagnets.value,
            totalCost: totalCost.value,
            costBreakdown: totalCost.value.breakdown,
            pricing: selectedProduct.value?.pricing || {},
            marketEventContext: false, // Online orders don't have market event context
            formData: {
              firstName: formData.value.firstName,
              lastName: formData.value.lastName,
              email: formData.value.email,
              phone: formData.value.phone,
              specialInstructions: formData.value.specialInstructions,
            },
          });

          submitting.value = false;
          showUploadProgress.value = false;

          // Show success notification
          safeNotify({
            type: 'positive',
            message: 'Added to cart!',
            caption: `${totalMagnets.value} magnets added to your cart`,
            position: 'top',
            timeout: 3000,
          });

          // Navigate to cart page
          try {
            await router.push('/cart');
          } catch (error) {
            console.error('Failed to navigate to cart:', error);
            safeNotify({
              type: 'warning',
              message: 'Added to cart, but navigation failed',
              caption: 'Please open the cart manually.',
              position: 'top',
              timeout: 4000,
            });
          }
          return;
        } catch (error) {
          console.error('❌ Error uploading photos for cart:', error);
          submitting.value = false;
          showUploadProgress.value = false;
          safeNotify({
            type: 'negative',
            message: 'Failed to upload photos',
            caption: error.message || 'Please try again',
            position: 'top',
          });
        }
      }

      // Otherwise, show order summary dialog (default behavior)
      // For market events, upload photos first and add to cart
      if (isAtMarketEvent.value) {
        submitting.value = true;
        showUploadProgress.value = true;
        uploadProgress.value = {
          overall: 0,
          completed: 0,
          total: selectedFiles.value.length,
          uploaded: 0,
          totalSize: selectedFiles.value.reduce(
            (sum, file) => sum + (file.size || 0),
            0
          ),
        };
        
        try {
          console.log('📤 Uploading photos to Firebase Storage before showing order summary...');
          const uploadedPhotos = await firebaseService.uploadPhotos(
            selectedFiles.value,
            (progress) => {
              uploadProgress.value = progress;
            }
          );
          console.log('✅ Photos uploaded successfully:', uploadedPhotos.length);
          
          // Prepare photos data with URLs and quantities (ensure no undefined values)
          const photosForCart = uploadedPhotos.map((uploadedPhoto, index) => ({
            name: uploadedPhoto.name || '',
            url: uploadedPhoto.url || '',
            path: uploadedPhoto.path || '',
            quantity: fileQuantities.value[index] || 1
          }));
          
          // Add to cart using the cart composable
          const uploadData = {
            productName: selectedProduct.value?.description || 'Magnet',
            photos: photosForCart,
            quantities: fileQuantities.value || [],
            specialInstructions: formData.value.specialInstructions || '',
            totalMagnets: totalMagnets.value,
            totalCost: totalCost.value,
            costBreakdown: [], // Can add breakdown if needed
            pricing: selectedProduct.value?.pricing || {},
            marketEventContext: true,
            formData: {
              firstName: formData.value.firstName || '',
              lastName: formData.value.lastName || '',
              email: formData.value.email || '',
              phone: formData.value.phone || '',
              specialInstructions: formData.value.specialInstructions || '',
            }
          };
          
          addCustomUploadToCart(uploadData);
          
          // Store the cart item ID for potential removal on cancel
          // Find the item we just added (it's the last one with marketEventContext)
          const addedItem = cartItems.value.find(item => 
            item.isCustomUpload && 
            item.marketEventContext && 
            item.photos?.length === photosForCart.length
          );
          if (addedItem) {
            currentCartItemId.value = addedItem.productId;
            console.log('✅ Added item to cart with ID:', currentCartItemId.value);
          }
          
          submitting.value = false;
          showUploadProgress.value = false;
          
        } catch (error) {
          console.error('❌ Error uploading photos:', error);
          submitting.value = false;
          showUploadProgress.value = false;
          safeNotify({
            type: 'negative',
            message: 'Failed to upload photos',
            caption: error.message || 'Please try again',
            position: 'top',
          });
          return;
        }
      }
      
      orderNumber.value = generateOrderNumber();
      showOrderSummary.value = true;
    };

    // Authentication state
    const isAuthenticated = ref(false);
    const currentUser = ref(null);
    const signingIn = ref(false);

    const handleGoogleSignIn = async () => {
      // Check if popups are likely blocked
      const popupBlocked = checkPopupBlocked();
      if (popupBlocked) {
        safeNotify({
          type: 'warning',
          message: 'Popup blocked detected',
          caption: 'Please allow popups for this site and try again.',
          position: 'top',
          timeout: 5000,
        });
        return;
      }

      signingIn.value = true;

      // Shorter timeout for better UX
      const timeoutId = setTimeout(() => {
        if (signingIn.value) {
          console.log('Sign-in timeout, resetting state');
          signingIn.value = false;
          safeNotify({
            type: 'negative',
            message: 'Sign-in timed out',
            caption:
              'The popup may have been blocked. Please check your browser settings.',
            position: 'top',
            timeout: 8000,
            actions: [
              {
                label: 'Try Again',
                color: 'white',
                handler: () => handleGoogleSignIn(),
              },
            ],
          });
        }
      }, 15000); // 15 second timeout

      try {
        console.log('Starting Google sign-in...');
        console.log('Current domain:', window.location.origin);

        await authService.signInWithGoogle();
        console.log('Google sign-in successful');

        safeNotify({
          type: 'positive',
          message: 'Successfully signed in!',
          caption: 'Your information has been filled automatically.',
          position: 'top',
        });
      } catch (error) {
        console.error('Sign in error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);

        // Handle specific error cases with better guidance
        let errorMessage = 'Failed to sign in. Please try again.';
        let caption = '';

        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in was cancelled';
          caption = 'Please complete the sign-in process in the popup window.';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Sign-in popup was blocked';
          caption = 'Please allow popups for this site and try again.';
        } else if (error.code === 'auth/unauthorized-domain') {
          errorMessage = 'Domain not authorized';
          caption = 'This domain is not authorized for Google sign-in.';
        } else if (error.code === 'auth/operation-not-allowed') {
          errorMessage = 'Google sign-in not enabled';
          caption = 'Google sign-in is not enabled for this project.';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Network error';
          caption = 'Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Sign-in timed out';
          caption = 'The sign-in process took too long. Please try again.';
        }

        safeNotify({
          type: 'negative',
          message: errorMessage,
          caption: caption,
          position: 'top',
          timeout: 8000,
          actions: [
            {
              label: 'Try Again',
              color: 'white',
              handler: () => handleGoogleSignIn(),
            },
          ],
        });
      } finally {
        console.log('Resetting signingIn state');
        clearTimeout(timeoutId);
        signingIn.value = false;
      }
    };

    // Helper function to detect popup blocking
    const checkPopupBlocked = () => {
      try {
        const popup = window.open('', '_blank', 'width=1,height=1');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          return true;
        }
        popup.close();
        return false;
      } catch (e) {
        return true;
      }
    };

    const fillFormWithUserData = (user) => {
      if (user) {
        // Fill name fields
        if (user.displayName) {
          const nameParts = user.displayName.split(' ');
          formData.value.firstName = nameParts[0] || '';
          formData.value.lastName = nameParts.slice(1).join(' ') || '';
        }

        // Fill email field
        if (user.email) {
          formData.value.email = user.email;
        }
      }
    };

    // Save form data to localStorage for non-authenticated users
    const saveFormDataToLocalStorage = () => {
      if (!isAuthenticated.value) {
        try {
          const dataToSave = {
            firstName: formData.value.firstName,
            lastName: formData.value.lastName,
            email: formData.value.email,
            phone: formData.value.phone,
            selectedProductId: selectedProductId.value,
          };
          localStorage.setItem('guestFormData', JSON.stringify(dataToSave));
          console.log('💾 [SAVE] Saved to localStorage:', {
            selectedProductId: selectedProductId.value,
            fullData: dataToSave
          });
        } catch (error) {
          console.error('❌ [SAVE] Error saving form data to localStorage:', error);
        }
      } else {
        console.log('⚠️ [SAVE] Skipping save - user is authenticated');
      }
    };

    // Load form data from localStorage for non-authenticated users
    const loadFormDataFromLocalStorage = () => {
      if (!isAuthenticated.value) {
        try {
          const savedData = localStorage.getItem('guestFormData');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (parsed.firstName) formData.value.firstName = parsed.firstName;
            if (parsed.lastName) formData.value.lastName = parsed.lastName;
            if (parsed.email) formData.value.email = parsed.email;
            if (parsed.phone) formData.value.phone = parsed.phone;
            // Product selection will be restored by the productOptions watch
            // which checks localStorage when products are loaded
          }
        } catch (error) {
          console.error('Error loading form data from localStorage:', error);
        }
      }
    };

    const loadProducts = async (retryCount = 0) => {
      const maxRetries = 3;
      console.log('🔄 [LOAD] loadProducts called, retry:', retryCount);
      console.log('🔄 [LOAD] Current selectedProductId:', selectedProductId.value);
      loadingProducts.value = true;
      try {
        // Non-admins should not see testing products
        const isAdmin = authService.isAdmin();
        console.log('🔄 [LOAD] Fetching products, isAdmin:', isAdmin);
        const productsData = await firebaseService.getProducts(isAdmin);
        products.value = productsData || [];
        console.log('🔄 [LOAD] Products loaded:', products.value.length, 'products');

        // If no products and we haven't exceeded retries, retry
        if (products.value.length === 0 && retryCount < maxRetries) {
          console.log(`⏳ [LOAD] No products returned, retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
          loadingProducts.value = false;
          return loadProducts(retryCount + 1);
        }

        // Determine which product to select
        let productToSelect = null;

        // PRIORITY 1: Check route query parameter first (most recent user action - coming from product page)
        // This takes precedence over localStorage since it represents the current user intent
        if (route.query.productId) {
          console.log('🔍 [LOAD] Checking route query for productId (priority):', route.query.productId);
          productToSelect = products.value.find(
            (p) => String(p.id) === String(route.query.productId)
          );
          if (productToSelect) {
            console.log('✅ [LOAD] Found product from route query:', productToSelect.description);
            // Save it to localStorage for anonymous users
            if (!isAuthenticated.value) {
              try {
                const savedData = localStorage.getItem('guestFormData');
                const dataToSave = savedData ? JSON.parse(savedData) : {};
                dataToSave.selectedProductId = productToSelect.id;
                localStorage.setItem('guestFormData', JSON.stringify(dataToSave));
                console.log(
                  '✅ [LOAD] Saved route product to localStorage:',
                  productToSelect.description
                );
              } catch (error) {
                console.error('❌ [LOAD] Error saving route product to localStorage:', error);
              }
            }
          } else {
            console.log('⚠️ [LOAD] Route query productId not found in products:', route.query.productId);
          }
        }

        // PRIORITY 2: If no route query, check if product ID is already set (from localStorage initialization)
        // BUT only if we have products loaded - don't clear if products array is empty yet
        if (!productToSelect && selectedProductId.value) {
          console.log('🔍 [LOAD] Checking if selectedProductId exists in products:', selectedProductId.value);
          console.log('🔍 [LOAD] Products array length:', products.value.length);

          if (products.value.length > 0) {
            // Products are loaded, verify the selection exists
            const existingProduct = products.value.find(
              (p) => String(p.id) === String(selectedProductId.value)
            );
            if (existingProduct) {
              productToSelect = existingProduct;
              console.log(
                '✅ [LOAD] Product already selected from localStorage, verified in products:',
                existingProduct.description
              );
            } else {
              console.log('⚠️ [LOAD] Selected product ID not found in products array:', selectedProductId.value);
              console.log('⚠️ [LOAD] Available product IDs:', products.value.map(p => p.id));
              // Product doesn't exist, clear the selection
              selectedProductId.value = null;
              console.log('⚠️ [LOAD] Cleared selectedProductId because product not found');
            }
          } else {
            // Products not loaded yet, keep the selection and verify later via watch
            console.log('⏳ [LOAD] Products not loaded yet, keeping selectedProductId for later verification:', selectedProductId.value);
            // Don't clear it - the watch will handle verification when products load
            // Don't set productToSelect either - we'll verify in the watch
            // Exit early and let the watch handle restoration when products are ready
            loadingProducts.value = false;
            return;
          }
        } else if (!productToSelect) {
          console.log('⚠️ [LOAD] No selectedProductId set, will look for defaults');
        }

        // Only set defaults if we have products loaded AND no product is already selected
        if (!productToSelect && products.value.length > 0) {
        // If not found in route, check for default product
          console.log('🔍 [LOAD] Looking for default product');
          productToSelect = products.value.find((p) => p.isDefault === true);
          if (productToSelect) {
            console.log('✅ [LOAD] Found default product:', productToSelect.description);
        }

        // If still not found, use first custom product
        if (!productToSelect) {
            console.log('🔍 [LOAD] Looking for first custom product');
          productToSelect = products.value.find(
            (p) =>
              p.category === 'custom' ||
              (!p.category && (!p.productType || p.productType === 'custom'))
          );
            if (productToSelect) {
              console.log('✅ [LOAD] Found first custom product:', productToSelect.description);
            }
          }
        } else if (!productToSelect && products.value.length === 0) {
          console.log('⏳ [LOAD] No products loaded yet, skipping default selection (will be handled by watch)');
        }

        // Set selected product after products are loaded
        // Use a small delay to ensure productOptions computed has updated
        await nextTick();
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (productToSelect) {
          // Set the product ID (q-select will handle the rest)
          // Use nextTick to ensure the select component is ready
          await nextTick();
          console.log('🔄 [LOAD] Setting selectedProductId to:', productToSelect.id, productToSelect.description);
          selectedProductId.value = productToSelect.id;
          console.log(
            '✅ [LOAD] Selected product ID set:',
            productToSelect.id,
            productToSelect.description,
            productToSelect.isDefault ? '(default)' : ''
          );
          // Save to localStorage for anonymous users (if not already saved above)
          if (!isAuthenticated.value) {
            console.log('💾 [LOAD] Saving to localStorage');
            saveFormDataToLocalStorage();
          }
          // Force a small delay to ensure reactive updates
          await new Promise((resolve) => setTimeout(resolve, 50));
        } else {
          console.warn(
            '⚠️ [LOAD] No product to select - no default product found and no route query productId'
          );
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        loadingProducts.value = false;
      }
    };

    // Helper to check if user is anonymous (no email means anonymous)
    const isAnonymousUser = (user) => {
      return user && user.providerId === 'firebase' && !user.email;
    };

    onMounted(async () => {
      // The route guard handles blocking access when there's no active event
      // This onMounted sets up the page and auto-checks in anonymous users

      // Restore product selection from localStorage immediately (before loading products)
      // Only restore if not already set and user is not authenticated
      console.log('🔄 [MOUNT] onMounted called, current selectedProductId:', selectedProductId.value);
      if (!selectedProductId.value) {
        console.log('🔍 [MOUNT] No product selected, checking localStorage');
        const storedId = getStoredProductId();
        if (storedId) {
          selectedProductId.value = storedId;
          console.log('✅ [MOUNT] Restored product ID from localStorage on mount:', storedId);
        } else {
          console.log('⚠️ [MOUNT] No product ID found in localStorage');
        }
      } else {
        console.log('✅ [MOUNT] Product already selected, skipping localStorage check');
      }

      try {
        applyMarketRouteIntent();

        // Wait a moment for market event service to fully load events
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Check for active event (sync version first for speed)
        const activeEvent = marketEventService.getActiveEventSync();

        // Only auto-set to market customer if:
        // 1. Anonymous user
        // 2. There's an active event
        // 3. User hasn't already set a preference (check localStorage)
        if (activeEvent && !isAuthenticated.value) {
          // Only auto-set if user hasn't explicitly chosen a mode
          // Check if there's a stored preference
          const storedType = localStorage.getItem('lil-magnet-customer-type');
          if (!storedType) {
            // No preference set - auto-set to market for anonymous users at events
          setCustomerType(CUSTOMER_TYPES.MARKET);
          console.log(
            '✅ Anonymous user auto-checked in to active market event:',
            activeEvent.name
          );
          } else {
            // User has a preference - respect it
            console.log(
              'ℹ️ User has existing customer type preference:',
              storedType,
              '- respecting it'
            );
          }
        }

        // Check for active checked-in event (async version)
        const checkedInEvent =
          await marketEventService.getCheckedInEventAsync();

        if (checkedInEvent) {
          console.log(
            '✅ Active checked-in market event found:',
            checkedInEvent.name
          );
          // Mark that we had an event when page loaded
          hadEventOnLoad.value = true;
        } else {
          console.log('⚠️ No active checked-in market event found');
          // Don't redirect here - route guard already handled it for new navigations
          // If we're here on refresh, it means the route guard allowed it, so stay on page
          // But don't mark hadEventOnLoad as true, so dialog won't show on initial load
        }

        applyMarketRouteIntent();
      } catch (error) {
        console.error('Error checking for market event:', error);
        // Don't redirect on error - let user stay on page
      }

      // Check if user is already authenticated immediately
      const currentAuthUser = authService.getCurrentUser();
      if (currentAuthUser && !isAnonymousUser(currentAuthUser)) {
        console.log(
          'User already authenticated on upload page:',
          currentAuthUser
        );
        isAuthenticated.value = true;
        currentUser.value = currentAuthUser;
        fillFormWithUserData(currentAuthUser);
      } else {
        // Load saved form data from localStorage for non-authenticated users
        loadFormDataFromLocalStorage();
      }

      // Listen for auth state changes
      authService.onAuthStateChanged((user) => {
        // Only treat non-anonymous users as authenticated for UI
        const isRealUser = user && !isAnonymousUser(user);
        isAuthenticated.value = isRealUser;
        currentUser.value = isRealUser ? user : null;

        // Pre-fill form data if user is authenticated (and not anonymous)
        if (isRealUser) {
          fillFormWithUserData(user);
        } else {
          // Load saved form data from localStorage when user signs out
          loadFormDataFromLocalStorage();
        }
      });

      // Handler for when product selection changes
      const onProductChange = (newProductId) => {
        console.log('🔄 Product changed to:', newProductId);
        // Force reactivity update by accessing the computed property
        // This ensures totalCost recalculates with the new product pricing
        if (selectedProduct.value) {
          console.log(
            '✅ Selected product updated:',
            selectedProduct.value.description
          );
          console.log('✅ New product pricing:', selectedProduct.value.pricing);
          // Force totalCost to recalculate by accessing it
          const _ = totalCost.value;
        }
        // Save product selection to localStorage
        saveFormDataToLocalStorage();
      };

      // Load products
      loadProducts();

      // Watch selectedProductId to ensure totalCost updates when product changes
      watch(selectedProductId, (newId, oldId) => {
        console.log('🔄 [WATCH-ID] selectedProductId changed from', oldId, 'to', newId);
        if (newId !== oldId && newId) {
          console.log('🔄 [WATCH-ID] Product ID changed from', oldId, 'to', newId);
          // Force reactivity update - totalCost computed should automatically recalculate
          if (selectedProduct.value) {
            console.log(
              '✅ [WATCH-ID] Product changed, totalCost will recalculate for:',
              selectedProduct.value.description
            );
          }
          // Save product selection to localStorage when it changes
          console.log('💾 [WATCH-ID] Saving product selection to localStorage');
          saveFormDataToLocalStorage();
        } else if (newId === null && oldId !== null) {
          console.log('⚠️ [WATCH-ID] Product ID was cleared (set to null)');
        }
      });

      // Watch productOptions to sync selectedProductId when options change
      watch(
        productOptions,
        (newOptions) => {
          console.log('🔄 [WATCH] productOptions changed, count:', newOptions.length);
          console.log('🔄 [WATCH] Current selectedProductId:', selectedProductId.value);
          if (newOptions.length > 0) {
            // PRIORITY 1: Check route query parameter first (most recent user action - coming from product page)
            if (route.query.productId) {
              const routeProduct = newOptions.find(
                (p) => String(p.id) === String(route.query.productId)
              );
              if (routeProduct) {
                selectedProductId.value = routeProduct.id;
                console.log('✅ [WATCH] Selected product from route query (priority):', routeProduct.description);
                // Save it to localStorage for anonymous users
                if (!isAuthenticated.value) {
                  try {
                    const savedData = localStorage.getItem('guestFormData');
                    const dataToSave = savedData ? JSON.parse(savedData) : {};
                    dataToSave.selectedProductId = routeProduct.id;
                    localStorage.setItem('guestFormData', JSON.stringify(dataToSave));
                    console.log('✅ [WATCH] Saved route product to localStorage');
                  } catch (error) {
                    console.error('❌ [WATCH] Error saving route product to localStorage:', error);
                  }
                }
                return; // Exit early since we've set the product from route
              } else {
                console.log('⚠️ [WATCH] Route query productId not found in options:', route.query.productId);
              }
            }

            // PRIORITY 2: If we have a selectedProductId, verify it exists in the newly loaded options
            if (selectedProductId.value) {
              console.log('🔍 [WATCH] Verifying selectedProductId exists in options:', selectedProductId.value);
              const existingProduct = newOptions.find(
                (p) => String(p.id) === String(selectedProductId.value)
              );
              if (existingProduct) {
                console.log('✅ [WATCH] Selected product verified in options:', existingProduct.description);
                // Product exists and is verified - we're done, don't change anything
                return;
              } else {
                console.log('⚠️ [WATCH] Selected product ID not found in options:', selectedProductId.value);
                console.log('⚠️ [WATCH] Available product IDs:', newOptions.map(p => p.id));
                // Product doesn't exist, clear it so we can try to restore from localStorage
                selectedProductId.value = null;
                console.log('⚠️ [WATCH] Cleared selectedProductId, will try to restore from localStorage');
              }
            }

            // PRIORITY 2: If no product is selected, try to restore from localStorage
            if (!selectedProductId.value && !isAuthenticated.value) {
              console.log('🔍 [WATCH] No product selected and not authenticated, checking localStorage');
              try {
                const savedData = localStorage.getItem('guestFormData');
                console.log('🔍 [WATCH] localStorage data:', savedData ? 'exists' : 'null');
                if (savedData) {
                  const parsed = JSON.parse(savedData);
                  console.log('🔍 [WATCH] Parsed data:', parsed);
                  if (parsed.selectedProductId) {
                    console.log('🔍 [WATCH] Looking for product ID in options:', parsed.selectedProductId);
                    const savedProduct = newOptions.find(
                      (p) => String(p.id) === String(parsed.selectedProductId)
                    );
                    if (savedProduct) {
                      selectedProductId.value = parsed.selectedProductId;
                console.log(
                        '✅ [WATCH] Restored product selection from localStorage:',
                        savedProduct.description
                      );
                      // Save it back to ensure it's persisted
                      saveFormDataToLocalStorage();
                      return; // Exit early - we're done
                    } else {
                      console.log('⚠️ [WATCH] Saved product ID not found in options:', parsed.selectedProductId);
                      console.log('⚠️ [WATCH] Available product IDs:', newOptions.map(p => p.id));
                    }
                  } else {
                    console.log('⚠️ [WATCH] No selectedProductId in localStorage data');
                  }
                }
              } catch (error) {
                console.error('❌ [WATCH] Error restoring product from localStorage:', error);
              }
            } else if (selectedProductId.value) {
              console.log('✅ [WATCH] Product already selected, skipping localStorage restore');
            } else {
              console.log('⚠️ [WATCH] Skipping localStorage restore - isAuthenticated:', isAuthenticated.value);
            }

            // PRIORITY 4: If no product selected, try to set default or first product
            if (!selectedProductId.value) {
              const defaultProduct = newOptions.find(
                (p) => p.isDefault === true
              );
              if (defaultProduct) {
                selectedProductId.value = defaultProduct.id;
                console.log(
                  '✅ Watched: Set default product:',
                  defaultProduct.description
                );
              } else if (newOptions.length > 0) {
                selectedProductId.value = newOptions[0].id;
                console.log(
                  '✅ Watched: Set first product:',
                  newOptions[0].description
                );
              }
            }
          }
        },
        { immediate: true }
      );

      // Watch selectedProductId to ensure totalCost updates when product changes
      watch(selectedProductId, (newId, oldId) => {
        if (newId !== oldId && newId) {
          console.log('🔄 Product ID changed from', oldId, 'to', newId);
          // Force reactivity update - totalCost computed should automatically recalculate
          // But we can trigger it explicitly if needed
          if (selectedProduct.value) {
            console.log(
              '✅ Product changed, totalCost will recalculate for:',
              selectedProduct.value.description
            );
          }
        }
      });

      // Set up real-time listener to detect when event ends
      marketEventUnsubscribe = marketEventService.addListener(() => {
        // Check event status whenever events update
        checkEventStatus();
      });

      // Set up periodic check to catch events that end
      // This checks if an event that existed on load has now ended
      eventCheckInterval = setInterval(() => {
        checkEventStatus();
      }, 2000); // Check every 2 seconds

      // Ensure we have an auth context for Storage rules even without full sign-in.
      // This avoids 403 (storage/unauthorized) when rules require request.auth != null.
      // Do this silently - don't expose to user that they're using anonymous auth
      try {
        const userNow = authService.getCurrentUser();
        if (!userNow || isAnonymousUser(userNow)) {
          // Silently sign in anonymously for Storage rules
          signInAnonymously(auth).catch(() => {
            // Silent failure - non-blocking
          });
        }
      } catch (anonErr) {
        // Silent failure - non-blocking
      }
    });

    onUnmounted(() => {
      // Clean up listener and interval
      if (marketEventUnsubscribe) {
        marketEventUnsubscribe();
        marketEventUnsubscribe = null;
      }
      // Clean up market event listener
      if (unsubscribeMarketEvents) {
        unsubscribeMarketEvents();
      }
      if (eventCheckInterval) {
        clearInterval(eventCheckInterval);
        eventCheckInterval = null;
      }
    });

    return {
      formData,
      selectedFiles,
      fileQuantities,
      productOptions,
      selectedProductId,
      selectedProduct,
      loadingProducts,
      submitting,
      canSubmit,
      totalMagnets,
      cartTotalMagnets,
      totalCost,
      showOrderSummary,
      orderNumber,
      uploadProgress,
      showUploadProgress,
      formatBytes,
      isAuthenticated,
      currentUser,
      signingIn,
      isValidEmail,
      getFilePreview,
      onRejected,
      onFileSelected,
      increaseQuantity,
      decreaseQuantity,
      removeFile,
      generateOrderNumber,
      formatDate,
      confirmOrder,
      onSubmit,
      handleGoogleSignIn,
      isAtMarketEvent,
      paymentChoice,
      showEventEndedDialog,
      goToMainPage,
      onProductChange,
      handleSubmitClick,
      handleCancelOrder,
      handleKeepShopping,
      firstNameInput,
      lastNameInput,
      emailInput,
      photoUploadSection,
      personalInfoSection,
      // Cart items and methods from useCart
      cartItems,
      removeFromCart,
    };
  },
};
</script>

<style lang="scss" scoped>
.q-page {
  // Use same plaid background as main page - inherited from .q-page-container
  background: transparent;
  min-height: 100vh;
}

// Mobile responsive adjustments
@media (max-width: 599px) {
  .text-h3 {
    font-size: 1.8rem;
  }

  .text-h5 {
    font-size: 1.3rem;
  }

  .q-btn {
    font-size: 14px;
  }
}

.photo-thumbnail-container {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  overflow: hidden;
  background: #f5f5f5;
}

.photo-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: contain;
  display: block;
}

.photo-upload-section {
  border: 3px solid #667eea;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.05) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  transition: all 0.3s ease;
}

.photo-upload-section:hover {
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.25);
  border-color: #764ba2;
}

.compact-sign-in {
  @media (max-width: 599px) {
    .q-card {
      border-radius: 8px;
    }
  }
}

.form-fields-container {
  :deep(.row) {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
  
  :deep(.q-field) {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
  }
  
  :deep(.q-field__control) {
    margin-bottom: 0 !important;
  }
  
  :deep(.col) {
    margin-bottom: 0 !important;
  }
  
  :deep(.q-field--with-bottom) {
    padding-bottom: 5px !important;
  }
  
  :deep(.q-field__bottom) {
    margin-top: 0 !important;
    padding-top: 0 !important;
    min-height: 0 !important;
  }
}
</style>

<style lang="scss">
/* Order Summary dialog (teleported to body): keep action buttons visible on mobile */
.order-summary-dialog-card {
  max-height: min(90vh, 85dvh);
}
@media (max-width: 599px) {
  .order-summary-dialog-card {
    max-height: 58vh;
    min-width: 100%;
    margin: 0 8px;
  }
  /* Large clearance so Cancel, Keep Shopping, and Submit Order stay above browser nav bar */
  .order-summary-dialog-actions {
    padding-bottom: max(80px, calc(env(safe-area-inset-bottom, 0px) + 48px)) !important;
  }
}
.order-summary-dialog-actions {
  flex-wrap: nowrap !important;
  justify-content: center !important;
}
@media (min-width: 600px) {
  .order-summary-dialog-actions {
    padding-bottom: max(16px, env(safe-area-inset-bottom, 0px)) !important;
  }
}
@media (max-width: 599px) {
  .order-summary-dialog-actions .q-btn {
    min-width: 0;
    padding-left: 8px;
    padding-right: 8px;
    font-size: 12px;
  }
}
</style>
