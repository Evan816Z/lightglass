/**
 * Zod Schema — 前后端共用校验
 */
import { z } from 'zod';

const easingSchema = z.enum([
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'spring',
  'bounce',
]);

const animSpecSchema = z.object({
  type: z.enum(['fade', 'scale', 'translate', 'spring', 'bounce', 'none']),
  from: z.number().optional(),
  to: z.number().optional(),
  duration: z.number().int().nonnegative().optional(),
  delay: z.number().int().nonnegative().optional(),
  easing: easingSchema.optional(),
});

const animationSchema = z
  .object({
    open: animSpecSchema.optional(),
    close: animSpecSchema.optional(),
    loop: animSpecSchema.optional(),
  })
  .optional();

const backgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('color'), color: z.string() }),
  z.object({
    type: z.literal('gradient'),
    gradient: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('linear'),
        angle: z.number(),
        stops: z.array(z.object({ color: z.string(), position: z.number() })),
      }),
      z.object({
        kind: z.literal('radial'),
        shape: z.enum(['circle', 'ellipse']),
        position: z.object({ x: z.number(), y: z.number() }),
        stops: z.array(z.object({ color: z.string(), position: z.number() })),
      }),
      z.object({
        kind: z.literal('conic'),
        angle: z.number(),
        position: z.object({ x: z.number(), y: z.number() }),
        stops: z.array(z.object({ color: z.string(), position: z.number() })),
      }),
    ]),
  }),
  z.object({
    type: z.literal('image'),
    src: z.string().url().or(z.string().startsWith('/')),
    fit: z.enum(['cover', 'contain', 'fill', 'tile']).optional(),
    blur: z.number().nonnegative().optional(),
    brightness: z.number().optional(),
  }),
]);

const themeSchema = z.object({
  kind: z.enum(['liquid-glass', 'acrylic', 'glass', 'fluent', 'custom']),
  opacity: z.number().min(0).max(1).optional(),
  blur: z.number().min(0).max(100).optional(),
  radius: z.number().min(0).max(64).optional(),
  noise: z.number().min(0).max(1).optional(),
  gloss: z.number().min(0).max(1).optional(),
  customCss: z.string().optional(),
});

const textPropsSchema = z.object({
  html: z.string(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  fontWeight: z.number().optional(),
  color: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  shadow: z
    .object({ x: z.number(), y: z.number(), blur: z.number(), color: z.string() })
    .optional(),
  animation: animationSchema,
});

const imagePropsSchema = z.object({
  src: z.string(),
  alt: z.string().optional(),
  fit: z.enum(['cover', 'contain', 'fill', 'tile']).optional(),
  radius: z.number().optional(),
  shadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
});

const videoPropsSchema = z.object({
  src: z.string(),
  poster: z.string().optional(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  muted: z.boolean().optional(),
  controls: z.boolean().optional(),
  radius: z.number().optional(),
});

const audioPropsSchema = z.object({
  src: z.string(),
  autoplay: z.boolean().optional(),
  loop: z.boolean().optional(),
  volume: z.number().min(0).max(1).optional(),
  showPlayer: z.boolean().optional(),
});

const webPropsSchema = z.object({
  src: z.string(),
  sandbox: z.string().optional(),
  allow: z.string().optional(),
  radius: z.number().optional(),
});

const contentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('text'), props: textPropsSchema }),
  z.object({ type: z.literal('image'), props: imagePropsSchema }),
  z.object({ type: z.literal('video'), props: videoPropsSchema }),
  z.object({ type: z.literal('audio'), props: audioPropsSchema }),
  z.object({ type: z.literal('web'), props: webPropsSchema }),
]);

const windowStyleSchema = z
  .object({
    opacity: z.number().min(0).max(1).optional(),
    radius: z.number().min(0).max(64).optional(),
    shadow: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
    background: z.string().optional(),
    borderColor: z.string().optional(),
  })
  .optional();

const windowSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  zIndex: z.number().int(),
  chrome: z.boolean().optional(),
  locked: z
    .object({
      position: z.boolean().optional(),
      size: z.boolean().optional(),
    })
    .optional(),
  style: windowStyleSchema,
  animation: animationSchema,
  content: contentSchema,
});

/** 单个 JSON 窗口 (用于 JSON 导入) */
export const windowConfigSchema = windowSchema;

/** 完整项目文档 */
export const projectDocumentSchema = z.object({
  version: z.literal(1),
  canvas: z.object({ width: z.number().positive(), height: z.number().positive() }),
  background: backgroundSchema,
  theme: themeSchema,
  globalAudio: audioPropsSchema.optional(),
  windows: z.array(windowSchema),
});

/** 项目创建 */
export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  canvas: z
    .object({ width: z.number().positive(), height: z.number().positive() })
    .optional(),
});

/** 快照保存 */
export const saveSnapshotSchema = z.object({
  document: projectDocumentSchema,
});

/** 注册 / 登录 */
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type SaveSnapshotInput = z.infer<typeof saveSnapshotSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
