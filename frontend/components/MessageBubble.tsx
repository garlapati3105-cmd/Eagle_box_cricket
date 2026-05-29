'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  role: 'user' | 'ai';
  content: string;
  timestamp?: Date;
}

export default function MessageBubble({ role, content, timestamp }: Props) {
  const isUser = role === 'user';

  // Convert markdown-like formatting in AI messages
  const formatContent = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-sm mr-2 mt-auto mb-1 flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          🦅
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        <div className={isUser ? 'bubble-user' : 'bubble-ai'}>
          {!isUser ? (
            <div
              className="text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContent(content) }}
            />
          ) : (
            <p className="text-sm leading-relaxed">{content}</p>
          )}
        </div>
        {timestamp && (
          <span className="text-[10px] text-gray-600 mt-1 px-1">
            {timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-sm ml-2 mt-auto mb-1 flex-shrink-0 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
          👤
        </div>
      )}
    </motion.div>
  );
}
