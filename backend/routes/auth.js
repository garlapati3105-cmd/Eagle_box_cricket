const express = require('express');
const router = express.Router();
const { registerPlayer, loginUser, getProfile, getPlayerBookings } = require('../controllers/authController');
const { requireAuth, requirePlayer } = require('../middleware/auth');

// POST /api/auth/register — Public (Player signup)
router.post('/register', registerPlayer);

// POST /api/auth/login — Public (Unified login)
router.post('/login', loginUser);

// GET /api/auth/me — Private (Get current user profile)
router.get('/me', requireAuth, getProfile);

// GET /api/auth/bookings — Private (Get player's booking history)
router.get('/bookings', requireAuth, requirePlayer, getPlayerBookings);

module.exports = router;
