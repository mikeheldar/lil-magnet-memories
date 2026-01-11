# Test Environment Pill Feature (Removed)

## Overview
This feature displayed an orange "TEST" chip/pill in the header to indicate when the application was running in the test environment.

## Implementation Details

### Detection Logic
The test environment was detected using the `config.isTest` computed property from `src/config/environment.js`:
- Checks `VITE_IS_TEST_ENVIRONMENT` environment variable (build-time)
- Falls back to checking `window.location.hostname === 'test.lilmagnetmemories.com'` (runtime)
- Defaults to `false` if unable to determine

### Display Location
- **Component**: `src/layouts/MainLayout.vue`
- **Position**: Header toolbar, between logo and market event toggle
- **Visibility**: Only shown when `isTestEnvironment` computed property was `true`

### Visual Design
- **Color**: Orange (`color="orange"`)
- **Text Color**: White (`text-color="white"`)
- **Size**: Small (`size="sm"`)
- **Icon**: Bug report icon (`icon="bug_report"`)
- **Text**: "TEST" (hidden on extra-small screens, shown on small+)
- **CSS Class**: `test-environment-chip header-element-responsive`

### Responsive Behavior
- Hidden on screens smaller than 1200px width (first element to hide in responsive header)
- Part of the responsive header element hiding system (test pill → About button → Logo → Title)

### CSS Styling
Located in `src/layouts/MainLayout.vue` styles:
```scss
.test-environment-chip {
  // Always ensure white text for test environment chip, regardless of theme
  color: #ffffff !important;
  
  span, .q-chip__content, * {
    color: #ffffff !important;
  }
}
```

### Removal Date
Removed: January 2025
Reason: No longer needed for production

## Related Code Locations
- `src/layouts/MainLayout.vue` - Component implementation
- `src/config/environment.js` - Environment detection logic
- Responsive hiding CSS rules in `src/layouts/MainLayout.vue`
