const AUTH_KEY = 'eagle_auth_token';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'player' | 'admin';
}

interface TokenPayload {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: 'player' | 'admin';
  exp?: number;
}

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=');
    return JSON.parse(atob(padded)) as TokenPayload;
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_KEY, token);
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_KEY);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function getUser(): User | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeTokenPayload(token);
  if (!payload?.id || !payload?.name || !payload?.email || !payload?.role) return null;

  return {
    id: payload.id,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    role: payload.role,
  };
}

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;

  const payload = decodeTokenPayload(token);
  if (!payload?.exp || !payload.role) return false;
  return payload.exp * 1000 > Date.now();
}

export function getUserRole(): 'player' | 'admin' | null {
  const user = getUser();
  return user ? user.role : null;
}

// Keep backward compatibility functions for existing code
export function saveAdminToken(token: string): void {
  saveToken(token);
}

export function getAdminToken(): string | null {
  return getToken();
}

export function clearAdminToken(): void {
  clearToken();
}

export function isAdminLoggedIn(): boolean {
  return isLoggedIn() && getUserRole() === 'admin';
}
