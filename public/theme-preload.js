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
          
          // Also apply inline styles directly to header element if it exists
          // This ensures header styling is instant even before Vue mounts
          const header = document.querySelector('.q-header, [class*="q-header"], header');
          if (header) {
            // Check if this is a white header theme
            const isWhiteHeader = theme.name && theme.name.includes('LineA Modern White Header');
            if (isWhiteHeader) {
              header.style.setProperty('background', '#ffffff', 'important');
              header.style.setProperty('background-color', '#ffffff', 'important');
              header.style.setProperty('background-image', 'none', 'important');
            } else if (theme.name && theme.name.includes('LineA Modern Black Header')) {
              header.style.setProperty('background', 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', 'important');
              header.style.setProperty('background-color', '#000000', 'important');
              header.style.setProperty('background-image', 'none', 'important');
            }
          }
          
          // Apply header title font styles immediately if title element exists
          const titleSpan = document.querySelector('.q-toolbar-title span, .q-toolbar-title');
          if (titleSpan) {
            const isLineAModern = theme.name && 
              (theme.name.includes('LineA Modern Black Header') || 
               theme.name.includes('LineA Modern White Header'));
            
            if (isLineAModern) {
              const isWhiteHeader = theme.name.includes('White Header');
              titleSpan.style.setProperty('font-family', "'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive", 'important');
              titleSpan.style.setProperty('font-weight', '400', 'important');
              titleSpan.style.setProperty('font-style', 'normal', 'important');
              titleSpan.style.setProperty('letter-spacing', '0.05em', 'important');
              titleSpan.style.setProperty('text-transform', 'none', 'important');
              titleSpan.style.setProperty('color', isWhiteHeader ? '#1a1a1a' : '#ffffff', 'important');
            }
          }
          
          console.log('[ThemePreload] Applied cached theme:', theme.name);
          return true;
        }
      }
    } catch (error) {
      console.error('[ThemePreload] Error applying cached theme:', error);
    }
    return false;
  }
  
  // Function to wait for elements and apply styles
  function waitAndApply() {
    if (document.head) {
      applyCachedTheme();
    }
    
    // Also try to apply when body is ready (for header element)
    if (document.body) {
      // Use MutationObserver to catch when Vue creates the header
      const observer = new MutationObserver(function(mutations) {
        const header = document.querySelector('.q-header, [class*="q-header"]');
        const titleSpan = document.querySelector('.q-toolbar-title span, .q-toolbar-title');
        
        if (header || titleSpan) {
          applyCachedTheme();
          // Stop observing once we've applied
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Also try immediately
      applyCachedTheme();
    }
  }
  
  // Try to apply cached theme immediately
  if (document.readyState === 'loading') {
    // If document is still loading, wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', waitAndApply);
  } else {
    // Document already loaded, apply immediately
    waitAndApply();
  }
  
  // Also apply immediately if head is available
  if (document.head) {
    applyCachedTheme();
  }
})();
