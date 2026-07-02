import { firebaseService } from './firebaseService.js';
import {
  loadAlwaysAvailableFrames,
  mapEventFrames,
  loadFrameManifest,
  globalFrameAssetUrl,
} from '../utils/frameAssets.js';

let cachedFrames = null;
let cacheTimestamp = 0;
let lastLoadUsedStaticFallback = false;
const CACHE_TTL_MS = 60_000;

export function libraryLoadUsedStaticFallback() {
  return lastLoadUsedStaticFallback;
}

export function mapFrameDocToOption(frame) {
  if (!frame?.id || !frame?.imageUrl) return null;
  return {
    id: frame.id,
    name: frame.name || frame.id,
    source: 'library',
    url: frame.imageUrl,
    fileName: frame.storagePath?.split('/').pop() || '',
    sortOrder: Number(frame.sortOrder) || 0,
    isPublic: frame.isPublic === true,
    tags: Array.isArray(frame.tags) ? frame.tags : [],
  };
}

export function invalidateFrameCache() {
  cachedFrames = null;
  cacheTimestamp = 0;
  lastLoadUsedStaticFallback = false;
}

function isPermissionError(error) {
  const code = error?.code || '';
  const message = String(error?.message || '');
  return (
    code === 'permission-denied' ||
    message.includes('Missing or insufficient permissions')
  );
}

export async function getStaticFallbackFrameDocs() {
  const manifest = await loadFrameManifest();
  const filenames = new Set([
    ...(manifest.alwaysAvailable || []),
    ...(manifest.frames || []),
  ]);
  let sortOrder = 0;
  return [...filenames].map((filename) => {
    const id = `static_${filename.replace(/\.[^.]+$/, '')}`;
    const imageUrl = globalFrameAssetUrl(filename, manifest.version);
    return {
      id,
      name: filename.replace(/\.[^.]+$/, ''),
      imageUrl,
      thumbnailUrl: imageUrl,
      storagePath: '',
      isPublic: (manifest.alwaysAvailable || []).includes(filename),
      sortOrder: sortOrder++,
      tags: ['static'],
      sourceType: 'upload',
    };
  });
}

export async function getLibraryFrames(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedFrames && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFrames;
  }
  try {
    lastLoadUsedStaticFallback = false;
    cachedFrames = await firebaseService.getFrames();
  } catch (error) {
    console.warn('Failed to load library frames:', error);
    if (isPermissionError(error)) {
      cachedFrames = await getStaticFallbackFrameDocs();
      lastLoadUsedStaticFallback = true;
    } else {
      cachedFrames = [];
    }
  }
  cacheTimestamp = now;
  return cachedFrames;
}

function parseScheduleDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isDateInSchedule(date, schedule) {
  const start = parseScheduleDate(schedule.startDate);
  const end = parseScheduleDate(schedule.endDate);
  if (!start || !end) return false;
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const schedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const schedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return dayStart >= schedStart && dayStart <= schedEnd;
}

export async function getFrameCatalogConfig() {
  try {
    return await firebaseService.getFrameCatalogConfig();
  } catch (error) {
    console.warn('Failed to load frame catalog config:', error);
    return { featuredSchedules: [], defaultPublicFrameIds: [] };
  }
}

export function sortFramesByFeatured(frames, featuredSchedules = [], date = new Date()) {
  const frameMap = new Map(frames.map((frame) => [frame.id, frame]));
  const activeSchedules = (featuredSchedules || [])
    .filter((schedule) => isDateInSchedule(date, schedule))
    .sort((a, b) => (Number(b.priority) || 0) - (Number(a.priority) || 0));

  const ordered = [];
  const seen = new Set();

  for (const schedule of activeSchedules) {
    const frame = frameMap.get(schedule.frameId);
    if (frame && !seen.has(frame.id)) {
      ordered.push(frame);
      seen.add(frame.id);
    }
  }

  const remaining = [...frames]
    .filter((frame) => !seen.has(frame.id))
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));

  return [...ordered, ...remaining];
}

export async function getPublicFramesForDate(date = new Date()) {
  const [libraryFrames, config] = await Promise.all([
    getLibraryFrames(),
    getFrameCatalogConfig(),
  ]);

  const publicFrames = libraryFrames.filter((frame) => frame.isPublic === true);
  if (publicFrames.length > 0) {
    const sorted = sortFramesByFeatured(publicFrames, config.featuredSchedules, date);
    return sorted.map(mapFrameDocToOption).filter(Boolean);
  }

  return loadAlwaysAvailableFrames();
}

export async function getEventFramesFromLibrary(event) {
  if (!event) return [];

  const libraryFrames = await getLibraryFrames();
  const frameMap = new Map(libraryFrames.map((frame) => [frame.id, frame]));

  const selectedIds = Array.isArray(event.selectedFrameIds)
    ? event.selectedFrameIds
    : [];

  if (selectedIds.length > 0) {
    const sortOrder = Array.isArray(event.frameSortOrder) ? event.frameSortOrder : selectedIds;
    const ordered = [];
    const seen = new Set();
    for (const frameId of sortOrder) {
      const frame = frameMap.get(frameId);
      if (frame && selectedIds.includes(frameId) && !seen.has(frameId)) {
        ordered.push(frame);
        seen.add(frameId);
      }
    }
    for (const frameId of selectedIds) {
      if (!seen.has(frameId) && frameMap.has(frameId)) {
        ordered.push(frameMap.get(frameId));
      }
    }
    return ordered.map(mapFrameDocToOption).filter(Boolean);
  }

  if (Array.isArray(event.frames) && event.frames.length > 0) {
    return mapEventFrames(event.frames);
  }

  return [];
}

export async function resolveCustomerFrameOptions({ checkedInEvent } = {}) {
  if (checkedInEvent) {
    const eventFrames = await getEventFramesFromLibrary(checkedInEvent);
    if (eventFrames.length > 0) {
      return eventFrames;
    }
    return [];
  }

  return getPublicFramesForDate(new Date());
}

export async function getPrintTemplateFrames() {
  const libraryFrames = await getLibraryFrames();
  if (libraryFrames.length > 0) {
    const publicFrames = libraryFrames.filter((frame) => frame.isPublic === true);
    const sorted = [...(publicFrames.length ? publicFrames : libraryFrames)].sort(
      (a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
    );
    return sorted.map(mapFrameDocToOption).filter(Boolean);
  }

  const manifest = await loadFrameManifest();
  return (manifest.frames || []).map((filename) => ({
    id: filename,
    name: filename.replace(/\.[^.]+$/, ''),
    source: 'global',
    url: globalFrameAssetUrl(filename, manifest.version),
    fileName: filename,
  }));
}

export async function migrateLegacyEventFrames() {
  const events = await firebaseService.getMarketEvents();
  let migratedCount = 0;

  for (const event of events) {
    const embeddedFrames = Array.isArray(event.frames) ? event.frames : [];
    const hasSelection = Array.isArray(event.selectedFrameIds) && event.selectedFrameIds.length > 0;
    if (!embeddedFrames.length || hasSelection) continue;

    const selectedFrameIds = [];
    for (const embedded of embeddedFrames) {
      if (!embedded?.url) continue;
      try {
        const response = await fetch(embedded.url);
        const blob = await response.blob();
        const file = new File(
          [blob],
          embedded.fileName || `${embedded.name || 'frame'}.png`,
          { type: blob.type || 'image/png' }
        );
        const created = await firebaseService.uploadFrame(
          file,
          embedded.name || embedded.fileName || 'Event frame',
          { isPublic: false, sourceType: 'upload' }
        );
        selectedFrameIds.push(created.id);
        migratedCount += 1;
      } catch (error) {
        console.warn('Failed to migrate embedded frame:', embedded.id, error);
      }
    }

    if (selectedFrameIds.length > 0) {
      await firebaseService.updateMarketEvent(event.id, {
        selectedFrameIds,
        frameSortOrder: selectedFrameIds,
      });
    }
  }

  invalidateFrameCache();
  return migratedCount;
}

export async function ensureStaticManifestFrames() {
  const manifest = await loadFrameManifest();
  const filenames = new Set([
    ...(manifest.alwaysAvailable || []),
    ...(manifest.frames || []),
  ]);

  const existing = await getLibraryFrames(true);
  const existingIds = new Set(existing.map((frame) => frame.id));
  let sortOrder =
    existing.reduce((max, frame) => Math.max(max, Number(frame.sortOrder) || 0), -1) + 1;

  let seeded = 0;
  for (const filename of filenames) {
    const frameId = `static_${filename.replace(/\.[^.]+$/, '')}`;
    if (existingIds.has(frameId)) continue;

    const name = filename.replace(/\.[^.]+$/, '');
    const staticUrl = globalFrameAssetUrl(filename, manifest.version);
    const isPublic = (manifest.alwaysAvailable || []).includes(filename);

    let imageUrl = staticUrl;
    let storagePath = '';
    let thumbnailUrl = staticUrl;

    try {
      const response = await fetch(staticUrl);
      if (response.ok) {
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/png' });
        const uploaded = await firebaseService.uploadFrameFileAtPath(
          `frames/${frameId}/frame.png`,
          file
        );
        imageUrl = uploaded.url;
        storagePath = uploaded.storagePath;
        thumbnailUrl = uploaded.url;
      }
    } catch (error) {
      console.warn('Using static URL for frame (storage upload skipped):', filename, error);
    }

    try {
      await firebaseService.createFrameRecord({
        id: frameId,
        name,
        imageUrl,
        storagePath,
        thumbnailUrl,
        isPublic,
        sortOrder: sortOrder++,
        tags: ['static'],
        sourceType: 'upload',
        builderRecipe: null,
        createdBy: null,
      });
      seeded += 1;
    } catch (error) {
      console.warn('Failed to seed static frame:', filename, error);
    }
  }

  invalidateFrameCache();
  return seeded;
}

/** @deprecated Use ensureStaticManifestFrames */
export async function seedStaticManifestFrames() {
  return ensureStaticManifestFrames();
}
