import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Layers, LogOut, Trash2, Settings, Eye } from 'lucide-react';
import { api, useAuthStore } from '../store/auth';

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  updatedAt: string;
  createdAt: string;
}

export default function ConsolePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('My Desktop');
  const [slug, setSlug] = useState('my-desktop');

  async function load() {
    const res = await api<{ items: ProjectItem[] }>('/api/projects');
    setItems(res.items);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await api<{ project: ProjectItem }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, slug }),
    });
    setShowCreate(false);
    navigate(`/editor/${res.project.id}`);
  }

  async function remove(id: string) {
    if (!confirm('确认删除该项目?')) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet/20 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-mint/10 blur-3xl" />
      </div>

      {/* 顶栏 */}
      <header className="sticky top-0 z-20 glass">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-mint">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <div className="font-display font-semibold">LightGlass</div>
            <div className="ml-2 text-xs text-ink-400">控制台</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-300">{user?.displayName || user?.email}</span>
            <button className="btn btn-ghost" onClick={() => { clear(); navigate('/login'); }}>
              <LogOut className="h-4 w-4" /> 退出
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">我的项目</h1>
            <p className="mt-1 text-sm text-ink-400">选择已有项目进入编辑, 或新建一个空白桌面。</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" /> 新建项目
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* 新建卡片 */}
          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => setShowCreate(true)}
            className="glass group flex h-56 flex-col items-center justify-center gap-2 rounded-2xl border-dashed text-ink-300 hover:text-white"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 transition-all group-hover:bg-violet/20">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-sm">新建空白项目</div>
          </motion.button>

          {items.map((p) => (
            <motion.div
              key={p.id}
              whileHover={{ y: -2 }}
              className="glass relative overflow-hidden rounded-2xl"
            >
              <div
                className="relative h-36 cursor-pointer"
                onClick={() => navigate(`/editor/${p.id}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-violet/30 via-ink-800 to-mint/20" />
                <div className="absolute inset-0 bg-grid opacity-30" />
                <div className="absolute left-4 top-4 rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-ink-100 backdrop-blur">DRAFT</div>
                <div className="absolute bottom-3 left-4 right-4 font-display text-lg font-semibold tracking-tight">
                  {p.name}
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs text-ink-400">
                <span className="font-mono">/{p.slug}</span>
                <div className="flex items-center gap-1">
                  <a
                    href={`http://localhost:5174/?id=${p.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost h-7 px-2"
                    title="在访问端打开"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <button onClick={() => remove(p.id)} className="btn btn-ghost h-7 px-2 hover:!bg-rose-500/15 hover:!text-rose-200">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* 新建弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong w-[420px] rounded-2xl p-6"
          >
            <div className="mb-4 font-display text-lg font-semibold">新建项目</div>
            <div className="space-y-3">
              <div>
                <label className="label mb-1 block">名称</label>
                <input className="input" value={name} onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'project');
                }} />
              </div>
              <div>
                <label className="label mb-1 block">Slug</label>
                <input className="input font-mono" value={slug} onChange={(e) => setSlug(e.target.value)} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn" onClick={() => setShowCreate(false)}>取消</button>
              <button className="btn btn-primary" onClick={create}>创建并打开</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
