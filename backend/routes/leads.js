const express = require('express');
const router = express.Router();
const { createLead, getLeads, updateLeadStatus, getPublicLeadStatus } = require('../controllers/leadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/leads/status — public check
router.get('/status', getPublicLeadStatus);

// POST /api/leads — public (anyone can submit)
router.post('/', createLead);

// GET /api/leads — admin only
router.get('/', requireAuth, requireAdmin, getLeads);

// PATCH /api/leads/:id/status — admin only
router.patch('/:id/status', requireAuth, requireAdmin, updateLeadStatus);


module.exports = router;

