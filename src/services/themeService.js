import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
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

// Initialize default themes on first load
export const initializeDefaultThemes = async () => {
  try {
    const existingThemes = await themeService.getAllThemes();
    
    // Only create default themes if none exist
    if (existingThemes.length === 0) {
      // White Lattus theme (current white background with criss-cross)
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

      // Silver Cris-Cross theme (old grey/pink background with white text)
      const silverCrisCrossTheme = {
        name: 'Silver Cris-Cross',
        description: 'Classic grey-purple background with white text',
        styles: `
          .q-page-container,
          .landing-page,
          .hero-section {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
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
              ) !important;
          }
          .hero-title {
            color: #ffffff !important;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
          }
        `,
      };

      // Create themes in Firebase
      const themesRef = collection(db, THEMES_COLLECTION);
      
      const whiteLattusDocRef = await addDoc(themesRef, {
        ...whiteLattusTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const silverCrisCrossDocRef = await addDoc(themesRef, {
        ...silverCrisCrossTheme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Set White Lattus as default active theme
      const activeThemeRef = doc(db, THEMES_COLLECTION, ACTIVE_THEME_DOC);
      await setDoc(
        activeThemeRef,
        {
          themeId: whiteLattusDocRef.id,
          activatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('Default themes created successfully');
    }
  } catch (error) {
    console.error('Error initializing default themes:', error);
  }
};
