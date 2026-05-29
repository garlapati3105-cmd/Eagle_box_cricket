-- ================================================================
-- Eagle Box Cricket - Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ================================================================

-- Users table (both players and admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table (tracks each chat session)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  ip_address TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Messages table (full chat history)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (booking inquiries / captured customer info)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  sport_type TEXT DEFAULT 'Cricket',
  preferred_slot TEXT,
  preferred_date TEXT,
  team_size INTEGER,
  message TEXT,
  lead_quality TEXT DEFAULT 'normal' CHECK (lead_quality IN ('high', 'normal', 'low')),
  customer_type TEXT DEFAULT 'casual' CHECK (customer_type IN ('tournament', 'regular', 'casual')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'cancelled')),
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slots table (daily slot availability)
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date DATE NOT NULL,
  slot_time TEXT NOT NULL,
  sport TEXT DEFAULT 'Cricket',
  is_available BOOLEAN DEFAULT TRUE,
  is_blocked BOOLEAN DEFAULT FALSE,
  booked_by_lead UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slot_date, slot_time, sport)
);

-- Feedback table (post-chat ratings)
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);



-- ================================================================
-- Indexes for performance
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_slots_date ON slots(slot_date);
CREATE INDEX IF NOT EXISTS idx_feedback_session ON feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_user ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ================================================================
-- Row Level Security (RLS) - Disable for simplicity, backend handles auth
-- ================================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow all operations from service_role (backend uses service_role key)
CREATE POLICY "Allow all for service role" ON sessions FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON slots FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON feedback FOR ALL USING (true);
CREATE POLICY "Allow all for service role" ON users FOR ALL USING (true);

-- ================================================================
-- Seed: Generate slots for next 14 days
-- ================================================================
DO $$
DECLARE
  d DATE;
  t TEXT;
  times TEXT[] := ARRAY['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];
BEGIN
  FOR i IN 0..13 LOOP
    d := CURRENT_DATE + i;
    FOREACH t IN ARRAY times LOOP
      INSERT INTO slots (slot_date, slot_time, sport, is_available)
      VALUES (d, t, 'Cricket', TRUE)
      ON CONFLICT (slot_date, slot_time, sport) DO NOTHING;
      
      INSERT INTO slots (slot_date, slot_time, sport, is_available)
      VALUES (d, t, 'Football', TRUE)
      ON CONFLICT (slot_date, slot_time, sport) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ================================================================
-- Mark some slots as booked (realistic demo data)
-- ================================================================
UPDATE slots SET is_available = FALSE 
WHERE slot_date = CURRENT_DATE AND slot_time IN ('7 PM', '8 PM', '9 PM') AND sport = 'Cricket';

UPDATE slots SET is_available = FALSE 
WHERE slot_date = CURRENT_DATE + 1 AND slot_time IN ('6 PM', '7 PM') AND sport = 'Cricket';
