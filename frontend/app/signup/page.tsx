'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { registerPlayer } from '@/lib/api';
import { saveToken } from '@/lib/auth';

export default function PlayerSignupPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Field validation
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit Indian phone number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerPlayer({
        name,
        email,
        phone: phone || undefined,
        password
      });

      if (res.success && res.token) {
        saveToken(res.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || 
        'Registration failed. This email might already be in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center px-4 py-12 relative overflow-hidden">
      
      {/* Visual background blurred balls */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-6xl mb-4 animate-float inline-block cursor-pointer"
            >
              🏏
            </motion.div>
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">Create Player Profile</h1>
          <p className="text-gray-400 mt-2 text-sm">Register to track and manage your slot bookings</p>
        </div>

        {/* Signup Card */}
        <div className="glass-card-dark p-8 border border-white/10 rounded-2xl shadow-2xl">
          <form onSubmit={handleSignup} className="space-y-4">
            
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Full Name *</label>
              <input
                className="input-eagle"
                type="text"
                placeholder="Sai Kiran"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Email Address *</label>
              <input
                className="input-eagle"
                type="email"
                placeholder="sai@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Phone Number (Optional)</label>
              <input
                className="input-eagle"
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Password *</label>
              <input
                className="input-eagle"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-semibold">Confirm Password *</label>
              <input
                className="input-eagle"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
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
              className="btn-eagle w-full justify-center py-3.5 text-base mt-4 shadow-xl font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating Account...
                </span>
              ) : (
                '⚽ Register & Enter Dashboard'
              )}
            </button>
          </form>

          <div className="text-center mt-6 pt-6 border-t border-white/5">
            <span className="text-xs text-gray-500">Already registered? </span>
            <Link href="/login?role=player">
              <span className="text-xs text-yellow-400 hover:text-yellow-300 font-bold underline transition-colors cursor-pointer">
                Sign In Instead
              </span>
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          Eagle Box Cricket • Vijayawada
        </p>
      </motion.div>
    </div>
  );
}
