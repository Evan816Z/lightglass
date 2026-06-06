import { ReactNode, useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../../store/document';
import { useUIStore } from '../../store/ui';

export default function CanvasArea({ children, containerRef }: { children: ReactNode; containerRef: any }) {
  const document_ = useDocumentStore((s) => s.document);
  const showGrid = useUIStore((s) => s.showGrid);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function calc() {
      const wrapper = containerRef?.current;
      if (!wrapper) return;
      const padding = 64;
      const sx = (wrapper.clientWidth - padding) / document_.canvas.width;
      const sy = (wrapper.clientHeight - padding) / document_.canvas.height;
      setScale(Math.min(1, Math.min(sx, sy)));
    }
    calc();
    const ro = new ResizeObserver(calc);
    if (containerRef?.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, document_.canvas.width, document_.canvas.height]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
      }}
      className="relative h-full w-full overflow-auto bg-ink-950"
    >
      <div
        className="absolute inset-0 bg-grid opacity-30"
        style={{ backgroundSize: `${24 * scale}px ${24 * scale}px` }}
      />
      <div
        className="relative mx-auto my-12"
        style={{ width: document_.canvas.width * scale, height: document_.canvas.height * scale }}
      >
        <div
          ref={innerRef}
          data-canvas-root
          className={`viewport-frame absolute left-0 top-0 ${showGrid ? 'bg-grid' : ''}`}
          style={{
            width: document_.canvas.width,
            height: document_.canvas.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            backgroundSize: `${24}px ${24}px`,
          }}
        >
          {children}
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-ink-300">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
