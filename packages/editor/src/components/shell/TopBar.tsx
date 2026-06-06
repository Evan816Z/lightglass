import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Eye, Code2, Undo2, Redo2, Grid3x3, Magnet, MousePointer2,
  CircleDot, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useUIStore } from '../../store/ui';
import { useEffect, useState } from 'react';

export default function TopBar({
  project, saving, savedAt, onSave, onPreview, onOpenJson, onUndo, onRedo, canUndo, canRedo,
}: any) {
  const navigate = useNavigate();
  const ui = useUIStore();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  void tick;
  return (
    <div className="glass z-30 flex h-12 items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <button className="btn btn-ghost h-8" onClick={() => navigate('/console')}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-white/10" />
        <div className="flex items-center gap-2 text-sm">
          <div className="font-display font-semibold tracking-tight">{project?.name ?? '加载中…'}</div>
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-300">{project?.slug}</span>
        </div>
        <div className="ml-3 flex items-center gap-1 text-xs text-ink-400">
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${saving ? 'bg-amber-400 animate-pulse' : 'bg-mint'}`} />
          {saving ? '保存中…' : savedAt ? `已保存 ${formatRelative(savedAt)}` : '未保存'}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="btn btn-ghost h-8" disabled={!canUndo} onClick={onUndo} title="撤销 (⌘Z)">
          <Undo2 className="h-4 w-4" />
        </button>
        <button className="btn btn-ghost h-8" disabled={!canRedo} onClick={onRedo} title="重做 (⌘⇧Z)">
          <Redo2 className="h-4 w-4" />
        </button>
        <div className="h-5 w-px bg-white/10" />
        <button className="btn btn-ghost h-8" onClick={ui.toggleGuides} data-active={ui.showGuides}>
          <MousePointer2 className="h-4 w-4" /> 辅助线
        </button>
        <button className="btn btn-ghost h-8" onClick={ui.toggleSnap} data-active={ui.snap}>
          <Magnet className="h-4 w-4" /> 吸附
        </button>
        <button className="btn btn-ghost h-8" onClick={ui.toggleGrid} data-active={ui.showGrid}>
          <Grid3x3 className="h-4 w-4" /> 网格
        </button>
        <div className="h-5 w-px bg-white/10" />
        <button className="btn btn-ghost h-8" onClick={onOpenJson}>
          <Code2 className="h-4 w-4" /> JSON
        </button>
        <button className="btn btn-ghost h-8" onClick={onPreview}>
          <Eye className="h-4 w-4" /> 预览
        </button>
        <button className="btn btn-primary h-8" onClick={onSave}>
          <Save className="h-4 w-4" /> 保存
        </button>
      </div>
    </div>
  );
}

function formatRelative(ts: number) {
  const d = Math.max(0, Date.now() - ts);
  if (d < 60_000) return '刚刚';
  if (d < 3_600_000) return `${Math.floor(d / 60_000)} 分钟前`;
  return `${Math.floor(d / 3_600_000)} 小时前`;
}
