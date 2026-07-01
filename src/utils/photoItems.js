export function createDefaultEditState() {
  return {
    scale: 1,
    x: 0,
    y: 0,
    frameId: null,
    frameSource: null,
    frameUrl: null,
    isEdited: false,
  };
}

export function createPhotoItem(file) {
  const previewUrl = URL.createObjectURL(file);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    originalFile: file,
    file,
    previewUrl,
    quantity: 1,
    edit: createDefaultEditState(),
  };
}

export function getPhotoFileKey(file) {
  if (!file) return '';
  return `${file.name}|${file.size}|${file.lastModified}`;
}

export function revokePhotoItemUrls(item) {
  if (item?.previewUrl?.startsWith('blob:')) {
    URL.revokeObjectURL(item.previewUrl);
  }
}

export function cloneEditState(edit) {
  return {
    scale: edit?.scale ?? 1,
    x: edit?.x ?? 0,
    y: edit?.y ?? 0,
    frameId: edit?.frameId ?? null,
    frameSource: edit?.frameSource ?? null,
    frameUrl: edit?.frameUrl ?? null,
    isEdited: !!edit?.isEdited,
  };
}
