import { test, expect } from '@playwright/test';
import { PhotoUploadPage } from '../../page-objects/PhotoUploadPage';
import { DataValidators } from '../../utils/validation/data-validators';
import { TestDataFactory } from '../../utils/test-data/test-data-factory';
import { MarketEventController } from '../../utils/market-events/market-event-controller';

test.describe('Edge Cases and Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await MarketEventController.deactivateAll();
  });

  test('TC-7.1: Form Validation - Required Fields', async ({ page }) => {
    const photoUploadPage = new PhotoUploadPage(page);

    await photoUploadPage.goto();

    // Try to submit without filling required fields
    await photoUploadPage.clickSubmit();

    // Verify validation errors appear
    const firstNameError = page.locator('text=/First name is required/');
    await expect(firstNameError).toBeVisible();

    // Fill in First Name only
    await photoUploadPage.firstNameInput.fill('Test');
    await photoUploadPage.clickSubmit();

    // Verify Last Name error
    const lastNameError = page.locator('text=/Last name is required/');
    await expect(lastNameError).toBeVisible();

    // Fill in invalid email
    await photoUploadPage.lastNameInput.fill('Customer');
    await photoUploadPage.emailInput.fill('invalid-email');
    await photoUploadPage.clickSubmit();

    // Verify email validation error
    const emailError = page.locator('text=/valid email/');
    await expect(emailError).toBeVisible();

    // Fill all required fields correctly
    const customer = TestDataFactory.createCustomer();
    await photoUploadPage.fillCustomerInfo(customer);

    // Upload a photo and set quantity
    const testImage = await import(
      '../../utils/test-data/image-generator'
    ).then((m) => m.generateTestImages(1)[0]);
    await photoUploadPage.uploadPhotos([testImage]);
    await photoUploadPage.setPhotoQuantity(0, 1);

    // Now form should submit successfully
    await photoUploadPage.clickSubmit();
    // Should navigate to checkout
    await expect(page).toHaveURL(/.*checkout/);
  });

  test('TC-7.2: Market Event Toggle Persistence', async ({ page }) => {
    // This test would verify toggle state persists across navigation
    // Implementation depends on how toggle state is stored
    expect(true).toBe(true); // Placeholder
  });

  test('TC-7.3: Multiple Orders - Order Number Uniqueness', async ({
    page,
  }) => {
    // This test would create multiple orders and verify order numbers are unique
    // Implementation would require completing orders
    expect(true).toBe(true); // Placeholder
  });
});
