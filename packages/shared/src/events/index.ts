/**
 * WebSocket 事件契约 (前后端共享)
 * 协议基于 Socket.IO 4
 */

export interface ServerToClientEvents {
  /** 推送增量 patch */
  'project:update': (payload: ProjectUpdatePayload) => void;
  /** 推送全量快照 (兜底) */
  'project:full': (payload: ProjectFullPayload) => void;
  /** 房间内协作者变化 */
  'presence:update': (payload: PresenceUpdatePayload) => void;
  /** 媒体播放同步 (可选) */
  'media:play': (payload: MediaPlayPayload) => void;
  /** 服务端错误 */
  'error:message': (payload: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'editor:join': (payload: { projectId: string; token: string }) => void;
  'editor:leave': () => void;
  'viewer:join': (payload: { projectId: string; token?: string }) => void;
  'viewer:leave': () => void;
  /** 编辑器推送增量 patch */
  'project:patch': (payload: ProjectPatchPayload) => void;
  /** 编辑器请求全量 (用于兜底) */
  'project:request-full': (payload: { projectId: string }) => void;
  /** 协作者光标 / 选中 */
  'presence:publish': (payload: PresencePublishPayload) => void;
  /** 媒体播放广播 */
  'media:publish': (payload: MediaPlayPayload) => void;
}

export interface ProjectUpdatePayload {
  projectId: string;
  /** 简化的 patch: 描述被改动窗口的字段 */
  patches: WindowPatch[];
  version: number;
  ts: number;
}

export interface WindowPatch {
  id: string;
  /** 部分字段更新, null 表示删除 */
  fields: Partial<{
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
    title: string;
    style: Record<string, unknown>;
    content: Record<string, unknown>;
  }> | null;
}

export interface ProjectFullPayload {
  projectId: string;
  document: import('../types/index.js').ProjectDocument;
  version: number;
  ts: number;
}

export interface ProjectPatchPayload {
  projectId: string;
  patches: WindowPatch[];
  baseVersion: number;
}

export interface PresenceUpdatePayload {
  projectId: string;
  members: Array<{
    socketId: string;
    role: 'editor' | 'viewer';
    userId?: string;
    selection?: string[];
    cursor?: { x: number; y: number };
  }>;
}

export interface PresencePublishPayload {
  projectId: string;
  selection?: string[];
  cursor?: { x: number; y: number };
}

export interface MediaPlayPayload {
  projectId: string;
  source: 'editor' | 'viewer' | 'system';
  action: 'play' | 'pause' | 'seek' | 'volume';
  windowId?: string;
  time?: number;
  volume?: number;
}

/** 房间命名 */
export const roomOf = (projectId: string) => `project:${projectId}`;

/** 事件名常量 (避免拼写错误) */
export const EVENTS = {
  EDITOR_JOIN: 'editor:join',
  EDITOR_LEAVE: 'editor:leave',
  VIEWER_JOIN: 'viewer:join',
  VIEWER_LEAVE: 'viewer:leave',
  PROJECT_PATCH: 'project:patch',
  PROJECT_UPDATE: 'project:update',
  PROJECT_FULL: 'project:full',
  PROJECT_REQUEST_FULL: 'project:request-full',
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_PUBLISH: 'presence:publish',
  MEDIA_PUBLISH: 'media:publish',
  MEDIA_PLAY: 'media:play',
  ERROR: 'error:message',
} as const;
