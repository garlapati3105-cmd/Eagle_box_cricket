require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const chatRoutes = require('./routes/chat');
const slotsRoutes = require('./routes/slots');
const leadsRoutes = require('./routes/leads');
const feedbackRoutes = require('./routes/feedback');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4000;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://eagle-box-cricket.vercel.app',
    /\.vercel\.app$/,
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many messages. Please wait a moment.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

app.use(generalLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/slots', slotsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authLimiter, authRoutes);


// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Eagle Box Cricket AI Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: '🦅 Eagle Box Cricket AI Backend',
    version: '1.0.0',
    docs: '/health',
    endpoints: ['/api/chat', '/api/slots', '/api/leads', '/api/feedback', '/api/admin'],
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server (Vercel Compatibility) ────────────────────────────────────
const { provisionAdmin } = require('./controllers/adminController');

// Vercel serverless functions shouldn't call app.listen(), Vercel handles the HTTP server.
// We only call app.listen() if we're running locally (not on Vercel).
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🦅 Eagle Box Cricket AI Backend`);
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 Grok API: ${process.env.GROK_API_KEY && process.env.GROK_API_KEY !== 'xai-your-grok-api-key-here' ? '✅ Configured' : '⚠️  Demo Mode (add GROK_API_KEY to .env)'}`);
    console.log(`🗄️  Supabase: ${process.env.SUPABASE_URL ? '✅ Configured' : '⚠️  Not configured'}`);
    console.log(`📧 Email: ${process.env.EMAIL_USER ? '✅ Configured' : '⚠️  Not configured'}\n`);
    
    // Auto-provision admin user in database locally
    if (process.env.SUPABASE_URL) {
      provisionAdmin();
    }
  });
}

module.exports = app;
