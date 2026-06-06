@echo off
REM 停止所有 LightGlass 进程 (Windows)
for %%P in (4000 5173 5174) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P "') do (
    if not "%%a"=="" taskkill /F /PID %%a >nul 2>&1
  )
)
echo 已停止
pause
