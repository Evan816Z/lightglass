import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Moveable from 'react-moveable';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Eye, Download, Upload, Undo2, Redo2, Trash2, Copy,
  Grid3x3, Magnet, Settings, Layers, Square, Image as ImageIcon,
  Type, Film, Music, Globe, Plus, Lock, Unlock, Monitor, Smartphone, Tablet,
  Sparkles, Palette, Wand2,
} from 'lucide-react';

import { useDocumentStore } from '../store/document';
import { useSelectionStore } from '../store/selection';
import { useHistoryStore } from '../store/history';
import { useUIStore } from '../store/ui';
import { api } from '../store/auth';
import { joinProjectAsEditor, leaveProject, onSocketEvent } from '../lib/socket';

import TopBar from '../components/shell/TopBar';
import LeftPanel from '../components/shell/LeftPanel';
import RightPanel from '../components/shell/RightPanel';
import StatusBar from '../components/shell/StatusBar';
import CanvasArea from '../components/canvas/CanvasArea';
import BackgroundRenderer from '../components/canvas/BackgroundRenderer';
import WindowFrame from '../components/window/WindowFrame';
import WidgetRenderer from '../components/widgets/WidgetRenderer';
import SelectionOverlay from '../components/canvas/SelectionOverlay';
import GuidesLayer from '../components/canvas/GuidesLayer';

import { applyPatches, snapshotPatches, type Patch } from '../lib/patch';
import { useHotkeys } from '../hooks/useHotkeys';

export default function EditorPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const document_ = useDocumentStore((s) => s.document);
  const setDocument = useDocumentStore((s) => s.setDocument);
  const updateWindow = useDocumentStore((s) => s.updateWindow);
  const removeWindow = useDocumentStore((s) => s.removeWindow);
  const addWindow = useDocumentStore((s) => s.addWindow);

  const selected = useSelectionStore((s) => s.selected);
  const clearSel = useSelectionStore((s) => s.clear);
  const select = useSelectionStore((s) => s.select);

  const history = useHistoryStore();
  const ui = useUIStore();

  const [project, setProject] = useState<any>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始加载
  useEffect(() => {
    (async () => {
      const p = await api<{ project: any }>(`/api/projects/${projectId}`);
      setProject(p.project);
      const snap = await api<{ snapshot: any }>(`/api/projects/${projectId}/snapshots/latest`);
      if (snap?.snapshot?.document) setDocument(snap.snapshot.document);
      history.clear();
    })();
    joinProjectAsEditor(projectId);
    const offUpdate = onSocketEvent<any>('project:update', () => {});
    const offFull = onSocketEvent<any>('project:full', (p) => {
      if (p?.document && p.document !== document_) {
        setDocument(p.document);
      }
    });
    return () => {
      offUpdate?.();
      offFull?.();
      leaveProject();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 自动保存: 1.2s debounce
  useEffect(() => {
    if (!project) return;
    const timer = setTimeout(() => save(), 1200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [document_]);

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await api<{ snapshot: any }>(`/api/projects/${projectId}/snapshots`, {
        method: 'POST',
        body: JSON.stringify({ document: document_ }),
      });
      setSavedAt(Date.now());
      // 推送 history
      history.clear();
      void res;
    } catch (e) {
      console.error('save failed', e);
    } finally {
      setSaving(false);
    }
  }

  // 快捷键
  useHotkeys({
    'mod+z': () => {
      const prev = history.undo();
      if (prev) setDocument(JSON.parse(prev));
    },
    'mod+shift+z': () => {
      const next = history.redo();
      if (next) setDocument(JSON.parse(next));
    },
    'mod+c': () => {
      const wins = document_.windows.filter((w) => selected.includes(w.id));
      navigator.clipboard.writeText(JSON.stringify(wins));
    },
    'mod+v': async () => {
      try {
        const text = await navigator.clipboard.readText();
        const arr = JSON.parse(text);
        if (Array.isArray(arr)) {
          arr.forEach((w: any) => addWindow({ ...w, id: undefined, x: (w.x ?? 0) + 24, y: (w.y ?? 0) + 24 }));
        }
      } catch {}
    },
    'mod+d': () => {
      selected.forEach((id) => {
        const w = document_.windows.find((x) => x.id === id);
        if (w) addWindow({ ...w, x: w.x + 24, y: w.y + 24 });
      });
    },
    delete: () => {
      history.push(JSON.stringify(document_));
      selected.forEach((id) => removeWindow(id));
      clearSel();
    },
    escape: () => clearSel(),
  });

  // 历史: 选中变化时入栈
  function recordHistory() {
    history.push(JSON.stringify(document_));
  }

  // 暴露给子组件的方法
  const editorActions = useMemo(
    () => ({
      recordHistory,
      save,
      openJson: () => setJsonOpen(true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [document_],
  );

  // 选中窗口数据
  const selectedWindows = document_.windows.filter((w) => selected.includes(w.id));

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-950 text-ink-100">
      <TopBar
        project={project}
        saving={saving}
        savedAt={savedAt}
        onSave={save}
        onPreview={() => setPreviewOpen(true)}
        onOpenJson={() => setJsonOpen(true)}
        onUndo={() => {
          const prev = history.undo();
          if (prev) setDocument(JSON.parse(prev));
        }}
        onRedo={() => {
          const next = history.redo();
          if (next) setDocument(JSON.parse(next));
        }}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        <LeftPanel />
        <div className="flex-1 relative" onClick={() => clearSel()}>
          <CanvasArea containerRef={containerRef}>
            <BackgroundRenderer background={document_.background} />
            {document_.windows
              .slice()
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((w) => (
                <WindowFrame
                  key={w.id}
                  window={w}
                  theme={document_.theme}
                  selected={selected.includes(w.id)}
                  onSelect={(e) => {
                    e.stopPropagation();
                    select(w.id, e.shiftKey);
                  }}
                  onChange={(patch) => {
                    history.push(JSON.stringify(document_));
                    updateWindow(w.id, patch);
                  }}
                  onBringFront={() => {
                    history.push(JSON.stringify(document_));
                    useDocumentStore.getState().bringToFront(w.id);
                  }}
                >
                  <WidgetRenderer content={w.content} readOnly={false} windowId={w.id} />
                </WindowFrame>
              ))}

            <SelectionOverlay />
            <GuidesLayer />
          </CanvasArea>
        </div>
        <RightPanel
          selected={selectedWindows}
          onUpdate={(id, patch) => {
            history.push(JSON.stringify(document_));
            updateWindow(id, patch);
          }}
        />
      </div>

      <StatusBar
        project={project}
        saving={saving}
        savedAt={savedAt}
        selectedCount={selected.length}
        windowCount={document_.windows.length}
      />

      <MoveableHost />

      {/* 预览抽屉 */}
      <AnimatePresence>
        {previewOpen && (
          <PreviewDrawer projectId={projectId} onClose={() => setPreviewOpen(false)} document={document_} />
        )}
      </AnimatePresence>

      {/* JSON 编辑器 */}
      <AnimatePresence>
        {jsonOpen && (
          <JsonEditor onClose={() => setJsonOpen(false)} onApply={(windows) => {
            history.push(JSON.stringify(document_));
            useDocumentStore.getState().importWindows(windows);
            setJsonOpen(false);
          }} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------- Moveable 主控件 -------------------- */
function MoveableHost() {
  const document_ = useDocumentStore((s) => s.document);
  const selected = useSelectionStore((s) => s.selected);
  const updateWindow = useDocumentStore((s) => s.updateWindow);
  const history = useHistoryStore();
  const ui = useUIStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moveableRef = useRef<Moveable | null>(null);
  const [scale, setScale] = useState(1);

  // 找到 canvas 容器, 并从其宽度推算缩放 (data-canvas-root 宽度 = canvas.width * scale)
  useEffect(() => {
    const root = document.querySelector('[data-canvas-root]') as HTMLDivElement | null;
    containerRef.current = root;
    if (root) {
      const cw = parseFloat(root.style.width) || root.clientWidth;
      if (document_.canvas.width > 0) setScale(cw / document_.canvas.width);
    }
  });

  if (selected.length === 0) return null;

  const inv = scale || 1; // 用于将屏幕/缩放坐标换算回数据坐标

  return (
    <Moveable
      ref={moveableRef as any}
      target={selected.map((id) => `[data-window-id="${id}"]`).join(',')}
      container={containerRef.current ?? undefined}
      draggable={!ui.snap ? true : true}
      resizable
      rotatable={false}
      snappable={ui.snap}
      bounds={'[data-canvas-root]'}
      verticalGuidelines={ui.showGuides ? computeVerticalGuidelines(document_, scale) : []}
      horizontalGuidelines={ui.showGuides ? computeHorizontalGuidelines(document_, scale) : []}
      throttleDrag={0}
      throttleResize={0}
      onDragStart={() => history.push(JSON.stringify(document_))}
      onDrag={({ target, left, top }) => {
        target.style.left = `${left}px`;
        target.style.top = `${top}px`;
      }}
      onDragEnd={({ target }) => {
        const id = target.getAttribute('data-window-id');
        if (!id) return;
        updateWindow(id, {
          x: parseFloat(target.style.left) / inv,
          y: parseFloat(target.style.top) / inv,
        });
      }}
      onResizeStart={() => history.push(JSON.stringify(document_))}
      onResize={({ target, width, height, drag }) => {
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.left = `${drag.left}px`;
        target.style.top = `${drag.top}px`;
      }}
      onResizeEnd={({ target }) => {
        const id = target.getAttribute('data-window-id');
        if (!id) return;
        updateWindow(id, {
          width: parseFloat(target.style.width) / inv,
          height: parseFloat(target.style.height) / inv,
          x: parseFloat(target.style.left) / inv,
          y: parseFloat(target.style.top) / inv,
        });
      }}
    />
  );
}

function computeVerticalGuidelines(doc: any, scale = 1): number[] {
  const list: number[] = [0, (doc.canvas.width / 2) * scale, doc.canvas.width * scale];
  for (const w of doc.windows) {
    list.push(w.x * scale, (w.x + w.width / 2) * scale, (w.x + w.width) * scale);
  }
  return Array.from(new Set(list));
}

function computeHorizontalGuidelines(doc: any, scale = 1): number[] {
  const list: number[] = [0, (doc.canvas.height / 2) * scale, doc.canvas.height * scale];
  for (const w of doc.windows) {
    list.push(w.y * scale, (w.y + w.height / 2) * scale, (w.y + w.height) * scale);
  }
  return Array.from(new Set(list));
}

/* -------------------- 预览抽屉 -------------------- */
function PreviewDrawer({ projectId, document, onClose }: { projectId: string; document: any; onClose: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function calc() {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const padding = 48; // 抽屉内边距 + 滚动条预留
      const sx = (wrap.clientWidth - padding) / document.canvas.width;
      const sy = (wrap.clientHeight - padding) / document.canvas.height;
      const s = Math.max(0.1, Math.min(sx, sy));
      setScale(isFinite(s) ? s : 1);
    }
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', calc);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, [document.canvas.width, document.canvas.height]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 24, opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-strong flex max-h-[88vh] w-[min(96vw,1280px)] flex-col overflow-hidden rounded-2xl"
      >
        <div className="flex items-center justify-between px-5 py-3">
          <div className="text-sm text-ink-200">访问端预览 · {projectId.slice(0, 6)}</div>
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
        </div>
        <div ref={wrapRef} className="flex-1 overflow-auto bg-ink-900 p-6">
          <div className="mx-auto" style={{ width: document.canvas.width * scale, height: document.canvas.height * scale }}>
            <div style={{ width: document.canvas.width, height: document.canvas.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <BackgroundRenderer background={document.background} />
              {document.windows.map((w: any) => (
                <WindowFrame key={w.id} window={w} theme={document.theme} selected={false} onSelect={() => {}} onChange={() => {}} onBringFront={() => {}}>
                  <WidgetRenderer content={w.content} readOnly windowId={w.id} />
                </WindowFrame>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* -------------------- JSON 编辑器 -------------------- */
function JsonEditor({ onClose, onApply }: { onClose: () => void; onApply: (wins: any[]) => void }) {
  const document_ = useDocumentStore((s) => s.document);
  const [text, setText] = useState(JSON.stringify(document_.windows, null, 2));
  const [err, setErr] = useState('');

  function apply() {
    setErr('');
    try {
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('JSON 必须是数组');
      onApply(arr);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={(e) => e.stopPropagation()} className="glass-strong w-[720px] rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display font-semibold">JSON 自定义窗口</div>
          <button className="btn btn-ghost" onClick={onClose}>关闭</button>
        </div>
        <p className="mb-2 text-xs text-ink-400">粘贴 JSON 数组 (每个元素为 WindowConfig), 解析后追加到当前画布。</p>
        <textarea className="input font-mono text-xs" rows={18} value={text} onChange={(e) => setText(e.target.value)} />
        {err && <div className="mt-2 text-xs text-rose-300">解析错误: {err}</div>}
        <div className="mt-3 flex justify-end gap-2">
          <button className="btn" onClick={onClose}>取消</button>
          <button className="btn btn-primary" onClick={apply}>导入到画布</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
