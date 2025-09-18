import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AuthUser = {
  id: number; // normalized from backend user.user_id
  email?: string;
  // normalized name fields for UI
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  // access fields
  userType?: string; // 'admin' | 'user'
  role?: string;     // 'faculty' | 'student' | 'supervisor' (when userType === 'user')
  departmentId?: number | null;
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
  // Avoid generic type args to minimize TS friction in this project setup
  const [user, setUser] = useState(null as unknown as AuthUser | null);
  const [token, setToken] = useState(null as unknown as string | null);

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
                email: backendUser.email,
                firstName: backendUser.first_name ?? backendUser.firstname,
                lastName: backendUser.last_name ?? backendUser.lastname,
                middleInitial: backendUser.middle_initial ?? backendUser.middleInitial,
                userType: backendUser.user_type ?? backendUser.userType,
                role: backendUser.role,
                departmentId: backendUser.department_id ?? backendUser.departmentId ?? null,
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
      email: backendUser.email,
      firstName: backendUser.first_name ?? backendUser.firstname,
      lastName: backendUser.last_name ?? backendUser.lastname,
      middleInitial: backendUser.middle_initial ?? backendUser.middleInitial,
      userType: backendUser.user_type ?? backendUser.userType,
      role: backendUser.role,
      departmentId: backendUser.department_id ?? backendUser.departmentId ?? null,
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
