import { ReactNode, useEffect, useRef, useState, createContext, useContext } from 'react';
import { useDocumentStore } from '../../store/document';
import { useUIStore } from '../../store/ui';

/** 画布缩放上下文: 供子组件 (WindowFrame / SelectionOverlay) 把数据坐标换算到屏幕坐标 */
const CanvasScaleContext = createContext<number>(1);
export const useCanvasScale = () => useContext(CanvasScaleContext);

export default function CanvasArea({ children, containerRef }: { children: ReactNode; containerRef: any }) {
  const document_ = useDocumentStore((s) => s.document);
  const showGrid = useUIStore((s) => s.showGrid);
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
    window.addEventListener('resize', calc);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, [containerRef, document_.canvas.width, document_.canvas.height]);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
      }}
      className="relative h-full w-full overflow-auto bg-ink-950"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-grid opacity-30"
        style={{ backgroundSize: `${24 * scale}px ${24 * scale}px` }}
      />
      <CanvasScaleContext.Provider value={scale}>
        <div
          data-canvas-root
          className={`relative mx-auto my-12 viewport-frame overflow-hidden ${showGrid ? 'bg-grid' : ''}`}
          style={{
            width: document_.canvas.width * scale,
            height: document_.canvas.height * scale,
            backgroundSize: `${24}px ${24}px`,
          }}
        >
          {children}
        </div>
      </CanvasScaleContext.Provider>
      <div className="pointer-events-none absolute bottom-2 right-3 rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-ink-300">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
