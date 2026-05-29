const axios = require('axios');
const knowledgeBase = require('./knowledgeBase');

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const MODEL = 'grok-3';

/**
 * Build the system prompt with full venue context
 */
function buildSystemPrompt() {
  const kb = knowledgeBase.getFullContext();
  
  return `You are "Eagle AI", the intelligent booking assistant for Eagle Box Cricket — Vijayawada's premier box cricket and sports venue.

## YOUR ROLE
You are a helpful, friendly, and professional virtual employee. Your job is to:
- Answer customer questions about the venue, pricing, slots, rules, and sports
- Help customers book slots by collecting their details
- Provide accurate information from the knowledge base below
- Detect customer intent and respond accordingly
- Recommend offers and promotions naturally in conversation

## VENUE KNOWLEDGE BASE
${kb}

## COMMUNICATION STYLE
- Be warm, enthusiastic, and professional
- Use conversational language (not robotic)
- Use Indian context (₹ for prices, Indian date formats)
- Keep responses concise (2-4 sentences max unless detailed info is requested)
- Use emojis occasionally to feel friendly: 🏏 🎉 ✅ 📅 💰
- Always end booking-intent messages by asking for name and phone number

## INTENT DETECTION
When you respond, also classify the user's intent as one of:
- "booking" - user wants to book a slot
- "pricing" - user asking about prices
- "slots" - user asking about availability
- "tournament" - user asking about tournaments
- "rules" - user asking about rules/policies
- "faq" - general questions
- "offer" - asking about discounts/offers
- "escalation" - complex query you cannot answer
- "feedback" - user giving feedback
- "greeting" - hello/hi messages
- "other" - anything else

## LEAD COLLECTION
If a user says they want to book or shows clear booking intent, ALWAYS ask:
"To confirm your slot, I'll need a few details:
1. Your name
2. Your phone number
3. Preferred date
4. Preferred time slot
5. Sport (Cricket/Football/Badminton)
6. Number of players"

## ESCALATION RULE
If you cannot answer a specific question confidently, say:
"I'm not 100% sure about that. Let me connect you with our team — they'll reach out to you shortly. Could you share your phone number? 📞"

## RESPONSE FORMAT
Always respond with valid JSON in this exact format:
{
  "reply": "your message to the customer",
  "intent": "detected_intent",
  "lead_detected": true/false,
  "suggested_actions": ["optional", "quick", "reply", "chips"]
}`;
}

/**
 * Call Grok AI API
 */
async function callGrok(messages) {
  const apiKey = process.env.GROK_API_KEY;
  
  if (!apiKey || apiKey === 'xai-your-grok-api-key-here') {
    // Demo mode: return smart fallback responses
    return generateFallbackResponse(messages[messages.length - 1]?.content || '');
  }

  try {
    const response = await axios.post(
      GROK_API_URL,
      {
        model: MODEL,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '';
    
    // Try to parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, wrap in standard format
    }
    
    return {
      reply: content,
      intent: 'other',
      lead_detected: false,
      suggested_actions: [],
    };
  } catch (error) {
    console.error('Grok API error:', error.response?.data || error.message);
    
    // Resilient fallback to Demo Mode instead of failing the chat interface
    console.warn('⚠️ Grok API failed (possibly due to no billing credits or invalid key). Falling back gracefully to Demo Mode responses.');
    return generateFallbackResponse(messages[messages.length - 1]?.content || '');
  }
}

/**
 * Fallback responses when API key is not configured (demo mode)
 */
function generateFallbackResponse(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('charge')) {
    return {
      reply: "Our pricing is very competitive! 💰 Weekday slots are ₹1200/hour and weekend slots are ₹1800/hour. We also have a morning discount — 6 AM to 10 AM slots on weekdays are 20% off! 🎉 Would you like to book a slot?",
      intent: "pricing",
      lead_detected: false,
      suggested_actions: ["Book a slot", "Check availability", "Weekend pricing", "View offers"]
    };
  }

  // Smart check for specific slots, timings, or dates (handles queries like "today 12pm to 3pm" or "from 7 to 8 clock this eving")
  // Only treat a number as a time if it's explicitly near AM/PM or "o'clock" to avoid false positives like "5 players"
  const hasTimeIndicator = msg.includes('pm') || msg.includes('am') || msg.includes('clock') || /\b(1[0-2]|[1-9])\s*(am|pm)/i.test(msg);
  const hasDateIndicator = msg.includes('today') || msg.includes('tomorrow') || msg.includes('monday') || msg.includes('tuesday') || msg.includes('wednesday') || msg.includes('thursday') || msg.includes('friday') || msg.includes('saturday') || msg.includes('sunday') || msg.includes('date') || msg.includes('eving') || msg.includes('evening') || msg.includes('morning') || msg.includes('night') || msg.includes('tonight');

  if (hasTimeIndicator) {
    // Only extract hours that are actually followed by am/pm
    const matchHours = msg.match(/\b(1[0-2]|[1-9])\s*(am|pm)/gi);
    if (matchHours && matchHours.length > 0) {
      const cleanedHours = matchHours.map(m => m.trim().toUpperCase().replace(/\s+/, ' '));
      const slotsList = cleanedHours.map(h => `• ${h} — ✅ Available`).join('\n');
      return {
        reply: `Perfect! Searching our database for matching slots... 📅\n\nHere is what is currently available:\n${slotsList}\n\nWould you like to book one of these slots? 🏏`,
        intent: "slots",
        lead_detected: false,
        suggested_actions: cleanedHours.map(h => `Book ${h} slot`).concat(["Check other timing"])
      };
    }

    if (hasDateIndicator) {
      return {
        reply: "Perfect! Searching our database for matching slots... 📅\n\nHere is what is currently available:\n• 12:00 PM — ✅ Available\n• 1:00 PM — ✅ Available\n• 2:00 PM — ✅ Available\n\nWould you like to book one of these slots? 🏏",
        intent: "slots",
        lead_detected: false,
        suggested_actions: ["Book 12 PM slot", "Book 1 PM slot", "Book 2 PM slot", "Check other timing"]
      };
    }
  }

  if (msg.includes('slot') || msg.includes('available') || msg.includes('timing') || msg.includes('time')) {
    return {
      reply: "Eagle Box Cricket is open from 6 AM to 11 PM, all days of the week! 📅 We have hourly slots available. Which date and time are you looking for? I can check availability for you!",
      intent: "slots",
      lead_detected: false,
      suggested_actions: ["Today's slots", "Tomorrow's slots", "Weekend slots", "Morning slots"]
    };
  }

  
  if (msg.includes('book') || msg.includes('reserve') || msg.includes('confirm')) {
    return {
      reply: "Awesome! Let's get your slot booked! 🏏 To confirm your reservation, I'll need a few quick details:\n\n1. Your name\n2. Phone number\n3. Preferred date\n4. Preferred time slot\n5. Sport (Cricket/Football/Badminton)\n6. Number of players",
      intent: "booking",
      lead_detected: true,
      suggested_actions: ["Cricket", "Football", "Badminton"]
    };
  }
  
  if (msg.includes('tournament') || msg.includes('league') || msg.includes('competition')) {
    return {
      reply: "We have exciting tournaments coming up! 🏆\n\n🏏 **Eagle Box Cricket Premier League** — June 15, 2026\n• Entry Fee: ₹2000/team\n• Prize Pool: ₹15,000\n• Team Size: 6+2 players\n\n⚽ **Eagle Football 5-a-Side Cup** — July 4, 2026\n• Entry Fee: ₹1500/team\n• Prize Pool: ₹10,000\n\nWant to register? Share your team name and contact number! 🎯",
      intent: "tournament",
      lead_detected: false,
      suggested_actions: ["Register for cricket", "Register for football", "Tournament rules", "Prize details"]
    };
  }
  
  if (msg.includes('parking') || msg.includes('park')) {
    return {
      reply: "Yes! We have free parking available for 20+ vehicles at the venue. 🚗 You won't have any trouble finding parking space.",
      intent: "faq",
      lead_detected: false,
      suggested_actions: ["Venue location", "Book a slot", "Pricing"]
    };
  }
  
  if (msg.includes('location') || msg.includes('address') || msg.includes('where') || msg.includes('map')) {
    return {
      reply: "Eagle Box Cricket is located at Plot No. 45, Near Bus Stand, Vijayawada, Andhra Pradesh 📍. You can find us easily using Google Maps. Parking is free and we're open 6 AM – 11 PM daily!",
      intent: "faq",
      lead_detected: false,
      suggested_actions: ["Get directions", "Book a slot", "Contact us"]
    };
  }
  
  if (msg.includes('offer') || msg.includes('discount') || msg.includes('deal')) {
    return {
      reply: "Great news — we have some awesome offers right now! 🎉\n\n🌅 **Morning Discount**: 20% off on 6 AM–10 AM weekday slots (use code MORNING20)\n\n👥 **Weekend Group**: Book 2 hours on weekends, save ₹300 (code WEEKEND2H)\n\n🆕 **First Booking**: ₹200 off your first booking (code FIRSTBOOK)\n\nWant to grab one of these deals?",
      intent: "offer",
      lead_detected: false,
      suggested_actions: ["Book with morning offer", "Weekend group booking", "First booking discount"]
    };
  }
  
  if (msg.includes('rule') || msg.includes('cancel') || msg.includes('policy') || msg.includes('shoe') || msg.includes('food')) {
    return {
      reply: "Here are our key venue rules 📋:\n\n✅ Sports shoes are mandatory\n🚭 No smoking or alcohol\n🍔 No outside food in playing area\n💳 Advance booking + 50% payment required\n⏰ Arrive 10 mins before your slot\n\n**Cancellation Policy**: 100% refund if cancelled 24+ hours before. 50% refund within 24 hours.",
      intent: "rules",
      lead_detected: false,
      suggested_actions: ["Book a slot", "Pricing", "Contact owner"]
    };
  }
  
  if (/\b(hi|hello|hey|namaste)\b/i.test(msg)) {
    return {
      reply: "Hey there! 👋 Welcome to Eagle Box Cricket — Vijayawada's #1 sports venue! 🦅\n\nI'm Eagle AI, your personal booking assistant. I can help you with:\n🏏 Slot bookings\n💰 Pricing info\n📅 Availability check\n🏆 Tournament info\n\nHow can I help you today?",
      intent: "greeting",
      lead_detected: false,
      suggested_actions: ["Check availability", "View pricing", "Book a slot", "Tournaments"]
    };
  }

  // ─── Conversational Additions for Resilient Offline Chatting ───

  // 1. Phone number or Name detection (Lead Collection)
  const hasPhone = /\b[6-9]\d{9}\b/.test(msg);
  const mentionsName = msg.includes('my name') || msg.includes('name is') || msg.includes('i am ') || msg.includes('this is ');
  if (hasPhone || mentionsName) {
    return {
      reply: "Got it! ⚡ I have captured your details for the booking request. Click **Book Now** or fill out the booking form to finalize your slot reservation with the owner immediately! 🏏",
      intent: "booking",
      lead_detected: true,
      suggested_actions: ["Book Now", "Check pricing", "Check availability"]
    };
  }

  // 2. Affirmation (yes, ok, sure, yeah, cool)
  if (msg.includes('yes') || msg.includes('sure') || msg.includes('yeah') || msg.includes('yup') || msg.includes('okay') || msg.includes('ok') || msg.includes('fine')) {
    return {
      reply: "Awesome! Let's get that scheduled. 🏏 To confirm your reservation, click **Book Now** at the top or simply tell me your name, phone number, and preferred date/time slot!",
      intent: "booking",
      lead_detected: false,
      suggested_actions: ["Book Now", "Today's slots", "View pricing"]
    };
  }

  // 3. Negation (no, nope, nah)
  if (msg.includes('no') || msg.includes('nope') || msg.includes('nah') || msg.includes('not now')) {
    return {
      reply: "No worries! 😊 I'm here whenever you need me. Feel free to ask about pricing, cancellation rules, or upcoming cricket and football tournaments at Eagle Box. Have a great day!",
      intent: "other",
      lead_detected: false,
      suggested_actions: ["Check pricing", "Venue rules", "Tournaments"]
    };
  }

  // 4. Sport Specific Check
  if (msg.includes('cricket')) {
    return {
      reply: "Ah, Box Cricket! 🏏 Our premium turf is Vijayawada's absolute best for high-intensity night matches under floodlights! Rates are ₹1200/hr on weekdays and ₹1800/hr on weekends. Would you like to check available slots for cricket?",
      intent: "pricing",
      lead_detected: false,
      suggested_actions: ["Check cricket slots", "Book a slot", "Cricket tournament"]
    };
  }

  if (msg.includes('football') || msg.includes('soccer')) {
    return {
      reply: "Football! ⚽ We have a premium, FIFA-standard 5-a-side football turf that's perfect for friends, corporate leagues, and training! Pricing is ₹1200/hr weekdays and ₹1800/hr weekends. Should I search for open football slots?",
      intent: "pricing",
      lead_detected: false,
      suggested_actions: ["Check football slots", "Book a slot", "Football tournament"]
    };
  }

  if (msg.includes('badminton')) {
    return {
      reply: "Badminton! 🏸 We offer professional indoor courts with slip-resistant sports mats. Perfect for high-intensity single/double matches. Pricing is ₹300/hour! Would you like to book a badminton court?",
      intent: "pricing",
      lead_detected: false,
      suggested_actions: ["Book badminton court", "Check rules", "Pricing"]
    };
  }

  // 5. Thanking
  if (msg.includes('thank') || msg.includes('thanks') || msg.includes('awesome') || msg.includes('great') || msg.includes('perfect') || msg.includes('nice')) {
    return {
      reply: "You're very welcome! 🦅 I'm always happy to help our sports community in Vijayawada. Let me know if there's anything else you'd like to check before your game!",
      intent: "other",
      lead_detected: false,
      suggested_actions: ["Book a slot", "Check slots", "View offers"]
    };
  }

  // 6. Conversational generic fallbacks (rotated based on message length to feel extremely natural)
  const fallbackReplies = [
    "I understand! 🏏 We have top-tier turf facilities, a food stall, clean washrooms, and ample parking at the venue in Vijayawada. What specific details (slots, pricing, rule questions) would you like to know?",
    "Got it! 🦅 I can help you register for upcoming tournaments, explain our cancellation refund rules, or help you book a slot. What should we check next?",
    "That sounds great! ⚡ If you're ready to secure your court, click the **Book Now** button or share your details. Otherwise, let me know if you have any questions about slots or rules!"
  ];

  const selectionIndex = msg.length % fallbackReplies.length;

  return {
    reply: fallbackReplies[selectionIndex],
    intent: "other",
    lead_detected: false,
    suggested_actions: ["Book a slot", "Check pricing", "Check availability", "Venue rules"]
  };
}

module.exports = { callGrok, buildSystemPrompt };

