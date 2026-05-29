const supabase = require('../database/supabase');
const { createLead } = require('./leadController');
const jwt = require('jsonwebtoken');
const { getActiveJwtSecret } = require('../middleware/auth');

const JWT_SECRET = getActiveJwtSecret();

/**
 * GET /api/slots?date=YYYY-MM-DD&sport=Cricket
 */
async function getSlots(req, res) {
  try {
    const { date, sport = 'Cricket' } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const today = new Date().toISOString().split('T')[0];
      return getSlotsByDate(res, today, sport);
    }

    return getSlotsByDate(res, date, sport);
  } catch (error) {
    console.error('Slots error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch slots' });
  }
}

async function getSlotsByDate(res, date, sport) {
  const { data: slots, error } = await supabase
    .from('slots')
    .select('*')
    .eq('slot_date', date)
    .eq('sport', sport)
    .order('slot_time', { ascending: true });

  if (error) {
    console.error('Supabase slots error:', error);
    return res.json(getMockSlots(date, sport));
  }

  if (!slots || slots.length === 0) {
    await seedSlotsForDate(date, sport);
    // Fetch again
    const { data: newSlots } = await supabase
      .from('slots')
      .select('*')
      .eq('slot_date', date)
      .eq('sport', sport)
      .order('slot_time', { ascending: true });
      
    return res.json(formatSlotsResponse(date, sport, newSlots || []));
  }

  return res.json(formatSlotsResponse(date, sport, slots));
}

function formatSlotsResponse(date, sport, slots) {
  const available = slots.filter(s => s.is_available && !s.is_blocked).map(s => s.slot_time);
  const booked = slots.filter(s => !s.is_available || s.is_blocked).map(s => s.slot_time);

  return {
    date,
    sport,
    available,
    booked,
    total: slots.length,
    slots: slots.map(s => ({
      id: s.id,
      slot_time: s.slot_time,
      is_available: s.is_available,
      is_blocked: s.is_blocked,
      booked_by_lead: s.booked_by_lead
    }))
  };
}

/**
 * GET /api/slots/10-days?sport=Cricket
 * Consolidated 10-day availability query
 */
async function get10DaySlots(req, res) {
  try {
    const { sport = 'Cricket' } = req.query;
    const dates = [];
    const todayObj = new Date();

    // Generate dates for next 10 days
    for (let i = 0; i < 10; i++) {
      const d = new Date(todayObj);
      d.setDate(todayObj.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    // Query for all slots in this 10-day range
    const { data: slots, error } = await supabase
      .from('slots')
      .select('*')
      .in('slot_date', dates)
      .eq('sport', sport)
      .order('slot_date', { ascending: true });

    if (error) {
      console.error('Supabase 10-day slots error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch availability schedule' });
    }

    // Group slots by date and seed if missing
    const grouped = [];
    
    for (let i = 0; i < dates.length; i++) {
      const dateStr = dates[i];
      let daySlots = slots ? slots.filter(s => s.slot_date === dateStr) : [];
      
      // Auto-seed day if not in Supabase yet
      if (daySlots.length === 0) {
        await seedSlotsForDate(dateStr, sport);
        // Quick query again
        const { data: freshSlots } = await supabase
          .from('slots')
          .select('*')
          .eq('slot_date', dateStr)
          .eq('sport', sport);
        daySlots = freshSlots || [];
      }

      // Format Day Name
      let dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
      if (i === 0) dayName = 'Today';
      else if (i === 1) dayName = 'Tomorrow';

      const available = daySlots.filter(s => s.is_available && !s.is_blocked);
      
      grouped.push({
        date: dateStr,
        dayName,
        displayDate: new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        availableCount: available.length,
        totalCount: daySlots.length,
        slots: daySlots.map(s => ({
          id: s.id,
          slot_time: s.slot_time,
          is_available: s.is_available,
          is_blocked: s.is_blocked,
          booked_by_lead: s.booked_by_lead
        }))
      });
    }

    return res.json({
      success: true,
      sport,
      dates: grouped
    });

  } catch (error) {
    console.error('10-day slot error:', error.message);
    return res.status(500).json({ error: 'Internal server error fetching availability' });
  }
}

/**
 * POST /api/slots/book (and /api/book-slot)
 * Atomic Conflict-Prevention slot reservation (supports multi-hour ranges)
 */
async function bookSlot(req, res) {
  try {
    const { name, phone, email, sportType, preferredSlot, preferredDate, teamSize, message, sessionId } = req.body;

    if (!name || !phone || !sportType || !preferredSlot || !preferredDate) {
      return res.status(400).json({ error: 'Name, phone, sport, date, and slot are required' });
    }

    if (!/^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({ error: 'Invalid Indian phone number (must be 10 digits starting with 6-9)' });
    }

    const formattedDate = new Date(preferredDate).toISOString().split('T')[0];
    const cleanSlot = preferredSlot.trim();
    const requestedSlots = parseSlotRange(cleanSlot);

    if (requestedSlots.length === 0) {
      return res.status(400).json({ error: 'Invalid slot time format' });
    }

    // ─── 1. CONFLICT PREVENTION (ATOMIC DOUBLE-BOOKING CHECK) ───
    const { data: existingSlots, error: slotsErr } = await supabase
      .from('slots')
      .select('*')
      .eq('slot_date', formattedDate)
      .in('slot_time', requestedSlots)
      .eq('sport', sportType);

    if (slotsErr) {
      return res.status(500).json({ error: 'Failed to verify slot availability' });
    }

    // Check if we need to seed
    if (!existingSlots || existingSlots.length < requestedSlots.length) {
      await seedSlotsForDate(formattedDate, sportType);
      const { data: freshSlots } = await supabase
        .from('slots')
        .select('*')
        .eq('slot_date', formattedDate)
        .in('slot_time', requestedSlots)
        .eq('sport', sportType);
      
      const unavailables = (freshSlots || []).filter(s => !s.is_available || s.is_blocked);
      if (unavailables.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Sorry! One or more of the selected slots are already booked. Please choose another slot.'
        });
      }
    } else {
      const unavailables = existingSlots.filter(s => !s.is_available || s.is_blocked);
      if (unavailables.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Sorry! One or more of the selected slots are already booked. Please choose another slot.'
        });
      }
    }

    // ─── 2. RESERVE AND BLOCK SLOTS IN THE DATABASE ───
    const { data: blockedSlots, error: blockErr } = await supabase
      .from('slots')
      .update({ is_available: false })
      .eq('slot_date', formattedDate)
      .in('slot_time', requestedSlots)
      .eq('sport', sportType)
      .eq('is_available', true)
      .eq('is_blocked', false)
      .select();

    if (blockErr || !blockedSlots || blockedSlots.length !== requestedSlots.length) {
      // Rollback any partial blocks
      if (blockedSlots && blockedSlots.length > 0) {
        const blockedIds = blockedSlots.map(s => s.id);
        await supabase.from('slots').update({ is_available: true }).in('id', blockedIds);
      }
      return res.status(409).json({
        error: 'Conflict',
        message: 'Sorry! A conflict occurred during booking. Please choose another slot.'
      });
    }

    // ─── 3. CREATE LEAD (using standard lead controller functionality) ───
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id !== 'admin-env-id' ? decoded.id : null;
      } catch (e) {}
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

    const { data: newLead, error: leadErr } = await supabase
      .from('leads')
      .insert({
        name: name.trim(),
        phone: phone.replace(/\s+/g, ''),
        email: email?.trim() || null,
        sport_type: sportType,
        preferred_slot: cleanSlot, // Store the original string (e.g. "6 PM to 8 PM")
        preferred_date: formattedDate,
        team_size: teamSize ? parseInt(teamSize) : null,
        message: message?.trim() || null,
        session_id: sessionId || null,
        status: 'new',
        user_id: userId
      })
      .select()
      .single();

    if (leadErr) {
      console.error('Lead creation err:', leadErr.message);
      // Re-open slots if lead insertion fails
      const blockedIds = blockedSlots.map(s => s.id);
      await supabase.from('slots').update({ is_available: true }).in('id', blockedIds);
      return res.status(500).json({ error: 'Failed to complete booking request' });
    }

    // ─── 4. LINK LEAD BACK TO ALL SEEDED SLOT ROWS ───
    const blockedIds = blockedSlots.map(s => s.id);
    await supabase
      .from('slots')
      .update({ booked_by_lead: newLead.id })
      .in('id', blockedIds);

    // ─── 5. TRIGGER CUSTOMER & OWNER EMAIL ALERTS (Fire & Forget) ───
    const { sendLeadNotification, sendCustomerConfirmation } = require('../services/email');
    sendLeadNotification(newLead).then(res => {
      if (res.success) {
        supabase.from('leads').update({ email_sent: true }).eq('id', newLead.id);
      }
    });
    sendCustomerConfirmation(newLead);

    return res.status(201).json({
      success: true,
      bookingId: newLead.id,
      message: 'Booking Confirmed! 🎉 Your slot is locked. Check your inbox for the booking ticket code.'
    });

  } catch (error) {
    console.error('Atomic booking error:', error.message);
    return res.status(500).json({ error: 'Failed to process slot booking' });
  }
}


/**
 * PATCH /api/admin/slots/update-slot (Admin Only)
 * Administrative slot control (block, open, maintenance)
 */
async function updateSlotAdmin(req, res) {
  try {
    const { date, slot_time, sport = 'Cricket', action } = req.body;

    if (!date || !slot_time || !action) {
      return res.status(400).json({ error: 'Date, slot_time, and action are required' });
    }

    const formattedDate = new Date(date).toISOString().split('T')[0];
    const cleanSlot = slot_time.trim();

    let updateFields = {};
    if (action === 'block' || action === 'maintenance') {
      updateFields = { is_available: false, is_blocked: true };
    } else if (action === 'open' || action === 'cancel') {
      updateFields = { is_available: true, is_blocked: false, booked_by_lead: null };
    } else {
      return res.status(400).json({ error: 'Invalid action type' });
    }

    // Check if slot exists first, otherwise insert it blocked
    const { data: existingSlot } = await supabase
      .from('slots')
      .select('id')
      .eq('slot_date', formattedDate)
      .eq('slot_time', cleanSlot)
      .eq('sport', sport)
      .single();

    let resultSlot = null;

    if (!existingSlot) {
      // Create new blocked slot
      const { data: newSlot, error: insertErr } = await supabase
        .from('slots')
        .insert({
          slot_date: formattedDate,
          slot_time: cleanSlot,
          sport,
          ...updateFields
        })
        .select()
        .single();
        
      if (insertErr) throw insertErr;
      resultSlot = newSlot;
    } else {
      // Update existing
      const { data: updatedSlot, error: updateErr } = await supabase
        .from('slots')
        .update(updateFields)
        .eq('slot_date', formattedDate)
        .eq('slot_time', cleanSlot)
        .eq('sport', sport)
        .select()
        .single();

      if (updateErr) throw updateErr;
      resultSlot = updatedSlot;
    }

    return res.json({
      success: true,
      message: `Slot successfully set to: ${action}`,
      slot: resultSlot
    });

  } catch (error) {
    console.error('Admin slot update error:', error.message);
    return res.status(500).json({ error: 'Failed to update slot settings' });
  }
}

async function seedSlotsForDate(date, sport) {
  const times = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];
  const rows = times.map(t => ({
    slot_date: date,
    slot_time: t,
    sport,
    is_available: true,
    is_blocked: false,
  }));
  
  await supabase.from('slots').upsert(rows, { onConflict: 'slot_date,slot_time,sport', ignoreDuplicates: true });
}

function getMockSlots(date, sport) {
  const allTimes = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];
  const bookedSlots = ['7 PM', '8 PM', '9 PM'];
  
  return {
    date,
    sport,
    available: allTimes.filter(t => !bookedSlots.includes(t)),
    booked: bookedSlots,
    total: allTimes.length,
  };
}

/**
 * Parses slot ranges like "6 PM to 8 PM" into individual hourly slots.
 */
function parseSlotRange(slotString) {
  const cleanStr = slotString.trim().toUpperCase();
  const rangeRegex = /^(\d{1,2})(?::00)?\s*(AM|PM)\s*(?:TO|-)\s*(\d{1,2})(?::00)?\s*(AM|PM)$/;
  const match = cleanStr.match(rangeRegex);

  if (!match) {
    const singleMatch = cleanStr.match(/^(\d{1,2})(?::00)?\s*(AM|PM)$/);
    if (singleMatch) return [`${singleMatch[1]} ${singleMatch[2]}`];
    return [slotString.trim()];
  }

  let startHour = parseInt(match[1], 10);
  const startMeridiem = match[2];
  let endHour = parseInt(match[3], 10);
  const endMeridiem = match[4];

  if (startMeridiem === 'PM' && startHour !== 12) startHour += 12;
  if (startMeridiem === 'AM' && startHour === 12) startHour = 0;
  
  if (endMeridiem === 'PM' && endHour !== 12) endHour += 12;
  if (endMeridiem === 'AM' && endHour === 12) endHour = 0;

  if (endHour < startHour) endHour += 24;

  const slots = [];
  if (startHour === endHour) {
    slots.push(`${match[1]} ${match[2]}`);
    return slots;
  }
  
  for (let currentHour = startHour; currentHour < endHour; currentHour++) {
    let h = currentHour % 24;
    let period = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    slots.push(`${h} ${period}`);
  }
  
  return slots;
}

module.exports = { getSlots, get10DaySlots, bookSlot, updateSlotAdmin, parseSlotRange };
