'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser } from '@/lib/api';
import { saveToken, isLoggedIn, getUserRole } from '@/lib/auth';

type Role = 'player' | 'admin';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Detect role from query param, defaults to 'player'
  const initialRole = (searchParams.get('role') as Role) || 'player';
  
  const [role, setRole] = useState<Role>(initialRole);
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect them immediately to their dashboard
    if (isLoggedIn()) {
      const currentRole = getUserRole();
      if (currentRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (currentRole === 'player') {
        router.push('/dashboard');
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser({ emailOrUsername, password, role });
      if (res.success && res.token) {
        saveToken(res.token);
        
        // Redirect based on role
        if (role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        'Invalid credentials. Please double check and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Background blobs for premium glassmorphism vibe */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Brand/Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-6xl mb-4 animate-float inline-block cursor-pointer"
            >
              🦅
            </motion.div>
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight">Eagle Box Cricket</h1>
          <p className="text-gray-400 mt-2 text-sm">Vijayawada's Premier Sports Assistant</p>
        </div>

        {/* Unified Card */}
        <div className="glass-card-dark p-8 relative overflow-hidden border border-white/10 rounded-2xl shadow-2xl">
          
          {/* Tab Selector */}
          <div className="flex bg-white/5 p-1 rounded-xl mb-6 relative z-10">
            <button
              type="button"
              onClick={() => {
                setRole('player');
                setError('');
                setEmailOrUsername('');
                setPassword('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                role === 'player'
                  ? 'bg-yellow-400 text-black shadow-lg font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏃‍♂️ Player Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('admin');
                setError('');
                setEmailOrUsername('');
                setPassword('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                role === 'admin'
                  ? 'bg-yellow-400 text-black shadow-lg font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🔐 Admin Sign In
            </button>
          </div>

          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            {role === 'player' ? 'Welcome Back Player' : 'Management Portal'}
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">
                {role === 'player' ? 'Email Address' : 'Admin Username'}
              </label>
              <input
                className="input-eagle"
                type={role === 'player' ? 'email' : 'text'}
                placeholder={role === 'player' ? 'player@example.com' : 'admin'}
                value={emailOrUsername}
                onChange={e => setEmailOrUsername(e.target.value)}
                autoComplete={role === 'player' ? 'email' : 'username'}
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Password</label>
              <div className="relative">
                <input
                  className="input-eagle pr-10"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-sm"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg p-3 flex items-start gap-2"
                >
                  <span>⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="btn-eagle w-full justify-center py-3.5 text-base mt-4 shadow-xl hover:shadow-yellow-400/10 transition-all font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                role === 'player' ? '⚡ Enter Dashboard' : '🔑 Admin Authenticate'
              )}
            </button>
          </form>

          {/* Player registration footer link */}
          {role === 'player' && (
            <div className="text-center mt-6 pt-6 border-t border-white/5">
              <span className="text-xs text-gray-500">New to Eagle Box? </span>
              <Link href="/signup">
                <span className="text-xs text-yellow-400 hover:text-yellow-300 font-bold underline transition-colors cursor-pointer">
                  Create Player Account
                </span>
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Eagle Box Cricket • Designed for Vijayawada Sports
        </p>
      </motion.div>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-hero flex flex-col items-center justify-center text-gray-400">
        <div className="text-5xl mb-4 animate-spin">🦅</div>
        <p className="text-sm font-semibold tracking-wide">Loading portal...</p>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
