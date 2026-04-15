'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getToken, setToken, clearToken } from '@/lib/auth';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/api';
import type { User, RegisterData } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    getCurrentUser(controller.signal)
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { access_token, user: userData, ...rest } = await apiLogin(email, password);
    console.log({ access_token, userData, rest })
    setToken(access_token);
    setUser(userData);
  }

  async function register(data: RegisterData): Promise<void> {
    const { access_token, user: userData } = await apiRegister(data);
    setToken(access_token);
    setUser(userData);
  }

  function logout(): void {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
