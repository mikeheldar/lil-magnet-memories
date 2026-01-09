/**
 * Theme Service - Disabled
 * All theme functionality has been removed. Styles are now hardcoded in app.scss.
 * This file exists as a stub to prevent import errors.
 */

export const themeService = {
  getLoggingEnabled() {
    return false;
  },

  setLoggingEnabled(enabled) {
    // No-op
  },

  async getAllThemes() {
    return [];
  },

  async getTheme(themeId) {
    return null;
  },

  async getActiveTheme() {
    return null;
  },

  async createTheme(themeData) {
    return null;
  },

  async updateThemeName(themeId, newName) {
    // No-op
  },

  async updateThemeStyles(themeId, newStyles) {
    // No-op - styles are hardcoded in app.scss
  },

  async activateTheme(themeId) {
    // No-op
  },

  applyTheme(theme) {
    // No-op - styles are hardcoded in app.scss
  },

  async cleanupDuplicateThemes() {
    // No-op
  },

  getDefaultFallbackTheme() {
    return {
      id: 'default',
      name: 'LineA Modern Black Header',
      styles: '',
    };
  },

  async initializeTheme() {
    // No-op
  },

  setupActiveThemeListener() {
    // No-op
  },

  cleanupActiveThemeListener() {
    // No-op
  },
};

export const initializeDefaultThemes = async () => {
  // No-op - themes are hardcoded in app.scss
  return Promise.resolve();
};
