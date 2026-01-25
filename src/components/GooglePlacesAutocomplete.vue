<template>
  <div class="google-places-autocomplete">
    <q-input
      ref="inputRef"
      v-model="inputValue"
      :label="label"
      :filled="filled"
      :outlined="outlined"
      :rules="rules"
      :hint="hint"
      @update:model-value="onInputChange"
    >
      <template v-slot:prepend>
        <q-icon name="place" />
      </template>
      <template v-if="loading" v-slot:append>
        <q-spinner color="primary" size="20px" />
      </template>
    </q-input>
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
  types: {
    type: Array,
    default: () => ['address'], // Can be 'address', 'establishment', 'geocode', etc.
  },
});

const emit = defineEmits(['update:modelValue', 'place-selected']);

const inputRef = ref(null);
const inputValue = ref(props.modelValue);
const loading = ref(false);
let autocomplete = null;

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== inputValue.value) {
    inputValue.value = newVal;
  }
});

const onInputChange = (val) => {
  inputValue.value = val;
  emit('update:modelValue', val);
};

const initAutocomplete = () => {
  if (!window.google || !window.google.maps || !window.google.maps.places) {
    console.error('Google Maps JavaScript API not loaded');
    return;
  }

  // Get the native input element from Quasar's q-input
  const input = inputRef.value?.$el?.querySelector('input');
  if (!input) {
    console.error('Could not find input element');
    return;
  }

  // Create autocomplete instance
  autocomplete = new window.google.maps.places.Autocomplete(input, {
    types: props.types,
    fields: ['formatted_address', 'address_components', 'geometry', 'name', 'place_id'],
  });

  // Listen for place selection
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();

    if (!place.geometry) {
      console.warn('No details available for input:', place.name);
      return;
    }

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

    // Build formatted address string
    const formattedAddress = place.formatted_address || place.name;
    inputValue.value = formattedAddress;
    emit('update:modelValue', formattedAddress);

    // Emit detailed place information
    emit('place-selected', {
      formattedAddress,
      addressComponents,
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      },
      placeId: place.place_id,
      name: place.name,
    });
  });
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

    // Load the script
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_PLACES_API_KEY not found in environment variables'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  loading.value = true;
  try {
    await loadGoogleMapsScript();
    initAutocomplete();
  } catch (error) {
    console.error('Error loading Google Places Autocomplete:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.google-places-autocomplete {
  width: 100%;
}

/* Style the Google autocomplete dropdown to match Quasar theme */
:deep(.pac-container) {
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  margin-top: 4px;
  font-family: inherit;
}

:deep(.pac-item) {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
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
