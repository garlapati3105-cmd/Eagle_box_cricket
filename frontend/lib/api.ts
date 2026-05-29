import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Chat ─────────────────────────────────────────────────────────────────────
export async function sendMessage(message: string, sessionId?: string) {
  const res = await api.post('/chat', { message, sessionId });
  return res.data as {
    reply: string;
    intent: string;
    sessionId: string;
    leadDetected: boolean;
    suggestedActions: string[];
  };
}

// ─── Slots ────────────────────────────────────────────────────────────────────
export async function getSlots(date: string, sport = 'Cricket') {
  const res = await api.get('/slots', { params: { date, sport } });
  return res.data as {
    date: string;
    sport: string;
    available: string[];
    booked: string[];
    total: number;
  };
}

export async function get10DaySlots(sport = 'Cricket') {
  const res = await api.get('/slots/10-days', { params: { sport } });
  return res.data as {
    success: boolean;
    sport: string;
    dates: Array<{
      date: string;
      dayName: string;
      displayDate: string;
      availableCount: number;
      totalCount: number;
      slots: Array<{
        id: string;
        slot_time: string;
        is_available: boolean;
        is_blocked: boolean;
        booked_by_lead?: string;
      }>;
    }>;
  };
}

export async function bookSlot(booking: {
  name: string;
  phone: string;
  email?: string;
  sportType: string;
  preferredSlot: string;
  preferredDate: string;
  teamSize?: number;
  message?: string;
  sessionId?: string;
}) {
  const res = await api.post('/slots/book', booking);
  return res.data as { success: boolean; bookingId: string; message: string };
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function submitLead(lead: {
  name: string;
  phone: string;
  email?: string;
  sportType?: string;
  preferredSlot?: string;
  preferredDate?: string;
  teamSize?: number;
  message?: string;
  sessionId?: string;
}) {
  const res = await api.post('/leads', lead);
  return res.data as { success: boolean; leadId: string; message: string };
}

// ─── Feedback ─────────────────────────────────────────────────────────────────
export async function submitFeedback(data: {
  sessionId?: string;
  rating: number;
  comment?: string;
}) {
  const res = await api.post('/feedback', data);
  return res.data as { success: boolean; message: string };
}

// ─── Auth (Unified Player/Admin) ──────────────────────────────────────────────
export async function registerPlayer(player: {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}) {
  const res = await api.post('/auth/register', player);
  return res.data as { success: boolean; token: string; user: any };
}

export async function loginUser(credentials: {
  emailOrUsername: string;
  password?: string;
  role: 'player' | 'admin';
}) {
  const res = await api.post('/auth/login', credentials);
  return res.data as { success: boolean; token: string; user: any };
}

export async function getPlayerBookings(token: string) {
  const res = await api.get('/auth/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as any[];
}

export async function adminLogin(username: string, password: string) {
  const res = await loginUser({ emailOrUsername: username, password, role: 'admin' });
  return {
    success: res.success,
    token: res.token,
    expiresIn: '24h',
  };
}

export async function getProfile(token: string) {
  const res = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as any;
}

export async function getAdminStats(token: string) {
  const res = await api.get('/admin/stats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getAdminLeads(token: string, params?: { page?: number; limit?: number; status?: string }) {
  const res = await api.get('/admin/leads', {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

export async function getAdminChats(token: string) {
  const res = await api.get('/admin/chats', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateLeadStatus(token: string, leadId: string, status: string) {
  const res = await api.patch(`/leads/${leadId}/status`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function checkBookingStatus(query: string) {
  const res = await api.get('/leads/status', { params: { query } });
  return res.data as { success: boolean; bookings: any[] };
}

export default api;


