export const FONT_OPTIONS = [
  { label: 'Poppins', value: "'Poppins', sans-serif" },
  { label: 'Montserrat', value: "'Montserrat', sans-serif" },
  { label: 'Bebas Neue', value: "'Bebas Neue', sans-serif" },
  { label: 'Anton', value: "'Anton', sans-serif" },
  { label: 'Playfair Display', value: "'Playfair Display', serif" },
  { label: 'Cormorant', value: "'Cormorant Garamond', serif" },
  { label: 'Fredoka', value: "'Fredoka', sans-serif" },
  { label: 'Baloo', value: "'Baloo 2', cursive" },
  { label: 'Caveat', value: "'Caveat', cursive" },
  { label: 'Dancing Script', value: "'Dancing Script', cursive" },
  { label: 'Pacifico', value: "'Pacifico', cursive" },
  { label: 'Permanent Marker', value: "'Permanent Marker', cursive" },
  { label: 'Satisfy', value: "'Satisfy', cursive" },
  { label: 'Typewriter', value: "'Special Elite', monospace" },
];

// Google Fonts load lazily (display=swap): a family only downloads once text uses
// it, so the font dropdown would show fallback faces on first open. Preload them.
export function preloadFontOptions() {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return;
  for (const opt of FONT_OPTIONS) {
    document.fonts.load(`16px ${opt.value}`).catch(() => null);
  }
}

export function createLayerId(prefix = 'layer') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createTextLayer(partial = {}) {
  return {
    id: createLayerId('text'),
    type: 'text',
    text: partial.text || 'Text',
    color: partial.color || '#ffffff',
    font: partial.font || "'Poppins', sans-serif",
    x: partial.x ?? 0.5,
    y: partial.y ?? 0.12,
    scale: partial.scale ?? 1,
    rotation: partial.rotation ?? 0,
  };
}

export function createImageLayer(partial = {}) {
  return {
    id: partial.id || createLayerId('image'),
    type: 'image',
    url: partial.url || '',
    file: partial.file || null,
    storagePath: partial.storagePath || null,
    x: partial.x ?? 0.5,
    y: partial.y ?? 0.5,
    scale: partial.scale ?? 0.25,
    rotation: partial.rotation ?? 0,
  };
}

export function cloneLayers(layers = []) {
  return layers.map(({ file, ...layer }) => ({ ...layer }));
}

export function layerLabel(layer) {
  if (!layer) return 'Layer';
  if (layer.type === 'text') {
    const text = String(layer.text || '').trim();
    return text ? `Text: ${text.slice(0, 24)}` : 'Text layer';
  }
  return 'Image layer';
}

export function layerZIndex(index, total) {
  return 40 + (total - index);
}

/** Index 0 = top/front. Returns layers from back to front for painting. */
export function layersForPaintOrder(layers = []) {
  return [...layers].reverse();
}

export function layersFromLegacyRecipe(recipe = {}) {
  const overlays = (recipe.overlayLayers || []).map((layer) =>
    createImageLayer({
      id: layer.id,
      url: layer.url,
      storagePath: layer.storagePath,
      x: layer.x,
      y: layer.y,
      scale: layer.scale,
      rotation: layer.rotation,
    })
  );
  const texts = (recipe.textLayers || []).map((layer) =>
    createTextLayer({
      id: layer.id || createLayerId('text'),
      text: layer.text,
      color: layer.color,
      font: layer.font,
      x: layer.x,
      y: layer.y,
      scale: layer.scale,
      rotation: layer.rotation ?? 0,
    })
  );
  return [...overlays, ...texts];
}

export function layersToLegacyRecipe(layers = []) {
  const overlayLayers = layers
    .filter((layer) => layer.type === 'image')
    .map(({ id, storagePath, x, y, scale, rotation }) => ({
      id,
      storagePath,
      x,
      y,
      scale,
      rotation,
    }));
  const textLayers = layers
    .filter((layer) => layer.type === 'text')
    .map(({ text, color, font, x, y, scale, rotation }) => ({
      text,
      color,
      font,
      x,
      y,
      scale,
      rotation,
    }));
  return { overlayLayers, textLayers };
}

export function serializeLayersForRecipe(layers = []) {
  return layers.map((layer) => {
    const base = {
      id: layer.id,
      type: layer.type,
      x: layer.x ?? 0.5,
      y: layer.y ?? 0.5,
      scale: layer.scale ?? 1,
      rotation: layer.rotation ?? 0,
    };
    if (layer.type === 'text') {
      return {
        ...base,
        text: layer.text || '',
        color: layer.color || '#ffffff',
        font: layer.font || 'sans-serif',
      };
    }
    return {
      ...base,
      storagePath: layer.storagePath || null,
    };
  });
}
