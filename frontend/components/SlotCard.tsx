'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SlotCardProps {
  slotTime: string;
  status: 'available' | 'booked' | 'blocked';
  onSelect?: () => void;
  isSelected?: boolean;
  bookedBy?: string;
}

export default function SlotCard({
  slotTime,
  status,
  onSelect,
  isSelected,
  bookedBy,
}: SlotCardProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'available':
        return {
          bgColor: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
          borderColor: 'border-emerald-500',
          textColor: 'text-emerald-900',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Available',
          hover: 'hover:shadow-lg hover:scale-105',
          cursor: 'cursor-pointer',
        };
      case 'booked':
        return {
          bgColor: 'bg-gradient-to-br from-red-400 to-red-600',
          borderColor: 'border-red-500',
          textColor: 'text-red-900',
          icon: <XCircle className="w-5 h-5" />,
          label: 'Booked',
          hover: 'hover:shadow-none',
          cursor: 'cursor-not-allowed',
        };
      case 'blocked':
        return {
          bgColor: 'bg-gradient-to-br from-amber-400 to-amber-600',
          borderColor: 'border-amber-500',
          textColor: 'text-amber-900',
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Blocked',
          hover: 'hover:shadow-none',
          cursor: 'cursor-not-allowed',
        };
      default:
        return {};
    }
  };

  const styles = getStatusStyles();

  return (
    <motion.button
      onClick={status === 'available' ? onSelect : undefined}
      disabled={status !== 'available'}
      whileHover={status === 'available' ? { scale: 1.05, y: -2 } : {}}
      whileTap={status === 'available' ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        w-full px-4 py-3 rounded-lg border-2 transition-all duration-200
        ${styles.bgColor} ${styles.borderColor} ${styles.hover} ${styles.cursor}
        ${isSelected && status === 'available' ? 'ring-4 ring-blue-400 shadow-lg' : ''}
        flex items-center justify-between
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`${styles.textColor}`}>{styles.icon}</div>
        <div className="text-left">
          <div className={`font-bold ${styles.textColor} text-sm`}>{slotTime}</div>
          <div className={`text-xs ${styles.textColor} opacity-80`}>{styles.label}</div>
          {bookedBy && status === 'booked' && (
            <div className={`text-xs ${styles.textColor} opacity-60 mt-1`}>by {bookedBy}</div>
          )}
        </div>
      </div>
      {isSelected && status === 'available' && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-2 h-2 bg-blue-500 rounded-full"
        />
      )}
    </motion.button>
  );
}
