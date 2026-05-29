'use client';

import { motion } from 'framer-motion';
import SlotCard from './SlotCard';
import { Calendar } from 'lucide-react';

interface Slot {
  id: string;
  slot_time: string;
  is_available: boolean;
  is_blocked: boolean;
  booked_by_lead?: string;
}

interface DayColumnProps {
  date: string;
  dayName: string;
  displayDate: string;
  slots: Slot[];
  availableCount: number;
  totalCount: number;
  onSlotSelect?: (date: string, slot: Slot) => void;
  selectedSlot?: { date: string; slotId: string } | null;
}

export default function DayColumn({
  date,
  dayName,
  displayDate,
  slots,
  availableCount,
  totalCount,
  onSlotSelect,
  selectedSlot,
}: DayColumnProps) {
  const getSlotStatus = (slot: Slot): 'available' | 'booked' | 'blocked' => {
    if (slot.is_blocked) return 'blocked';
    if (!slot.is_available) return 'booked';
    return 'available';
  };

  const occupancyPercentage = totalCount > 0
    ? Math.round(((totalCount - availableCount) / totalCount) * 100)
    : 0;

  const occupancyColor =
    occupancyPercentage <= 30
      ? 'text-emerald-400'
      : occupancyPercentage <= 70
        ? 'text-amber-400'
        : 'text-red-400';

  const isToday = dayName === 'Today';
  const isTomorrow = dayName === 'Tomorrow';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex-shrink-0 w-72 rounded-xl overflow-hidden border-2
        ${isToday ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100' : 
          isTomorrow ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100' :
          'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100'}
        glass-card-dark p-4 space-y-3
      `}
    >
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <motion.h3 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`
                font-black text-lg tracking-tight
                ${isToday ? 'text-blue-900' : isTomorrow ? 'text-purple-900' : 'text-gray-900'}
              `}
            >
              {dayName}
            </motion.h3>
            <p className={`text-sm ${isToday ? 'text-blue-700' : isTomorrow ? 'text-purple-700' : 'text-gray-700'}`}>
              {displayDate}
            </p>
          </div>
          {(isToday || isTomorrow) && (
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xl"
            >
              {isToday ? '🕐' : '⏰'}
            </motion.span>
          )}
        </div>

        {/* ─── Occupancy Indicator ────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-gray-700">Occupancy</span>
            <span className={`${occupancyColor} font-bold`}>{occupancyPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${occupancyPercentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`
                h-full transition-colors
                ${occupancyPercentage <= 30
                  ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                  : occupancyPercentage <= 70
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600'
                    : 'bg-gradient-to-r from-red-400 to-red-600'}
              `}
            />
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-emerald-600">{availableCount}</span> available of{' '}
            <span className="font-semibold">{totalCount}</span> slots
          </div>
        </div>
      </div>

      {/* ─── Slots List ─────────────────────────────────────────────── */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {slots && slots.length > 0 ? (
          slots.map((slot) => (
            <SlotCard
              key={slot.id}
              slotTime={slot.slot_time}
              status={getSlotStatus(slot)}
              isSelected={selectedSlot?.date === date && selectedSlot?.slotId === slot.id}
              onSelect={() => onSlotSelect?.(date, slot)}
              bookedBy={slot.booked_by_lead}
            />
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Calendar className="w-8 h-8 mx-auto opacity-50 mb-2" />
            <p className="text-sm">No slots available</p>
          </div>
        )}
      </div>

      {/* ─── Quick Stats ────────────────────────────────────────────── */}
      {availableCount > 0 && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const firstAvailable = slots.find(slot => !slot.is_blocked && slot.is_available);
            if (firstAvailable) onSlotSelect?.(date, firstAvailable);
          }}
          className="w-full py-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-emerald-900 font-bold rounded-lg text-sm hover:shadow-lg transition-all"
        >
          Book a Slot
        </motion.button>
      )}
    </motion.div>
  );
}
