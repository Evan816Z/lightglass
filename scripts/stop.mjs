#!/usr/bin/env node
/**
 * LightGlass 一键停止 (跨平台)
 */
import { execSync } from 'node:child_process';

const C = { g: '\x1b[32m', y: '\x1b[33m', r: '\x1b[31m', n: '\x1b[0m' };
const PORTS = [4000, 5173, 5174];

function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano | findstr ":${port} "`, { encoding: 'utf-8' });
      const pids = new Set();
      for (const line of out.split('\n')) {
        const m = line.match(/\s(\d+)$/);
        if (m) pids.add(m[1]);
      }
      for (const pid of pids) {
        try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); } catch {}
      }
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
  } catch {}
}

console.log(`${C.y}→ 停止所有 LightGlass 服务...${C.n}`);
for (const p of PORTS) killPort(p);
try {
  if (process.platform === 'win32') {
    execSync('taskkill /F /IM node.exe /FI "WINDOWTITLE eq LightGlass*"', { stdio: 'ignore' });
  } else {
    execSync('pkill -9 -f "tsx src/index.ts" 2>/dev/null; pkill -9 -f vite 2>/dev/null', { stdio: 'ignore' });
  }
} catch {}
console.log(`${C.g}✓ 已停止${C.n}`);
