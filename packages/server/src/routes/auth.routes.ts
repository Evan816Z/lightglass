import { Router } from 'express';
import { loginSchema, registerSchema } from '@lightglass/shared';
import { users, sessions } from '../db';
import { hashPassword, signToken, verifyPassword } from '../auth';
import { requireAuth } from '../middleware';
import { config } from '../config';

const router = Router();

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID', message: '参数错误', issues: parsed.error.flatten() } });
  }
  const { email, password, displayName } = parsed.data;
  const existing = await users.findByEmail(email);
  if (existing) {
    return res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: '邮箱已被注册' } });
  }
  const passwordHash = await hashPassword(password);
  const user = await users.create({ email, passwordHash, displayName });
  const token = signToken({ sub: user.id, email: user.email });
  await sessions.create(user.id, token);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 3600 * 1000,
  });
  return res.json({ user: sanitize(user), token });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'INVALID', message: '参数错误' } });
  }
  const { email, password } = parsed.data;
  const u = await users.findByEmail(email);
  if (!u) return res.status(401).json({ error: { code: 'BAD_CREDENTIALS', message: '邮箱或密码不正确' } });
  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) return res.status(401).json({ error: { code: 'BAD_CREDENTIALS', message: '邮箱或密码不正确' } });
  const token = signToken({ sub: u.id, email: u.email });
  await sessions.create(u.id, token);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 3600 * 1000,
  });
  return res.json({ user: sanitize(u), token });
});

router.post('/logout', async (req, res) => {
  const token = (req as any).cookies?.token;
  if (token) await sessions.revoke(token);
  res.clearCookie('token', { domain: undefined, path: '/' });
  return res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: sanitize(req.user!) });
});

function sanitize(u: any) {
  const { passwordHash, ...rest } = u;
  return rest;
}

export default router;
