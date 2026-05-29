'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitFeedback } from '@/lib/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId?: string;
}

export default function FeedbackWidget({ isOpen, onClose, sessionId }: Props) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await submitFeedback({ sessionId, rating, comment });
      setSubmitted(true);
    } catch {
      // Silent fail
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const ratingLabels = ['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="glass-card-dark w-full max-w-sm p-6">
              {submitted ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🌟</div>
                  <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                  <p className="text-gray-400 text-sm mb-4">Your feedback helps us improve.</p>
                  <button onClick={onClose} className="btn-eagle w-full justify-center">Close</button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Rate Your Experience</h3>
                      <p className="text-gray-400 text-xs">How was Eagle AI today?</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
                  </div>

                  {/* Stars */}
                  <div className="flex justify-center gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        className="star text-3xl"
                        style={{ color: star <= (hovered || rating) ? '#f5a623' : '#374151' }}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  {(hovered || rating) > 0 && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-yellow-400 text-sm mb-4"
                    >
                      {ratingLabels[hovered || rating]}
                    </motion.p>
                  )}

                  <textarea
                    className="input-eagle resize-none mb-4"
                    rows={3}
                    placeholder="Any comments? (optional)"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || loading}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      rating > 0 ? 'btn-eagle' : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Submitting...' : '⭐ Submit Feedback'}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
