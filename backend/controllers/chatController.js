const supabase = require('../database/supabase');
const { callGrok } = require('../services/grok');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/chat
 * Main chat endpoint — receives message, calls Grok, saves to DB
 */
async function handleChat(req, res) {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    const sid = sessionId || uuidv4();

    // Ensure session exists in DB
    await supabase.from('sessions').upsert(
      { id: sid, last_active: new Date().toISOString() },
      { onConflict: 'id' }
    );

    // Fetch recent chat history for context (last 10 messages)
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sid)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build message array for Grok
    const messages = [
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() }
    ];

    // Call AI
    const aiResponse = await callGrok(messages);

    // Save user message to DB
    await supabase.from('messages').insert({
      session_id: sid,
      role: 'user',
      content: message.trim(),
      intent: aiResponse.intent || 'other',
    });

    // Save AI response to DB
    await supabase.from('messages').insert({
      session_id: sid,
      role: 'assistant',
      content: aiResponse.reply,
      intent: aiResponse.intent || 'other',
    });

    return res.json({
      reply: aiResponse.reply,
      intent: aiResponse.intent || 'other',
      sessionId: sid,
      leadDetected: aiResponse.lead_detected || false,
      suggestedActions: aiResponse.suggested_actions || [],
    });

  } catch (error) {
    console.error('Chat error:', error.message);
    return res.status(500).json({
      error: 'Something went wrong',
      reply: "I'm having a small technical issue right now. Please try again in a moment! 🙏",
    });
  }
}

module.exports = { handleChat };
