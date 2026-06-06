# LightGlass

> 现代化 Web 可视化桌面编辑系统 · 编辑器与访问端完全分离 · WebSocket 实时同步

![status](https://img.shields.io/badge/status-MVP-7C5CFF) ![tech](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%20%2B%20TS-36E0C7)

## 特性

- **可视化桌面编辑**: 拖拽、缩放、对齐、吸附、网格、辅助线、撤销/重做、复制/粘贴
- **窗口系统**: 拖动 / 8 向缩放 / 最大化 / 最小化 / 锁定位置 / 锁定尺寸 / 透明度 / 圆角 / 阴影
- **内容组件**: 文字 (富文本) · 图片 · 视频 · 音频 · Web (iframe)
- **背景系统**: 纯色 / 渐变 (Linear / Radial / Conic) / 图片
- **主题**: 液态玻璃 / 亚克力 / Glassmorphism / Fluent 11 / 自定义 CSS
- **动画**: 淡入 / 缩放 / 平移 / 弹性, Duration / Delay / Easing
- **JSON 导入**: 整文档或单窗口, Zod 校验
- **项目管理**: 多项目 / 快照 / 发布 / 导入导出
- **WebSocket 实时同步**: 编辑器 ↔ 访问端, 增量 patch + 全量兜底
- **响应式**: 编辑器自适应 1280+, 访问端 PC / 平板 / 手机

## 架构

```
┌──────────────┐    ┌──────────────┐
│ Editor (5173)│    │ Viewer (5174)│
│ React 19     │    │ React 19     │
│ Vite + TS    │    │ Vite + TS    │
└──────┬───────┘    └──────┬───────┘
       │ REST + WS         │ WS
       ▼                   ▼
┌──────────────────────────────────┐
│  Server (4000)                   │
│  Express + Socket.IO             │
│  Zod 校验 · JWT 鉴权             │
│  JSON 文件持久化 (默认) / PG 可切 │
└──────────────────────────────────┘
```

详见 [docs/ARCHITECTURE.md](.trae/documents/ARCHITECTURE.md) 与 [docs/API.md](docs/API.md)。

## 快速开始

```bash
# 1) 安装依赖
pnpm install

# 2) 同时启动 editor / viewer / server
pnpm dev

# 3) 打开浏览器
#   - 编辑器: http://localhost:5173
#   - 访问端: http://localhost:5174/?id=<projectId>
```

首次访问 `/console` 时, 用任意邮箱注册即可 (默认开启开放注册)。后端会写入 `data/db.json` 与 `public/uploads/`。

### 单独启动

```bash
pnpm --filter @lightglass/server start
pnpm --filter @lightglass/editor dev
pnpm --filter @lightglass/viewer dev
```

### 生产构建

```bash
pnpm build
# 构建产物:
#   public/editor/*   由 editor 包
#   public/viewer/*   由 viewer 包
#   packages/server/dist (已配置, 启动用 tsx)
```

## 目录

```
.
├── packages/
│   ├── shared/         # 共享类型 / Zod Schema / WS 事件
│   ├── server/         # Express + Socket.IO
│   ├── editor/         # 编辑器 (Vite + React 19)
│   └── viewer/         # 访问端 (Vite + React 19)
├── docs/
│   ├── API.md
│   ├── WEBSOCKET.md
│   ├── JSON_SCHEMA.md
│   └── UI_PROTOTYPE.md
├── .trae/documents/
│   ├── PRD.md
│   └── ARCHITECTURE.md
└── data/               # JSON 数据库 (运行时自动生成)
```

## 技术栈

- **前端**: React 19, TypeScript 5.6, Vite 5, TailwindCSS 3, Framer Motion 12, react-moveable, Zustand, lucide-react
- **后端**: Node 20+, Express 4, Socket.IO 4, Zod 3, JWT, bcrypt, Multer
- **数据库**: 内置 JSON 文件 (零依赖可启动) · 可切换 PostgreSQL
- **存储**: 本地 `./public/uploads/` · 可切换 S3 / MinIO

## 切换到 PostgreSQL

设置 `DATABASE_URL=postgres://user:pass@host:5432/db`, 在 `packages/server/src/db.ts` 中实现 PG 版本, 替换文件存储实现 (接口一致)。

## 常见任务

| 任务 | 命令 |
|------|------|
| 启动所有 | `pnpm dev` |
| 类型检查 | `pnpm -r typecheck` |
| 构建 | `pnpm build` |
| 清理 | `pnpm clean` |
| 重置数据 | `rm -rf data public/uploads` |

## 安全

- JWT 存于 `httpOnly` cookie, 同时返回给客户端存 store
- 编辑器写入需鉴权, 访问端只读
- 媒体上传 50MB 限制 + MIME 校验
- JSON 窗口 / 项目导入使用 Zod 严格校验
- 自定义 CSS 注入: 生产环境建议使用白名单 + DOMPurify

## 路线图

- [ ] 协同光标 / 选中 (presence:publish 已就绪, 渲染待补)
- [ ] CRDT 协作 (yjs)
- [ ] S3 / MinIO 适配
- [ ] PostgreSQL 适配
- [ ] 模板市场
- [ ] 历史版本对比 / 回滚
- [ ] 移动端编辑器 (H5)

## 许可

MIT
