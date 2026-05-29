const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { getSlots, get10DaySlots, bookSlot, updateSlotAdmin } = require('../controllers/slotController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many booking attempts. Please try again later.' },
});

// GET /api/slots/10-days?sport=Cricket (MUST be before the catch-all / route)
router.get('/10-days', get10DaySlots);

// GET /api/slots?date=YYYY-MM-DD&sport=Cricket
router.get('/', getSlots);

// POST /api/slots/book (atomic reservation check & block)
router.post('/book', bookingLimiter, bookSlot);

// PATCH /api/slots/admin/update-slot (secured admin manual slot block/open override)
router.patch('/admin/update-slot', requireAuth, requireAdmin, updateSlotAdmin);

module.exports = router;
