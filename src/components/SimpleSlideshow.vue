<template>
  <div class="simple-slideshow">
    <div
      v-if="images.length > 0"
      class="slideshow-wrapper"
      @mouseenter="pauseSlideshow"
      @mouseleave="resumeSlideshow"
    >
      <!-- Single image with fade transition -->
      <transition name="fade" mode="out-in">
        <img
          :key="currentIndex"
          :src="images[currentIndex]"
          :alt="alt"
          class="slideshow-image"
          @load="handleImageLoad"
        />
      </transition>

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
    <div v-else class="slideshow-placeholder">
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
    default: 5000, // 5 seconds
  },
});

// Normalize images
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
const isPaused = ref(false);
let slideshowInterval = null;

const nextImage = () => {
  if (images.value.length > 1) {
    currentIndex.value = (currentIndex.value + 1) % images.value.length;
  }
};

const previousImage = () => {
  if (images.value.length > 1) {
    currentIndex.value =
      currentIndex.value === 0
        ? images.value.length - 1
        : currentIndex.value - 1;
  }
};

const goToImage = (index) => {
  if (index >= 0 && index < images.value.length) {
    currentIndex.value = index;
  }
};

const startSlideshow = () => {
  if (!props.autoRotate || images.value.length <= 1 || isPaused.value) {
    return;
  }
  stopSlideshow();
  slideshowInterval = setInterval(() => {
    nextImage();
  }, props.rotationInterval);
};

const stopSlideshow = () => {
  if (slideshowInterval) {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
  }
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
  // Image loaded successfully
};

// Watch for changes in images array
watch(
  () => images.value,
  () => {
    currentIndex.value = 0;
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
});
</script>

<style lang="scss" scoped>
.simple-slideshow {
  width: 100%;
}

.slideshow-wrapper {
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

.slideshow-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.slideshow-placeholder {
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

.slideshow-wrapper:hover .slideshow-nav {
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

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
