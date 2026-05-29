'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Loader } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedSlot: string;
  dayName: string;
  sportType: string;
  onConfirm?: (bookingData: any) => Promise<void>;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  teamSize: number;
  message: string;
  duration: number;
}

function getEndTime(startTimeStr: string, duration: number) {
  const match = startTimeStr.trim().match(/^(\d{1,2})(?::00)?\s*(AM|PM)$/i);
  if (!match) return startTimeStr;
  let hour = parseInt(match[1]);
  const meridiem = match[2].toUpperCase();
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  
  let endHour = hour + duration;
  let endMeridiem = endHour >= 12 && endHour < 24 ? 'PM' : 'AM';
  let formattedEndHour = endHour % 12;
  if (formattedEndHour === 0) formattedEndHour = 12;
  
  return `${formattedEndHour} ${endMeridiem}`;
}

export default function SlotBookingModal({
  isOpen,
  onClose,
  selectedDate,
  selectedSlot,
  dayName,
  sportType,
  onConfirm,
}: BookingModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    teamSize: 1,
    message: '',
    duration: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'teamSize' || name === 'duration' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        setError('Please enter your name');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\s+/g, ''))) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      await onConfirm?.({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        sportType,
        preferredSlot: formData.duration > 1 ? `${selectedSlot} to ${getEndTime(selectedSlot, formData.duration)}` : selectedSlot,
        preferredDate: selectedDate,
        teamSize: formData.teamSize,
        message: formData.message || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ name: '', phone: '', email: '', teamSize: 1, message: '', duration: 1 });
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to book slot. Please try again.');
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
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[101] p-4 pointer-events-none"
          >
            <div className="glass-card-dark rounded-2xl max-w-md w-full border border-emerald-400/30 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-900 px-6 py-4 flex items-center justify-between shrink-0">
                <h2 className="font-black text-white text-lg tracking-wide">Confirm Booking</h2>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Booking Details Summary */}
              <div className="px-6 py-4 bg-black/40 border-b border-white/5 space-y-3 shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-full bg-emerald-400/10 flex items-center justify-center border border-emerald-400/20">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-bold mb-0.5">Date</p>
                    <p className="font-bold">{dayName}, {selectedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                    <Clock className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-yellow-400/70 font-bold mb-0.5">Time Duration</p>
                    <p className="font-black text-yellow-400">
                       {selectedSlot} {formData.duration > 1 && `- ${getEndTime(selectedSlot, formData.duration)}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="overflow-y-auto custom-scrollbar flex-1">
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                  {/* Success State */}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl mb-4"
                      >
                        🎉
                      </motion.div>
                      <p className="font-black text-emerald-400 text-xl tracking-tight">Booking Confirmed!</p>
                      <p className="text-sm text-gray-400 mt-2 font-medium">Check your inbox for confirmation</p>
                    </motion.div>
                  )}

                  {/* Error Message */}
                  {error && !success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold"
                    >
                      ⚠️ {error}
                    </motion.div>
                  )}

                  {!success && (
                    <>
                      {/* Duration */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          Duration
                        </label>
                        <select
                          name="duration"
                          value={formData.duration}
                          onChange={handleChange}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:bg-white/10 transition-all outline-none"
                          disabled={loading}
                        >
                          {[1, 2, 3, 4, 5, 6].map(num => (
                            <option key={num} value={num} className="bg-[#0a0a0a] text-white">
                              {num} {num === 1 ? 'Hour' : 'Hours'}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g., John Doe"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:bg-white/10 transition-all outline-none placeholder:text-gray-600"
                          disabled={loading}
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g., 9876543210"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:bg-white/10 transition-all outline-none placeholder:text-gray-600"
                          disabled={loading}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          Email (Optional)
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="e.g., john@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:bg-white/10 transition-all outline-none placeholder:text-gray-600"
                          disabled={loading}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Team Size */}
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                            Team Size
                          </label>
                          <select
                            name="teamSize"
                            value={formData.teamSize}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:bg-white/10 transition-all outline-none"
                            disabled={loading}
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                              <option key={num} value={num} className="bg-[#0a0a0a] text-white">
                                {num} {num === 1 ? 'player' : 'players'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Message */}
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                          Additional Message
                        </label>
                        <textarea
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="e.g., Need coaching session, special equipment..."
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-400 focus:bg-white/10 transition-all outline-none placeholder:text-gray-600 resize-none"
                          disabled={loading}
                        />
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3 pt-4 pb-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex-1 px-4 py-3 border border-white/10 bg-white/5 rounded-xl font-bold text-white hover:bg-white/10 transition-all disabled:opacity-50"
                          disabled={loading}
                        >
                          Cancel
                        </button>
                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-xl font-black text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          disabled={loading}
                        >
                          {loading && <Loader className="w-4 h-4 animate-spin border-black" />}
                          {loading ? 'Booking...' : 'Confirm Book'}
                        </motion.button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
