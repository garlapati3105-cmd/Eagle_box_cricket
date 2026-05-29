const venueInfo = require('../data/venueInfo.json');
const faqs = require('../data/faqs.json');
const offers = require('../data/offers.json');
const tournament = require('../data/tournament.json');
const rules = require('../data/rules.json');

/**
 * Build the complete knowledge base context string for the AI system prompt
 */
function getFullContext() {
  return `
### VENUE INFORMATION
Name: ${venueInfo.name}
Location: ${venueInfo.location}
Timings: ${venueInfo.timings}
Contact: ${venueInfo.contact}
Sports Available: ${venueInfo.sports.join(', ')}
Turf Size: ${venueInfo.turf_size}
Capacity: ${venueInfo.capacity}

### PRICING
- Weekday (Mon–Fri): ₹${venueInfo.pricing.weekday_per_hour}/hour
- Weekend (Sat–Sun): ₹${venueInfo.pricing.weekend_per_hour}/hour
- Tournament Package: ₹${venueInfo.pricing.tournament_package}
- Morning Discount: ${venueInfo.pricing.morning_discount_percent}% off during ${venueInfo.pricing.morning_hours} on weekdays

### FACILITIES
- Parking: ${venueInfo.facilities.parking ? 'Free parking for 20+ vehicles' : 'No'}
- Washrooms: ${venueInfo.facilities.washrooms ? 'Yes, clean washrooms available' : 'No'}
- Food Stall: ${venueInfo.facilities.food_stall ? 'Yes, snacks and beverages available' : 'No'}
- Floodlights: ${venueInfo.facilities.floodlights ? 'Yes, full floodlight for night games' : 'No'}
- Equipment Rental: ${venueInfo.facilities.equipment_rental ? 'Yes, bats/balls/rackets available' : 'No'}
- Changing Rooms: ${venueInfo.facilities.changing_rooms ? 'Yes, available' : 'No'}

### CURRENT OFFERS
${offers.active_offers.map(o => `- ${o.title}: ${o.description} (Code: ${o.code})`).join('\n')}

### TOURNAMENTS
${tournament.upcoming_tournaments.map(t => 
  `- ${t.name} | ${t.sport} | Date: ${t.date} | Entry: ₹${t.entry_fee} | Prize: ₹${t.prize_pool} | Team: ${t.team_size}`
).join('\n')}

### VENUE RULES
${rules.rules.slice(0, 8).map((r, i) => `${i + 1}. ${r}`).join('\n')}

### CANCELLATION POLICY
- 24+ hours before: ${rules.cancellation_policy['24_hours_before']}
- 12–24 hours before: ${rules.cancellation_policy['12_to_24_hours_before']}
- Less than 12 hours: ${rules.cancellation_policy['less_than_12_hours']}
- No-show: ${rules.cancellation_policy['no_show']}

### FREQUENTLY ASKED QUESTIONS
${faqs.faqs.slice(0, 10).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')}
  `.trim();
}

/**
 * Search knowledge base for relevant FAQ answers
 */
function searchFAQ(query) {
  const q = query.toLowerCase();
  return faqs.faqs.filter(faq => {
    const qWords = q.split(' ').filter(w => w.length > 3);
    return qWords.some(word => 
      faq.question.toLowerCase().includes(word) || 
      faq.answer.toLowerCase().includes(word)
    );
  });
}

module.exports = { getFullContext, searchFAQ };
