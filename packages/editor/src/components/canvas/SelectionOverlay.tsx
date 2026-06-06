import { useEffect, useRef, useState } from 'react';
import { useDocumentStore } from '../../store/document';
import { useSelectionStore } from '../../store/selection';

export default function SelectionOverlay({ containerRef }: { containerRef: any }) {
  const document_ = useDocumentStore((s) => s.document);
  const marquee = useSelectionStore((s) => s.marquee);
  const setMarquee = useSelectionStore((s) => s.setMarquee);
  const setMany = useSelectionStore((s) => s.setMany);
  const rootRef = useRef<HTMLDivElement>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const root = containerRef?.current;
    if (!root) return;
    function onDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('[data-window-id]')) return;
      if (target.closest('button,input,textarea,.toolbar,.panel')) return;
      const rect = root.getBoundingClientRect();
      setStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    function onMove(e: MouseEvent) {
      if (!start) return;
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
      if (marquee) {
        const ids: string[] = [];
        document_.windows.forEach((w) => {
          if (intersects(marquee, w)) ids.push(w.id);
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
  }, [containerRef, start, marquee, document_, setMany, setMarquee]);

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
