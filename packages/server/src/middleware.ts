import type { Request, Response, NextFunction } from 'express';
import { authByToken, verifyToken } from './auth';
import type { UserRecord } from './db';

declare global {
  namespace Express {
    interface Request {
      user?: UserRecord;
    }
  }
}

/** 解析 cookie / Authorization 中的 JWT, 绑定 req.user */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = bearer || (req as any).cookies?.token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const u = await authByToken(token);
      if (u) req.user = u;
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: '需要登录' } });
    return;
  }
  next();
}
