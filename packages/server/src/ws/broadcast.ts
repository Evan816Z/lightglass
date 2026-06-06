import { getIO } from './server';

export function broadcast(projectId: string, event: 'project:full', payload: unknown) {
  getIO()?.to(`project:${projectId}`).emit(event, payload as any);
}
