import { Router } from 'express';
import { projectDocumentSchema, windowConfigSchema } from '@lightglass/shared';
import { requireAuth } from '../middleware';

const router = Router();

/** 校验完整 ProjectDocument */
router.post('/validate', requireAuth, (req, res) => {
  const parsed = projectDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ valid: false, issues: parsed.error.flatten() });
  }
  res.json({ valid: true });
});

/** 校验单个窗口配置, 用于 JSON 导入 */
router.post('/window/validate', requireAuth, (req, res) => {
  const parsed = windowConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ valid: false, issues: parsed.error.flatten() });
  }
  res.json({ valid: true, window: parsed.data });
});

/** 校验完整 JSON (包含 windows 数组) */
router.post('/project/validate', requireAuth, (req, res) => {
  const parsed = projectDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ valid: false, issues: parsed.error.flatten() });
  }
  res.json({ valid: true, document: parsed.data });
});

export default router;
