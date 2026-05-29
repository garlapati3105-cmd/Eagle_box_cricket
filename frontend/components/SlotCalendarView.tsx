'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Zap, ArrowRight } from 'lucide-react';
import DayColumn from './DayColumn';
import SlotBookingModal from './SlotBookingModal';
import AvailabilityLegend from './AvailabilityLegend';
import SlotFilter, { type SlotFilters } from './SlotFilter';
import { get10DaySlots, bookSlot } from '@/lib/api';

interface Slot {
  id: string;
  slot_time: string;
  is_available: boolean;
  is_blocked: boolean;
  booked_by_lead?: string;
}

interface DayData {
  date: string;
  dayName: string;
  displayDate: string;
  availableCount: number;
  totalCount: number;
  slots: Slot[];
}

interface SlotCalendarViewProps {
  loading?: boolean;
  error?: string;
  sportType?: string;
  onSlotBooked?: () => void;
}

function slotTimeToHour(slotTime: string) {
  const match = slotTime.trim().match(/^(\d{1,2})\s*(AM|PM)$/i);
  if (!match) return 0;

  const hour = Number(match[1]);
  const meridiem = match[2].toUpperCase();

  if (meridiem === 'AM') return hour === 12 ? 0 : hour;
  return hour === 12 ? 12 : hour + 12;
}

export default function SlotCalendarView({
  loading: externalLoading,
  error: externalError,
  sportType = 'Cricket',
  onSlotBooked,
}: SlotCalendarViewProps) {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slotId: string; slotTime: string; dayName: string } | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [filters, setFilters] = useState<SlotFilters>({
    timeOfDay: 'all',
    availability: 'all',
    searchTerm: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await get10DaySlots(sportType);
      if (data.success && data.dates) {
        setDays(data.dates.map((day: any) => ({
          ...day,
          slots: [...day.slots].sort((a, b) => slotTimeToHour(a.slot_time) - slotTimeToHour(b.slot_time)),
        })));
      } else {
        throw new Error((data as any).error || 'Invalid response format');
      }
    } catch (err: any) {
      console.error('Slot fetch error:', err);
      setError(err.message || 'Failed to load slot availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setScrollPosition(0);
    fetchSlots();

    // Refresh slots every 30 seconds for real-time updates
    const interval = setInterval(fetchSlots, 30000);
    return () => clearInterval(interval);
  }, [sportType]);

  // Filter slots based on active filters
  const filteredDays = useMemo(() => {
    return days.map(day => ({
      ...day,
      slots: day.slots.filter(slot => {
        // Time of day filter
        const hour = slotTimeToHour(slot.slot_time);
        if (filters.timeOfDay !== 'all') {
          let isMatch = false;
          if (filters.timeOfDay === 'morning' && hour >= 6 && hour < 12) isMatch = true;
          if (filters.timeOfDay === 'afternoon' && hour >= 12 && hour < 17) isMatch = true;
          if (filters.timeOfDay === 'evening' && hour >= 17 && hour < 21) isMatch = true;
          if (filters.timeOfDay === 'night' && (hour >= 21 || hour < 6)) isMatch = true;
          if (!isMatch) return false;
        }

        // Availability filter
        if (filters.availability === 'available' && (!slot.is_available || slot.is_blocked))
          return false;
        if (filters.availability === 'booked' && (slot.is_available && !slot.is_blocked))
          return false;

        // Search filter
        if (filters.searchTerm) {
          const query = filters.searchTerm.toLowerCase();
          const timeMatch = slot.slot_time.toLowerCase().includes(query);
          const dateMatch = day.date.includes(query);
          const dayMatch = day.dayName.toLowerCase().includes(query);
          if (!timeMatch && !dateMatch && !dayMatch) return false;
        }

        return true;
      }),
    })).filter(day => day.slots.length > 0 || filters.searchTerm === '');
  }, [days, filters]);

  const handleSlotSelect = (date: string, slot: Slot) => {
    if (!slot.is_available || slot.is_blocked) return;

    const dayData = days.find(d => d.date === date);
    setSelectedSlot({
      date,
      slotId: slot.id,
      slotTime: slot.slot_time,
      dayName: dayData?.dayName || 'Selected',
    });
    setIsBookingModalOpen(true);
  };

  const handleConfirmBooking = async (bookingData: any) => {
    try {
      setBookingLoading(true);
      const result = await bookSlot(bookingData);

      if (result.success) {
        setSuccessMessage('Your slot has been booked successfully');
        onSlotBooked?.();
        setSelectedSlot(null);
        setIsBookingModalOpen(false);
        await fetchSlots();
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        throw new Error(result.message || 'Booking failed');
      }
    } catch (err: any) {
      throw err;
    } finally {
      setBookingLoading(false);
    }
  };

  const displayError = externalError || error;
  const displayLoading = externalLoading ?? loading;

  // Calculate statistics
  const totalSlots = days.reduce((sum, day) => sum + day.totalCount, 0);
  const availableSlots = days.reduce((sum, day) => sum + day.availableCount, 0);
  const bookedSlots = totalSlots - availableSlots;
  const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white">10-Day Slot Availability</h2>
            </div>
            <p className="text-gray-400 text-sm">
              Browse and book your preferred {sportType.toLowerCase()} slots for the next 10 days
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 flex flex-col items-center justify-center border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
          >
            <p className="text-3xl font-black text-emerald-400 mb-1">{availableSlots}</p>
            <p className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-widest">Available</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 flex flex-col items-center justify-center border-red-500/20"
          >
            <p className="text-3xl font-black text-red-400 mb-1">{bookedSlots}</p>
            <p className="text-[10px] text-red-400/70 font-bold uppercase tracking-widest">Booked</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 flex flex-col items-center justify-center border-amber-500/20"
          >
            <p className="text-3xl font-black text-amber-400 mb-1">{totalSlots}</p>
            <p className="text-[10px] text-amber-400/70 font-bold uppercase tracking-widest">Total Slots</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-4 flex flex-col items-center justify-center border-blue-500/20"
          >
            <p className={`text-3xl font-black mb-1 ${occupancyRate > 70 ? 'text-red-400' : occupancyRate > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {occupancyRate}%
            </p>
            <p className="text-[10px] text-blue-400/70 font-bold uppercase tracking-widest">Occupancy</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter Component */}
      <SlotFilter
        onFilterChange={setFilters}
        onSearch={(query) => setFilters(prev => ({ ...prev, searchTerm: query }))}
      />

      {/* Availability Legend */}
      <AvailabilityLegend />

      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 glass-card border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center rounded-xl"
        >
          ✅ {successMessage}
        </motion.div>
      )}

      {/* Loading State */}
      {displayLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="inline-block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl mb-4"
            >
              ⏳
            </motion.div>
            <p className="text-emerald-400 font-bold tracking-widest uppercase text-sm">Loading Live Data...</p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {displayError && !displayLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 glass-card border-red-500/30 bg-red-500/10 rounded-xl flex flex-col items-center"
        >
          <p className="text-red-400 font-bold text-center mb-2">⚠️ {displayError}</p>
          <p className="text-red-400/70 text-xs text-center font-medium">
            Please try refreshing the page
          </p>
        </motion.div>
      )}

      {/* Main Calendar Area */}
      {!displayLoading && !displayError && days.length > 0 && filteredDays.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Scroll Indicator */}
          {scrollPosition === 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs font-bold text-yellow-400 mb-4 px-2 uppercase tracking-widest"
            >
              <ArrowRight className="w-4 h-4 animate-pulse" />
              <span>Scroll horizontally to see more days</span>
            </motion.div>
          )}

          {/* Horizontal Scrollable Container */}
          <div
            className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 snap-x snap-mandatory custom-scrollbar"
            onScroll={(e) => setScrollPosition((e.target as HTMLElement).scrollLeft)}
          >
            {filteredDays.map((day) => (
              <div key={day.date} className="snap-center shrink-0 w-[280px] sm:w-[320px]">
                <DayColumn
                  date={day.date}
                  dayName={day.dayName}
                  displayDate={day.displayDate}
                  slots={day.slots}
                  availableCount={day.slots.filter(s => s.is_available && !s.is_blocked).length}
                  totalCount={day.slots.length}
                  onSlotSelect={handleSlotSelect}
                  selectedSlot={
                    selectedSlot?.date === day.date ? selectedSlot : null
                  }
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Results After Filter */}
      {!displayLoading && !displayError && days.length > 0 && filteredDays.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass-card"
        >
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-white font-black text-lg mb-2">No slots match your filters</p>
          <p className="text-sm text-gray-400 mb-6">Try adjusting your search or filter criteria</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilters({ timeOfDay: 'all', availability: 'all', searchTerm: '' })}
            className="btn-eagle-outline text-sm"
          >
            Clear Filters
          </motion.button>
        </motion.div>
      )}

      {/* Empty State */}
      {!displayLoading && !displayError && days.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 glass-card"
        >
          <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-white font-black text-lg mb-2">No slots available</p>
          <p className="text-sm text-gray-400">Please try again later</p>
        </motion.div>
      )}

      {/* Booking Modal */}
      <SlotBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedSlot(null);
        }}
        selectedDate={selectedSlot?.date || ''}
        selectedSlot={selectedSlot?.slotTime || ''}
        dayName={selectedSlot?.dayName || ''}
        sportType={sportType}
        onConfirm={handleConfirmBooking}
      />

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5 border-yellow-400/20 bg-yellow-400/5 flex items-start gap-4 mt-8"
      >
        <div className="text-2xl mt-1 animate-pulse">💡</div>
        <div className="text-sm text-gray-300">
          <p className="font-black text-white mb-1 tracking-wide">Pro Tip:</p>
          <p className="leading-relaxed">
            Morning and evening slots tend to fill up quickly. Early bookings ensure better availability!
            Our <span className="text-yellow-400 font-bold">Eagle AI</span> also suggests less crowded timings in the chat.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
