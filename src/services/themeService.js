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
import { db } from '../firebase/config.js';

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
      const themeRef = doc(db, THEMES_COLLECTION, themeId);
      const themeSnap = await getDoc(themeRef);

      if (themeSnap.exists()) {
        return {
          id: themeSnap.id,
          ...themeSnap.data(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting theme:', error);
      throw error;
    }
  },

  /**
   * Get the currently active theme
   */
  async getActiveTheme() {
    try {
      const activeThemeRef = doc(db, THEMES_COLLECTION, ACTIVE_THEME_DOC);
      const activeThemeSnap = await getDoc(activeThemeRef);

      if (activeThemeSnap.exists()) {
        const activeThemeId = activeThemeSnap.data().themeId;
        if (activeThemeId) {
          return await this.getTheme(activeThemeId);
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting active theme:', error);
      throw error;
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
   * Activate a theme
   */
  async activateTheme(themeId) {
    try {
      // Verify theme exists
      const theme = await this.getTheme(themeId);
      if (!theme) {
        throw new Error('Theme not found');
      }

      // Set as active theme
      const activeThemeRef = doc(db, THEMES_COLLECTION, ACTIVE_THEME_DOC);
      await setDoc(
        activeThemeRef,
        {
          themeId: themeId,
          activatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Apply theme styles
      this.applyTheme(theme);
    } catch (error) {
      console.error('Error activating theme:', error);
      throw error;
    }
  },

  /**
   * Apply theme styles to the page
   */
  applyTheme(theme) {
    if (!theme || !theme.styles) {
      console.warn('Theme or theme.styles is missing');
      return;
    }

    // Remove existing theme styles
    const existingStyle = document.getElementById('dynamic-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element and append at the end of head for maximum specificity
    const style = document.createElement('style');
    style.id = 'dynamic-theme-styles';
    style.textContent = theme.styles;
    // Append at the end of head to ensure it overrides other styles
    document.head.appendChild(style);

    // Force reflow to ensure styles are applied
    void document.body.offsetHeight;

    // Store theme in localStorage for quick access
    localStorage.setItem('activeTheme', JSON.stringify(theme));
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
   * Initialize theme on page load
   */
  async initializeTheme() {
    try {
      // Try to get active theme from Firebase
      const activeTheme = await this.getActiveTheme();
      if (activeTheme) {
        this.applyTheme(activeTheme);
        return activeTheme;
      }

      // Fallback to localStorage if Firebase fails
      const storedTheme = localStorage.getItem('activeTheme');
      if (storedTheme) {
        const theme = JSON.parse(storedTheme);
        this.applyTheme(theme);
        return theme;
      }
    } catch (error) {
      console.error('Error initializing theme:', error);
      // Fallback to localStorage
      const storedTheme = localStorage.getItem('activeTheme');
      if (storedTheme) {
        const theme = JSON.parse(storedTheme);
        this.applyTheme(theme);
        return theme;
      }
    }
    return null;
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

          /* Header font - non-cursive, white text */
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: normal !important;
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

          /* Header font - non-cursive, black text */
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: normal !important;
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
      // No old themes, create new ones if they don't exist
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

          /* Header font - non-cursive, white text */
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: normal !important;
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

          /* Header font - non-cursive, black text */
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif !important;
            font-weight: 400 !important;
            font-style: normal !important;
            letter-spacing: normal !important;
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
    console.log('Theme initialization completed');
  } catch (error) {
    console.error('Error initializing default themes:', error);
  } finally {
    isInitializing = false;
  }
};
