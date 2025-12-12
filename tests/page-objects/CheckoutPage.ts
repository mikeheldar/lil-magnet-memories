import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Checkout Page
 */
export class CheckoutPage {
  readonly page: Page;
  readonly orderSummary: Locator;
  readonly shippingOptions: Locator;
  readonly shippingStreetInput: Locator;
  readonly shippingCityInput: Locator;
  readonly shippingStateInput: Locator;
  readonly shippingZipInput: Locator;
  readonly billingSameAsShippingToggle: Locator;
  readonly billingStreetInput: Locator;
  readonly billingCityInput: Locator;
  readonly billingStateInput: Locator;
  readonly billingZipInput: Locator;
  readonly creditCardNumberInput: Locator;
  readonly creditCardExpiryInput: Locator;
  readonly creditCardCvvInput: Locator;
  readonly creditCardZipInput: Locator;
  readonly placeOrderButton: Locator;
  readonly applePayButton: Locator;
  readonly orderTotal: Locator;
  readonly subtotal: Locator;
  readonly shippingCost: Locator;
  readonly marketEventPickupNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderSummary = page.locator(
      '.order-summary, [class*="order-summary"]'
    );
    this.shippingOptions = page.locator(
      'input[type="radio"][name*="shipping"], input[type="radio"][value*="shipping"]'
    );
    this.shippingStreetInput = page.locator(
      'input[label*="Street"], input[autocomplete*="address-line1"]'
    );
    this.shippingCityInput = page.locator(
      'input[label*="City"], input[autocomplete*="address-level2"]'
    );
    this.shippingStateInput = page.locator(
      'input[label*="State"], input[autocomplete*="address-level1"]'
    );
    this.shippingZipInput = page.locator(
      'input[label*="ZIP"], input[autocomplete*="postal-code"]'
    );
    this.billingSameAsShippingToggle = page.locator(
      'input[type="checkbox"][label*="Billing address matches"]'
    );
    this.billingStreetInput = page.locator(
      'input[label*="Billing Street"], input[autocomplete*="billing address-line1"]'
    );
    this.billingCityInput = page.locator('input[label*="Billing City"]');
    this.billingStateInput = page.locator('input[label*="Billing State"]');
    this.billingZipInput = page.locator('input[label*="Billing ZIP"]');
    this.creditCardNumberInput = page.locator(
      'input[placeholder*="Card"], input[name*="card"], input[id*="card-number"]'
    );
    this.creditCardExpiryInput = page.locator(
      'input[placeholder*="MM/YY"], input[name*="expiry"], input[id*="expiry"]'
    );
    this.creditCardCvvInput = page.locator(
      'input[placeholder*="CVV"], input[name*="cvv"], input[id*="cvv"]'
    );
    this.creditCardZipInput = page.locator(
      'input[placeholder*="ZIP"], input[name*="zip"]'
    );
    this.placeOrderButton = page.locator('button:has-text("Place Order")');
    this.applePayButton = page.locator(
      'button:has-text("Apple Pay"), button:has-text("Buy with Apple Pay")'
    );
    this.orderTotal = page.locator('text=/Total.*\\$[0-9]+\\.[0-9]{2}/');
    this.subtotal = page.locator('text=/Subtotal.*\\$[0-9]+\\.[0-9]{2}/');
    this.shippingCost = page.locator('text=/Shipping.*\\$[0-9]+\\.[0-9]{2}/');
    this.marketEventPickupNotice = page.locator(
      '.bg-green-1:has-text("Market Event Pickup")'
    );
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async selectShippingOption(optionLabel: string) {
    await this.page.locator(`text="${optionLabel}"`).click();
  }

  async fillShippingAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) {
    if (await this.shippingStreetInput.isVisible()) {
      await this.shippingStreetInput.fill(address.street);
      await this.shippingCityInput.fill(address.city);
      await this.shippingStateInput.fill(address.state);
      await this.shippingZipInput.fill(address.zip);
    }
  }

  async setBillingSameAsShipping(same: boolean) {
    const isChecked = await this.billingSameAsShippingToggle.isChecked();
    if (isChecked !== same) {
      await this.billingSameAsShippingToggle.click();
    }
  }

  async fillBillingAddress(address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) {
    if (await this.billingStreetInput.isVisible()) {
      await this.billingStreetInput.fill(address.street);
      await this.billingCityInput.fill(address.city);
      await this.billingStateInput.fill(address.state);
      await this.billingZipInput.fill(address.zip);
    }
  }

  async fillCreditCard(card: {
    number: string;
    expiry: string;
    cvv: string;
    zip?: string;
  }) {
    // Wait for Square payment form to load
    await this.page.waitForTimeout(2000);

    // Square uses iframes, so we need to handle that
    const cardFrame = this.page
      .frameLocator('iframe[name*="card"], iframe[id*="card"]')
      .first();
    if ((await cardFrame.locator('input').count()) > 0) {
      await cardFrame
        .locator('input[placeholder*="Card"], input[name*="number"]')
        .fill(card.number);
      await cardFrame
        .locator('input[placeholder*="MM/YY"], input[name*="expiry"]')
        .fill(card.expiry);
      await cardFrame
        .locator('input[placeholder*="CVV"], input[name*="cvv"]')
        .fill(card.cvv);
      if (card.zip) {
        await cardFrame.locator('input[placeholder*="ZIP"]').fill(card.zip);
      }
    } else {
      // Fallback to direct inputs if no iframe
      if (await this.creditCardNumberInput.isVisible()) {
        await this.creditCardNumberInput.fill(card.number);
      }
      if (await this.creditCardExpiryInput.isVisible()) {
        await this.creditCardExpiryInput.fill(card.expiry);
      }
      if (await this.creditCardCvvInput.isVisible()) {
        await this.creditCardCvvInput.fill(card.cvv);
      }
    }
  }

  async clickPlaceOrder() {
    await this.placeOrderButton.click();
  }

  async clickApplePay() {
    await this.applePayButton.click();
  }

  async getOrderTotal(): Promise<number> {
    const text = await this.orderTotal.textContent();
    const match = text?.match(/\$([0-9]+\.[0-9]{2})/);
    return match ? parseFloat(match[1]) : 0;
  }

  async isMarketEventPickup(): Promise<boolean> {
    return await this.marketEventPickupNotice.isVisible();
  }

  async waitForPaymentProcessing() {
    // Wait for button to show loading state
    await this.page.waitForTimeout(1000);
  }
}

