import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Order List Page (Admin)
 */
export class OrderListPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly ordersList: Locator;
  readonly orderCards: Locator;
  readonly hideCompletedToggle: Locator;
  readonly orderTypeFilter: Locator;
  readonly newOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator(
      'input[placeholder*="Search"], input[placeholder*="name or email"]'
    );
    this.ordersList = page.locator('.order-card, [class*="order-card"]');
    this.orderCards = page.locator('.order-card, [class*="order-card"]');
    this.hideCompletedToggle = page.locator(
      'input[type="checkbox"][label*="Hide completed"]'
    );
    this.orderTypeFilter = page.locator(
      'button:has-text("All Orders"), button:has-text("Shipping"), button:has-text("Pickup")'
    );
    this.newOrderButton = page.locator('button:has-text("New Order")');
  }

  async goto() {
    await this.page.goto('/orders');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Wait for filtering
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
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

  async toggleHideCompleted() {
    await this.hideCompletedToggle.click();
    await this.page.waitForTimeout(500);
  }

  async filterByOrderType(type: 'all' | 'shipping' | 'pickup') {
    await this.page
      .locator(
        `button:has-text("${
          type === 'all'
            ? 'All Orders'
            : type === 'shipping'
            ? 'Shipping'
            : 'Pickup'
        }")`
      )
      .click();
    await this.page.waitForTimeout(500);
  }

  async verifyOrdersSortedByDate(): Promise<boolean> {
    const dates: Date[] = [];
    const count = await this.getOrderCount();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const dateText = await this.getOrderDate(i);
      const date = this.parseDate(dateText);
      if (date) dates.push(date);
    }

    // Check if dates are in descending order (most recent first)
    for (let i = 1; i < dates.length; i++) {
      if (dates[i - 1] < dates[i]) {
        return false;
      }
    }
    return true;
  }

  private parseDate(dateText: string): Date | null {
    try {
      return new Date(dateText);
    } catch {
      return null;
    }
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

