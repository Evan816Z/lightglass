@echo off
REM LightGlass 一键启动 (Windows 原生 CMD / PowerShell)
REM 用法: start.bat   或  pnpm start  (已配置)

setlocal
cd /d "%~dp0"

echo === LightGlass - Windows 启动 ===

REM 检查 Node.js
where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js, 请先安装 Node.js 20+ 后重试
  echo        下载地址: https://nodejs.org/
  pause
  exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [信息] Node 版本: %NODE_VER%

REM 检查 / 安装 pnpm
where pnpm >nul 2>&1
if errorlevel 1 (
  echo [信息] 未找到 pnpm, 正在通过 npm 安装...
  call npm install -g pnpm
  if errorlevel 1 (
    echo [错误] pnpm 安装失败, 请手动执行: npm i -g pnpm
    pause
    exit /b 1
  )
)

REM 首次运行自动安装依赖
if not exist "node_modules" (
  echo [信息] 首次启动, 正在安装依赖 (可能需要几分钟)...
  call pnpm install
  if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
  )
)

REM 释放可能占用的端口
for %%P in (4000 5173 5174) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P "') do (
    if not "%%a"=="" (
      echo [信息] 释放端口 %%P (PID: %%a)
      taskkill /F /PID %%a >nul 2>&1
    )
  )
)

echo.
echo === 启动服务 ===
echo   编辑器: http://localhost:5173
echo   访问端: http://localhost:5174
echo   后端  : http://localhost:4000
echo   按 Ctrl+C 停止
echo.

call pnpm dev
endlocal
