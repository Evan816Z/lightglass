/**
 * 轻量级 patch 工具, 用于在编辑器和访问端之间应用增量更新
 */
import type { ProjectDocument, WindowConfig } from '@lightglass/shared';

export interface Patch {
  id: string;
  remove?: boolean;
  fields?: Partial<WindowConfig>;
}

export function applyPatches(doc: ProjectDocument, patches: Patch[]): ProjectDocument {
  const map = new Map(doc.windows.map((w) => [w.id, w]));
  for (const p of patches) {
    if (p.remove) {
      map.delete(p.id);
    } else if (p.fields) {
      const prev = map.get(p.id);
      if (prev) map.set(p.id, { ...prev, ...p.fields });
    }
  }
  return { ...doc, windows: Array.from(map.values()) };
}

export function snapshotPatches(prev: WindowConfig[], next: WindowConfig[]): Patch[] {
  const before = new Map(prev.map((w) => [w.id, w]));
  const after = new Map(next.map((w) => [w.id, w]));
  const out: Patch[] = [];
  // removed
  for (const id of before.keys()) if (!after.has(id)) out.push({ id, remove: true });
  // added or changed
  for (const [id, w] of after) {
    const b = before.get(id);
    if (!b) {
      out.push({ id, fields: w });
    } else {
      const fields: any = {};
      let changed = false;
      for (const k of Object.keys(w) as (keyof WindowConfig)[]) {
        if (k === 'content') {
          if (JSON.stringify(b.content) !== JSON.stringify(w.content)) {
            fields.content = w.content;
            changed = true;
          }
        } else if (JSON.stringify((b as any)[k]) !== JSON.stringify((w as any)[k])) {
          fields[k] = (w as any)[k];
          changed = true;
        }
      }
      if (changed) out.push({ id, fields });
    }
  }
  return out;
}
