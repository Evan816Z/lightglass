/**
 * LightGlass 共享类型
 * 前后端共用的领域模型定义
 */

export type ID = string;

/* ----------------------------- 主题与背景 ----------------------------- */

export type GradientStop = { color: string; position: number };
export type GradientKind = 'linear' | 'radial' | 'conic';

export interface LinearGradient {
  kind: 'linear';
  angle: number; // 0-360
  stops: GradientStop[];
}
export interface RadialGradient {
  kind: 'radial';
  shape: 'circle' | 'ellipse';
  position: { x: number; y: number }; // 0-100 %
  stops: GradientStop[];
}
export interface ConicGradient {
  kind: 'conic';
  angle: number;
  position: { x: number; y: number };
  stops: GradientStop[];
}
export type Gradient = LinearGradient | RadialGradient | ConicGradient;

export type ColorInput =
  | { type: 'solid'; color: string } // hex / rgb / hsl
  | { type: 'gradient'; value: Gradient };

export type ImageFit = 'cover' | 'contain' | 'fill' | 'tile';

export interface ImageBackground {
  type: 'image';
  src: string; // url
  fit?: ImageFit;
  blur?: number; // px
  brightness?: number; // 0-200
}

export type BackgroundConfig =
  | { type: 'color'; color: string }
  | { type: 'gradient'; gradient: Gradient }
  | ImageBackground;

/* ----------------------------- 主题效果 ----------------------------- */

export type ThemeKind = 'liquid-glass' | 'acrylic' | 'glass' | 'fluent' | 'custom';

export interface ThemeConfig {
  kind: ThemeKind;
  /** 0-1, 全局透明度 */
  opacity?: number;
  /** 0-100, 全局模糊 */
  blur?: number;
  /** 0-32, 全局圆角 */
  radius?: number;
  /** 0-1, 噪点强度 */
  noise?: number;
  /** 0-1, 高光强度 */
  gloss?: number;
  /** 自定义 CSS 字符串 (kind = custom) */
  customCss?: string;
}

/* ----------------------------- 动画 ----------------------------- */

export type Easing =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'spring'
  | 'bounce';

export interface AnimSpec {
  type: 'fade' | 'scale' | 'translate' | 'spring' | 'bounce' | 'none';
  from?: number;
  to?: number;
  duration?: number; // ms
  delay?: number; // ms
  easing?: Easing;
}

export interface AnimationConfig {
  open?: AnimSpec;
  close?: AnimSpec;
  loop?: AnimSpec;
}

/* ----------------------------- 窗口 ----------------------------- */

export interface WindowLock {
  position?: boolean;
  size?: boolean;
}

export interface WindowStyle {
  opacity?: number; // 0-1
  radius?: number; // px
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  background?: string; // 颜色或渐变
  borderColor?: string;
}

export interface WindowBase {
  id: ID;
  title: string;
  /** 左上角位置 (相对画布) */
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  /** 是否显示标题栏 */
  chrome?: boolean;
  /** 锁定 */
  locked?: WindowLock;
  style?: WindowStyle;
  animation?: AnimationConfig;
}

/* ----------------------------- 组件内容 ----------------------------- */

export interface TextProps {
  html: string; // 富文本 (HTML 字符串, 渲染时 sanitized)
  fontFamily?: string;
  fontSize?: number; // px
  fontWeight?: number; // 100-900
  color?: string;
  align?: 'left' | 'center' | 'right';
  shadow?: { x: number; y: number; blur: number; color: string };
  animation?: AnimationConfig;
}

export interface ImageProps {
  src: string;
  alt?: string;
  fit?: ImageFit;
  radius?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface VideoProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  radius?: number;
}

export interface AudioProps {
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  volume?: number; // 0-1
  showPlayer?: boolean;
}

export interface WebProps {
  src: string; // url
  sandbox?: string; // iframe sandbox
  allow?: string;
  radius?: number;
}

export type ContentKind = 'text' | 'image' | 'video' | 'audio' | 'web';

export type ContentProps =
  | { type: 'text'; props: TextProps }
  | { type: 'image'; props: ImageProps }
  | { type: 'video'; props: VideoProps }
  | { type: 'audio'; props: AudioProps }
  | { type: 'web'; props: WebProps };

/* ----------------------------- 文档根 ----------------------------- */

export interface WindowConfig extends WindowBase {
  content: ContentProps;
}

export interface ProjectDocument {
  version: 1;
  /** 画布尺寸, 用于编辑器与访问端的 1:1 渲染 */
  canvas: { width: number; height: number };
  background: BackgroundConfig;
  theme: ThemeConfig;
  /** 全局背景音乐 */
  globalAudio?: AudioProps;
  windows: WindowConfig[];
}

/* ----------------------------- 实体 ----------------------------- */

export interface Project {
  id: ID;
  ownerId: ID;
  name: string;
  slug: string;
  thumbnail?: string;
  canvas: { width: number; height: number };
  theme: ThemeConfig;
  background: BackgroundConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSnapshot {
  id: ID;
  projectId: ID;
  version: number;
  document: ProjectDocument;
  createdAt: string;
}

export interface MediaAsset {
  id: ID;
  projectId: ID;
  url: string;
  mime: string;
  size: number;
  kind: 'image' | 'video' | 'audio' | 'other';
  createdAt: string;
}

export interface User {
  id: ID;
  email: string;
  displayName?: string;
  createdAt: string;
}
