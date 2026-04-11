'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfDay } from 'date-fns';
import { ChevronRight, ChevronLeft, Check, Calendar as CalendarIcon, MapPin, Users, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { Plan, Location, Addon, fetchPlans, fetchLocations, fetchAddons } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

type BookingState = {
  plan: Plan | null;
  location: Location | null;
  date: Date | null;
  time: string | null;
  extraDuration: number; // in minutes
  groupSize: number;
  addons: Addon[];
  retouchNotes: string;
  clientInfo: {
    name: string;
    email: string;
    phone: string;
    country: string;
    requests: string;
  };
  agreedToPolicy: boolean;
};

const INITIAL_STATE: BookingState = {
  plan: null,
  location: null,
  date: null,
  time: null,
  extraDuration: 0,
  groupSize: 1,
  addons: [],
  retouchNotes: '',
  clientInfo: { name: '', email: '', phone: '', country: '', requests: '' },
  agreedToPolicy: false,
};

export default function BookPage() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [booking, setBooking] = useState<BookingState>(INITIAL_STATE);
  const [bookingRef, setBookingRef] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [addonList, setAddonList] = useState<Addon[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchLocations(), fetchAddons()])
      .then(([p, l, a]) => { setPlans(p); setLocations(l); setAddonList(a); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (plans.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const planSlug = params.get('plan');
    const selectedPlan = planSlug ? plans.find(p => p.slug === planSlug) ?? null : null;

    setBooking(prev => ({
      ...prev,
      plan: selectedPlan ?? prev.plan,
      clientInfo: {
        ...prev.clientInfo,
        name: user?.name ?? prev.clientInfo.name,
        email: user?.email ?? prev.clientInfo.email,
      },
    }));

    if (!user) {
      setStep(0);
    } else if (selectedPlan) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [authLoading, user, plans]);

  useEffect(() => {
    if (!user || !booking.date || !booking.location || !booking.plan) {
      setAvailableSlots([]);
      return;
    }
    const totalMinutes = booking.plan.duration + booking.extraDuration;
    const durationHours = Math.ceil(totalMinutes / 60);
    const dateStr = format(booking.date, 'yyyy-MM-dd');
    setSlotsLoading(true);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_date: dateStr,
        p_location_id: booking.location!.id,
        p_plan_duration_hours: durationHours,
      });
      if (cancelled) return;
      const slots = error ? [] : ((data as string[] | null) ?? []);
      setAvailableSlots(slots);
      if (booking.time && !slots.includes(booking.time)) {
        setBooking((prev) => ({ ...prev, time: null }));
      }
      setSlotsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, booking.date, booking.location, booking.plan, booking.extraDuration]);

  const nextStep = () => setStep((s) => Math.min(s + 1, 9));
  const prevStep = () => setStep((s) => Math.max(s - 1, user ? 1 : 0));

  const updateBooking = (updates: Partial<BookingState>) => {
    setBooking((prev) => ({ ...prev, ...updates }));
  };

  const calculateTotal = () => {
    let total = booking.plan?.price || 0;
    total += booking.location?.surcharge || 0;
    
    // Extra duration: $100 per 30 mins
    total += (booking.extraDuration / 30) * 100;
    
    // Extra people: $7 per person beyond 1
    if (booking.groupSize > 1) {
      total += (booking.groupSize - 1) * 7;
    }
    
    // Addons
    total += booking.addons.reduce((sum, addon) => sum + addon.price, 0);
    
    return total;
  };

  const handleConfirm = async () => {
    if (submitting) return;
    if (!booking.plan || !booking.location || !booking.date || !booking.time) {
      setSubmitError('Missing booking details.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const startHour = parseInt(booking.time.split(':')[0], 10);
    const { data, error } = await supabase.rpc('create_booking', {
      p_plan_id: booking.plan.id,
      p_location_id: booking.location.id,
      p_date: format(booking.date, 'yyyy-MM-dd'),
      p_start_hour: startHour,
      p_extra_duration_minutes: booking.extraDuration,
      p_group_size: booking.groupSize,
      p_retouch_notes: booking.retouchNotes,
      p_addon_ids: booking.addons.map((a) => a.id),
      p_client_name: booking.clientInfo.name,
      p_client_email: booking.clientInfo.email || user?.email || '',
      p_client_phone: booking.clientInfo.phone,
      p_client_country: booking.clientInfo.country,
      p_special_requests: booking.clientInfo.requests,
      p_agreed_to_policy: booking.agreedToPolicy,
    });
    setSubmitting(false);
    if (error) {
      const msg = error.message || '';
      if (msg.includes('NO_AVAILABILITY')) {
        setSubmitError('Sorry — that slot was just taken. Please pick a different time.');
      } else if (msg.includes('POLICY_NOT_AGREED')) {
        setSubmitError('You must agree to the cancellation policy.');
      } else if (msg.includes('NOT_AUTHENTICATED')) {
        setSubmitError('Please sign in again to complete your booking.');
      } else {
        setSubmitError(msg || 'Failed to create booking.');
      }
      return;
    }
    const row = data as { reference?: string } | null;
    setBookingRef(row?.reference ?? '');
    nextStep();
  };

  // --- Step Components ---

  const Step0_Auth = () => {
    const [mode, setMode] = useState<'signin' | 'signup'>('signup');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSubmitting(true);

      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Please enter your name.');
          setSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters.');
          setSubmitting(false);
          return;
        }
        const { error: signUpError } = await signUp(email, password, name);
        if (signUpError) {
          const msg = signUpError.toLowerCase();
          if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
            setMode('signin');
            setError('An account with that email already exists. Please sign in.');
          } else {
            setError(signUpError);
          }
          setSubmitting(false);
          return;
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(signInError);
          setSubmitting(false);
          return;
        }
      }
      setSubmitting(false);
    };

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-medium tracking-tight mb-2">Create Your Account</h2>
          <p className="text-sm text-gray-500 font-medium">You need an account to manage your booking.</p>
        </div>

        <div className="flex gap-2 p-1 bg-black/5 rounded-full w-fit">
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            Sign Up
          </button>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            Log In
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
              placeholder={mode === 'signup' ? 'Min 8 characters' : ''}
            />
          </div>

          {error && (
            <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="mt-10 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-black text-white rounded-full font-medium disabled:opacity-50 transition-opacity hover:bg-black/80"
            >
              {submitting ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  const Step0_Plans = () => (
    <div className="space-y-4">
      <h2 className="text-3xl font-medium tracking-tight mb-8">Select a Plan</h2>
      {plans.map((plan) => (
        <div
          key={plan.id}
          onClick={() => { updateBooking({ plan }); nextStep(); }}
          className="p-6 border border-black/10 rounded-2xl hover:bg-black/5 cursor-pointer transition-colors flex justify-between items-center group bg-white"
        >
          <div>
            <h3 className="font-medium text-xl text-black">{plan.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
            <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1"><CalendarIcon size={14} /> {plan.duration} min</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-medium text-black">${plan.price}</div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-sm mt-2 flex items-center justify-end text-gray-500 font-medium">
              Select <ChevronRight size={16} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const Step1_Location = () => (
    <div className="space-y-4">
      <h2 className="text-3xl font-medium tracking-tight mb-8">Choose Location</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            onClick={() => updateBooking({ location: loc })}
            className={`p-5 border rounded-2xl cursor-pointer transition-colors ${booking.location?.id === loc.id ? 'border-black bg-black/5' : 'border-black/10 hover:bg-black/5 bg-white'}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium flex items-center gap-2 text-black"><MapPin size={18} /> {loc.name}</span>
              <span className="text-sm text-gray-500 font-medium">{loc.surcharge > 0 ? `+$${loc.surcharge}` : 'Included'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 flex justify-end">
        <button
          onClick={nextStep}
          disabled={!booking.location}
          className="px-8 py-3 bg-black text-white rounded-full font-medium disabled:opacity-50 transition-opacity hover:bg-black/80"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const Step2_DateTime = () => {
    // Simple calendar logic for prototype
    const today = startOfDay(new Date());
    const minDate = addDays(today, 2); // 48 hours notice
    
    // Generate next 14 days
    const dates = Array.from({ length: 14 }, (_, i) => addDays(minDate, i));

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-medium tracking-tight mb-2">Schedule Session</h2>
          <p className="text-sm text-gray-500 font-medium mb-8">Bookings require at least 48 hours notice.</p>
        </div>
        
        <div>
          <h3 className="font-medium mb-4 text-black text-lg">Select Date</h3>
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x hide-scrollbar">
            {dates.map((d) => {
              const isSelected = booking.date && format(booking.date, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd');
              return (
                <div
                  key={d.toISOString()}
                  onClick={() => updateBooking({ date: d, time: null })}
                  className={`snap-start shrink-0 w-24 p-4 border rounded-2xl cursor-pointer text-center transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-black/10 hover:bg-black/5 bg-white text-black'}`}
                >
                  <div className="text-xs uppercase mb-1 opacity-80 font-medium">{format(d, 'EEE')}</div>
                  <div className="text-2xl font-medium">{format(d, 'd')}</div>
                  <div className="text-xs opacity-80 mt-1 font-medium">{format(d, 'MMM')}</div>
                </div>
              );
            })}
          </div>
        </div>

        {booking.date && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h3 className="font-medium mb-4 text-black text-lg">Select Time</h3>
            {slotsLoading ? (
              <p className="text-sm text-gray-500 font-medium">Checking availability…</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-sm text-gray-500 font-medium">No photographers available for this date and location. Please pick another date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableSlots.map((t) => (
                  <div
                    key={t}
                    onClick={() => updateBooking({ time: t })}
                    className={`p-4 border rounded-2xl cursor-pointer text-center transition-colors font-medium ${booking.time === t ? 'border-black bg-black/5 text-black' : 'border-black/10 hover:bg-black/5 bg-white text-gray-600'}`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {booking.time && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-black/10">
            <h3 className="font-medium mb-4 text-black text-lg">Need more time?</h3>
            <div className="flex items-center justify-between p-5 border border-black/10 rounded-2xl bg-white">
              <div>
                <div className="font-medium text-black">Extend Session</div>
                <div className="text-sm text-gray-500">+$100 per 30 mins</div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateBooking({ extraDuration: Math.max(0, booking.extraDuration - 30) })}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
                >-</button>
                <span className="w-16 text-center font-medium text-black">+{booking.extraDuration}m</span>
                <button 
                  onClick={() => updateBooking({ extraDuration: booking.extraDuration + 30 })}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
                >+</button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mt-10 flex justify-end">
          <button
            onClick={nextStep}
            disabled={!booking.date || !booking.time}
            className="px-8 py-3 bg-black text-white rounded-full font-medium disabled:opacity-50 transition-opacity hover:bg-black/80"
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const Step3_GroupSize = () => (
    <div className="space-y-6">
      <h2 className="text-3xl font-medium tracking-tight mb-8">Group Size</h2>
      <div className="p-6 border border-black/10 rounded-2xl flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center">
            <Users size={24} className="text-gray-500" />
          </div>
          <div>
            <div className="font-medium text-lg text-black">Number of People</div>
            <div className="text-sm text-gray-500">Base price includes 1 person. +$7 per extra person. Max 10.</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => updateBooking({ groupSize: Math.max(1, booking.groupSize - 1) })}
            className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
          >-</button>
          <span className="w-8 text-center font-semibold text-xl text-black">{booking.groupSize}</span>
          <button 
            onClick={() => updateBooking({ groupSize: Math.min(10, booking.groupSize + 1) })}
            className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
          >+</button>
        </div>
      </div>
      <div className="mt-10 flex justify-end">
        <button onClick={nextStep} className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors">Continue</button>
      </div>
    </div>
  );

  const Step4_Addons = () => {
    const toggleAddon = (addon: Addon) => {
      const exists = booking.addons.find(a => a.id === addon.id);
      if (exists) {
        updateBooking({ addons: booking.addons.filter(a => a.id !== addon.id) });
      } else {
        updateBooking({ addons: [...booking.addons, addon] });
      }
    };

    const hasRetouch = booking.addons.some(a => a.slug === 'retouch');

    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-medium tracking-tight mb-8">Enhance Your Session</h2>
        <div className="space-y-3">
          {addonList.map(addon => {
            const isSelected = booking.addons.some(a => a.id === addon.id);
            return (
              <div
                key={addon.id}
                onClick={() => toggleAddon(addon)}
                className={`p-5 border rounded-2xl cursor-pointer transition-colors flex justify-between items-center ${isSelected ? 'border-black bg-black/5' : 'border-black/10 hover:bg-black/5 bg-white'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-black border-black text-white' : 'border-black/20'}`}>
                    {isSelected && <Check size={14} />}
                  </div>
                  <span className="font-medium text-black">{addon.name}</span>
                </div>
                <span className="text-gray-500 font-medium">+${addon.price}</span>
              </div>
            );
          })}
          <div
            onClick={() => updateBooking({ addons: [], retouchNotes: '' })}
            className={`p-5 border rounded-2xl cursor-pointer transition-colors flex justify-between items-center ${booking.addons.length === 0 ? 'border-black bg-black/5' : 'border-black/10 hover:bg-black/5 bg-white'}`}
          >
             <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${booking.addons.length === 0 ? 'border-black' : 'border-black/20'}`}>
                  {booking.addons.length === 0 && <div className="w-3 h-3 bg-black rounded-full" />}
                </div>
                <span className="font-medium text-black">Nothing needed</span>
              </div>
          </div>
        </div>

        <AnimatePresence>
          {hasRetouch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6">
                <label className="block text-sm font-medium mb-2 text-black">Retouching Notes (Optional)</label>
                <textarea
                  value={booking.retouchNotes}
                  onChange={(e) => updateBooking({ retouchNotes: e.target.value })}
                  placeholder="E.g., Please remove blemishes, soften skin..."
                  className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black resize-none h-32 transition-colors"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex justify-end">
          <button onClick={nextStep} className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors">Continue</button>
        </div>
      </div>
    );
  };

  const Step5_ClientInfo = () => {
    const isValid = booking.clientInfo.name && booking.clientInfo.phone && booking.clientInfo.country;
    
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-medium tracking-tight mb-8">Your Details</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Full Name *</label>
            <input
              type="text"
              value={booking.clientInfo.name}
              onChange={(e) => updateBooking({ clientInfo: { ...booking.clientInfo, name: e.target.value } })}
              className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">WhatsApp / Phone *</label>
              <input
                type="tel"
                value={booking.clientInfo.phone}
                onChange={(e) => updateBooking({ clientInfo: { ...booking.clientInfo, phone: e.target.value } })}
                className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black">Country *</label>
              <select
                value={booking.clientInfo.country}
                onChange={(e) => updateBooking({ clientInfo: { ...booking.clientInfo, country: e.target.value } })}
                className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black appearance-none transition-colors"
                required
              >
                <option value="">Select Country</option>
                <option value="US">United States</option>
                <option value="KR">South Korea</option>
                <option value="JP">Japan</option>
                <option value="CN">China</option>
                <option value="UK">United Kingdom</option>
                <option value="AU">Australia</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Special Requests</label>
            <textarea
              value={booking.clientInfo.requests}
              onChange={(e) => updateBooking({ clientInfo: { ...booking.clientInfo, requests: e.target.value } })}
              className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black resize-none h-32 transition-colors"
            />
          </div>
        </div>
        <div className="mt-10 flex justify-end">
          <button
            onClick={nextStep}
            disabled={!isValid}
            className="px-8 py-3 bg-black text-white rounded-full font-medium disabled:opacity-50 transition-opacity hover:bg-black/80"
          >
            Review Booking
          </button>
        </div>
      </div>
    );
  };

  const Step6_Review = () => {
    const total = calculateTotal();
    
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-medium tracking-tight mb-8">Review & Confirm</h2>
        
        <div className="border border-black/10 rounded-2xl overflow-hidden bg-white">
          <div className="bg-black/5 p-6 border-b border-black/10">
            <h3 className="font-medium text-xl text-black">{booking.plan?.name}</h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {booking.date ? format(booking.date, 'MMMM d, yyyy') : ''} at {booking.time}
            </p>
          </div>
          
          <div className="p-6 space-y-4 text-sm font-medium">
            <div className="flex justify-between">
              <span className="text-gray-500">Base Plan ({booking.plan?.duration}m)</span>
              <span className="text-black">${booking.plan?.price}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-500">Location: {booking.location?.name}</span>
              <span className="text-black">{booking.location?.surcharge ? `+$${booking.location.surcharge}` : 'Included'}</span>
            </div>
            
            {booking.extraDuration > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Extra Time (+{booking.extraDuration}m)</span>
                <span className="text-black">+${(booking.extraDuration / 30) * 100}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-500">Group Size ({booking.groupSize} people)</span>
              <span className="text-black">{booking.groupSize > 1 ? `+$${(booking.groupSize - 1) * 7}` : 'Included'}</span>
            </div>
            
            {booking.addons.map(addon => (
              <div key={addon.id} className="flex justify-between">
                <span className="text-gray-500">Add-on: {addon.name}</span>
                <span className="text-black">+${addon.price}</span>
              </div>
            ))}
            
            <div className="pt-4 mt-4 border-t border-black/10 flex justify-between font-medium text-xl text-black">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 mt-8">
          <div 
            onClick={() => updateBooking({ agreedToPolicy: !booking.agreedToPolicy })}
            className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${booking.agreedToPolicy ? 'bg-black border-black text-white' : 'border-black/20 bg-white'}`}
          >
            {booking.agreedToPolicy && <Check size={14} />}
          </div>
          <div className="text-sm text-gray-500 font-medium cursor-pointer leading-relaxed" onClick={() => updateBooking({ agreedToPolicy: !booking.agreedToPolicy })}>
            I agree to the cancellation policy. Cancellations made within 48 hours of the shoot are non-refundable.
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={nextStep}
            disabled={!booking.agreedToPolicy}
            className="px-8 py-3 bg-black text-white rounded-full font-medium disabled:opacity-50 transition-opacity hover:bg-black/80"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  };

  const Step7_Payment = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
        <CreditCard size={32} className="text-black" />
      </div>
      <h2 className="text-3xl font-medium tracking-tight mb-4 text-black">Complete Payment</h2>
      <p className="text-gray-500 mb-10 font-medium">
        Please complete your payment of <strong className="text-black">${calculateTotal()}</strong> via KakaoPay to secure your booking.
      </p>
      
      <a 
        href="https://link.kakaopay.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="block w-full p-4 bg-[#FEE500] text-[#191919] font-medium rounded-2xl hover:bg-[#FEE500]/90 transition-colors mb-8 shadow-sm"
      >
        Pay with KakaoPay
      </a>
      
      <div className="pt-8 border-t border-black/10">
        <p className="text-sm text-gray-500 mb-6 font-medium">Once you have completed the transfer:</p>
        {submitError && (
          <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">
            {submitError}
          </div>
        )}
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full px-8 py-4 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors disabled:opacity-50"
        >
          {submitting ? 'Confirming…' : "I've completed my payment"}
        </button>
      </div>
    </div>
  );

  const Step8_Confirmation = () => (
    <div className="space-y-6 text-center py-12">
      <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
        <Check size={48} />
      </div>
      <h2 className="text-4xl font-medium tracking-tight mb-4 text-black">Booking Confirmed!</h2>
      <p className="text-gray-500 mb-10 font-medium max-w-md mx-auto">
        Thank you, {booking.clientInfo.name}. We&apos;ll contact you within 24 hours to confirm your session details.
      </p>
      
      <div className="p-8 bg-white border border-black/10 rounded-2xl inline-block mb-10 shadow-sm">
        <div className="text-sm text-gray-500 mb-2 font-medium">Booking Reference</div>
        <div className="text-3xl font-mono font-medium tracking-wider text-black">{bookingRef}</div>
      </div>
      
      <div>
        <Link
          href="/"
          className="px-10 py-4 border border-black/10 rounded-full font-medium text-black hover:bg-black/5 transition-colors inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );

  const steps = [
    Step0_Auth, Step0_Plans, Step1_Location, Step2_DateTime, Step3_GroupSize,
    Step4_Addons, Step5_ClientInfo, Step6_Review, Step7_Payment, Step8_Confirmation
  ];

  const CurrentStep = steps[step];

  return (
    <main className="min-h-screen bg-[#fcfcfc] pt-32 pb-24 text-black selection:bg-black selection:text-white">
      {/* Progress Bar */}
      {step < 9 && (
        <div className="w-full h-1 bg-black/5 fixed top-0 left-0 z-40">
          <motion.div
            className="h-full bg-black"
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / 9) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="w-full max-w-3xl mx-auto px-6">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step > (user ? 1 : 0) && step < 9 && (
              <button onClick={prevStep} className="p-2 hover:bg-black/5 rounded-full transition-colors text-black">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="font-medium text-gray-500">
              {step < 9 ? `Step ${step + 1} of 9` : 'Confirmation'}
            </div>
          </div>
          {step < 9 && (
            <Link href="/" className="text-gray-500 hover:text-black text-sm font-medium transition-colors">
              Cancel
            </Link>
          )}
        </div>

        {/* Content */}
        <div className="bg-[#fcfcfc]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <CurrentStep />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
