import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { config } from '../config';
import { media, projects } from '../db';
import { requireAuth } from '../middleware';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await fs.mkdir(config.uploadsDir, { recursive: true });
      cb(null, config.uploadsDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, safe);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: { code: 'NO_FILE', message: '未收到文件' } });
  const projectId = (req.body?.projectId as string) || '';
  if (!projectId) return res.status(400).json({ error: { code: 'NO_PROJECT', message: '缺少 projectId' } });
  const p = await projects.findById(projectId);
  if (!p || p.ownerId !== req.user!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });

  const kind = (req.body?.kind as any) || guessKind(req.file.mimetype);
  const url = `/uploads/${req.file.filename}`;
  const m = await media.create({
    projectId,
    url,
    mime: req.file.mimetype,
    size: req.file.size,
    kind,
  });
  res.json({ media: m });
});

router.get('/:id', async (req, res) => {
  const m = await media.findById(req.params.id);
  if (!m) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '资源不存在' } });
  res.json({ media: m });
});

function guessKind(mime: string): 'image' | 'video' | 'audio' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'other';
}

export default router;
