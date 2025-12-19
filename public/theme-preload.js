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
                /* Override Quasar bg-primary with maximum specificity */
                html body .q-layout .q-header.bg-primary,
                html body .q-header.bg-primary,
                body .q-layout .q-header.bg-primary,
                body .q-header.bg-primary,
                .q-layout .q-header.bg-primary,
                .q-header.bg-primary,
                html body .q-layout .q-header,
                html body .q-header,
                body .q-layout .q-header,
                body .q-header,
                .q-layout .q-header,
                .q-header,
                [class*="q-header"] {
                  background: #ffffff !important;
                  background-color: #ffffff !important;
                  background-image: none !important;
                }
                /* Override toolbar background too */
                html body .q-header .q-toolbar,
                body .q-header .q-toolbar,
                .q-header .q-toolbar {
                  background: transparent !important;
                  background-color: transparent !important;
                }
              `;
            } else if (isBlackHeader) {
              headerCSS += `
                /* Override Quasar bg-primary with maximum specificity */
                html body .q-layout .q-header.bg-primary,
                html body .q-header.bg-primary,
                body .q-layout .q-header.bg-primary,
                body .q-header.bg-primary,
                .q-layout .q-header.bg-primary,
                .q-header.bg-primary,
                html body .q-layout .q-header,
                html body .q-header,
                body .q-layout .q-header,
                body .q-header,
                .q-layout .q-header,
                .q-header,
                [class*="q-header"] {
                  background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
                  background-color: #000000 !important;
                  background-image: none !important;
                }
                /* Override toolbar background too */
                html body .q-header .q-toolbar,
                body .q-header .q-toolbar,
                .q-header .q-toolbar {
                  background: transparent !important;
                  background-color: transparent !important;
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

          // Function to apply inline styles directly to header (highest priority)
          function applyHeaderInlineStyles() {
            const header = document.querySelector('.q-header, [class*="q-header"], header');
            if (header) {
              if (isWhiteHeader) {
                header.style.setProperty('background', '#ffffff', 'important');
                header.style.setProperty('background-color', '#ffffff', 'important');
                header.style.setProperty('background-image', 'none', 'important');
                // Also remove bg-primary class effect by overriding it
                header.classList.remove('bg-primary');
              } else if (isBlackHeader) {
                header.style.setProperty('background', 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', 'important');
                header.style.setProperty('background-color', '#000000', 'important');
                header.style.setProperty('background-image', 'none', 'important');
              }

              // Also apply to toolbar
              const toolbar = header.querySelector('.q-toolbar');
              if (toolbar) {
                toolbar.style.setProperty('background', 'transparent', 'important');
                toolbar.style.setProperty('background-color', 'transparent', 'important');
              }
            }
          }

          // Try to apply inline styles immediately if elements exist
          applyHeaderInlineStyles();

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

  // Simple function to wait for elements and apply styles (no aggressive checking)
  function waitAndApply() {
    if (document.head) {
      applyCachedTheme();
    }
    
    // Simple MutationObserver - only watch for header creation, then stop
    if (document.body) {
      let observerDisconnected = false;
      const observer = new MutationObserver(function(mutations) {
        if (observerDisconnected) return;
        
        const header = document.querySelector('.q-header');
        if (header) {
          // Header found, apply styles once and disconnect
          applyCachedTheme();
          observerDisconnected = true;
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      // Also try immediately
      applyCachedTheme();
      
      // Disconnect after 2 seconds to prevent memory leaks
      setTimeout(function() {
        if (!observerDisconnected) {
          observer.disconnect();
        }
      }, 2000);
    } else {
      // Body not ready, wait for it
      document.addEventListener('DOMContentLoaded', applyCachedTheme);
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
