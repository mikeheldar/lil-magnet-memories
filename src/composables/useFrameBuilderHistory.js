import { ref, computed } from 'vue';
import { cloneLayers } from '../utils/frameBuilderLayers.js';

const MAX_HISTORY = 60;

function cloneSnapshot(snapshot) {
  return {
    layers: cloneLayers(snapshot.layers || []),
    cutout: { ...(snapshot.cutout || {}) },
    stencil: { ...(snapshot.stencil || {}) },
    selectedLayerId: snapshot.selectedLayerId ?? null,
  };
}

export function snapshotsEqual(a, b) {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

export function useFrameBuilderHistory() {
  const undoStack = ref([]);
  const redoStack = ref([]);
  const isApplyingHistory = ref(false);

  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const pushSnapshot = (snapshot, { clearRedo = true } = {}) => {
    if (isApplyingHistory.value) return;
    const cloned = cloneSnapshot(snapshot);
    const last = undoStack.value[undoStack.value.length - 1];
    if (last && snapshotsEqual(last, cloned)) return;
    undoStack.value.push(cloned);
    if (undoStack.value.length > MAX_HISTORY) {
      undoStack.value.shift();
    }
    if (clearRedo) redoStack.value = [];
  };

  const undo = (currentSnapshot) => {
    if (!undoStack.value.length) return null;
    isApplyingHistory.value = true;
    const previous = undoStack.value.pop();
    if (currentSnapshot) {
      redoStack.value.push(cloneSnapshot(currentSnapshot));
    }
    isApplyingHistory.value = false;
    return previous;
  };

  const redo = (currentSnapshot) => {
    if (!redoStack.value.length) return null;
    isApplyingHistory.value = true;
    const next = redoStack.value.pop();
    if (currentSnapshot) {
      undoStack.value.push(cloneSnapshot(currentSnapshot));
    }
    isApplyingHistory.value = false;
    return next;
  };

  const reset = (initialSnapshot = null) => {
    undoStack.value = [];
    redoStack.value = [];
    if (initialSnapshot) {
      pushSnapshot(initialSnapshot, { clearRedo: true });
    }
  };

  return {
    canUndo,
    canRedo,
    isApplyingHistory,
    pushSnapshot,
    undo,
    redo,
    reset,
  };
}
