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
          const isWhiteLattus = theme.name && theme.name.includes('White Lattus');
          const isSilverCrisCross = theme.name && theme.name.includes('Silver Cris-Cross');

          if (isWhiteHeader || isBlackHeader || isLineAModern || isWhiteLattus || isSilverCrisCross) {
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
            } else if (isWhiteLattus || isSilverCrisCross) {
              headerCSS += `
                /* Override Quasar bg-primary with maximum specificity - purple gradient header (matches buttons) */
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
                  /* Use same gradient as buttons: linear-gradient(135deg, #667eea 0%, #764ba2 100%) */
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                  background-color: #667eea !important; /* Fallback color */
                }
                /* Override toolbar background too */
                html body .q-header .q-toolbar,
                body .q-header .q-toolbar,
                .q-header .q-toolbar {
                  background: transparent !important;
                  background-color: transparent !important;
                }
                /* White text for all header elements */
                .q-toolbar-title, .q-toolbar-title span, .q-toolbar-title span.text-h5.text-weight-bold,
                .q-header .q-btn, .q-header .q-btn .q-icon, .q-header .q-chip {
                  color: #ffffff !important;
                }
              `;
            }

            if (isLineAModern) {
              const textColor = isWhiteHeader ? '#1a1a1a' : '#ffffff';
              headerCSS += `
                .q-toolbar__title, .q-toolbar__title span, .q-toolbar__title span.text-h5.text-weight-bold,
                .q-toolbar-title, .q-toolbar-title span, .q-toolbar-title span.text-h5.text-weight-bold {
                  font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
                  font-weight: 400 !important;
                  font-style: normal !important;
                  letter-spacing: 0.05em !important;
                  text-transform: none !important;
                  color: ${textColor} !important;
                }
              `;
            } else if (isWhiteLattus || isSilverCrisCross) {
              headerCSS += `
                .q-toolbar__title, .q-toolbar__title span, .q-toolbar__title span.text-h5.text-weight-bold,
                .q-toolbar-title, .q-toolbar-title span, .q-toolbar-title span.text-h5.text-weight-bold {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
                  font-weight: 500 !important;
                  font-style: normal !important;
                  color: #ffffff !important;
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
              } else if (isWhiteLattus || isSilverCrisCross) {
                // Use same gradient as buttons: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
                const buttonGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                header.style.setProperty('background', buttonGradient, 'important');
                header.style.setProperty('background-image', buttonGradient, 'important');
                header.style.setProperty('background-color', '#667eea', 'important'); // Fallback color
                header.style.setProperty('opacity', '1', 'important');
                header.setAttribute('data-theme-override', 'purple-gradient');
              }

              // Also apply to toolbar
              const toolbar = header.querySelector('.q-toolbar');
              if (toolbar) {
                toolbar.style.setProperty('background', 'transparent', 'important');
                toolbar.style.setProperty('background-color', 'transparent', 'important');
              }

              // Apply white text color to all header elements for White Lattus and Silver Cris-Cross
              if (isWhiteLattus || isSilverCrisCross) {
                const headerButtons = header.querySelectorAll('.q-btn, .q-btn .q-icon, .q-chip, .q-toolbar-title, .q-toolbar-title *');
                headerButtons.forEach((element) => {
                  element.style.setProperty('color', '#ffffff', 'important');
                });
              }
            }
          }

          // Try to apply inline styles immediately if elements exist
          applyHeaderInlineStyles();

          // Apply header title font styles immediately if title element exists
          const titleSpan = document.querySelector('.q-toolbar-title span, .q-toolbar-title');
          if (titleSpan) {
            if (isLineAModern) {
              const textColor = isWhiteHeader ? '#1a1a1a' : '#ffffff';
              titleSpan.style.setProperty('font-family', "'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive", 'important');
              titleSpan.style.setProperty('font-weight', '400', 'important');
              titleSpan.style.setProperty('font-style', 'normal', 'important');
              titleSpan.style.setProperty('letter-spacing', '0.05em', 'important');
              titleSpan.style.setProperty('text-transform', 'none', 'important');
              titleSpan.style.setProperty('color', textColor, 'important');
            } else if (isWhiteLattus || isSilverCrisCross) {
              titleSpan.style.setProperty('font-family', "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif", 'important');
              titleSpan.style.setProperty('font-weight', '500', 'important');
              titleSpan.style.setProperty('font-style', 'normal', 'important');
              titleSpan.style.setProperty('color', '#ffffff', 'important');
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

  // Apply default black header theme if no cached theme exists
  function applyDefaultBlackHeaderTheme() {
    try {
      // Check if we already have a theme applied
      const existingStyle = document.getElementById('theme-preload-styles');
      if (existingStyle) {
        return; // Theme already applied
      }

      // Apply default black header theme styles
      const defaultBlackHeaderStyles = `
        /* Default Black Header Theme - Applied before Firebase loads */
        .q-header {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
          background-color: #000000 !important;
          min-height: 84px !important;
        }
        .q-header .q-toolbar {
          background: transparent !important;
          min-height: 84px !important;
        }
        .q-header .q-toolbar-title span,
        .q-header .q-toolbar__title span {
          font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
          font-weight: 400 !important;
          color: #ffffff !important;
        }
        .q-header .q-btn, .q-header .q-btn .q-icon, .q-header .q-chip:not(.test-environment-chip) {
          color: #ffffff !important;
        }
        .q-page-container {
          background: #ffffff !important;
        }
        body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
        body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
          background: #1a1a1a !important;
          color: #ffffff !important;
          border: 1px solid #1a1a1a !important;
          border-radius: 10px !important;
        }
        :root {
          --theme-primary-text-color: #374151 !important;
        }
        .text-primary, a.text-primary, [class*="text-primary"] {
          color: var(--theme-primary-text-color) !important;
        }
      `;

      const style = document.createElement('style');
      style.id = 'theme-preload-styles';
      style.textContent = defaultBlackHeaderStyles;
      document.head.appendChild(style);

      // Also apply inline styles to header when it appears
      function applyHeaderInlineStyles() {
        const header = document.querySelector('.q-header, [class*="q-header"], header');
        if (header) {
          header.style.setProperty('background', 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', 'important');
          header.style.setProperty('background-color', '#000000', 'important');
          header.style.setProperty('background-image', 'none', 'important');

          const toolbar = header.querySelector('.q-toolbar');
          if (toolbar) {
            toolbar.style.setProperty('background', 'transparent', 'important');
            toolbar.style.setProperty('background-color', 'transparent', 'important');
          }
        }
      }

      // Try to apply immediately if header exists
      applyHeaderInlineStyles();

      // Watch for header creation
      if (document.body) {
        const observer = new MutationObserver(() => {
          applyHeaderInlineStyles();
        });
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        // Disconnect after 3 seconds
        setTimeout(() => observer.disconnect(), 3000);
      }

      console.log('[ThemePreload] Applied default black header theme (no cached theme found)');
    } catch (error) {
      console.error('[ThemePreload] Error applying default theme:', error);
    }
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




