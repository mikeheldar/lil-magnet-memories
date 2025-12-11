import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Photo Upload Page
 */
export class PhotoUploadPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly photoUploadInput: Locator;
  readonly photoPreview: Locator;
  readonly quantityInputs: Locator;
  readonly payAtTentRadio: Locator;
  readonly payOnlineRadio: Locator;
  readonly submitButton: Locator;
  readonly specialInstructionsInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('input[label*="First Name"]');
    this.lastNameInput = page.locator('input[label*="Last Name"]');
    this.emailInput = page.locator('input[label*="Email"]');
    this.phoneInput = page.locator('input[label*="Phone"]');
    this.photoUploadInput = page.locator('input[type="file"]');
    this.photoPreview = page.locator('.photo-preview, .q-img');
    this.quantityInputs = page.locator('input[type="number"]');
    this.payAtTentRadio = page.locator('input[value="pay_at_tent"]');
    this.payOnlineRadio = page.locator('input[value="pay_online"]');
    this.submitButton = page.locator(
      'button:has-text("Add to Cart"), button:has-text("Submit Photos"), button:has-text("Continue to Payment")'
    );
    this.specialInstructionsInput = page.locator(
      'textarea[label*="Special"], textarea[label*="Instructions"]'
    );
    this.signInButton = page.locator('button:has-text("Sign in")');
  }

  async goto() {
    await this.page.goto('/photo-upload');
  }

  async fillCustomerInfo(customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    await this.firstNameInput.fill(customer.firstName);
    await this.lastNameInput.fill(customer.lastName);
    await this.emailInput.fill(customer.email);
    if (customer.phone) {
      await this.phoneInput.fill(customer.phone);
    }
  }

  async uploadPhotos(filePaths: string[]) {
    await this.photoUploadInput.setInputFiles(filePaths);
    // Wait for upload to complete
    await this.page.waitForTimeout(1000);
  }

  async setPhotoQuantity(photoIndex: number, quantity: number) {
    const inputs = await this.quantityInputs.all();
    if (inputs[photoIndex]) {
      await inputs[photoIndex].fill(quantity.toString());
    }
  }

  async setAllPhotoQuantities(quantities: number[]) {
    for (let i = 0; i < quantities.length; i++) {
      await this.setPhotoQuantity(i, quantities[i]);
    }
  }

  async selectPaymentMethod(method: 'pay_at_tent' | 'pay_online') {
    if (method === 'pay_at_tent') {
      await this.payAtTentRadio.click();
    } else {
      await this.payOnlineRadio.click();
    }
  }

  async fillSpecialInstructions(instructions: string) {
    if (await this.specialInstructionsInput.isVisible()) {
      await this.specialInstructionsInput.fill(instructions);
    }
  }

  async clickSubmit() {
    await this.submitButton.click();
  }

  async getSubmitButtonText(): Promise<string> {
    return (await this.submitButton.textContent()) || '';
  }

  async isAtMarketEvent(): Promise<boolean> {
    const text = await this.page.locator('.text-body2').first().textContent();
    return text?.includes('market event pickup') || false;
  }

  async waitForUploadProgress() {
    // Wait for upload progress indicator to disappear
    await this.page
      .waitForSelector('.upload-progress', { state: 'hidden' })
      .catch(() => {});
  }

  async getPhotoCount(): Promise<number> {
    return await this.photoPreview.count();
  }
}

