'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?role=admin');
  }, []);

  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-gray-400">
      <div className="text-5xl mb-4 animate-spin">🦅</div>
      <p className="text-sm font-black tracking-widest">Redirecting to Secure Admin Login...</p>
    </div>
  );
}

