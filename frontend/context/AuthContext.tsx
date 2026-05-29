'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { saveToken, getToken, clearToken, getUser, isLoggedIn, User } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  role: 'player' | 'admin' | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'player' | 'admin' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Validate session on mount
    const checkSession = () => {
      const active = isLoggedIn();
      if (active) {
        const u = getUser();
        setUser(u);
        setRole(u ? u.role : null);
        setIsAuthenticated(true);
      } else {
        // Clear stale session
        clearToken();
        setUser(null);
        setRole(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = (token: string) => {
    saveToken(token);
    const u = getUser();
    setUser(u);
    setRole(u ? u.role : null);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setRole(null);
    setIsAuthenticated(false);
    setLoading(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAuthenticated,
      loading,
      login: handleLogin,
      logout: handleLogout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
