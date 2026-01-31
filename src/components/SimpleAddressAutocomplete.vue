<template>
  <div class="simple-autocomplete-wrapper">
    <q-input
      v-if="!scriptLoaded"
      :model-value="modelValue"
      :label="label"
      :hint="hint"
      filled
      readonly
    >
      <template v-slot:prepend>
        <q-icon name="place" />
      </template>
      <template v-slot:append>
        <q-spinner color="primary" size="20px" />
      </template>
    </q-input>

    <div v-else class="autocomplete-container">
      <div class="label-text">{{ label }}</div>
      <div class="input-wrapper">
        <q-icon name="place" class="prepend-icon" />
        <gmp-place-autocomplete
          ref="autocompleteElement"
          :placeholder="hint"
        />
      </div>
      <div v-if="hint" class="hint-text">{{ hint }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: String,
  label: String,
  hint: String,
  rules: Array,
});

const emit = defineEmits(['update:modelValue', 'place-selected']);

const autocompleteElement = ref(null);
const scriptLoaded = ref(false);
let pollInterval = null;

console.log('🎯 [SimpleAutocomplete] Component created');

const loadScript = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      console.log('🎯 [SimpleAutocomplete] Script already loaded');
      resolve();
      return;
    }

    // Check if script tag exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('🎯 [SimpleAutocomplete] Script tag exists, waiting...');
      existingScript.addEventListener('load', () => {
        console.log('🎯 [SimpleAutocomplete] Script loaded');
        resolve();
      });
      return;
    }

    // Load the script
    console.log('🎯 [SimpleAutocomplete] Loading script...');
    const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY_TEST || import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('🎯 [SimpleAutocomplete] Script loaded successfully');
      resolve();
    };
    document.head.appendChild(script);
  });
};

onMounted(async () => {
  console.log('🎯 [SimpleAutocomplete] Mounted, loading script...');
  
  await loadScript();
  scriptLoaded.value = true;
  
  // Wait for Vue to render the web component
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const element = autocompleteElement.value;
  if (!element) {
    console.error('🎯 [SimpleAutocomplete] Element not found after script load');
    return;
  }
  
  console.log('🎯 [SimpleAutocomplete] Element found, setting up listener');
  console.log('🎯 [SimpleAutocomplete] Element:', element);

  // Try to access value property directly
  Object.defineProperty(element, 'onValueChange', {
    set: function(value) {
      console.log('🎯 [SimpleAutocomplete] ⚡ Value property changed:', value);
      if (value) {
        emit('update:modelValue', value);
        emit('place-selected', { formattedAddress: value });
      }
    }
  });

  // LISTEN TO ALL POSSIBLE EVENTS
  ['gmp-placeselect', 'place_changed', 'placeselect', 'select', 'change', 'input', 'blur', 'click'].forEach(eventName => {
    element.addEventListener(eventName, (e) => {
      console.log(`🎯 [SimpleAutocomplete] EVENT: ${eventName}`, e);
      
      // Try to get value on any event
      if (eventName === 'blur' || eventName === 'change') {
        const value = element.value || element.getAttribute('value');
        console.log(`🎯 [SimpleAutocomplete] On ${eventName}, element.value:`, value);
        if (value && value.length > 10) {
          console.log(`🎯 [SimpleAutocomplete] ✅ FOUND VALUE ON ${eventName}:`, value);
          emit('update:modelValue', value);
          emit('place-selected', { formattedAddress: value });
        }
      }
    });
  });

  // Listen for place selection (primary approach)
  element.addEventListener('gmp-placeselect', async (event) => {
    console.log('🎯 [SimpleAutocomplete] ✅ gmp-placeselect EVENT FIRED!');
    const place = event.detail?.place;
    
    if (!place) {
      console.warn('🎯 [SimpleAutocomplete] No place in event.detail');
      return;
    }

    try {
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'addressComponents', 'location', 'id'],
      });

      const formattedAddress = place.formattedAddress || place.displayName;
      console.log('🎯 [SimpleAutocomplete] ✅ Formatted address:', formattedAddress);
      
      // EMIT BOTH EVENTS IMMEDIATELY
      emit('update:modelValue', formattedAddress);
      console.log('🎯 [SimpleAutocomplete] ✅ Emitted update:modelValue');
      
      const coordinates = place.location ? {
        lat: place.location.lat(),
        lng: place.location.lng(),
      } : null;
      
      const placeDetails = {
        formattedAddress,
        coordinates,
        placeId: place.id,
      };
      
      emit('place-selected', placeDetails);
      console.log('🎯 [SimpleAutocomplete] ✅ Emitted place-selected:', placeDetails);
      
      // ALSO emit a generic 'selected' event as backup
      emit('selected', placeDetails);
      console.log('🎯 [SimpleAutocomplete] ✅ Emitted selected (backup)');
      
    } catch (error) {
      console.error('🎯 [SimpleAutocomplete] ❌ Error:', error);
    }
  });

  // POLLING for value changes (very aggressive)
  const getInputValue = () => {
    try {
      // Try multiple ways to access the input
      console.log('🎯 [SimpleAutocomplete] Checking for input...');
      
      // Method 1: Light DOM
      let input = element.querySelector('input');
      console.log('🎯 [SimpleAutocomplete] Light DOM input:', input);
      
      // Method 2: Shadow DOM
      if (!input && element.shadowRoot) {
        input = element.shadowRoot.querySelector('input');
        console.log('🎯 [SimpleAutocomplete] Shadow DOM input:', input);
      }
      
      // Method 3: Check all inputs on page
      if (!input) {
        const allInputs = document.querySelectorAll('input');
        console.log('🎯 [SimpleAutocomplete] All inputs on page:', allInputs.length);
        // Find the one that might have an address value
        for (const inp of allInputs) {
          if (inp.value && inp.value.length > 10 && inp.value.includes(',')) {
            console.log('🎯 [SimpleAutocomplete] Found candidate input:', inp.value);
            input = inp;
            break;
          }
        }
      }
      
      const value = input?.value || '';
      if (value) {
        console.log('🎯 [SimpleAutocomplete] Input value:', value, 'length:', value.length);
      }
      return value;
    } catch (e) {
      console.error('🎯 [SimpleAutocomplete] Error getting input:', e);
      return '';
    }
  };

  let lastValue = '';
  let pollCount = 0;
  pollInterval = setInterval(() => {
    pollCount++;
    if (pollCount % 10 === 0) {  // Log every 10th poll (every second)
      console.log('🎯 [SimpleAutocomplete] Polling...', pollCount);
    }
    
    const currentValue = getInputValue();
    if (currentValue && currentValue !== lastValue) {
      console.log('🎯 [SimpleAutocomplete] 🚀 POLL DETECTED CHANGE!');
      console.log('🎯 [SimpleAutocomplete] Old:', lastValue);
      console.log('🎯 [SimpleAutocomplete] New:', currentValue);
      lastValue = currentValue;
      emit('update:modelValue', currentValue);
      console.log('🎯 [SimpleAutocomplete] ✅ Emitted via poll');
    }
  }, 100);

  console.log('🎯 [SimpleAutocomplete] Setup complete');
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<style scoped>
.simple-autocomplete-wrapper {
  width: 100%;
}

.autocomplete-container {
  position: relative;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px 4px 0 0;
  padding: 16px 12px 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.42);
}

.label-text {
  position: absolute;
  top: 4px;
  left: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prepend-icon {
  color: rgba(0, 0, 0, 0.54);
  font-size: 24px;
}

.hint-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
}

gmp-place-autocomplete {
  flex: 1;
  width: 100%;
}

:deep(gmp-place-autocomplete input) {
  border: none !important;
  outline: none !important;
  background: transparent !important;
  font-size: 16px !important;
  width: 100% !important;
  padding: 0 !important;
  font-family: inherit !important;
}
</style>
