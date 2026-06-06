import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layers, Sparkles, Wand2, Cpu } from 'lucide-react';
import { api, useAuthStore } from '../store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('demo@lightglass.dev');
  const [password, setPassword] = useState('demo1234');
  const [displayName, setDisplayName] = useState('Designer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { email, password, displayName };
      const res = await api<{ user: any; token: string }>(path, { method: 'POST', body: JSON.stringify(body) });
      setAuth(res.user, res.token);
      navigate('/console');
    } catch (err: any) {
      setError(err?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 */}
      <div className="absolute inset-0 bg-ink-950" />
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-violet/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-mint/20 blur-3xl" />
        <div className="absolute inset-0 bg-grid opacity-30" />
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-2">
        {/* 左侧品牌 */}
        <div className="hidden flex-col justify-between p-12 lg:flex">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet to-mint">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div className="font-display text-lg font-semibold tracking-tight">LightGlass</div>
          </div>

          <div className="max-w-md">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-ink-200">
              <Sparkles className="h-3.5 w-3.5 text-mint" /> 现代化 Web 桌面编辑系统
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              像搭积木一样
              <br />
              搭建你的 <span className="bg-gradient-to-r from-violet to-mint bg-clip-text text-transparent">Web 桌面</span>
            </h1>
            <p className="mt-4 text-ink-300">
              拖拽窗口、组合组件、套用玻璃主题。编辑器与访问端完全分离，所见即所得。
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Wand2, label: '玻璃主题' },
                { icon: Cpu, label: 'WebSocket 同步' },
                { icon: Layers, label: 'JSON 导入' },
              ].map((f) => (
                <div key={f.label} className="glass rounded-2xl p-3">
                  <f.icon className="h-4 w-4 text-mint" />
                  <div className="mt-2 text-xs text-ink-200">{f.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-ink-400">© LightGlass · 0.1.0</div>
        </div>

        {/* 右侧表单 */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <motion.form
            onSubmit={submit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong relative w-full max-w-md rounded-3xl p-8"
          >
            <div className="mb-6 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet to-mint lg:hidden">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <div className="font-display text-base font-semibold">
                {mode === 'login' ? '欢迎回来' : '创建账号'}
              </div>
            </div>

            <div className="mb-4 flex rounded-xl bg-white/5 p-1 text-sm">
              {(['login', 'register'] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 rounded-lg py-1.5 transition-all ${
                    mode === m ? 'bg-white/10 text-white shadow-sm' : 'text-ink-300 hover:text-white'
                  }`}
                >
                  {m === 'login' ? '登录' : '注册'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {mode === 'register' && (
                <div>
                  <label className="label mb-1 block">显示名</label>
                  <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Designer" />
                </div>
              )}
              <div>
                <label className="label mb-1 block">邮箱</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="label mb-1 block">密码</label>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 位" />
              </div>
            </div>

            {error && <div className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">{error}</div>}

            <button type="submit" disabled={loading} className="btn btn-primary mt-5 h-10 w-full text-sm">
              {loading ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
            </button>

            <div className="mt-4 text-center text-xs text-ink-400">
              首次使用? 直接 <button type="button" onClick={() => setMode('register')} className="text-mint hover:underline">注册</button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
