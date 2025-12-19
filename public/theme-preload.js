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

          // Add a high-priority style rule that will apply to header when Vue creates it
          // This ensures header styling is instant even before Vue mounts
          const isWhiteHeader = theme.name && theme.name.includes('LineA Modern White Header');
          const isBlackHeader = theme.name && theme.name.includes('LineA Modern Black Header');
          const isLineAModern = theme.name &&
            (theme.name.includes('LineA Modern Black Header') ||
             theme.name.includes('LineA Modern White Header'));
          
          if (isWhiteHeader || isBlackHeader || isLineAModern) {
            // Add additional high-priority styles for header
            const headerStyle = document.createElement('style');
            headerStyle.id = 'theme-preload-header-styles';
            let headerCSS = '';
            
            if (isWhiteHeader) {
              headerCSS += `
                .q-header, [class*="q-header"], header {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  background-image: none !important;
                }
              `;
            } else if (isBlackHeader) {
              headerCSS += `
                .q-header, [class*="q-header"], header {
                  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
                  background-color: #000000 !important;
                  background-image: none !important;
                }
              `;
            }
            
            if (isLineAModern) {
              const textColor = isWhiteHeader ? '#1a1a1a' : '#ffffff';
              headerCSS += `
                .q-toolbar-title, .q-toolbar-title span, .q-toolbar-title span.text-h5.text-weight-bold {
                  font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
                  font-weight: 400 !important;
                  font-style: normal !important;
                  letter-spacing: 0.05em !important;
                  text-transform: none !important;
                  color: ${textColor} !important;
                }
              `;
            }
            
            if (headerCSS) {
              headerStyle.textContent = headerCSS;
              document.head.appendChild(headerStyle);
            }
          }
          
          // Also try to apply inline styles directly if elements already exist
          const header = document.querySelector('.q-header, [class*="q-header"], header');
          if (header) {
            if (isWhiteHeader) {
              header.style.setProperty('background', '#ffffff', 'important');
              header.style.setProperty('background-color', '#ffffff', 'important');
              header.style.setProperty('background-image', 'none', 'important');
            } else if (isBlackHeader) {
              header.style.setProperty('background', 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', 'important');
              header.style.setProperty('background-color', '#000000', 'important');
              header.style.setProperty('background-image', 'none', 'important');
            }
          }
          
          // Apply header title font styles immediately if title element exists
          const titleSpan = document.querySelector('.q-toolbar-title span, .q-toolbar-title');
          if (titleSpan && isLineAModern) {
            const textColor = isWhiteHeader ? '#1a1a1a' : '#ffffff';
            titleSpan.style.setProperty('font-family', "'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive", 'important');
            titleSpan.style.setProperty('font-weight', '400', 'important');
            titleSpan.style.setProperty('font-style', 'normal', 'important');
            titleSpan.style.setProperty('letter-spacing', '0.05em', 'important');
            titleSpan.style.setProperty('text-transform', 'none', 'important');
            titleSpan.style.setProperty('color', textColor, 'important');
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

  // Aggressive function to wait for elements and apply styles
  function waitAndApply() {
    if (document.head) {
      applyCachedTheme();
    }
    
    // Aggressively check for header element using requestAnimationFrame
    let checkCount = 0;
    const maxChecks = 100; // Check for up to ~6 seconds (100 * 16ms)
    
    function checkForHeader() {
      checkCount++;
      const header = document.querySelector('.q-header, [class*="q-header"], header');
      const titleSpan = document.querySelector('.q-toolbar-title span.text-h5.text-weight-bold, .q-toolbar-title span, .q-toolbar-title');
      
      if (header || titleSpan) {
        applyCachedTheme();
        // Keep checking for a bit to catch any Vue re-renders
        if (checkCount < 20) {
          requestAnimationFrame(checkForHeader);
        }
      } else if (checkCount < maxChecks) {
        requestAnimationFrame(checkForHeader);
      }
    }
    
    // Start checking immediately
    if (document.body) {
      // Use MutationObserver to catch when Vue creates the header
      const observer = new MutationObserver(function(mutations) {
        const header = document.querySelector('.q-header, [class*="q-header"]');
        const titleSpan = document.querySelector('.q-toolbar-title span, .q-toolbar-title');
        
        if (header || titleSpan) {
          applyCachedTheme();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
      });
      
      // Also use requestAnimationFrame for aggressive checking
      requestAnimationFrame(checkForHeader);
      
      // Also try immediately
      applyCachedTheme();
    } else {
      // Body not ready, wait for it
      document.addEventListener('DOMContentLoaded', function() {
        requestAnimationFrame(checkForHeader);
      });
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
