import type { WindowConfig } from '@lightglass/shared';
import { useUIStore } from '../../store/ui';
import { useDocumentStore } from '../../store/document';
import Inspector from '../panels/Inspector';
import ThemePanel from '../panels/ThemePanel';
import BackgroundPanel from '../panels/BackgroundPanel';
import AnimationPanel from '../panels/AnimationPanel';
import ProjectPanel from '../panels/ProjectPanel';
import { Settings, Palette, Sparkles, Wand2, Folder } from 'lucide-react';

const tabs = [
  { key: 'inspector', icon: Settings, label: '属性' },
  { key: 'theme', icon: Sparkles, label: '主题' },
  { key: 'background', icon: Palette, label: '背景' },
  { key: 'animation', icon: Wand2, label: '动画' },
  { key: 'project', icon: Folder, label: '项目' },
] as const;

export default function RightPanel({ selected, onUpdate }: { selected: WindowConfig[]; onUpdate: (id: string, patch: Partial<WindowConfig>) => void }) {
  const ui = useUIStore();
  return (
    <aside className="glass z-20 flex w-80 flex-col border-l border-white/5">
      <div className="flex border-b border-white/5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => ui.setRight(t.key)}
            className={`flex-1 py-2.5 text-xs transition-colors ${ui.rightPanel === t.key ? 'border-b-2 border-violet text-white' : 'text-ink-400 hover:text-white'}`}
          >
            <t.icon className="mx-auto mb-0.5 h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {ui.rightPanel === 'inspector' && <Inspector windows={selected} onUpdate={onUpdate} />}
        {ui.rightPanel === 'theme' && <ThemePanel />}
        {ui.rightPanel === 'background' && <BackgroundPanel />}
        {ui.rightPanel === 'animation' && <AnimationPanel windows={selected} onUpdate={onUpdate} />}
        {ui.rightPanel === 'project' && <ProjectPanel />}
      </div>
    </aside>
  );
}
