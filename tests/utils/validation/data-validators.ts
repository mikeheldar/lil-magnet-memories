/**
 * Data Validation Helpers
 * Functions to validate order data, dates, totals, photos, etc.
 */

export interface OrderValidationResult {
  valid: boolean;
  errors: string[];
}

export class DataValidators {
  /**
   * Validate order number format
   */
  static validateOrderNumber(orderNumber: string): boolean {
    // Order numbers should match pattern like ORD-12345678-0001
    const pattern = /^ORD-[0-9]{8}-[0-9]{4}$/;
    return pattern.test(orderNumber);
  }

  /**
   * Validate date is not invalid
   */
  static validateDate(dateString: string | Date | null | undefined): boolean {
    if (!dateString) return false;

    try {
      const date =
        typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return false;

      const dateStr = date.toString();
      if (dateStr.includes('Invalid Date') || dateStr.includes('NaN')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate order total is not zero (unless actually free)
   */
  static validateOrderTotal(total: number, isFree: boolean = false): boolean {
    if (isFree) return total === 0;
    return total > 0;
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  /**
   * Validate phone number format
   */
  static validatePhone(phone: string): boolean {
    // Accepts formats like (555) 123-4567 or 555-123-4567
    const pattern = /^[\d\s\-\(\)]+$/;
    return pattern.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  /**
   * Validate complete order data
   */
  static validateOrder(order: {
    orderNumber?: string;
    customer?: { firstName?: string; lastName?: string; email?: string };
    totalAmount?: number;
    submissionDate?: string | Date;
    photos?: any[];
    paymentMethod?: string;
    deliveryOption?: string;
  }): OrderValidationResult {
    const errors: string[] = [];

    if (order.orderNumber && !this.validateOrderNumber(order.orderNumber)) {
      errors.push(`Invalid order number format: ${order.orderNumber}`);
    }

    if (order.customer) {
      if (!order.customer.firstName) {
        errors.push('Missing customer first name');
      }
      if (!order.customer.lastName) {
        errors.push('Missing customer last name');
      }
      if (order.customer.email && !this.validateEmail(order.customer.email)) {
        errors.push(`Invalid email format: ${order.customer.email}`);
      }
    }

    if (order.totalAmount !== undefined) {
      if (!this.validateOrderTotal(order.totalAmount)) {
        errors.push(`Invalid order total: $${order.totalAmount}`);
      }
    }

    if (order.submissionDate && !this.validateDate(order.submissionDate)) {
      errors.push(`Invalid submission date: ${order.submissionDate}`);
    }

    if (order.photos && order.photos.length === 0) {
      errors.push('Order has no photos');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate order dates are sorted correctly (newest first)
   */
  static validateOrderDateSorting(dates: (string | Date)[]): boolean {
    if (dates.length < 2) return true;

    const parsedDates = dates
      .map((d) => {
        try {
          return typeof d === 'string' ? new Date(d) : d;
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

    if (parsedDates.length < 2) return false;

    // Check if dates are in descending order (newest first)
    for (let i = 1; i < parsedDates.length; i++) {
      if (parsedDates[i - 1] < parsedDates[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate photo count matches expected
   */
  static validatePhotoCount(actual: number, expected: number): boolean {
    return actual === expected;
  }

  /**
   * Validate payment method is one of the expected values
   */
  static validatePaymentMethod(method: string): boolean {
    const validMethods = [
      'Credit Card',
      'Apple Pay',
      'Pay at Tent',
      'pay_at_tent',
      'pay_online',
    ];
    return validMethods.some((m) => method.includes(m));
  }

  /**
   * Validate delivery option is one of the expected values
   */
  static validateDeliveryOption(option: string): boolean {
    const validOptions = [
      'Shipping',
      'Pickup',
      'Pickup at Market Event',
      'Local Pickup',
      'Standard Shipping',
      'Express Shipping',
    ];
    return validOptions.some((o) => option.includes(o));
  }
}

