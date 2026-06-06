import { useEffect, useRef } from 'react';
import type { ContentProps, TextProps, ImageProps, VideoProps, AudioProps, WebProps } from '@lightglass/shared';

export default function WidgetRenderer({
  content, readOnly, windowId,
}: {
  content: ContentProps;
  readOnly: boolean;
  windowId: string;
}) {
  if (content.type === 'text') return <TextWidget props={content.props} readOnly={readOnly} />;
  if (content.type === 'image') return <ImageWidget props={content.props} />;
  if (content.type === 'video') return <VideoWidget props={content.props} />;
  if (content.type === 'audio') return <AudioWidget props={content.props} />;
  if (content.type === 'web') return <WebWidget props={content.props} />;
  return null;
}

function TextWidget({ props, readOnly }: { props: TextProps; readOnly: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.contentEditable = readOnly ? 'false' : 'true';
  }, [readOnly]);
  return (
    <div
      ref={ref}
      className="h-full w-full overflow-auto p-4 outline-none"
      style={{
        fontFamily: props.fontFamily,
        fontSize: props.fontSize,
        fontWeight: props.fontWeight,
        color: props.color,
        textAlign: props.align,
        textShadow: props.shadow ? `${props.shadow.x}px ${props.shadow.y}px ${props.shadow.blur}px ${props.shadow.color}` : undefined,
      }}
      onBlur={(e) => {
        if (readOnly) return;
        // 触发保存 (简单地更新 innerHTML, 实际项目中可派发事件)
        props.html = e.currentTarget.innerHTML;
      }}
      dangerouslySetInnerHTML={{ __html: props.html }}
    />
  );
}

function ImageWidget({ props }: { props: ImageProps }) {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden p-2">
      <img
        src={props.src}
        alt={props.alt}
        draggable={false}
        className="max-h-full max-w-full"
        style={{
          width: '100%',
          height: '100%',
          objectFit: (props.fit === 'tile' ? 'cover' : (props.fit ?? 'cover')) as React.CSSProperties['objectFit'],
          borderRadius: props.radius ?? 0,
          boxShadow: shadowToCss(props.shadow),
        }}
      />
    </div>
  );
}

function VideoWidget({ props }: { props: VideoProps }) {
  return (
    <div className="h-full w-full overflow-hidden bg-black">
      <video
        src={props.src}
        poster={props.poster}
        autoPlay={props.autoplay}
        loop={props.loop}
        muted={props.muted}
        controls={props.controls}
        playsInline
        className="h-full w-full"
        style={{ objectFit: 'cover', borderRadius: props.radius ?? 0 }}
      />
    </div>
  );
}

function AudioWidget({ props }: { props: AudioProps }) {
  if (!props.src) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-ink-400">
        双击设置音频 URL
      </div>
    );
  }
  if (!props.showPlayer) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs text-ink-300">
        <span className="glass rounded-full px-3 py-1.5 text-[11px]">🔊 背景音乐</span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center p-3">
      <audio
        src={props.src}
        autoPlay={props.autoplay}
        loop={props.loop}
        controls
        className="w-full"
        style={{ filter: 'invert(0.85) hue-rotate(180deg)' }}
      />
    </div>
  );
}

function WebWidget({ props }: { props: WebProps }) {
  return (
    <iframe
      src={props.src}
      sandbox={props.sandbox as any}
      allow={props.allow}
      className="h-full w-full border-0"
      style={{ borderRadius: props.radius ?? 0 }}
    />
  );
}

function shadowToCss(s: ImageProps['shadow']) {
  if (!s || s === 'none') return 'none';
  return ({
    sm: '0 1px 2px rgba(0,0,0,.25)',
    md: '0 4px 12px rgba(0,0,0,.35)',
    lg: '0 12px 32px rgba(0,0,0,.45)',
    xl: '0 24px 64px rgba(0,0,0,.55)',
  } as const)[s];
}
