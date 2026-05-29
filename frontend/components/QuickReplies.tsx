'use client';

import { motion } from 'framer-motion';

interface Props {
  actions: string[];
  onSelect: (action: string) => void;
}

export default function QuickReplies({ actions, onSelect }: Props) {
  if (!actions || actions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      className="flex overflow-x-auto whitespace-nowrap hide-scrollbar gap-2 px-4 pb-2 snap-x"
    >
      {actions.map((action, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelect(action)}
          className="text-xs font-medium bg-emerald-950/40 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-400 text-emerald-100/70 hover:text-white rounded-full px-4 py-2.5 transition-all duration-300 cursor-pointer backdrop-blur-sm shadow-sm"
        >
          {action}
        </motion.button>
      ))}
    </motion.div>
  );
}
