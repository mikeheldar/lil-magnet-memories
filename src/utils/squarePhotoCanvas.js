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

function calculateNormalScale(imgWidth, imgHeight, containerSize) {
  const scaleX = containerSize / imgWidth;
  const scaleY = containerSize / imgHeight;
  return Math.min(scaleX, scaleY);
}

function calculateCoverScale(imgWidth, imgHeight, containerSize) {
  const scaleX = containerSize / imgWidth;
  const scaleY = containerSize / imgHeight;
  return Math.max(scaleX, scaleY);
}

export function getInitialTransformForImage(naturalWidth, naturalHeight, viewportSize) {
  return {
    scale: calculateNormalScale(naturalWidth, naturalHeight, viewportSize),
    x: 0,
    y: 0,
  };
}

export function getCoverTransformForImage(naturalWidth, naturalHeight, viewportSize) {
  return {
    scale: calculateCoverScale(naturalWidth, naturalHeight, viewportSize),
    x: 0,
    y: 0,
  };
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

  const scaleFactor = outputSize / viewportSize;
  const drawScale = (transform?.scale ?? 1) * scaleFactor;
  const drawX = (transform?.x ?? 0) * scaleFactor;
  const drawY = (transform?.y ?? 0) * scaleFactor;

  ctx.save();
  ctx.translate(outputSize / 2 + drawX, outputSize / 2 + drawY);
  ctx.scale(drawScale, drawScale);
  ctx.drawImage(
    img,
    -img.naturalWidth / 2,
    -img.naturalHeight / 2,
    img.naturalWidth,
    img.naturalHeight
  );
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
