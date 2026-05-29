'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2 mb-3"
    >
      {/* Eagle avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
        🦅
      </div>
      
      <div className="bubble-ai flex items-center gap-1.5 px-4 py-3">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </motion.div>
  );
}
