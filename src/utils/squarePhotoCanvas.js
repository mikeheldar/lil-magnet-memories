const OUTPUT_SIZE = 1200;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getContainedDisplaySize(imgWidth, imgHeight, containerSize) {
  const aspectRatio = imgWidth / imgHeight;
  if (aspectRatio > 1) {
    return {
      width: containerSize,
      height: containerSize / aspectRatio,
    };
  }
  return {
    width: containerSize * aspectRatio,
    height: containerSize,
  };
}

export function getInitialTransformForImage() {
  return {
    scale: 1,
    x: 0,
    y: 0,
  };
}

/** Match Print Template autoZoom: scale until image touches all four inner edges. */
export function getFillSquareTransform(naturalWidth, naturalHeight, viewportSize) {
  const containerSize = viewportSize;
  const { width: displayedWidth, height: displayedHeight } = getContainedDisplaySize(
    naturalWidth,
    naturalHeight,
    containerSize
  );
  const scaleX = containerSize / displayedWidth;
  const scaleY = containerSize / displayedHeight;

  return {
    scale: Math.max(scaleX, scaleY),
    x: 0,
    y: 0,
  };
}

export function getCoverTransformForImage(naturalWidth, naturalHeight, viewportSize) {
  return getFillSquareTransform(naturalWidth, naturalHeight, viewportSize);
}

/**
 * Bake a square magnet preview: white background, transformed photo, optional frame overlay.
 */
export async function bakeSquarePhoto({
  source,
  transform,
  viewportSize,
  frameUrl = null,
  outputSize = OUTPUT_SIZE,
  mimeType = 'image/jpeg',
  quality = 0.92,
}) {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outputSize, outputSize);

  const containerSize = viewportSize;
  const { width: displayedWidth, height: displayedHeight } = getContainedDisplaySize(
    img.naturalWidth,
    img.naturalHeight,
    containerSize
  );

  const scaleFactor = outputSize / containerSize;
  const userScale = transform?.scale ?? 1;
  const drawX = (transform?.x ?? 0) * scaleFactor;
  const drawY = (transform?.y ?? 0) * scaleFactor;
  const drawW = displayedWidth * userScale * scaleFactor;
  const drawH = displayedHeight * userScale * scaleFactor;

  ctx.save();
  ctx.translate(outputSize / 2 + drawX, outputSize / 2 + drawY);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  if (frameUrl) {
    try {
      const frameImg = await loadImage(frameUrl);
      ctx.drawImage(frameImg, 0, 0, outputSize, outputSize);
    } catch (error) {
      console.warn('Failed to draw frame overlay:', error);
    }
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Canvas export failed'))),
      mimeType,
      quality
    );
  });

  return blob;
}

export async function bakeSquarePhotoFile(options) {
  const blob = await bakeSquarePhoto(options);
  const baseName = options.fileName || 'magnet-photo.jpg';
  const safeName = baseName.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], safeName, { type: blob.type || 'image/jpeg' });
}

export async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
