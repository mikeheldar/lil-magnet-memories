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

    // Create new style element
    const style = document.createElement('style');
    style.id = 'dynamic-theme-styles';
    style.textContent = theme.styles;
    document.head.appendChild(style);

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

          for (const duplicate of toDelete) {
            try {
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

  // If we've already initialized and both themes exist, skip
  if (hasInitialized) {
    try {
      const existingThemes = await themeService.getAllThemes();
      const whiteLattusExists = existingThemes.some(
        (theme) => theme.name === 'White Lattus'
      );
      const silverCrisCrossExists = existingThemes.some(
        (theme) => theme.name === 'Silver Cris-Cross'
      );
      if (whiteLattusExists && silverCrisCrossExists) {
        console.log('Both default themes already exist, skipping initialization');
        return;
      }
    } catch (error) {
      console.error('Error checking existing themes:', error);
    }
  }

  isInitializing = true;
  try {
    // First, clean up any duplicate themes
    await themeService.cleanupDuplicateThemes();
    
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
