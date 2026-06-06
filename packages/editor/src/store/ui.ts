import { create } from 'zustand';

interface UIState {
  leftPanel: 'library' | 'layers';
  rightPanel: 'inspector' | 'theme' | 'background' | 'animation' | 'project';
  showGrid: boolean;
  snap: boolean;
  showGuides: boolean;
  zoom: number;
  setLeft: (k: UIState['leftPanel']) => void;
  setRight: (k: UIState['rightPanel']) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleGuides: () => void;
  setZoom: (z: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftPanel: 'library',
  rightPanel: 'inspector',
  showGrid: true,
  snap: true,
  showGuides: true,
  zoom: 1,
  setLeft: (k) => set({ leftPanel: k }),
  setRight: (k) => set({ rightPanel: k }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(2, z)) }),
}));
