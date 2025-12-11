/**
 * Test configuration for Lil Magnet Memories test suite
 */

export interface TestConfig {
  baseUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  square: {
    applicationId: string;
    locationId: string;
    testMode: boolean;
  };
  testData: {
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    shippingAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
    billingAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  timeouts: {
    navigation: number;
    upload: number;
    payment: number;
  };
}

export const testConfig: TestConfig = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:9000',
  firebase: {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || '',
  },
  square: {
    applicationId: process.env.VITE_SQUARE_APPLICATION_ID || '',
    locationId: process.env.VITE_SQUARE_LOCATION_ID || '',
    testMode: process.env.VITE_SQUARE_TEST_MODE === 'true',
  },
  testData: {
    customer: {
      firstName: 'Test',
      lastName: 'Customer',
      email: `test-${Date.now()}@example.com`,
      phone: '(555) 123-4567',
    },
    shippingAddress: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'CA',
      zip: '12345',
    },
    billingAddress: {
      street: '456 Billing Ave',
      city: 'Billing City',
      state: 'NY',
      zip: '67890',
    },
  },
  timeouts: {
    navigation: 30000,
    upload: 60000,
    payment: 30000,
  },
};

