/**
 * Payment Mocker
 * Utilities to mock Square and Apple Pay payment flows for testing
 */

import { Page } from '@playwright/test';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class PaymentMocker {
  /**
   * Mock Square payment API response
   */
  static async mockSquarePayment(
    page: Page,
    success: boolean = true,
    amount: number = 0
  ): Promise<void> {
    await page.route('**/api/square/payment', async (route) => {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionId: `test-txn-${Date.now()}`,
            amount: amount,
          }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Payment failed',
          }),
        });
      }
    });
  }

  /**
   * Mock Apple Pay availability
   */
  static async mockApplePayAvailable(
    page: Page,
    available: boolean = true
  ): Promise<void> {
    await page.addInitScript((available) => {
      // Mock Apple Pay availability
      if (available) {
        (window as any).ApplePaySession = class MockApplePaySession {
          static canMakePayments() {
            return true;
          }
          static supportsVersion() {
            return true;
          }
          constructor() {}
          begin() {}
        };
      } else {
        delete (window as any).ApplePaySession;
      }
    }, available);
  }

  /**
   * Mock Apple Pay payment flow
   */
  static async mockApplePayFlow(
    page: Page,
    success: boolean = true
  ): Promise<void> {
    await this.mockApplePayAvailable(page, true);

    // Intercept Apple Pay button clicks
    await page.route('**/api/square/apple-pay', async (route) => {
      if (success) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            transactionId: `test-apple-pay-${Date.now()}`,
          }),
        });
      } else {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Apple Pay failed',
          }),
        });
      }
    });
  }

  /**
   * Get test credit card details
   */
  static getTestCreditCard() {
    return {
      number: '4111111111111111', // Square test card
      expiry: '12/25',
      cvv: '123',
      zip: '12345',
    };
  }

  /**
   * Get test credit card that will fail
   */
  static getFailingCreditCard() {
    return {
      number: '4000000000000002', // Square test card that declines
      expiry: '12/25',
      cvv: '123',
      zip: '12345',
    };
  }
}

