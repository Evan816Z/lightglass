import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/auth';

let socket: Socket | null = null;
let currentProject: string | null = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  if (socket) return socket;
  socket = io({
    autoConnect: true,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });
  socket.on('connect', () => {
    // noop
  });
  socket.on('disconnect', () => {
    // noop
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentProject = null;
  }
}

export function joinProjectAsEditor(projectId: string) {
  if (!socket) connectSocket();
  const token = useAuthStore.getState().token;
  currentProject = projectId;
  socket?.emit('editor:join', { projectId, token });
}

export function leaveProject() {
  if (!socket || !currentProject) return;
  socket.emit('editor:leave');
  currentProject = null;
}

export function onSocketEvent<T = any>(event: string, handler: (payload: T) => void) {
  if (!socket) connectSocket();
  socket?.on(event as any, handler as any);
  return () => socket?.off(event as any, handler as any);
}
