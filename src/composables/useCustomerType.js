import { ref, computed } from 'vue';
import { isMobileDevice } from '../utils/deviceDetection.js';
import { marketEventService } from '../services/marketEventService.js';
import { authService } from '../services/authService.js';

// Customer type constants
export const CUSTOMER_TYPES = {
  ONLINE: 'online_customer',
  MARKET: 'market_customer',
  ADMIN: 'admin',
};

const STORAGE_KEY = 'lil-magnet-customer-type';

// Initialize customer type from localStorage or default to online
const customerType = ref(localStorage.getItem(STORAGE_KEY) || CUSTOMER_TYPES.ONLINE);

class CustomerTypeService {
  setCustomerType(type) {
    if (Object.values(CUSTOMER_TYPES).includes(type)) {
      customerType.value = type;
      localStorage.setItem(STORAGE_KEY, type);
      console.log('Customer type set to:', type);
    } else {
      console.error('Invalid customer type:', type);
    }
  }

  getCustomerType() {
    return customerType.value;
  }

  isOnlineCustomer() {
    return customerType.value === CUSTOMER_TYPES.ONLINE;
  }

  isMarketCustomer() {
    return customerType.value === CUSTOMER_TYPES.MARKET;
  }

  isAdminCustomer() {
    return customerType.value === CUSTOMER_TYPES.ADMIN || authService.isAdmin();
  }

  resetToDefault() {
    // Reset based on current conditions
    if (authService.isAdmin()) {
      this.setCustomerType(CUSTOMER_TYPES.ADMIN);
    } else {
      this.setCustomerType(CUSTOMER_TYPES.ONLINE);
    }
  }
}

export const customerTypeService = new CustomerTypeService();

export function useCustomerType() {
  const shouldShowMarketEventPrompt = computed(() => {
    // Show prompt if:
    // 1. Not already a market customer
    // 2. Not an admin
    // 3. On mobile device
    // 4. There's an active market event
    const hasActiveEvent = marketEventService.getCheckedInEvent() !== null;
    const notMarketCustomer = !customerTypeService.isMarketCustomer();
    const notAdmin = !customerTypeService.isAdminCustomer();
    const onMobile = isMobileDevice();
    
    return hasActiveEvent && notMarketCustomer && notAdmin && onMobile;
  });

  return {
    customerType: computed(() => customerType.value),
    shouldShowMarketEventPrompt,
    setCustomerType: (type) => customerTypeService.setCustomerType(type),
    isOnlineCustomer: () => customerTypeService.isOnlineCustomer(),
    isMarketCustomer: () => customerTypeService.isMarketCustomer(),
    isAdminCustomer: () => customerTypeService.isAdminCustomer(),
  };
}

