'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getPlayerBookings } from '@/lib/api';
import { getToken, getUser, clearToken, isLoggedIn, getUserRole } from '@/lib/auth';
import SlotCalendarView from '@/components/SlotCalendarView';

interface Booking {
  id: string;
  name: string;
  phone: string;
  email?: string;
  sport_type: string;
  preferred_slot?: string;
  preferred_date?: string;
  team_size?: number;
  status: 'new' | 'contacted' | 'confirmed' | 'cancelled';
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'badge-new',
  contacted: 'badge-contacted',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
};

const SPORT_EMOJIS: Record<string, string> = {
  Cricket: '🏏',
  Football: '⚽',
  Badminton: '🏸',
};

export default function PlayerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Authenticate check
    if (!isLoggedIn()) {
      router.push('/login?role=player');
      return;
    }

    if (getUserRole() !== 'player') {
      router.push('/admin/dashboard');
      return;
    }

    const userData = getUser();
    setUser(userData);

    // 2. Fetch booking history
    const fetchBookings = async () => {
      try {
        const token = getToken() || '';
        const data = await getPlayerBookings(token);
        setBookings(data);
      } catch (err: any) {
        console.error('Failed to load bookings:', err);
        setError('Could not fetch booking history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push('/login?role=player');
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex flex-col items-center justify-center text-gray-400">
        <div className="text-5xl mb-4 animate-spin">🏏</div>
        <p className="text-sm font-semibold tracking-wide">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg pb-20">
      
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="glass-card rounded-none border-x-0 border-t-0 px-4 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <span className="text-2xl animate-pulse">🦅</span>
              <div>
                <div className="font-black text-white text-lg tracking-tight">Eagle Player Portal</div>
                <div className="text-xs text-green-400">Vijayawada</div>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <span className="text-xs text-yellow-400 hover:text-yellow-300 font-bold transition-colors cursor-pointer bg-yellow-400/10 px-3 py-1.5 border border-yellow-400/20 rounded-lg">
                💬 AI Chat Booking
              </span>
            </Link>
            <button 
              onClick={handleLogout} 
              className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 border border-red-400/20 rounded-lg bg-red-400/5 font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Area ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 mb-8 border border-white/10 relative overflow-hidden bg-gradient-to-r from-green-950/20 to-yellow-950/10 rounded-2xl shadow-xl"
        >
          <div className="absolute top-0 right-0 p-8 text-7xl opacity-10 font-bold select-none pointer-events-none">
            🏏⚽🏸
          </div>
          <div className="relative z-10">
            <span className="text-xs font-black bg-yellow-400 text-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Verified Player Profile
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-white mt-4 tracking-tight">
              Welcome back, <span className="gradient-text">{user?.name}</span>! 🏏
            </h1>
            <p className="text-gray-400 mt-2 max-w-xl text-sm leading-relaxed">
              Track your reservations, review slot requests, and manage your sport details. Want to book another court? Talk to our AI assistant anytime!
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-gray-300">
                <span>📧</span>
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-gray-300">
                  <span>📱</span>
                  <span>{user?.phone}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Slot View Section */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 mb-8 border border-blue-400/30 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-blue-100 tracking-tight">📅 Browse Available Slots</h2>
              <p className="text-gray-400 text-sm mt-1">View the next 10 days of availability and book instantly</p>
            </div>
            <Link href="/slots">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-eagle text-sm py-2.5 px-6 shadow-lg"
              >
                View All Slots →
              </motion.button>
            </Link>
          </div>

          {/* Mini Slot Preview */}
          <div className="h-64 overflow-hidden rounded-lg">
            <SlotCalendarView sportType="Cricket" />
          </div>
        </motion.div>

        {/* Bookings Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white tracking-wide">My Booking History ({bookings.length})</h2>
            <Link href="/chat">
              <button className="btn-eagle text-xs py-2 px-4 shadow-md font-bold">
                ➕ New Booking request
              </button>
            </Link>
          </div>

          {error && (
            <div className="glass-card border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {bookings.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-card p-12 text-center border border-white/10 bg-white/3"
            >
              <div className="text-5xl mb-4">🏟️</div>
              <h3 className="text-lg font-bold text-white">No Bookings Yet</h3>
              <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                You haven't requested any slots yet. Start a quick chat with Eagle AI to book your first court!
              </p>
              <Link href="/chat">
                <button className="btn-eagle text-sm py-2.5 px-6 mt-6 shadow-lg">
                  🤖 Chat With AI To Book
                </button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-6 border border-white/10 hover:border-yellow-400/30 transition-all flex flex-col justify-between group shadow-md"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl bg-white/5 w-10 h-10 flex items-center justify-center rounded-xl border border-white/5">
                        {SPORT_EMOJIS[booking.sport_type] || '🏟️'}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-semibold tracking-wide ${STATUS_COLORS[booking.status]}`}>
                        {booking.status}
                      </span>
                    </div>

                    {/* Booking Details */}
                    <h3 className="font-black text-white text-lg tracking-tight">
                      {booking.sport_type} Session
                    </h3>
                    <p className="text-gray-500 text-xs mt-1">
                      Submitted: {new Date(booking.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>

                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">📅 Date:</span>
                        <span className="text-gray-300 font-semibold">{booking.preferred_date || 'TBD'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">🕐 Slot:</span>
                        <span className="text-gray-300 font-semibold">{booking.preferred_slot || 'TBD'}</span>
                      </div>
                      {booking.team_size && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">👥 Players:</span>
                          <span className="text-gray-300 font-semibold">{booking.team_size} players</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions/Contact block */}
                  <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    {booking.status === 'new' && (
                      <p className="text-xs text-yellow-400 bg-yellow-400/5 py-1.5 px-3 rounded-lg border border-yellow-400/10">
                        ⚡ AI Notification sent! Call callback in 30m.
                      </p>
                    )}
                    {booking.status === 'contacted' && (
                      <p className="text-xs text-blue-400 bg-blue-400/5 py-1.5 px-3 rounded-lg border border-blue-400/10">
                        📞 Owner has reached out to you.
                      </p>
                    )}
                    {booking.status === 'confirmed' && (
                      <p className="text-xs text-green-400 bg-green-400/5 py-1.5 px-3 rounded-lg border border-green-400/10">
                        🎉 Booking confirmed! See you at venue!
                      </p>
                    )}
                    {booking.status === 'cancelled' && (
                      <p className="text-xs text-red-400 bg-red-400/5 py-1.5 px-3 rounded-lg border border-red-400/10">
                        ❌ Booking cancelled or slot unavailable.
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
