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

export const DEFAULT_FRAME_CUTOUT = {
  x: 0.15,
  y: 0.15,
  width: 0.7,
  height: 0.7,
};

/**
 * Bake a square frame overlay PNG with transparent center cutout and optional text.
 */
async function drawImageLayer(ctx, layer, outputSize) {
  const src = layer?.url || layer?.previewUrl;
  if (!src) return;
  const overlayImg = await loadImage(src);
  const drawW = (layer.scale ?? 0.25) * outputSize;
  const aspect = overlayImg.naturalHeight / overlayImg.naturalWidth;
  const drawH = drawW * aspect;
  const centerX = (layer.x ?? 0.5) * outputSize;
  const centerY = (layer.y ?? 0.5) * outputSize;
  ctx.save();
  ctx.translate(centerX, centerY);
  if (layer.rotation) {
    ctx.rotate((layer.rotation * Math.PI) / 180);
  }
  ctx.drawImage(overlayImg, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawTextLayer(ctx, layer, outputSize) {
  if (!layer?.text) return;
  const fontSize = Math.max(12, (layer.scale ?? 1) * outputSize * 0.06);
  ctx.save();
  ctx.fillStyle = layer.color || '#ffffff';
  ctx.font = `bold ${fontSize}px ${layer.font || 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textX = (layer.x ?? 0.5) * outputSize;
  const textY = (layer.y ?? 0.5) * outputSize;
  if (layer.rotation) {
    ctx.translate(textX, textY);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.fillText(layer.text, 0, 0);
  } else {
    ctx.fillText(layer.text, textX, textY);
  }
  ctx.restore();
}

async function drawUnifiedLayers(ctx, layers, outputSize) {
  const paintOrder = [...(layers || [])].reverse();
  for (const layer of paintOrder) {
    try {
      if (layer.type === 'image') {
        await drawImageLayer(ctx, layer, outputSize);
      } else if (layer.type === 'text') {
        drawTextLayer(ctx, layer, outputSize);
      }
    } catch (error) {
      console.warn('Failed to draw frame layer:', error);
    }
  }
}

/** @deprecated Use drawUnifiedLayers */
async function drawOverlayLayers(ctx, overlayLayers, outputSize) {
  for (const layer of overlayLayers || []) {
    try {
      await drawImageLayer(ctx, layer, outputSize);
    } catch (error) {
      console.warn('Failed to draw overlay layer:', error);
    }
  }
}

export async function bakeFrameOverlay({
  source,
  stencil = { scale: 1, x: 0, y: 0 },
  cutout = DEFAULT_FRAME_CUTOUT,
  layers = null,
  overlayLayers = [],
  textLayers = [],
  viewportSize = 320,
  outputSize = OUTPUT_SIZE,
}) {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');

  const containerSize = viewportSize;
  const { width: displayedWidth, height: displayedHeight } = getContainedDisplaySize(
    img.naturalWidth,
    img.naturalHeight,
    containerSize
  );

  const scaleFactor = outputSize / containerSize;
  const userScale = stencil?.scale ?? 1;
  const drawX = (stencil?.x ?? 0) * scaleFactor;
  const drawY = (stencil?.y ?? 0) * scaleFactor;
  const drawW = displayedWidth * userScale * scaleFactor;
  const drawH = displayedHeight * userScale * scaleFactor;

  ctx.save();
  ctx.translate(outputSize / 2 + drawX, outputSize / 2 + drawY);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  if (Array.isArray(layers) && layers.length > 0) {
    await drawUnifiedLayers(ctx, layers, outputSize);
  } else {
    await drawOverlayLayers(ctx, overlayLayers, outputSize);
    for (const layer of textLayers) {
      drawTextLayer(ctx, layer, outputSize);
    }
  }

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.fillRect(
    (cutout?.x ?? 0) * outputSize,
    (cutout?.y ?? 0) * outputSize,
    (cutout?.width ?? 0.7) * outputSize,
    (cutout?.height ?? 0.7) * outputSize
  );
  ctx.restore();

  return finishFrameCanvas(canvas);
}

function finishFrameCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error('Frame export failed'))),
      'image/png'
    );
  });
}

export async function bakeFrameOverlayFile(options) {
  const blob = await bakeFrameOverlay(options);
  const baseName = options.fileName || 'frame.png';
  const safeName = baseName.replace(/\.[^.]+$/, '') + '.png';
  return new File([blob], safeName, { type: 'image/png' });
}
