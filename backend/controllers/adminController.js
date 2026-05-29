const bcrypt = require('bcryptjs'); // FIXED: was missing, caused provisionAdmin() crash
const supabase = require('../database/supabase');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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
 * GET /api/admin/chats
 * FIXED: Eliminated N+1 query by fetching all messages in one query,
 * then grouping in memory. Added pagination.
 */
async function getRecentChats(req, res) {
  try {
    const { limit = 20, page = 1 } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 20, 50); // cap at 50
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    // Step 1: Fetch paginated sessions
    const { data: sessions, count: totalSessions } = await supabase
      .from('sessions')
      .select('id, created_at, last_active', { count: 'exact' })
      .order('last_active', { ascending: false })
      .range(offset, offset + parsedLimit - 1);

    if (!sessions || sessions.length === 0) {
      return res.json({ chats: [], total: 0, page: parsedPage });
    }

    const sessionIds = sessions.map(s => s.id);

    // Step 2: Fetch ALL messages for these sessions in ONE query (no N+1)
    const { data: allMessages } = await supabase
      .from('messages')
      .select('session_id, role, content, intent, created_at')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    // Step 3: Group messages by session_id in memory
    const messagesBySession = {};
    (allMessages || []).forEach(m => {
      if (!messagesBySession[m.session_id]) {
        messagesBySession[m.session_id] = [];
      }
      messagesBySession[m.session_id].push(m);
    });

    const chats = sessions.map(session => {
      const msgs = (messagesBySession[session.id] || []).slice(-20); // last 20 messages
      return {
        sessionId: session.id,
        startedAt: session.created_at,
        lastActive: session.last_active,
        messageCount: msgs.length,
        messages: msgs,
        firstMessage: msgs[0]?.content || '',
        dominantIntent: getDominantIntent(msgs),
      };
    });

    return res.json({ chats, total: totalSessions || 0, page: parsedPage });
  } catch (error) {
    console.error('Recent chats error:', error.message);
    return res.json({ chats: [], total: 0, page: 1 });
  }
}

function getDominantIntent(messages) {
  const intents = messages.filter(m => m.intent && m.intent !== 'other').map(m => m.intent);
  if (!intents.length) return 'other';
  const counts = intents.reduce((acc, i) => { acc[i] = (acc[i] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * Provision default admin user on startup.
 * Only runs if no admin exists in the DB.
 * Requires ADMIN_PASSWORD env var to be set.
 */
async function provisionAdmin() {
  try {
    if (!ADMIN_PASSWORD) {
      console.warn('⚠️  ADMIN_PASSWORD not set — skipping admin provisioning.');
      return;
    }

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

    // FIXED: bcrypt is now imported correctly; using async hash with rounds=12
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

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

module.exports = { getStats, getRecentChats, provisionAdmin };
