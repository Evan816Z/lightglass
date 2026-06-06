import { Server as IOServer, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { config } from '../config';
import { verifyToken } from '../auth';
import { logger } from '../logger';
import { EVENTS, type ClientToServerEvents, type ServerToClientEvents, type PresenceUpdatePayload, type ProjectUpdatePayload, type WindowPatch } from '@lightglass/shared';
import { projects, snapshots } from '../db';

interface SocketData {
  projectId?: string;
  role?: 'editor' | 'viewer';
  userId?: string;
}

const roomMembers = new Map<string, Map<string, { role: 'editor' | 'viewer'; userId?: string; socket: Socket }>>();

let io: IOServer | null = null;

export function attachWS(httpServer: HttpServer) {
  io = new IOServer(httpServer, {
    cors: {
      origin: [config.editorOrigin, config.viewerOrigin],
      credentials: true,
    },
    maxHttpBufferSize: 5 * 1024 * 1024, // 5MB
  });

  io.on('connection', (socket) => {
    socket.data = {} as SocketData;

    // ---- editor join ----
    socket.on(EVENTS.EDITOR_JOIN, ({ projectId, token }) => {
      const payload = token ? verifyToken(token) : null;
      if (!payload) {
        socket.emit(EVENTS.ERROR, { code: 'UNAUTHENTICATED', message: '需要登录' });
        return;
      }
      void joinProject(socket, projectId, 'editor', payload.sub);
    });

    // ---- viewer join (可选 token) ----
    socket.on(EVENTS.VIEWER_JOIN, ({ projectId }) => {
      void joinProject(socket, projectId, 'viewer');
    });

    socket.on(EVENTS.EDITOR_LEAVE, () => leaveProject(socket));
    socket.on(EVENTS.VIEWER_LEAVE, () => leaveProject(socket));

    // ---- editor patch ----
    socket.on(EVENTS.PROJECT_PATCH, async (payload) => {
      if (socket.data.role !== 'editor' || socket.data.projectId !== payload.projectId) return;
      // 鉴权后再写库, 这里只做"内存广播 + 异步落库"两步合并
      const project = await projects.findById(payload.projectId);
      if (!project) return;
      // 简化: 实时 patch 不入库, 仅广播, 落地由编辑器节流调用 /snapshots
      broadcastPresenceAndUpdate(payload.projectId, {
        projectId: payload.projectId,
        patches: payload.patches,
        version: Date.now(),
        ts: Date.now(),
      });
    });

    socket.on(EVENTS.PROJECT_REQUEST_FULL, async ({ projectId }) => {
      const snap = await snapshots.latest(projectId);
      if (!snap) return;
      socket.emit(EVENTS.PROJECT_FULL, {
        projectId,
        document: snap.document,
        version: snap.version,
        ts: Date.now(),
      });
    });

    socket.on(EVENTS.PRESENCE_PUBLISH, (payload) => {
      if (socket.data.projectId !== payload.projectId) return;
      // 简单实现: 重新广播 presence 列表
      emitPresence(payload.projectId);
    });

    socket.on(EVENTS.MEDIA_PUBLISH, (payload) => {
      if (socket.data.projectId !== payload.projectId) return;
      io?.to(`project:${payload.projectId}`).emit(EVENTS.MEDIA_PLAY, payload);
    });

    socket.on('disconnect', () => {
      leaveProject(socket);
    });
  });

  return io;
}

async function joinProject(socket: Socket, projectId: string, role: 'editor' | 'viewer', userId?: string) {
  socket.data.projectId = projectId;
  socket.data.role = role;
  socket.data.userId = userId;
  const room = `project:${projectId}`;
  socket.join(room);

  // 记录成员
  if (!roomMembers.has(projectId)) roomMembers.set(projectId, new Map());
  roomMembers.get(projectId)!.set(socket.id, { role, userId, socket });

  // editor 立即推一份全量
  if (role === 'editor') {
    const snap = await snapshots.latest(projectId);
    if (snap) {
      socket.emit(EVENTS.PROJECT_FULL, {
        projectId,
        document: snap.document,
        version: snap.version,
        ts: Date.now(),
      });
    }
  } else {
    const snap = await snapshots.latest(projectId);
    if (snap) {
      socket.emit(EVENTS.PROJECT_FULL, {
        projectId,
        document: snap.document,
        version: snap.version,
        ts: Date.now(),
      });
    }
  }

  emitPresence(projectId);
  logger.info({ projectId, role, userId }, 'socket joined');
}

function leaveProject(socket: Socket) {
  const { projectId, role } = socket.data;
  if (!projectId) return;
  const members = roomMembers.get(projectId);
  if (members) {
    members.delete(socket.id);
    if (members.size === 0) roomMembers.delete(projectId);
  }
  socket.leave(`project:${projectId}`);
  socket.data.projectId = undefined;
  socket.data.role = undefined;
  if (projectId) emitPresence(projectId);
  logger.info({ projectId, role }, 'socket left');
}

function emitPresence(projectId: string) {
  const members = roomMembers.get(projectId);
  if (!members) return;
  const payload: PresenceUpdatePayload = {
    projectId,
    members: Array.from(members.entries()).map(([socketId, m]) => ({
      socketId,
      role: m.role,
      userId: m.userId,
    })),
  };
  io?.to(`project:${projectId}`).emit(EVENTS.PRESENCE_UPDATE, payload);
}

function broadcastPresenceAndUpdate(projectId: string, payload: ProjectUpdatePayload) {
  io?.to(`project:${projectId}`).emit(EVENTS.PROJECT_UPDATE, payload);
}

/** 供 REST 路由调用, 把 project:full 推给所有订阅者 */
export function broadcast(projectId: string, event: 'project:full', payload: unknown) {
  io?.to(`project:${projectId}`).emit(event, payload as any);
}

export function getIO() {
  return io;
}
