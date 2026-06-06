import type { WindowConfig, AnimationConfig } from '@lightglass/shared';

export default function AnimationPanel({ windows, onUpdate }: { windows: WindowConfig[]; onUpdate: (id: string, patch: Partial<WindowConfig>) => void }) {
  if (windows.length === 0) {
    return <div className="grid h-full place-items-center text-sm text-ink-400">选中窗口以编辑动画</div>;
  }
  const w = windows[0];
  const a: AnimationConfig = w.animation ?? {};

  function patch(next: Partial<AnimationConfig>) {
    onUpdate(w.id, { animation: { ...a, ...next } });
  }

  return (
    <div className="space-y-3 text-sm">
      {(['open', 'close', 'loop'] as const).map((slot) => (
        <div key={slot} className="glass rounded-xl p-3">
          <div className="label mb-2">{slot === 'open' ? '打开' : slot === 'close' ? '关闭' : '循环'}</div>
          <AnimEditor
            spec={a[slot]}
            onChange={(s) => patch({ [slot]: s })}
          />
        </div>
      ))}
    </div>
  );
}

function AnimEditor({ spec, onChange }: { spec: any; onChange: (s: any) => void }) {
  if (!spec) {
    return (
      <button className="btn w-full" onClick={() => onChange({ type: 'fade', duration: 200, easing: 'ease-out' })}>
        + 添加
      </button>
    );
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={spec.type} onChange={(e) => onChange({ ...spec, type: e.target.value })}>
          {['fade', 'scale', 'translate', 'spring', 'bounce', 'none'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={spec.easing ?? 'ease-out'} onChange={(e) => onChange({ ...spec, easing: e.target.value })}>
          {['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'spring', 'bounce'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="mb-1 text-[10px] text-ink-400">Duration (ms)</div>
          <input type="number" className="input font-mono" value={spec.duration ?? 200} onChange={(e) => onChange({ ...spec, duration: +e.target.value })} />
        </div>
        <div>
          <div className="mb-1 text-[10px] text-ink-400">Delay (ms)</div>
          <input type="number" className="input font-mono" value={spec.delay ?? 0} onChange={(e) => onChange({ ...spec, delay: +e.target.value })} />
        </div>
      </div>
      <button className="btn w-full" onClick={() => onChange(undefined)}>移除</button>
    </div>
  );
}
