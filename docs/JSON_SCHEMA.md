# LightGlass JSON 配置规范

> 编辑器与访问端共享的 ProjectDocument 规范, 同时作为 JSON 导入导出的契约。

---

## 顶层结构

```ts
interface ProjectDocument {
  version: 1;                          // 固定
  canvas: { width: number; height: number };
  background: BackgroundConfig;
  theme: ThemeConfig;
  windows: WindowConfig[];             // 至少 0 个
  globalAudio?: AudioProps;            // 可选背景音乐
}
```

## Canvas

```json
{ "width": 1280, "height": 800 }
```

## Background

```ts
type BackgroundConfig =
  | { type: 'color';  color: string }                       // hex / rgb / hsl
  | { type: 'gradient'; gradient: Gradient }
  | { type: 'image'; src: string; fit?: 'cover'|'contain'|'fill'|'tile'; blur?: number; brightness?: number };

type Gradient =
  | { kind: 'linear'; angle: number; stops: { color: string; position: number }[] }
  | { kind: 'radial'; shape: 'circle'|'ellipse'; position: { x: number; y: number }; stops: ... }
  | { kind: 'conic';  angle: number; position: { x: number; y: number }; stops: ... };
```

示例:
```json
{
  "type": "gradient",
  "gradient": {
    "kind": "linear",
    "angle": 135,
    "stops": [
      { "color": "#1B1033", "position": 0 },
      { "color": "#0B1B2E", "position": 100 }
    ]
  }
}
```

## Theme

```ts
interface ThemeConfig {
  kind: 'liquid-glass' | 'acrylic' | 'glass' | 'fluent' | 'custom';
  opacity?: number;   // 0-1
  blur?: number;      // 0-100
  radius?: number;    // 0-64
  noise?: number;     // 0-1
  gloss?: number;     // 0-1
  customCss?: string; // kind = 'custom' 时使用
}
```

## Window

```ts
interface WindowConfig {
  id: string;                          // 唯一
  title: string;
  x: number; y: number;                // 画布坐标
  width: number; height: number;       // 像素, >= 50
  zIndex: number;                      // 整数
  chrome?: boolean;                    // 是否显示标题栏, 默认 true
  locked?: { position?: boolean; size?: boolean };
  style?: { opacity?: number; radius?: number; shadow?: 'none'|'sm'|'md'|'lg'|'xl'; background?: string; borderColor?: string };
  animation?: { open?: AnimSpec; close?: AnimSpec; loop?: AnimSpec };
  content: ContentConfig;
}

interface AnimSpec {
  type: 'fade'|'scale'|'translate'|'spring'|'bounce'|'none';
  from?: number; to?: number;
  duration?: number; delay?: number;
  easing?: 'linear'|'ease'|'ease-in'|'ease-out'|'ease-in-out'|'spring'|'bounce';
}
```

## Content

```ts
type ContentConfig =
  | { type: 'text';  props: TextProps  }
  | { type: 'image'; props: ImageProps }
  | { type: 'video'; props: VideoProps }
  | { type: 'audio'; props: AudioProps }
  | { type: 'web';   props: WebProps   };

interface TextProps  { html: string; fontFamily?: string; fontSize?: number; fontWeight?: number; color?: string; align?: 'left'|'center'|'right'; shadow?: { x:number; y:number; blur:number; color:string }; animation?: AnimationConfig; }
interface ImageProps { src: string; alt?: string; fit?: 'cover'|'contain'|'fill'|'tile'; radius?: number; shadow?: 'none'|'sm'|'md'|'lg'|'xl'; }
interface VideoProps { src: string; poster?: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean; radius?: number; }
interface AudioProps { src: string; autoplay?: boolean; loop?: boolean; volume?: number; showPlayer?: boolean; }
interface WebProps   { src: string; sandbox?: string; allow?: string; radius?: number; }
```

---

## 完整示例

```json
{
  "version": 1,
  "canvas": { "width": 1280, "height": 800 },
  "background": {
    "type": "gradient",
    "gradient": {
      "kind": "linear",
      "angle": 135,
      "stops": [
        { "color": "#1B1033", "position": 0 },
        { "color": "#0B1B2E", "position": 100 }
      ]
    }
  },
  "theme": { "kind": "liquid-glass", "opacity": 0.7, "blur": 36, "radius": 24, "gloss": 0.8 },
  "globalAudio": { "src": "/uploads/bg.mp3", "autoplay": true, "loop": true, "volume": 0.6 },
  "windows": [
    {
      "id": "w-welcome",
      "title": "欢迎",
      "x": 120, "y": 120,
      "width": 460, "height": 280,
      "zIndex": 1,
      "style": { "radius": 20, "shadow": "lg" },
      "animation": {
        "open": { "type": "spring", "duration": 320, "easing": "ease-out" }
      },
      "content": {
        "type": "text",
        "props": {
          "html": "<h2>欢迎来到 LightGlass</h2><p>这是 <b>WYSIWYG</b> Web 桌面。</p>",
          "fontSize": 16, "color": "#E6EAF2"
        }
      }
    },
    {
      "id": "w-image",
      "title": "封面",
      "x": 640, "y": 140,
      "width": 520, "height": 360,
      "zIndex": 2,
      "content": {
        "type": "image",
        "props": {
          "src": "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800",
          "fit": "cover", "radius": 18, "shadow": "xl"
        }
      }
    },
    {
      "id": "w-video",
      "title": "演示视频",
      "x": 160, "y": 460,
      "width": 520, "height": 300,
      "zIndex": 3,
      "content": {
        "type": "video",
        "props": {
          "src": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          "autoplay": true, "loop": true, "muted": true
        }
      }
    },
    {
      "id": "w-web",
      "title": "嵌入页面",
      "x": 720, "y": 480,
      "width": 460, "height": 280,
      "zIndex": 4,
      "content": {
        "type": "web",
        "props": { "src": "https://example.com", "radius": 12 }
      }
    }
  ]
}
```

---

## 校验

- 服务端: `POST /api/json/project/validate` (整文档) / `POST /api/json/window/validate` (单窗口)
- 编辑器: JSON 编辑器面板支持一键导入, 失败时显示 Zod 报错

## 版本管理

- 当前版本: `1`
- 兼容性: 后续大版本升级通过 `version` 字段判定, 旧版本可由迁移器转换
