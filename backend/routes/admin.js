const express = require('express');
const router = express.Router();
const { getStats, getRecentChats } = require('../controllers/adminController');
const { loginUser } = require('../controllers/authController');
const { getLeads } = require('../controllers/leadController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /api/admin/login — public
router.post('/login', (req, res) => {
  req.body = {
    emailOrUsername: req.body.username || req.body.emailOrUsername,
    password: req.body.password,
    role: 'admin'
  };
  return loginUser(req, res);
});

// GET /api/admin/stats — admin only
router.get('/stats', requireAuth, requireAdmin, getStats);

// GET /api/admin/chats — admin only
router.get('/chats', requireAuth, requireAdmin, getRecentChats);

// GET /api/admin/leads — admin only
router.get('/leads', requireAuth, requireAdmin, getLeads);

// GET /api/admin/me — verify token
router.get('/me', requireAuth, requireAdmin, (req, res) => {
  res.json({ username: req.user.name || req.user.email, role: req.user.role });
});

module.exports = router;
