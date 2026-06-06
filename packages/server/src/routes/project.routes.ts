import { Router } from 'express';
import { createProjectSchema, saveSnapshotSchema } from '@lightglass/shared';
import { projects, snapshots } from '../db';
import { requireAuth } from '../middleware';
import { broadcast } from '../ws/broadcast';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  const list = await projects.listByOwner(req.user!.id);
  res.json({ items: list });
});

router.post('/', async (req, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID', message: '参数错误', issues: parsed.error.flatten() } });
  }
  const exists = await projects.findBySlug(parsed.data.slug);
  if (exists) return res.status(409).json({ error: { code: 'SLUG_TAKEN', message: 'slug 已被占用' } });
  const p = await projects.create({ ownerId: req.user!.id, name: parsed.data.name, slug: parsed.data.slug });
  res.json({ project: p });
});

router.get('/:id', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p || p.ownerId !== req.user!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  res.json({ project: p });
});

router.patch('/:id', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p || p.ownerId !== req.user!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  const updated = await projects.update(req.params.id, req.body ?? {});
  res.json({ project: updated });
});

router.delete('/:id', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p || p.ownerId !== req.user!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  await projects.remove(req.params.id);
  res.json({ ok: true });
});

router.get('/:id/snapshots/latest', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p || p.ownerId !== req.user!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  const s = await snapshots.latest(req.params.id);
  res.json({ snapshot: s });
});

router.get('/:id/snapshots', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p || p.ownerId !== req.user!.id) return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  res.json({ items: await snapshots.listByProject(req.params.id) });
});

/** 编辑器保存快照 */
router.post('/:id/snapshots', async (req, res) => {
  const p = await projects.findById(req.params.id);
  if (!p || p.ownerId !== req.user!.id) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: '项目不存在' } });
  }
  const parsed = saveSnapshotSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID', message: 'document 校验失败', issues: parsed.error.flatten() } });
  }
  const snap = await snapshots.create(req.params.id, parsed.data.document);
  await projects.update(req.params.id, {
    canvas: parsed.data.document.canvas,
    background: parsed.data.document.background,
    theme: parsed.data.document.theme,
  });
  broadcast(req.params.id, 'project:full', {
    projectId: req.params.id,
    document: parsed.data.document,
    version: snap.version,
    ts: Date.now(),
  });
  res.json({ snapshot: snap });
});

export default router;
