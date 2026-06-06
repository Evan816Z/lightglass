import type { ThemeConfig, WindowConfig } from '@lightglass/shared';
import { CSSProperties, ReactNode, useRef } from 'react';
import { useCanvasScale } from '../canvas/CanvasArea';

export default function WindowFrame({
  window: w, theme, selected, onSelect, onChange, onBringFront, children,
}: {
  window: WindowConfig;
  theme: ThemeConfig;
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onChange: (patch: Partial<WindowConfig>) => void;
  onBringFront: () => void;
  children: ReactNode;
}) {
  const draggingRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const elRef = useRef<HTMLDivElement>(null);
  const scale = useCanvasScale();

  const themeClass = `theme-${theme.kind}`;
  const opacity = w.style?.opacity ?? theme.opacity ?? 1;
  const radius = w.style?.radius ?? theme.radius ?? 16;

  // 外框使用缩放后的尺寸; 内部内容用 transform: scale(scale) 保持原视觉
  const style: CSSProperties = {
    position: 'absolute',
    left: w.x * scale,
    top: w.y * scale,
    width: w.width * scale,
    height: w.height * scale,
    zIndex: w.zIndex,
    borderRadius: radius,
    opacity,
  };

  const headerH = w.chrome === false ? 0 : 32;
  const contentH = w.height - headerH;

  function onHeaderMouseDown(e: React.MouseEvent) {
    if (w.locked?.position) return;
    if ((e.target as HTMLElement).closest('button,input,textarea,video,audio')) return;
    onBringFront();
    draggingRef.current = {
      x: e.clientX,
      y: e.clientY,
      originX: w.x,
      originY: w.y,
    };
    const move = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = (ev.clientX - draggingRef.current.x) / scale;
      const dy = (ev.clientY - draggingRef.current.y) / scale;
      onChange({
        x: draggingRef.current.originX + dx,
        y: draggingRef.current.originY + dy,
      });
    };
    const up = () => {
      draggingRef.current = null;
      globalThis.removeEventListener('mousemove', move);
      globalThis.removeEventListener('mouseup', up);
    };
    globalThis.addEventListener('mousemove', move);
    globalThis.addEventListener('mouseup', up);
  }

  return (
    <div
      ref={elRef}
      data-window-id={w.id}
      style={style}
      onMouseDown={(e) => {
        onBringFront();
        onSelect(e);
      }}
      className={`group ${themeClass} relative overflow-hidden text-ink-100`}
    >
      {w.chrome !== false && (
        <div
          onMouseDown={onHeaderMouseDown}
          onDoubleClick={() => onChange({ chrome: false } as any)}
          className="drag-handle flex h-8 cursor-move select-none items-center gap-2 border-b border-white/5 px-3 text-xs"
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="ml-2 flex-1 truncate font-medium tracking-wide">{w.title}</div>
          <div className="flex items-center gap-1 text-ink-300 opacity-0 transition-opacity group-hover:opacity-100">
            {w.locked?.position ? <LockHint /> : null}
          </div>
        </div>
      )}
      {/* 内容层: 用 transform: scale 让内容视觉等比缩放, 但绝对定位按缩放后尺寸 */}
      {w.chrome !== false ? (
        <div
          className="absolute left-0 top-8 overflow-hidden"
          style={{ width: w.width * scale, height: contentH * scale }}
        >
          <div
            style={{
              width: w.width,
              height: contentH,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: w.width * scale, height: w.height * scale }}
        >
          <div
            style={{
              width: w.width,
              height: w.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      )}

      {selected && (
        <>
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-2 ring-violet" />
          <div className="pointer-events-none absolute -inset-1 rounded-[inherit] ring-1 ring-violet/30" />
        </>
      )}
    </div>
  );
}

function LockHint() {
  return <span className="text-[10px] text-ink-400">🔒 位置已锁</span>;
}
