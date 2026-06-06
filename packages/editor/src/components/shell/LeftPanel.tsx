import { useUIStore } from '../../store/ui';
import { Type, Image as ImageIcon, Film, Music, Globe, Layers as LayersIcon, Plus, Box } from 'lucide-react';
import { useDocumentStore } from '../../store/document';
import { useSelectionStore } from '../../store/selection';
import type { ContentProps } from '@lightglass/shared';
import { nanoid } from 'nanoid';

const items: Array<{ key: ContentProps['type']; label: string; icon: any; defaultProps: () => ContentProps }> = [
  { key: 'text', label: '文字', icon: Type, defaultProps: () => ({ type: 'text', props: { html: '双击编辑文字', fontSize: 20, color: '#E6EAF2', fontWeight: 600 } }) },
  { key: 'image', label: '图片', icon: ImageIcon, defaultProps: () => ({ type: 'image', props: { src: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800', fit: 'cover' } }) },
  { key: 'video', label: '视频', icon: Film, defaultProps: () => ({ type: 'video', props: { src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', muted: true, loop: true, autoplay: true, controls: false } }) },
  { key: 'audio', label: '音频', icon: Music, defaultProps: () => ({ type: 'audio', props: { src: '', volume: 0.8, loop: true } }) },
  { key: 'web', label: 'Web', icon: Globe, defaultProps: () => ({ type: 'web', props: { src: 'https://example.com' } }) },
];

export default function LeftPanel() {
  const ui = useUIStore();
  const addWindow = useDocumentStore((s) => s.addWindow);

  function add(type: ContentProps['type']) {
    const def = items.find((i) => i.key === type)!.defaultProps();
    const id = nanoid(8);
    addWindow({
      id,
      title: items.find((i) => i.key === type)!.label,
      x: 160 + Math.random() * 100,
      y: 160 + Math.random() * 100,
      width: type === 'text' ? 360 : type === 'audio' ? 320 : 480,
      height: type === 'text' ? 160 : type === 'audio' ? 96 : 320,
      content: def,
    });
  }

  return (
    <aside className="glass z-20 flex w-64 flex-col border-r border-white/5">
      <div className="flex p-2">
        <button onClick={() => ui.setLeft('library')} className={`btn h-8 flex-1 ${ui.leftPanel === 'library' ? 'btn-primary' : 'btn-ghost'}`}>
          <Box className="h-4 w-4" /> 组件
        </button>
        <button onClick={() => ui.setLeft('layers')} className={`btn h-8 flex-1 ${ui.leftPanel === 'layers' ? 'btn-primary' : 'btn-ghost'}`}>
          <LayersIcon className="h-4 w-4" /> 图层
        </button>
      </div>
      {ui.leftPanel === 'library' ? (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="label mb-2 px-1">基础组件</div>
          <div className="grid grid-cols-2 gap-2">
            {items.map((it) => (
              <button
                key={it.key}
                onClick={() => add(it.key)}
                className="glass group flex flex-col items-center gap-2 rounded-xl p-4 text-xs hover:border-violet/40 hover:bg-white/5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-violet/20 to-mint/20 transition-transform group-hover:scale-110">
                  <it.icon className="h-5 w-5 text-mint" />
                </div>
                {it.label}
              </button>
            ))}
          </div>

          <div className="label mb-2 mt-6 px-1">模板</div>
          <div className="space-y-2">
            {[
              { name: '欢迎桌面', desc: '示例窗口组合' },
              { name: '数据看板', desc: '占位 (开发中)' },
            ].map((t) => (
              <button key={t.name} className="glass w-full rounded-xl p-3 text-left text-xs hover:bg-white/5">
                <div className="font-medium text-ink-100">{t.name}</div>
                <div className="mt-0.5 text-ink-400">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <LayersPanel />
      )}
    </aside>
  );
}

function LayersPanel() {
  const windows = useDocumentStore((s) => s.document.windows);
  const selected = useSelectionStore((s) => s.selected);
  const select = useSelectionStore((s) => s.select);
  const bringToFront = useDocumentStore((s) => s.bringToFront);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {[...windows].sort((a: any, b: any) => b.zIndex - a.zIndex).map((w: any) => (
        <div
          key={w.id}
          onClick={(e) => select(w.id, e.shiftKey)}
          className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${selected.includes(w.id) ? 'bg-violet/15 text-white' : 'hover:bg-white/5'}`}
        >
          <div className="font-mono text-[10px] text-ink-400">z{w.zIndex}</div>
          <div className="flex-1 truncate">{w.title}</div>
          <button onClick={(e) => { e.stopPropagation(); bringToFront(w.id); }} className="text-ink-400 hover:text-mint">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      ))}
      {windows.length === 0 && <div className="px-3 py-6 text-center text-xs text-ink-400">尚无窗口, 在左侧添加</div>}
    </div>
  );
}
