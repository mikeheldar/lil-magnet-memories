/**
 * General Test Helpers
 * Common utilities for test scenarios
 */

import { Page } from '@playwright/test';

export class TestHelpers {
  /**
   * Wait for navigation to complete
   */
  static async waitForNavigation(
    page: Page,
    timeout: number = 30000
  ): Promise<void> {
    await page.waitForLoadState('networkidle', { timeout });
  }

  /**
   * Take a screenshot with timestamp
   */
  static async takeScreenshot(page: Page, name: string): Promise<void> {
    await page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  /**
   * Wait for element to be visible with timeout
   */
  static async waitForVisible(
    page: Page,
    selector: string,
    timeout: number = 10000
  ): Promise<void> {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Fill form field with retry
   */
  static async fillWithRetry(
    page: Page,
    selector: string,
    value: string,
    retries: number = 3
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await page.fill(selector, value);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Click button with retry
   */
  static async clickWithRetry(
    page: Page,
    selector: string,
    retries: number = 3
  ): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await page.click(selector);
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await page.waitForTimeout(500);
      }
    }
  }

  /**
   * Generate unique test email
   */
  static generateTestEmail(prefix: string = 'test'): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@example.com`;
  }

  /**
   * Wait for API call to complete
   */
  static async waitForApiCall(
    page: Page,
    urlPattern: string | RegExp,
    timeout: number = 30000
  ): Promise<void> {
    await page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }

  /**
   * Clear browser storage
   */
  static async clearStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Set localStorage value
   */
  static async setLocalStorage(
    page: Page,
    key: string,
    value: string
  ): Promise<void> {
    await page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key, value }
    );
  }

  /**
   * Get localStorage value
   */
  static async getLocalStorage(
    page: Page,
    key: string
  ): Promise<string | null> {
    return await page.evaluate((key) => {
      return localStorage.getItem(key);
    }, key);
  }
}

