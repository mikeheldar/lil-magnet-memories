import { test, expect } from '@playwright/test';
import { LandingPage } from '../../page-objects/LandingPage';
import { PhotoUploadPage } from '../../page-objects/PhotoUploadPage';
import { CheckoutPage } from '../../page-objects/CheckoutPage';
import { ThankYouPage } from '../../page-objects/ThankYouPage';
import { TestDataFactory } from '../../utils/test-data/test-data-factory';
import { PaymentMocker } from '../../utils/payments/payment-mocker';
import { MarketEventController } from '../../utils/market-events/market-event-controller';
import { generateTestImages } from '../../utils/test-data/image-generator';

test.describe('Market Event LIVE - User Toggles "At Event"', () => {
  let marketEventId: string;

  test.beforeEach(async ({ page }) => {
    // Create and activate a market event
    const event = TestDataFactory.createMarketEvent();
    marketEventId = await MarketEventController.createEvent(event);
    await MarketEventController.checkIn(marketEventId);
  });

  test.afterEach(async () => {
    await MarketEventController.deactivateAll();
  });

  test('TC-3.1: Market Event Live - Toggle ON - 1 Photo - Pay at Tent', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);
    const thankYouPage = new ThankYouPage(page);

    await landingPage.goto();
    await expect(landingPage.marketEventBanner).toBeVisible();

    await landingPage.toggleMarketEventAtEvent(true);
    await expect(
      page.locator('text=/Market event mode enabled/')
    ).toBeVisible();

    await landingPage.clickStartCreatingMagnets();
    await expect(page).toHaveURL(/.*photo-upload/);

    expect(await photoUploadPage.isAtMarketEvent()).toBe(true);

    await photoUploadPage.fillCustomerInfo(TestDataFactory.createCustomer());
    const testImage = generateTestImages(1)[0];
    await photoUploadPage.uploadPhotos([testImage]);
    await photoUploadPage.setPhotoQuantity(0, 1);

    const buttonText = await photoUploadPage.getSubmitButtonText();
    expect(buttonText).toContain('Submit Photos');

    await photoUploadPage.clickSubmit();
    await expect(page).toHaveURL(/.*thank-you/);

    const paymentMethod = await thankYouPage.getPaymentMethod();
    expect(paymentMethod).toContain('Pay at Tent');

    const deliveryOption = await thankYouPage.getDeliveryOption();
    expect(deliveryOption).toContain('Pickup at Market Event');
  });

  test('TC-3.2: Market Event Live - Toggle ON - 1 Photo - Pay Online', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);
    const checkoutPage = new CheckoutPage(page);
    const thankYouPage = new ThankYouPage(page);

    await landingPage.goto();
    await landingPage.toggleMarketEventAtEvent(true);
    await landingPage.clickStartCreatingMagnets();

    await photoUploadPage.fillCustomerInfo(TestDataFactory.createCustomer());
    const testImage = generateTestImages(1)[0];
    await photoUploadPage.uploadPhotos([testImage]);
    await photoUploadPage.setPhotoQuantity(0, 1);

    await photoUploadPage.selectPaymentMethod('pay_online');
    const buttonText = await photoUploadPage.getSubmitButtonText();
    expect(buttonText).toContain('Continue to Payment');

    await photoUploadPage.clickSubmit();
    await expect(page).toHaveURL(/.*checkout/);

    expect(await checkoutPage.isMarketEventPickup()).toBe(true);

    await PaymentMocker.mockSquarePayment(page, true);
    await checkoutPage.fillCreditCard(PaymentMocker.getTestCreditCard());
    await checkoutPage.clickPlaceOrder();

    await expect(page).toHaveURL(/.*thank-you/);

    const paymentMethod = await thankYouPage.getPaymentMethod();
    expect(paymentMethod).toMatch(/Credit Card|Apple Pay/);

    const deliveryOption = await thankYouPage.getDeliveryOption();
    expect(deliveryOption).toContain('Pickup at Market Event');
  });
});

test.describe('Market Event LIVE - User Does NOT Toggle (Popup Flow)', () => {
  let marketEventId: string;

  test.beforeEach(async ({ page }) => {
    const event = TestDataFactory.createMarketEvent();
    marketEventId = await MarketEventController.createEvent(event);
    await MarketEventController.checkIn(marketEventId);
  });

  test.afterEach(async () => {
    await MarketEventController.deactivateAll();
  });

  test('TC-4.1: Market Event Live - No Toggle - Answer YES to Popup', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);

    await landingPage.goto();
    await expect(landingPage.marketEventBanner).toBeVisible();

    // Toggle should be OFF
    const isChecked = await landingPage.marketEventToggle.isChecked();
    expect(isChecked).toBe(false);

    await landingPage.clickStartCreatingMagnets();

    // Verify popup appears
    await expect(page.locator('text=/Market Event Active/')).toBeVisible();
    await expect(
      page.locator('button:has-text("Yes, I\'m at the event")')
    ).toBeVisible();

    await page.locator('button:has-text("Yes, I\'m at the event")').click();

    await expect(page).toHaveURL(/.*photo-upload/);
    expect(await photoUploadPage.isAtMarketEvent()).toBe(true);
  });

  test('TC-4.2: Market Event Live - No Toggle - Answer NO to Popup', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);

    await landingPage.goto();
    await landingPage.clickStartCreatingMagnets();

    await expect(page.locator('text=/Market Event Active/')).toBeVisible();
    await page.locator('button:has-text("No, Order Online")').click();

    await expect(page).toHaveURL(/.*photo-upload/);
    expect(await photoUploadPage.isAtMarketEvent()).toBe(false);
  });

  test('TC-4.3: Market Event Live - Toggle OFF Explicitly - No Popup', async ({
    page,
  }) => {
    const landingPage = new LandingPage(page);
    const photoUploadPage = new PhotoUploadPage(page);

    await landingPage.goto();
    await landingPage.toggleMarketEventAtEvent(false);
    await expect(page.locator('text=/Switched to online mode/')).toBeVisible();

    await landingPage.clickStartCreatingMagnets();

    // Popup should NOT appear
    await expect(page.locator('text=/Market Event Active/')).not.toBeVisible();
    await expect(page).toHaveURL(/.*photo-upload/);
    expect(await photoUploadPage.isAtMarketEvent()).toBe(false);
  });
});

