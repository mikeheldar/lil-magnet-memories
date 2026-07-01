import { ref, computed, onBeforeUnmount } from 'vue';
import {
  getInitialTransformForImage,
  getFillSquareTransform,
} from '../utils/squarePhotoCanvas.js';

export function useSquarePhotoEditor(viewportSizeRef) {
  const transform = ref({ scale: 1, x: 0, y: 0 });
  const naturalSize = ref({ width: 0, height: 0 });
  const isDragging = ref(false);
  const dragStart = ref({ x: 0, y: 0, transform: { scale: 1, x: 0, y: 0 } });
  const hasMoved = ref(false);
  const pinchState = ref(null);

  const getViewportSize = () => {
    const size = viewportSizeRef?.value ?? viewportSizeRef ?? 320;
    return Number(size) || 320;
  };

  const getMaxTranslate = (scale) => {
    const containerSize = getViewportSize();
    const baseMovement = 100;
    const scaleBasedMovement = (containerSize / 2) * (scale - 1);
    return baseMovement + Math.max(0, scaleBasedMovement);
  };

  const clampTransform = (next) => {
    const maxTranslate = getMaxTranslate(next.scale);
    return {
      scale: Math.max(0.5, Math.min(4, next.scale)),
      x: Math.max(-maxTranslate, Math.min(maxTranslate, next.x)),
      y: Math.max(-maxTranslate, Math.min(maxTranslate, next.y)),
    };
  };

  const setTransform = (next) => {
    transform.value = clampTransform(next);
  };

  const resetTransform = () => {
    setTransform(getInitialTransformForImage());
  };

  const fillSquare = () => {
    const { width, height } = naturalSize.value;
    if (width > 0 && height > 0) {
      setTransform(getFillSquareTransform(width, height, getViewportSize()));
    }
  };

  const onImageLoad = (event) => {
    const img = event.target;
    naturalSize.value = {
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
    };
    if (naturalSize.value.width > 0 && naturalSize.value.height > 0) {
      setTransform(getInitialTransformForImage());
    }
  };

  const loadTransform = (saved) => {
    if (!saved) {
      resetTransform();
      return;
    }
    setTransform({
      scale: saved.scale ?? 1,
      x: saved.x ?? 0,
      y: saved.y ?? 0,
    });
  };

  const imageStyle = computed(() => ({
    transform: `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`,
    transformOrigin: 'center center',
    transition: isDragging.value || pinchState.value ? 'none' : 'transform 0.1s ease-out',
  }));

  const handleWheel = (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -0.1 : 0.1;
    const current = transform.value;
    const newScale = current.scale + delta;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    const scaleDiff = newScale - current.scale;
    setTransform({
      scale: newScale,
      x: current.x - x * scaleDiff * 0.3,
      y: current.y - y * scaleDiff * 0.3,
    });
  };

  const startDrag = (event) => {
    if (event.type === 'mousedown' && event.button !== 0) return;
    if (event.type === 'touchstart' && event.touches.length !== 1) return;

    isDragging.value = true;
    hasMoved.value = false;
    const clientX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY ?? 0;
    dragStart.value = {
      x: clientX,
      y: clientY,
      transform: { ...transform.value },
    };

    if (event.type === 'mousedown') {
      document.addEventListener('mousemove', onDocumentMouseMove);
      document.addEventListener('mouseup', endDrag);
      event.preventDefault();
    } else if (event.type === 'touchstart') {
      document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
      document.addEventListener('touchend', endDrag);
    }
  };

  const onDocumentMouseMove = (event) => {
    if (!isDragging.value) return;
    applyDrag(event.clientX, event.clientY);
  };

  const onDocumentTouchMove = (event) => {
    if (pinchState.value && event.touches.length === 2) {
      handlePinchMove(event);
      event.preventDefault();
      return;
    }
    if (isDragging.value && event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - dragStart.value.x;
      const deltaY = touch.clientY - dragStart.value.y;
      if (Math.sqrt(deltaX * deltaX + deltaY * deltaY) > 5) {
        hasMoved.value = true;
      }
      if (hasMoved.value) {
        applyDrag(touch.clientX, touch.clientY);
        event.preventDefault();
      }
    }
  };

  const applyDrag = (clientX, clientY) => {
    const deltaX = clientX - dragStart.value.x;
    const deltaY = clientY - dragStart.value.y;
    setTransform({
      scale: dragStart.value.transform.scale,
      x: dragStart.value.transform.x + deltaX,
      y: dragStart.value.transform.y + deltaY,
    });
  };

  const endDrag = () => {
    isDragging.value = false;
    hasMoved.value = false;
    pinchState.value = null;
    document.removeEventListener('mousemove', onDocumentMouseMove);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDocumentTouchMove);
    document.removeEventListener('touchend', endDrag);
  };

  const touchDistance = (t1, t2) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const startPinch = (event) => {
    if (event.touches.length !== 2) return;
    event.preventDefault();
    isDragging.value = false;
    pinchState.value = {
      startDistance: touchDistance(event.touches[0], event.touches[1]),
      startScale: transform.value.scale,
      startTransform: { ...transform.value },
    };
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: false });
    document.addEventListener('touchend', endDrag);
  };

  const handlePinchMove = (event) => {
    if (!pinchState.value || event.touches.length !== 2) return;
    const distance = touchDistance(event.touches[0], event.touches[1]);
    const ratio = distance / (pinchState.value.startDistance || 1);
    setTransform({
      ...pinchState.value.startTransform,
      scale: pinchState.value.startScale * ratio,
    });
  };

  onBeforeUnmount(() => {
    endDrag();
  });

  return {
    transform,
    naturalSize,
    imageStyle,
    onImageLoad,
    loadTransform,
    resetTransform,
    fillSquare,
    handleWheel,
    startDrag,
    startPinch,
    endDrag,
    setTransform,
  };
}
