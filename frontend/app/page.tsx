'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isLoggedIn, getUserRole, clearToken } from '@/lib/auth';
import { checkBookingStatus } from '@/lib/api';
import SlotCalendarView from '@/components/SlotCalendarView';
import { Menu, X } from 'lucide-react';

interface Booking {
  id: string;
  name: string;
  sport_type: string;
  preferred_slot?: string;
  preferred_date?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'cancelled';
  created_at: string;
}

const STATUS_DETAILS = {
  new: {
    label: 'New Reservation',
    style: 'badge-new',
    desc: 'Your request is received! Eagle AI has registered your preferred date/slot and notified the owner. Please await callback/email confirmation.',
    icon: '⚡',
  },
  contacted: {
    label: 'Contacted',
    style: 'badge-contacted',
    desc: 'The venue owner has processed your lead and is reaching out to finalize your booking details.',
    icon: '📞',
  },
  confirmed: {
    label: 'Confirmed Slot',
    style: 'badge-confirmed font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse',
    desc: 'Hurray! Your slot is officially confirmed! Check your email inbox for your branded booking ticket.',
    icon: '🎉',
  },
  cancelled: {
    label: 'Cancelled',
    style: 'badge-cancelled',
    desc: 'This slot request was cancelled. This happens if the time slot was already taken or if the request details were incomplete.',
    icon: '❌',
  },
};

const SPORT_EMOJIS: Record<string, string> = {
  Cricket: '🏏',
  Football: '⚽',
  Badminton: '🏸',
};

export default function HomePage() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'admin' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Status Check states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUserRole(getUserRole());
  }, []);

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  const handleSearchStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchSuccess(false);
    setSearchResults([]);

    try {
      const res = await checkBookingStatus(searchQuery.trim());
      setSearchResults(res.bookings || []);
      setSearchSuccess(true);
    } catch (err: any) {
      console.error('Status check error:', err);
      setSearchError(err.response?.data?.error || 'Failed to fetch status details. Please verify your phone number or booking code.');
    } finally {
      setSearchLoading(false);
    }
  };


  const features = [
    { icon: '🤖', title: 'AI Chat Assistant', desc: 'Ask anything — slots, pricing, rules, tournaments. Eagle AI answers instantly, 24/7.' },
    { icon: '📅', title: 'Slot Availability', desc: 'Check available time slots in real-time for any date and sport.' },
    { icon: '💰', title: 'Instant Pricing', desc: 'Get weekday, weekend, and tournament pricing without calling anyone.' },
    { icon: '🏆', title: 'Tournament Info', desc: 'Register for upcoming cricket and football tournaments directly.' },
    { icon: '📋', title: 'Rules & Policies', desc: 'Know cancellation policy, venue rules, and equipment details instantly.' },
    { icon: '⚡', title: 'Quick Booking', desc: 'Submit your booking request and get a callback within 30 minutes.' },
  ];

  const sports = [
    { icon: '🏏', name: 'Box Cricket', color: 'from-emerald-900/40 to-emerald-800/20', border: 'border-emerald-700/30' },
    { icon: '⚽', name: 'Football', color: 'from-blue-900/40 to-blue-800/20', border: 'border-blue-700/30' },
    { icon: '🏸', name: 'Badminton', color: 'from-purple-900/40 to-purple-800/20', border: 'border-purple-700/30' },
  ];

  const stats = [
    { value: '500+', label: 'Happy Customers' },
    { value: '6 AM', label: 'Opens Early At' },
    { value: '11 PM', label: 'Closes Late At' },
    { value: '₹1200', label: 'Starts From /hr' },
  ];

  return (
    <div className="gradient-hero min-h-screen font-sans overflow-x-hidden">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 backdrop-blur-md bg-black/20 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.span 
              whileHover={{ rotate: 15 }}
              className="text-3xl filter drop-shadow-md"
            >
              🦅
            </motion.span>
            <div>
              <span className="font-black text-white text-xl leading-tight block tracking-tight group-hover:text-yellow-400 transition-colors">Eagle Box Cricket</span>
              <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase">Vijayawada</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#sports" className="hover:text-white transition-colors">Sports</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            
            <button
              onClick={() => {
                setShowStatusModal(true);
                setSearchQuery('');
                setSearchResults([]);
                setSearchSuccess(false);
                setSearchError('');
              }}
              className="text-yellow-400 hover:text-yellow-300 font-bold transition-all cursor-pointer bg-yellow-400/10 px-3 py-1.5 border border-yellow-400/30 rounded-lg shadow-[0_0_15px_rgba(251,191,36,0.15)] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]"
            >
              Check Status 🔍
            </button>
            
            {loggedIn ? (
              <div className="flex items-center gap-4">
                {userRole === 'player' && (
                  <>
                    <Link href="/slots" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Slots 📅
                    </Link>
                    <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                      Dashboard 🏃‍♂️
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="text-red-400 hover:text-red-300 transition-colors cursor-pointer bg-red-400/10 px-3 py-1.5 border border-red-400/30 rounded-lg"
                >
                  Sign Out 🚪
                </button>
              </div>
            ) : (
              <Link href="/login" className="hover:text-white transition-colors">
                Sign In 🔑
              </Link>
            )}
            
            <Link href="/chat">
              <button className="btn-eagle text-sm py-2 px-6">
                Chat Now 💬
              </button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4 text-base font-medium">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white">Features</a>
                <a href="#sports" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white">Sports</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white">Pricing</a>
                
                <hr className="border-white/10 my-2" />
                
                <button
                  onClick={() => {
                    setShowStatusModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-yellow-400 text-left font-bold"
                >
                  Check Status 🔍
                </button>

                {loggedIn ? (
                  <>
                    {userRole === 'player' && (
                      <>
                        <Link href="/slots" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400">Slots 📅</Link>
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-emerald-400">Dashboard 🏃‍♂️</Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="text-red-400 text-left">Sign Out 🚪</button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-gray-300">Sign In 🔑</Link>
                )}

                <Link href="/chat" onClick={() => setMobileMenuOpen(false)} className="mt-4">
                  <button className="btn-eagle w-full py-3">Chat Now 💬</button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ───────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 px-4 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-5 py-2.5 mb-8 text-sm backdrop-blur-md shadow-[0_0_20px_rgba(251,191,36,0.15)]"
          >
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#34d399]"></span>
            <span className="text-yellow-400 font-bold tracking-wide">AI Assistant Online 24/7</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6 tracking-tight"
          >
            <span className="text-white">Book Your </span>
            <span className="gradient-text">Perfect Slot</span>
            <br />
            <span className="text-gray-300 text-4xl md:text-6xl lg:text-7xl">in Seconds <span className="inline-block animate-float">🏏</span></span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Eagle Box Cricket's AI-powered assistant handles everything — slot availability, pricing, bookings, and more. No phone calls needed.
          </motion.p>

          {/* CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          >
            <Link href="/chat" className="w-full sm:w-auto">
              <button className="btn-eagle text-lg py-4 px-8 w-full sm:w-auto shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)]">
                🤖 Talk to Eagle AI
              </button>
            </Link>
            <button
              onClick={() => {
                setShowStatusModal(true);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="btn-eagle-outline text-lg py-4 px-8 w-full sm:w-auto"
            >
              🔍 Check Status
            </button>
          </motion.div>

          {/* Stats Row */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {stats.map((s, i) => (
              <div key={i} className="glass-card p-5 text-center hover:-translate-y-1 transition-transform">
                <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</div>
                <div className="text-xs md:text-sm font-semibold text-gray-400 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Availability Preview ─────────────────────────────────────── */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-900/5 to-transparent z-0"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">📅 Check Availability</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Real-time slot availability for the next 10 days. Select a sport and see what's open instantly.</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card-dark p-2 md:p-6"
          >
            <SlotCalendarView sportType="Cricket" />
          </motion.div>
        </div>
      </section>

      {/* ── Sports Section ─────────────────────────────────────────────── */}
      <section id="sports" className="py-24 px-4 bg-black/40">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Sports We Support</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">World-class facilities for multiple sports under one roof</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
            {sports.map((sport, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card p-10 text-center bg-gradient-to-br ${sport.color} border ${sport.border} group cursor-pointer`}
              >
                <div className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl">
                  {sport.icon}
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{sport.name}</h3>
                <p className="text-gray-300 text-base mb-6">Premium turf & professional lighting</p>
                <Link href="/chat">
                  <button className="btn-eagle-outline py-2 px-6 text-sm w-full font-bold">
                    Book {sport.name} →
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ──────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Why Eagle AI?</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">Everything your venue needs, powered by advanced artificial intelligence</p>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-8 cursor-pointer transition-all duration-300 ${hoveredFeature === i ? 'border-yellow-400/50 bg-yellow-400/10 -translate-y-2 shadow-[0_15px_30px_rgba(251,191,36,0.15)]' : 'hover:border-white/20'}`}
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="text-4xl mb-4 bg-white/5 inline-flex p-3 rounded-2xl">{f.icon}</div>
                <h3 className="text-white font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 bg-black/40">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Transparent Pricing</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">No hidden fees. Book with confidence instantly.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Weekday */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center border-emerald-700/30 flex flex-col"
            >
              <div className="text-5xl mb-4">🌅</div>
              <h3 className="text-white font-black text-xl mb-2">Weekday</h3>
              <p className="text-gray-400 text-sm mb-6">Monday – Friday</p>
              <div className="text-5xl font-black gradient-text-green mb-2">₹1,200</div>
              <div className="text-gray-400 text-sm font-semibold mb-8">/hour</div>
              <div className="mt-auto text-xs font-bold bg-emerald-400/10 text-emerald-400 rounded-full px-4 py-2 inline-block border border-emerald-400/20">
                20% off 6–10 AM 🌄
              </div>
            </motion.div>
            
            {/* Weekend */}
            <motion.div 
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-10 text-center border-yellow-400/40 bg-yellow-400/5 relative overflow-hidden transform md:-translate-y-4 shadow-[0_0_40px_rgba(251,191,36,0.1)] flex flex-col"
            >
              <div className="absolute top-4 right-4 text-[10px] uppercase tracking-wider bg-yellow-400 text-black px-3 py-1 rounded-full font-black">Popular</div>
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-white font-black text-2xl mb-2">Weekend</h3>
              <p className="text-gray-400 text-sm mb-6">Saturday – Sunday</p>
              <div className="text-6xl font-black gradient-text mb-2">₹1,800</div>
              <div className="text-gray-400 text-sm font-semibold mb-8">/hour</div>
              <div className="mt-auto text-sm font-bold bg-yellow-400/10 text-yellow-400 rounded-full px-4 py-2 inline-block border border-yellow-400/30">
                Save ₹300 on 2+ hrs 🤝
              </div>
            </motion.div>

            {/* Tournament */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center border-purple-700/30 flex flex-col"
            >
              <div className="text-5xl mb-4">🏆</div>
              <h3 className="text-white font-black text-xl mb-2">Tournament</h3>
              <p className="text-gray-400 text-sm mb-6">Full Day Package</p>
              <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 mb-2">₹5,000</div>
              <div className="text-gray-400 text-sm font-semibold mb-8">/day</div>
              <div className="mt-auto text-xs font-bold bg-purple-400/10 text-purple-400 rounded-full px-4 py-2 inline-block border border-purple-400/20">
                Includes equipment 🎯
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto glass-card p-12 md:p-20 text-center border-yellow-400/30 bg-gradient-to-br from-emerald-900/40 via-[#0a0a0a] to-yellow-900/30 relative z-10 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-400/20 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px]"></div>
          
          <div className="text-6xl mb-6 animate-float">🦅</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Ready to Play?</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium">Chat with our AI assistant and book your premium slot in under 60 seconds.</p>
          <Link href="/chat">
            <button className="btn-eagle text-xl py-5 px-12 shadow-[0_0_40px_rgba(251,191,36,0.3)]">
              🤖 Start Booking Now
            </button>
          </Link>
          <p className="text-gray-500 text-sm mt-6 font-medium tracking-wide">NO REGISTRATION REQUIRED • INSTANT AI RESPONSE</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-12 px-4 text-center bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="text-3xl">🦅</span>
            <span className="font-black text-white text-xl tracking-tight">Eagle Box Cricket</span>
          </div>
          <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Plot No. 45, Near Bus Stand, Vijayawada, AP <br/>
            <span className="text-emerald-400 font-semibold">Open 6 AM – 11 PM Daily</span>
          </p>
          <div className="flex items-center justify-center gap-8 text-sm font-bold text-gray-500 mb-8">
            <Link href="/chat" className="hover:text-yellow-400 transition-colors">AI Chat</Link>
            <a href="tel:+919876543210" className="hover:text-yellow-400 transition-colors">Call: +91 98765 43210</a>
            <Link href="/slots" className="hover:text-yellow-400 transition-colors">Browse Slots</Link>
          </div>
          <p className="text-gray-600 text-xs font-medium tracking-wider uppercase">© 2026 Eagle Box Cricket. All rights reserved.</p>
        </div>
      </footer>

      {/* ── Check Status Glassmorphism Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-lg"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden glass-card-dark z-10 border border-yellow-400/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🔍</span>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">Check Booking Status</h2>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Live Database Lookup</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-white/10 text-2xl transition-all cursor-pointer w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleSearchStatus} className="mb-8">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Enter Phone Number or Booking ID
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="input-eagle flex-1 text-lg py-3 px-4"
                      required
                    />
                    <button
                      type="submit"
                      disabled={searchLoading}
                      className="btn-eagle py-3 px-8 text-base shadow-none w-full sm:w-auto"
                    >
                      {searchLoading ? 'Scanning...' : 'Search 🚀'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 font-medium">
                    💡 Tip: Enter the 10-digit phone number you used for booking.
                  </p>
                </form>

                {searchError && (
                  <div className="glass-card border border-red-500/30 bg-red-500/10 p-4 rounded-xl text-red-300 text-sm font-medium leading-relaxed mb-6">
                    ⚠️ {searchError}
                  </div>
                )}

                <div className="space-y-4 min-h-[150px]">
                  {searchLoading ? (
                    <div className="py-12 text-center text-gray-400">
                      <div className="text-5xl animate-spin mb-4">🏏</div>
                      <p className="text-sm font-bold tracking-wide uppercase">Scanning Secure Database...</p>
                    </div>
                  ) : searchSuccess ? (
                    searchResults.length === 0 ? (
                      <div className="glass-card p-10 text-center border-yellow-400/20 bg-yellow-400/5">
                        <div className="text-5xl mb-4">🏟️</div>
                        <h4 className="font-black text-white text-lg mb-2">No Active Bookings Found</h4>
                        <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed mb-6">
                          We couldn't locate any matching records for <span className="text-yellow-400 font-bold">"{searchQuery}"</span>.
                        </p>
                        <Link href="/chat">
                          <button
                            onClick={() => setShowStatusModal(false)}
                            className="text-sm font-black text-black bg-yellow-400 hover:bg-yellow-300 cursor-pointer px-6 py-2.5 rounded-xl transition-colors"
                          >
                            Book via Chat Now →
                          </button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">
                          Found {searchResults.length} Match{searchResults.length > 1 ? 'es' : ''}
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                          {searchResults.map((booking) => {
                            const status = booking.status || 'new';
                            const statusInfo = STATUS_DETAILS[status] || STATUS_DETAILS.new;

                            return (
                              <div
                                key={booking.id}
                                className="glass-card p-6 border border-white/10 hover:border-yellow-400/30 transition-all flex flex-col"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                                  <div className="flex items-center gap-3">
                                    <span className="text-3xl bg-white/5 w-12 h-12 flex items-center justify-center rounded-2xl border border-white/10 shadow-inner">
                                      {SPORT_EMOJIS[booking.sport_type] || '🏟️'}
                                    </span>
                                    <div>
                                      <h4 className="font-black text-white text-lg">
                                        {booking.sport_type} Session
                                      </h4>
                                      <p className="text-xs text-gray-500 font-medium font-mono mt-1">
                                        ID: {booking.id.split('-')[0]}...
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`text-xs px-3 py-1.5 rounded-full capitalize font-black tracking-wide flex items-center gap-1.5 w-fit ${statusInfo.style}`}>
                                    <span>{statusInfo.icon}</span>
                                    <span>{statusInfo.label}</span>
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-black/40 rounded-xl p-4 border border-white/5 mb-4">
                                  <div>
                                    <span className="text-gray-500 block text-xs font-bold uppercase mb-1">Date</span>
                                    <span className="text-white font-black text-sm">{booking.preferred_date || 'TBD'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500 block text-xs font-bold uppercase mb-1">Time Slot</span>
                                    <span className="text-yellow-400 font-black text-sm">{booking.preferred_slot || 'TBD'}</span>
                                  </div>
                                </div>

                                <div className="text-sm leading-relaxed text-gray-300 bg-emerald-950/20 border border-emerald-700/30 rounded-xl p-4">
                                  {statusInfo.desc}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                      <div className="text-4xl mb-3 grayscale">🔍</div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Awaiting Input</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
