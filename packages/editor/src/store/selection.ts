import { create } from 'zustand';

interface SelectionState {
  selected: string[]; // window ids
  hovered: string | null;
  marquee: { x1: number; y1: number; x2: number; y2: number } | null;
  select: (id: string, additive?: boolean) => void;
  setMany: (ids: string[]) => void;
  clear: () => void;
  setHovered: (id: string | null) => void;
  setMarquee: (m: SelectionState['marquee']) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selected: [],
  hovered: null,
  marquee: null,
  select: (id, additive = false) => {
    if (additive) {
      const has = get().selected.includes(id);
      set({ selected: has ? get().selected.filter((x) => x !== id) : [...get().selected, id] });
    } else {
      set({ selected: [id] });
    }
  },
  setMany: (ids) => set({ selected: ids }),
  clear: () => set({ selected: [], marquee: null }),
  setHovered: (id) => set({ hovered: id }),
  setMarquee: (m) => set({ marquee: m }),
}));
