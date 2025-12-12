import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Thank You Page
 */
export class ThankYouPage {
  readonly page: Page;
  readonly orderNumber: Locator;
  readonly customerName: Locator;
  readonly customerEmail: Locator;
  readonly totalMagnets: Locator;
  readonly totalAmount: Locator;
  readonly deliveryOption: Locator;
  readonly paymentMethod: Locator;
  readonly submitAnotherOrderButton: Locator;
  readonly viewMyOrdersButton: Locator;
  readonly backToHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderNumber = page.locator(
      '.order-number-display, [class*="order-number"]'
    );
    this.customerName = page
      .locator('text=/Order Details:/')
      .locator('..')
      .locator('strong')
      .first();
    this.customerEmail = page.locator('text=/@/').first();
    this.totalMagnets = page.locator('text=/magnet/');
    this.totalAmount = page.locator('text=/Total.*\\$[0-9]+\\.[0-9]{2}/');
    this.deliveryOption = page
      .locator('text=/Delivery Option/')
      .locator('..')
      .locator('strong');
    this.paymentMethod = page
      .locator('text=/Payment Method/')
      .locator('..')
      .locator('strong');
    this.submitAnotherOrderButton = page.locator(
      'button:has-text("Submit Another Order")'
    );
    this.viewMyOrdersButton = page.locator('button:has-text("View My Orders")');
    this.backToHomeButton = page.locator('button:has-text("Back to Home")');
  }

  async goto() {
    await this.page.goto('/thank-you');
  }

  async getOrderNumber(): Promise<string> {
    return (await this.orderNumber.textContent()) || '';
  }

  async getCustomerName(): Promise<string> {
    return (await this.customerName.textContent()) || '';
  }

  async getCustomerEmail(): Promise<string> {
    return (await this.customerEmail.textContent()) || '';
  }

  async getTotalMagnets(): Promise<number> {
    const text = await this.totalMagnets.textContent();
    const match = text?.match(/([0-9]+)\s+magnet/);
    return match ? parseInt(match[1]) : 0;
  }

  async getTotalAmount(): Promise<number> {
    const text = await this.totalAmount.textContent();
    const match = text?.match(/\$([0-9]+\.[0-9]{2})/);
    return match ? parseFloat(match[1]) : 0;
  }

  async getDeliveryOption(): Promise<string> {
    return (await this.deliveryOption.textContent()) || '';
  }

  async getPaymentMethod(): Promise<string> {
    return (await this.paymentMethod.textContent()) || '';
  }

  async clickSubmitAnotherOrder() {
    await this.submitAnotherOrderButton.click();
  }

  async clickViewMyOrders() {
    await this.viewMyOrdersButton.click();
  }

  async clickBackToHome() {
    await this.backToHomeButton.click();
  }

  async isViewMyOrdersButtonVisible(): Promise<boolean> {
    return await this.viewMyOrdersButton.isVisible();
  }

  async waitForPageLoad() {
    await this.orderNumber.waitFor({ state: 'visible' });
  }
}

