'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitLead } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
  prefillData?: {
    name?: string;
    phone?: string;
    slot?: string;
    sport?: string;
    date?: string;
  };
}

const SPORTS = ['Cricket', 'Football', 'Badminton'];
const TIME_SLOTS = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];

export default function LeadForm({ isOpen, onClose, sessionId, prefillData }: Props) {
  const [form, setForm] = useState({
    name: prefillData?.name || '',
    phone: prefillData?.phone || '',
    email: '',
    sportType: prefillData?.sport || 'Cricket',
    preferredSlot: prefillData?.slot || '',
    preferredDate: prefillData?.date || '',
    teamSize: '',
    message: '',
    duration: 1,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const getEndTime = (startSlot: string, duration: number): string => {
    const match = startSlot.trim().match(/^(\d{1,2})(?::00)?\s*(AM|PM)$/i);
    if (!match) return startSlot;
    let hour = parseInt(match[1]);
    const meridiem = match[2].toUpperCase();
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    let endHour = (hour + duration) % 24;
    const endPeriod = endHour >= 12 && endHour < 24 ? 'PM' : 'AM';
    let displayHour = endHour % 12;
    if (displayHour === 0) displayHour = 12;
    return `${displayHour} ${endPeriod}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, ''))) {
      setError('Please enter a valid 10-digit Indian phone number (starting with 6-9).');
      return;
    }

    const slotToSubmit = form.duration > 1 && form.preferredSlot
      ? `${form.preferredSlot} to ${getEndTime(form.preferredSlot, form.duration)}`
      : form.preferredSlot;

    setLoading(true);
    try {
      await submitLead({
        ...form,
        preferredSlot: slotToSubmit,
        teamSize: form.teamSize ? parseInt(form.teamSize) : undefined,
        sessionId,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center z-50 px-4 pb-4 md:pb-0"
          >
            <div className="glass-card-dark w-full max-w-md mx-auto p-6 max-h-[90vh] overflow-y-auto">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Booking Request Sent!</h3>
                  <p className="text-gray-400 mb-6">Our team will call you within 30 minutes to confirm your slot.</p>
                  <button onClick={onClose} className="btn-eagle w-full justify-center">
                    Done ✓
                  </button>
                </motion.div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">🏏 Book Your Slot</h3>
                      <p className="text-gray-400 text-sm">Fill in your details — we'll confirm within 30 mins</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl transition-colors">×</button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name + Phone */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Your Name *</label>
                        <input
                          className="input-eagle"
                          placeholder="Rahul Kumar"
                          value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Phone Number *</label>
                        <input
                          className="input-eagle"
                          placeholder="9876543210"
                          value={form.phone}
                          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                          maxLength={10}
                          required
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Email (optional)</label>
                      <input
                        className="input-eagle"
                        type="email"
                        placeholder="rahul@example.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      />
                    </div>

                    {/* Sport */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Sport Type</label>
                      <div className="flex gap-2">
                        {SPORTS.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, sportType: s }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                              form.sportType === s
                                ? 'bg-yellow-400/20 border-yellow-400/60 text-yellow-400'
                                : 'border-white/10 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            {s === 'Cricket' ? '🏏' : s === 'Football' ? '⚽' : '🏸'} {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date + Slot + Duration */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Preferred Date</label>
                        <input
                          className="input-eagle"
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          value={form.preferredDate}
                          onChange={e => setForm(f => ({ ...f, preferredDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Start Time</label>
                        <select
                          className="input-eagle"
                          value={form.preferredSlot}
                          onChange={e => setForm(f => ({ ...f, preferredSlot: e.target.value }))}
                        >
                          <option value="">Select slot</option>
                          {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">
                        Duration
                        {form.duration > 1 && form.preferredSlot && (
                          <span className="ml-2 text-yellow-400 font-bold">
                            ({form.preferredSlot} to {getEndTime(form.preferredSlot, form.duration)})
                          </span>
                        )}
                      </label>
                      <select
                        className="input-eagle"
                        value={form.duration}
                        onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                      >
                        {[1,2,3,4,5,6].map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Hour' : 'Hours'}</option>
                        ))}
                      </select>
                    </div>

                    {/* Team Size */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Number of Players</label>
                      <input
                        className="input-eagle"
                        type="number"
                        placeholder="e.g. 8"
                        min="1"
                        max="22"
                        value={form.teamSize}
                        onChange={e => setForm(f => ({ ...f, teamSize: e.target.value }))}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <label className="text-xs text-gray-400 mb-1.5 block">Additional Message (optional)</label>
                      <textarea
                        className="input-eagle resize-none"
                        rows={2}
                        placeholder="Any special requirements..."
                        value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      />
                    </div>

                    {error && (
                      <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                        ⚠️ {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-eagle w-full justify-center text-base py-3"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        '🏏 Submit Booking Request'
                      )}
                    </button>

                    <p className="text-center text-xs text-gray-600">
                      Our team will call you within 30 minutes ⚡
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
