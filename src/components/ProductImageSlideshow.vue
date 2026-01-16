<template>
  <div class="product-image-slideshow">
    <div
      v-if="images.length > 0"
      class="product-image-wrapper"
      @mouseenter="pauseSlideshow"
      @mouseleave="resumeSlideshow"
    >
      <!-- Image container with transition -->
      <transition-group
        name="ken-burns-slide"
        tag="div"
        class="slideshow-container"
      >
        <img
          v-for="(image, index) in images"
          v-show="index === currentIndex"
          :key="image"
          :src="image"
          :alt="alt"
          class="product-image"
          :class="{
            'ken-burns-forward': index === currentIndex && kenBurnsPhase === 'forward',
            'ken-burns-reverse': index === currentIndex && kenBurnsPhase === 'reverse',
          }"
          @load="handleImageLoad"
        />
      </transition-group>

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

const currentIndex = ref(0);
let slideshowInterval = null;
const isPaused = ref(false);

// Ken Burns effect state
const kenBurnsPhase = ref('forward'); // 'forward', 'reverse', or 'idle'
let kenBurnsTimeout = null;

// Ken Burns timing (in milliseconds)
const KEN_BURNS_FORWARD_DURATION = 4000; // 4 seconds forward
const KEN_BURNS_REVERSE_DURATION = 4000; // 4 seconds reverse
const SLIDE_TRANSITION_DURATION = 1500; // 1.5 seconds slide (slow)

const nextImage = () => {
  if (images.value.length > 1) {
    currentIndex.value = (currentIndex.value + 1) % images.value.length;
    // Reset Ken Burns phase when manually changing images
    kenBurnsPhase.value = 'forward';
  }
};

const previousImage = () => {
  if (images.value.length > 1) {
    currentIndex.value =
      currentIndex.value === 0
        ? images.value.length - 1
        : currentIndex.value - 1;
    // Reset Ken Burns phase when manually changing images
    kenBurnsPhase.value = 'forward';
  }
};

const goToImage = (index) => {
  if (index >= 0 && index < images.value.length) {
    currentIndex.value = index;
    // Reset Ken Burns phase when manually changing images
    kenBurnsPhase.value = 'forward';
  }
};

const startKenBurnsCycle = () => {
  if (!props.autoRotate || images.value.length <= 1 || isPaused.value) {
    return;
  }

  // Start with forward Ken Burns animation
  kenBurnsPhase.value = 'forward';

  // After forward completes, go to reverse
  kenBurnsTimeout = setTimeout(() => {
    if (isPaused.value) return;
    kenBurnsPhase.value = 'reverse';

    // After reverse completes, slide to next image
    kenBurnsTimeout = setTimeout(() => {
      if (isPaused.value) return;
      kenBurnsPhase.value = 'idle'; // Reset phase for slide transition
      nextImage();

      // After slide transition, start cycle again
      kenBurnsTimeout = setTimeout(() => {
        if (!isPaused.value) {
          startKenBurnsCycle();
        }
      }, SLIDE_TRANSITION_DURATION);
    }, KEN_BURNS_REVERSE_DURATION);
  }, KEN_BURNS_FORWARD_DURATION);
};

const stopKenBurnsCycle = () => {
  if (kenBurnsTimeout) {
    clearTimeout(kenBurnsTimeout);
    kenBurnsTimeout = null;
  }
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
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
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
    currentIndex.value = 0;
    kenBurnsPhase.value = 'forward'; // Reset phase when images change
    if (props.autoRotate && images.value.length > 1) {
      startSlideshow();
    }
  },
  { immediate: true }
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
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
  position: absolute;
  top: 0;
  left: 0;
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
  &.ken-burns-forward {
    animation: kenBurnsForward 4s ease-in-out forwards;
  }

  &.ken-burns-reverse {
    animation: kenBurnsReverse 4s ease-in-out forwards;
  }
}

// Ken Burns slide transition - horizontal slide
.ken-burns-slide-enter-active,
.ken-burns-slide-leave-active {
  transition: transform 1.5s ease-in-out;
}

.ken-burns-slide-enter-from {
  transform: translateX(100%);
}

.ken-burns-slide-enter-to {
  transform: translateX(0);
}

.ken-burns-slide-leave-from {
  transform: translateX(0);
}

.ken-burns-slide-leave-to {
  transform: translateX(-100%);
}
</style>
