/**
 * Theme Preload Script
 * This script runs BEFORE Vue mounts to apply theme styles immediately
 * This prevents flash of unstyled content and ensures theme is applied instantly
 */
(function() {
  'use strict';
  
  // Apply theme from localStorage immediately (synchronous, no delay)
  function applyCachedTheme() {
    try {
      const storedTheme = localStorage.getItem('activeTheme');
      if (storedTheme) {
        const theme = JSON.parse(storedTheme);
        if (theme && theme.styles) {
          // Remove existing theme styles if any
          const existingStyle = document.getElementById('theme-preload-styles');
          if (existingStyle) {
            existingStyle.remove();
          }
          
          // Inject theme styles into head immediately
          const style = document.createElement('style');
          style.id = 'theme-preload-styles';
          style.textContent = theme.styles;
          document.head.appendChild(style);
          
          console.log('[ThemePreload] Applied cached theme:', theme.name);
          return true;
        }
      }
    } catch (error) {
      console.error('[ThemePreload] Error applying cached theme:', error);
    }
    return false;
  }
  
  // Try to apply cached theme immediately
  if (document.readyState === 'loading') {
    // If document is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', applyCachedTheme);
  } else {
    // Document already loaded, apply immediately
    applyCachedTheme();
  }
  
  // Also apply immediately if head is available
  if (document.head) {
    applyCachedTheme();
  }
})();
