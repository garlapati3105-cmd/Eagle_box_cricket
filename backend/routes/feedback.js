const express = require('express');
const router = express.Router();
const supabase = require('../database/supabase');

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { sessionId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
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
