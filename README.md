# 🦅 Eagle Box Cricket — AI Booking Assistant

> **Vijayawada's Premier Sports Venue** — Powered by AI (Grok by xAI)

A full-stack, startup-quality AI booking assistant that acts as a virtual employee — handling slot inquiries, pricing questions, lead collection, and admin management. Built with Next.js, Express.js, Supabase, and Grok AI.

---

## 🚀 Live Demo

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:4000` |
| Chat | `http://localhost:3000/chat` |
| Admin | `http://localhost:3000/admin` |

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🤖 AI Chat (Grok API) | ✅ |
| 📅 Slot Availability Checker | ✅ |
| 🏏 **10-Day Slot Calendar View** | ✅ **NEW** |
| 🎯 **Smart Slot Filtering & Search** | ✅ **NEW** |
| 💰 Pricing Information | ✅ |
| 📋 Lead Collection + Email | ✅ |
| 🏆 Tournament Inquiry | ✅ |
| 🔐 Admin Dashboard (Login) | ✅ |
| 📧 Email Notifications | ✅ |
| ⭐ Customer Feedback | ✅ |
| 🌙 Dark Mode | ✅ |
| 📱 Mobile Responsive | ✅ |
| ⚡ Quick Reply Chips | ✅ |
| 💬 Chat History (DB) | ✅ |
| 🎯 Intent Detection | ✅ |
| 🏅 Lead Quality Classification | ✅ |

---

## 🎯 What's New: 10-Day Slot Availability System

**A complete, modern slot booking interface that lets users browse and book slots for the next 10 days!**

### Key Features:
- 📅 **10-Day Calendar**: Horizontal scrollable calendar with occupancy indicators
- 🎨 **Color-Coded Status**: Green (Available), Red (Booked), Amber (Blocked)
- 🔍 **Smart Filtering**: Filter by time of day, availability, or search by text
- ⚡ **Real-Time Updates**: Slots refresh every 30 seconds for live availability
- 🏠 **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- 🔒 **Conflict Prevention**: Atomic database operations prevent double-booking
- 📱 **Quick Booking**: One-click booking from the calendar view
- 🎫 **Instant Confirmations**: Email confirmations with booking codes

### How to Access:
- **Players**: `/slots` page for full calendar view or dashboard for quick access
- **Admins**: Slot management in admin dashboard for blocking/unblocking

### Documentation:
See [SLOT_SYSTEM_GUIDE.md](./SLOT_SYSTEM_GUIDE.md) for complete implementation details, API docs, and customization guide.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express.js |
| AI | Grok API (xAI) — Model: `grok-3` |
| Database | Supabase (PostgreSQL) |
| Email | Nodemailer (Gmail SMTP) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deployment | Vercel (Frontend) + Railway (Backend) |

---

## 📁 Project Structure

```
eagle-box-cricket/
├── frontend/                    # Next.js 14 App
│   ├── app/
│   │   ├── page.tsx             # Landing page
│   │   ├── chat/page.tsx        # AI Chat interface
│   │   ├── admin/page.tsx       # Admin login
│   │   └── admin/dashboard/     # Admin dashboard
│   ├── components/
│   │   ├── MessageBubble.tsx    # Chat bubbles
│   │   ├── TypingIndicator.tsx  # AI typing animation
│   │   ├── QuickReplies.tsx     # Suggested actions
│   │   ├── LeadForm.tsx         # Booking form modal
│   │   └── FeedbackWidget.tsx   # Star rating widget
│   └── lib/
│       ├── api.ts               # API client
│       ├── session.ts           # Session management
│       └── auth.ts              # Admin auth helpers
│
├── backend/                     # Express.js API
│   ├── server.js                # Entry point
│   ├── routes/                  # API routes
│   ├── controllers/             # Business logic
│   ├── services/
│   │   ├── grok.js              # Grok AI integration
│   │   ├── knowledgeBase.js     # Mini RAG system
│   │   └── email.js             # Nodemailer email
│   ├── middleware/auth.js        # JWT middleware
│   ├── database/
│   │   ├── supabase.js          # Supabase client
│   │   └── schema.sql           # Full DB schema
│   └── data/                    # Knowledge base JSONs
│       ├── venueInfo.json
│       ├── faqs.json
│       ├── offers.json
│       ├── tournament.json
│       └── rules.json
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js v18+
- A Supabase account (free)
- A Grok API key from [x.ai](https://console.x.ai)
- A Gmail account with App Passwords enabled

---

### Step 1 — Clone & Navigate

```bash
git clone <your-repo-url>
cd eagle-box-cricket
```

---

### Step 2 — Set Up Supabase

1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Wait for the project to initialize (~2 minutes)
3. Go to **SQL Editor** and run the contents of `backend/database/schema.sql`
4. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_KEY`

---

### Step 3 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
GROK_API_KEY=xai-your-actual-grok-key
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Eagle@Admin2026
JWT_SECRET=your-random-secret-string
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
OWNER_EMAIL=venue-owner@email.com
```

> **Gmail App Password Setup:**
> 1. Enable 2FA on your Google account
> 2. Go to Google Account → Security → App Passwords
> 3. Create a new App Password for "Mail"
> 4. Use that 16-character code as `EMAIL_PASS`

Install and run:

```bash
npm install
npm run dev
```

Backend will start on `http://localhost:4000`

---

### Step 4 — Configure Frontend

```bash
cd ../frontend
```

The `.env.local` is already set to `http://localhost:4000/api`. Install and run:

```bash
npm install
npm run dev
```

Frontend will start on `http://localhost:3000`

---

## 🔑 Admin Access

| Field | Value |
|-------|-------|
| URL | `http://localhost:3000/admin` |
| Username | `admin` (or whatever you set in `.env`) |
| Password | `Eagle@Admin2026` (or your custom password) |

> ⚠️ Change the default password in your `.env` before deploying!

---

## 📡 API Reference

### Chat
```
POST /api/chat
Body: { message: string, sessionId?: string }
Response: { reply, intent, sessionId, leadDetected, suggestedActions }
```

### Slot Availability
```
GET /api/slots?date=2026-06-01&sport=Cricket
Response: { date, sport, available: [], booked: [] }
```

### 10-Day Slot Calendar (NEW)
```
GET /api/slots/10-days?sport=Cricket
Response: { success: true, sport, dates: [{ date, dayName, displayDate, availableCount, totalCount, slots: [] }] }
```

### Book Slot (NEW)
```
POST /api/slots/book
Body: { name, phone, email?, sportType, preferredSlot, preferredDate, teamSize?, message? }
Response: { success: true, bookingId, message }
```

### Admin Slot Management (NEW)
```
PATCH /api/slots/admin/update-slot
Headers: { Authorization: Bearer <token> }
Body: { date, slot_time, sport, action: "block|open|maintenance|cancel" }
Response: { success: true, message, slot }
```

### Submit Lead
```
POST /api/leads
Body: { name, phone, email?, sportType?, preferredSlot?, preferredDate?, teamSize?, message? }
Response: { success, leadId, message }
```

### Submit Feedback
```
POST /api/feedback
Body: { sessionId?, rating: 1-5, comment? }
```

### Admin Auth
```
POST /api/admin/login
Body: { username, password }
Response: { success, token }
```

### Admin Stats
```
GET /api/admin/stats
Headers: { Authorization: Bearer <token> }
```

---

## 🚀 Deployment

### Frontend → Vercel

1. Push `frontend/` to GitHub
2. Connect to [vercel.com](https://vercel.com)
3. Set environment variable: `NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api`
4. Deploy!

### Backend → Railway

1. Push `backend/` to GitHub
2. Connect to [railway.app](https://railway.app)
3. Add all `.env` variables in Railway dashboard
4. Deploy!

---

## 📧 Email Notifications

When a customer submits a booking lead:
1. **Owner Email** — Beautiful HTML email with customer details, lead quality, and call-to-action
2. **Customer Email** (if email provided) — Confirmation that request was received

The email template uses your brand colors (Eagle green + gold) for a professional look.

---

## 🤖 AI Demo Mode

> If `GROK_API_KEY` is not set, the assistant runs in **Demo Mode** with smart pre-built responses for common questions (pricing, slots, booking, tournaments, etc.). This is perfect for testing the UI without an API key.

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Eagle Green | `#1a472a` | Primary brand |
| Eagle Gold | `#f5a623` | Accent, CTAs |
| Surface Dark | `#0a0f0d` | Background |
| Glass | `rgba(255,255,255,0.05)` | Cards |

---

## 🏗️ Architecture

```
Customer Browser
      ↓
  Next.js Frontend (Vercel)
      ↓
  Express.js Backend API (Railway)
      ↓
  Grok AI + Knowledge Base (Mini RAG)
      ↓
  Supabase PostgreSQL
      ↑
  Admin Dashboard (Next.js)
```

---

## 🙏 Credits

Built with ❤️ for Eagle Box Cricket, Vijayawada
- AI: Grok by xAI
- Database: Supabase
- UI Framework: Next.js + Tailwind CSS
