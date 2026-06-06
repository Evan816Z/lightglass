#!/usr/bin/env node
/**
 * LightGlass 一键启动 (跨平台 Node 脚本)
 *  - 检查 Node >= 20
 *  - 自动安装 pnpm / 项目依赖 (按需)
 *  - 释放 4000/5173/5174 端口
 *  - 并行启动 editor / viewer / server
 */
import { spawn, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { createRequire } from 'node:module';

const PORTS = [4000, 5173, 5174];
const C = { g: '\x1b[32m', c: '\x1b[36m', y: '\x1b[33m', r: '\x1b[31m', w: '\x1b[1;37m', n: '\x1b[0m' };
const log = (m, c = 'w') => console.log(`${C[c]}${m}${C.n}`);

function checkNode() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 20) {
    log(`✗ 需要 Node.js 20+, 当前: ${process.version}`, 'r');
    log('  下载: https://nodejs.org/', 'y');
    process.exit(1);
  }
  log(`✓ Node ${process.version}`, 'g');
}

function which(cmd) {
  try {
    execSync(process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function ensurePnpm() {
  if (which('pnpm')) {
    log('✓ pnpm 已就绪', 'g');
    return;
  }
  log('→ 未找到 pnpm, 正在通过 npm 安装...', 'c');
  execSync('npm install -g pnpm', { stdio: 'inherit' });
  log('✓ pnpm 安装完成', 'g');
}

function installDeps() {
  if (existsSync('node_modules') && existsSync('packages/server/node_modules')) {
    log('✓ 依赖已就绪', 'g');
    return;
  }
  log('→ 首次启动, 正在安装依赖 (可能需要几分钟)...', 'c');
  execSync('pnpm install', { stdio: 'inherit' });
  log('✓ 依赖安装完成', 'g');
}

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

async function run() {
  log('\n=== LightGlass 启动 ===\n', 'c');
  checkNode();
  ensurePnpm();
  installDeps();

  log('→ 释放端口 4000 / 5173 / 5174', 'c');
  for (const p of PORTS) killPort(p);

  log('\n✓ 启动 Editor (5173) / Viewer (5174) / Server (4000)\n', 'g');
  log('  编辑器: http://localhost:5173', 'w');
  log('  访问端: http://localhost:5174', 'w');
  log('  后  端: http://localhost:4000\n', 'w');
  log('  Ctrl+C 停止全部\n', 'y');

  const procs = [
    spawn('pnpm', ['--filter', '@lightglass/editor', 'dev'], { stdio: 'inherit', shell: true }),
    spawn('pnpm', ['--filter', '@lightglass/viewer', 'dev'], { stdio: 'inherit', shell: true }),
    spawn('pnpm', ['--filter', '@lightglass/server', 'dev'], { stdio: 'inherit', shell: true }),
  ];

  const shutdown = () => {
    log('\n→ 正在停止...', 'y');
    for (const p of procs) {
      try { p.kill('SIGTERM'); } catch {}
    }
    setTimeout(() => process.exit(0), 500);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  for (const p of procs) {
    p.on('exit', (code) => {
      if (code && code !== 0) {
        log(`✗ 子进程退出 code=${code}`, 'r');
        shutdown();
      }
    });
  }
}

run().catch((err) => {
  log(`✗ 启动失败: ${err.message}`, 'r');
  process.exit(1);
});
