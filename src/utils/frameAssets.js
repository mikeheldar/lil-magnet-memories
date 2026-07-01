let cachedManifest = null;

export async function loadFrameManifest() {
  if (cachedManifest) return cachedManifest;
  try {
    const res = await fetch('/custom-border-frames/list.json', { cache: 'no-store' });
    if (!res.ok) {
      cachedManifest = { version: '', alwaysAvailable: [], frames: [] };
      return cachedManifest;
    }
    const list = await res.json();
    if (Array.isArray(list)) {
      cachedManifest = { version: '', alwaysAvailable: list, frames: list };
      return cachedManifest;
    }
    cachedManifest = {
      version: String(list.v ?? list.version ?? ''),
      alwaysAvailable: Array.isArray(list.alwaysAvailable) ? list.alwaysAvailable : [],
      frames: Array.isArray(list.frames) ? list.frames : Array.isArray(list.files) ? list.files : [],
    };
    return cachedManifest;
  } catch {
    cachedManifest = { version: '', alwaysAvailable: [], frames: [] };
    return cachedManifest;
  }
}

export function globalFrameAssetUrl(filename, version = '') {
  if (!filename) return '';
  const base = `/custom-border-frames/${encodeURIComponent(filename)}`;
  return version ? `${base}?v=${encodeURIComponent(version)}` : base;
}

export async function loadAlwaysAvailableFrames() {
  const manifest = await loadFrameManifest();
  return (manifest.alwaysAvailable || []).map((filename) => ({
    id: filename,
    name: filename.replace(/\.[^.]+$/, ''),
    source: 'global',
    url: globalFrameAssetUrl(filename, manifest.version),
    fileName: filename,
  }));
}

export function mapEventFrames(eventFrames = []) {
  return (Array.isArray(eventFrames) ? eventFrames : []).map((frame) => ({
    id: frame.id || frame.fileName,
    name: frame.name || frame.fileName || 'Event frame',
    source: 'event',
    url: frame.url || '',
    fileName: frame.fileName || '',
  }));
}

/** Legacy resolver — delegates to frame catalog when available. */
export async function resolveUploadFrameOptions(checkedInEvent = null) {
  const {
    resolveCustomerFrameOptions,
    getEventFramesFromLibrary,
    getPublicFramesForDate,
  } = await import('../services/frameCatalogService.js');

  if (checkedInEvent && typeof checkedInEvent === 'object' && !Array.isArray(checkedInEvent)) {
    return resolveCustomerFrameOptions({ checkedInEvent });
  }
  if (Array.isArray(checkedInEvent) && checkedInEvent.length > 0) {
    return getEventFramesFromLibrary({ frames: checkedInEvent });
  }
  return getPublicFramesForDate(new Date());
}
