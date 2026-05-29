const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createLead, getLeads, updateLeadStatus, getPublicLeadStatus } = require('../controllers/leadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const leadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many lead submissions. Please try again later.' },
});

// GET /api/leads/status — public check
router.get('/status', getPublicLeadStatus);

// POST /api/leads — public (anyone can submit)
router.post('/', leadLimiter, createLead);

// GET /api/leads — admin only
router.get('/', requireAuth, requireAdmin, getLeads);

// PATCH /api/leads/:id/status — admin only
router.patch('/:id/status', requireAuth, requireAdmin, updateLeadStatus);

module.exports = router;
