# Google Places Autocomplete Implementation

## Overview

Market Events uses **`GooglePlacesAutocomplete.vue`**, which loads the Maps JavaScript API with the **`gmp-place-autocomplete`** web component and **`place.fetchFields`** (Places API surface recommended for new Google Cloud projects). Legacy `PlacesService` / `AutocompleteService` are **not** used on this page.

Coordinates from the selected place are saved on the `marketEvents` document as `coordinates: { lat, lng }` (required on **create**). Operators can also set the pin with **Use my location** or **manual lat/lng**. See [Places migration overview](https://developers.google.com/maps/documentation/javascript/places-migration-overview).

## Features

- **Auto-complete**: `gmp-place-autocomplete` (new widget). Default type filter `establishment` + `geocode` is expressed by **not** setting `includedPrimaryTypes` (so both venues and addresses can appear). Do **not** use the legacy `types` HTML attribute — it throws on the new API.
- **Map pin from Google**: Selecting a suggestion sets accurate coordinates (no Nominatim on this flow)
- **Fallbacks**: Browser geolocation and manual latitude/longitude on create/edit
- **Event list**: Each card shows **Pin set** vs **No map pin** for “at event” distance behavior

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
- `types`: Intended primary types for the new widget. If the list includes legacy `geocode`, the component **omits** `includedPrimaryTypes` so predictions are not over-restricted. Otherwise up to 5 strings are passed as `includedPrimaryTypes` on the element. Market Events uses `marketEventPlaceTypes = ['establishment', 'geocode']` → no `includedPrimaryTypes` (all types, biased by IP/region).

**Events:**
- `update:modelValue`: Emitted when address changes
- `place-selected`: Emitted with detailed place information when user selects an address

#### Integration in MarketEventsPage.vue

Create and edit dialogs use `GooglePlacesAutocomplete` with `@place-selected` and `@update:model-value` to track pins. Saving **requires** a pin on create (suggestion, GPS, or manual). On **edit**, if the address string is unchanged, `coordinates` are omitted from the Firestore update so existing pins are not wiped; if the address changes, a new pin must be supplied the same ways.

#### Place Selection Handler (summary)

`place-selected` emits `{ formattedAddress, addressComponents, coordinates: { lat, lng }, placeId, name }`. The page stores pending coordinates until save (and clears place-derived pins if the user edits the address text after a selection).

## Setup Requirements

### Environment Variables

Add your Google API key(s) to `.env`:

```env
VITE_GOOGLE_PLACES_API_KEY=your_production_key
# Optional: test/staging host uses this when set (same pattern as other test env vars)
VITE_GOOGLE_PLACES_API_KEY_TEST=your_test_key
```

The component loads **`VITE_GOOGLE_PLACES_API_KEY_TEST`** first when present, otherwise **`VITE_GOOGLE_PLACES_API_KEY`**.

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project tied to your key
3. Enable APIs required for **`gmp-place-autocomplete`** and **`Place.fetchFields`** (see current [Places API documentation](https://developers.google.com/maps/documentation/javascript/places)); typically:
   - **Maps JavaScript API**
   - **Places API (New)** / Places-related products as shown in the console for your billing account  
   New Google Cloud customers may **not** have access to legacy `PlacesService` without migration — the web component path avoids that.
4. **Billing** must be enabled for production use
5. **Credentials** → API key:
   - **Application restrictions**: HTTP referrers — include production domain, `localhost`, and test hostnames (e.g. `test.lilmagnetmemories.com`)
   - **API restrictions**: Restrict to the Maps/Places APIs you enabled above
6. Copy the key into `.env` and redeploy the SPA

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

- Migrate other pages still on `AddressAutocomplete.vue` (legacy) to this component or programmatic Places (New) APIs
- Optional static map preview on the event card

## Troubleshooting

### Common Issues

**"Google Maps JavaScript API not loaded"**
- Check that `VITE_GOOGLE_PLACES_API_KEY` or `VITE_GOOGLE_PLACES_API_KEY_TEST` is set in `.env`
- Verify the API key is valid
- Ensure the correct Places (New) + Maps JavaScript APIs are enabled for the project

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

- [Places migration overview (JavaScript)](https://developers.google.com/maps/documentation/javascript/places-migration-overview)
- [Legacy vs new Places](https://developers.google.com/maps/legacy)
- [Google Places API Pricing](https://developers.google.com/maps/billing/gmp-billing#places-product)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
