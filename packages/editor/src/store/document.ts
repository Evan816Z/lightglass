import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type {
  ProjectDocument,
  WindowConfig,
  WindowStyle,
  BackgroundConfig,
  ThemeConfig,
  ContentProps,
} from '@lightglass/shared';

interface DocState {
  document: ProjectDocument;
  setDocument: (doc: ProjectDocument) => void;

  addWindow: (init?: Partial<WindowConfig>) => string;
  updateWindow: (id: string, patch: Partial<WindowConfig>) => void;
  removeWindow: (id: string) => void;
  bringToFront: (id: string) => void;

  setBackground: (bg: BackgroundConfig) => void;
  setTheme: (theme: ThemeConfig) => void;

  importWindows: (windows: WindowConfig[]) => void;
  replaceDocument: (doc: ProjectDocument) => void;
}

const defaultDoc: ProjectDocument = {
  version: 1,
  canvas: { width: 1280, height: 800 },
  background: {
    type: 'gradient',
    gradient: {
      kind: 'linear',
      angle: 135,
      stops: [
        { color: '#1B1033', position: 0 },
        { color: '#0B1B2E', position: 100 },
      ],
    },
  },
  theme: { kind: 'glass', opacity: 0.6, blur: 24, radius: 16, gloss: 0.4 },
  windows: [],
};

export const useDocumentStore = create<DocState>()(
  subscribeWithSelector((set, get) => ({
    document: defaultDoc,

    setDocument: (doc) => set({ document: doc }),

    addWindow: (init) => {
      const id = init?.id ?? nanoid(8);
      const w: WindowConfig = {
        id,
        title: init?.title ?? '新窗口',
        x: init?.x ?? 120,
        y: init?.y ?? 120,
        width: init?.width ?? 420,
        height: init?.height ?? 280,
        zIndex: get().document.windows.length + 1,
        chrome: init?.chrome ?? true,
        locked: init?.locked,
        style: init?.style,
        animation: init?.animation,
        content: init?.content ?? { type: 'text', props: { html: '双击编辑文字', fontSize: 18, color: '#E6EAF2' } },
      };
      set({ document: { ...get().document, windows: [...get().document.windows, w] } });
      return id;
    },

    updateWindow: (id, patch) => {
      set({
        document: {
          ...get().document,
          windows: get().document.windows.map((w) => (w.id === id ? { ...w, ...patch } : w)),
        },
      });
    },

    removeWindow: (id) => {
      set({
        document: {
          ...get().document,
          windows: get().document.windows.filter((w) => w.id !== id),
        },
      });
    },

    bringToFront: (id) => {
      const maxZ = Math.max(0, ...get().document.windows.map((w) => w.zIndex));
      set({
        document: {
          ...get().document,
          windows: get().document.windows.map((w) =>
            w.id === id ? { ...w, zIndex: maxZ + 1 } : w,
          ),
        },
      });
    },

    setBackground: (bg) => set({ document: { ...get().document, background: bg } }),
    setTheme: (theme) => set({ document: { ...get().document, theme } }),

    importWindows: (windows) => {
      const maxZ = Math.max(0, ...get().document.windows.map((w) => w.zIndex));
      const offsetWindows = windows.map((w, i) => ({ ...w, zIndex: maxZ + i + 1 }));
      set({
        document: { ...get().document, windows: [...get().document.windows, ...offsetWindows] },
      });
    },

    replaceDocument: (doc) => set({ document: doc }),
  })),
);
