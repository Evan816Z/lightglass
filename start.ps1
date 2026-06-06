# LightGlass 一键启动 (Windows PowerShell)
# 用法: .\start.ps1  或右键 "使用 PowerShell 运行"

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

function Write-Step($msg) { Write-Host "→ $msg" -ForegroundColor Cyan }
function Write-OK($msg)   { Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Err($msg)  { Write-Host "✗ $msg" -ForegroundColor Red }

# 1) Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Err "未检测到 Node.js, 请先安装 Node.js 20+ (https://nodejs.org/)"
  Read-Host "按回车退出"
  exit 1
}
$nodeVer = node -v
Write-OK "Node 版本: $nodeVer"

# 2) pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  Write-Step "未找到 pnpm, 正在通过 npm 安装..."
  npm install -g pnpm
  if ($LASTEXITCODE -ne 0) { Write-Err "pnpm 安装失败"; exit 1 }
}
Write-OK "pnpm 就绪"

# 3) 依赖
if (-not (Test-Path "node_modules")) {
  Write-Step "首次启动, 正在安装依赖..."
  pnpm install
  if ($LASTEXITCODE -ne 0) { Write-Err "依赖安装失败"; exit 1 }
}

# 4) 释放端口
foreach ($p in 4000, 5173, 5174) {
  $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conn) {
    Write-Step "释放端口 $p (PID: $($c.OwningProcess))"
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

Write-Host ""
Write-OK "启动 LightGlass"
Write-Host "  编辑器: http://localhost:5173" -ForegroundColor White
Write-Host "  访问端: http://localhost:5174" -ForegroundColor White
Write-Host "  后  端: http://localhost:4000" -ForegroundColor White
Write-Host "  Ctrl+C 停止全部" -ForegroundColor DarkGray
Write-Host ""

pnpm dev
