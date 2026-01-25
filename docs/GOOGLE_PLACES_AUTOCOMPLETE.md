# Google Places Autocomplete Implementation

## Overview

The Google Places Autocomplete feature has been integrated into the Market Events page to provide automatic address detection and validation when creating or editing market events.

## Features

- **Auto-complete Address Input**: As users type an address, Google provides suggestions
- **Address Auto-detection**: Automatically detects and formats full addresses
- **Address Components**: Extracts detailed address information (street, city, state, zip, coordinates)
- **Real-time Validation**: Ensures addresses are valid and properly formatted
- **User-friendly**: Familiar Google autocomplete interface

## How It Works

### User Experience

1. User starts typing an address in the Location field
2. Google Places API provides autocomplete suggestions in a dropdown
3. User selects the correct address from the dropdown
4. The full formatted address is automatically filled in
5. Additional address components (coordinates, place ID) are stored for future use

### Technical Implementation

#### Components

**GooglePlacesAutocomplete.vue** (`src/components/GooglePlacesAutocomplete.vue`)
- Reusable component that wraps Google Places Autocomplete API
- Integrates seamlessly with Quasar's q-input component
- Automatically loads Google Maps JavaScript API
- Extracts and emits detailed place information

**Key Props:**
- `modelValue`: The current address value (v-model)
- `label`: Input field label
- `rules`: Validation rules
- `hint`: Helper text
- `types`: Place types to search for (default: ['address'])

**Events:**
- `update:modelValue`: Emitted when address changes
- `place-selected`: Emitted with detailed place information when user selects an address

#### Integration in MarketEventsPage.vue

```vue
<GooglePlacesAutocomplete
  v-model="newEvent.location"
  label="Location/Address"
  :rules="[(val) => !!val || 'Location is required']"
  hint="Start typing an address and select from the dropdown"
  @place-selected="onNewEventPlaceSelected"
/>
```

#### Place Selection Handler

```javascript
const onNewEventPlaceSelected = (placeDetails) => {
  // placeDetails contains:
  // - formattedAddress: Full formatted address string
  // - addressComponents: Broken down components (street, city, state, zip, country)
  // - coordinates: { lat, lng }
  // - placeId: Google Place ID
  // - name: Place name (if applicable)
  
  // Store coordinates and place ID for future use
  if (placeDetails.coordinates) {
    newEvent.value.coordinates = placeDetails.coordinates;
    newEvent.value.placeId = placeDetails.placeId;
  }
};
```

## Setup Requirements

### Environment Variables

Add your Google Places API key to `.env`:

```env
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Places API** (for autocomplete)
   - **Maps JavaScript API** (for loading the library)
4. Create API credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Restrict the API key:
     - **Application restrictions**: Set to your domain(s)
     - **API restrictions**: Restrict to Places API and Maps JavaScript API
5. Copy the API key to your `.env` file

### API Key Security

⚠️ **Important**: Always restrict your API key:
- Set HTTP referrer restrictions to your domain
- Only enable the specific APIs you need
- Monitor usage in Google Cloud Console
- Set usage quotas to prevent unexpected charges

## Pricing

Google Places Autocomplete pricing (as of 2024):
- **Autocomplete - Per Session**: $2.83 per 1,000 sessions
- **Place Details**: $17 per 1,000 requests
- **Free Tier**: $200/month credit (covers ~70,000 autocomplete sessions)

A "session" starts when the user begins typing and ends when they select a place (or after 3 minutes of inactivity).

## Future Enhancements

Potential future improvements:
- Store coordinates in Firebase for map display
- Add map preview when creating events
- Use coordinates for distance calculations
- Add geocoding for existing events without coordinates
- Display event locations on an interactive map

## Troubleshooting

### Common Issues

**"Google Maps JavaScript API not loaded"**
- Check that `VITE_GOOGLE_PLACES_API_KEY` is set in `.env`
- Verify the API key is valid
- Ensure Places API and Maps JavaScript API are enabled in Google Cloud Console

**Autocomplete dropdown not appearing**
- Check browser console for errors
- Verify API key restrictions allow your domain
- Check that you haven't exceeded API quotas

**"This page can't load Google Maps correctly"**
- API key restrictions may be too strict
- Billing may not be enabled in Google Cloud Console
- API quotas may be exceeded

### Debugging

Enable detailed logging by checking the browser console. The component logs:
- Google Maps script loading status
- Autocomplete initialization
- Place selection details
- Any errors encountered

## Additional Resources

- [Google Places Autocomplete Documentation](https://developers.google.com/maps/documentation/javascript/place-autocomplete)
- [Google Places API Pricing](https://developers.google.com/maps/billing/gmp-billing#places-product)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
