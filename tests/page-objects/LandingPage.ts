import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Landing Page
 */
export class LandingPage {
  readonly page: Page;
  readonly startCreatingMagnetsButton: Locator;
  readonly marketEventBanner: Locator;
  readonly marketEventToggle: Locator;
  readonly easelContainer: Locator;
  readonly easelImage: Locator;
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startCreatingMagnetsButton = page.locator(
      'button:has-text("Start Creating Magnets")'
    );
    this.marketEventBanner = page.locator('.market-event-banner');
    this.marketEventToggle = page.locator(
      '.banner-toggle input[type="checkbox"]'
    );
    this.easelContainer = page.locator('.easel-container');
    this.easelImage = page.locator('.easel-image');
    this.heroTitle = page.locator('.hero-title');
    this.heroSubtitle = page.locator('.hero-subtitle');
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickStartCreatingMagnets() {
    await this.startCreatingMagnetsButton.click();
  }

  async toggleMarketEventAtEvent(on: boolean) {
    const isChecked = await this.marketEventToggle.isChecked();
    if (isChecked !== on) {
      await this.marketEventToggle.click();
    }
  }

  async isMarketEventBannerVisible(): Promise<boolean> {
    return await this.marketEventBanner.isVisible();
  }

  async getMarketEventName(): Promise<string> {
    return (
      (await this.marketEventBanner
        .locator('text=/Market Event Live!/')
        .textContent()) || ''
    );
  }

  async clickEaselImage() {
    await this.easelContainer.click();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.heroTitle.waitFor({ state: 'visible' });
  }
}

