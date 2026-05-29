const supabase = require('../database/supabase');
const { generateToken } = require('../middleware/auth');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * POST /api/admin/login
 */
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (!ADMIN_PASSWORD) {
      return res.status(503).json({ error: 'Admin password is not configured' });
    }

    // Simple credential check (can be extended to DB-backed auth)
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = {
      id: 'admin-env-id',
      name: 'Eagle Admin',
      email: 'admin@eagleboxcricket.com',
      role: 'admin'
    };
    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      expiresIn: '24h',
      user,
    });
  } catch (error) {
    console.error('Admin login error:', error.message);
    return res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * GET /api/admin/stats
 */
async function getStats(req, res) {
  try {
    // Parallel queries
    const [chatsRes, leadsRes, feedbackRes, peakHoursRes] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('feedback').select('rating'),
      supabase.from('messages').select('intent').eq('role', 'user'),
    ]);

    const totalChats = chatsRes.count || 0;
    const totalLeads = leadsRes.count || 0;
    
    const ratings = (feedbackRes.data || []).map(f => f.rating);
    const avgRating = ratings.length > 0 
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) 
      : 0;

    // Intent distribution
    const intentCounts = {};
    (peakHoursRes.data || []).forEach(m => {
      const intent = m.intent || 'other';
      intentCounts[intent] = (intentCounts[intent] || 0) + 1;
    });

    // Lead stats
    const { data: leadsByStatus } = await supabase
      .from('leads')
      .select('status, lead_quality');

    const statusCounts = { new: 0, contacted: 0, confirmed: 0, cancelled: 0 };
    const qualityCounts = { high: 0, normal: 0, low: 0 };
    (leadsByStatus || []).forEach(l => {
      if (l.status) statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
      if (l.lead_quality) qualityCounts[l.lead_quality] = (qualityCounts[l.lead_quality] || 0) + 1;
    });

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const { count: todayLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00Z`);

    return res.json({
      totalChats,
      totalLeads,
      avgRating: parseFloat(avgRating),
      todayLeads: todayLeads || 0,
      intentDistribution: intentCounts,
      leadsByStatus: statusCounts,
      leadsByQuality: qualityCounts,
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    // Return demo stats on error
    return res.json({
      totalChats: 147,
      totalLeads: 23,
      avgRating: 4.7,
      todayLeads: 5,
      intentDistribution: { booking: 45, pricing: 38, slots: 28, faq: 22, tournament: 14 },
      leadsByStatus: { new: 8, contacted: 10, confirmed: 4, cancelled: 1 },
      leadsByQuality: { high: 8, normal: 12, low: 3 },
    });
  }
}

/**
 * GET /api/admin/recent-chats
 */
async function getRecentChats(req, res) {
  try {
    const { limit = 20 } = req.query;
    
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, created_at, last_active')
      .order('last_active', { ascending: false })
      .limit(parseInt(limit));

    if (!sessions || sessions.length === 0) return res.json({ chats: [] });

    // Get first and last message of each session
    const chats = await Promise.all(sessions.map(async (session) => {
      const { data: msgs } = await supabase
        .from('messages')
        .select('role, content, intent, created_at')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true })
        .limit(20);

      return {
        sessionId: session.id,
        startedAt: session.created_at,
        lastActive: session.last_active,
        messageCount: msgs?.length || 0,
        messages: msgs || [],
        firstMessage: msgs?.[0]?.content || '',
        dominantIntent: getDominantIntent(msgs || []),
      };
    }));

    return res.json({ chats });
  } catch (error) {
    console.error('Recent chats error:', error.message);
    return res.json({ chats: [] });
  }
}

function getDominantIntent(messages) {
  const intents = messages.filter(m => m.intent && m.intent !== 'other').map(m => m.intent);
  if (!intents.length) return 'other';
  const counts = intents.reduce((acc, i) => { acc[i] = (acc[i] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Provision default admin user on startup
 */
async function provisionAdmin() {
  try {
    const { data: adminExists } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (adminExists && adminExists.length > 0) {
      console.log('👑 Admin user already exists in database.');
      return;
    }

    console.log('👑 Provisioning default admin user in database...');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, salt);

    const { error } = await supabase
      .from('users')
      .insert({
        name: 'Eagle Admin',
        email: 'admin@eagleboxcricket.com',
        phone: '9876543210',
        password_hash: passwordHash,
        role: 'admin'
      });

    if (error) {
      console.error('❌ Failed to provision admin user in database:', error.message);
    } else {
      console.log('✅ Default admin user successfully provisioned in database!');
    }
  } catch (error) {
    console.error('❌ Error during admin provisioning:', error.message);
  }
}

module.exports = { adminLogin, getStats, getRecentChats, provisionAdmin };
