import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AuthRole = 'tutor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
}

type AuthStatus = 'loading' | 'ready' | 'offline';
interface SessionPayload {
  user: AuthUser | null;
  configured: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  configured: boolean | null;
  login: (role: AuthRole, email: string, password: string) => Promise<void>;
  retrySession: () => Promise<void>;
  logout: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [configured, setConfigured] = useState<boolean | null>(null);

  const refreshSession = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('No se pudo consultar la sesión.');
      const payload = (await response.json()) as SessionPayload;
      setUser(payload.user);
      setConfigured(payload.configured);
      setStatus('ready');
    } catch {
      setUser(null);
      setConfigured(null);
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (role: AuthRole, email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ role, email, password })
    });
    const payload = (await response.json().catch(() => ({}))) as {
      user?: AuthUser;
      error?: string;
    };
    if (!response.ok || !payload.user) {
      if (response.status === 503 && payload.error?.includes('no está configurada')) setConfigured(false);
      throw new Error(payload.error ?? 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    }
    setUser(payload.user);
    setConfigured(true);
    setStatus('ready');
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: '{}'
      });
      if (!response.ok) return false;
      setUser(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, configured, login, retrySession: refreshSession, logout }),
    [user, status, configured, login, refreshSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return value;
}
