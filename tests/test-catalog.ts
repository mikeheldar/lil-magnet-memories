/**
 * Test Catalog
 * Centralized list of all test cases with descriptions
 */

export interface TestCase {
  id: string;
  name: string;
  description: string;
  suite: string;
  suiteFile: string;
  category: string;
  tags: string[];
}

export const testCatalog: TestCase[] = [
  // Market Event NOT Live - Online Orders
  {
    id: 'TC-1.1',
    name: 'Online Order - 1 Photo - Credit Card - Shipping',
    description: 'Complete online order flow: upload 1 photo, pay with credit card, ship to customer. Verify order appears in Order List with correct data.',
    suite: 'Market Event NOT Live - Online Orders',
    suiteFile: 'market-event-not-live',
    category: 'Online Orders',
    tags: ['online', 'credit-card', 'shipping', '1-photo'],
  },
  {
    id: 'TC-1.2',
    name: 'Online Order - 1 Photo - Apple Pay - Shipping',
    description: 'Complete online order flow: upload 1 photo, pay with Apple Pay, ship to customer. Verify payment amount is correct (not $0.00).',
    suite: 'Market Event NOT Live - Online Orders',
    suiteFile: 'market-event-not-live',
    category: 'Online Orders',
    tags: ['online', 'apple-pay', 'shipping', '1-photo'],
  },
  {
    id: 'TC-1.3',
    name: 'Online Order - 15 Photos - Credit Card - Shipping',
    description: 'Complete online order with 15 photos: verify all photos upload, quantities are correct, and order total is accurate.',
    suite: 'Market Event NOT Live - Online Orders',
    suiteFile: 'market-event-not-live',
    category: 'Online Orders',
    tags: ['online', 'credit-card', 'shipping', '15-photos', 'bulk'],
  },
  {
    id: 'TC-1.4',
    name: 'Online Order - 15 Photos - Apple Pay - Shipping',
    description: 'Complete online order with 15 photos using Apple Pay. Verify upload speed is reasonable and payment amount is correct.',
    suite: 'Market Event NOT Live - Online Orders',
    suiteFile: 'market-event-not-live',
    category: 'Online Orders',
    tags: ['online', 'apple-pay', 'shipping', '15-photos', 'bulk'],
  },
  {
    id: 'TC-2.1',
    name: 'Online Order - Credit Card - Local Pickup (No Event)',
    description: 'Complete online order with local pickup option. Verify shipping address is not required and shipping cost is $0.00.',
    suite: 'Market Event NOT Live - Online Orders',
    suiteFile: 'market-event-not-live',
    category: 'Online Orders',
    tags: ['online', 'credit-card', 'pickup', 'local'],
  },
  
  // Market Event LIVE - User Toggles "At Event"
  {
    id: 'TC-3.1',
    name: 'Market Event Live - Toggle ON - 1 Photo - Pay at Tent',
    description: 'User toggles "I\'m at the event" ON, uploads 1 photo, selects "Pay at Tent". Verify order shows pickup and pay at tent options.',
    suite: 'Market Event LIVE - User Toggles "At Event"',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'toggle-on', 'pay-at-tent', 'pickup', '1-photo'],
  },
  {
    id: 'TC-3.2',
    name: 'Market Event Live - Toggle ON - 1 Photo - Pay Online',
    description: 'User toggles "I\'m at the event" ON, uploads 1 photo, selects "Pay Online Now". Verify checkout shows market event pickup notice.',
    suite: 'Market Event LIVE - User Toggles "At Event"',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'toggle-on', 'pay-online', 'pickup', '1-photo'],
  },
  {
    id: 'TC-3.3',
    name: 'Market Event Live - Toggle ON - 15 Photos - Pay at Tent',
    description: 'User toggles "I\'m at the event" ON, uploads 15 photos, selects "Pay at Tent". Verify all photos are saved and order is associated with event.',
    suite: 'Market Event LIVE - User Toggles "At Event"',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'toggle-on', 'pay-at-tent', 'pickup', '15-photos', 'bulk'],
  },
  {
    id: 'TC-3.4',
    name: 'Market Event Live - Toggle ON - 15 Photos - Apple Pay',
    description: 'User toggles "I\'m at the event" ON, uploads 15 photos, pays with Apple Pay. Verify order total is correct and delivery is pickup.',
    suite: 'Market Event LIVE - User Toggles "At Event"',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'toggle-on', 'apple-pay', 'pickup', '15-photos', 'bulk'],
  },
  
  // Market Event LIVE - Popup Flow
  {
    id: 'TC-4.1',
    name: 'Market Event Live - No Toggle - Answer YES to Popup',
    description: 'Market event is live, user has NOT toggled. Click "Start Creating Magnets", answer YES to popup. Verify navigation to market event upload.',
    suite: 'Market Event LIVE - User Does NOT Toggle (Popup Flow)',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'popup', 'yes', 'navigation'],
  },
  {
    id: 'TC-4.2',
    name: 'Market Event Live - No Toggle - Answer NO to Popup',
    description: 'Market event is live, user has NOT toggled. Click "Start Creating Magnets", answer NO to popup. Verify navigation to online order flow.',
    suite: 'Market Event LIVE - User Does NOT Toggle (Popup Flow)',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'popup', 'no', 'online'],
  },
  {
    id: 'TC-4.3',
    name: 'Market Event Live - Toggle OFF Explicitly - No Popup',
    description: 'Market event is live, user explicitly toggles OFF. Click "Start Creating Magnets". Verify NO popup appears and goes directly to online order.',
    suite: 'Market Event LIVE - User Does NOT Toggle (Popup Flow)',
    suiteFile: 'market-event-live',
    category: 'Market Events',
    tags: ['market-event', 'toggle-off', 'no-popup', 'online'],
  },
  
  // Authenticated Users
  {
    id: 'TC-5.1',
    name: 'Authenticated User - Online Order - View My Orders',
    description: 'Authenticated user completes online order. Verify "View My Orders" button is visible on thank you page and order appears in Customer Orders.',
    suite: 'Authenticated User Scenarios',
    suiteFile: 'authenticated-users',
    category: 'Authentication',
    tags: ['authenticated', 'online', 'my-orders', 'view-orders'],
  },
  {
    id: 'TC-5.2',
    name: 'Authenticated User - Market Event Order - View My Orders',
    description: 'Authenticated user completes market event order. Verify order appears in both Customer Orders and Order List with correct market event info.',
    suite: 'Authenticated User Scenarios',
    suiteFile: 'authenticated-users',
    category: 'Authentication',
    tags: ['authenticated', 'market-event', 'my-orders'],
  },
  
  // Data Integrity
  {
    id: 'TC-6.1',
    name: 'Order List - Sorting and Search',
    description: 'Verify orders are sorted by date (most recent first), search works for name/email, filters work correctly, and no invalid dates appear.',
    suite: 'Data Integrity and Button Functionality',
    suiteFile: 'data-integrity',
    category: 'Data Integrity',
    tags: ['order-list', 'sorting', 'search', 'filters'],
  },
  {
    id: 'TC-6.2',
    name: 'Order Receipt Data Validation',
    description: 'Verify order receipt shows correct order number, customer info, total magnets, total amount, delivery option, and payment method.',
    suite: 'Data Integrity and Button Functionality',
    suiteFile: 'data-integrity',
    category: 'Data Integrity',
    tags: ['receipt', 'validation', 'data-integrity'],
  },
  {
    id: 'TC-6.3',
    name: 'Button Functionality - Thank You Page',
    description: 'Verify all buttons on thank you page work: "Submit Another Order", "View My Orders" (if authenticated), and "Back to Home".',
    suite: 'Data Integrity and Button Functionality',
    suiteFile: 'data-integrity',
    category: 'Data Integrity',
    tags: ['buttons', 'navigation', 'thank-you'],
  },
  {
    id: 'TC-6.4',
    name: 'Photo Upload Progress and Speed',
    description: 'Upload 15 photos and verify upload progress indicator shows, upload completes in reasonable time (< 60 seconds), and all photos are saved.',
    suite: 'Data Integrity and Button Functionality',
    suiteFile: 'data-integrity',
    category: 'Data Integrity',
    tags: ['upload', 'progress', 'speed', '15-photos'],
  },
  {
    id: 'TC-6.5',
    name: 'Payment Button Loading States',
    description: 'Verify "Place Order" and "Buy with Apple Pay" buttons show loading/spinning state during processing and are disabled until navigation completes.',
    suite: 'Data Integrity and Button Functionality',
    suiteFile: 'data-integrity',
    category: 'Data Integrity',
    tags: ['payment', 'loading', 'buttons', 'ui'],
  },
  {
    id: 'TC-6.6',
    name: 'Order Total Calculation - $0.00 Prevention',
    description: 'Verify order totals are never $0.00 (unless actually free), payment amounts are correct, and cart calculations are accurate.',
    suite: 'Data Integrity and Button Functionality',
    suiteFile: 'data-integrity',
    category: 'Data Integrity',
    tags: ['pricing', 'calculation', 'validation'],
  },
  
  // Edge Cases
  {
    id: 'TC-7.1',
    name: 'Form Validation - Required Fields',
    description: 'Verify form validation works for all required fields (First Name, Last Name, Email), shows clear error messages, and only submits when valid.',
    suite: 'Edge Cases and Error Handling',
    suiteFile: 'edge-cases',
    category: 'Edge Cases',
    tags: ['validation', 'form', 'required-fields'],
  },
  {
    id: 'TC-7.2',
    name: 'Market Event Toggle Persistence',
    description: 'Verify market event toggle state persists across navigation. Toggle ON, navigate away and back, verify state is still ON (and same for OFF).',
    suite: 'Edge Cases and Error Handling',
    suiteFile: 'edge-cases',
    category: 'Edge Cases',
    tags: ['toggle', 'persistence', 'state'],
  },
  {
    id: 'TC-7.3',
    name: 'Multiple Orders - Order Number Uniqueness',
    description: 'Create multiple orders and verify all order numbers are unique, follow expected format, and no duplicates exist in Order List.',
    suite: 'Edge Cases and Error Handling',
    suiteFile: 'edge-cases',
    category: 'Edge Cases',
    tags: ['order-numbers', 'uniqueness', 'validation'],
  },
];

/**
 * Get tests by suite file
 */
export function getTestsBySuite(suiteFile: string): TestCase[] {
  if (suiteFile === 'all') {
    return testCatalog;
  }
  return testCatalog.filter((test) => test.suiteFile === suiteFile);
}

/**
 * Get tests by category
 */
export function getTestsByCategory(category: string): TestCase[] {
  return testCatalog.filter((test) => test.category === category);
}

/**
 * Search tests by name or description
 */
export function searchTests(query: string): TestCase[] {
  const lowerQuery = query.toLowerCase();
  return testCatalog.filter(
    (test) =>
      test.name.toLowerCase().includes(lowerQuery) ||
      test.description.toLowerCase().includes(lowerQuery) ||
      test.id.toLowerCase().includes(lowerQuery) ||
      test.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}
