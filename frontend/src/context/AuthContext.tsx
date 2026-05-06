import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser } from '@/types';
import api from '@/services/api';

interface AuthContextValue {
  user:    AuthUser | null;
  token:   string | null;
  login:   (username: string, password: string) => Promise<void>;
  logout:  () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null,
  login: async () => {}, logout: () => {}, loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('ccm_token');
    const storedUser  = localStorage.getItem('ccm_user');

    async function restoreSession() {
      if (!storedToken || !storedUser) {
        setLoading(false);
        return;
      }

      try {
        JSON.parse(storedUser);
        const res = await api.get('/auth/me');
        setToken(storedToken);
        setUser(res.data.data);
      } catch {
        localStorage.removeItem('ccm_token');
        localStorage.removeItem('ccm_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(username: string, password: string) {
    const res = await api.post('/auth/login', { username, password });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('ccm_token', t);
    localStorage.setItem('ccm_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  }

  function logout() {
    localStorage.removeItem('ccm_token');
    localStorage.removeItem('ccm_user');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
