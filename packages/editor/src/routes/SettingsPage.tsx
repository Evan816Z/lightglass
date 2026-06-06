import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Bell } from 'lucide-react';
import { useAuthStore } from '../store/auth';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <header className="sticky top-0 z-20 glass">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-6">
          <button className="btn btn-ghost" onClick={() => navigate('/console')}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="font-display font-semibold">个人设置</div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <section className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center gap-2">
            <User className="h-4 w-4 text-mint" />
            <h2 className="font-display text-base font-semibold">账户</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label mb-1 block">邮箱</label>
              <input className="input" value={user?.email ?? ''} readOnly />
            </div>
            <div>
              <label className="label mb-1 block">显示名</label>
              <input className="input" value={user?.displayName ?? ''} placeholder="未设置" />
            </div>
          </div>
        </section>

        <section className="glass rounded-2xl p-6">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-mint" />
            <h2 className="font-display text-base font-semibold">通知</h2>
          </div>
          <p className="text-sm text-ink-300">访问端同步、媒体自动播放等事件通知 (开发中)。</p>
        </section>
      </main>
    </div>
  );
}
