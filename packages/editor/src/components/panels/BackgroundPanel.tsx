import { useState } from 'react';
import type { BackgroundConfig } from '@lightglass/shared';
import { useDocumentStore } from '../../store/document';
import { Image as ImageIcon, Droplet, Sparkles } from 'lucide-react';

const palettes = [
  { name: 'Aurora', bg: 'linear-gradient(135deg,#7C5CFF 0%,#36E0C7 100%)' },
  { name: 'Sunset', bg: 'linear-gradient(135deg,#FF7AB6 0%,#FFB454 100%)' },
  { name: 'Ocean', bg: 'linear-gradient(135deg,#0EA5E9 0%,#1E3A8A 100%)' },
  { name: 'Ink', bg: 'linear-gradient(135deg,#0B0F1A 0%,#1B1033 100%)' },
  { name: 'Mint', bg: 'linear-gradient(135deg,#36E0C7 0%,#0EA5E9 100%)' },
  { name: 'Peach', bg: 'linear-gradient(135deg,#FFD3A5 0%,#FD6585 100%)' },
];

export default function BackgroundPanel() {
  const bg = useDocumentStore((s) => s.document.background);
  const setBg = useDocumentStore((s) => s.setBackground);
  const [tab, setTab] = useState<'color' | 'gradient' | 'image'>('gradient');

  return (
    <div className="space-y-3 text-sm">
      <div className="flex rounded-xl bg-white/5 p-1 text-xs">
        {(['color', 'gradient', 'image'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 transition-all ${
              tab === t ? 'bg-white/10 text-white shadow-sm' : 'text-ink-300 hover:text-white'
            }`}
          >
            {t === 'color' && <><Droplet className="mr-1 inline h-3 w-3" />纯色</>}
            {t === 'gradient' && <><Sparkles className="mr-1 inline h-3 w-3" />渐变</>}
            {t === 'image' && <><ImageIcon className="mr-1 inline h-3 w-3" />图片</>}
          </button>
        ))}
      </div>

      {tab === 'color' && (
        <div>
          <div className="label mb-2">纯色</div>
          <input
            type="color"
            className="h-12 w-full rounded-lg border border-white/10 bg-transparent"
            value={(bg as any).color ?? '#0B0F1A'}
            onChange={(e) => setBg({ type: 'color', color: e.target.value })}
          />
          <input
            className="input mt-2 font-mono"
            value={(bg as any).color ?? '#0B0F1A'}
            onChange={(e) => setBg({ type: 'color', color: e.target.value })}
          />
        </div>
      )}

      {tab === 'gradient' && (
        <div className="space-y-3">
          <div className="label">预设</div>
          <div className="grid grid-cols-3 gap-2">
            {palettes.map((p) => (
              <button
                key={p.name}
                onClick={() =>
                  setBg({
                    type: 'gradient',
                    gradient: { kind: 'linear', angle: 135, stops: parseStops(p.bg) },
                  })
                }
                className="group h-14 overflow-hidden rounded-lg border border-white/8 hover:border-white/30"
                style={{ background: p.bg }}
                title={p.name}
              />
            ))}
          </div>
          <div className="label">自定义渐变</div>
          <select
            className="input"
            value={(bg as any).gradient?.kind ?? 'linear'}
            onChange={(e) => {
              const kind = e.target.value as 'linear' | 'radial' | 'conic';
              setBg({ type: 'gradient', gradient: defaultGradient(kind) });
            }}
          >
            <option value="linear">Linear Gradient</option>
            <option value="radial">Radial Gradient</option>
            <option value="conic">Conic Gradient</option>
          </select>
          {(bg as any).gradient && (
            <div className="space-y-2">
              {(((bg as any).gradient.kind === 'linear' || (bg as any).gradient.kind === 'conic') && (
                <div>
                  <div className="mb-1 text-xs text-ink-300">角度</div>
                  <input type="range" min={0} max={360} value={(bg as any).gradient.angle} onChange={(e) => setBg({ type: 'gradient', gradient: { ...(bg as any).gradient, angle: +e.target.value } })} className="w-full accent-violet" />
                </div>
              ))}
              <div>
                <div className="mb-1 text-xs text-ink-300">停止点</div>
                {((bg as any).gradient.stops as any[]).map((s, i) => (
                  <div key={i} className="mb-1 flex items-center gap-2">
                    <input type="color" className="h-7 w-10 rounded" value={s.color} onChange={(e) => updateStop(i, 'color', e.target.value)} />
                    <input type="range" min={0} max={100} value={s.position} onChange={(e) => updateStop(i, 'position', +e.target.value)} className="flex-1 accent-violet" />
                    <span className="w-10 text-right font-mono text-[10px] text-ink-300">{s.position}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'image' && (
        <div className="space-y-2">
          <div className="label">图片 URL</div>
          <input
            className="input"
            value={(bg as any).src ?? ''}
            onChange={(e) => setBg({ type: 'image', src: e.target.value, fit: 'cover' })}
            placeholder="https://…"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1 text-xs text-ink-300">模糊</div>
              <input type="range" min={0} max={20} value={(bg as any).blur ?? 0} onChange={(e) => setBg({ ...(bg as any), blur: +e.target.value } as any)} className="w-full accent-violet" />
            </div>
            <div>
              <div className="mb-1 text-xs text-ink-300">亮度</div>
              <input type="range" min={50} max={150} value={(bg as any).brightness ?? 100} onChange={(e) => setBg({ ...(bg as any), brightness: +e.target.value } as any)} className="w-full accent-violet" />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function updateStop(i: number, key: 'color' | 'position', val: any) {
    const grad = (bg as any).gradient;
    const stops = grad.stops.map((s: any, idx: number) => (idx === i ? { ...s, [key]: val } : s));
    setBg({ type: 'gradient', gradient: { ...grad, stops } });
  }
}

function parseStops(linearCss: string) {
  // 简单解析: "linear-gradient(135deg,#7C5CFF 0%,#36E0C7 100%)"
  const match = linearCss.match(/linear-gradient\(([^)]+)\)/);
  if (!match) return [];
  return match[1].split(',').slice(1).map((s) => {
    const [color, pos] = s.trim().split(/\s+/);
    return { color, position: parseInt(pos) || 0 };
  });
}

function defaultGradient(kind: 'linear' | 'radial' | 'conic') {
  if (kind === 'linear') return { kind: 'linear' as const, angle: 135, stops: [{ color: '#1B1033', position: 0 }, { color: '#0B1B2E', position: 100 }] };
  if (kind === 'radial') return { kind: 'radial' as const, shape: 'circle' as const, position: { x: 50, y: 50 }, stops: [{ color: '#7C5CFF', position: 0 }, { color: '#0B0F1A', position: 100 }] };
  return { kind: 'conic' as const, angle: 0, position: { x: 50, y: 50 }, stops: [{ color: '#7C5CFF', position: 0 }, { color: '#36E0C7', position: 33 }, { color: '#FF7AB6', position: 66 }, { color: '#7C5CFF', position: 100 }] };
}
