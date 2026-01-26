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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}&libraries=places&loading=async`;
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

  // Listen for place selection
  element.addEventListener('gmp-placeselect', async (event) => {
    console.log('🎯 [SimpleAutocomplete] Place selected!');
    const place = event.detail.place;
    
    if (!place) {
      console.warn('🎯 [SimpleAutocomplete] No place in event');
      return;
    }

    try {
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'addressComponents', 'location', 'id'],
      });

      const formattedAddress = place.formattedAddress || place.displayName;
      console.log('🎯 [SimpleAutocomplete] Address:', formattedAddress);
      
      emit('update:modelValue', formattedAddress);
      console.log('🎯 [SimpleAutocomplete] Emitted to parent');
      
      const coordinates = place.location ? {
        lat: place.location.lat(),
        lng: place.location.lng(),
      } : null;
      
      emit('place-selected', {
        formattedAddress,
        coordinates,
        placeId: place.id,
      });
      
    } catch (error) {
      console.error('🎯 [SimpleAutocomplete] Error:', error);
    }
  });

  // POLLING for value changes
  const getInputValue = () => {
    try {
      let input = element.querySelector('input');
      if (!input && element.shadowRoot) {
        input = element.shadowRoot.querySelector('input');
      }
      return input?.value || '';
    } catch (e) {
      return '';
    }
  };

  let lastValue = '';
  pollInterval = setInterval(() => {
    const currentValue = getInputValue();
    if (currentValue && currentValue !== lastValue && currentValue.length > 10) {
      console.log('🎯 [SimpleAutocomplete] POLL:', currentValue);
      lastValue = currentValue;
      emit('update:modelValue', currentValue);
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
