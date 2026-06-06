import { create } from 'zustand';

interface HistoryState {
  past: string[]; // JSON 快照
  future: string[];
  max: number;
  push: (snap: string) => void;
  undo: () => string | null;
  redo: () => string | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  max: 50,
  push: (snap) => {
    const past = [...get().past, snap];
    if (past.length > get().max) past.shift();
    set({ past, future: [] });
  },
  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return null;
    const prev = past[past.length - 1];
    set({ past: past.slice(0, -1), future: [...future, prev] });
    return prev;
  },
  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return null;
    const next = future[future.length - 1];
    set({ past: [...past, next], future: future.slice(0, -1) });
    return next;
  },
  clear: () => set({ past: [], future: [] }),
}));
