'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import QuickReplies from '@/components/QuickReplies';
import LeadForm from '@/components/LeadForm';
import FeedbackWidget from '@/components/FeedbackWidget';
import { sendMessage, checkBookingStatus } from '@/lib/api';
import { getSessionId } from '@/lib/session';
import { clearToken } from '@/lib/auth';

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

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  intent?: string;
  suggestedActions?: string[];
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'ai',
  content: "Hey there! 👋 Welcome to Eagle Box Cricket — Vijayawada's #1 sports venue! 🦅\n\nI'm Eagle AI, your personal booking assistant. I can help you with:\n🏏 Slot bookings\n💰 Pricing info\n📅 Availability check\n🏆 Tournament info\n\nHow can I help you today?",
  timestamp: new Date(),
  suggestedActions: ['Check availability', 'View pricing', 'Book a slot', 'Tournaments'],
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [lastSuggestedActions, setLastSuggestedActions] = useState<string[]>(WELCOME_MESSAGE.suggestedActions || []);

  // Check Status states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Booking[]>([]);
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState(false);

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
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    clearToken();
    window.location.href = '/login';
  };

  useEffect(() => {
    setSessionId(getSessionId());
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Show feedback after 5+ exchanges
  useEffect(() => {
    if (messageCount >= 10 && messageCount % 10 === 0) {
      setTimeout(() => setShowFeedback(true), 2000);
    }
  }, [messageCount]);

  const addMessage = (msg: Omit<Message, 'id'>) => {
    const id = `${Date.now()}-${Math.random()}`;
    setMessages(prev => [...prev, { ...msg, id }]);
    return id;
  };

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isTyping) return;

    setInput('');
    setLastSuggestedActions([]);

    // Add user message
    addMessage({ role: 'user', content: messageText, timestamp: new Date() });
    setMessageCount(c => c + 1);
    setIsTyping(true);

    try {
      const response = await sendMessage(messageText, sessionId);

      // Always sync session from backend (server is source of truth)
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }

      setIsTyping(false);
      
      addMessage({
        role: 'ai',
        content: response.reply,
        timestamp: new Date(),
        intent: response.intent,
        suggestedActions: response.suggestedActions || [],
      });

      setLastSuggestedActions(response.suggestedActions || []);
      setMessageCount(c => c + 1);

      // Auto-open lead form if booking intent detected
      if (response.leadDetected) {
        setTimeout(() => setShowLeadForm(true), 1000);
      }
    } catch (error: any) {
      setIsTyping(false);
      addMessage({
        role: 'ai',
        content: "I'm having a small technical hiccup right now 🙏. Please try again, or call us directly at +91 98765 43210.",
        timestamp: new Date(),
        suggestedActions: ['Try again', 'Call us'],
      });
      setLastSuggestedActions(['Try again', 'Call us']);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] gradient-bg font-sans">
      {/* ── Chat Header ─────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 glass-card rounded-none border-x-0 border-t-0 px-4 py-3 z-10 backdrop-blur-xl bg-black/40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-emerald-400 hover:text-emerald-300 transition-colors mr-1">
              ← <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Back</span>
            </Link>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse-glow">
              🦅
            </div>
            <div>
              <div className="font-black text-white text-sm tracking-wide">Eagle AI Assistant</div>
              <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold">
                <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                Typically replies instantly
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowStatusModal(true);
                setSearchQuery('');
                setSearchResults([]);
                setSearchSuccess(false);
                setSearchError('');
              }}
              className="text-xs text-yellow-400 hover:text-black hover:bg-yellow-400 font-bold transition-colors cursor-pointer px-2.5 py-1.5 border border-yellow-400/30 rounded-lg hidden sm:block"
            >
              Check Status 🔍
            </button>
            <button
              onClick={() => setShowFeedback(true)}
              className="text-xs text-emerald-400 hover:bg-emerald-400/10 transition-colors px-2 py-1.5 rounded-lg border border-transparent hover:border-emerald-400/20"
              title="Rate experience"
            >
              ⭐
            </button>
            <button
              onClick={() => setShowLeadForm(true)}
              className="btn-eagle text-xs py-2 px-4 shadow-none"
            >
              Book Now
            </button>
          </div>

        </div>
      </div>

      {/* ── Messages Area ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-2">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))}
          
          <AnimatePresence>
            {isTyping && <TypingIndicator />}
          </AnimatePresence>
          
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input Bar Area ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-black/60 backdrop-blur-xl border-t border-white/10 pb-safe">
        {/* Quick Replies */}
        <div className="w-full">
          <QuickReplies
            actions={lastSuggestedActions}
            onSelect={text => handleSend(text)}
          />
        </div>
        
        <div className="px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about slots, pricing, bookings..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-base focus:border-emerald-400 focus:bg-white/10 transition-all outline-none placeholder:text-gray-500"
              disabled={isTyping}
            />
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 ${
                input.trim() && !isTyping
                  ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                  : 'bg-white/5 text-gray-500 border border-white/10 cursor-not-allowed'
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </motion.button>
          </div>
          
          {/* Quick action chips at bottom */}
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 mt-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <span className="flex items-center gap-1">📍 Vijayawada</span>
            <span className="text-gray-700">•</span>
            <span className="flex items-center gap-1">⏰ 6 AM–11 PM</span>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a href="tel:+919876543210" className="hover:text-emerald-400 transition-colors hidden sm:flex items-center gap-1">📞 98765 43210</a>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <LeadForm
        isOpen={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        sessionId={sessionId}
      />
      <FeedbackWidget
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        sessionId={sessionId}
      />

      {/* ── Check Status Glassmorphism Modal ───────────────────────────────── */}
      <AnimatePresence>
        {showStatusModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowStatusModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-lg"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden glass-card-dark z-10 border border-yellow-400/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col"
            >
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
                        <button
                          onClick={() => setShowStatusModal(false)}
                          className="text-sm font-black text-black bg-yellow-400 hover:bg-yellow-300 cursor-pointer px-6 py-2.5 rounded-xl transition-colors"
                        >
                          Book via Chat Now →
                        </button>
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
