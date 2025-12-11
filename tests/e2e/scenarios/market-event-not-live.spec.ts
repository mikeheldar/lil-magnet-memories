import { test, expect } from '@playwright/test';
import { LandingPage } from '../../page-objects/LandingPage';
import { PhotoUploadPage } from '../../page-objects/PhotoUploadPage';
import { CheckoutPage } from '../../page-objects/CheckoutPage';
import { ThankYouPage } from '../../page-objects/ThankYouPage';
import { OrderListPage } from '../../page-objects/OrderListPage';
import { TestDataFactory } from '../../utils/test-data/test-data-factory';
import { PaymentMocker } from '../../utils/payments/payment-mocker';
import { DataValidators } from '../../utils/validation/data-validators';
import { MarketEventController } from '../../utils/market-events/market-event-controller';
import { TestHelpers } from '../../utils/test-helpers';
import { generateTestImages } from '../../utils/test-data/image-generator';

test.describe('Market Event NOT Live - Online Orders', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure no market events are active
    await MarketEventController.deactivateAll();
    await TestHelpers.clearStorage(page);
  });

  test('TC-1.1: Online Order - 1 Photo - Credit Card - Shipping', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);
    const checkoutPage = new CheckoutPage(page);
    const thankYouPage = new ThankYouPage(page);
    const orderListPage = new OrderListPage(page);

    // Step 1-4: Navigate to landing page and click Start Creating Magnets
    await landingPage.goto();
    await landingPage.waitForPageLoad();
    await expect(landingPage.marketEventBanner).not.toBeVisible();
    await landingPage.clickStartCreatingMagnets();
    await expect(page).toHaveURL(/.*photo-upload/);

    // Step 5-7: Fill customer info and upload photo
    const customer = TestDataFactory.createCustomer();
    await photoUploadPage.fillCustomerInfo(customer);

    const testImage = generateTestImages(1)[0];
    await photoUploadPage.uploadPhotos([testImage]);
    await photoUploadPage.setPhotoQuantity(0, 2);

    // Step 8-9: Add to cart
    await photoUploadPage.clickSubmit();
    await expect(page).toHaveURL(/.*checkout/);

    // Step 10-14: Select shipping and fill address
    await checkoutPage.selectShippingOption('Standard Shipping');
    const shippingAddress = TestDataFactory.createShippingAddress();
    await checkoutPage.fillShippingAddress(shippingAddress);

    const orderTotal = await checkoutPage.getOrderTotal();
    expect(orderTotal).toBeGreaterThan(0);

    // Step 15-18: Complete credit card payment
    await PaymentMocker.mockSquarePayment(page, true, orderTotal);
    const testCard = PaymentMocker.getTestCreditCard();
    await checkoutPage.fillCreditCard(testCard);
    await checkoutPage.clickPlaceOrder();

    // Step 19-20: Verify navigation to thank you page
    await expect(page).toHaveURL(/.*thank-you/);
    await thankYouPage.waitForPageLoad();

    // Step 21: Verify thank you page data
    const orderNumber = await thankYouPage.getOrderNumber();
    expect(DataValidators.validateOrderNumber(orderNumber)).toBe(true);

    const customerName = await thankYouPage.getCustomerName();
    expect(customerName).toContain(customer.firstName);

    const totalMagnets = await thankYouPage.getTotalMagnets();
    expect(totalMagnets).toBe(2);

    const totalAmount = await thankYouPage.getTotalAmount();
    expect(DataValidators.validateOrderTotal(totalAmount)).toBe(true);

    const deliveryOption = await thankYouPage.getDeliveryOption();
    expect(DataValidators.validateDeliveryOption(deliveryOption)).toBe(true);

    const paymentMethod = await thankYouPage.getPaymentMethod();
    expect(paymentMethod).toContain('Credit Card');

    // Step 22: Verify View My Orders button is NOT visible
    expect(await thankYouPage.isViewMyOrdersButtonVisible()).toBe(false);

    // Step 23-24: Test navigation buttons
    await thankYouPage.clickSubmitAnotherOrder();
    await expect(page).toHaveURL(/.*photo-upload/);

    await page.goBack();
    await thankYouPage.clickBackToHome();
    await expect(page).toHaveURL('/');

    // Data Validation: Verify order appears in Order List
    await orderListPage.goto();
    await TestHelpers.waitForNavigation(page);

    const orderCount = await orderListPage.getOrderCount();
    expect(orderCount).toBeGreaterThan(0);

    // Find our order
    let foundOrder = false;
    for (let i = 0; i < orderCount; i++) {
      const orderNum = await orderListPage.getOrderNumber(i);
      if (orderNum === orderNumber) {
        foundOrder = true;
        const orderDate = await orderListPage.getOrderDate(i);
        expect(DataValidators.validateDate(orderDate)).toBe(true);
        const orderTotal = await orderListPage.getOrderTotal(i);
        expect(orderTotal).toBeGreaterThan(0);
        break;
      }
    }
    expect(foundOrder).toBe(true);
  });

  test('TC-1.2: Online Order - 1 Photo - Apple Pay - Shipping', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);
    const checkoutPage = new CheckoutPage(page);
    const thankYouPage = new ThankYouPage(page);

    await landingPage.goto();
    await landingPage.clickStartCreatingMagnets();

    const customer = TestDataFactory.createCustomer();
    await photoUploadPage.fillCustomerInfo(customer);

    const testImage = generateTestImages(1)[0];
    await photoUploadPage.uploadPhotos([testImage]);
    await photoUploadPage.setPhotoQuantity(0, 1);
    await photoUploadPage.clickSubmit();

    await checkoutPage.selectShippingOption('Standard Shipping');
    await checkoutPage.fillShippingAddress(
      TestDataFactory.createShippingAddress()
    );

    await PaymentMocker.mockApplePayFlow(page, true);
    await checkoutPage.clickApplePay();

    await expect(page).toHaveURL(/.*thank-you/);

    const paymentMethod = await thankYouPage.getPaymentMethod();
    expect(paymentMethod).toContain('Apple Pay');

    const totalAmount = await thankYouPage.getTotalAmount();
    expect(totalAmount).toBeGreaterThan(0);
  });

  test('TC-1.3: Online Order - 15 Photos - Credit Card - Shipping', async ({
    page,
  }) => {
    const photoUploadPage = new PhotoUploadPage(page);
    const checkoutPage = new CheckoutPage(page);
    const thankYouPage = new ThankYouPage(page);

    await photoUploadPage.goto();

    const customer = TestDataFactory.createCustomer();
    await photoUploadPage.fillCustomerInfo(customer);

    const testImages = generateTestImages(15);
    await photoUploadPage.uploadPhotos(testImages);

    const quantities = TestDataFactory.generatePhotoQuantities(15);
    await photoUploadPage.setAllPhotoQuantities(quantities);

    const startTime = Date.now();
    await photoUploadPage.clickSubmit();
    const uploadTime = Date.now() - startTime;

    // Verify upload completes in reasonable time (< 60 seconds)
    expect(uploadTime).toBeLessThan(60000);

    await expect(page).toHaveURL(/.*checkout/);

    const photoCount = await photoUploadPage.getPhotoCount();
    expect(photoCount).toBeGreaterThanOrEqual(15);

    await checkoutPage.selectShippingOption('Standard Shipping');
    await checkoutPage.fillShippingAddress(
      TestDataFactory.createShippingAddress()
    );

    await PaymentMocker.mockSquarePayment(page, true);
    await checkoutPage.fillCreditCard(PaymentMocker.getTestCreditCard());
    await checkoutPage.clickPlaceOrder();

    await expect(page).toHaveURL(/.*thank-you/);

    const totalMagnets = await thankYouPage.getTotalMagnets();
    const expectedTotal = quantities.reduce((sum, qty) => sum + qty, 0);
    expect(totalMagnets).toBe(expectedTotal);
  });
});

