'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Calendar, ShieldCheck, PlusCircle } from 'lucide-react';
import { get10DaySlots, getProfile } from '@/lib/api';
import { getAdminToken, clearAdminToken, isAdminLoggedIn } from '@/lib/auth';
import AdminSlotManager from '@/components/AdminSlotManager';
import api from '@/lib/api';

interface Slot {
  id: string;
  slot_time: string;
  is_available: boolean;
  is_blocked: boolean;
  booked_by_lead?: string;
}

interface DayData {
  date: string;
  dayName: string;
  displayDate: string;
  availableCount: number;
  totalCount: number;
  slots: Slot[];
}

const SPORTS = ['Cricket', 'Football', 'Badminton'];
const SLOT_TIMES = ['6 AM','7 AM','8 AM','9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM','6 PM','7 PM','8 PM','9 PM','10 PM'];

export default function AdminSlotsPage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState('Eagle Admin');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('6 AM');
  const [newSlotAction, setNewSlotAction] = useState<'open' | 'block' | 'maintenance' | 'cancel'>('open');

  const token = () => getAdminToken() || '';

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!isAdminLoggedIn()) {
        router.push('/login?role=admin');
        return;
      }

      try {
        const profile = await getProfile(token());
        if (!profile || profile.role !== 'admin') {
          clearAdminToken();
          router.push('/login?role=admin');
          return;
        }
        setAdminName(profile.name || 'Eagle Admin');
        await loadSlots();
      } catch (err) {
        clearAdminToken();
        router.push('/login?role=admin');
      }
    };

    verifyAdmin();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadSlots();
    }
  }, [selectedSport]);

  const loadSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await get10DaySlots(selectedSport);
      if (response.success && response.dates) {
        setDays(response.dates);
      } else {
        setError((response as any).error || 'Unable to load slots.');
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    router.push('/login?role=admin');
  };

  const handleSelectSlot = (date: string, slot: Slot) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    setSuccess('');
    setError('');
  };

  const handleClearSelection = () => {
    setSelectedSlot(null);
    setSelectedDate('');
  };

  const handleCreateSlot = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!newSlotDate) {
      setError('Please choose a date for the slot.');
      return;
    }

    try {
      await api.patch(
        '/slots/admin/update-slot',
        {
          date: newSlotDate,
          slot_time: newSlotTime,
          sport: selectedSport,
          action: newSlotAction,
        },
        {
          headers: {
            Authorization: `Bearer ${token()}`,
          },
        }
      );
      setSuccess('Slot has been updated successfully.');
      setNewSlotDate('');
      setNewSlotTime('6 AM');
      setNewSlotAction('open');
      await loadSlots();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update slot');
    }
  };

  const currentStatus = (slot: Slot) => {
    if (slot.is_blocked) return 'blocked';
    if (!slot.is_available) return 'booked';
    return 'available';
  };

  const availableCount = days.reduce((sum, day) => sum + day.availableCount, 0);
  const totalCount = days.reduce((sum, day) => sum + day.totalCount, 0);
  const bookedCount = totalCount - availableCount;

  return (
    <div className="min-h-screen gradient-bg pb-12">
      <nav className="glass-card rounded-none border-x-0 border-t-0 px-4 py-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-blue-400 hover:text-blue-200 flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              Back to Admin
            </Link>
            <div>
              <div className="font-black text-white text-lg tracking-tight">Admin Slot Control</div>
              <div className="text-xs text-gray-400">Manage availability, add slots, and update bookings</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-semibold text-white text-sm">{adminName}</p>
              <p className="text-xs text-gray-400">Admin access</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm font-semibold hover:bg-red-500/30 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-200 uppercase tracking-[0.2em] mb-2">Admin Slot Management</p>
                <h1 className="text-4xl font-black text-white">Manage Slots for the Venue</h1>
                <p className="text-gray-400 mt-2 max-w-2xl">
                  Use this page to add new slots, unblock open slots, or mark any slot as blocked or under maintenance.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {SPORTS.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                      selectedSport === sport
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white/10 text-gray-200 hover:bg-white/15'
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-emerald-400">{availableCount}</p>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-2">Available</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-red-400">{bookedCount}</p>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-2">Booked</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-yellow-400">{totalCount}</p>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-2">Total Slots</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-3xl font-black text-blue-400">{selectedSport}</p>
                <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mt-2">Selected Sport</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-gray-700 p-4">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white">Daily Slot Summary</h2>
              </div>
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading slot availability...</div>
              ) : error ? (
                <div className="text-center py-12 text-red-400">{error}</div>
              ) : (
                <div className="space-y-4">
                  {days.map(day => (
                    <div key={day.date} className="rounded-2xl bg-slate-950/50 border border-slate-800 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-sm uppercase text-gray-400 tracking-[0.2em]">{day.dayName}</p>
                          <p className="text-xl font-semibold text-white">{day.displayDate}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{day.availableCount} available</p>
                          <p>{day.totalCount - day.availableCount} booked/blocked</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {day.slots.map(slot => (
                          <button
                            key={slot.id}
                            onClick={() => handleSelectSlot(day.date, slot)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              selectedSlot?.id === slot.id && selectedDate === day.date
                                ? 'border-blue-400 bg-blue-500/10'
                                : 'border-slate-800 bg-slate-950/60 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-sm text-gray-400">{slot.slot_time}</p>
                                <p className="text-xs text-gray-500">Status: {currentStatus(slot)}</p>
                              </div>
                              <div className="text-xs font-semibold uppercase tracking-[0.2em]">
                                {currentStatus(slot)}
                              </div>
                            </div>
                            {slot.booked_by_lead && (
                              <p className="text-xs text-gray-400 mt-2">Booked lead: {slot.booked_by_lead}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card rounded-3xl border border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <PlusCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="text-lg font-bold text-white">Add / Update Slot</p>
                  <p className="text-sm text-gray-400">Create a new slot or update an existing one.</p>
                </div>
              </div>
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">Date</label>
                  <input
                    type="date"
                    value={newSlotDate}
                    onChange={(e) => setNewSlotDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-slate-950/80 px-4 py-3 text-white focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">Time</label>
                  <select
                    value={newSlotTime}
                    onChange={(e) => setNewSlotTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-slate-950/80 px-4 py-3 text-white focus:border-blue-400 outline-none"
                  >
                    {SLOT_TIMES.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-[0.2em]">Action</label>
                  <select
                    value={newSlotAction}
                    onChange={(e) => setNewSlotAction(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-700 bg-slate-950/80 px-4 py-3 text-white focus:border-blue-400 outline-none"
                  >
                    <option value="open">Open Slot</option>
                    <option value="block">Block Slot</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="cancel">Cancel Booking</option>
                  </select>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                {success && <p className="text-xs text-emerald-400">{success}</p>}
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-blue-500 px-4 py-3 text-white font-semibold hover:bg-blue-600 transition"
                >
                  Save Slot
                </button>
              </form>
            </div>

            <div className="glass-card rounded-3xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-white">Admin Slot Actions</p>
                  <p className="text-sm text-gray-400">Select a slot to manage it.</p>
                </div>
                {selectedSlot && (
                  <button
                    onClick={handleClearSelection}
                    className="text-xs uppercase tracking-[0.2em] text-blue-300 hover:text-white"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {selectedSlot ? (
                <AdminSlotManager
                  date={selectedDate}
                  slotTime={selectedSlot.slot_time}
                  sport={selectedSport}
                  currentStatus={currentStatus(selectedSlot)}
                  onUpdate={loadSlots}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center text-sm text-gray-400">
                  Select a slot from the list to view admin actions here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
