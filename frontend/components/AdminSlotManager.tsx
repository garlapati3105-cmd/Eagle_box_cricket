'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader } from 'lucide-react';
import api from '@/lib/api';
import { getAdminToken } from '@/lib/auth';

interface AdminSlotManagerProps {
  date: string;
  slotTime: string;
  sport?: string;
  currentStatus?: 'available' | 'booked' | 'blocked';
  onUpdate?: (result: any) => void;
}

export default function AdminSlotManager({
  date,
  slotTime,
  sport = 'Cricket',
  currentStatus = 'available',
  onUpdate,
}: AdminSlotManagerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSlotAction = async (action: 'block' | 'open' | 'maintenance' | 'cancel') => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.patch('/slots/admin/update-slot', {
        date,
        slot_time: slotTime,
        sport,
        action,
      }, {
        headers: {
          'Authorization': `Bearer ${getAdminToken() || ''}`,
        },
      });

      const result = response.data;
      setSuccess(`Slot ${action === 'block' || action === 'maintenance' ? 'blocked' : 'opened'} successfully!`);
      onUpdate?.(result);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const actions = [
    { label: '🔒 Block', action: 'block', description: 'Block this slot' },
    { label: '🔓 Open', action: 'open', description: 'Open this slot' },
    { label: '🔧 Maintenance', action: 'maintenance', description: 'Mark as maintenance' },
    { label: '❌ Cancel Booking', action: 'cancel', description: 'Cancel booking' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card p-4 rounded-lg border border-gray-300 space-y-3"
    >
      <div className="text-sm">
        <p className="font-semibold text-gray-900">
          {date} at {slotTime}
        </p>
        <p className="text-xs text-gray-600 mt-1">Current: {currentStatus}</p>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-300 rounded text-red-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-2 bg-green-50 border border-green-300 rounded text-green-700 text-xs">
          ✅ {success}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {actions.map((action) => (
          <motion.button
            key={action.action}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSlotAction(action.action as any)}
            disabled={loading}
            className="px-3 py-2 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center gap-1"
            title={action.description}
          >
            {loading ? <Loader className="w-3 h-3 animate-spin" /> : action.label}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
