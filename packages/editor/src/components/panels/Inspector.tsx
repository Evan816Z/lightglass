import type { WindowConfig } from '@lightglass/shared';
import { Trash2, Copy, Lock, Unlock } from 'lucide-react';
import { useDocumentStore } from '../../store/document';

export default function Inspector({ windows, onUpdate }: { windows: WindowConfig[]; onUpdate: (id: string, patch: Partial<WindowConfig>) => void }) {
  const removeWindow = useDocumentStore((s) => s.removeWindow);
  if (windows.length === 0) {
    return (
      <div className="grid h-full place-items-center text-center text-sm text-ink-400">
        <div>
          <div className="mb-2 text-3xl">🎯</div>
          选中画布上的窗口<br />以编辑属性
        </div>
      </div>
    );
  }

  if (windows.length > 1) {
    return (
      <div className="space-y-3">
        <div className="label">多选 ({windows.length})</div>
        <div className="glass rounded-xl p-3 text-xs text-ink-300">
          多选可批量移动、缩放、对齐。点击 <kbd className="rounded bg-white/10 px-1">Del</kbd> 删除。
        </div>
      </div>
    );
  }

  const w = windows[0];

  return (
    <div className="space-y-4 text-sm">
      <Section title="基础">
        <Field label="标题">
          <input className="input" value={w.title} onChange={(e) => onUpdate(w.id, { title: e.target.value })} />
        </Field>
        <Field label="显示标题栏">
          <Toggle on={w.chrome !== false} onChange={(v) => onUpdate(w.id, { chrome: v } as any)} />
        </Field>
      </Section>

      <Section title="位置 (X / Y)">
        <div className="grid grid-cols-2 gap-2">
          <NumField value={w.x} onChange={(v: number) => onUpdate(w.id, { x: v })} suffix="px" />
          <NumField value={w.y} onChange={(v: number) => onUpdate(w.id, { y: v })} suffix="px" />
        </div>
      </Section>

      <Section title="尺寸 (W × H)">
        <div className="grid grid-cols-2 gap-2">
          <NumField value={w.width} onChange={(v: number) => onUpdate(w.id, { width: Math.max(50, v) })} suffix="px" />
          <NumField value={w.height} onChange={(v: number) => onUpdate(w.id, { height: Math.max(50, v) })} suffix="px" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
          {['480×320', '640×480', '800×600'].map((p) => (
            <button
              key={p}
              className="btn h-7 px-1 text-[11px]"
              onClick={() => {
                const [wp, hp] = p.split('×').map(Number);
                onUpdate(w.id, { width: wp, height: hp });
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Z-Index / 层级">
        <div className="flex items-center gap-2">
          <button className="btn h-8 flex-1" onClick={() => onUpdate(w.id, { zIndex: w.zIndex - 1 })}>下移</button>
          <div className="w-12 text-center font-mono text-xs">{w.zIndex}</div>
          <button className="btn h-8 flex-1" onClick={() => onUpdate(w.id, { zIndex: w.zIndex + 1 })}>上移</button>
        </div>
      </Section>

      <Section title="锁定">
        <div className="flex items-center gap-2 text-xs">
          <button
            className={`btn h-8 flex-1 ${w.locked?.position ? 'btn-primary' : ''}`}
            onClick={() => onUpdate(w.id, { locked: { ...w.locked, position: !w.locked?.position } })}
          >
            {w.locked?.position ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />} 位置
          </button>
          <button
            className={`btn h-8 flex-1 ${w.locked?.size ? 'btn-primary' : ''}`}
            onClick={() => onUpdate(w.id, { locked: { ...w.locked, size: !w.locked?.size } })}
          >
            {w.locked?.size ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />} 尺寸
          </button>
        </div>
      </Section>

      <Section title="样式">
        <Field label="圆角">
          <input type="range" min={0} max={48} value={w.style?.radius ?? 16} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(w.id, { style: { ...w.style, radius: +e.target.value } })} className="w-full accent-violet" />
        </Field>
        <Field label="透明度">
          <input type="range" min={0.1} max={1} step={0.05} value={w.style?.opacity ?? 1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdate(w.id, { style: { ...w.style, opacity: +e.target.value } })} className="w-full accent-violet" />
        </Field>
        <Field label="阴影">
          <select className="input" value={w.style?.shadow ?? 'lg'} onChange={(e) => onUpdate(w.id, { style: { ...w.style, shadow: e.target.value as any } })}>
            {['none', 'sm', 'md', 'lg', 'xl'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </Section>

      <div className="pt-2">
        <button
          className="btn w-full !border-rose-400/30 !bg-rose-500/10 !text-rose-200 hover:!bg-rose-500/20"
          onClick={() => removeWindow(w.id)}
        >
          <Trash2 className="h-4 w-4" /> 删除窗口
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="space-y-2">
      <div className="label">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <div className="mb-1 text-xs text-ink-300">{label}</div>
      {children}
    </div>
  );
}

function NumField({ value, onChange, suffix }: any) {
  return (
    <div className="relative">
      <input
        type="number"
        className="input pr-8 font-mono"
        value={Math.round(value)}
        onChange={(e) => onChange(+e.target.value)}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-400">{suffix}</span>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-violet' : 'bg-white/10'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
