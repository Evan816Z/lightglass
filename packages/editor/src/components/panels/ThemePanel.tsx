import type { ThemeConfig, ThemeKind } from '@lightglass/shared';
import { useDocumentStore } from '../../store/document';

const presets: Array<{ kind: ThemeKind; label: string; desc: string; config: ThemeConfig }> = [
  { kind: 'glass', label: 'Glassmorphism', desc: '经典毛玻璃', config: { kind: 'glass', opacity: 0.6, blur: 24, radius: 16, gloss: 0.4 } },
  { kind: 'acrylic', label: 'Acrylic', desc: 'Fluent 风格', config: { kind: 'acrylic', opacity: 0.7, blur: 40, radius: 12, gloss: 0.2 } },
  { kind: 'liquid-glass', label: 'Liquid Glass', desc: '液态折射', config: { kind: 'liquid-glass', opacity: 0.5, blur: 36, radius: 24, gloss: 0.8 } },
  { kind: 'fluent', label: 'Fluent 11', desc: 'Mica / Acrylic', config: { kind: 'fluent', opacity: 0.7, blur: 30, radius: 10, gloss: 0.3 } },
  { kind: 'custom', label: 'Custom', desc: '自定义 CSS', config: { kind: 'custom', opacity: 1, blur: 0, radius: 8, customCss: '' } },
];

export default function ThemePanel() {
  const theme = useDocumentStore((s) => s.document.theme);
  const setTheme = useDocumentStore((s) => s.setTheme);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="label mb-2">主题预设</div>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.kind}
              onClick={() => setTheme(p.config)}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left text-xs transition-all ${
                theme.kind === p.kind ? 'border-violet' : 'border-white/8 hover:border-white/20'
              }`}
            >
              <div className={`theme-${p.kind} h-12 w-full rounded-md`} />
              <div className="mt-2 font-medium text-ink-100">{p.label}</div>
              <div className="text-[10px] text-ink-400">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="label">参数</div>
        <Slider label="全局透明度" value={theme.opacity ?? 1} onChange={(v: number) => setTheme({ ...theme, opacity: v })} min={0.1} max={1} step={0.05} />
        <Slider label="模糊" value={theme.blur ?? 0} onChange={(v: number) => setTheme({ ...theme, blur: v })} min={0} max={60} />
        <Slider label="圆角" value={theme.radius ?? 0} onChange={(v: number) => setTheme({ ...theme, radius: v })} min={0} max={32} />
        <Slider label="高光" value={theme.gloss ?? 0} onChange={(v: number) => setTheme({ ...theme, gloss: v })} min={0} max={1} step={0.05} />
      </div>

      {theme.kind === 'custom' && (
        <div>
          <div className="label mb-1">自定义 CSS</div>
          <textarea
            className="input font-mono text-xs"
            rows={6}
            value={theme.customCss ?? ''}
            onChange={(e) => setTheme({ ...theme, customCss: e.target.value })}
            placeholder=".window { backdrop-filter: blur(20px); }"
          />
        </div>
      )}
    </div>
  );
}

function Slider({ label, value, onChange, min, max, step = 1 }: any) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-ink-300">{label}</span>
        <span className="font-mono text-ink-400">{Number(value).toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full accent-violet"
      />
    </div>
  );
}
