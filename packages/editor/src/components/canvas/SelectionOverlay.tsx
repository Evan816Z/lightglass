import { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../../store/document';
import { useSelectionStore } from '../../store/selection';
import { useCanvasScale } from './CanvasArea';

export default function SelectionOverlay() {
  const document_ = useDocumentStore((s) => s.document);
  const marquee = useSelectionStore((s) => s.marquee);
  const setMarquee = useSelectionStore((s) => s.setMarquee);
  const setMany = useSelectionStore((s) => s.setMany);
  const scale = useCanvasScale();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const root = document.querySelector('[data-canvas-root]') as HTMLDivElement | null;
    if (!root) return;
    rootRef.current = root;
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-window-id]')) return;
      if (target.closest('button,input,textarea,.toolbar,.panel')) return;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      setStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    function onMove(e: MouseEvent) {
      if (!start || !root) return;
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMarquee({
        x1: Math.min(start.x, x),
        y1: Math.min(start.y, y),
        x2: Math.max(start.x, x),
        y2: Math.max(start.y, y),
      });
    }
    function onUp() {
      if (marquee && root) {
        const ids: string[] = [];
        document_.windows.forEach((w) => {
          // marquee 与窗口都在缩放后的屏幕坐标系, 用 scale 换算窗口数据坐标
          const box = {
            x: w.x * scale,
            y: w.y * scale,
            width: w.width * scale,
            height: w.height * scale,
          };
          if (intersects(marquee, box)) ids.push(w.id);
        });
        if (ids.length > 0) setMany(ids);
      }
      setStart(null);
      setMarquee(null);
    }
    root.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      root.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [start, marquee, document_, setMany, setMarquee, scale]);

  if (!marquee) return null;

  return (
    <div
      className="pointer-events-none absolute z-50 rounded border border-violet/60 bg-violet/10"
      style={{
        left: marquee.x1,
        top: marquee.y1,
        width: marquee.x2 - marquee.x1,
        height: marquee.y2 - marquee.y1,
      }}
    />
  );
}

function intersects(box: any, w: { x: number; y: number; width: number; height: number }) {
  return !(box.x2 < w.x || box.x1 > w.x + w.width || box.y2 < w.y || box.y1 > w.y + w.height);
}
