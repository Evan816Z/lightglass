/**
 * 轻量级数据访问层
 *
 * 默认使用 JSON 文件持久化 (./data/db.json), 无外部依赖即可启动。
 * 当环境变量 DATABASE_URL 指向 PostgreSQL 时, 未来可平滑切换到 PG 实现。
 *
 * 之所以采用文件实现, 是为了让项目在零依赖情况下即可"开箱即用";
 * 切换到 PostgreSQL 仅需替换本文件中的实现, 业务层 API 不变。
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { nanoid } from 'nanoid';
import type {
  Project,
  ProjectDocument,
  ProjectSnapshot,
  User,
  MediaAsset,
} from '@lightglass/shared';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DBShape {
  users: UserRecord[];
  projects: ProjectRecord[];
  snapshots: SnapshotRecord[];
  media: MediaRecord[];
  sessions: SessionRecord[];
}

export interface UserRecord extends User {
  passwordHash: string;
}

export interface ProjectRecord extends Omit<Project, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotRecord extends Omit<ProjectSnapshot, 'createdAt'> {
  createdAt: string;
}

export interface MediaRecord extends Omit<MediaAsset, 'createdAt'> {
  createdAt: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
}

let db: DBShape = {
  users: [],
  projects: [],
  snapshots: [],
  media: [],
  sessions: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function load() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const raw = await fs.readFile(DB_FILE, 'utf-8');
    db = { ...db, ...JSON.parse(raw) };
    logger.info({ users: db.users.length, projects: db.projects.length }, 'db loaded');
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      await save();
      logger.info('db initialized');
    } else {
      throw err;
    }
  }
}

async function save() {
  const tmp = DB_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, DB_FILE);
}

// debounced-ish write — queue saves so we don't race
function queueSave() {
  writeQueue = writeQueue.then(() => save()).catch((e) => {
    console.error('db save failed', e);
  });
  return writeQueue;
}

import { logger } from './logger';

let initialized = false;
export async function initDB() {
  if (initialized) return;
  await load();
  initialized = true;
}

/* ----------------------------- Users ----------------------------- */

export const users = {
  async findByEmail(email: string): Promise<UserRecord | undefined> {
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  async findById(id: string): Promise<UserRecord | undefined> {
    return db.users.find((u) => u.id === id);
  },
  async create(input: { email: string; passwordHash: string; displayName?: string }): Promise<UserRecord> {
    const u: UserRecord = {
      id: nanoid(),
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      createdAt: new Date().toISOString(),
    };
    db.users.push(u);
    await queueSave();
    return u;
  },
};

export const sessions = {
  async create(userId: string, token: string, ttlMs = 7 * 24 * 3600 * 1000) {
    const s: SessionRecord = {
      id: nanoid(),
      userId,
      token,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    };
    db.sessions.push(s);
    await queueSave();
    return s;
  },
  async findByToken(token: string): Promise<SessionRecord | undefined> {
    return db.sessions.find((s) => s.token === token && new Date(s.expiresAt) > new Date());
  },
  async revoke(token: string) {
    db.sessions = db.sessions.filter((s) => s.token !== token);
    await queueSave();
  },
};

/* ----------------------------- Projects ----------------------------- */

export const projects = {
  async listByOwner(ownerId: string): Promise<ProjectRecord[]> {
    return db.projects.filter((p) => p.ownerId === ownerId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async findById(id: string): Promise<ProjectRecord | undefined> {
    return db.projects.find((p) => p.id === id);
  },
  async findBySlug(slug: string): Promise<ProjectRecord | undefined> {
    return db.projects.find((p) => p.slug === slug);
  },
  async create(input: { ownerId: string; name: string; slug: string }): Promise<ProjectRecord> {
    const p: ProjectRecord = {
      id: nanoid(),
      ownerId: input.ownerId,
      name: input.name,
      slug: input.slug,
      canvas: { width: 1280, height: 800 },
      theme: { kind: 'glass', opacity: 0.6, blur: 24, radius: 16, gloss: 0.4 },
      background: { type: 'gradient', gradient: { kind: 'linear', angle: 135, stops: [
        { color: '#1B1033', position: 0 },
        { color: '#0B1B2E', position: 100 },
      ] } },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.projects.push(p);
    // 创建初始空快照
    const snap: SnapshotRecord = {
      id: nanoid(),
      projectId: p.id,
      version: 1,
      document: emptyDocument(p.canvas),
      createdAt: new Date().toISOString(),
    };
    db.snapshots.push(snap);
    await queueSave();
    return p;
  },
  async update(id: string, patch: Partial<Pick<ProjectRecord, 'name' | 'slug' | 'thumbnail' | 'canvas' | 'theme' | 'background'>>): Promise<ProjectRecord | undefined> {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return undefined;
    Object.assign(p, patch, { updatedAt: new Date().toISOString() });
    await queueSave();
    return p;
  },
  async remove(id: string) {
    db.projects = db.projects.filter((p) => p.id !== id);
    db.snapshots = db.snapshots.filter((s) => s.projectId !== id);
    db.media = db.media.filter((m) => m.projectId !== id);
    await queueSave();
  },
};

export const snapshots = {
  async listByProject(projectId: string): Promise<SnapshotRecord[]> {
    return db.snapshots.filter((s) => s.projectId === projectId).sort((a, b) => b.version - a.version);
  },
  async latest(projectId: string): Promise<SnapshotRecord | undefined> {
    return db.snapshots
      .filter((s) => s.projectId === projectId)
      .sort((a, b) => b.version - a.version)[0];
  },
  async create(projectId: string, document: ProjectDocument): Promise<SnapshotRecord> {
    const last = await this.latest(projectId);
    const version = (last?.version ?? 0) + 1;
    const snap: SnapshotRecord = {
      id: nanoid(),
      projectId,
      version,
      document,
      createdAt: new Date().toISOString(),
    };
    db.snapshots.push(snap);
    await queueSave();
    return snap;
  },
  async getByVersion(projectId: string, version: number): Promise<SnapshotRecord | undefined> {
    return db.snapshots.find((s) => s.projectId === projectId && s.version === version);
  },
};

export const media = {
  async create(input: Omit<MediaRecord, 'id' | 'createdAt'>): Promise<MediaRecord> {
    const m: MediaRecord = {
      id: nanoid(),
      ...input,
      createdAt: new Date().toISOString(),
    };
    db.media.push(m);
    await queueSave();
    return m;
  },
  async findById(id: string): Promise<MediaRecord | undefined> {
    return db.media.find((m) => m.id === id);
  },
  async listByProject(projectId: string): Promise<MediaRecord[]> {
    return db.media.filter((m) => m.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
};

function emptyDocument(canvas: { width: number; height: number }): ProjectDocument {
  return {
    version: 1,
    canvas,
    background: { type: 'color', color: '#0B0F1A' },
    theme: { kind: 'glass', opacity: 0.6, blur: 24, radius: 16 },
    windows: [],
  };
}
