import { Server } from 'node:http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { config } from './config';
import { logger } from './logger';
import { initDB } from './db';
import { attachUser } from './middleware';
import { attachWS } from './ws/server';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import snapshotRoutes from './routes/snapshot.routes';
import mediaRoutes from './routes/media.routes';
import jsonRoutes from './routes/json.routes';

export async function createApp() {
  await fs.mkdir(config.uploadsDir, { recursive: true });

  const app = express();
  app.use(cors({
    origin: [config.editorOrigin, config.viewerOrigin],
    credentials: true,
  }));
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());
  app.use(attachUser);

  // 静态资源: 上传 + 编辑器/访问端构建产物
  app.use('/uploads', express.static(config.uploadsDir));
  const staticDir = path.resolve(config.staticDir);
  const editorDist = path.resolve(staticDir, 'editor');
  const viewerDist = path.resolve(staticDir, 'viewer');
  app.use('/editor-static', express.static(editorDist));
  app.use('/viewer-static', express.static(viewerDist));

  // REST API
  app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/snapshots', snapshotRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/json', jsonRoutes);

  // 生产环境: 顶层路由挂载构建产物
  app.get('/editor', (_req, res) => res.sendFile(path.join(editorDist, 'index.html'), (err) => err && res.status(404).send('editor not built')));
  app.get('/editor/*', (_req, res) => res.sendFile(path.join(editorDist, 'index.html'), (err) => err && res.status(404).send('editor not built')));
  app.get('/view/:projectId', (_req, res) => res.sendFile(path.join(viewerDist, 'index.html'), (err) => err && res.status(404).send('viewer not built')));

  app.use((err: any, _req: any, res: any, _next: any) => {
    logger.error({ err }, 'unhandled error');
    res.status(500).json({ error: { code: 'INTERNAL', message: err?.message ?? 'server error' } });
  });

  return app;
}

export async function bootstrap() {
  await initDB();
  const app = await createApp();
  const server = new Server(app);
  attachWS(server);
  server.listen(config.port, () => {
    logger.info(`lightglass server listening on http://localhost:${config.port}`);
    logger.info(`  editor origin: ${config.editorOrigin}`);
    logger.info(`  viewer origin: ${config.viewerOrigin}`);
    logger.info(`  database: ${config.databaseUrl ? 'postgres' : 'file (./data/db.json)'}`);
    logger.info(`  uploads:    ${config.uploadsDir}`);
  });
  return server;
}
