import { useEffect } from 'react';

type Combo = string;

function parseCombo(combo: string) {
  const parts = combo.toLowerCase().split('+');
  return {
    mod: parts.includes('mod'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    key: parts[parts.length - 1],
  };
}

function matches(e: KeyboardEvent, combo: ReturnType<typeof parseCombo>) {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const mod = isMac ? e.metaKey : e.ctrlKey;
  if (combo.mod !== mod) return false;
  if (combo.shift !== e.shiftKey) return false;
  if (combo.alt !== e.altKey) return false;
  return e.key.toLowerCase() === combo.key;
}

export function useHotkeys(map: Partial<Record<Combo, (e: KeyboardEvent) => void>>) {
  useEffect(() => {
    const parsed: Array<[ReturnType<typeof parseCombo>, (e: KeyboardEvent) => void]> = [];
    for (const [combo, fn] of Object.entries(map)) {
      if (fn) parsed.push([parseCombo(combo), fn]);
    }
    function onDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // 在输入框中只响应 esc
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        if (e.key === 'Escape') {
          (target as HTMLElement).blur();
        }
        return;
      }
      for (const [c, fn] of parsed) {
        if (matches(e, c)) {
          e.preventDefault();
          fn(e);
          return;
        }
      }
    }
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [map]);
}
