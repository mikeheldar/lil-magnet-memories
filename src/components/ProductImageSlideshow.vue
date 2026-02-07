<template>
  <div class="product-image-slideshow">
    <div
      v-if="images.length > 0"
      class="product-image-wrapper"
      @mouseenter="pauseSlideshow"
      @mouseleave="resumeSlideshow"
    >
      <!-- Image container with carousel-style transition -->
      <div class="slideshow-container">
        <div 
          class="slideshow-track"
          :class="{ 'is-transitioning': isTransitioning }"
          :style="{ 
            width: `${images.length * 100}%`,
            transform: `translateX(${-currentIndex * (100 / images.length)}%)` 
          }"
        >
          <img
            v-for="(image, index) in images"
            :key="`slide-${index}-${image}`"
            :src="image"
            :alt="alt"
            class="product-image"
            :style="{ width: `${100 / images.length}%` }"
            :class="{
              'ken-burns-forward': index === currentIndex && kenBurnsPhase === 'forward' && !isTransitioning,
              'ken-burns-reverse': index === currentIndex && kenBurnsPhase === 'reverse' && !isTransitioning,
            }"
            @load="handleImageLoad"
          />
        </div>
      </div>

      <!-- Navigation arrows (only show if multiple images) -->
      <template v-if="images.length > 1">
        <q-btn
          flat
          round
          dense
          icon="chevron_left"
          class="slideshow-nav slideshow-nav-left"
          @click="previousImage"
          aria-label="Previous image"
        />
        <q-btn
          flat
          round
          dense
          icon="chevron_right"
          class="slideshow-nav slideshow-nav-right"
          @click="nextImage"
          aria-label="Next image"
        />

        <!-- Dots indicator -->
        <div class="slideshow-dots">
          <q-btn
            v-for="(image, index) in images"
            :key="`dot-${index}`"
            flat
            round
            dense
            :class="['slideshow-dot', { active: index === currentIndex }]"
            @click="goToImage(index)"
            :aria-label="`Go to image ${index + 1}`"
          />
        </div>
      </template>
    </div>
    <div v-else class="product-image-placeholder">
      <q-icon name="image" size="64px" color="grey-4" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  imageUrl: {
    type: String,
    default: '',
  },
  imageUrls: {
    type: Array,
    default: () => [],
  },
  alt: {
    type: String,
    default: 'Product image',
  },
  autoRotate: {
    type: Boolean,
    default: true,
  },
  rotationInterval: {
    type: Number,
    default: 3000, // 3 seconds
  },
});

// Normalize images - support both single imageUrl and array of imageUrls
const images = computed(() => {
  if (props.imageUrls && props.imageUrls.length > 0) {
    return props.imageUrls;
  }
  if (props.imageUrl) {
    return [props.imageUrl];
  }
  return [];
});

// Computed track style for logging
const trackStyle = computed(() => {
  const width = images.value.length * 100;
  const translateX = -currentIndex.value * (100 / images.value.length);
  return {
    width: `${width}%`,
    transform: `translateX(${translateX}%)`,
    imageWidthPercent: `${100 / images.value.length}%`,
  };
});

// Log track style when it changes
watch(
  () => trackStyle.value,
  (newStyle) => {
    console.log('🎨 [Slideshow] Track style:', newStyle);
  },
  { deep: true }
);

const currentIndex = ref(0);
const isPaused = ref(false);
const isTransitioning = ref(false);

// Ken Burns effect state
const kenBurnsPhase = ref('forward'); // 'forward', 'reverse', or 'idle'
let kenBurnsTimeouts = [];

// Ken Burns timing (in milliseconds)
const KEN_BURNS_FORWARD_DURATION = 4000; // 4 seconds forward
const KEN_BURNS_REVERSE_DURATION = 4000; // 4 seconds reverse
const SLIDE_TRANSITION_DURATION = 800; // 0.8 seconds slide (matches CSS transition)

// Helper to track all timeouts
const addTimeout = (fn, ms) => {
  const id = setTimeout(fn, ms);
  kenBurnsTimeouts.push(id);
  return id;
};

const nextImage = () => {
  if (images.value.length > 1) {
    const oldIndex = currentIndex.value;
    const newIndex = (currentIndex.value + 1) % images.value.length;
    console.log('🔄 [Slideshow] nextImage:', {
      oldIndex,
      newIndex,
      totalImages: images.value.length,
      trackWidth: `${images.value.length * 100}%`,
      imageWidth: `${100 / images.value.length}%`,
      translateX: `-${newIndex * (100 / images.value.length)}%`,
      translateXPercentOfTrack: `${(100 / images.value.length)}%`,
    });
    isTransitioning.value = true;
    currentIndex.value = newIndex;
    // Reset Ken Burns phase when manually changing images
    kenBurnsPhase.value = 'forward';
    // Reset transition flag after animation completes
    setTimeout(() => {
      isTransitioning.value = false;
      console.log('✅ [Slideshow] Transition complete, isTransitioning:', false);
    }, SLIDE_TRANSITION_DURATION);
  }
};

const previousImage = () => {
  if (images.value.length > 1) {
    isTransitioning.value = true;
    currentIndex.value =
      currentIndex.value === 0
        ? images.value.length - 1
        : currentIndex.value - 1;
    // Reset Ken Burns phase when manually changing images
    kenBurnsPhase.value = 'forward';
    // Reset transition flag after animation completes
    setTimeout(() => {
      isTransitioning.value = false;
    }, SLIDE_TRANSITION_DURATION);
  }
};

const goToImage = (index) => {
  if (index >= 0 && index < images.value.length) {
    isTransitioning.value = true;
    currentIndex.value = index;
    // Reset Ken Burns phase when manually changing images
    kenBurnsPhase.value = 'forward';
    // Reset transition flag after animation completes
    setTimeout(() => {
      isTransitioning.value = false;
    }, SLIDE_TRANSITION_DURATION);
  }
};

const startKenBurnsCycle = () => {
  if (!props.autoRotate || images.value.length <= 1 || isPaused.value) {
    return;
  }

  console.log('🎬 [Slideshow] Starting Ken Burns cycle, currentIndex:', currentIndex.value);

  // Start with forward Ken Burns animation
  kenBurnsPhase.value = 'forward';
  console.log('▶️ [Slideshow] Ken Burns forward phase started');

  // After forward completes, go to reverse
  addTimeout(() => {
    if (isPaused.value) return;
    kenBurnsPhase.value = 'reverse';
    console.log('◀️ [Slideshow] Ken Burns reverse phase started');

    // After reverse completes, wait a tiny bit then slide to next image
    addTimeout(() => {
      if (isPaused.value) return;
        // Small delay to ensure reverse animation completes and transform resets
        addTimeout(() => {
          if (isPaused.value) return;
          console.log('🔄 [Slideshow] Starting slide transition from Ken Burns cycle');
          kenBurnsPhase.value = 'idle'; // Reset phase for slide transition
          isTransitioning.value = true;
          nextImage();

          // After slide transition, start cycle again
          addTimeout(() => {
            if (!isPaused.value) {
              isTransitioning.value = false;
              console.log('🔄 [Slideshow] Slide complete, restarting Ken Burns cycle');
              startKenBurnsCycle();
            }
          }, SLIDE_TRANSITION_DURATION);
        }, 50); // Small delay to ensure animation state is cleared
    }, KEN_BURNS_REVERSE_DURATION);
  }, KEN_BURNS_FORWARD_DURATION);
};

const stopKenBurnsCycle = () => {
  kenBurnsTimeouts.forEach(clearTimeout);
  kenBurnsTimeouts = [];
  kenBurnsPhase.value = 'idle';
};

const startSlideshow = () => {
  if (!props.autoRotate || images.value.length <= 1 || isPaused.value) {
    return;
  }
  stopSlideshow();
  startKenBurnsCycle();
};

const stopSlideshow = () => {
  stopKenBurnsCycle();
};

const pauseSlideshow = () => {
  isPaused.value = true;
  stopSlideshow();
};

const resumeSlideshow = () => {
  isPaused.value = false;
  if (props.autoRotate && images.value.length > 1) {
    startSlideshow();
  }
};

const handleImageLoad = () => {
  // Image loaded successfully - restart Ken Burns cycle if slideshow is active
  if (props.autoRotate && images.value.length > 1 && !isPaused.value) {
    // Only restart if we're in idle phase (image just loaded/changed)
    if (kenBurnsPhase.value === 'idle') {
      startKenBurnsCycle();
    }
  }
};

// Watch for changes in images array
watch(
  () => images.value,
  () => {
    console.log('📸 [Slideshow] Images changed:', {
      count: images.value.length,
      images: images.value,
    });
    currentIndex.value = 0;
    kenBurnsPhase.value = 'forward'; // Reset phase when images change
    if (props.autoRotate && images.value.length > 1) {
      startSlideshow();
    }
  },
  { immediate: true }
);

// Watch currentIndex to log changes
watch(
  () => currentIndex.value,
  (newIndex, oldIndex) => {
    const translateXPercent = newIndex * (100 / images.value.length);
    console.log('📍 [Slideshow] currentIndex changed:', {
      from: oldIndex,
      to: newIndex,
      totalImages: images.value.length,
      trackTransform: `translateX(-${translateXPercent}%)`,
      explanation: `Moving track by ${translateXPercent}% of its own width (${100 / images.value.length}% per image)`,
    });
  }
);

onMounted(() => {
  if (props.autoRotate && images.value.length > 1) {
    startSlideshow();
  }
});

onUnmounted(() => {
  stopSlideshow();
  stopKenBurnsCycle();
});
</script>

<style lang="scss" scoped>
.product-image-slideshow {
  width: 100%;
}

.product-image-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  min-height: 300px; // Prevent collapse during image loading
  margin-bottom: 16px;
  overflow: hidden;
  background: #f5f5f5;
  border-radius: 6px;
}

// Small variant for row layout (custom products)
.product-image-slideshow-small {
  .product-image-wrapper {
    width: 120px;
    min-width: 120px;
    aspect-ratio: 1 / 1;
    margin-bottom: 0;
  }

  .product-image-placeholder {
    width: 120px;
    min-width: 120px;
    aspect-ratio: 1 / 1;
    margin-bottom: 0;
  }

  .slideshow-nav {
    display: none; // Hide arrows on small version
  }

  .slideshow-dots {
    display: none; // Hide dots on small version
  }
}

// Avatar variant for PricingPage list
.product-image-slideshow-avatar {
  .product-image-wrapper {
    width: 80px;
    height: 80px;
    min-width: 80px;
    min-height: 80px;
    margin-bottom: 0;
    border-radius: 4px;
  }

  .product-image-placeholder {
    width: 80px;
    height: 80px;
    min-width: 80px;
    min-height: 80px;
    margin-bottom: 0;
    border-radius: 4px;
  }

  .slideshow-nav {
    display: none; // Hide arrows on avatar version
  }

  .slideshow-dots {
    display: none; // Hide dots on avatar version
  }
}

.slideshow-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px; // Match parent min-height
  overflow: hidden;
}

.slideshow-track {
  display: flex;
  height: 100%;
  min-height: 300px; // Ensure track maintains height
  transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  will-change: transform;
}

.product-image {
  height: 100%;
  min-height: 300px; // Reserve space before image loads
  flex: 0 0 auto;
  object-fit: cover;
  border-radius: 6px;
}

.product-image-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0 auto 16px;
  background: #f5f5f5;
  border-radius: 6px;
}

.slideshow-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  color: #30343F;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 1);
  }
}

.product-image-wrapper:hover .slideshow-nav {
  opacity: 1;
}

.slideshow-nav-left {
  left: 8px;
}

.slideshow-nav-right {
  right: 8px;
}

.slideshow-dots {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  z-index: 10;
}

.slideshow-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  min-height: 8px;
  padding: 0;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;

  &.active {
    background: rgba(255, 255, 255, 1);
  }
}

// Ken Burns animations
@keyframes kenBurnsForward {
  0% {
    transform: scale(1) translate(0, 0);
  }
  100% {
    transform: scale(1.2) translate(-5%, -5%);
  }
}

@keyframes kenBurnsReverse {
  0% {
    transform: scale(1.2) translate(-5%, -5%);
  }
  100% {
    transform: scale(1) translate(0, 0);
  }
}

.product-image {
  will-change: transform;
  position: relative;
  
  &.ken-burns-forward {
    animation: kenBurnsForward 4s ease-in-out forwards;
  }

  &.ken-burns-reverse {
    animation: kenBurnsReverse 4s ease-in-out forwards;
  }
}

// Ken Burns animations run on individual images, not during transition
</style>
