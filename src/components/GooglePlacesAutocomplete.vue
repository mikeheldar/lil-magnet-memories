<template>
  <div class="google-places-autocomplete">
    <div class="input-label" v-if="label">
      {{ label }} <span v-if="isRequired" class="text-negative">*</span>
    </div>
    <div class="autocomplete-wrapper" :class="{ 'filled-style': filled, 'outlined-style': outlined }">
      <q-icon name="place" class="prepend-icon" />
      <gmp-place-autocomplete
        ref="autocompleteRef"
        :placeholder="hint"
        class="gmp-autocomplete-input"
      />
      <q-spinner v-if="loading" color="primary" size="20px" class="append-icon" />
    </div>
    <div v-if="hint && !hideHint" class="input-hint">{{ hint }}</div>
    <div v-if="errorMessage" class="input-error">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, onUnmounted, nextTick } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: 'Location/Address',
  },
  filled: {
    type: Boolean,
    default: true,
  },
  outlined: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  hint: {
    type: String,
    default: 'Start typing an address...',
  },
  types: {
    type: Array,
    // establishment + geocode helps venues (breweries, etc.) and street addresses
    default: () => ['establishment', 'geocode'],
  },
});

const emit = defineEmits(['update:modelValue', 'place-selected']);

const autocompleteRef = ref(null);
const inputValue = ref(props.modelValue);
const loading = ref(false);
const errorMessage = ref('');
const hideHint = ref(false);

const isRequired = computed(() => {
  return props.rules.some(rule => {
    const result = rule('');
    return result !== true && typeof result === 'string' && result.toLowerCase().includes('required');
  });
});

// Watch for external changes to modelValue (e.g. GPS reverse-geocode filling the field)
watch(
  () => props.modelValue,
  async (newVal) => {
    if (newVal === inputValue.value) return;
    inputValue.value = newVal;
    await syncModelValueToDom(newVal);
  }
);

/** Resolve DOM node for gmp-place-autocomplete (Vue ref quirks). */
function resolveAutocompleteEl() {
  const v = autocompleteRef.value;
  if (!v) return null;
  if (v instanceof HTMLElement) return v;
  if (v.$el instanceof HTMLElement) return v.$el;
  return v;
}

function findInnerInput(host) {
  if (!host) return null;
  let input = host.querySelector?.('input');
  if (input) return input;
  if (host.shadowRoot) {
    input = host.shadowRoot.querySelector('input');
    if (input) return input;
  }
  return null;
}

/** Wait until gmp-place-autocomplete exposes its internal input (shadow DOM). */
function waitForInnerInput(host, { timeoutMs = 3000, intervalMs = 50 } = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      const input = findInnerInput(host);
      if (input) {
        resolve(input);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(null);
        return;
      }
      requestAnimationFrame(() => setTimeout(tick, intervalMs));
    };
    tick();
  });
}

/** Legacy Autocomplete used (establishment|geocode). New widget uses includedPrimaryTypes; omit when "mixed". */
function toIncludedPrimaryTypes(types) {
  if (!types?.length) return null;
  // Legacy "geocode" isn't a new primary type; omit filter so addresses + venues can both appear.
  if (types.includes('geocode')) return null;
  const mapped = types.filter((t) => t && t !== 'geocode').slice(0, 5);
  return mapped.length ? mapped : null;
}

function coordsFromLocation(loc) {
  if (!loc) return null;
  if (typeof loc.lat === 'function' && typeof loc.lng === 'function') {
    return { lat: loc.lat(), lng: loc.lng() };
  }
  const lat = loc.lat;
  const lng = loc.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng };
  }
  return null;
}

/** Resolve Place from gmp-select (new) or gmp-placeselect (legacy). */
function placeFromSelectEvent(event) {
  if (event?.placePrediction && typeof event.placePrediction.toPlace === 'function') {
    return event.placePrediction.toPlace();
  }
  if (event?.detail?.place) return event.detail.place;
  if (event?.place) return event.place;
  return null;
}

/**
 * Push v-model into the gmp-place-autocomplete UI. The web component exposes
 * `value` on the host; shadow inner input may not exist on first tick.
 */
const syncModelValueToDom = async (value) => {
  const str = value ?? '';
  await nextTick();

  const host = resolveAutocompleteEl();
  if (!host) return;

  // PlaceAutocompleteElement exposes `value` on the host element.
  try {
    host.value = str;
  } catch (e) {
    console.warn('[GooglePlacesAutocomplete] Could not set host.value:', e);
  }

  let inputEl = null;
  if (host.input && host.input instanceof HTMLInputElement) {
    inputEl = host.input;
  }
  if (!inputEl) {
    inputEl = findInnerInput(host) || (await waitForInnerInput(host));
  }
  if (!inputEl) {
    console.warn('[GooglePlacesAutocomplete] No inner input to sync modelValue');
    validateInput(str);
    return;
  }

  if (inputEl.value !== str) {
    inputEl.value = str;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  validateInput(str);
};

const validateInput = (value) => {
  errorMessage.value = '';
  for (const rule of props.rules) {
    const result = rule(value);
    if (result !== true) {
      errorMessage.value = result;
      return false;
    }
  }
  return true;
};

let teardownAutocomplete = null;

const initAutocomplete = async () => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps JavaScript API not loaded');
    return;
  }

  await nextTick();
  const element = resolveAutocompleteEl();
  if (!element) {
    console.error('Could not find autocomplete element');
    return;
  }

  // New Place Autocomplete (web component): use includedPrimaryTypes, NOT legacy `types` attribute.
  const primaryTypes = toIncludedPrimaryTypes(props.types);
  if (primaryTypes?.length) {
    try {
      element.includedPrimaryTypes = primaryTypes;
    } catch (e) {
      console.warn('📍 [GooglePlacesAutocomplete] Could not set includedPrimaryTypes:', e);
    }
  }

  const inputElement = (await waitForInnerInput(element)) || findInnerInput(element);
  console.log('📍 [GooglePlacesAutocomplete] Input element found:', !!inputElement);

  let selectCooldownUntil = 0;
  const onSelect = async (event) => {
    if (Date.now() < selectCooldownUntil) return;

    const place = placeFromSelectEvent(event);

    if (!place) {
      console.warn('📍 [GooglePlacesAutocomplete] No place on select event');
      return;
    }

    try {
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'addressComponents', 'location', 'id'],
      });

      const addressComponents = {};
      if (place.addressComponents) {
        place.addressComponents.forEach((component) => {
          const types = component.types;
          if (types.includes('street_number')) {
            addressComponents.streetNumber = component.longText;
          }
          if (types.includes('route')) {
            addressComponents.route = component.longText;
          }
          if (types.includes('locality')) {
            addressComponents.city = component.longText;
          }
          if (types.includes('administrative_area_level_1')) {
            addressComponents.state = component.shortText;
            addressComponents.stateLong = component.longText;
          }
          if (types.includes('postal_code')) {
            addressComponents.zip = component.longText;
          }
          if (types.includes('country')) {
            addressComponents.country = component.shortText;
            addressComponents.countryLong = component.longText;
          }
        });
      }

      const formattedAddress = place.formattedAddress || place.displayName;

      console.log('📍 [GooglePlacesAutocomplete] Place selected:', formattedAddress);

      inputValue.value = formattedAddress || '';

      await nextTick();
      emit('update:modelValue', formattedAddress || '');
      await nextTick();
      emit('update:modelValue', formattedAddress || '');

      const inner = findInnerInput(element) || inputElement;
      if (inner) {
        inner.value = formattedAddress || '';
      }

      validateInput(formattedAddress);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const coordinates = coordsFromLocation(place.location);
      selectCooldownUntil = Date.now() + 500;
      emit('place-selected', {
        formattedAddress,
        addressComponents,
        coordinates,
        placeId: place.id,
        name: place.displayName,
      });

      hideHint.value = true;

      console.log('📍 [GooglePlacesAutocomplete] place-selected emitted, coords:', coordinates);
    } catch (error) {
      console.error('📍 [GooglePlacesAutocomplete] Error fetching place details:', error);
    }
  };

  element.addEventListener('gmp-select', onSelect);
  element.addEventListener('gmp-placeselect', onSelect);

  let aggressivePoller = null;
  if (inputElement) {
    const onInput = (event) => {
      const value = event.target.value;
      inputValue.value = value;
      emit('update:modelValue', value);
      validateInput(value);
    };

    const onBlur = (event) => {
      const value = event.target.value;
      validateInput(value);
      if (value && value !== props.modelValue) {
        inputValue.value = value;
        emit('update:modelValue', value);
      }
    };

    const onChange = (event) => {
      const value = event.target.value;
      if (value) {
        inputValue.value = value;
        emit('update:modelValue', value);
        validateInput(value);
      }
    };

    inputElement.addEventListener('input', onInput);
    inputElement.addEventListener('blur', onBlur);
    inputElement.addEventListener('change', onChange);

    let lastKnownValue = inputElement.value;
    aggressivePoller = setInterval(() => {
      const inner = findInnerInput(element);
      if (!inner) return;
      const currentValue = inner.value;
      if (currentValue && currentValue !== lastKnownValue) {
        lastKnownValue = currentValue;
        inputValue.value = currentValue;
        emit('update:modelValue', currentValue);
      }
    }, 100);

    teardownAutocomplete = () => {
      element.removeEventListener('gmp-select', onSelect);
      element.removeEventListener('gmp-placeselect', onSelect);
      inputElement.removeEventListener('input', onInput);
      inputElement.removeEventListener('blur', onBlur);
      inputElement.removeEventListener('change', onChange);
      if (aggressivePoller) clearInterval(aggressivePoller);
      teardownAutocomplete = null;
    };
  } else {
    teardownAutocomplete = () => {
      element.removeEventListener('gmp-select', onSelect);
      element.removeEventListener('gmp-placeselect', onSelect);
      teardownAutocomplete = null;
    };
  }

  if (props.modelValue) {
    await syncModelValueToDom(props.modelValue);
  }
};

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded and ready
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('📍 [GooglePlacesAutocomplete] API already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('📍 [GooglePlacesAutocomplete] Script tag exists, waiting for API to be ready...');
      // Wait for it to be ready
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('📍 [GooglePlacesAutocomplete] API ready after waiting');
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for Google Maps API'));
      }, 10000);
      return;
    }

    // Load the script with the new loading parameter for web components
    const apiKey =
      import.meta.env.VITE_GOOGLE_PLACES_API_KEY_TEST ||
      import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      reject(
        new Error(
          'Set VITE_GOOGLE_PLACES_API_KEY_TEST or VITE_GOOGLE_PLACES_API_KEY'
        )
      );
      return;
    }

    console.log(
      '📍 [GooglePlacesAutocomplete] Creating new script tag (key from',
      import.meta.env.VITE_GOOGLE_PLACES_API_KEY_TEST
        ? 'VITE_GOOGLE_PLACES_API_KEY_TEST'
        : 'VITE_GOOGLE_PLACES_API_KEY',
      ')...'
    );
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('📍 [GooglePlacesAutocomplete] Script onload fired, waiting for API...');
      // Wait for the API to be fully ready after script loads
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('📍 [GooglePlacesAutocomplete] API ready!');
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('API not ready after script load'));
      }, 5000);
    };
    
    script.onerror = () => {
      console.error('📍 [GooglePlacesAutocomplete] Script failed to load');
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
    console.log('📍 [GooglePlacesAutocomplete] Script tag added to head');
  });
};

onUnmounted(() => {
  if (teardownAutocomplete) teardownAutocomplete();
});

onMounted(async () => {
  loading.value = true;
  console.log('📍 [GooglePlacesAutocomplete] Component mounted');
  console.log(
    '📍 [GooglePlacesAutocomplete] API Key present:',
    !!(
      import.meta.env.VITE_GOOGLE_PLACES_API_KEY_TEST ||
      import.meta.env.VITE_GOOGLE_PLACES_API_KEY
    )
  );
  
  try {
    console.log('📍 [GooglePlacesAutocomplete] Loading Google Maps script...');
    await loadGoogleMapsScript();
    console.log('📍 [GooglePlacesAutocomplete] Script loaded successfully');
    
    console.log('📍 [GooglePlacesAutocomplete] Initializing autocomplete...');
    await initAutocomplete();
    console.log('📍 [GooglePlacesAutocomplete] Autocomplete initialized');
  } catch (error) {
    console.error('📍 [GooglePlacesAutocomplete] Error loading:', error);
    errorMessage.value = 'Failed to load address autocomplete';
  } finally {
    loading.value = false;
    console.log('📍 [GooglePlacesAutocomplete] Mount complete');
  }
});

// Expose validate method for form validation
defineExpose({
  validate: () => validateInput(inputValue.value),
});
</script>

<style scoped>
.google-places-autocomplete {
  width: 100%;
  margin-bottom: 16px;
}

.input-label {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 4px;
  font-weight: 500;
}

.autocomplete-wrapper {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  border-radius: 4px;
  transition: all 0.3s;
}

.autocomplete-wrapper.filled-style {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.42);
}

.autocomplete-wrapper.filled-style:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

.autocomplete-wrapper.filled-style:focus-within {
  border-bottom: 2px solid var(--q-primary);
  background-color: rgba(0, 0, 0, 0.08);
}

.autocomplete-wrapper.outlined-style {
  border: 1px solid rgba(0, 0, 0, 0.24);
  padding: 8px 12px;
}

.autocomplete-wrapper.outlined-style:hover {
  border-color: rgba(0, 0, 0, 0.87);
}

.autocomplete-wrapper.outlined-style:focus-within {
  border: 2px solid var(--q-primary);
}

.prepend-icon {
  color: rgba(0, 0, 0, 0.54);
  margin-right: 12px;
  font-size: 24px;
  flex-shrink: 0;
}

.append-icon {
  margin-left: 12px;
  flex-shrink: 0;
}

.gmp-autocomplete-input {
  flex: 1;
  min-width: 0;
}

/* Style the Google Place Autocomplete web component */
:deep(gmp-place-autocomplete) {
  width: 100%;
}

:deep(gmp-place-autocomplete input) {
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  font-family: inherit;
  color: rgba(0, 0, 0, 0.87);
  width: 100%;
  padding: 0;
}

:deep(gmp-place-autocomplete input::placeholder) {
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
}

.input-hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
  padding-left: 12px;
}

.input-error {
  font-size: 12px;
  color: var(--q-negative);
  margin-top: 4px;
  padding-left: 12px;
}

/* Style the autocomplete dropdown */
:deep(.pac-container) {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  margin-top: 4px;
  font-family: inherit;
  z-index: 9999;
}

:deep(.pac-item) {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  border-top: 1px solid #e0e0e0;
}

:deep(.pac-item:first-child) {
  border-top: none;
}

:deep(.pac-item:hover) {
  background-color: #f5f5f5;
}

:deep(.pac-item-selected) {
  background-color: #e8f4fd;
}

:deep(.pac-icon) {
  margin-right: 8px;
}
</style>
