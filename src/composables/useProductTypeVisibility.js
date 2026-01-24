import { ref } from 'vue';
import { firebaseService } from '../services/firebaseService.js';

// Global singleton state for product type visibility
// Initialize ALL as false - only show after explicitly loaded from Firebase
// This prevents race conditions where items show before visibility is confirmed
const productTypeVisibility = ref({
  custom: false, // Will be set after loading from Firebase
  designer: false, // Will be set after loading from Firebase
  specialty: false, // Will be set after loading from Firebase
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
        console.log('🔄 [Visibility] Loading visibility settings from Firebase...');
        const visibility = await firebaseService.getProductTypeVisibility();
        console.log('✅ [Visibility] Loaded visibility settings:', visibility);
        productTypeVisibility.value = visibility;
        // CRITICAL: Only set visibilityLoaded to true AFTER visibility is set
        // This ensures the template doesn't render with defaults
        visibilityLoaded.value = true;
        console.log('✅ [Visibility] visibilityLoaded set to true');
        return productTypeVisibility.value;
      } catch (error) {
        console.error('❌ [Visibility] Error loading visibility settings:', error);
        // On error, default to only custom enabled (but still mark as loaded)
        // This ensures we have a safe default state after attempting to load
        productTypeVisibility.value = { custom: true, designer: false, specialty: false };
        visibilityLoaded.value = true;
        console.log('⚠️ [Visibility] Using default visibility settings due to error:', productTypeVisibility.value);
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
