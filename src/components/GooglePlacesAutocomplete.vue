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
import { ref, onMounted, watch, computed } from 'vue';

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
    default: () => ['address'], // Can be 'address', 'establishment', 'geocode', etc.
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

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== inputValue.value) {
    inputValue.value = newVal;
    updateAutocompleteValue(newVal);
  }
});

const updateAutocompleteValue = (value) => {
  if (autocompleteRef.value) {
    const inputElement = autocompleteRef.value.querySelector('input');
    if (inputElement) {
      inputElement.value = value || '';
    }
  }
  // Also emit to ensure parent gets the update
  if (value) {
    emit('update:modelValue', value);
  }
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

const initAutocomplete = async () => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps JavaScript API not loaded');
    return;
  }

  const element = autocompleteRef.value;
  if (!element) {
    console.error('Could not find autocomplete element');
    return;
  }

  // Set the types for autocomplete
  if (props.types && props.types.length > 0) {
    element.setAttribute('types', props.types.join(','));
  }

  // Get the actual input element (might be in shadow DOM)
  let inputElement = element.querySelector('input');
  
  // If not found, try to access shadow root
  if (!inputElement && element.shadowRoot) {
    inputElement = element.shadowRoot.querySelector('input');
  }
  
  console.log('📍 [GooglePlacesAutocomplete] Input element found:', !!inputElement);

  // Listen for place selection using the new web component
  element.addEventListener('gmp-placeselect', async (event) => {
    const place = event.detail.place;

    if (!place) {
      console.warn('No place details available');
      return;
    }

    try {
      // Fetch place details
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'addressComponents', 'location', 'id'],
      });

      // Extract address components
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

      // Build formatted address string
      const formattedAddress = place.formattedAddress || place.displayName;
      
      console.log('📍 [GooglePlacesAutocomplete] Place selected:', formattedAddress);
      
      // Update internal value first
      inputValue.value = formattedAddress;
      
      // FORCE multiple emissions to ensure it gets through
      emit('update:modelValue', formattedAddress);
      
      // Wait a tick
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Emit again to be absolutely sure
      emit('update:modelValue', formattedAddress);
      
      console.log('📍 [GooglePlacesAutocomplete] Emitted update:modelValue TWICE with:', formattedAddress);
      
      // Update the input element value to ensure it's displayed
      if (inputElement) {
        inputElement.value = formattedAddress;
      }
      
      // Validate
      validateInput(formattedAddress);

      // Wait another tick
      await new Promise(resolve => setTimeout(resolve, 10));

      console.log('📍 [GooglePlacesAutocomplete] Emitting place-selected event');
      // Emit detailed place information
      emit('place-selected', {
        formattedAddress,
        addressComponents,
        coordinates: place.location ? {
          lat: place.location.lat(),
          lng: place.location.lng(),
        } : null,
        placeId: place.id,
        name: place.displayName,
      });

      hideHint.value = true;
      
      console.log('📍 [GooglePlacesAutocomplete] All emissions complete');
      console.log('📍 [GooglePlacesAutocomplete] Final inputValue.value:', inputValue.value);
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  });

  // Also listen to input changes for manual typing
  if (inputElement) {
    inputElement.addEventListener('input', (event) => {
      const value = event.target.value;
      inputValue.value = value;
      emit('update:modelValue', value);
      validateInput(value);
      console.log('📍 [GooglePlacesAutocomplete] Input changed:', value);
    });

    inputElement.addEventListener('blur', (event) => {
      const value = event.target.value;
      validateInput(value);
      // Ensure the value is emitted on blur as well
      if (value && value !== props.modelValue) {
        console.log('📍 [GooglePlacesAutocomplete] Blur event - emitting value:', value);
        inputValue.value = value;
        emit('update:modelValue', value);
      }
    });
    
    // Also add a change event listener as a fallback
    inputElement.addEventListener('change', (event) => {
      const value = event.target.value;
      if (value) {
        console.log('📍 [GooglePlacesAutocomplete] Change event - emitting value:', value);
        inputValue.value = value;
        emit('update:modelValue', value);
        validateInput(value);
      }
    });
  }

  // Set initial value if provided
  if (props.modelValue) {
    updateAutocompleteValue(props.modelValue);
  }
  
  // Set up a polling interval to check if the input has a value that wasn't emitted
  setInterval(() => {
    if (inputElement) {
      const currentInputValue = inputElement.value;
      if (currentInputValue && currentInputValue !== inputValue.value) {
        console.log('📍 [GooglePlacesAutocomplete] Polling detected unemitted value:', currentInputValue);
        inputValue.value = currentInputValue;
        emit('update:modelValue', currentInputValue);
      }
    }
  }, 500); // Check every 500ms
};

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Wait for it to load
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    // Load the script with the new loading parameter for web components
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_PLACES_API_KEY not found in environment variables'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  loading.value = true;
  console.log('📍 [GooglePlacesAutocomplete] Component mounted');
  console.log('📍 [GooglePlacesAutocomplete] API Key present:', !!import.meta.env.VITE_GOOGLE_PLACES_API_KEY);
  
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
