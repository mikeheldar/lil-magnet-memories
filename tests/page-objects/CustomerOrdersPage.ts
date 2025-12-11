import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Customer Orders Page
 */
export class CustomerOrdersPage {
  readonly page: Page;
  readonly ordersList: Locator;
  readonly orderCards: Locator;
  readonly noOrdersMessage: Locator;
  readonly placeFirstOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.ordersList = page.locator('.order-card, [class*="order-card"]');
    this.orderCards = page.locator('.order-card, [class*="order-card"]');
    this.noOrdersMessage = page.locator('text=/No Orders Yet/');
    this.placeFirstOrderButton = page.locator(
      'button:has-text("Place Your First Order")'
    );
  }

  async goto() {
    await this.page.goto('/my-orders');
  }

  async getOrderCount(): Promise<number> {
    return await this.orderCards.count();
  }

  async getOrderByIndex(index: number): Promise<Locator> {
    return this.orderCards.nth(index);
  }

  async getOrderNumber(orderIndex: number): Promise<string> {
    const order = await this.getOrderByIndex(orderIndex);
    const orderNumberText = await order
      .locator('text=/Order #[A-Z0-9-]+/')
      .textContent();
    const match = orderNumberText?.match(/Order #([A-Z0-9-]+)/);
    return match ? match[1] : '';
  }

  async getOrderDate(orderIndex: number): Promise<string> {
    const order = await this.getOrderByIndex(orderIndex);
    return (
      (await order
        .locator('.text-caption, [class*="date"]')
        .first()
        .textContent()) || ''
    );
  }

  async getOrderTotal(orderIndex: number): Promise<number> {
    const order = await this.getOrderByIndex(orderIndex);
    const totalText = await order
      .locator('text=/\\$[0-9]+\\.[0-9]{2}/')
      .first()
      .textContent();
    const match = totalText?.match(/\$([0-9]+\.[0-9]{2})/);
    return match ? parseFloat(match[1]) : 0;
  }

  async expandOrder(orderIndex: number) {
    const order = await this.getOrderByIndex(orderIndex);
    const expandButton = order.locator('button[aria-expanded="false"]').first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
    }
  }

  async getOrderPhotos(orderIndex: number): Promise<number> {
    const order = await this.getOrderByIndex(orderIndex);
    return await order.locator('img, .q-img').count();
  }

  async hasInvalidDates(): Promise<boolean> {
    const count = await this.getOrderCount();
    for (let i = 0; i < count; i++) {
      const dateText = await this.getOrderDate(i);
      if (
        dateText.includes('Invalid Date') ||
        dateText.includes('N/A') ||
        dateText.includes('Unknown')
      ) {
        return true;
      }
    }
    return false;
  }
}

