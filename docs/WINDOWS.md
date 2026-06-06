# Windows 启动指南

> 三种方式任选其一, 推荐方式 1 (跨平台脚本, 零配置)。

## 方式 1: `pnpm start` (推荐, 跨平台)

```cmd
:: PowerShell / CMD 通用
git clone https://github.com/<your-org>/lightglass.git
cd lightglass
pnpm start
```

`pnpm start` 会自动:
1. 检查 Node.js ≥ 20
2. 未装 pnpm 时自动 `npm i -g pnpm`
3. 首次运行时自动 `pnpm install`
4. 释放 4000 / 5173 / 5174 端口
5. 并行启动 editor / viewer / server

打开 **http://localhost:5173**。

## 方式 2: 双击 `start.bat`

直接双击仓库根目录下的 `start.bat`, 或在 CMD 中:

```cmd
start.bat
```

效果与方式 1 一致, 适合不喜欢敲命令的同事。

> 想要 PowerShell 版本: 双击 `start.ps1` 即可, 或 `powershell -ExecutionPolicy Bypass -File .\start.ps1`

## 方式 3: VS Code 任务

仓库根目录的 `.vscode/tasks.json` (可选, 见下) 配置了 `Start All` 任务,
按 `Ctrl+Shift+B` 一键启动。

`.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start All",
      "type": "shell",
      "command": "pnpm",
      "args": ["start"],
      "problemMatcher": [],
      "presentation": { "reveal": "always" }
    },
    {
      "label": "Stop All",
      "type": "shell",
      "command": "pnpm",
      "args": ["stop"],
      "problemMatcher": []
    }
  ]
}
```

---

## 前置环境 (任选其一已安装即可)

| 工具 | 版本 | 安装 |
|------|------|------|
| Node.js | ≥ 20 | <https://nodejs.org/> (LTS 即可) |
| pnpm | ≥ 9 | `npm i -g pnpm` (脚本会自动装) |
| Git | 任意 | <https://git-scm.com/> |

> ⚠️ Node 18 及以下会在启动时报 `需要 Node.js 20+`, 请升级。

## 常见问题 (Windows 专属)

| 问题 | 解决 |
|------|------|
| `pnpm` 不是内部或外部命令 | 用 `npm i -g pnpm` 装一下, 或在 PowerShell 管理员下: `Set-ExecutionPolicy RemoteSigned` |
| 端口 5173/5174/4000 被占用 | `pnpm stop` 自动清理, 或在 PowerShell: `Get-NetTCPConnection -LocalPort 5173 \| Stop-Process -Force` |
| 路径含中文 / 空格 | 建议克隆到无空格、无中文路径 (如 `C:\dev\lightglass`) |
| `start.ps1` 无法执行 | 首次运行: `powershell -ExecutionPolicy Bypass -File .\start.ps1` |
| Vite 报 `ENOSPC` | 修改 `node_modules/.vite` 临时文件数限制, 或重启 WSL |
| Windows Defender 拦截 | 首次运行需要 1-2 分钟扫描 node_modules, 之后会缓存 |

## 启动后访问

| URL | 说明 |
|-----|------|
| <http://localhost:5173> | 编辑器 (登录 / 控制台 / 编辑器) |
| <http://localhost:5174> | 访问端 (需要 `?id=<projectId>`) |
| <http://localhost:4000/api/health> | 后端健康检查 |

## 文件位置 (Windows 路径)

| 用途 | 路径 |
|------|------|
| 数据库 (JSON) | `<项目根>\data\db.json` |
| 上传文件 | `<项目根>\public\uploads\` |
| 编辑器构建产物 | `<项目根>\public\editor\` |
| 访问端构建产物 | `<项目根>\public\viewer\` |

## 卸载 / 重置

```cmd
:: 停止服务
pnpm stop

:: 清理构建 + 依赖
pnpm clean
rd /s /q data
rd /s /q public\uploads
```
