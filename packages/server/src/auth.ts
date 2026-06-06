import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { users, sessions, type UserRecord } from './db';

export interface AuthPayload {
  sub: string;
  email: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function authByToken(token: string | undefined | null): Promise<UserRecord | null> {
  if (!token) return null;
  const session = await sessions.findByToken(token);
  if (!session) return null;
  const user = await users.findById(session.userId);
  return user ?? null;
}
