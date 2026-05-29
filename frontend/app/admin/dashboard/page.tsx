'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getAdminStats, getAdminLeads, getAdminChats, updateLeadStatus, getProfile } from '@/lib/api';
import { getAdminToken, clearAdminToken, isAdminLoggedIn } from '@/lib/auth';

interface Stats {
  totalChats: number;
  totalLeads: number;
  avgRating: number;
  todayLeads: number;
  intentDistribution: Record<string, number>;
  leadsByStatus: Record<string, number>;
  leadsByQuality: Record<string, number>;
}

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  sport_type: string;
  preferred_slot?: string;
  preferred_date?: string;
  team_size?: number;
  status: string;
  lead_quality: string;
  customer_type: string;
  created_at: string;
}

type Tab = 'overview' | 'leads' | 'chats';

const STATUS_COLORS: Record<string, string> = {
  new: 'badge-new',
  contacted: 'badge-contacted',
  confirmed: 'badge-confirmed',
  cancelled: 'badge-cancelled',
};

const QUALITY_COLORS: Record<string, string> = {
  high: 'badge-high',
  normal: 'badge-normal',
  low: 'badge-low',
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  sub?: string | number;
}

function StatCard({ label, value, icon, sub }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-2xl flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-sm text-gray-400">{label}</div>
        {sub && <div className="text-xs text-green-400 mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsPage, setLeadsPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);

  useEffect(() => {
    const verifySession = async () => {
      if (!isAdminLoggedIn()) {
        router.push('/login?role=admin');
        return;
      }
      try {
        const userObj = await getProfile(token());
        if (!userObj || userObj.role !== 'admin') {
          handleLogout();
          return;
        }
        loadData();
      } catch (err) {
        console.error('Session validation failed:', err);
        handleLogout();
      }
    };
    verifySession();
  }, []);

  useEffect(() => {
    if (tab === 'leads') loadLeads();
    if (tab === 'chats') loadChats();
  }, [tab, leadsPage]);

  const token = () => getAdminToken() || '';

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await getAdminStats(token());
      setStats(s);
    } catch (e: any) {
      console.error('Failed to load stats');
      if (e.response?.status === 401 || e.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      const res = await getAdminLeads(token(), { page: leadsPage, limit: 15 });
      setLeads(res.leads || []);
      setTotalLeads(res.total || 0);
    } catch (e: any) {
      console.error('Failed to load leads');
      if (e.response?.status === 401 || e.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const loadChats = async () => {
    try {
      const res = await getAdminChats(token());
      setChats(res.chats || []);
    } catch (e: any) {
      console.error('Failed to load chats');
      if (e.response?.status === 401 || e.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      await updateLeadStatus(token(), leadId, status);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    } catch (e: any) {
      console.error('Failed to update status');
      if (e.response?.status === 401 || e.response?.status === 403) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    router.push('/login?role=admin');
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 px-4 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🦅</span>
            <div>
              <div className="font-bold text-white">Eagle Admin Dashboard</div>
              <div className="text-xs text-gray-400">Box Cricket Management</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/slots" className="text-xs text-blue-300 hover:text-blue-100 transition-colors px-3 py-1.5 border border-blue-400/20 rounded-lg">
              Manage Slots
            </Link>
            <a href="/chat" target="_blank" className="text-xs text-gray-500 hover:text-yellow-400 transition-colors">
              Open Chat ↗
            </a>
            <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 border border-red-400/20 rounded-lg">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
          {(['overview', 'leads', 'chats'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'overview' ? '📊 ' : t === 'leads' ? '📋 ' : '💬 '}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-4xl mb-3 animate-spin">🦅</div>
                Loading dashboard...
              </div>
            ) : stats && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard icon="💬" label="Total Chats" value={stats.totalChats.toLocaleString()} />
                  <StatCard icon="📋" label="Total Leads" value={stats.totalLeads.toLocaleString()} sub={`${stats.todayLeads} today`} />
                  <StatCard icon="⭐" label="Avg Rating" value={`${stats.avgRating}/5`} />
                  <StatCard icon="🔥" label="Today's Leads" value={stats.todayLeads} />
                </div>

                {/* Intent + Lead Quality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Intent Distribution */}
                  <div className="glass-card p-6">
                    <h3 className="text-white font-semibold mb-4">📊 Customer Intents</h3>
                    {Object.entries(stats.intentDistribution)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 6)
                      .map(([intent, count]) => {
                        const total = Object.values(stats.intentDistribution).reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <div key={intent} className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300 capitalize">{intent}</span>
                              <span className="text-gray-500">{count}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Lead Status */}
                  <div className="glass-card p-6">
                    <h3 className="text-white font-semibold mb-4">📋 Lead Status</h3>
                    <div className="space-y-3">
                      {Object.entries(stats.leadsByStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}>
                            {status.toUpperCase()}
                          </span>
                          <span className="text-2xl font-bold text-white">{count}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <h4 className="text-gray-400 text-xs mb-3">Lead Quality</h4>
                      <div className="flex gap-3">
                        {Object.entries(stats.leadsByQuality).map(([quality, count]) => (
                          <div key={quality} className={`flex-1 text-center p-2 rounded-lg ${QUALITY_COLORS[quality]}`}>
                            <div className="text-lg font-bold">{count}</div>
                            <div className="text-xs capitalize">{quality}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Leads Tab ─────────────────────────────────────────────── */}
        {tab === 'leads' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">All Booking Leads ({totalLeads})</h2>
              <button
                onClick={loadLeads}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
            
            <div className="glass-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Customer', 'Phone', 'Sport', 'Slot/Date', 'Status', 'Quality', 'Actions'].map(h => (
                        <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-500 py-12">
                          No leads yet. Start chatting to generate leads! 🏏
                        </td>
                      </tr>
                    ) : leads.map((lead, i) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/3 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{lead.name}</div>
                          <div className="text-xs text-gray-500">{new Date(lead.created_at).toLocaleDateString('en-IN')}</div>
                        </td>
                        <td className="px-4 py-3">
                          <a href={`tel:${lead.phone}`} className="text-yellow-400 hover:text-yellow-300 transition-colors">
                            {lead.phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {lead.sport_type === 'Cricket' ? '🏏' : lead.sport_type === 'Football' ? '⚽' : '🏸'} {lead.sport_type}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-300">{lead.preferred_slot || '—'}</div>
                          <div className="text-xs text-gray-600">{lead.preferred_date || ''}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${STATUS_COLORS[lead.status]}`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${QUALITY_COLORS[lead.lead_quality]}`}>
                            {lead.lead_quality}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={lead.status}
                            onChange={e => handleStatusChange(lead.id, e.target.value)}
                            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-300 cursor-pointer"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalLeads > 15 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                  <span className="text-xs text-gray-500">
                    Page {leadsPage} of {Math.ceil(totalLeads / 15)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={leadsPage === 1}
                      onClick={() => setLeadsPage(p => p - 1)}
                      className="text-xs px-3 py-1 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={leadsPage >= Math.ceil(totalLeads / 15)}
                      onClick={() => setLeadsPage(p => p + 1)}
                      className="text-xs px-3 py-1 border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Chats Tab ─────────────────────────────────────────────── */}
        {tab === 'chats' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Recent Chat Sessions ({chats.length})</h2>
              <button onClick={loadChats} className="text-xs text-gray-400 hover:text-white transition-colors">🔄 Refresh</button>
            </div>
            {chats.length === 0 ? (
              <div className="glass-card p-12 text-center text-gray-500">
                No chat sessions yet. 💬
              </div>
            ) : chats.map((chat, i) => (
              <motion.div
                key={chat.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-500 font-mono">{chat.sessionId?.slice(0, 8)}...</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(chat.startedAt).toLocaleString('en-IN')} • {chat.messageCount} messages
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full capitalize">
                    {chat.dominantIntent || 'other'}
                  </span>
                </div>
                <div className="text-sm text-gray-400 italic">"{chat.firstMessage?.slice(0, 100)}{(chat.firstMessage?.length > 100) ? '...' : ''}"</div>
                
                {/* Last few messages preview */}
                <div className="mt-3 space-y-1 max-h-20 overflow-hidden">
                  {chat.messages?.slice(-2).map((m: any, mi: number) => (
                    <div key={mi} className={`text-xs ${m.role === 'user' ? 'text-blue-400' : 'text-gray-400'}`}>
                      <span className="font-medium">{m.role === 'user' ? 'User' : 'AI'}:</span> {m.content?.slice(0, 80)}...
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
