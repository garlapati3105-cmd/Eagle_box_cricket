# 🚀 Quick Start - 10-Day Slot Availability System

## 5-Minute Setup

### 1. **Access the Slot Calendar**
```
URL: http://localhost:3000/slots
```

### 2. **Browse Slots**
- Scroll horizontally to see more days
- Check availability percentages
- Note: Green = Available, Red = Booked, Amber = Blocked

### 3. **Filter Slots**
- Use time filters (Morning/Afternoon/Evening/Night)
- Use availability filters (Available/Booked)
- Search by time or date name
- Click "Reset" to clear filters

### 4. **Book a Slot**
- Click any green (available) slot
- Fill in the form (name, phone required)
- Click "Confirm Booking"
- Check email for confirmation

---

## Common Tasks

### View 10 Days in Dashboard
The player dashboard at `/dashboard` now includes a preview section:
1. Scroll down to "Browse Available Slots"
2. Click "View All Slots →" for full calendar

### Admin: Block a Slot
1. Access admin panel
2. Find slot management section
3. Select date and time
4. Click "Block Slot"

### Admin: Open a Blocked Slot
1. Go to slot management
2. Select the blocked slot
3. Click "Open Slot"

### Customize Slot Times
Edit `backend/controllers/slotController.js`:
```javascript
// Line: const times = ['6 AM','7 AM',...,'10 PM'];
// Modify this array to your desired times
```

### Change Number of Days
Edit `backend/controllers/slotController.js`:
```javascript
// Line: for (let i = 0; i < 10; i++)
// Change 10 to your desired number
```

---

## Component Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| **SlotCalendarView** | `components/SlotCalendarView.tsx` | Main calendar container |
| **DayColumn** | `components/DayColumn.tsx` | Single day card |
| **SlotCard** | `components/SlotCard.tsx` | Individual slot button |
| **SlotBookingModal** | `components/SlotBookingModal.tsx` | Booking form |
| **SlotFilter** | `components/SlotFilter.tsx` | Search & filter controls |
| **AvailabilityLegend** | `components/AvailabilityLegend.tsx` | Status legend |
| **AdminSlotManager** | `components/AdminSlotManager.tsx` | Admin controls |

---

## API Quick Reference

### Get 10 Days of Slots
```bash
curl http://localhost:4000/api/slots/10-days?sport=Cricket
```

### Book a Slot
```bash
curl -X POST http://localhost:4000/api/slots/book \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "sportType": "Cricket",
    "preferredSlot": "7 PM",
    "preferredDate": "2026-05-29",
    "teamSize": 6
  }'
```

### Admin: Manage Slot
```bash
curl -X PATCH http://localhost:4000/api/slots/admin/update-slot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "date": "2026-05-28",
    "slot_time": "7 PM",
    "sport": "Cricket",
    "action": "block"
  }'
```

---

## Troubleshooting

### Slots Not Loading?
1. Check Supabase connection in backend logs
2. Verify `NEXT_PUBLIC_API_URL` in frontend
3. Check browser network tab for API errors

### Booking Fails?
1. Verify phone number is 10 digits
2. Check if slot was just booked by someone else
3. Look for backend error logs
4. Check database connection

### Filters Not Working?
1. Ensure JavaScript is enabled
2. Clear browser cache
3. Check console for errors
4. Refresh the page

### Mobile Layout Issues?
1. Test on actual mobile device
2. Check viewport meta tag
3. Verify Tailwind responsive classes
4. Test in different browsers

---

## File Structure

```
frontend/
├── components/
│   ├── SlotCard.tsx (40 lines)
│   ├── DayColumn.tsx (130 lines)
│   ├── SlotCalendarView.tsx (280 lines)
│   ├── SlotBookingModal.tsx (240 lines)
│   ├── SlotFilter.tsx (180 lines)
│   ├── AvailabilityLegend.tsx (60 lines)
│   └── AdminSlotManager.tsx (80 lines)
├── app/
│   ├── slots/
│   │   └── page.tsx (140 lines)
│   └── dashboard/
│       └── page.tsx (updated with slot preview)
└── lib/
    └── api.ts (updated with new endpoints)

backend/
├── routes/
│   └── slots.js (updated route order)
└── controllers/
    └── slotController.js (existing, working fine)
```

---

## Performance Tips

- **Disable Auto-Refresh**: Comment out setInterval in SlotCalendarView for offline testing
- **Optimize Queries**: Add more indexes if >10k slots
- **Cache Results**: Consider Redis for high traffic
- **Batch Seeding**: Pre-seed 30 days at startup instead of on-demand

---

## Customization Examples

### Change Colors
Edit `SlotCard.tsx` getStatusStyles() function:
```javascript
case 'available':
  return {
    bgColor: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    // Change emerald to your color (e.g., from-blue-400 to-blue-600)
  };
```

### Add More Filters
Edit `SlotFilter.tsx`:
```javascript
// Add new filter option in handleTimeChange/handleAvailabilityChange
const SPORTS = ['Cricket', 'Football', 'Badminton', 'Tennis']; // Add sports here
```

### Change Refresh Interval
Edit `SlotCalendarView.tsx`:
```javascript
// Refresh every 60 seconds instead of 30
const interval = setInterval(fetchSlots, 60000);
```

---

## Testing Scenarios

### Scenario 1: Book a Slot
1. Go to `/slots`
2. Click available slot
3. Fill form with valid data
4. Click "Confirm Booking"
5. ✅ Should show success and redirect to dashboard

### Scenario 2: Filter by Time
1. Go to `/slots`
2. Click "Evening" time filter
3. ✅ Should show only 5-9 PM slots

### Scenario 3: Conflict Prevention
1. Open `/slots` in 2 browser windows
2. Book same slot in both windows simultaneously
3. ✅ First booking succeeds, second shows "Slot already booked"

### Scenario 4: Mobile Responsive
1. Open `/slots` on mobile
2. Verify horizontal scroll works
3. Verify buttons are tap-friendly (44px+)
4. ✅ Layout adapts to small screen

---

## Deployment Checklist

- [ ] All components compile without errors
- [ ] No console warnings or errors
- [ ] Slots load within 2 seconds
- [ ] Booking succeeds without conflicts
- [ ] Filters work on all combinations
- [ ] Mobile layout is responsive
- [ ] Emails send on booking
- [ ] Admin controls function
- [ ] Database indexes are set
- [ ] Environment variables configured
- [ ] Rate limiting is working

---

## FAQ

**Q: How many slots per day?**
A: 17 slots (6 AM - 10 PM). Edit the times array to customize.

**Q: Can I have different timings for different days?**
A: Currently no, but you can extend the schema to support this.

**Q: What if a user doesn't complete booking?**
A: The slot remains booked until admin manually opens it.

**Q: Can bookings be cancelled?**
A: Yes, by the admin or via support team.

**Q: Does it work offline?**
A: No, it requires backend connectivity for real-time updates.

**Q: How many users can book simultaneously?**
A: Unlimited - atomic transactions handle conflicts.

---

## Support Resources

1. **Full Documentation**: [SLOT_SYSTEM_GUIDE.md](./SLOT_SYSTEM_GUIDE.md)
2. **Implementation Details**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. **Component Source**: `frontend/components/`
4. **API Docs**: [README.md](./README.md) API Reference section

---

## Next Steps

1. ✅ Review the 10-day calendar at `/slots`
2. ✅ Test booking flow end-to-end
3. ✅ Try filters and search
4. ✅ Test on mobile device
5. ✅ Deploy to production
6. ✅ Monitor performance
7. ✅ Gather user feedback

---

**Happy booking! 🏏**
