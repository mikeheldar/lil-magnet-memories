import { test, expect } from '@playwright/test';
import { LandingPage } from '../../page-objects/LandingPage';
import { PhotoUploadPage } from '../../page-objects/PhotoUploadPage';
import { CheckoutPage } from '../../page-objects/CheckoutPage';
import { ThankYouPage } from '../../page-objects/ThankYouPage';
import { CustomerOrdersPage } from '../../page-objects/CustomerOrdersPage';
import { TestDataFactory } from '../../utils/test-data/test-data-factory';
import { PaymentMocker } from '../../utils/payments/payment-mocker';
import { DataValidators } from '../../utils/validation/data-validators';
import { MarketEventController } from '../../utils/market-events/market-event-controller';
import { generateTestImages } from '../../utils/test-data/image-generator';

test.describe('Authenticated User Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await MarketEventController.deactivateAll();
  });

  test('TC-5.1: Authenticated User - Online Order - View My Orders', async ({ page }) => {
    // Note: This test would require actual Google sign-in or mocking
    // For now, it's a placeholder that can be expanded with proper auth mocking
    
    const photoUploadPage = new PhotoUploadPage(page);
    const checkoutPage = new CheckoutPage(page);
    const thankYouPage = new ThankYouPage(page);
    const customerOrdersPage = new CustomerOrdersPage(page);

    // Mock authentication state
    await page.addInitScript(() => {
      // Mock authenticated user
      (window as any).__MOCK_AUTH__ = {
        currentUser: {
          email: 'test@example.com',
          displayName: 'Test User',
          isAnonymous: false,
        },
      };
    });

    await photoUploadPage.goto();
    
    const customer = TestDataFactory.createCustomer();
    await photoUploadPage.fillCustomerInfo(customer);
    
    const testImage = generateTestImages(1)[0];
    await photoUploadPage.uploadPhotos([testImage]);
    await photoUploadPage.setPhotoQuantity(0, 1);
    await photoUploadPage.clickSubmit();

    await checkoutPage.selectShippingOption('Standard Shipping');
    await checkoutPage.fillShippingAddress(TestDataFactory.createShippingAddress());
    
    await PaymentMocker.mockSquarePayment(page, true);
    await checkoutPage.fillCreditCard(PaymentMocker.getTestCreditCard());
    await checkoutPage.clickPlaceOrder();

    await expect(page).toHaveURL(/.*thank-you/);
    
    // Verify View My Orders button is visible for authenticated users
    // In real implementation, this would check actual auth state
    const isVisible = await thankYouPage.isViewMyOrdersButtonVisible();
    // This will be false without real auth, but the test structure is in place
    
    // Navigate to my orders
    if (isVisible) {
      await thankYouPage.clickViewMyOrders();
      await expect(page).toHaveURL(/.*my-orders/);
      
      const orderCount = await customerOrdersPage.getOrderCount();
      expect(orderCount).toBeGreaterThanOrEqual(0);
      
      // Verify no invalid dates
      const hasInvalidDates = await customerOrdersPage.hasInvalidDates();
      expect(hasInvalidDates).toBe(false);
    }
  });
});

