'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isLoggedIn, getUserRole } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/signup', '/', '/unauthorized', '/slots'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuth(pathname);
  }, [pathname]);

  function checkAuth(url: string) {
    const isPublicPath = PUBLIC_PATHS.includes(url);
    const logged = isLoggedIn();
    const role = getUserRole();

    // 1. If not logged in and not a public path, send to login
    if (!logged && !isPublicPath) {
      setAuthorized(false);
      router.replace('/login?role=player');
      return;
    }

    // 2. If logged in but role does not match prefix, intercept and force unauthorized page
    if (logged) {
      // Secure Admin routes
      if (url.startsWith('/admin') && role !== 'admin') {
        setAuthorized(false);
        router.replace('/unauthorized');
        return;
      }

      // Secure Player dashboard routes only
      if (url.startsWith('/dashboard') && role !== 'player') {
        setAuthorized(false);
        router.replace('/unauthorized');
        return;
      }
    }

    setAuthorized(true);
  }

  // Prevent content flash for unauthorized users
  if (!authorized && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-gray-400">
        <div className="text-5xl mb-4 animate-spin">🦅</div>
        <p className="text-sm font-black tracking-widest">Verifying access...</p>
      </div>
    );
  }

  return <>{children}</>;
}
