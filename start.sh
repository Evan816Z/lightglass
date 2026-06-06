#!/usr/bin/env bash
# LightGlass 一键启动脚本
# 用法: ./start.sh
#       或 pnpm start

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

# 颜色
G='\033[0;32m'; Y='\033[0;33m'; C='\033[0;36m'; R='\033[0;31m'; N='\033[0m'

# 选择包管理器 (优先 pnpm, 其次 npm)
if command -v pnpm >/dev/null 2>&1; then
  PM="pnpm"
elif command -v npm >/dev/null 2>&1; then
  PM="npm run --silent"
else
  echo -e "${R}未找到 pnpm 或 npm, 请先安装 Node.js 20+${N}"
  exit 1
fi

# 检查 Node 版本
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || echo "0")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo -e "${R}需要 Node.js 20+, 当前: $(node --version)${N}"
  exit 1
fi

# 第一次运行自动安装依赖
if [ ! -d "node_modules" ] || [ ! -d "packages/server/node_modules" ]; then
  echo -e "${C}→ 首次启动, 正在安装依赖...${N}"
  $PM install
fi

# 释放可能占用的端口
for PORT in 4000 5173 5174; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "$PORT/tcp" 2>/dev/null || true
  fi
done

echo -e "${G}→ 启动 LightGlass (Editor 5173 / Viewer 5174 / Server 4000)${N}"
echo -e "${Y}  Ctrl+C 停止所有服务${N}"
echo ""

$PM dev
