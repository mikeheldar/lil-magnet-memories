<template>
  <div class="address-autocomplete-wrapper">
    <q-input
      ref="inputRef"
      v-model="inputValue"
      :label="label"
      :filled="filled"
      :outlined="outlined"
      :rules="rules"
      :hint="hint"
      @update:model-value="handleInput"
      @blur="handleBlur"
    >
      <template v-slot:prepend>
        <q-icon name="place" />
      </template>
      <template v-if="loading" v-slot:append>
        <q-spinner color="primary" size="20px" />
      </template>
    </q-input>
    
    <!-- Manual dropdown for autocomplete suggestions -->
    <q-list v-if="suggestions.length > 0" bordered class="suggestions-dropdown">
      <q-item
        v-for="(suggestion, index) in suggestions"
        :key="index"
        clickable
        @click="selectSuggestion(suggestion)"
        class="suggestion-item"
      >
        <q-item-section avatar>
          <q-icon name="place" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ suggestion.description }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

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
});

const emit = defineEmits(['update:modelValue', 'place-selected']);

const inputRef = ref(null);
const inputValue = ref(props.modelValue);
const loading = ref(false);
const suggestions = ref([]);
let autocompleteService = null;
let placesService = null;

console.log('🏗️ [AddressAutocomplete] Component created');

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== inputValue.value) {
    inputValue.value = newVal;
  }
});

const handleInput = (val) => {
  console.log('🏗️ [AddressAutocomplete] handleInput called with:', val, 'length:', val?.length);
  inputValue.value = val;
  emit('update:modelValue', val);
  
  // Get autocomplete suggestions
  if (val && val.length > 2) {
    console.log('🏗️ [AddressAutocomplete] Length > 2, calling getSuggestions');
    getSuggestions(val);
  } else {
    console.log('🏗️ [AddressAutocomplete] Length <= 2 or empty, clearing suggestions');
    suggestions.value = [];
  }
};

const handleBlur = () => {
  // Delay hiding suggestions to allow click
  setTimeout(() => {
    suggestions.value = [];
  }, 200);
};

const getSuggestions = async (input) => {
  if (!autocompleteService) {
    console.log('🏗️ [AddressAutocomplete] Autocomplete service not ready');
    return;
  }

  console.log('🏗️ [AddressAutocomplete] Getting suggestions for:', input);

  try {
    const request = {
      input: input,
      types: ['address'],
    };

    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      console.log('🏗️ [AddressAutocomplete] Predictions callback fired');
      console.log('🏗️ [AddressAutocomplete] Status:', status);
      console.log('🏗️ [AddressAutocomplete] Predictions count:', predictions?.length || 0);
      
      if (status === 'OK' && predictions) {
        suggestions.value = predictions;
        console.log('🏗️ [AddressAutocomplete] Set suggestions:', suggestions.value.length);
      } else if (status === 'ZERO_RESULTS') {
        console.log('🏗️ [AddressAutocomplete] No results found');
        suggestions.value = [];
      } else if (status === 'REQUEST_DENIED') {
        console.error('🏗️ [AddressAutocomplete] REQUEST DENIED - Check API key and restrictions');
        suggestions.value = [];
      } else if (status === 'INVALID_REQUEST') {
        console.error('🏗️ [AddressAutocomplete] INVALID REQUEST - Check request parameters');
        suggestions.value = [];
      } else {
        console.error('🏗️ [AddressAutocomplete] Error status:', status);
        suggestions.value = [];
      }
    });
  } catch (error) {
    console.error('🏗️ [AddressAutocomplete] Error getting suggestions:', error);
    suggestions.value = [];
  }
};

const selectSuggestion = async (suggestion) => {
  console.log('🏗️ [AddressAutocomplete] Suggestion selected:', suggestion);
  
  // Set the display value
  inputValue.value = suggestion.description;
  emit('update:modelValue', suggestion.description);
  suggestions.value = [];

  // Get place details
  if (placesService) {
    const request = {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'address_components', 'geometry', 'name'],
    };

    placesService.getDetails(request, (place, status) => {
      console.log('🏗️ [AddressAutocomplete] Got place details:', place, 'status:', status);
      
      if (status === 'OK' && place) {
        // Extract address components
        const addressComponents = {};
        if (place.address_components) {
          place.address_components.forEach((component) => {
            const types = component.types;
            if (types.includes('street_number')) {
              addressComponents.streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              addressComponents.route = component.long_name;
            }
            if (types.includes('locality')) {
              addressComponents.city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              addressComponents.state = component.short_name;
              addressComponents.stateLong = component.long_name;
            }
            if (types.includes('postal_code')) {
              addressComponents.zip = component.long_name;
            }
            if (types.includes('country')) {
              addressComponents.country = component.short_name;
              addressComponents.countryLong = component.long_name;
            }
          });
        }

        // Emit detailed place information
        emit('place-selected', {
          formattedAddress: place.formatted_address || suggestion.description,
          addressComponents,
          coordinates: place.geometry?.location ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          } : null,
          placeId: suggestion.place_id,
          name: place.name,
        });
      }
    });
  }
};

const initServices = () => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('🏗️ [AddressAutocomplete] Google Maps API not loaded');
    return;
  }

  console.log('🏗️ [AddressAutocomplete] Initializing services...');
  
  // Initialize AutocompleteService for predictions
  autocompleteService = new window.google.maps.places.AutocompleteService();
  
  // Initialize PlacesService for details (needs a div element)
  const div = document.createElement('div');
  placesService = new window.google.maps.places.PlacesService(div);
  
  console.log('🏗️ [AddressAutocomplete] Services initialized successfully');
};

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('🏗️ [AddressAutocomplete] API already loaded');
      resolve();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('🏗️ [AddressAutocomplete] Waiting for existing script...');
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('🏗️ [AddressAutocomplete] API ready');
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout'));
      }, 10000);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      reject(new Error('No API key'));
      return;
    }

    console.log('🏗️ [AddressAutocomplete] Loading script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    
    script.onload = () => {
      console.log('🏗️ [AddressAutocomplete] Script loaded, waiting for API...');
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('🏗️ [AddressAutocomplete] API ready!');
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('API not ready'));
      }, 5000);
    };
    
    script.onerror = () => reject(new Error('Script load failed'));
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  loading.value = true;
  console.log('🏗️ [AddressAutocomplete] Mounting...');
  
  try {
    await loadGoogleMapsScript();
    initServices();
    console.log('🏗️ [AddressAutocomplete] Mount complete - ready to use');
  } catch (error) {
    console.error('🏗️ [AddressAutocomplete] Mount error:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.address-autocomplete-wrapper {
  position: relative;
  width: 100%;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  margin-top: 4px;
}

.suggestion-item {
  border-bottom: 1px solid #e0e0e0;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background-color: #f5f5f5;
}
</style>
