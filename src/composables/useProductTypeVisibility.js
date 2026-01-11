import { ref } from 'vue';
import { firebaseService } from '../services/firebaseService.js';

// Global singleton state for product type visibility
const productTypeVisibility = ref({
  custom: true, // Default: only custom is enabled
  designer: false, // Default: disabled
  specialty: false, // Default: disabled
});

const visibilityLoaded = ref(false);
let loadPromise = null;

/**
 * Composable for product type visibility settings
 * Provides a global, cached state that loads once and is shared across all components
 */
export function useProductTypeVisibility() {
  /**
   * Load visibility settings from Firebase
   * Uses a promise cache to ensure it only loads once
   */
  const loadVisibilitySettings = async () => {
    // If already loaded, return immediately
    if (visibilityLoaded.value) {
      return productTypeVisibility.value;
    }

    // If currently loading, return the existing promise
    if (loadPromise) {
      return loadPromise;
    }

    // Start loading
    loadPromise = (async () => {
      try {
        const visibility = await firebaseService.getProductTypeVisibility();
        productTypeVisibility.value = visibility;
        visibilityLoaded.value = true;
        return productTypeVisibility.value;
      } catch (error) {
        console.error('Error loading visibility settings:', error);
        // On error, default to only custom enabled
        productTypeVisibility.value = { custom: true, designer: false, specialty: false };
        visibilityLoaded.value = true;
        return productTypeVisibility.value;
      } finally {
        loadPromise = null;
      }
    })();

    return loadPromise;
  };

  /**
   * Initialize visibility settings - call this early in app lifecycle
   */
  const initializeVisibility = async () => {
    if (!visibilityLoaded.value) {
      await loadVisibilitySettings();
    }
  };

  return {
    productTypeVisibility,
    visibilityLoaded,
    loadVisibilitySettings,
    initializeVisibility,
  };
}
