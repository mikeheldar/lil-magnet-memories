<template>
  <div class="google-places-wrapper">
    <div class="q-field q-field--filled q-field--labeled">
      <div class="q-field__inner relative-position col">
        <div class="q-field__control relative-position row no-wrap">
          <div class="q-field__prepend q-anchor--skip">
            <q-icon name="place" />
          </div>
          
          <div class="q-field__control-container col relative-position row no-wrap q-anchor--skip">
            <gmp-place-autocomplete
              ref="autocompleteElement"
              class="full-width"
              :placeholder="hint"
            />
          </div>
        </div>
        
        <div v-if="hint" class="q-field__bottom row items-start">
          <div class="q-field__messages col">{{ hint }}</div>
        </div>
      </div>
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
let pollInterval = null;

console.log('🎯 [SimpleAutocomplete] Component created');

onMounted(async () => {
  console.log('🎯 [SimpleAutocomplete] Mounted');
  
  // Wait for the element to be ready
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const element = autocompleteElement.value;
  if (!element) {
    console.error('🎯 [SimpleAutocomplete] Element not found');
    return;
  }
  
  console.log('🎯 [SimpleAutocomplete] Element found, setting up listener');

  // Listen for place selection
  element.addEventListener('gmp-placeselect', async (event) => {
    console.log('🎯 [SimpleAutocomplete] Place selected event fired!');
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
      console.log('🎯 [SimpleAutocomplete] Got address:', formattedAddress);
      
      // EMIT IMMEDIATELY
      emit('update:modelValue', formattedAddress);
      console.log('🎯 [SimpleAutocomplete] Emitted to parent');
      
      // Extract coordinates
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

  // AGGRESSIVE POLLING - check input value every 100ms
  const getInputValue = () => {
    try {
      // Try light DOM first
      let input = element.querySelector('input');
      
      // Try shadow DOM if not found
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
      console.log('🎯 [SimpleAutocomplete] POLL detected new value:', currentValue);
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
.google-places-wrapper {
  width: 100%;
  margin-bottom: 16px;
}

.q-field--filled .q-field__control {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px 4px 0 0;
  padding: 8px 12px;
}

.q-field--filled .q-field__control:before {
  border-bottom: 1px solid rgba(0, 0, 0, 0.42);
}

:deep(gmp-place-autocomplete) {
  width: 100%;
  display: block;
}

:deep(gmp-place-autocomplete input) {
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  width: 100%;
  padding: 4px 0;
}
</style>
