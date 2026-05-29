const supabase = require('../database/supabase');
const { sendLeadNotification, sendCustomerConfirmation, sendOfficialConfirmation } = require('../services/email');
const { getActiveJwtSecret } = require('../middleware/auth');
const { parseSlotRange } = require('./slotController');

/**
 * POST /api/leads — Save a new booking lead
 */
async function createLead(req, res) {
  try {
    const { name, phone, email, sportType, preferredSlot, preferredDate, teamSize, message, sessionId } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({ error: 'Invalid Indian phone number (must be 10 digits starting with 6-9)' });
    }

    // ─── Auto-Link to Registered Player Account ───
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, getActiveJwtSecret());
        userId = decoded.id !== 'admin-env-id' ? decoded.id : null;
      } catch (e) {
        // Ignore token decode failures for public endpoints
      }
    }

    if (!userId && email) {
      const { data: matchedUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .eq('role', 'player')
        .limit(1);
      
      if (matchedUsers && matchedUsers.length > 0) {
        userId = matchedUsers[0].id;
      }
    }

    // Classify lead quality
    const leadQuality = classifyLeadQuality({ teamSize, sportType, preferredDate, preferredSlot });
    const customerType = classifyCustomerType({ teamSize, message, sportType });

    const leadData = {
      name: name.trim(),
      phone: phone.replace(/\s+/g, ''),
      email: email?.trim() || null,
      sport_type: sportType || 'Cricket',
      preferred_slot: preferredSlot || null,
      preferred_date: preferredDate || null,
      team_size: teamSize ? parseInt(teamSize) : null,
      message: message?.trim() || null,
      session_id: sessionId || null,
      lead_quality: leadQuality,
      customer_type: customerType,
      status: 'new',
      email_sent: false,
      user_id: userId,
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();


    if (error) {
      console.error('Lead insert error:', error);
      // Still try to send email even if DB fails
      await sendLeadNotification({ ...leadData, id: 'DB_ERROR' });
      return res.status(500).json({ error: 'Failed to save lead, but we received your details' });
    }

    // ─── AUTOMATICALLY BOOK/BLOCK SLOT(S) IN DATABASE ───
    if (lead.preferred_date && lead.preferred_slot) {
      try {
        const formattedDate = new Date(lead.preferred_date).toISOString().split('T')[0];
        const requestedSlots = parseSlotRange(lead.preferred_slot.trim());

        // Check if all requested slots are available
        const { data: existingSlots } = await supabase
          .from('slots')
          .select('id, slot_time, is_available, is_blocked')
          .eq('slot_date', formattedDate)
          .in('slot_time', requestedSlots)
          .eq('sport', lead.sport_type || 'Cricket');

        const unavailable = (existingSlots || []).filter(s => !s.is_available || s.is_blocked);
        if (unavailable.length > 0) {
          // Slots already taken — cancel this lead and notify
          await supabase.from('leads').update({ status: 'cancelled' }).eq('id', lead.id);
          return res.status(409).json({
            error: 'Conflict',
            message: 'Sorry! One or more selected slots are already booked. Please choose another slot.'
          });
        }

        // Block all hourly slots atomically
        const { data: blockedSlots } = await supabase
          .from('slots')
          .update({ is_available: false, booked_by_lead: lead.id })
          .eq('slot_date', formattedDate)
          .in('slot_time', requestedSlots)
          .eq('sport', lead.sport_type || 'Cricket')
          .eq('is_available', true)
          .eq('is_blocked', false)
          .select();

        // If not all slots were blocked (race condition), seed and retry
        if (!blockedSlots || blockedSlots.length < requestedSlots.length) {
          // Seed missing slots first
          const times = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];
          const rows = times.map(t => ({ slot_date: formattedDate, slot_time: t, sport: lead.sport_type || 'Cricket', is_available: true, is_blocked: false }));
          await supabase.from('slots').upsert(rows, { onConflict: 'slot_date,slot_time,sport', ignoreDuplicates: true });

          // Retry blocking
          await supabase
            .from('slots')
            .update({ is_available: false, booked_by_lead: lead.id })
            .eq('slot_date', formattedDate)
            .in('slot_time', requestedSlots)
            .eq('sport', lead.sport_type || 'Cricket')
            .eq('is_available', true)
            .eq('is_blocked', false);
        }
      } catch (slotErr) {
        console.error('⚠️ Slot auto-booking failed:', slotErr.message);
        // Do not fail the lead creation even if slot blocking fails
      }
    }

    // Send email notifications (don't await, fire and forget for speed)
    sendLeadNotification(lead).then(result => {
      if (result.success) {
        supabase.from('leads').update({ email_sent: true }).eq('id', lead.id);
      }
    });

    sendCustomerConfirmation(lead);


    return res.status(201).json({
      success: true,
      leadId: lead.id,
      message: 'Your booking request has been received! Our team will contact you within 30 minutes. 🎉',
    });

  } catch (error) {
    console.error('Create lead error:', error.message);
    return res.status(500).json({ error: 'Failed to submit booking request' });
  }
}

/**
 * GET /api/leads — Get all leads (admin only)
 */
async function getLeads(req, res) {
  try {
    const { page = 1, limit = 20, status, sport } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) query = query.eq('status', status);
    if (sport) query = query.eq('sport_type', sport);

    const { data: leads, count, error } = await query;

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch leads' });
    }

    return res.json({
      leads: leads || [],
      total: count || 0,
      page: parseInt(page),
      totalPages: Math.ceil((count || 0) / parseInt(limit)),
    });
  } catch (error) {
    console.error('Get leads error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch leads' });
  }
}

/**
 * PATCH /api/leads/:id/status — Update lead status
 */
async function updateLeadStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'confirmed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Status update error:', error.message);
      return res.status(500).json({ error: 'Failed to update status' });
    }

    // ─── IF STATUS CHANGED TO CONFIRMED, SEND EMAIL TO PLAYER ───
    if (status === 'confirmed' && lead && lead.email) {
      // Fire-and-forget email trigger to maintain super-fast response time
      sendOfficialConfirmation(lead);
    }

    return res.json({ success: true, lead });
  } catch (error) {
    console.error('Update status exception:', error.message);
    return res.status(500).json({ error: 'Failed to update lead status' });
  }
}


function classifyLeadQuality({ teamSize, sportType, preferredDate, preferredSlot }) {
  let score = 0;
  if (teamSize && teamSize >= 8) score += 3;
  else if (teamSize && teamSize >= 4) score += 2;
  if (preferredDate) score += 2;
  if (preferredSlot) score += 2;
  if (sportType === 'Cricket') score += 1;
  
  if (score >= 6) return 'high';
  if (score >= 3) return 'normal';
  return 'low';
}

function classifyCustomerType({ teamSize, message, sportType }) {
  const msg = (message || '').toLowerCase();
  if (msg.includes('tournament') || msg.includes('league') || msg.includes('competition')) return 'tournament';
  if (teamSize >= 10 || msg.includes('corporate') || msg.includes('event') || msg.includes('party')) return 'regular';
  return 'casual';
}

/**
 * GET /api/leads/status — public booking status check via phone or ID
 */
async function getPublicLeadStatus(req, res) {
  try {
    const { query } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Phone number or Booking ID is required' });
    }

    const searchQuery = query.trim();
    let dbQuery = supabase
      .from('leads')
      .select('id, name, sport_type, preferred_date, preferred_slot, status, created_at');

    // Detect if search query is UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchQuery);

    if (isUUID) {
      dbQuery = dbQuery.eq('id', searchQuery);
    } else {
      // Clean phone number (remove spaces)
      const cleanPhone = searchQuery.replace(/\s+/g, '');
      dbQuery = dbQuery.eq('phone', cleanPhone);
    }

    const { data: bookings, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) {
      console.error('Public lead status error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch booking details' });
    }

    return res.json({
      success: true,
      bookings: bookings || []
    });

  } catch (error) {
    console.error('Public lead status exception:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createLead, getLeads, updateLeadStatus, getPublicLeadStatus };
