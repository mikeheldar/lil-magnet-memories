<template>
  <q-page padding class="checkout-page">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="text-h4 q-mb-md">Checkout</div>

        <div v-if="cartItems.length === 0" class="text-center q-pa-xl">
          <q-icon
            name="shopping_cart"
            size="64px"
            color="grey-4"
            class="q-mb-md"
          />
          <div class="text-h6 text-grey-6 q-mb-sm">Your cart is empty</div>
          <q-btn
            color="primary"
            label="Continue Shopping"
            @click="$router.push('/')"
          />
        </div>

        <div v-else>
          <q-banner
            v-if="showValidationErrors && !canPlaceOrder"
            class="bg-red-1 text-negative q-mb-md"
            rounded
            dense
          >
            Please fix the highlighted fields before placing your order.
          </q-banner>
          <div class="row q-col-gutter-md">
            <!-- Left: Customer Info & Shipping -->
            <div class="col-12 col-lg-7">
              <!-- Order Summary -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Order Summary</div>
                  <q-list>
                    <template v-for="item in cartItems" :key="item.productId">
                      <!-- Custom Upload Item -->
                      <q-item v-if="item.isCustomUpload" class="q-px-none">
                        <q-item-section>
                          <q-item-label class="text-h6">{{
                            item.productName
                          }}</q-item-label>
                          <q-item-label caption>
                            <!-- Photo Previews -->
                            <div class="row q-col-gutter-xs q-mt-sm q-mb-sm">
                              <div
                                v-for="(photo, photoIndex) in item.photos"
                                :key="photoIndex"
                                class="col-auto"
                              >
                                <q-img
                                  :src="photo.preview"
                                  style="height: 60px; width: 60px"
                                  class="rounded-borders"
                                />
                              </div>
                            </div>

                            <!-- Photo details -->
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
                                item.costBreakdown &&
                                item.costBreakdown.length > 0
                              "
                              class="text-caption text-grey-7 q-mb-xs"
                            >
                              <div
                                v-for="(breakdown, index) in item.costBreakdown"
                                :key="index"
                              >
                                {{ breakdown.count }} × ({{ breakdown.qty }} for
                                ${{
                                  (breakdown.price / breakdown.count).toFixed(
                                    2
                                  )
                                }})
                              </div>
                            </div>

                            <!-- Special Instructions -->
                            <div
                              v-if="item.specialInstructions"
                              class="text-caption text-grey-7 q-mt-xs"
                            >
                              <strong>Notes:</strong>
                              {{ item.specialInstructions }}
                            </div>
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-item-label class="text-primary">
                            ${{ item.totalCost?.total?.toFixed(2) || '0.00' }}
                          </q-item-label>
                          <q-item-label caption class="text-right">
                            {{ item.quantity }} magnet{{
                              item.quantity > 1 ? 's' : ''
                            }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>

                      <!-- Regular Product Item -->
                      <q-item v-else class="q-px-none">
                        <q-item-section avatar>
                          <q-avatar size="60px" square v-if="item.productImage">
                            <img
                              :src="item.productImage"
                              :alt="item.productName"
                            />
                          </q-avatar>
                          <q-avatar size="60px" square color="grey-3" v-else>
                            <q-icon name="image" size="24px" color="grey-6" />
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ item.productName }}</q-item-label>
                          <q-item-label caption>
                            Quantity: {{ item.quantity }} × ${{
                              item.pricePerUnit.toFixed(2)
                            }}
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-item-label class="text-primary">
                            ${{ item.totalPrice.toFixed(2) }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-list>
                </q-card-section>
              </q-card>

              <!-- Customer Information -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Customer Information</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="customerInfo.firstName"
                        label="First Name *"
                        filled
                        :error="customerFirstNameError"
                        :error-message="
                          customerFirstNameError ? 'First name is required' : ''
                        "
                        :input-attrs="{ autocomplete: 'given-name' }"
                      />
                    </div>
                    <div class="col-12 col-sm-6">
                      <q-input
                        v-model="customerInfo.lastName"
                        label="Last Name *"
                        filled
                        :error="customerLastNameError"
                        :error-message="
                          customerLastNameError ? 'Last name is required' : ''
                        "
                        :input-attrs="{ autocomplete: 'family-name' }"
                      />
                    </div>
                    <div class="col-12">
                      <q-input
                        v-model="customerInfo.email"
                        label="Email *"
                        type="email"
                        filled
                        :error="customerEmailError"
                        :error-message="
                          customerEmailError
                            ? !customerInfo.email
                              ? 'Email is required'
                              : 'Please enter a valid email'
                            : ''
                        "
                        :input-attrs="{ autocomplete: 'email' }"
                      />
                    </div>
                    <div class="col-12">
                      <q-input
                        v-model="customerInfo.phone"
                        label="Phone"
                        filled
                        mask="(###) ###-####"
                        :input-attrs="{ autocomplete: 'tel' }"
                      />
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Shipping Options -->
              <q-card class="q-mb-md">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Shipping Options</div>

                  <!-- Pickup option (shown when at market event) -->
                  <div v-if="pickupOptions.length > 0">
                    <q-option-group
                      v-model="selectedShippingOption"
                      :options="pickupOptions"
                      color="primary"
                    />
                  </div>

                  <!-- Other shipping options (expandable when pickup options exist) -->
                  <div
                    v-if="
                      pickupOptions.length > 0 &&
                      otherShippingOptions.length > 0
                    "
                  >
                    <q-expansion-item
                      v-model="showOtherShippingOptions"
                      label="Other delivery options"
                      icon="local_shipping"
                      class="q-mt-md"
                    >
                      <q-option-group
                        v-model="selectedShippingOption"
                        :options="otherShippingOptions"
                        color="primary"
                      />
                    </q-expansion-item>
                  </div>

                  <!-- If no pickup options, show all options normally (no expandable section) -->
                  <div v-if="pickupOptions.length === 0">
                    <q-option-group
                      v-model="selectedShippingOption"
                      :options="shippingOptions"
                      color="primary"
                    />
                  </div>
                  <div v-if="selectedShippingDetails" class="q-mt-md">
                    <q-banner dense class="bg-grey-2 text-grey-8">
                      <div class="text-weight-medium">
                        {{ selectedShippingDetails.rawLabel }}
                      </div>
                      <div v-if="shippingTimeline" class="text-caption">
                        {{ shippingTimeline }}
                      </div>
                    </q-banner>
                  </div>
                  <div v-if="requiresShippingAddress" class="q-mt-md">
                    <q-input
                      v-model="shippingAddress.street"
                      label="Street Address *"
                      filled
                      class="q-mb-md"
                      :error="shippingStreetError"
                      :error-message="
                        shippingStreetError ? 'Street address is required' : ''
                      "
                      :input-attrs="{ autocomplete: 'shipping address-line1' }"
                    />
                    <div class="row q-col-gutter-md q-mb-md">
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.city"
                          label="City *"
                          filled
                          :error="shippingCityError"
                          :error-message="
                            shippingCityError ? 'City is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'shipping address-level2',
                          }"
                        />
                      </div>
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.state"
                          label="State *"
                          filled
                          :error="shippingStateError"
                          :error-message="
                            shippingStateError ? 'State is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'shipping address-level1',
                          }"
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <q-input
                          v-model="shippingAddress.zip"
                          label="ZIP Code *"
                          filled
                          :error="shippingZipError"
                          :error-message="
                            shippingZipError ? 'ZIP code is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'shipping postal-code',
                          }"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="
                      selectedShippingDetails &&
                      selectedShippingDetails.type === 'pickup' &&
                      checkedInEvent
                    "
                    class="q-mt-md q-pa-md bg-blue-1 rounded-borders"
                  >
                    <div class="row items-center q-mb-sm">
                      <q-icon
                        name="event"
                        class="q-mr-sm"
                        color="primary"
                        size="24px"
                      />
                      <div class="text-weight-medium">
                        Market Event Pickup Available
                      </div>
                    </div>
                    <div class="text-body2">
                      Since you're in the area, you can pick up your order at
                      <strong>{{ checkedInEvent.name }}</strong> for free! Just
                      let us know you're at the event and we'll have your
                      magnets ready.
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Market Event Notice (shown when skipShipping) -->
              <q-card v-if="skipShipping" class="q-mb-md bg-green-1">
                <q-card-section>
                  <div class="text-h6 q-mb-sm text-primary">
                    <q-icon name="event" class="q-mr-sm" />
                    Market Event Pickup
                  </div>
                  <div class="text-body2">
                    Your order will be available for pickup at the market event.
                    No shipping required.
                  </div>
                </q-card-section>
              </q-card>

              <!-- Market Event Toggle (shown when live market event exists but user hasn't selected pickup) -->
              <q-card
                v-if="
                  checkedInEvent &&
                  !skipShipping &&
                  !isFromMarketEventUpload &&
                  selectedPaymentOption !== 'pay_at_event'
                "
                class="q-mb-md bg-blue-1"
              >
                <q-card-section>
                  <div class="row items-center q-mb-sm">
                    <q-icon
                      name="event"
                      class="q-mr-sm"
                      color="primary"
                      size="24px"
                    />
                    <div class="text-weight-medium">
                      Are you at the market event?
                    </div>
                  </div>
                  <div class="text-body2 q-mb-md">
                    If you're at
                    <strong>{{ checkedInEvent.name }}</strong
                    >, you can pick up your order at the tent and save on
                    shipping!
                  </div>
                  <q-toggle
                    v-model="switchToMarketEventPickup"
                    label="I'm at the market event - pick up at tent"
                    color="primary"
                    @update:model-value="handleMarketEventToggle"
                  />
                </q-card-section>
              </q-card>

              <q-card
                v-if="selectedPaymentOption === 'square_card'"
                class="q-mb-md"
              >
                <q-card-section>
                  <div class="text-h6 q-mb-md">Billing Address</div>
                  <q-toggle
                    v-if="
                      !skipShipping &&
                      selectedShippingDetails?.type !== 'pickup'
                    "
                    v-model="billingSameAsShipping"
                    :disable="!requiresShippingAddress"
                    label="Billing address matches shipping address"
                  />
                  <div
                    v-if="
                      requiresBillingAddress &&
                      (skipShipping ||
                        !billingSameAsShipping ||
                        !requiresShippingAddress)
                    "
                    class="q-mt-md"
                  >
                    <q-input
                      v-model="billingAddress.street"
                      label="Billing Street Address *"
                      filled
                      class="q-mb-md"
                      :error="billingStreetError"
                      :error-message="
                        billingStreetError ? 'Billing street is required' : ''
                      "
                      :input-attrs="{ autocomplete: 'billing address-line1' }"
                    />
                    <div class="row q-col-gutter-md q-mb-md">
                      <div class="col-6">
                        <q-input
                          v-model="billingAddress.city"
                          label="Billing City *"
                          filled
                          :error="billingCityError"
                          :error-message="
                            billingCityError ? 'Billing city is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'billing address-level2',
                          }"
                        />
                      </div>
                      <div class="col-6">
                        <q-input
                          v-model="billingAddress.state"
                          label="Billing State *"
                          filled
                          :error="billingStateError"
                          :error-message="
                            billingStateError ? 'Billing state is required' : ''
                          "
                          :input-attrs="{
                            autocomplete: 'billing address-level1',
                          }"
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <q-input
                          v-model="billingAddress.zip"
                          label="Billing ZIP Code *"
                          filled
                          :error="billingZipError"
                          :error-message="
                            billingZipError ? 'Billing ZIP is required' : ''
                          "
                          :input-attrs="{ autocomplete: 'billing postal-code' }"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="
                      skipShipping &&
                      requiresBillingAddress &&
                      billingSameAsShipping
                    "
                    class="text-body2 text-grey-7 q-mt-md"
                  >
                    Please provide a billing address so we can verify your
                    payment details.
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <!-- Right: Order Total & Payment -->
            <div class="col-12 col-lg-5">
              <q-card class="sticky-card">
                <q-card-section>
                  <div class="text-h6 q-mb-md">Order Total</div>
                  <div class="row justify-between q-mb-sm">
                    <div class="text-body2">Subtotal:</div>
                    <div class="text-body2">${{ cartSubtotal.toFixed(2) }}</div>
                  </div>
                  <div class="row justify-between q-mb-sm">
                    <div class="text-body2">Shipping:</div>
                    <div class="text-body2" v-if="selectedShippingDetails">
                      <span v-if="selectedShippingDetails.type === 'shipping'">
                        ${{ shippingCost.toFixed(2) }}
                      </span>
                      <span v-else class="text-positive"> Free (Pickup) </span>
                    </div>
                    <div class="text-body2" v-else>—</div>
                  </div>
                  <q-separator class="q-my-md" />
                  <div class="row justify-between">
                    <div class="text-h6">Total:</div>
                    <div class="text-h6 text-primary">
                      ${{ orderTotal.toFixed(2) }}
                    </div>
                  </div>
                </q-card-section>

                <!-- Payment Options -->
                <q-card-section v-if="selectedShippingOption">
                  <div class="text-h6 q-mb-md">Payment Method</div>

                  <!-- Apple Pay Button -->
                  <q-card
                    v-if="availablePaymentMethods.applePay"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected': selectedPaymentOption === 'apple_pay',
                    }"
                    @click="selectedPaymentOption = 'apple_pay'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon name="apple" size="32px" class="q-mr-md" />
                          <div>
                            <div class="text-weight-bold">Apple Pay</div>
                            <div class="text-caption text-grey-7">
                              Fast and secure payment
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'apple_pay'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Google Pay Button -->
                  <q-card
                    v-if="availablePaymentMethods.googlePay"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected':
                        selectedPaymentOption === 'google_pay',
                    }"
                    @click="selectedPaymentOption = 'google_pay'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon
                            name="account_balance_wallet"
                            size="32px"
                            class="q-mr-md"
                          />
                          <div>
                            <div class="text-weight-bold">Google Pay</div>
                            <div class="text-caption text-grey-7">
                              Quick checkout
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'google_pay'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Square Credit Card Button -->
                  <q-card
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected':
                        selectedPaymentOption === 'square_card',
                    }"
                    @click="selectedPaymentOption = 'square_card'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon
                            name="credit_card"
                            size="32px"
                            class="q-mr-md"
                          />
                          <div>
                            <div class="text-weight-bold">
                              Credit/Debit Card
                            </div>
                            <div class="text-caption text-grey-7">
                              Pay with Visa, Mastercard, etc.
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'square_card'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- PayPal Button -->
                  <q-card
                    v-if="availablePaymentMethods.paypal"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected': selectedPaymentOption === 'paypal',
                    }"
                    @click="selectedPaymentOption = 'paypal'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon
                            name="account_balance_wallet"
                            size="32px"
                            class="q-mr-md"
                          />
                          <div>
                            <div class="text-weight-bold">PayPal</div>
                            <div class="text-caption text-grey-7">
                              Pay with your PayPal account
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'paypal'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Pay at Event Button (if applicable) -->
                  <q-card
                    v-if="availablePaymentMethods.payAtEvent"
                    flat
                    bordered
                    class="payment-option-card q-mb-sm cursor-pointer"
                    :class="{
                      'payment-selected':
                        selectedPaymentOption === 'pay_at_event',
                    }"
                    @click="selectedPaymentOption = 'pay_at_event'"
                  >
                    <q-card-section horizontal>
                      <q-card-section>
                        <div class="row items-center">
                          <q-icon name="atm" size="32px" class="q-mr-md" />
                          <div>
                            <div class="text-weight-bold">
                              Pay at Market Event Kiosk
                            </div>
                            <div class="text-caption text-grey-7">
                              Pay when you collect your order at the market
                              event
                            </div>
                          </div>
                        </div>
                      </q-card-section>
                      <q-card-actions vertical class="justify-around q-px-md">
                        <q-icon
                          v-if="selectedPaymentOption === 'pay_at_event'"
                          name="check_circle"
                          color="primary"
                          size="24px"
                        />
                        <q-icon
                          v-else
                          name="radio_button_unchecked"
                          size="24px"
                        />
                      </q-card-actions>
                    </q-card-section>
                  </q-card>

                  <!-- Square Credit Card Form (shown when Square is selected) -->
                  <q-card-section
                    v-if="selectedPaymentOption === 'apple_pay'"
                    class="q-pt-md border-top"
                  >
                    <div
                      v-if="!applePayReady && !applePayError"
                      class="text-body2 text-grey-6"
                    >
                      <q-spinner size="20px" class="q-mr-sm" />
                      Checking Apple Pay availability...
                    </div>
                    <div
                      v-show="applePayReady"
                      id="square-apple-pay-button"
                      class="wallet-button"
                    ></div>
                    <div
                      v-if="applePayError"
                      class="text-negative q-mt-sm q-pa-sm bg-red-1 rounded-borders"
                    >
                      <q-icon name="error" class="q-mr-sm" />
                      <span v-if="typeof applePayError === 'string'">{{
                        applePayError
                      }}</span>
                      <span v-else>{{
                        applePayError?.message || 'Apple Pay is not available'
                      }}</span>
                      <div class="text-caption q-mt-xs">
                        Apple Pay requires Safari or Chrome on a device with
                        Apple Pay set up.
                      </div>
                    </div>
                  </q-card-section>

                  <q-card-section
                    v-if="selectedPaymentOption === 'google_pay'"
                    class="q-pt-md border-top"
                  >
                    <div v-if="!googlePayReady" class="text-body2 text-grey-6">
                      <q-spinner size="20px" class="q-mr-sm" />
                      Checking Google Pay...
                    </div>
                    <div
                      v-show="googlePayReady"
                      id="square-google-pay-button"
                      class="wallet-button"
                    ></div>
                    <div
                      v-if="googlePayError"
                      class="text-negative text-caption q-mt-sm"
                    >
                      {{ googlePayError }}
                    </div>
                  </q-card-section>

                  <!-- Square Credit Card Form (shown when Square is selected) -->
                  <q-card-section
                    v-if="selectedPaymentOption === 'square_card'"
                    class="q-pt-md border-top"
                  >
                    <div class="text-caption text-grey-7 q-mb-sm">
                      Payment will be processed securely via Square
                    </div>
                    <!-- Square payment form container -->
                    <!-- Use v-once to prevent Vue from reconciling after Square manipulates DOM -->
                    <div
                      v-once
                      id="square-payment-form"
                      class="q-mt-md"
                      style="min-height: 200px"
                    >
                      <!-- Show loading only if not initialized AND no error -->
                      <div
                        v-if="!squareCardMounted && !squareInitError"
                        class="text-body2 text-grey-6 q-pa-md text-center"
                      >
                        <q-spinner size="24px" class="q-mr-sm" />
                        Loading secure payment form...
                      </div>
                      <!-- Show error if initialization failed -->
                      <div
                        v-if="squareInitError"
                        class="text-negative text-caption q-pa-sm bg-red-1 rounded-borders"
                      >
                        <q-icon name="error" class="q-mr-xs" />
                        <strong>Error loading payment form:</strong>
                        <div class="q-mt-xs">{{ squareInitError.message }}</div>
                        <div class="q-mt-xs text-caption">
                          Please refresh the page or contact support if the
                          issue persists.
                        </div>
                      </div>
                      <!-- Form will be rendered here by Square SDK when mounted -->
                      <!-- The loading spinner above will be hidden once squareCardMounted is true -->
                    </div>
                  </q-card-section>

                  <!-- PayPal Button Container (shown when PayPal is selected) -->
                  <q-card-section
                    v-if="selectedPaymentOption === 'paypal'"
                    class="q-pt-md border-top"
                  >
                    <div
                      v-if="!availablePaymentMethods.paypal"
                      class="text-negative q-pa-md bg-red-1 rounded-borders"
                    >
                      <q-icon name="error" class="q-mr-xs" />
                      <strong>PayPal is not configured</strong>
                      <div class="q-mt-xs text-caption">
                        PayPal payment method is not available. Please use
                        another payment method or contact support.
                      </div>
                    </div>
                    <div v-else id="paypal-button-container"></div>
                  </q-card-section>
                </q-card-section>

                <q-card-actions vertical class="q-pa-md">
                  <q-btn
                    color="primary"
                    label="Place Order"
                    icon="check"
                    size="lg"
                    class="full-width"
                    :loading="submitting"
                    :disable="!canPlaceOrder"
                    @click="placeOrder"
                  />
                  <q-btn
                    flat
                    icon="arrow_back"
                    label="Back to Cart"
                    @click="$router.push('/cart')"
                    class="full-width q-mt-sm"
                  />
                </q-card-actions>
              </q-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useCart } from '../composables/useCart.js';
import { marketEventService } from '../services/marketEventService.js';
import {
  firebaseService,
  DEFAULT_SHIPPING_OPTIONS,
} from '../services/firebaseService.js';
import { authService } from '../services/authService.js';

export default {
  name: 'CheckoutPage',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const $q = useQuasar();
    const safeNotify = (options) => {
      if ($q && typeof $q.notify === 'function') {
        $q.notify(options);
      } else {
        console.warn('Notify plugin unavailable', options);
      }
    };
    const { cartItems, cartSubtotal, clearCart } = useCart();

    const submitting = ref(false);
    const checkedInEvent = ref(null);
    const selectedShippingOption = ref(null);
    const selectedPaymentOption = ref(null);
    const squareInitialized = ref(false);
    const squarePayments = ref(null);
    const squarePaymentRequest = ref(null);
    const squareCard = ref(null);
    const squareApplePay = ref(null);
    const applePayToken = ref(null);
    const squareGooglePay = ref(null);
    const applePayReady = ref(false);
    const googlePayReady = ref(false);
    const applePayAttached = ref(false);
    const googlePayAttached = ref(false);
    const squareCardMounted = ref(false);
    const squareInitError = ref(null);
    const applePayError = ref(null);
    const googlePayError = ref(null);
    const squareProcessing = ref(false);

    const customerInfo = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });

    const shippingAddress = ref({
      street: '',
      city: '',
      state: '',
      zip: '',
    });
    const billingAddress = ref({
      street: '',
      city: '',
      state: '',
      zip: '',
    });
    const billingSameAsShipping = ref(true);
    const shippingOptionsData = ref([]);
    const loadingShippingOptions = ref(true);
    const showValidationErrors = ref(false);
    const showOtherShippingOptions = ref(false);
    const switchToMarketEventPickup = ref(false);

    // Determine if this checkout is from market event upload (vs online order)
    const isFromMarketEventUpload = computed(() => {
      // If skipShipping is set in query, it's from market event upload
      if (
        route.query.skipShipping === '1' ||
        route.query.skipShipping === 'true'
      ) {
        return true;
      }
      // If customTotal is set, it's from market event upload
      if (route.query.customTotal) {
        return true;
      }
      return false;
    });

    // Check for active market event and check-in status
    onMounted(() => {
      checkedInEvent.value = marketEventService.getCheckedInEvent();

      // Pre-fill customer info from route query if available (from market event upload)
      if (route.query.firstName) {
        customerInfo.value.firstName = route.query.firstName;
      }
      if (route.query.lastName) {
        customerInfo.value.lastName = route.query.lastName;
      }
      if (route.query.email) {
        customerInfo.value.email = route.query.email;
      }
      if (route.query.phone) {
        customerInfo.value.phone = route.query.phone;
      }

      loadShippingOptions();

      // Pre-fill customer info if user is authenticated (only if not already set from query)
      const currentUser = authService.getCurrentUser();
      if (currentUser && !customerInfo.value.email) {
        customerInfo.value.email = currentUser.email || '';
        if (currentUser.displayName && !customerInfo.value.firstName) {
          const nameParts = currentUser.displayName.split(' ');
          customerInfo.value.firstName = nameParts[0] || '';
          customerInfo.value.lastName = nameParts.slice(1).join(' ') || '';
        }
      }

      // Pre-fill customer info from custom upload form data if available (only if not already set)
      const customUploadItem = cartItems.value.find(
        (item) => item.isCustomUpload && item.formData
      );
      if (customUploadItem?.formData) {
        if (!customerInfo.value.firstName) {
          customerInfo.value.firstName =
            customUploadItem.formData.firstName || '';
        }
        if (!customerInfo.value.lastName) {
          customerInfo.value.lastName =
            customUploadItem.formData.lastName || '';
        }
        if (!customerInfo.value.email) {
          customerInfo.value.email = customUploadItem.formData.email || '';
        }
        if (!customerInfo.value.phone) {
          customerInfo.value.phone = customUploadItem.formData.phone || '';
        }
      }

      // If skipShipping, set billingSameAsShipping to false
      if (skipShipping.value) {
        billingSameAsShipping.value = false;
      }

      // Check environment variables first
      const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
      const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

      console.log('🔵 CheckoutPage mounted - Square configuration:', {
        hasApplicationId: !!applicationId,
        hasLocationId: !!locationId,
        applicationIdPrefix: applicationId
          ? applicationId.substring(0, 15) + '...'
          : 'MISSING',
        locationId: locationId || 'MISSING',
        hasWindowSquare: typeof window !== 'undefined' && !!window.Square,
      });

      if (!applicationId || !locationId) {
        const errorMsg = `Square credentials not configured. Application ID: ${
          applicationId ? 'set' : 'MISSING'
        }, Location ID: ${
          locationId ? 'set' : 'MISSING'
        }. Please configure Vercel environment variables for Production and Preview environments.`;
        console.error('❌', errorMsg);
        squareInitError.value = new Error(errorMsg);
        return;
      }

      // Wait for Square SDK to load, then initialize
      waitForSquareSDK()
        .then(() => {
          console.log('✅ Square SDK loaded, initializing payments...');
          initializeSquarePayments();
        })
        .catch((error) => {
          console.error('❌ Failed to load Square SDK:', error);
          squareInitError.value = error;
        });
    });

    const normalizeShippingOption = (option) => {
      if (!option) {
        return null;
      }
      const costNumber = Number(option.cost ?? 0);
      const costLabel =
        costNumber > 0 ? ` - $${costNumber.toFixed(2)}` : ' - Free';
      const title = option.label || 'Shipping';
      return {
        label: `${title}${costLabel}`,
        value: option.value || option.id,
        description:
          option.description ||
          option.estimatedTimeline ||
          (costNumber === 0 ? 'No additional shipping cost' : ''),
        cost: costNumber,
        estimatedTimeline: option.estimatedTimeline || '',
        allowAddress: option.allowAddress !== false,
        type: option.type || 'shipping',
        default: option.default || false,
        rawLabel: title,
      };
    };

    const shippingOptions = computed(() => {
      const baseOptions = Array.isArray(shippingOptionsData.value)
        ? shippingOptionsData.value
        : [];
      const normalized = [];

      const pushOption = (option) => {
        const normalizedOption = normalizeShippingOption(option);
        if (!normalizedOption?.value) {
          return;
        }
        if (
          normalized.find(
            (existing) => existing.value === normalizedOption.value
          )
        ) {
          return;
        }
        normalized.push(normalizedOption);
      };

      baseOptions.forEach((option) => {
        if (!option) {
          return;
        }
        const type = option.type || 'shipping';
        if (type === 'pickup') {
          if (checkedInEvent.value) {
            pushOption(option);
          }
        } else {
          pushOption(option);
        }
      });

      if (!normalized.length) {
        DEFAULT_SHIPPING_OPTIONS.forEach((option) => {
          const type = option.type || 'shipping';
          if (type === 'pickup') {
            if (checkedInEvent.value) {
              pushOption(option);
            }
          } else {
            pushOption(option);
          }
        });
      }

      return normalized;
    });

    // Separate pickup and shipping options for display
    const pickupOptions = computed(() => {
      return shippingOptions.value.filter((option) => option.type === 'pickup');
    });

    const otherShippingOptions = computed(() => {
      return shippingOptions.value.filter((option) => option.type !== 'pickup');
    });

    const selectedShippingDetails = computed(() => {
      return (
        shippingOptions.value.find(
          (option) => option.value === selectedShippingOption.value
        ) || null
      );
    });

    const shippingCost = computed(() => {
      // If shipping is skipped (pay at tent or skipShipping query), cost is 0
      if (skipShipping.value) {
        return 0;
      }
      // If pickup is selected, shipping cost is 0
      if (selectedShippingDetails.value?.type === 'pickup') {
        return 0;
      }
      return selectedShippingDetails.value?.cost || 0;
    });
    const shippingTimeline = computed(
      () => selectedShippingDetails.value?.estimatedTimeline || ''
    );
    // Check if shipping should be skipped (from route query or pay at tent)
    // Note: pickup selection doesn't skip shipping section - it just hides address fields
    const skipShipping = computed(() => {
      // Skip shipping if explicitly set in query (market event upload with pay online)
      if (
        route.query.skipShipping === '1' ||
        route.query.skipShipping === 'true'
      ) {
        return true;
      }
      // Skip shipping if user selected "pay at tent" (market event pickup)
      if (selectedPaymentOption.value === 'pay_at_event') {
        return true;
      }
      // Skip shipping if user toggled to switch to market event pickup
      if (switchToMarketEventPickup.value) {
        return true;
      }
      return false;
    });

    // Handle market event toggle - switch to pickup mode
    const handleMarketEventToggle = (value) => {
      if (value) {
        // User wants to switch to market event pickup
        switchToMarketEventPickup.value = true;
        // Automatically select "pay at event" payment option if available
        if (availablePaymentMethods.value.payAtEvent) {
          selectedPaymentOption.value = 'pay_at_event';
        }
        // Clear shipping selection
        selectedShippingOption.value = null;
      } else {
        // User wants to go back to shipping
        switchToMarketEventPickup.value = false;
        // Clear pay at event selection if it was selected
        if (selectedPaymentOption.value === 'pay_at_event') {
          // Select first available payment option
          const options = paymentOptions.value;
          if (options.length > 0) {
            selectedPaymentOption.value = options[0].value;
          }
        }
        // Re-apply default shipping selection
        applyDefaultShippingSelection();
      }
    };

    const requiresShippingAddress = computed(() => {
      // If skipShipping is true, don't require shipping address
      if (skipShipping.value) {
        return false;
      }
      return !!selectedShippingDetails.value?.allowAddress;
    });
    const requiresBillingAddress = computed(
      () => selectedPaymentOption.value === 'square_card'
    );

    const addressIsComplete = (address) => {
      if (!address) return false;
      const { street, city, state, zip } = address;
      return [street, city, state, zip].every(
        (value) => value && value.toString().trim().length > 0
      );
    };

    const sanitizeAddress = (address) => {
      if (!address) {
        return null;
      }
      const trimmed = {
        street: (address.street || '').trim(),
        city: (address.city || '').trim(),
        state: (address.state || '').trim(),
        zip: (address.zip || '').trim(),
      };
      const hasValue = Object.values(trimmed).some((value) => value.length > 0);
      return hasValue ? trimmed : null;
    };

    const applyDefaultShippingSelection = () => {
      const options = shippingOptions.value;
      if (!options.length) {
        selectedShippingOption.value = null;
        return;
      }
      const existing = options.find(
        (option) => option.value === selectedShippingOption.value
      );
      if (existing) {
        return;
      }

      // If user is at market event, prefer pickup option
      if (checkedInEvent.value) {
        const pickupOption = options.find((option) => option.type === 'pickup');
        if (pickupOption) {
          selectedShippingOption.value = pickupOption.value;
          return;
        }
      }

      // Otherwise use default or first option
      const defaultOption =
        options.find((option) => option.default) || options[0];
      selectedShippingOption.value = defaultOption.value;
    };

    const loadShippingOptions = async () => {
      // Skip loading shipping options if skipShipping is true
      if (skipShipping.value) {
        loadingShippingOptions.value = false;
        return;
      }

      loadingShippingOptions.value = true;
      try {
        // Non-admins should not see testing shipping options
        const isAdmin = authService.isAdmin();
        const options = await firebaseService.getShippingOptions(isAdmin);
        shippingOptionsData.value = Array.isArray(options)
          ? options
          : DEFAULT_SHIPPING_OPTIONS;
      } catch (error) {
        console.error('Error loading shipping options:', error);
        shippingOptionsData.value = DEFAULT_SHIPPING_OPTIONS;
        safeNotify({
          type: 'warning',
          message: 'Using default shipping options',
          position: 'top',
        });
      } finally {
        loadingShippingOptions.value = false;
        applyDefaultShippingSelection();
      }
    };

    // Available payment methods based on Square readiness and context
    const availablePaymentMethods = computed(() => {
      // Pay at event is available when:
      // 1. There's a checked-in market event AND
      // 2. Either: user is from market event upload OR user has toggled to switch to pickup
      const hasCheckedInEvent = !!checkedInEvent.value;
      const canPayAtEvent =
        hasCheckedInEvent &&
        (isFromMarketEventUpload.value || switchToMarketEventPickup.value);

      // Check if PayPal client ID is configured
      const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
      const isPayPalConfigured =
        !!paypalClientId &&
        paypalClientId !== 'YOUR_PAYPAL_CLIENT_ID' &&
        paypalClientId.trim() !== '';

      // Debug logging for payment methods
      if (applePayReady.value) {
        console.log('✅ Apple Pay is available');
      } else if (squarePayments.value) {
        console.log('❌ Apple Pay not available:', {
          applePayReady: applePayReady.value,
          applePayError: applePayError.value,
          hasSquarePayments: !!squarePayments.value,
        });
      }

      return {
        applePay: applePayReady.value,
        googlePay: googlePayReady.value,
        paypal: isPayPalConfigured, // Only show PayPal if client ID is configured
        payAtEvent: canPayAtEvent,
      };
    });

    const paymentOptions = computed(() => {
      const options = [];

      if (availablePaymentMethods.value.applePay) {
        options.push({
          label: 'Apple Pay',
          value: 'apple_pay',
          disable: false,
        });
      }

      if (availablePaymentMethods.value.googlePay) {
        options.push({
          label: 'Google Pay',
          value: 'google_pay',
          disable: false,
        });
      }

      options.push({
        label: 'Credit/Debit Card',
        value: 'square_card',
        disable: !squareInitialized.value,
      });

      // Only show PayPal if it's configured
      if (availablePaymentMethods.value.paypal) {
        options.push({
          label: 'PayPal',
          value: 'paypal',
          disable: false,
        });
      }

      if (availablePaymentMethods.value.payAtEvent) {
        options.push({
          label: 'Pay at Market Event Kiosk',
          value: 'pay_at_event',
          disable: false,
        });
      }

      return options;
    });

    // Calculate order total
    const orderTotal = computed(() => {
      // If customTotal is provided in query, use it (for market event orders)
      if (route.query.customTotal) {
        const customTotal = parseFloat(route.query.customTotal);
        if (!isNaN(customTotal)) {
          return customTotal;
        }
      }

      // Otherwise calculate from cart
      let total = cartSubtotal.value;
      // Only add shipping cost if shipping type is selected (not pickup)
      if (selectedShippingDetails.value?.type === 'shipping') {
        total += shippingCost.value;
      }
      // TODO: Add tax calculation if needed
      return total;
    });

    // Auto-select payment option when shipping option list updates
    watch(
      paymentOptions,
      (options) => {
        if (
          !options.find(
            (option) => option.value === selectedPaymentOption.value
          )
        ) {
          selectedPaymentOption.value =
            options.length > 0 ? options[0].value : null;
        }
      },
      { immediate: true }
    );

    watch(
      shippingOptions,
      () => {
        applyDefaultShippingSelection();
      },
      { immediate: true }
    );

    watch(selectedShippingOption, () => {
      if (
        paymentOptions.value.length > 0 &&
        !paymentOptions.value.find(
          (option) => option.value === selectedPaymentOption.value
        )
      ) {
        selectedPaymentOption.value = paymentOptions.value[0].value;
      }
      if (!requiresShippingAddress.value || skipShipping.value) {
        billingSameAsShipping.value = false;
      }
      updateSquarePaymentRequest();
    });

    // Watch for payment option changes - if pay at tent is selected, clear shipping selection
    watch(selectedPaymentOption, (newOption) => {
      if (newOption === 'pay_at_event') {
        // Clear shipping selection when pay at tent is selected
        selectedShippingOption.value = null;
        // Ensure switchToMarketEventPickup is true when pay at event is selected
        if (checkedInEvent.value) {
          switchToMarketEventPickup.value = true;
        }
      } else if (
        newOption !== 'pay_at_event' &&
        switchToMarketEventPickup.value
      ) {
        // If user switches away from pay at event, turn off the toggle
        switchToMarketEventPickup.value = false;
      }
      updateSquarePaymentRequest();
    });

    watch(
      () => selectedShippingDetails.value?.allowAddress,
      (allowAddress) => {
        if (!allowAddress) {
          billingSameAsShipping.value = false;
        } else if (!addressIsComplete(billingAddress.value)) {
          billingSameAsShipping.value = true;
        }
      }
    );

    watch(requiresBillingAddress, (required) => {
      if (!required) {
        billingAddress.value = {
          street: '',
          city: '',
          state: '',
          zip: '',
        };
      }
    });

    watch(
      () => ({ ...shippingAddress.value }),
      () => {
        if (billingSameAsShipping.value && requiresShippingAddress.value) {
          billingAddress.value = { ...shippingAddress.value };
        }
      },
      { deep: true }
    );

    watch(billingSameAsShipping, (same) => {
      if (same && requiresShippingAddress.value) {
        billingAddress.value = { ...shippingAddress.value };
      }
    });

    watch(orderTotal, () => {
      updateSquarePaymentRequest();
    });

    watch(selectedPaymentOption, async (option) => {
      if (option === 'apple_pay' && applePayReady.value) {
        applePayAttached.value = false;
        await renderApplePayButton();
      }
      if (option === 'google_pay' && googlePayReady.value) {
        googlePayAttached.value = false;
        await renderGooglePayButton();
      }
      if (option === 'square_card') {
        // Wait for Square to be initialized before mounting
        if (squareInitialized.value && squareCard.value) {
          await mountSquareCard();
        } else if (!squareInitialized.value) {
          // Try to initialize if not already done
          console.log(
            'Square not initialized yet, attempting initialization...'
          );
          try {
            await waitForSquareSDK();
            await initializeSquarePayments();
          } catch (error) {
            console.error('Failed to initialize Square:', error);
            squareInitError.value = error;
          }
        }
      }
      if (option === 'paypal') {
        // PayPal is not currently configured
        // To enable PayPal, uncomment the PayPal SDK script in index.html
        // and add VITE_PAYPAL_CLIENT_ID to environment variables
        console.warn(
          'PayPal is not configured. Please configure PayPal client ID to enable PayPal payments.'
        );
        safeNotify({
          type: 'warning',
          message: 'PayPal is not currently available',
          caption: 'Please use another payment method',
          position: 'top',
        });
        // Reset to default payment option (skip PayPal)
        const availableOptions = paymentOptions.value.filter(
          (opt) => opt.value !== 'paypal'
        );
        selectedPaymentOption.value =
          availableOptions.find((opt) => opt.value === 'square_card')?.value ||
          availableOptions[0]?.value ||
          null;
      }
    });

    // Check if order can be placed
    const canPlaceOrder = computed(() => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (cartItems.value.length === 0) {
        return false;
      }
      if (
        !customerInfo.value.firstName ||
        !customerInfo.value.lastName ||
        !customerInfo.value.email ||
        !emailRegex.test(customerInfo.value.email)
      ) {
        return false;
      }
      // Skip shipping option check if skipShipping is true
      if (!skipShipping.value && !selectedShippingOption.value) {
        return false;
      }
      if (!selectedPaymentOption.value) {
        return false;
      }
      if (
        !skipShipping.value &&
        requiresShippingAddress.value &&
        !addressIsComplete(shippingAddress.value)
      ) {
        return false;
      }
      if (requiresBillingAddress.value) {
        if (skipShipping.value) {
          // When skipShipping, always require billing address
          if (!addressIsComplete(billingAddress.value)) {
            return false;
          }
        } else if (
          billingSameAsShipping.value &&
          requiresShippingAddress.value
        ) {
          if (!addressIsComplete(shippingAddress.value)) {
            return false;
          }
        } else if (!addressIsComplete(billingAddress.value)) {
          return false;
        }
      }
      return true;
    });

    const customerFirstNameError = computed(
      () => showValidationErrors.value && !customerInfo.value.firstName
    );
    const customerLastNameError = computed(
      () => showValidationErrors.value && !customerInfo.value.lastName
    );
    const customerEmailError = computed(
      () =>
        showValidationErrors.value &&
        (!customerInfo.value.email ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.value.email))
    );
    const shippingStreetError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.street
    );
    const shippingCityError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.city
    );
    const shippingStateError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.state
    );
    const shippingZipError = computed(
      () =>
        showValidationErrors.value &&
        requiresShippingAddress.value &&
        !shippingAddress.value.zip
    );
    const billingStreetError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.street
    );
    const billingCityError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.city
    );
    const billingStateError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.state
    );
    const billingZipError = computed(
      () =>
        showValidationErrors.value &&
        requiresBillingAddress.value &&
        (!billingSameAsShipping.value || !requiresShippingAddress.value) &&
        !billingAddress.value.zip
    );

    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear().toString().slice(-2);
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const time = now.getTime().toString().slice(-4);
      return `LMM-${year}${month}${day}-${time}`;
    };

    // Helper function to get payment icon
    const getPaymentIcon = (paymentType) => {
      switch (paymentType) {
        case 'apple_pay':
          return 'apple';
        case 'google_pay':
          return 'account_balance_wallet';
        case 'square_card':
          return 'credit_card';
        case 'paypal':
          return 'account_balance_wallet';
        case 'pay_at_event':
          return 'atm';
        default:
          return 'payment';
      }
    };

    const mountSquareCard = async () => {
      if (!squareCard.value) {
        console.warn('⚠️ Square card not initialized yet');
        return;
      }

      // Wait for DOM to be ready
      await nextTick();

      // Give extra time for container to be available
      let retries = 0;
      let container = document.getElementById('square-payment-form');
      while (!container && retries < 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        container = document.getElementById('square-payment-form');
        retries++;
      }

      if (!container) {
        const errorMsg =
          'Square payment form container not found after waiting';
        console.error('❌', errorMsg);
        squareInitError.value = new Error(errorMsg);
        return;
      }

      try {
        console.log('🔵 Mounting Square card form to container...');
        container.setAttribute('autocomplete', 'cc-number');
        container.setAttribute('aria-label', 'Secure credit card form');
        container.classList.add('square-card-container');

        if (!squareCardMounted.value) {
          // Clear any existing content (including loading spinner)
          // Use multiple nextTick calls and delays to ensure Vue has finished rendering
          await nextTick();
          await new Promise((resolve) => setTimeout(resolve, 100));
          await nextTick();

          // Clear container before attaching
          container.innerHTML = '';

          // Wait one more tick to ensure DOM is stable
          await nextTick();
          await new Promise((resolve) => setTimeout(resolve, 50));

          // Attach the card form - this will populate the container
          console.log(
            '🔵 Attaching Square card form to #square-payment-form...'
          );
          try {
            await squareCard.value.attach('#square-payment-form');

            // Wait for Square to finish DOM manipulation before updating Vue state
            await nextTick();
            await new Promise((resolve) => setTimeout(resolve, 150));

            // Now update Vue state - this should prevent reconciliation conflicts
            squareCardMounted.value = true;
            console.log('✅ Square card form mounted successfully');

            // Verify the form was attached
            await nextTick();
            const hasSquareForm =
              container.querySelector('.sq-card') ||
              container.querySelector('[id*="sq-"]') ||
              container.children.length > 0;
            if (hasSquareForm) {
              console.log('✅ Verified: Square form is present in container');
            } else {
              console.warn(
                '⚠️ Warning: Square form container appears empty after mounting'
              );
            }
          } catch (attachError) {
            console.error('❌ Error attaching Square card form:', attachError);
            // Don't set squareCardMounted to true if attach failed
            throw attachError;
          }
        } else {
          console.log('ℹ️ Square card form already mounted');
        }
      } catch (error) {
        console.error('❌ Error mounting Square card form:', {
          message: error?.message,
          stack: error?.stack,
          error,
        });
        squareInitError.value = error;
        // Don't throw - let error be displayed in UI
      }
    };

    const renderApplePayButton = async () => {
      if (!squareApplePay.value) {
        console.log(
          '⚠️ Cannot render Apple Pay button: squareApplePay is null'
        );
        return;
      }
      await nextTick();
      const container = document.getElementById('square-apple-pay-button');
      if (!container) {
        console.log('⚠️ Cannot render Apple Pay button: container not found');
        return;
      }
      if (applePayAttached.value) {
        console.log('ℹ️ Apple Pay button already attached');
        return;
      }
      container.innerHTML = '';

      // Check what methods are available on the Apple Pay object
      console.log('🔍 Square Apple Pay object methods:', {
        hasAttach: typeof squareApplePay.value.attach === 'function',
        hasMount: typeof squareApplePay.value.mount === 'function',
        hasCreateButton:
          typeof squareApplePay.value.createButton === 'function',
        availableMethods: Object.keys(squareApplePay.value).filter(
          (key) => typeof squareApplePay.value[key] === 'function'
        ),
      });

      try {
        // Try attach first (if it exists)
        if (typeof squareApplePay.value.attach === 'function') {
          console.log('✅ Using attach method');
          await squareApplePay.value.attach('#square-apple-pay-button');
          applePayAttached.value = true;
        }
        // Try mount as alternative
        else if (typeof squareApplePay.value.mount === 'function') {
          console.log('✅ Using mount method');
          await squareApplePay.value.mount('#square-apple-pay-button');
          applePayAttached.value = true;
        }
        // Try createButton if available
        else if (typeof squareApplePay.value.createButton === 'function') {
          console.log('✅ Using createButton method');
          const button = await squareApplePay.value.createButton();
          container.appendChild(button);
          applePayAttached.value = true;
        } else {
          // Square's SDK doesn't provide button rendering - create native Apple Pay button
          console.log(
            "ℹ️ Square SDK doesn't provide button rendering, creating native Apple Pay button"
          );

          // Create native Apple Pay button using Apple's button styling
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'apple-pay-button';
          button.setAttribute('lang', 'en-US');
          button.setAttribute('aria-label', 'Pay with Apple Pay');

          // Apply Apple Pay button styles
          button.style.cssText = `
            -apple-pay-button-type: plain;
            -apple-pay-button-style: black;
            width: 100%;
            height: 44px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            display: block;
          `;

          // Handle button click - tokenize with Square and place order
          button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Validate form first
            if (!canPlaceOrder.value) {
              showValidationErrors.value = true;
              safeNotify({
                type: 'negative',
                message: 'Please fill in all required fields',
                position: 'top',
              });
              return;
            }

            // Prevent multiple clicks
            if (submitting.value) {
              console.log('⏳ Payment already in progress, ignoring click');
              return;
            }

            try {
              console.log('🍎 Apple Pay button clicked, preparing payment...');
              submitting.value = true;

              // Update payment request with current order total before tokenizing
              if (squarePaymentRequest.value) {
                console.log('🔄 Updating payment request with current total:', orderTotal.value);
                await squarePaymentRequest.value.update({
                  total: {
                    amount: orderTotal.value.toFixed(2),
                    label: 'Lil Magnet Memories',
                  },
                  requestShippingContact:
                    selectedShippingDetails.value?.type === 'shipping',
                });
              }

              // Verify Apple Pay is still available
              if (!squareApplePay.value) {
                throw new Error('Apple Pay is not available. Please refresh the page.');
              }

              console.log('🍎 Calling Square Apple Pay tokenize() - this should show the Apple Pay sheet...');
              console.log('🍎 Payment request details:', {
                total: orderTotal.value.toFixed(2),
                hasPaymentRequest: !!squarePaymentRequest.value,
                paymentRequest: squarePaymentRequest.value
              });
              
              // Tokenize with Square - this should trigger the Apple Pay sheet
              // If this doesn't show the sheet, there's a configuration issue
              const tokenResult = await squareApplePay.value.tokenize();
              
              // Check if tokenize returned immediately (which would indicate no user interaction)
              // This is a safety check - tokenize should wait for user to complete Apple Pay
              if (!tokenResult || !tokenResult.token) {
                throw new Error('Apple Pay tokenization failed - no token returned. The Apple Pay sheet may not have appeared.');
              }
              
              console.log('🍎 Apple Pay tokenize completed - user should have seen the Apple Pay sheet');
              
              console.log('✅ Apple Pay tokenized successfully:', {
                hasToken: !!tokenResult?.token,
                status: tokenResult?.status,
                token: tokenResult?.token ? tokenResult.token.substring(0, 20) + '...' : 'none',
                fullResult: tokenResult
              });

              if (!tokenResult) {
                throw new Error('Apple Pay tokenization returned no result');
              }

              if (!tokenResult.token) {
                console.error('❌ Token result missing token:', tokenResult);
                throw new Error('Failed to get payment token from Apple Pay. Please try again.');
              }

              // Set payment option and store token for placeOrder to use
              selectedPaymentOption.value = 'apple_pay';
              applePayToken.value = tokenResult.token;

              console.log('✅ Apple Pay token stored, proceeding to place order...');

              // Now call placeOrder which will process the payment
              await placeOrder();
            } catch (error) {
              console.error('❌ Apple Pay payment error:', error);
              submitting.value = false;
              applePayError.value =
                error?.message || 'Apple Pay payment failed';
              safeNotify({
                type: 'negative',
                message: 'Apple Pay payment failed',
                caption:
                  error?.message ||
                  'Please try again or use another payment method',
                position: 'top',
              });
            }
          });

          container.appendChild(button);
          applePayAttached.value = true;
          console.log('✅ Native Apple Pay button created and attached');
        }
      } catch (error) {
        applePayError.value = error;
        console.error('❌ Error attaching Apple Pay button:', error);
      }
    };

    const renderGooglePayButton = async () => {
      if (!squareGooglePay.value) {
        return;
      }
      await nextTick();
      const container = document.getElementById('square-google-pay-button');
      if (!container) {
        return;
      }
      if (googlePayAttached.value) {
        return;
      }
      container.innerHTML = '';
      try {
        await squareGooglePay.value.attach('#square-google-pay-button');
        googlePayAttached.value = true;
      } catch (error) {
        googlePayError.value = error;
        console.error('Error attaching Google Pay button:', error);
      }
    };

    const normalizeAddressForSquare = (address) => {
      if (!address) {
        return null;
      }
      const normalized = {
        street: (address.street || '').trim(),
        city: (address.city || '').trim(),
        state: (address.state || '').trim(),
        zip: (address.zip || '').trim(),
        country: (address.country || 'US').trim(),
      };

      if (!normalized.street) {
        return null;
      }

      return normalized;
    };

    const processSquareCardPayment = async (orderNumber) => {
      if (!squareCard.value) {
        throw new Error(
          'Secure payment form is still loading. Please try again in a moment.'
        );
      }

      squareProcessing.value = true;

      try {
        const tokenResult = await squareCard.value.tokenize();
        if (tokenResult.status !== 'OK') {
          const tokenError =
            tokenResult.errors && tokenResult.errors.length > 0
              ? tokenResult.errors[0].message
              : null;
          throw new Error(
            tokenError || 'We could not verify your card details. Please retry.'
          );
        }

        const billingAddressToUse =
          billingSameAsShipping.value && requiresShippingAddress.value
            ? shippingAddress.value
            : billingAddress.value;

        const paymentPayload = {
          sourceId: tokenResult.token,
          amount: orderTotal.value,
          currency: 'USD',
          orderNumber,
          buyerEmail: customerInfo.value.email,
          customerName:
            `${customerInfo.value.firstName} ${customerInfo.value.lastName}`.trim(),
          billingAddress: normalizeAddressForSquare(billingAddressToUse),
          shippingAddress: normalizeAddressForSquare(
            requiresShippingAddress.value ? shippingAddress.value : null
          ),
          locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
        };

        const result = await firebaseService.processSquarePayment(
          paymentPayload
        );

        return result?.payment || null;
      } catch (error) {
        console.error('Square card payment failed:', error);
        throw error;
      } finally {
        squareProcessing.value = false;
      }
    };

    const processApplePayPayment = async (orderNumber, token) => {
      if (!token) {
        throw new Error('Apple Pay token is missing');
      }

      squareProcessing.value = true;

      try {
        const billingAddressToUse =
          billingSameAsShipping.value && requiresShippingAddress.value
            ? shippingAddress.value
            : billingAddress.value;

        const paymentPayload = {
          sourceId: token,
          amount: orderTotal.value,
          currency: 'USD',
          orderNumber,
          buyerEmail: customerInfo.value.email,
          customerName:
            `${customerInfo.value.firstName} ${customerInfo.value.lastName}`.trim(),
          billingAddress: normalizeAddressForSquare(billingAddressToUse),
          shippingAddress: normalizeAddressForSquare(
            requiresShippingAddress.value ? shippingAddress.value : null
          ),
          locationId: import.meta.env.VITE_SQUARE_LOCATION_ID,
        };

        const result = await firebaseService.processSquarePayment(
          paymentPayload
        );

        return result?.payment || null;
      } catch (error) {
        console.error('Apple Pay payment failed:', error);
        throw error;
      } finally {
        squareProcessing.value = false;
      }
    };

    const updateSquarePaymentRequest = async () => {
      if (!squarePaymentRequest.value) {
        return;
      }
      try {
        await squarePaymentRequest.value.update({
          total: {
            amount: orderTotal.value.toFixed(2),
            label: 'Lil Magnet Memories',
          },
          requestShippingContact:
            selectedShippingDetails.value?.type === 'shipping',
        });
      } catch (error) {
        console.warn('Failed to update Square payment request:', error);
      }
    };

    // Wait for Square SDK to be available
    const waitForSquareSDK = () => {
      return new Promise((resolve, reject) => {
        // Check if already loaded
        if (window.Square && window.Square.payments) {
          console.log('✅ Square SDK already loaded');
          resolve();
          return;
        }

        // Wait for SDK to load (max 10 seconds)
        const maxWait = 10000;
        const startTime = Date.now();
        const checkInterval = 100;

        const intervalId = setInterval(() => {
          if (window.Square && window.Square.payments) {
            console.log(
              '✅ Square SDK loaded after',
              Date.now() - startTime,
              'ms'
            );
            clearInterval(intervalId);
            resolve();
          } else if (Date.now() - startTime >= maxWait) {
            clearInterval(intervalId);
            const errorMsg =
              'Square SDK failed to load within 10 seconds. Check your network connection and ensure the script is loading from https://web.squarecdn.com/v1/square.js';
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        }, checkInterval);
      });
    };

    // Square payment initialization
    const initializeSquarePayments = async () => {
      try {
        squareInitError.value = null;
        squareCardMounted.value = false;
        applePayReady.value = false;
        googlePayReady.value = false;
        applePayAttached.value = false;
        googlePayAttached.value = false;

        // Get and validate environment variables
        let applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
        let locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

        // Trim whitespace, newlines, and validate
        if (applicationId) {
          applicationId = String(applicationId).trim().replace(/\s+/g, '');
        }
        if (locationId) {
          locationId = String(locationId).trim().replace(/\s+/g, '');
        }

        console.log('🔵 Checking Square configuration...', {
          hasSDK: !!window.Square,
          hasApplicationId: !!applicationId,
          hasLocationId: !!locationId,
          applicationIdType: typeof applicationId,
          applicationIdLength: applicationId ? applicationId.length : 0,
          applicationIdPrefix: applicationId
            ? applicationId.substring(0, 10)
            : 'N/A',
          locationIdType: typeof locationId,
          locationIdLength: locationId ? locationId.length : 0,
        });

        if (!window.Square || !window.Square.payments) {
          const errorMsg =
            'Square SDK not loaded. Check if script is loaded from https://web.squarecdn.com/v1/square.js';
          console.error(errorMsg);
          squareInitError.value = new Error(errorMsg);
          return;
        }

        if (!applicationId || !locationId) {
          const errorMsg = `Square credentials not configured. Application ID: ${
            applicationId ? 'set' : 'missing'
          }, Location ID: ${locationId ? 'set' : 'missing'}`;
          console.error(errorMsg);
          squareInitError.value = new Error(errorMsg);
          return;
        }

        // Validate format before passing to Square SDK
        if (
          !applicationId ||
          typeof applicationId !== 'string' ||
          applicationId.length === 0
        ) {
          const errorMsg = 'Square Application ID is missing or invalid';
          console.error('❌', errorMsg, {
            applicationId,
            type: typeof applicationId,
          });
          squareInitError.value = new Error(errorMsg);
          return;
        }

        if (
          !locationId ||
          typeof locationId !== 'string' ||
          locationId.length === 0
        ) {
          const errorMsg = 'Square Location ID is missing or invalid';
          console.error('❌', errorMsg, {
            locationId,
            type: typeof locationId,
          });
          squareInitError.value = new Error(errorMsg);
          return;
        }

        // Validate Application ID format (should start with 'sq0idp-' or 'sq0idb-')
        if (!applicationId.match(/^sq0id[pb]-/)) {
          const errorMsg = `Square Application ID format is invalid. Expected format: sq0idp-... or sq0idb-..., got: ${applicationId.substring(
            0,
            15
          )}...`;
          console.error('❌', errorMsg);
          squareInitError.value = new Error(errorMsg);
          return;
        }

        console.log('🔵 Initializing Square payments with:', {
          applicationId: applicationId.substring(0, 15) + '...',
          applicationIdLength: applicationId.length,
          locationId: locationId.substring(0, 10) + '...',
          locationIdLength: locationId.length,
        });

        try {
          const payments = window.Square.payments(applicationId, locationId);
          squarePayments.value = payments;

          const paymentRequest = payments.paymentRequest({
            countryCode: 'US',
            currencyCode: 'USD',
            total: {
              amount: orderTotal.value.toFixed(2),
              label: 'Lil Magnet Memories',
            },
            requestBillingContact: true,
            requestShippingContact:
              selectedShippingDetails.value?.type === 'shipping',
          });
          squarePaymentRequest.value = paymentRequest;

          try {
            // Check if we're in Safari
            const isSafari = /^((?!chrome|android).)*safari/i.test(
              navigator.userAgent
            );
            const isMac = /Mac/.test(navigator.platform);
            const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);

            console.log('🍎 Initializing Apple Pay...', {
              isSafari,
              isMac,
              isIOS,
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              hasApplePaySession: !!window.ApplePaySession,
              canMakePayments: window.ApplePaySession
                ? ApplePaySession.canMakePayments()
                : 'N/A',
            });

            const applePay = await payments.applePay(paymentRequest);
            console.log(
              '🍎 Apple Pay object created, checking availability...',
              {
                applePay,
                paymentRequest,
                hasCanMakePayment:
                  typeof applePay.canMakePayment === 'function',
              }
            );

            // Add event listeners to handle Apple Pay events
            // This ensures the payment flow is properly handled
            if (applePay && typeof applePay.addEventListener === 'function') {
              applePay.addEventListener('paymentmethodselected', (event) => {
                console.log('🍎 Apple Pay payment method selected:', event);
              });
              
              applePay.addEventListener('shippingcontactselected', (event) => {
                console.log('🍎 Apple Pay shipping contact selected:', event);
              });
              
              applePay.addEventListener('shippingmethodselected', (event) => {
                console.log('🍎 Apple Pay shipping method selected:', event);
              });
              
              applePay.addEventListener('complete', (event) => {
                console.log('🍎 Apple Pay payment completed:', event);
              });
              
              applePay.addEventListener('error', (event) => {
                console.error('❌ Apple Pay error event:', event);
              });
            }

            // Square's Apple Pay might not have canMakePayment - check if method exists
            let canMakePayment = false;
            if (typeof applePay.canMakePayment === 'function') {
              canMakePayment = await applePay.canMakePayment();
              console.log(
                '🍎 Apple Pay canMakePayment result:',
                canMakePayment,
                {
                  type: typeof canMakePayment,
                  value: canMakePayment,
                  isBoolean: typeof canMakePayment === 'boolean',
                  isObject: typeof canMakePayment === 'object',
                  stringified: JSON.stringify(canMakePayment),
                }
              );
            } else {
              // If canMakePayment doesn't exist, check native Apple Pay API
              console.log(
                'ℹ️ Square Apple Pay does not have canMakePayment method, checking native API'
              );
              if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
                canMakePayment = true;
                console.log('✅ Native Apple Pay API confirms availability');
              } else {
                canMakePayment = false;
                console.log('❌ Native Apple Pay API says not available');
              }
            }

            // Square's canMakePayment can return boolean or object with result property
            const canMakePaymentResult =
              typeof canMakePayment === 'boolean'
                ? canMakePayment
                : canMakePayment?.result ?? canMakePayment;

            if (canMakePaymentResult) {
              squareApplePay.value = applePay;
              applePayReady.value = true;
              console.log('✅ Apple Pay is available and ready');
            } else {
              console.warn(
                '⚠️ Apple Pay is not available on this device/browser',
                {
                  isSafari,
                  isMac,
                  isIOS,
                  hasApplePaySession: !!window.ApplePaySession,
                  nativeCanMakePayments: window.ApplePaySession
                    ? ApplePaySession.canMakePayments()
                    : false,
                }
              );
              applePayReady.value = false;

              // Provide more specific error message
              if (isSafari && (isMac || isIOS)) {
                applePayError.value =
                  'Apple Pay is not set up on this device. Please add a payment method in Settings > Wallet & Apple Pay.';
              } else {
                applePayError.value =
                  'Apple Pay is not available on this device. Make sure you are using Safari or Chrome on a device with Apple Pay set up.';
              }
            }
          } catch (appleError) {
            console.error('❌ Apple Pay initialization error:', appleError);

            // Check if error is about Safari-only restriction but we're on Chrome on macOS/iOS
            const isChromeOnMac =
              /Chrome/.test(navigator.userAgent) &&
              /Mac/.test(navigator.platform);
            const isChromeOnIOS =
              /CriOS/.test(navigator.userAgent) ||
              (/Chrome/.test(navigator.userAgent) &&
                /iPhone|iPad|iPod/.test(navigator.userAgent));
            const isSafariOnlyError =
              appleError?.message?.includes('Safari') ||
              appleError?.message?.includes('Method unsupported');

            if ((isChromeOnMac || isChromeOnIOS) && isSafariOnlyError) {
              console.warn(
                '⚠️ Square SDK says Safari-only, but Apple Pay should work in Chrome on Apple devices'
              );
              // Check if native Apple Pay API is available
              if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
                console.log(
                  '✅ Native Apple Pay API is available - Square SDK restriction detected'
                );
                applePayError.value =
                  "Apple Pay works in Chrome, but Square's SDK currently requires Safari. Please use Safari for Apple Pay, or use Credit Card payment.";
              } else {
                applePayError.value =
                  appleError?.message || 'Apple Pay initialization failed';
              }
            } else {
              applePayError.value =
                appleError?.message || 'Apple Pay initialization failed';
            }
            applePayReady.value = false;
          }

          try {
            const googlePay = await payments.googlePay(paymentRequest);
            // Check if canMakePayment method exists and call it appropriately
            if (typeof googlePay.canMakePayment === 'function') {
              const canMakePayment = await googlePay.canMakePayment();
              if (
                canMakePayment &&
                (canMakePayment.result || canMakePayment === true)
              ) {
                squareGooglePay.value = googlePay;
                googlePayReady.value = true;
              } else {
                googlePayReady.value = false;
              }
            } else {
              // If canMakePayment doesn't exist, assume Google Pay is not available
              console.warn('Google Pay canMakePayment method not available');
              googlePayReady.value = false;
            }
          } catch (googleError) {
            console.warn('Google Pay not available:', googleError);
            googlePayError.value = googleError;
            googlePayReady.value = false;
          }

          console.log('🔵 Creating Square card form...');
          try {
            const card = await payments.card();
            squareCard.value = card;
            console.log('✅ Square card form created');

            squareInitialized.value = true;
            console.log('✅ Square payments fully initialized');

            await updateSquarePaymentRequest();

            // Always mount the card form immediately so it's ready
            // The container will be shown/hidden based on selectedPaymentOption
            // Use a delay to ensure the payment option section is fully rendered
            console.log('🔵 Mounting Square card form...');
            await nextTick();
            await new Promise((resolve) => setTimeout(resolve, 200));
            await mountSquareCard();
          } catch (cardError) {
            console.error('❌ Error creating Square card form:', cardError);
            squareInitError.value = cardError;
            // Don't throw - let error be displayed in UI
          }

          if (
            selectedPaymentOption.value === 'apple_pay' &&
            applePayReady.value
          ) {
            await renderApplePayButton();
          }
          if (
            selectedPaymentOption.value === 'google_pay' &&
            googlePayReady.value
          ) {
            await renderGooglePayButton();
          }

          console.log('✅ Square payments initialized successfully');
        } catch (initError) {
          console.error('❌ Error calling Square.payments():', {
            message: initError?.message,
            applicationId: applicationId
              ? applicationId.substring(0, 15) + '...'
              : 'missing',
            locationId: locationId
              ? locationId.substring(0, 10) + '...'
              : 'missing',
            error: initError,
          });
          squareInitError.value = initError;
          return;
        }
      } catch (error) {
        squareInitError.value = error;
        console.error('❌ Error initializing Square payments:', {
          message: error?.message,
          stack: error?.stack,
          error,
        });
        // Don't throw - let the error be displayed in the UI
      }
    };

    const getCartItemQuantity = (item) => {
      if (typeof item?.quantity === 'number') {
        return item.quantity;
      }
      if (Array.isArray(item?.photoQuantities)) {
        return item.photoQuantities.reduce(
          (sum, qty) => sum + Number(qty || 0),
          0
        );
      }
      return 0;
    };

    const placeOrder = async () => {
      if (!canPlaceOrder.value) {
        showValidationErrors.value = true;
        safeNotify({
          type: 'negative',
          message: 'Please fill in all required fields',
          position: 'top',
        });
        return;
      }

      submitting.value = true;

      try {
        showValidationErrors.value = false;
        const orderNumber = generateOrderNumber();
        const currentUser = authService.getCurrentUser();
        const cartItemsSnapshot = JSON.parse(JSON.stringify(cartItems.value));
        const shippingAddressData = requiresShippingAddress.value
          ? sanitizeAddress(shippingAddress.value)
          : null;
        const billingAddressData = requiresBillingAddress.value
          ? sanitizeAddress(
              billingSameAsShipping.value && shippingAddressData
                ? shippingAddress.value
                : billingAddress.value
            )
          : null;
        const shippingOptionPayload = selectedShippingDetails.value
          ? {
              value: selectedShippingDetails.value.value,
              label: selectedShippingDetails.value.rawLabel,
              description: selectedShippingDetails.value.description,
              cost: shippingCost.value,
              estimatedTimeline: shippingTimeline.value,
              type: selectedShippingDetails.value.type,
              eventId:
                selectedShippingDetails.value.type === 'pickup'
                  ? checkedInEvent.value?.id || null
                  : null,
              address: shippingAddressData,
            }
          : null;
        const paymentProcessor =
          selectedPaymentOption.value === 'square_card'
            ? 'square'
            : selectedPaymentOption.value === 'paypal'
            ? 'paypal'
            : selectedPaymentOption.value === 'apple_pay'
            ? 'apple'
            : selectedPaymentOption.value === 'google_pay'
            ? 'google'
            : selectedPaymentOption.value === 'pay_at_event'
            ? 'in_person'
            : null;

        let squarePaymentDetails = null;
        if (selectedPaymentOption.value === 'square_card') {
          squarePaymentDetails = await processSquareCardPayment(orderNumber);
        } else if (
          selectedPaymentOption.value === 'apple_pay' &&
          applePayToken.value
        ) {
          console.log('💳 Processing Apple Pay payment with token...');
          squarePaymentDetails = await processApplePayPayment(
            orderNumber,
            applePayToken.value
          );
          
          // Validate payment was processed
          if (!squarePaymentDetails) {
            throw new Error('Apple Pay payment processing failed. No payment details returned.');
          }
          
          if (squarePaymentDetails.status !== 'COMPLETED') {
            console.error('❌ Apple Pay payment not completed:', squarePaymentDetails);
            throw new Error(`Apple Pay payment failed with status: ${squarePaymentDetails.status}`);
          }
          
          console.log('✅ Apple Pay payment processed successfully:', {
            paymentId: squarePaymentDetails.id,
            status: squarePaymentDetails.status,
            amount: orderTotal.value
          });
          
          // Clear token after use
          applePayToken.value = null;
        } else if (selectedPaymentOption.value === 'apple_pay' && !applePayToken.value) {
          // This should never happen if the flow is correct, but add safety check
          throw new Error('Apple Pay token is missing. Please try the payment again.');
        }

        const paymentOptionPayload = {
          type: selectedPaymentOption.value,
          processor: paymentProcessor,
          paymentId: squarePaymentDetails?.id || null,
          paidAt: squarePaymentDetails?.createdAt || null,
          status: squarePaymentDetails?.status || null,
          receiptUrl: squarePaymentDetails?.receiptUrl || null,
          billingAddress: billingAddressData,
        };
        const totalMagnets = cartItemsSnapshot.reduce(
          (sum, item) => sum + getCartItemQuantity(item),
          0
        );

        let orderStatus =
          selectedPaymentOption.value === 'pay_at_event'
            ? 'pending_payment'
            : 'pending';
        if (squarePaymentDetails?.status === 'COMPLETED') {
          orderStatus = 'paid';
        }

        const orderData = {
          orderNumber,
          orderType: 'product_cart',
          cartItems: cartItemsSnapshot,
          customer: {
            firstName: customerInfo.value.firstName,
            lastName: customerInfo.value.lastName,
            email: customerInfo.value.email,
            phone: customerInfo.value.phone || '',
          },
          userId: currentUser?.uid || null,
          shippingOption: shippingOptionPayload,
          paymentOption: paymentOptionPayload,
          subtotal: cartSubtotal.value,
          shipping: shippingCost.value,
          tax: 0, // TODO: Calculate tax if needed
          totalAmount: orderTotal.value,
          shippingTimeline: shippingTimeline.value,
          status: orderStatus,
        };

        // Save order to Firebase
        await firebaseService.saveCartOrder(orderData);

        // Clear cart
        clearCart();

        // Show success notification
        safeNotify({
          type: 'positive',
          message: 'Order placed successfully!',
          caption: `Order #${orderNumber}`,
          position: 'top',
          timeout: 5000,
        });

        localStorage.setItem(
          'lastOrderData',
          JSON.stringify({
            orderNumber,
            customerName: `${customerInfo.value.firstName} ${customerInfo.value.lastName}`,
            customerEmail: customerInfo.value.email,
            totalMagnets,
            subtotal: cartSubtotal.value,
            shipping: shippingCost.value,
            tax: 0,
            totalAmount: orderTotal.value,
            shippingOption: shippingOptionPayload,
            paymentOption: paymentOptionPayload,
          })
        );

        // Navigate to My Orders page
        router.push({
          path: '/my-orders',
        });
      } catch (error) {
        console.error('Error placing order:', error);
        safeNotify({
          type: 'negative',
          message: 'Failed to place order',
          caption: error.message || 'Please try again',
          position: 'top',
        });
      } finally {
        submitting.value = false;
      }
    };

    return {
      cartItems,
      cartSubtotal,
      customerInfo,
      shippingAddress,
      billingAddress,
      billingSameAsShipping,
      shippingCost,
      shippingTimeline,
      selectedShippingOption,
      selectedShippingDetails,
      selectedPaymentOption,
      shippingOptions,
      pickupOptions,
      otherShippingOptions,
      showOtherShippingOptions,
      requiresShippingAddress,
      requiresBillingAddress,
      orderTotal,
      canPlaceOrder,
      submitting,
      checkedInEvent,
      placeOrder,
      getPaymentIcon,
      availablePaymentMethods,
      customerFirstNameError,
      customerLastNameError,
      customerEmailError,
      shippingStreetError,
      shippingCityError,
      shippingStateError,
      shippingZipError,
      billingStreetError,
      billingCityError,
      billingStateError,
      billingZipError,
      showValidationErrors,
      applePayReady,
      applePayError,
      googlePayReady,
      googlePayError,
      squareInitialized,
      squareCardMounted,
      squareInitError,
      squareProcessing,
    };
  },
};
</script>

<style scoped>
.sticky-card {
  position: sticky;
  top: 20px;
}

.checkout-page {
  min-height: 60vh;
}

.payment-option-card {
  transition: all 0.3s ease;
}

.payment-option-card:hover {
  background-color: #f5f5f5;
}

.payment-selected {
  border: 2px solid #1976d2 !important;
  background-color: #e3f2fd;
}

.wallet-button {
  min-height: 48px;
}

.square-card-container {
  min-height: 120px;
}

.border-top {
  border-top: 1px solid #e0e0e0;
  margin-top: 16px;
}
</style>
