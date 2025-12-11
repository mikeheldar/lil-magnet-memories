/**
 * Test Data Factory
 * Generates consistent test data for use in test scenarios
 */

export interface TestCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TestAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface TestProduct {
  id: string;
  description: string;
  category: string;
  pricing: Record<string, number>;
}

export class TestDataFactory {
  private static customerCounter = 0;
  private static orderCounter = 0;

  /**
   * Generate a unique test customer
   */
  static createCustomer(overrides?: Partial<TestCustomer>): TestCustomer {
    this.customerCounter++;
    const timestamp = Date.now();
    return {
      firstName: overrides?.firstName || `Test${this.customerCounter}`,
      lastName: overrides?.lastName || `Customer${this.customerCounter}`,
      email:
        overrides?.email ||
        `test-${timestamp}-${this.customerCounter}@example.com`,
      phone:
        overrides?.phone ||
        `(555) ${String(this.customerCounter).padStart(3, '0')}-${String(
          timestamp
        ).slice(-4)}`,
    };
  }

  /**
   * Generate a test shipping address
   */
  static createShippingAddress(overrides?: Partial<TestAddress>): TestAddress {
    return {
      street: overrides?.street || '123 Test Street',
      city: overrides?.city || 'Test City',
      state: overrides?.state || 'CA',
      zip: overrides?.zip || '12345',
    };
  }

  /**
   * Generate a test billing address
   */
  static createBillingAddress(overrides?: Partial<TestAddress>): TestAddress {
    return {
      street: overrides?.street || '456 Billing Avenue',
      city: overrides?.city || 'Billing City',
      state: overrides?.state || 'NY',
      zip: overrides?.zip || '67890',
    };
  }

  /**
   * Generate a unique order number
   */
  static generateOrderNumber(): string {
    this.orderCounter++;
    const timestamp = Date.now().toString().slice(-8);
    return `ORD-${timestamp}-${String(this.orderCounter).padStart(4, '0')}`;
  }

  /**
   * Generate test market event data
   */
  static createMarketEvent(overrides?: {
    name?: string;
    location?: string;
    startDateTime?: Date;
    endDateTime?: Date;
  }) {
    const now = new Date();
    const start =
      overrides?.startDateTime || new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const end =
      overrides?.endDateTime || new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours from now

    return {
      name: overrides?.name || `Test Market Event ${Date.now()}`,
      location: overrides?.location || 'Test Market Location',
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      isTesting: true,
    };
  }

  /**
   * Generate test photo file names
   */
  static generatePhotoFileNames(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `test-photo-${i + 1}.jpg`);
  }

  /**
   * Generate quantities for photos
   */
  static generatePhotoQuantities(
    photoCount: number,
    minQty: number = 1,
    maxQty: number = 5
  ): number[] {
    return Array.from({ length: photoCount }, () => {
      return Math.floor(Math.random() * (maxQty - minQty + 1)) + minQty;
    });
  }
}

