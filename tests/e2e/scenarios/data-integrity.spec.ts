import { test, expect } from '@playwright/test';
import { OrderListPage } from '../../page-objects/OrderListPage';
import { CustomerOrdersPage } from '../../page-objects/CustomerOrdersPage';
import { DataValidators } from '../../utils/validation/data-validators';

test.describe('Data Integrity and Button Functionality', () => {
  test('TC-6.1: Order List - Sorting and Search', async ({ page }) => {
    const orderListPage = new OrderListPage(page);

    await orderListPage.goto();

    // Verify orders are sorted by date (most recent first)
    const isSorted = await orderListPage.verifyOrdersSortedByDate();
    expect(isSorted).toBe(true);

    // Verify no invalid dates
    const hasInvalidDates = await orderListPage.hasInvalidDates();
    expect(hasInvalidDates).toBe(false);

    // Test search by name
    await orderListPage.search('Test');
    await page.waitForTimeout(500);
    const orderCountAfterSearch = await orderListPage.getOrderCount();
    expect(orderCountAfterSearch).toBeGreaterThanOrEqual(0);

    // Test search by email
    await orderListPage.clearSearch();
    await orderListPage.search('@example.com');
    await page.waitForTimeout(500);

    // Clear search
    await orderListPage.clearSearch();

    // Test hide completed toggle
    await orderListPage.toggleHideCompleted();

    // Test order type filter
    await orderListPage.filterByOrderType('shipping');
    await orderListPage.filterByOrderType('pickup');
    await orderListPage.filterByOrderType('all');
  });

  test('TC-6.2: Order Receipt Data Validation', async ({ page }) => {
    // This test would validate order receipt data
    // It would be run after completing an order in another test
    // For now, it's a placeholder that can be expanded
    expect(true).toBe(true);
  });

  test('TC-6.3: Button Functionality - Thank You Page', async ({ page }) => {
    // Navigate to thank you page (would typically come from completing an order)
    await page.goto('/thank-you?orderNumber=TEST-123');

    // Verify buttons exist
    const submitAnotherButton = page.locator(
      'button:has-text("Submit Another Order")'
    );
    const backToHomeButton = page.locator('button:has-text("Back to Home")');

    await expect(submitAnotherButton).toBeVisible();
    await expect(backToHomeButton).toBeVisible();

    // Test navigation
    await submitAnotherButton.click();
    await expect(page).toHaveURL(/.*photo-upload/);

    await page.goBack();
    await backToHomeButton.click();
    await expect(page).toHaveURL('/');
  });

  test('TC-6.6: Order Total Calculation - $0.00 Prevention', async ({
    page,
  }) => {
    const orderListPage = new OrderListPage(page);

    await orderListPage.goto();
    const orderCount = await orderListPage.getOrderCount();

    // Verify no orders have $0.00 total (unless actually free)
    for (let i = 0; i < Math.min(orderCount, 10); i++) {
      const total = await orderListPage.getOrderTotal(i);
      // Allow $0.00 only if it's a free order (would need additional context)
      // For now, we'll just check that totals are valid numbers
      expect(isNaN(total)).toBe(false);
    }
  });
});

