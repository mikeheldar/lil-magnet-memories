# Theme Service Documentation

## Overview

The Theme Service (`src/services/themeService.js`) manages site-wide visual styling and themes. It allows administrators to change the site's appearance dynamically through the "Look and Feel" admin page, with changes applied in real-time to all users.

## Architecture

### Core Components

1. **Theme Storage**: Themes are stored in Firestore under the `themes` collection
2. **Active Theme**: The currently active theme is stored in `themes/activeTheme` document
3. **Caching**: Themes are cached in localStorage for offline use and faster initial load
4. **Style Injection**: Theme styles are injected as a `<style>` tag in the document head

### Key Files

- `src/services/themeService.js` - Main theme service implementation
- `src/pages/LookAndFeelPage.vue` - Admin interface for managing themes
- `src/css/app.scss` - Base CSS (now includes hard-coded LineA Modern Black Header styles)
- `public/theme-preload.js` - Preloads cached theme synchronously before Vue app loads

## Theme Structure

A theme object contains:
```javascript
{
  id: "theme-id",
  name: "Theme Name",
  description: "Theme description",
  styles: "/* CSS string */",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Default Theme: LineA Modern Black Header

The default theme is "LineA Modern Black Header" which features:
- **Header**: Black gradient background (`linear-gradient(135deg, #000000 0%, #1a1a1a 100%)`)
- **Header Text**: White, italic serif font (`'Times New Roman', 'Times', serif`)
- **Buttons**: Dark grey/black (`#1a1a1a`) with white text
- **Page Background**: Clean white (`#ffffff`)
- **Hero Title**: Dark grey text (`#1a1a1a`)

## Theme Service Methods

### `getAllThemes()`
Fetches all themes from Firestore, ordered by creation date (newest first).

### `getTheme(themeId)`
Fetches a specific theme by ID. Falls back to localStorage cache if offline.

### `getActiveTheme()`
Gets the currently active theme from Firestore. Returns cached theme if offline.

### `setActiveTheme(themeId)`
Sets a theme as active by updating the `themes/activeTheme` document in Firestore.

### `createTheme(themeData)`
Creates a new theme in Firestore.

### `updateTheme(themeId, updates)`
Updates theme metadata (name, description, etc.).

### `updateThemeStyles(themeId, styles)`
Updates the CSS styles for a theme.

### `deleteTheme(themeId)`
Deletes a theme from Firestore.

### `applyTheme(theme)`
Injects theme styles into the document head. Removes previous theme styles first.

### `initializeTheme()`
Initializes theme on page load. Tries Firebase first, falls back to cache, then to default theme.

### `setupActiveThemeListener()`
Sets up a real-time listener for active theme changes, so all users see updates immediately.

### `getLoggingEnabled()` / `setLoggingEnabled(enabled)`
Controls theme service console logging (default: off).

## Theme Preload

The `theme-preload.js` script runs synchronously before the Vue app loads to apply cached theme styles immediately, preventing flash of unstyled content (FOUC).

## Hard-Coded Default Theme

As of the latest update, the LineA Modern Black Header theme styles have been hard-coded into `src/css/app.scss` to ensure the site always loads with the correct appearance, even for new users on new browsers before any theme is loaded from Firebase.

## Look and Feel Page

The Look and Feel page (`src/pages/LookAndFeelPage.vue`) provides:
- List of all available themes
- Ability to create new themes
- Ability to edit existing themes
- Ability to set active theme
- Ability to delete themes
- Toggle for theme service logging

## Theme Logging

Theme service logging can be enabled/disabled from the Look and Feel page. When enabled, all theme service operations are logged to the console. Default is OFF to reduce console clutter.

## Caching Strategy

1. **Active Theme Cache**: Stored in `localStorage` as `activeTheme` (JSON string)
2. **Individual Theme Cache**: Stored as `theme_{themeId}` (JSON string)
3. **Cache is used when**:
   - Firebase is offline
   - Theme fetch times out
   - Document doesn't exist yet

## Real-Time Updates

When an admin changes the active theme, all connected users see the change immediately via Firestore's real-time listeners.

## Migration Notes

The theme service automatically:
- Creates default "LineA Modern Black Header" and "LineA Modern White Header" themes if they don't exist
- Updates existing LineA themes with latest styles (including cursive font)
- Handles migration from old theme names to new standardized names
