# LightGlass API 设计文档

> REST API 基于 HTTP/JSON, 鉴权通过 `Authorization: Bearer <jwt>` 或 `httpOnly` cookie。
> 端口: `4000`  ·  CORS: `EDITOR_ORIGIN` / `VIEWER_ORIGIN`

---

## 通用约定

- 请求 / 响应均为 JSON
- 错误响应: `{ "error": { "code": "...", "message": "...", "issues"?: ... } }`
- 鉴权: `Authorization: Bearer <token>`, Token 通过 `/api/auth/login` 或 `/api/auth/register` 获取
- 时间: ISO 8601 字符串

## 错误码

| Code | 含义 |
|------|------|
| `UNAUTHENTICATED` | 未登录 |
| `BAD_CREDENTIALS` | 邮箱或密码错误 |
| `EMAIL_TAKEN` | 邮箱已注册 |
| `SLUG_TAKEN` | slug 冲突 |
| `NOT_FOUND` | 资源不存在 |
| `INVALID` | 参数 / Schema 校验失败 |
| `INTERNAL` | 服务内部错误 |

---

## Auth

### POST `/api/auth/register`
- Body: `{ email, password, displayName? }`
- 200: `{ user, token }` + Set-Cookie

### POST `/api/auth/login`
- Body: `{ email, password }`
- 200: `{ user, token }` + Set-Cookie

### POST `/api/auth/logout`
- 200: `{ ok: true }`

### GET `/api/auth/me`
- 200: `{ user }`

---

## Projects (需鉴权)

### GET `/api/projects`
- 200: `{ items: Project[] }`

### POST `/api/projects`
- Body: `{ name, slug, canvas? }`
- 200: `{ project }`

### GET `/api/projects/:id`
- 200: `{ project }`

### PATCH `/api/projects/:id`
- Body: `Partial<{ name, slug, canvas, theme, background, thumbnail }>`
- 200: `{ project }`

### DELETE `/api/projects/:id`
- 200: `{ ok: true }`

### GET `/api/projects/:id/snapshots`
- 200: `{ items: Snapshot[] }`

### GET `/api/projects/:id/snapshots/latest`
- 200: `{ snapshot }`

### POST `/api/projects/:id/snapshots`  (编辑器保存)
- Body: `{ document: ProjectDocument }`
- 200: `{ snapshot }`  ·  副作用: 推 `project:full` 给房间内所有 viewer
- 失败 (Schema): `INVALID` + Zod flatten issues

---

## Snapshots (公开访问端)

### GET `/api/snapshots/public/:id/latest`
- 无需鉴权
- 200: `{ project: { id, name, slug }, snapshot }`

---

## Media

### POST `/api/media/upload`  (需鉴权, multipart)
- 字段: `file` (binary), `projectId`, `kind?` (image|video|audio|other)
- 200: `{ media: { id, url, mime, size, kind, ... } }`
- 限制: 50MB; 存储在 `public/uploads/` (默认) 或 S3/MinIO

### GET `/api/media/:id`
- 200: `{ media }`

---

## JSON Schema 校验

### POST `/api/json/validate`
- Body: `ProjectDocument`
- 200: `{ valid: true }`
- 400: `{ valid: false, issues }`

### POST `/api/json/window/validate`
- Body: `WindowConfig`
- 200: `{ valid: true, window }`

### POST `/api/json/project/validate`
- Body: `ProjectDocument`
- 200: `{ valid: true, document }`

---

## Health

### GET `/api/health`
- 200: `{ ok: true, ts }`

---

## TypeScript 响应示例

```ts
interface ApiError {
  error: { code: string; message: string; issues?: unknown };
}

interface Project {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  canvas: { width: number; height: number };
  theme: ThemeConfig;
  background: BackgroundConfig;
  createdAt: string;
  updatedAt: string;
}

interface Snapshot {
  id: string;
  projectId: string;
  version: number;
  document: ProjectDocument;
  createdAt: string;
}
```

---

## Curl 速查

```bash
# 注册
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"pass1234","displayName":"A"}'

# 登录
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"pass1234"}'

# 创建项目
TOKEN=...
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"My Desktop","slug":"my-desktop"}'

# 保存快照
PID=...
curl -X POST "http://localhost:4000/api/projects/$PID/snapshots" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"document":{...}}'

# 公开快照 (访问端)
curl "http://localhost:4000/api/snapshots/public/$PID/latest"
```
