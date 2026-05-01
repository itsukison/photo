'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Calendar, MapPin, ChevronDown, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { addDays, format, startOfDay } from 'date-fns';
import { formatRefundMessage } from '@/lib/policy';

type Booking = {
  id: string;
  reference: string;
  plan: string;
  date: string;
  startHour: number;
  location: string;
  rawStatus: string;
  status: string;
  paymentStatus: string;
  total: number;
  refundCents: number;
  groupSize: number;
  addons: string[];
};

type Policy = {
  booking_id: string;
  shoot_start_tokyo: string;
  hours_until_shoot: number;
  cancel_refund_percent: number;
  cancel_refund_amount_cents: number;
  can_cancel: boolean;
  reschedule_fee_percent: number;
  reschedule_fee_amount_cents: number;
  can_reschedule_free: boolean;
  can_reschedule_paid: boolean;
  total_price_cents: number;
};

function formatStatus(raw: string): string {
  switch (raw) {
    case 'pending_payment': return 'Payment Pending';
    case 'pending_confirmation': return 'Pending';
    case 'confirmed': return 'Confirmed';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending_reschedule_confirmation': return 'Reschedule Pending';
    default: return raw;
  }
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function authedFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init?.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(input, { ...init, headers });
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [policyMap, setPolicyMap] = useState<Record<string, Policy | null>>({});
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null);
  const [resumeBusyId, setResumeBusyId] = useState<string | null>(null);
  const [rescheduleBusyId, setRescheduleBusyId] = useState<string | null>(null);
  const [rescheduleOpenId, setRescheduleOpenId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Auto-cancel pending_payment bookings whose 30-minute hold has passed,
    // so they don't linger in the customer's profile. RPC is idempotent and
    // scoped server-side; we don't await its result for UI purposes.
    try { await supabase.rpc('sweep_expired_pending_bookings'); } catch {}
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, reference, date, start_minutes, status, payment_status, total_price,
        refund_amount_cents, group_size,
        plans(name), locations(name), booking_addons(addons(name))
      `)
      .eq('tourist_id', user.id)
      .order('date', { ascending: false });
    if (error) {
      console.error('Failed to fetch bookings:', error.message);
      setLoading(false);
      return;
    }
    const mapped: Booking[] = (data ?? []).map((b: Record<string, unknown>) => {
      const plan = b.plans as { name: string } | null;
      const location = b.locations as { name: string } | null;
      const bookingAddons = b.booking_addons as { addons: { name: string } | null }[] | null;
      return {
        id: b.id as string,
        reference: b.reference as string,
        plan: plan?.name ?? '—',
        date: b.date as string,
        startHour: b.start_minutes as number,
        location: location?.name ?? '—',
        rawStatus: b.status as string,
        status: formatStatus(b.status as string),
        paymentStatus: (b.payment_status as string) ?? 'pending',
        total: b.total_price as number,
        refundCents: (b.refund_amount_cents as number) ?? 0,
        groupSize: b.group_size as number,
        addons: (bookingAddons ?? []).map((ba) => ba.addons?.name).filter((n): n is string => Boolean(n)),
      };
    });
    setBookings(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadBookings(); }, [loadBookings]);

  // After a paid reschedule, Stripe bounces back here with ?reschedule=success.
  // Reload to pick up the applied date.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('reschedule');
    if (mode === 'success') {
      setActionNotice('Reschedule fee received. Your booking has been moved.');
      loadBookings();
      window.history.replaceState({}, '', '/profile');
    } else if (mode === 'cancelled') {
      setActionError('Reschedule cancelled — your original booking is unchanged.');
      window.history.replaceState({}, '', '/profile');
    }
  }, [loadBookings]);

  const fetchPolicy = useCallback(async (id: string) => {
    const res = await authedFetch(`/api/bookings/${id}/policy`);
    if (!res.ok) {
      setPolicyMap((prev) => ({ ...prev, [id]: null }));
      return;
    }
    const p = (await res.json()) as Policy;
    setPolicyMap((prev) => ({ ...prev, [id]: p }));
  }, []);

  const handleExpand = (id: string) => {
    const next = expandedId === id ? null : id;
    setExpandedId(next);
    setRescheduleOpenId(null);
    setActionError(null);
    setActionNotice(null);
    if (next && !policyMap[next]) fetchPolicy(next);
  };

  const handleCancel = async (id: string) => {
    const policy = policyMap[id];
    if (!policy) return;
    const refundMsg = policy.cancel_refund_amount_cents > 0
      ? `You will be refunded $${(policy.cancel_refund_amount_cents / 100).toFixed(2)}.`
      : 'No refund applies at this time.';
    if (!confirm(`Cancel this booking? ${refundMsg}`)) return;
    setCancelBusyId(id);
    setActionError(null);
    try {
      const res = await authedFetch(`/api/bookings/${id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setActionError(payload.error ?? 'Failed to cancel.');
        return;
      }
      const payload = (await res.json()) as { refundCents: number };
      setActionNotice(
        payload.refundCents > 0
          ? `Cancelled. ${formatRefundMessage(payload.refundCents)}`
          : 'Booking cancelled. No refund applies under the policy.',
      );
      await loadBookings();
      await fetchPolicy(id);
    } finally {
      setCancelBusyId(null);
    }
  };

  const handleResumePayment = async (id: string) => {
    setResumeBusyId(id);
    setActionError(null);
    setActionNotice(null);
    try {
      const res = await authedFetch('/api/checkout/resume', {
        method: 'POST',
        body: JSON.stringify({ bookingId: id }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setActionError(payload.error ?? 'Failed to resume payment.');
        return;
      }
      const payload = (await res.json()) as { url?: string };
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      setActionError('Could not start checkout. Please try again.');
    } finally {
      setResumeBusyId(null);
    }
  };

  const handleCancelPending = async (id: string) => {
    if (!confirm('Cancel this unpaid booking? Your slot will be released.')) return;
    setCancelBusyId(id);
    setActionError(null);
    try {
      const res = await authedFetch(`/api/bookings/${id}/cancel-pending`, { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setActionError(payload.error ?? 'Failed to cancel.');
        return;
      }
      setActionNotice('Booking cancelled.');
      await loadBookings();
    } finally {
      setCancelBusyId(null);
    }
  };

  const openReschedule = (id: string) => {
    setRescheduleOpenId(id);
    setRescheduleDate(null);
    setRescheduleSlots([]);
    setActionError(null);
  };

  const rescheduleDates = useMemo(() => {
    // 48h ahead avoids the booking-flow minimum and keeps spacing consistent.
    const minDate = addDays(startOfDay(new Date()), 2);
    return Array.from({ length: 14 }, (_, i) => addDays(minDate, i));
  }, []);

  const loadRescheduleSlots = async (bookingId: string, date: Date) => {
    setRescheduleSlotsLoading(true);
    setRescheduleSlots([]);
    try {
      const res = await authedFetch(`/api/bookings/${bookingId}/reschedule-slots?date=${format(date, 'yyyy-MM-dd')}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setActionError(payload.error ?? 'Failed to load availability.');
        return;
      }
      const { slots } = (await res.json()) as { slots: string[] };
      setRescheduleSlots(slots);
    } finally {
      setRescheduleSlotsLoading(false);
    }
  };

  const submitReschedule = async (bookingId: string, time: string) => {
    if (!rescheduleDate) return;
    setRescheduleBusyId(bookingId);
    setActionError(null);
    try {
      const [rH, rM] = time.split(':').map(Number);
      const res = await authedFetch(`/api/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({
          newDate: format(rescheduleDate, 'yyyy-MM-dd'),
          newStartMinutes: rH * 60 + rM,
        }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as { error?: string };
        setActionError(payload.error ?? 'Failed to reschedule.');
        return;
      }
      const payload = (await res.json()) as { mode: 'free' | 'paid'; url?: string };
      if (payload.mode === 'paid' && payload.url) {
        window.location.href = payload.url;
        return;
      }
      setActionNotice('Your booking has been rescheduled.');
      setRescheduleOpenId(null);
      await loadBookings();
      await fetchPolicy(bookingId);
    } finally {
      setRescheduleBusyId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center pt-24 md:pt-32 px-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-medium tracking-tight text-black">Please log in</h1>
          <p className="text-gray-500 font-medium">You need to be logged in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] text-black selection:bg-black selection:text-white pt-24 md:pt-32 pb-20 md:pb-24">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 md:mb-16">
          <div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-1.5 md:mb-2">Profile</h1>
            <p className="text-sm md:text-base text-gray-500 font-medium break-all sm:break-normal">{user.name} ({user.email})</p>
          </div>
          <button
            onClick={signOut}
            className="mobile-touch-target w-full sm:w-auto px-6 border border-black/10 rounded-full text-sm font-medium hover:bg-black/5 transition-colors"
          >
            Log Out
          </button>
        </div>

        {actionNotice && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 text-green-700 rounded-2xl text-sm font-medium">
            {actionNotice}
          </div>
        )}
        {actionError && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-sm font-medium flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        <h2 className="text-2xl font-medium tracking-tight mb-6 md:mb-8">Your Bookings</h2>

        {loading ? (
          <div className="text-center py-24 text-gray-400 font-medium">Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-24 text-gray-400 font-medium">No bookings found.</div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {bookings.map((booking) => {
              const isExpanded = expandedId === booking.id;
              const isCancelled = booking.rawStatus === 'cancelled';
              const isPendingPayment = booking.rawStatus === 'pending_payment';
              const policy = policyMap[booking.id];
              const isRescheduling = rescheduleOpenId === booking.id;

              return (
                <div
                  key={booking.id}
                  className={`border border-black/10 rounded-2xl bg-white shadow-sm overflow-hidden transition-colors hover:border-black/20 ${isExpanded ? 'ring-1 ring-black/5' : ''}`}
                >
                  <div
                    onClick={() => handleExpand(booking.id)}
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 md:gap-3 mb-2.5 md:mb-3 flex-wrap">
                        <h3 className={`font-medium text-lg md:text-xl ${isCancelled ? 'text-gray-400 line-through' : 'text-black'}`}>{booking.plan}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-medium border ${
                            booking.rawStatus === 'confirmed'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : booking.rawStatus === 'cancelled'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : booking.rawStatus === 'pending_confirmation'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : booking.rawStatus === 'pending_reschedule_confirmation'
                                    ? 'bg-violet-50 text-violet-700 border-violet-200'
                                    : booking.rawStatus === 'pending_payment'
                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {booking.status}
                        </span>
                        {booking.paymentStatus === 'refunded' && (
                          <span className="px-3 py-1 rounded-full text-[11px] md:text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                            Refunded
                          </span>
                        )}
                        {booking.paymentStatus === 'partially_refunded' && (
                          <span className="px-3 py-1 rounded-full text-[11px] md:text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                            Partial Refund
                          </span>
                        )}
                      </div>
                      <div className={`grid grid-cols-1 sm:flex sm:flex-wrap items-start sm:items-center gap-2 sm:gap-5 text-[13px] md:text-sm font-medium ${isCancelled ? 'text-gray-400' : 'text-gray-500'}`}>
                        <span className="flex items-center gap-1.5 min-w-0"><Calendar size={15} /> {booking.date} at {formatMinutes(booking.startHour)}</span>
                        <span className="flex items-center gap-1.5 min-w-0"><MapPin size={15} /> {booking.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 mt-1 md:mt-0">
                      <div className={`text-left md:text-right ${isCancelled ? 'text-gray-400' : ''}`}>
                        <div className="text-xs md:text-sm font-medium mb-0.5 md:mb-1 opacity-70">Ref: {booking.reference}</div>
                        <div className="font-medium text-lg md:text-xl">${booking.total}</div>
                        {booking.refundCents > 0 && (
                          <div className="text-xs text-blue-700 font-medium">Refunded ${(booking.refundCents / 100).toFixed(2)}</div>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-black"
                      >
                        <ChevronDown size={18} />
                      </motion.div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="border-t border-black/5"
                      >
                        <div className="p-4 md:p-6 bg-black/[0.02]">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 md:gap-8 mb-6 md:mb-8">
                            <div>
                              <h4 className="text-[11px] md:text-sm font-bold tracking-wider uppercase text-gray-500 mb-4">Booking Details</h4>
                              <ul className="space-y-3 text-sm font-medium text-black">
                                <li className="flex justify-between gap-4"><span className="text-gray-500">Group Size</span> <span>{booking.groupSize} {booking.groupSize > 1 ? 'People' : 'Person'}</span></li>
                                <li className="flex justify-between gap-4"><span className="text-gray-500">Add-ons</span> <span className="text-right">{booking.addons.length > 0 ? booking.addons.join(', ') : 'None'}</span></li>
                                <li className="flex justify-between gap-4"><span className="text-gray-500">Total</span> <span>${booking.total}</span></li>
                                {booking.refundCents > 0 && (
                                  <li className="flex justify-between gap-4"><span className="text-gray-500">Refunded</span> <span>${(booking.refundCents / 100).toFixed(2)}</span></li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-[11px] md:text-sm font-bold tracking-wider uppercase text-gray-500 mb-4">Actions</h4>
                              {isPendingPayment ? (
                                <div className="space-y-3">
                                  <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                    Your slot is held but payment hasn&apos;t completed. Resume checkout to confirm your booking, or release the slot.
                                  </p>
                                  <button
                                    onClick={() => handleResumePayment(booking.id)}
                                    disabled={resumeBusyId === booking.id}
                                    className="w-full py-2.5 px-4 bg-black text-white rounded-xl text-sm font-medium hover:bg-black/80 transition-colors disabled:opacity-50"
                                  >
                                    {resumeBusyId === booking.id ? 'Starting checkout…' : 'Resume Payment'}
                                  </button>
                                  <button
                                    onClick={() => handleCancelPending(booking.id)}
                                    disabled={cancelBusyId === booking.id}
                                    className="w-full py-2.5 px-4 bg-white border border-black/10 rounded-xl text-sm font-medium text-black hover:bg-black/5 transition-colors disabled:opacity-50"
                                  >
                                    {cancelBusyId === booking.id ? 'Cancelling…' : 'Cancel Booking'}
                                  </button>
                                </div>
                              ) : isCancelled ? (
                                <p className="text-sm text-gray-500 font-medium">This booking has been cancelled.</p>
                              ) : booking.rawStatus === 'completed' ? (
                                <p className="text-sm text-gray-500 font-medium">Session completed. Thank you!</p>
                              ) : !policy ? (
                                <p className="text-sm text-gray-500 font-medium">Loading policy…</p>
                              ) : (
                                <div className="space-y-3">
                                  <div className="p-3 rounded-xl bg-white border border-black/5 text-xs text-gray-600 leading-relaxed">
                                    <div><strong className="text-black">Cancel now:</strong> ${(policy.cancel_refund_amount_cents / 100).toFixed(2)} refund ({policy.cancel_refund_percent}%).</div>
                                    <div className="mt-1">
                                      <strong className="text-black">Reschedule:</strong>{' '}
                                      {policy.can_reschedule_free
                                        ? 'Free'
                                        : policy.can_reschedule_paid
                                          ? `$${(policy.reschedule_fee_amount_cents / 100).toFixed(2)} fee (50%)`
                                          : 'Not available within 24h'}
                                    </div>
                                  </div>

                                  {(policy.can_reschedule_free || policy.can_reschedule_paid) && (
                                    <button
                                      onClick={() => openReschedule(booking.id)}
                                      disabled={rescheduleBusyId === booking.id}
                                      className="w-full py-2.5 px-4 bg-white border border-black/10 rounded-xl text-sm font-medium text-black hover:bg-black/5 transition-colors text-left flex items-center justify-between disabled:opacity-50"
                                    >
                                      Change Date &amp; Time
                                      <RefreshCw size={16} className="text-gray-500" />
                                    </button>
                                  )}
                                  {policy.can_cancel && (
                                    <button
                                      onClick={() => handleCancel(booking.id)}
                                      disabled={cancelBusyId === booking.id}
                                      className="w-full py-2.5 px-4 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600 hover:bg-red-100 transition-colors text-left flex items-center justify-between disabled:opacity-50"
                                    >
                                      {cancelBusyId === booking.id ? 'Processing…' : 'Cancel Booking'}
                                      <X size={16} />
                                    </button>
                                  )}
                                  {policy.cancel_refund_amount_cents > 0 && (
                                    <p className="text-[11px] text-gray-400 leading-relaxed">
                                      Refunds go back to your original card within 5–10 business days.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isRescheduling && policy && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-2 pb-2">
                                  <h4 className="text-[11px] md:text-sm font-bold tracking-wider uppercase text-gray-500 mb-4">Pick a New Date</h4>
                                  <div className="flex overflow-x-auto pb-4 gap-2 hide-scrollbar">
                                    {rescheduleDates.map((d) => {
                                      const isSelected = rescheduleDate && format(rescheduleDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
                                      return (
                                        <button
                                          key={d.toISOString()}
                                          onClick={() => { setRescheduleDate(d); loadRescheduleSlots(booking.id, d); }}
                                          className={`shrink-0 w-[4.5rem] p-3 border rounded-xl text-center transition-colors font-medium ${isSelected ? 'border-black bg-black text-white' : 'border-black/10 hover:bg-black/5 bg-white text-black'}`}
                                        >
                                          <div className="text-[10px] uppercase opacity-80">{format(d, 'EEE')}</div>
                                          <div className="text-lg">{format(d, 'd')}</div>
                                          <div className="text-[10px] opacity-80">{format(d, 'MMM')}</div>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {rescheduleDate && (
                                    <div className="mt-2">
                                      {rescheduleSlotsLoading ? (
                                        <p className="text-sm text-gray-500 font-medium">Checking availability…</p>
                                      ) : rescheduleSlots.length === 0 ? (
                                        <p className="text-sm text-gray-500 font-medium">No photographers available on this date. Please pick another.</p>
                                      ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {rescheduleSlots.map((t) => (
                                            <button
                                              key={t}
                                              onClick={() => submitReschedule(booking.id, t)}
                                              disabled={rescheduleBusyId === booking.id}
                                              className="p-3 border border-black/10 rounded-xl bg-white hover:bg-black/5 text-sm font-medium text-black transition-colors disabled:opacity-50"
                                            >
                                              {t}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {policy.can_reschedule_paid && (
                                    <p className="mt-3 text-[11px] text-amber-700 leading-relaxed">
                                      You will be charged a ${(policy.reschedule_fee_amount_cents / 100).toFixed(2)} reschedule fee after selecting a new time.
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
