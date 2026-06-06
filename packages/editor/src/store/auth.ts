import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setAuth: (u: AuthUser, token: string) => void;
  clear: () => void;
  restore: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clear: () => set({ user: null, token: null }),
      restore: () => {
        // noop — persist handles hydration
      },
    }),
    { name: 'lightglass.auth' },
  ),
);

export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { code: 'NETWORK', message: res.statusText } }));
    throw new ApiError(err.error?.code ?? 'ERROR', err.error?.message ?? res.statusText, err);
  }
  return res.json();
}

export class ApiError extends Error {
  code: string;
  details: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}
