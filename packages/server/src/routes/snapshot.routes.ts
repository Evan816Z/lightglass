import { Router } from 'express';
import { projects, snapshots } from '../db';

const router = Router();

/** 公开快照 (访问端使用) */
router.get('/public/:id/latest', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  const s = await snapshots.latest(req.params.id);
  res.json({ project: { id: p.id, name: p.name, slug: p.slug }, snapshot: s });
});

export default router;
