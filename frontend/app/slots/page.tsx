'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { clearToken, getUser } from '@/lib/auth';
import SlotCalendarView from '@/components/SlotCalendarView';
import { ChevronLeft, Calendar, AlertCircle } from 'lucide-react';

export default function SlotsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sportType, setSportType] = useState('Cricket');
  const backHref = user ? '/dashboard' : '/';

  useEffect(() => {
    const userData = getUser();
    setUser(userData?.role === 'player' ? userData : null);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-gray-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-5xl mb-4"
        >
          🏏
        </motion.div>
        <p className="text-sm font-bold tracking-widest uppercase">Loading Secure Slots...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-20 font-sans">
      
      {/* ── Navbar ──────────────────────────────────────────────────────────────── */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 px-4 py-4 sticky top-0 z-30 shadow-lg backdrop-blur-xl bg-black/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href={backHref}>
            <motion.div 
              whileHover={{ x: -5 }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-emerald-400/50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-black text-white text-lg tracking-tight group-hover:text-emerald-400 transition-colors">
                  {user?.role === 'admin' ? 'Back to Admin Dashboard' : user ? 'Back to Dashboard' : 'Back to Home'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  {user?.role === 'admin' ? 'Manage venue controls' : user ? 'View your bookings' : 'Browse the landing page'}
                </div>
              </div>
            </motion.div>
          </Link>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-white text-sm">{user?.name || 'Guest Explorer'}</p>
              <p className="text-xs text-emerald-400 font-semibold">{user?.email || 'Browsing without account'}</p>
            </div>
            {user ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-bold hover:bg-red-500/20 transition-all cursor-pointer"
              >
                Logout
              </motion.button>
            ) : (
              <Link href="/login?role=player" className="px-5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-bold hover:bg-emerald-500/20 transition-all">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Calendar className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Book Your Slot</h1>
          </div>
          <p className="text-gray-400 max-w-2xl text-lg">
            View all available premium slots for the next 10 days. Select your preferred date and time to make a booking instantly.
          </p>
        </motion.div>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 glass-card border-yellow-400/30 bg-yellow-400/5 text-yellow-100 flex items-center gap-3"
          >
            <div className="text-xl">👋</div>
            <div className="text-sm">
              <span className="font-bold text-yellow-400">Browsing as a guest.</span> Sign in to save your bookings and access your history, or continue as guest to view available slots.
            </div>
          </motion.div>
        )}

        {/* Sport Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar"
        >
          {['Cricket', 'Football', 'Badminton'].map(sport => (
            <motion.button
              key={sport}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSportType(sport)}
              className={`
                px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer
                ${sportType === sport
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] border-none'
                  : 'glass-card border border-white/10 text-gray-300 hover:border-emerald-400/50 hover:text-white'
                }
              `}
            >
              <span className="text-lg">{sport === 'Cricket' ? '🏏' : sport === 'Football' ? '⚽' : '🏸'}</span> {sport}
            </motion.button>
          ))}
        </motion.div>

        {/* Info Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-5 glass-card border-emerald-400/30 bg-emerald-900/10 rounded-2xl flex items-start gap-4"
        >
          <div className="bg-emerald-400/20 p-2 rounded-full shrink-0">
            <AlertCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-emerald-300 font-black uppercase tracking-wider">Instant AI Booking</p>
            <p className="text-sm text-gray-300 mt-1 leading-relaxed">
              Select any available slot below to secure it instantly. You'll receive an automated confirmation email with your booking ID.
            </p>
          </div>
        </motion.div>

        {/* Slot Calendar View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-dark p-2 md:p-6"
        >
          <SlotCalendarView
            sportType={sportType}
          />
        </motion.div>
      </div>
    </div>
  );
}
