const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const supabase = require('../database/supabase');

const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many feedback submissions.' },
});

// POST /api/feedback
router.post('/', feedbackLimiter, async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Deduplication check
    if (sessionId) {
      const { data: existing } = await supabase.from('feedback').select('id').eq('session_id', sessionId).single();
      if (existing) {
        return res.status(400).json({ error: 'Feedback already submitted for this session' });
      }
    }

    const { error } = await supabase.from('feedback').insert({
      session_id: sessionId || null,
      rating: parseInt(rating),
      comment: comment?.trim() || null,
    });

    if (error) {
      console.error('Feedback error:', error);
      return res.status(500).json({ error: 'Failed to save feedback' });
    }

    return res.json({ success: true, message: 'Thank you for your feedback! 🌟' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;
