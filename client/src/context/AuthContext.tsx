import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AuthUser = {
  id: number; // normalized from backend user.user_id
  role: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  // Raw record from backend if needed
  raw?: any;
};

export type AuthState = {
  user: AuthUser | null;
  token: string | null;
  setAuth: (next: { user: any; token: string } | null) => void;
  logout: () => void;
};

// Avoid generic type args to minimize TS friction
const AuthContext = createContext(null as unknown as AuthState);

const STORAGE_KEY = 'auth';

export function AuthProvider({ children }: { children: any }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const backendUser = parsed?.data?.user || parsed?.user;
          const normalized: AuthUser | null = backendUser
            ? {
                id: Number(backendUser.user_id ?? backendUser.id),
                role: backendUser.role,
                email: backendUser.email,
                firstname: backendUser.firstname,
                lastname: backendUser.lastname,
                raw: backendUser,
              }
            : null;
          setUser(normalized);
          setToken(parsed?.token ?? null);
        }
      }
    } catch (_) {}
  }, []);

  const setAuth = (next: { user: any; token: string } | null) => {
    if (!next) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setToken(null);
      return;
    }
    const backendUser = next.user;
    const normalized: AuthUser = {
      id: Number(backendUser.user_id ?? backendUser.id),
      role: backendUser.role,
      email: backendUser.email,
      firstname: backendUser.firstname,
      lastname: backendUser.lastname,
      raw: backendUser,
    };
    setUser(normalized);
    setToken(next.token);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: next.token, data: { user: backendUser } }));
    } catch (_) {}
  };

  const logout = () => setAuth(null);

  const value = useMemo(() => ({ user, token, setAuth, logout }), [user, token]) as AuthState;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext) as AuthState;
  return ctx;
}
