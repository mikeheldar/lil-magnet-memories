import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, ensureNetworkReady } from '../firebase/config.js';

const THEMES_COLLECTION = 'themes';
const ACTIVE_THEME_DOC = 'activeTheme';

/**
 * Theme Service - Manages site themes and visual styling
 */
export const themeService = {
  /**
   * Get all available themes
   */
  async getAllThemes() {
    try {
      // Ensure Firestore network is ready before attempting to read
      await ensureNetworkReady();

      const themesRef = collection(db, THEMES_COLLECTION);
      const q = query(themesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting themes:', error);
      throw error;
    }
  },

  /**
   * Get a specific theme by ID
   */
  async getTheme(themeId) {
    try {
      // Ensure Firestore network is ready before attempting to read
      await ensureNetworkReady();

      console.log(`[ThemeService] Fetching theme ${themeId} from Firestore`);
      const themeRef = doc(db, THEMES_COLLECTION, themeId);
      const themeSnap = await getDoc(themeRef);

      console.log(`[ThemeService] Theme ${themeId} exists: ${themeSnap.exists()}`);

      if (themeSnap.exists()) {
        const theme = {
          id: themeSnap.id,
          ...themeSnap.data(),
        };
        console.log(`[ThemeService] Theme ${themeId} loaded: ${theme.name}, has styles: ${!!theme.styles}`);
        // Cache the theme for offline use
        if (theme.styles) {
          localStorage.setItem(`theme_${themeId}`, JSON.stringify(theme));
        }
        return theme;
      }
      console.warn(`[ThemeService] Theme ${themeId} does not exist in Firestore`);
      return null;
    } catch (error) {
      // Enhanced error logging
      console.error(`[ThemeService] Error getting theme ${themeId}:`, {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });

      // Check if it's an offline error
      const isOfflineError = error?.code === 'unavailable' ||
                            error?.code === 'failed-precondition' ||
                            error?.message?.includes('offline') ||
                            error?.message?.includes('Failed to get document');

      if (isOfflineError) {
        // Try to get from cache
        const cachedTheme = localStorage.getItem(`theme_${themeId}`);
        if (cachedTheme) {
          try {
            const theme = JSON.parse(cachedTheme);
            console.log(`[ThemeService] Using cached theme ${themeId} due to offline status`);
            return theme;
          } catch (parseError) {
            console.error('[ThemeService] Error parsing cached theme:', parseError);
          }
        }
      } else if (error?.code === 'permission-denied') {
        console.error(`[ThemeService] Permission denied for theme ${themeId} - check Firestore rules`);
      }
      throw error;
    }
  },

  /**
   * Get the currently active theme
   */
  async getActiveTheme() {
    try {
      // Ensure Firestore network is ready before attempting to read
      await ensureNetworkReady();

      console.log(`[ThemeService] Attempting to get active theme from Firestore: ${THEMES_COLLECTION}/${ACTIVE_THEME_DOC}`);
      const activeThemeRef = doc(db, THEMES_COLLECTION, ACTIVE_THEME_DOC);

      // Use source: 'server' to avoid offline cache issues on first access
      const activeThemeSnap = await getDoc(activeThemeRef);

      console.log(`[ThemeService] Active theme document exists: ${activeThemeSnap.exists()}`);

      if (activeThemeSnap.exists()) {
        const data = activeThemeSnap.data();
        console.log(`[ThemeService] Active theme data:`, data);
        const activeThemeId = data?.themeId;
        if (activeThemeId) {
          console.log(`[ThemeService] Fetching theme with ID: ${activeThemeId}`);
          try {
            const theme = await this.getTheme(activeThemeId);
            console.log(`[ThemeService] Successfully fetched theme: ${theme?.name}`);
            return theme;
          } catch (themeError) {
            // If we can't get the theme but have it cached, use cache
            console.warn('[ThemeService] Error fetching theme from Firebase, trying cache:', themeError);
            console.warn('[ThemeService] Error details:', {
              code: themeError?.code,
              message: themeError?.message,
              stack: themeError?.stack
            });
            const storedTheme = localStorage.getItem('activeTheme');
            if (storedTheme) {
              const theme = JSON.parse(storedTheme);
              if (theme.id === activeThemeId) {
                console.log('[ThemeService] Using cached theme due to Firebase error');
                return theme;
              }
            }
            throw themeError;
          }
        } else {
          console.warn('[ThemeService] Active theme document exists but has no themeId');
        }
      } else {
        console.log(`[ThemeService] Active theme document does not exist yet (this is normal on first run). Collection: ${THEMES_COLLECTION}, Doc: ${ACTIVE_THEME_DOC}`);
        // This is not an error - document just doesn't exist yet
        // Return null gracefully
      }
      return null;
    } catch (error) {
      // Enhanced error logging
      console.error('[ThemeService] Error getting active theme:', {
        code: error?.code,
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });

      // Check if it's actually an offline error or just a missing document
      const isOfflineError = error?.code === 'unavailable' ||
                            error?.code === 'failed-precondition' ||
                            (error?.message?.includes('offline') && !error?.message?.includes('document does not exist')) ||
                            (error?.message?.includes('Failed to get document') && !error?.message?.includes('document does not exist'));

      // If it's a "document doesn't exist" error, that's fine - return null
      if (error?.code === 'not-found' || error?.message?.includes('document does not exist')) {
        console.log('[ThemeService] Document does not exist (normal on first run)');
        return null;
      }

      if (isOfflineError) {
        console.warn('[ThemeService] Firebase appears offline, using cached theme if available');
        const storedTheme = localStorage.getItem('activeTheme');
        if (storedTheme) {
          try {
            const theme = JSON.parse(storedTheme);
            console.log('[ThemeService] Using cached theme due to offline status');
            return theme;
          } catch (parseError) {
            console.error('[ThemeService] Error parsing cached theme:', parseError);
          }
        }
      } else {
        // Check if it's a permissions error
        if (error?.code === 'permission-denied') {
          console.error('[ThemeService] Permission denied - check Firestore rules for themes collection');
        }
      }
      // Return null instead of throwing - missing document is not an error
      return null;
    }
  },

  /**
   * Create a new theme
   */
  async createTheme(themeData) {
    try {
      const themesRef = collection(db, THEMES_COLLECTION);
      const newTheme = {
        ...themeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await setDoc(doc(themesRef), newTheme);
      return docRef;
    } catch (error) {
      console.error('Error creating theme:', error);
      throw error;
    }
  },

  /**
   * Update theme name
   */
  async updateThemeName(themeId, newName) {
    try {
      const themeRef = doc(db, THEMES_COLLECTION, themeId);
      await updateDoc(themeRef, {
        name: newName,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating theme name:', error);
      throw error;
    }
  },

  /**
   * Update theme styles
   */
  async updateThemeStyles(themeId, newStyles) {
    try {
      const themeRef = doc(db, THEMES_COLLECTION, themeId);
      await updateDoc(themeRef, {
        styles: newStyles,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating theme styles:', error);
      throw error;
    }
  },

  /**
   * Activate a theme with offline support
   */
  async activateTheme(themeId) {
    try {
      // Verify theme exists (will use cache if offline)
      const theme = await this.getTheme(themeId);
      if (!theme) {
        throw new Error('Theme not found');
      }

      // Set as active theme in Firebase (best effort, don't fail if offline)
      try {
        const activeThemeRef = doc(db, THEMES_COLLECTION, ACTIVE_THEME_DOC);
        await setDoc(
          activeThemeRef,
          {
            themeId: themeId,
            activatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (firebaseError) {
        // If Firebase fails, still apply the theme locally
        const isOfflineError = firebaseError?.code === 'unavailable' ||
                              firebaseError?.message?.includes('offline') ||
                              firebaseError?.message?.includes('Failed to get document');
        if (isOfflineError) {
          console.warn('Firebase offline, activating theme locally only');
        } else {
          throw firebaseError;
        }
      }

      // Apply theme styles (always works, even offline)
      this.applyTheme(theme);
    } catch (error) {
      console.error('Error activating theme:', error);
      // If we have the theme cached, still try to apply it
      const cachedTheme = localStorage.getItem(`theme_${themeId}`);
      if (cachedTheme) {
        try {
          const theme = JSON.parse(cachedTheme);
          console.log('Applying cached theme despite activation error');
          this.applyTheme(theme);
        } catch (parseError) {
          console.error('Error parsing cached theme:', parseError);
        }
      }
      throw error;
    }
  },

  /**
   * Apply theme styles to the page
   */
  applyTheme(theme) {
    if (!theme || !theme.styles) {
      console.warn('[ThemeService] Theme or theme.styles is missing');
      return;
    }

    console.log(`[ThemeService] Applying theme: ${theme.name}`);

    // Remove existing theme styles
    const existingStyle = document.getElementById('dynamic-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element and append at the end of head for maximum specificity
    const style = document.createElement('style');
    style.id = 'dynamic-theme-styles';
    style.textContent = theme.styles;
    // Set highest priority by appending at the very end and using !important
    // Also try to ensure it loads after all other stylesheets
    if (document.head.lastChild && document.head.lastChild.tagName === 'STYLE') {
      document.head.insertBefore(style, document.head.lastChild.nextSibling);
    } else {
      document.head.appendChild(style);
    }

    // Force immediate style recalculation
    if (document.body) {
      document.body.style.display = 'none';
      void document.body.offsetHeight; // Force reflow
      document.body.style.display = '';
    }

    // Force reflow to ensure styles are applied
    void document.body.offsetHeight;

    // Store theme in localStorage for quick access (this also clears old cache)
    localStorage.setItem('activeTheme', JSON.stringify(theme));

    // Also cache individual theme for offline use
    if (theme.id) {
      localStorage.setItem(`theme_${theme.id}`, JSON.stringify(theme));
    }

    // Verify styles were injected
    const injectedStyle = document.getElementById('dynamic-theme-styles');
    if (injectedStyle) {
      console.log(`[ThemeService] Theme applied successfully: ${theme.name}`);
      console.log(`[ThemeService] Injected styles length: ${injectedStyle.textContent.length} characters`);
      // Check if cursive font is in the styles
      if (injectedStyle.textContent.includes('Brush Script MT') || injectedStyle.textContent.includes('cursive')) {
        console.log('[ThemeService] ✓ Cursive font styles found in injected theme');
      } else {
        console.warn('[ThemeService] ⚠ Cursive font styles NOT found in injected theme');
      }
    } else {
      console.error('[ThemeService] ✗ Failed to inject theme styles - style element not found');
    }
  },

  /**
   * Clean up duplicate themes - keep only the most recent one of each name
   */
  async cleanupDuplicateThemes() {
    try {
      const allThemes = await this.getAllThemes();
      const themesByName = {};

      // Group themes by name
      allThemes.forEach((theme) => {
        if (!themesByName[theme.name]) {
          themesByName[theme.name] = [];
        }
        themesByName[theme.name].push(theme);
      });

      // For each theme name, if there are duplicates, keep the most recent and delete others
      for (const [themeName, themes] of Object.entries(themesByName)) {
        if (themes.length > 1) {
          // Sort by createdAt (most recent first)
          themes.sort((a, b) => {
            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt || 0);
            return dateB - dateA;
          });

          // Keep the first (most recent), delete the rest
          const toKeep = themes[0];
          const toDelete = themes.slice(1);

          console.log(
            `Found ${themes.length} themes named "${themeName}", keeping most recent (${toKeep.id}), deleting ${toDelete.length} duplicates`
          );

          // Check if the theme we're keeping is the active one
          const activeTheme = await this.getActiveTheme();
          const isActiveTheme = activeTheme && activeTheme.id === toKeep.id;

          for (const duplicate of toDelete) {
            try {
              // If we're deleting the active theme, switch to the one we're keeping
              if (activeTheme && activeTheme.id === duplicate.id) {
                console.log(
                  `Active theme is a duplicate, switching to ${toKeep.id}`
                );
                await this.activateTheme(toKeep.id);
              }

              const themeRef = doc(db, THEMES_COLLECTION, duplicate.id);
              await deleteDoc(themeRef);
              console.log(`Deleted duplicate theme: ${duplicate.id}`);
            } catch (error) {
              console.error(
                `Error deleting duplicate theme ${duplicate.id}:`,
                error
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up duplicate themes:', error);
    }
  },

  /**
   * Get default fallback theme styles (for offline/error cases)
   */
  getDefaultFallbackTheme() {
    // Default to "LineA Modern White Header" style with cursive font
    return {
      id: 'fallback',
      name: 'Default (Fallback)',
      description: 'Default theme applied when Firebase is unavailable',
      styles: `
        /* Header font - cursive for title, black text (default for white header) - MAXIMUM SPECIFICITY */
        body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
        body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
        body .q-layout .q-header .q-toolbar .q-toolbar-title span,
        body .q-layout .q-header .q-toolbar .q-toolbar-title,
        body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
        body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
        body .q-header .q-toolbar .q-toolbar-title span,
        body .q-header .q-toolbar .q-toolbar-title,
        .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
        .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
        .q-layout .q-header .q-toolbar .q-toolbar-title span,
        .q-layout .q-header .q-toolbar .q-toolbar-title,
        .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
        .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
        .q-header .q-toolbar .q-toolbar-title span,
        .q-header .q-toolbar .q-toolbar-title,
        body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
        body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
        body .q-header .q-toolbar-title span,
        body .q-header .q-toolbar-title {
          font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', cursive !important;
          font-weight: 400 !important;
          font-style: normal !important;
          letter-spacing: 0.05em !important;
          text-transform: none !important;
          color: #1a1a1a !important;
        }
      `,
    };
  },

  /**
   * Initialize theme on page load with robust fallback
   */
  async initializeTheme() {
    // First, try to apply from localStorage immediately (fastest, works offline)
    const storedTheme = localStorage.getItem('activeTheme');
    if (storedTheme) {
      try {
        const theme = JSON.parse(storedTheme);
        if (theme && theme.styles) {
          console.log('[ThemeService] Applying cached theme immediately');
          this.applyTheme(theme);
          // Still try to update from Firebase in background (non-blocking)
          this.getActiveTheme()
            .then((firebaseTheme) => {
              if (firebaseTheme && firebaseTheme.id !== theme.id) {
                console.log('[ThemeService] Updating theme from Firebase (different theme)');
                this.applyTheme(firebaseTheme);
              } else if (firebaseTheme && firebaseTheme.styles !== theme.styles) {
                // Theme updated, apply new styles
                console.log('[ThemeService] Theme styles updated from Firebase');
                this.applyTheme(firebaseTheme);
              }
            })
            .catch((error) => {
              // Don't log as error if it's just missing document
              if (error?.code !== 'not-found' && !error?.message?.includes('document does not exist')) {
                console.warn('[ThemeService] Background Firebase theme fetch failed, using cached theme:', error);
              }
            });
          return theme;
        }
      } catch (parseError) {
        console.error('[ThemeService] Error parsing cached theme:', parseError);
        localStorage.removeItem('activeTheme');
      }
    }

    // Try to get active theme from Firebase (with timeout to avoid hanging)
    try {
      const activeTheme = await Promise.race([
        this.getActiveTheme(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Theme fetch timeout')), 5000)
        )
      ]);

      if (activeTheme && activeTheme.styles) {
        console.log(`[ThemeService] Applying theme from Firebase: ${activeTheme.name}`);
        this.applyTheme(activeTheme);
        return activeTheme;
      } else {
        console.log('[ThemeService] No active theme found in Firebase');
      }
    } catch (error) {
      // Don't log timeout or missing document as errors
      if (error?.message !== 'Theme fetch timeout' &&
          error?.code !== 'not-found' &&
          !error?.message?.includes('document does not exist')) {
        console.error('[ThemeService] Error initializing theme from Firebase:', error);
      }
    }

    // Final fallback: apply default theme with cursive font
    console.log('[ThemeService] Applying default fallback theme (no theme found)');
    const fallbackTheme = this.getDefaultFallbackTheme();
    this.applyTheme(fallbackTheme);
    return fallbackTheme;
  },
};

// Flag to prevent multiple simultaneous initializations
let isInitializing = false;
let hasInitialized = false;

// Initialize default themes on first load
export const initializeDefaultThemes = async () => {
  // Prevent multiple simultaneous calls
  if (isInitializing) {
    console.log('Theme initialization already in progress, skipping...');
    return;
  }

  // Always run cleanup first to remove duplicates
  try {
    await themeService.cleanupDuplicateThemes();
  } catch (error) {
    console.error('Error in initial cleanup:', error);
  }

  // If we've already initialized and all default themes exist, skip
  if (hasInitialized) {
    try {
      const existingThemes = await themeService.getAllThemes();
        const whiteLattusExists = existingThemes.some(
          (theme) => theme.name === 'White Lattus'
        );
        const silverCrisCrossExists = existingThemes.some(
          (theme) => theme.name === 'Silver Cris-Cross'
        );
        const lineAModernBlackExists = existingThemes.some(
          (theme) => theme.name === 'LineA Modern Black Header'
        );
        const lineAModernWhiteExists = existingThemes.some(
          (theme) => theme.name === 'LineA Modern White Header'
        );
        if (whiteLattusExists && silverCrisCrossExists && lineAModernBlackExists && lineAModernWhiteExists) {
          console.log('All default themes already exist, skipping initialization');
          return;
        }
    } catch (error) {
      console.error('Error checking existing themes:', error);
    }
  }

  isInitializing = true;
  try {
    const existingThemes = await themeService.getAllThemes();

    // Check if each theme exists by name, create if missing
    const whiteLattusExists = existingThemes.some(
      (theme) => theme.name === 'White Lattus'
    );
    const silverCrisCrossExists = existingThemes.some(
      (theme) => theme.name === 'Silver Cris-Cross'
    );

    const themesRef = collection(db, THEMES_COLLECTION);
    let whiteLattusDocRef = null;
    let silverCrisCrossDocRef = null;

    // Create White Lattus theme if it doesn't exist
    if (!whiteLattusExists) {
      const whiteLattusTheme = {
        name: 'White Lattus',
        description: 'Clean white background with subtle criss-cross pattern',
        styles: `
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image:
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 9px,
                rgba(0, 0, 0, 0.02) 9px,
                rgba(0, 0, 0, 0.02) 10px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 9px,
                rgba(0, 0, 0, 0.02) 9px,
                rgba(0, 0, 0, 0.02) 10px
              ) !important;
          }
          .hero-title {
            color: #2c3e50 !important;
          }
        `,
      };

      whiteLattusDocRef = await addDoc(themesRef, {
        ...whiteLattusTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('White Lattus theme created');
    } else {
      // Find existing White Lattus theme
      const existing = existingThemes.find(
        (theme) => theme.name === 'White Lattus'
      );
      if (existing) {
        whiteLattusDocRef = { id: existing.id };
      }
    }

    // Create Silver Cris-Cross theme if it doesn't exist
    if (!silverCrisCrossExists) {
      const silverCrisCrossTheme = {
        name: 'Silver Cris-Cross',
        description: 'Classic grey-purple background with white text',
        styles: `
          .q-page-container,
          .landing-page,
          .hero-section {
            background: linear-gradient(135deg, #a8b5d1 0%, #b8a8c8 100%) !important;
            background-image:
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(255, 255, 255, 0.03) 10px,
                rgba(255, 255, 255, 0.03) 20px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 10px,
                rgba(0, 0, 0, 0.02) 10px,
                rgba(0, 0, 0, 0.02) 20px
              ),
              linear-gradient(135deg, #a8b5d1 0%, #b8a8c8 100%) !important;
          }
          .hero-title {
            color: #ffffff !important;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
          }
        `,
      };

      silverCrisCrossDocRef = await addDoc(themesRef, {
        ...silverCrisCrossTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('Silver Cris-Cross theme created');
    }

    // Handle old "LineA Modern" themes - convert them to the new naming
    const oldLineAModernThemes = existingThemes.filter(
      (theme) => theme.name === 'LineA Modern'
    );

    // ALWAYS update existing "LineA Modern Black Header" and "LineA Modern White Header" themes with latest styles
    // This ensures they always have the latest cursive font styles
    const existingBlackHeader = existingThemes.find(
      (theme) => theme.name === 'LineA Modern Black Header'
    );
    const existingWhiteHeader = existingThemes.find(
      (theme) => theme.name === 'LineA Modern White Header'
    );

    // If we have old themes, convert the first one to "LineA Modern Black Header" and second to "LineA Modern White Header"
    if (oldLineAModernThemes.length > 0) {
      const activeTheme = await themeService.getActiveTheme();
      const isFirstActive = activeTheme && activeTheme.id === oldLineAModernThemes[0].id;

      // Rename first to "LineA Modern Black Header"
      await themeService.updateThemeName(oldLineAModernThemes[0].id, 'LineA Modern Black Header');

      // Update first theme with black header, white non-cursive text
      const blackHeaderStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to black - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            background-color: #000000 !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, white text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #ffffff !important;
          }

          /* Ensure all header text stays white */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #ffffff !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }
        `;
      await themeService.updateThemeStyles(oldLineAModernThemes[0].id, blackHeaderStyles);

      if (oldLineAModernThemes.length > 1) {
        // Rename second to "LineA Modern White Header"
        await themeService.updateThemeName(oldLineAModernThemes[1].id, 'LineA Modern White Header');

        // Update second theme with white header, black non-cursive text
        const whiteHeaderStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to white - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, black text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #1a1a1a !important;
          }

          /* Ensure all header text stays black */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #1a1a1a !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }
        `;
        await themeService.updateThemeStyles(oldLineAModernThemes[1].id, whiteHeaderStyles);
      }

      // Re-fetch themes after update
      const updatedThemes = await themeService.getAllThemes();
      const lineAModernBlackExists = updatedThemes.some(
        (theme) => theme.name === 'LineA Modern Black Header'
      );
      const lineAModernWhiteExists = updatedThemes.some(
        (theme) => theme.name === 'LineA Modern White Header'
      );

      // ALWAYS update existing themes with latest styles to ensure they have cursive font
      const updatedBlackHeader = updatedThemes.find(
        (theme) => theme.name === 'LineA Modern Black Header'
      );
      const updatedWhiteHeader = updatedThemes.find(
        (theme) => theme.name === 'LineA Modern White Header'
      );

      if (updatedBlackHeader) {
        console.log(`[ThemeService] Found existing LineA Modern Black Header theme, updating with latest styles`);
        // Update with latest black header styles (cursive font)
        const blackHeaderStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to black - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            background-color: #000000 !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, white text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #ffffff !important;
          }

          /* Ensure all header text stays white */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #ffffff !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }
        `;
        await themeService.updateThemeStyles(updatedBlackHeader.id, blackHeaderStyles);
        console.log('[ThemeService] Updated LineA Modern Black Header theme with latest styles in Firestore');

        // Always reapply if this is the active theme (to update cache and apply immediately)
        const activeTheme = await themeService.getActiveTheme();
        if (activeTheme && activeTheme.id === updatedBlackHeader.id) {
          console.log('[ThemeService] Active theme was updated, reapplying with latest styles');
          // Fetch fresh from Firestore to get updated styles
          const updatedTheme = await themeService.getTheme(updatedBlackHeader.id);
          if (updatedTheme) {
            // Clear old cache first
            localStorage.removeItem('activeTheme');
            localStorage.removeItem(`theme_${updatedBlackHeader.id}`);
            // Apply fresh theme
            themeService.applyTheme(updatedTheme);
            console.log('[ThemeService] Successfully reapplied updated LineA Modern Black Header theme');
          }
        }
      }

      if (updatedWhiteHeader) {
        console.log(`[ThemeService] Found existing LineA Modern White Header theme, updating with latest styles`);
        // Update with latest white header styles (cursive font, black text)
        const whiteHeaderStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to white - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, black text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #1a1a1a !important;
          }

          /* Ensure all header text stays black */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #1a1a1a !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }
        `;
        await themeService.updateThemeStyles(updatedWhiteHeader.id, whiteHeaderStyles);
        console.log('[ThemeService] Updated LineA Modern White Header theme with latest styles in Firestore');

        // Always reapply if this is the active theme (to update cache and apply immediately)
        const activeTheme = await themeService.getActiveTheme();
        if (activeTheme && activeTheme.id === updatedWhiteHeader.id) {
          console.log('[ThemeService] Active theme was updated, reapplying with latest styles');
          // Fetch fresh from Firestore to get updated styles
          const updatedTheme = await themeService.getTheme(updatedWhiteHeader.id);
          if (updatedTheme) {
            // Clear old cache first
            localStorage.removeItem('activeTheme');
            localStorage.removeItem(`theme_${updatedWhiteHeader.id}`);
            // Apply fresh theme
            themeService.applyTheme(updatedTheme);
            console.log('[ThemeService] Successfully reapplied updated LineA Modern White Header theme');
          }
        }
      }

      // If we still need to create them (e.g., only had one old theme)
      if (!lineAModernBlackExists) {
        // Create LineA Modern Black Header theme
        const lineAModernBlackTheme = {
          name: 'LineA Modern Black Header',
          description: 'Clean, elegant modern design with black header and white text',
          styles: blackHeaderStyles,
        };
        await addDoc(themesRef, {
          ...lineAModernBlackTheme,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('LineA Modern Black Header theme created');
      }

      if (!lineAModernWhiteExists) {
        // Create LineA Modern White Header theme
        const lineAModernWhiteTheme = {
          name: 'LineA Modern White Header',
          description: 'Clean, elegant modern design with white header and black text',
          styles: whiteHeaderStyles,
        };
        await addDoc(themesRef, {
          ...lineAModernWhiteTheme,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('LineA Modern White Header theme created');
      }
    } else {
      // No old themes, but ALWAYS update existing themes with latest styles
      // Update existing themes if they exist (to ensure they have latest cursive font)
      if (existingBlackHeader) {
        console.log('[ThemeService] Updating existing LineA Modern Black Header theme with latest styles');
        // Use the same blackHeaderStyles from above
        const blackHeaderStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to black - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            background-color: #000000 !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, white text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #ffffff !important;
          }

          /* Ensure all header text stays white */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #ffffff !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }
        `;
        await themeService.updateThemeStyles(existingBlackHeader.id, blackHeaderStyles);
        console.log('[ThemeService] Updated existing LineA Modern Black Header theme');

        // Reapply if active
        const activeTheme = await themeService.getActiveTheme();
        if (activeTheme && activeTheme.id === existingBlackHeader.id) {
          const updatedTheme = await themeService.getTheme(existingBlackHeader.id);
          if (updatedTheme) {
            localStorage.removeItem('activeTheme');
            localStorage.removeItem(`theme_${existingBlackHeader.id}`);
            themeService.applyTheme(updatedTheme);
          }
        }
      }

      if (existingWhiteHeader) {
        console.log('[ThemeService] Updating existing LineA Modern White Header theme with latest styles');
        // Use the same whiteHeaderStyles from above
        const whiteHeaderStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to white - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, black text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #1a1a1a !important;
          }

          /* Ensure all header text stays black */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #1a1a1a !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }
        `;
        await themeService.updateThemeStyles(existingWhiteHeader.id, whiteHeaderStyles);
        console.log('[ThemeService] Updated existing LineA Modern White Header theme');

        // Reapply if active
        const activeTheme = await themeService.getActiveTheme();
        if (activeTheme && activeTheme.id === existingWhiteHeader.id) {
          const updatedTheme = await themeService.getTheme(existingWhiteHeader.id);
          if (updatedTheme) {
            localStorage.removeItem('activeTheme');
            localStorage.removeItem(`theme_${existingWhiteHeader.id}`);
            themeService.applyTheme(updatedTheme);
          }
        }
      }

      // Create new ones if they don't exist
      const lineAModernBlackExists = existingThemes.some(
        (theme) => theme.name === 'LineA Modern Black Header'
      );
      const lineAModernWhiteExists = existingThemes.some(
        (theme) => theme.name === 'LineA Modern White Header'
      );

      if (!lineAModernBlackExists) {
        // Create LineA Modern Black Header theme
        const lineAModernBlackTheme = {
          name: 'LineA Modern Black Header',
          description: 'Clean, elegant modern design with black header and white text',
          styles: `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to black - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            background-color: #000000 !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, white text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #ffffff !important;
          }

          /* Ensure all header text stays white */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #ffffff !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }
        `,
        };
        await addDoc(themesRef, {
          ...lineAModernBlackTheme,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('LineA Modern Black Header theme created');
      }

      if (!lineAModernWhiteExists) {
        // Create LineA Modern White Header theme
        const lineAModernWhiteTheme = {
          name: 'LineA Modern White Header',
          description: 'Clean, elegant modern design with white header and black text',
          styles: `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header to white - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: #ffffff !important;
            background-color: #ffffff !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Header font - cursive for title, black text - ULTRA MAXIMUM SPECIFICITY */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          html body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-layout .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          .q-header .q-toolbar .q-toolbar-title span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title.text-center span.text-h5.text-weight-bold,
          body .q-header .q-toolbar-title span.text-h5.text-weight-bold,
          /* Also target without classes for fallback */
          html body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          html body .q-header .q-toolbar .q-toolbar-title span,
          body .q-layout .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar .q-toolbar-title span,
          .q-layout .q-header .q-toolbar .q-toolbar-title span,
          .q-header .q-toolbar .q-toolbar-title span,
          body .q-header .q-toolbar-title span {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', 'Comic Sans MS', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #1a1a1a !important;
          }

          /* Ensure all header text stays black */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #1a1a1a !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #1a1a1a !important;
          }
        `,
        };
        await addDoc(themesRef, {
          ...lineAModernWhiteTheme,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        console.log('LineA Modern White Header theme created');
      }
    }

    // Old LineA Modern theme creation code - disabled, replaced by two separate themes above
    if (false) {
      const lineAModernTheme = {
        name: 'LineA Modern',
        description: 'Clean, elegant modern design with white background and minimalist styling',
        styles: `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header from purple to black - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            background-color: #000000 !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Cursive, clean header font - maximum specificity */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title span,
          body .q-header .q-toolbar-title .text-h5,
          body .q-header .q-toolbar-title .text-weight-bold,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title span,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title span,
          .q-header .q-toolbar-title .text-h5,
          .q-header .q-toolbar-title .text-weight-bold {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #ffffff !important;
          }

          /* Ensure all header text stays white - maximum specificity */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #ffffff !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure logo text is white and readable */
          body .q-header .q-toolbar-title,
          body .q-header * {
            color: #ffffff !important;
          }
        `,
      };

      await addDoc(themesRef, {
        ...lineAModernTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('LineA Modern theme created');
    } else {
      // Update existing LineA Modern theme with latest styles
      const existingLineA = existingThemes.find(
        (theme) => theme.name === 'LineA Modern'
      );
      if (existingLineA) {
        const updatedLineAModernStyles = `
          /* Clean white background - no patterns */
          .q-page-container,
          .landing-page,
          .hero-section {
            background: #ffffff !important;
            background-image: none !important;
          }

          /* Modern, clean hero title - elegant typography */
          .hero-title {
            color: #1a1a1a !important;
            font-weight: 300 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-style: normal !important;
            text-shadow: none !important;
            -webkit-text-stroke: none !important;
            text-stroke: none !important;
            transform: none !important;
            letter-spacing: -0.02em !important;
          }

          /* Clean, elegant buttons - neutral colors, no purple */
          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning),
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s ease !important;
          }

          body .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[color='secondary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-primary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn.bg-secondary:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-primary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover,
          body .q-btn[class*="bg-secondary"]:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):not(.q-btn--negative):not(.q-btn--warning):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Clean q-file buttons */
          .q-file .q-field__control .q-btn,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button) {
            background: #1a1a1a !important;
            color: #ffffff !important;
            border: 1px solid #1a1a1a !important;
            border-radius: 4px !important;
            filter: none !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          }

          .q-file .q-field__control .q-btn:hover,
          .q-file .q-btn[color='primary']:not(.q-btn--flat):not(.q-btn--outline):not(.apple-pay-button):hover {
            background: #2a2a2a !important;
            border-color: #2a2a2a !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
            filter: none !important;
          }

          /* Remove shadows from easel images for cleaner look */
          .easel-image {
            filter: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
          }

          /* Clean carousel dots */
          .carousel-dot {
            background: transparent !important;
            border: 1.5px solid rgba(0, 0, 0, 0.3) !important;
          }

          .carousel-dot.dot-active {
            background: #1a1a1a !important;
            border-color: #1a1a1a !important;
            box-shadow: none !important;
          }

          /* Change header from purple to dark grey/black gradient - use maximum specificity to override MainLayout */
          body .q-layout .q-header,
          body .q-layout .q-header.bg-primary,
          body .q-layout .q-header.elevated,
          body .q-header.bg-primary,
          body .q-header.elevated,
          .q-layout .q-header.bg-primary,
          .q-header.bg-primary,
          .q-header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%) !important;
            background-color: #000000 !important;
            background-image: none !important;
          }

          /* Ensure toolbar and all header children don't override */
          .q-header .q-toolbar,
          body .q-header .q-toolbar,
          .q-header .q-toolbar.bg-primary {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Cursive, clean header font - maximum specificity */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title span,
          body .q-header .q-toolbar-title .text-h5,
          body .q-header .q-toolbar-title .text-weight-bold,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title span,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title span,
          .q-header .q-toolbar-title .text-h5,
          .q-header .q-toolbar-title .text-weight-bold {
            font-family: 'Brush Script MT', 'Lucida Handwriting', 'Apple Chancery', 'Zapf Chancery', 'Dancing Script', 'Great Vibes', cursive !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: 0.05em !important;
            text-transform: none !important;
            color: #ffffff !important;
          }

          /* Ensure all header text stays white - maximum specificity */
          body .q-header .q-toolbar-title,
          body .q-header .q-toolbar-title *,
          body .q-header .q-toolbar-title span,
          body .q-header .q-btn,
          body .q-header .q-chip,
          body .q-header .q-btn .q-icon,
          .q-layout .q-header .q-toolbar-title,
          .q-layout .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title,
          .q-header .q-toolbar-title *,
          .q-header .q-toolbar-title span,
          .q-header .q-btn,
          .q-header .q-chip,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure header buttons and icons are visible */
          body .q-header .q-btn,
          .q-header .q-btn {
            color: #ffffff !important;
          }

          body .q-header .q-btn .q-icon,
          .q-header .q-btn .q-icon {
            color: #ffffff !important;
          }

          /* Ensure logo text is white and readable */
          body .q-header .q-toolbar-title,
          body .q-header * {
            color: #ffffff !important;
          }
        `;
        await this.updateThemeStyles(existingLineA.id, updatedLineAModernStyles);
        console.log('LineA Modern theme updated with latest styles');
      }
    }

    // Set White Lattus as default active theme if no active theme exists
    if (whiteLattusDocRef) {
      const activeTheme = await themeService.getActiveTheme();
      if (!activeTheme && whiteLattusDocRef.id) {
        const activeThemeRef = doc(db, THEMES_COLLECTION, ACTIVE_THEME_DOC);
        await setDoc(
          activeThemeRef,
          {
            themeId: whiteLattusDocRef.id,
            activatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log('White Lattus set as default active theme');
      }
    }

    hasInitialized = true;
    // After all themes are created/updated, force reapply active theme if it was updated
    const finalActiveTheme = await themeService.getActiveTheme();
    if (finalActiveTheme) {
      // Reapply to ensure latest styles are used (this will also update cache)
      console.log(`[ThemeService] Reapplying active theme after initialization: ${finalActiveTheme.name}`);
      themeService.applyTheme(finalActiveTheme);
    }

    console.log('Theme initialization completed');
  } catch (error) {
    console.error('Error initializing default themes:', error);
  } finally {
    isInitializing = false;
  }
};

