export default function StatusBar({ saving, savedAt, selectedCount, windowCount }: any) {
  return (
    <div className="glass z-20 flex h-7 items-center justify-between border-t border-white/5 px-3 text-[11px] text-ink-400">
      <div className="flex items-center gap-3">
        <span>画布 1280 × 800</span>
        <span>·</span>
        <span>{windowCount} 窗口</span>
        <span>·</span>
        <span>已选 {selectedCount}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={saving ? 'text-amber-400' : 'text-mint'}>
          {saving ? '● 保存中' : `● ${savedAt ? '已同步' : '未保存'}`}
        </span>
        <span>v0.1.0</span>
      </div>
    </div>
  );
}
