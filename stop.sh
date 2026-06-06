#!/usr/bin/env bash
# 停止所有 LightGlass 进程
for PORT in 4000 5173 5174; do
  if command -v fuser >/dev/null 2>&1; then
    fuser -k "$PORT/tcp" 2>/dev/null || true
  fi
done
pkill -9 -f "tsx src/index.ts" 2>/dev/null || true
pkill -9 -f "vite" 2>/dev/null || true
echo "✓ 已停止"
