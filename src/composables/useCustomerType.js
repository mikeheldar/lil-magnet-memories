import { ref, computed, watch, onMounted } from 'vue';
import { isMobileDevice } from '../utils/deviceDetection.js';
import { marketEventService } from '../services/marketEventService.js';
import { authService } from '../services/authService.js';
import { userPreferencesService } from '../services/userPreferencesService.js';
import { auth } from '../firebase/config.js';
import { onAuthStateChanged } from 'firebase/auth';
import { safeLocalStorage } from '../utils/ssrSafeStorage.js';

// Customer type constants
export const CUSTOMER_TYPES = {
  ONLINE: 'online_customer',
  MARKET: 'market_customer',
  ADMIN: 'admin',
};

const STORAGE_KEY = 'lil-magnet-customer-type';

// Initialize customer type from localStorage or default to online
const customerType = ref(
  safeLocalStorage.getItem(STORAGE_KEY) || CUSTOMER_TYPES.ONLINE
);

class CustomerTypeService {
  constructor() {
    this.preferencesUnsubscribe = null;
    
    // SSR Safety: Only set up auth listener on client
    if (typeof window !== 'undefined') {
      // Listen for auth state changes to sync preferences
      onAuthStateChanged(auth, async (user) => {
        // Clean up existing listener
        if (this.preferencesUnsubscribe) {
          this.preferencesUnsubscribe();
          this.preferencesUnsubscribe = null;
        }
        
        if (user && !user.isAnonymous) {
          // User logged in - wait a moment for preferences service to initialize
          await new Promise((resolve) => setTimeout(resolve, 300));
          // Load from Firestore immediately
          await this.loadFromFirestore(user.uid);
          // Set up listener for real-time updates
          this.preferencesUnsubscribe = userPreferencesService.addListener(async () => {
            console.log('🔄 Customer type listener triggered - reloading from Firestore');
            await this.loadFromFirestore(user.uid);
          });
        } else {
          // User logged out or anonymous - use localStorage
          const stored = safeLocalStorage.getItem(STORAGE_KEY);
          if (stored) {
            customerType.value = stored;
          }
        }
      });
    }
  }

  async loadFromFirestore(userId) {
    try {
      // Wait a moment for preferences to be loaded if they're not cached yet
      let isAtEvent = userPreferencesService.isCustomerAtEvent();
      if (userPreferencesService.preferencesCache === null) {
        // Preferences not loaded yet, wait for them
        console.log('⏳ Preferences not loaded yet, waiting...');
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Try loading directly
        await userPreferencesService.loadPreferences(userId);
        isAtEvent = userPreferencesService.isCustomerAtEvent();
      }
      
      console.log('📥 Loading customer type from Firestore, isAtEvent:', isAtEvent);
      
      // Map isCustomerAtEvent to customer type
      if (isAtEvent) {
        customerType.value = CUSTOMER_TYPES.MARKET;
        console.log('✅ Set customer type to MARKET');
      } else {
        // Check if there's a stored customer type preference
        const storedType = userPreferencesService.getPreference('customerType');
        if (storedType && Object.values(CUSTOMER_TYPES).includes(storedType)) {
          customerType.value = storedType;
          console.log('✅ Set customer type to stored type:', storedType);
        } else {
          customerType.value = CUSTOMER_TYPES.ONLINE;
          console.log('✅ Set customer type to ONLINE (default)');
        }
      }
      // Also update localStorage for consistency
      safeLocalStorage.setItem(STORAGE_KEY, customerType.value);
    } catch (error) {
      console.error('Error loading customer type from Firestore:', error);
      // Fallback to localStorage
      const stored = safeLocalStorage.getItem(STORAGE_KEY);
      if (stored) {
        customerType.value = stored;
      }
    }
  }

  async setCustomerType(type) {
    if (Object.values(CUSTOMER_TYPES).includes(type)) {
      customerType.value = type;
      safeLocalStorage.setItem(STORAGE_KEY, type);
      
      // For logged-in users, also save to Firestore
      const user = auth.currentUser;
      if (user && !user.isAnonymous) {
        try {
          console.log('💾 Saving customer type to Firestore:', type);
          // Update isCustomerAtEvent based on customer type
          const isAtEvent = type === CUSTOMER_TYPES.MARKET;
          await userPreferencesService.setIsCustomerAtEvent(isAtEvent);
          // Also save customer type preference
          await userPreferencesService.setPreference('customerType', type);
          console.log('✅ Customer type saved to Firestore successfully');
        } catch (error) {
          console.error('❌ Error saving customer type to Firestore:', error);
        }
      }
      
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
    isOnlineCustomer: computed(() => customerTypeService.isOnlineCustomer()),
    isMarketCustomer: computed(() => customerTypeService.isMarketCustomer()),
    isAdminCustomer: computed(() => customerTypeService.isAdminCustomer()),
  };
}
