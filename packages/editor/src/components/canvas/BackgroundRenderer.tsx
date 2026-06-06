import type { BackgroundConfig } from '@lightglass/shared';

export default function BackgroundRenderer({ background }: { background: BackgroundConfig }) {
  if (background.type === 'color') {
    return <div className="absolute inset-0" style={{ background: background.color }} />;
  }
  if (background.type === 'gradient') {
    const g = background.gradient;
    const stops = g.stops.map((s) => `${s.color} ${s.position}%`).join(', ');
    if (g.kind === 'linear') {
      return (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(${g.angle}deg, ${stops})` }}
        />
      );
    }
    if (g.kind === 'radial') {
      return (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(${g.shape} at ${g.position.x}% ${g.position.y}%, ${stops})` }}
        />
      );
    }
    return (
      <div
        className="absolute inset-0"
        style={{ background: `conic-gradient(from ${g.angle}deg at ${g.position.x}% ${g.position.y}%, ${stops})` }}
      />
    );
  }
  // image
  return (
    <>
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
    </>
  );
}
