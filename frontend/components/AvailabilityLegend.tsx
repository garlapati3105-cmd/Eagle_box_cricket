'use client';

import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

export default function AvailabilityLegend() {
  const legends = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Available',
      color: 'bg-emerald-500',
      description: 'Ready to book now',
    },
    {
      icon: <XCircle className="w-5 h-5" />,
      label: 'Booked',
      color: 'bg-red-500',
      description: 'Already taken',
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      label: 'Blocked',
      color: 'bg-amber-500',
      description: 'Maintenance/Reserved',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4 border border-gray-300"
    >
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-gray-900">Slot Status Legend</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {legends.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-white to-gray-50 border border-gray-200"
          >
            <div className={`${item.color} text-white p-2 rounded-lg`}>
              {item.icon}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-600">{item.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
