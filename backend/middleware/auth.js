const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  console.warn('JWT_SECRET is not set. Using an unsafe development-only fallback.');
}

const ACTIVE_JWT_SECRET = JWT_SECRET || 'dev_only_eagle_box_cricket_secret';

/**
 * Middleware to verify JWT user token
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'No authentication token provided' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ACTIVE_JWT_SECRET);
    req.user = decoded; // Contains id, email, name, role
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized', message: 'Token expired, please login again' });
    }
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
}

/**
 * Middleware to enforce Admin-only route access
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Admin access required for this resource' 
    });
  }
  next();
}

function requirePlayer(req, res, next) {
  if (!req.user || req.user.role !== 'player') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Player access required for this resource'
    });
  }
  next();
}

/**
 * Generate JWT token for user (both players and admins)
 */
function generateToken(userData) {
  return jwt.sign(userData, ACTIVE_JWT_SECRET, { expiresIn: '24h' });
}

function getActiveJwtSecret() {
  return ACTIVE_JWT_SECRET;
}

module.exports = { requireAuth, requireAdmin, requirePlayer, generateToken, getActiveJwtSecret };
