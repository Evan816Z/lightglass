import { useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import { Wifi, WifiOff, Layers } from 'lucide-react';

import type { ProjectDocument, ThemeConfig, BackgroundConfig, WindowConfig, ContentProps } from '@lightglass/shared';

function getProjectId(): string | null {
  const url = new URL(location.href);
  return url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || null;
}

export default function App() {
  const projectId = useMemo(getProjectId, []);
  const [doc, setDoc] = useState<ProjectDocument | null>(null);
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline' | 'error'>('connecting');
  const [error, setError] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    if (!projectId) {
      setError('未指定 projectId, 请使用 ?id=xxx 访问');
      setStatus('error');
      return;
    }
    let alive = true;
    let socket: Socket | null = null;
    let pollTimer: any = null;

    async function fetchInitial() {
      try {
        const res = await fetch(`/api/snapshots/public/${projectId}/latest`);
        if (!res.ok) throw new Error('加载失败');
        const data = await res.json();
        if (!alive) return;
        setDoc(data.snapshot.document);
        setProjectName(data.project?.name ?? '');
        setStatus('live');
      } catch (e: any) {
        if (!alive) return;
        setError(e.message);
        setStatus('error');
      }
    }

    function connectWS() {
      socket = io({ transports: ['websocket', 'polling'] });
      socket.on('connect', () => {
        socket?.emit('viewer:join', { projectId });
        setStatus('live');
      });
      socket.on('disconnect', () => {
        setStatus('offline');
        // 兜底轮询
        if (!pollTimer) pollTimer = setInterval(fetchInitial, 5000);
      });
      socket.on('connect_error', () => {
        setStatus('offline');
        if (!pollTimer) pollTimer = setInterval(fetchInitial, 5000);
      });
      socket.on('project:full', (p: any) => {
        if (p?.document) setDoc(p.document);
      });
      socket.on('project:update', () => {
        // 简化: 直接请求一次全量
        fetchInitial();
      });
    }

    fetchInitial().then(connectWS);

    function resize() {
      const padding = 24;
      const sx = (window.innerWidth - padding) / (doc?.canvas.width ?? 1280);
      const sy = (window.innerHeight - padding) / (doc?.canvas.height ?? 800);
      setScale(Math.min(1, Math.min(sx, sy)));
    }
    resize();
    window.addEventListener('resize', resize);

    return () => {
      alive = false;
      socket?.disconnect();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // 每次 doc 变化时, 重新计算一次 scale
  useEffect(() => {
    if (!doc) return;
    const padding = 24;
    const sx = (window.innerWidth - padding) / doc.canvas.width;
    const sy = (window.innerHeight - padding) / doc.canvas.height;
    setScale(Math.min(1, Math.min(sx, sy)));
  }, [doc?.canvas.width, doc?.canvas.height]);

  if (status === 'error') {
    return (
      <Center>
        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="text-3xl">😶</div>
          <div className="mt-3 font-display text-lg">{error}</div>
          <a href="/" className="mt-4 inline-block text-sm text-mint hover:underline">返回</a>
        </div>
      </Center>
    );
  }

  if (!doc) {
    return (
      <Center>
        <div className="flex items-center gap-3 text-ink-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-violet" />
          加载中…
        </div>
      </Center>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-ink-950">
      <div className="absolute inset-0 origin-top-left" style={{ transform: `scale(${scale})`, width: doc.canvas.width, height: doc.canvas.height }}>
        <BackgroundLayer background={doc.background} />
        {doc.globalAudio && doc.globalAudio.src && (
          <audio
            src={doc.globalAudio.src}
            autoPlay
            loop
            ref={(el) => { if (el && doc.globalAudio?.volume != null) el.volume = doc.globalAudio.volume; }}
          />
        )}
        {doc.windows
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((w) => (
            <ReadOnlyWindow key={w.id} window={w} theme={doc.theme} />
          ))}
      </div>

      {/* 状态条 */}
      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2">
        <StatusPill status={status} />
        {projectName && (
          <div className="glass rounded-full px-3 py-1 text-xs text-ink-200">
            <Layers className="mr-1 inline h-3 w-3 text-mint" />{projectName}
          </div>
        )}
      </div>
    </div>
  );
}

function BackgroundLayer({ background }: { background: BackgroundConfig }) {
  if (background.type === 'color') return <div className="absolute inset-0" style={{ background: background.color }} />;
  if (background.type === 'gradient') {
    const g = background.gradient;
    const stops = g.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    if (g.kind === 'linear') return <div className="absolute inset-0" style={{ background: `linear-gradient(${g.angle}deg, ${stops})` }} />;
    if (g.kind === 'radial') return <div className="absolute inset-0" style={{ background: `radial-gradient(${g.shape} at ${g.position.x}% ${g.position.y}%, ${stops})` }} />;
    return <div className="absolute inset-0" style={{ background: `conic-gradient(from ${g.angle}deg at ${g.position.x}% ${g.position.y}%, ${stops})` }} />;
  }
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `url(${background.src})`,
        backgroundSize: background.fit === 'tile' ? 'auto' : background.fit ?? 'cover',
        backgroundRepeat: background.fit === 'tile' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        filter: `blur(${background.blur ?? 0}px) brightness(${(background.brightness ?? 100) / 100})`,
      }}
    />
  );
}

function ReadOnlyWindow({ window, theme }: { window: WindowConfig; theme: ThemeConfig }) {
  const themeClass = `theme-${theme.kind}`;
  const style: React.CSSProperties = {
    position: 'absolute',
    left: window.x,
    top: window.y,
    width: window.width,
    height: window.height,
    zIndex: window.zIndex,
    borderRadius: window.style?.radius ?? theme.radius ?? 16,
    opacity: window.style?.opacity ?? theme.opacity ?? 1,
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={style}
      className={`${themeClass} overflow-hidden text-ink-100`}
    >
      {window.chrome !== false && (
        <div className="flex h-8 select-none items-center gap-2 border-b border-white/5 px-3 text-xs">
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="ml-2 flex-1 truncate font-medium tracking-wide text-ink-200">{window.title}</div>
        </div>
      )}
      <div className="absolute inset-0 top-8 overflow-hidden">
        <Widget content={window.content} />
      </div>
    </motion.div>
  );
}

function Widget({ content }: { content: ContentProps }) {
  if (content.type === 'text') {
    return (
      <div
        className="h-full w-full overflow-auto p-4"
        style={{
          fontFamily: content.props.fontFamily,
          fontSize: content.props.fontSize,
          fontWeight: content.props.fontWeight,
          color: content.props.color,
          textAlign: content.props.align,
          textShadow: content.props.shadow ? `${content.props.shadow.x}px ${content.props.shadow.y}px ${content.props.shadow.blur}px ${content.props.shadow.color}` : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: content.props.html }}
      />
    );
  }
  if (content.type === 'image') {
    const fit = (content.props.fit === 'tile' ? 'cover' : content.props.fit ?? 'cover') as React.CSSProperties['objectFit'];
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden p-2">
        <img src={content.props.src} alt={content.props.alt ?? ''} className="max-h-full max-w-full" style={{ width: '100%', height: '100%', objectFit: fit, borderRadius: content.props.radius ?? 0 }} />
      </div>
    );
  }
  if (content.type === 'video') {
    return (
      <video
        src={content.props.src}
        poster={content.props.poster}
        autoPlay={content.props.autoplay}
        loop={content.props.loop}
        muted={content.props.muted}
        controls={content.props.controls}
        playsInline
        className="h-full w-full"
        style={{ objectFit: 'cover', borderRadius: content.props.radius ?? 0 }}
      />
    );
  }
  if (content.type === 'audio') {
    if (!content.props.src) return null;
    if (!content.props.showPlayer) return null;
    return (
      <div className="flex h-full w-full items-center justify-center p-3">
        <audio src={content.props.src} autoPlay={content.props.autoplay} loop={content.props.loop} controls className="w-full" style={{ filter: 'invert(0.85) hue-rotate(180deg)' }} />
      </div>
    );
  }
  if (content.type === 'web') {
    return <iframe src={content.props.src} className="h-full w-full border-0" sandbox={content.props.sandbox as any} />;
  }
  return null;
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid h-full w-full place-items-center">{children}</div>;
}

function StatusPill({ status }: { status: 'connecting' | 'live' | 'offline' | 'error' }) {
  const map = {
    connecting: { text: '连接中…', color: 'bg-amber-400' },
    live: { text: '实时同步', color: 'bg-mint' },
    offline: { text: '已离线 (兜底轮询)', color: 'bg-rose-400' },
    error: { text: '加载失败', color: 'bg-rose-500' },
  } as const;
  const { text, color } = map[status];
  return (
    <div className="glass flex items-center gap-2 rounded-full px-3 py-1 text-xs text-ink-200">
      <span className={`h-1.5 w-1.5 rounded-full ${color} ${status === 'connecting' || status === 'live' ? 'animate-pulse' : ''}`} />
      {status === 'live' ? <Wifi className="h-3 w-3 text-mint" /> : <WifiOff className="h-3 w-3 text-rose-300" />}
      {text}
    </div>
  );
}
