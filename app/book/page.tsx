'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfDay } from 'date-fns';
import { ChevronRight, ChevronLeft, Check, Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import Link from 'next/link';
import { Location, Addon, fetchLocations, fetchAddons } from '@/lib/data';
import { PLANS, type Plan } from '@/lib/plans';
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

type SerializedBookingState = Omit<BookingState, 'date'> & { date: string | null };

type BookingDraftV1 = {
  version: 1;
  step: number;
  booking: SerializedBookingState;
};

type ClientInfoErrors = Partial<Record<'name' | 'phone' | 'country', string>>;

type ClientInfoTouched = Record<'name' | 'phone' | 'country', boolean>;

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

const BOOKING_DRAFT_STORAGE_KEY = 'photo-booking-draft-v1';
const BOOKING_DRAFT_VERSION = 1;

const STEP_AUTH = 0;
const STEP_PLAN = 1;
const STEP_LOCATION = 2;
const STEP_DATETIME = 3;
const STEP_GROUP_SIZE = 4;
const STEP_ADDONS = 5;
const STEP_CLIENT_INFO = 6;
const STEP_REVIEW = 7;
const TOTAL_STEPS = 8;

const PHONE_PATTERN = /^\+?[0-9()\-.\s]{7,20}$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function parsePlan(value: unknown): Plan | null {
  if (!isRecord(value) || typeof value.slug !== 'string') return null;
  return PLANS.find((plan) => plan.slug === value.slug) ?? null;
}

function parseLocation(value: unknown): Location | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isFiniteNumber(value.surcharge)
  ) {
    return null;
  }
  return {
    id: value.id,
    name: value.name,
    surcharge: value.surcharge,
    isComingSoon: Boolean(value.isComingSoon),
  };
}

function parseAddon(value: unknown): Addon | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.name !== 'string' ||
    !isFiniteNumber(value.price)
  ) {
    return null;
  }
  return {
    id: value.id,
    slug: value.slug,
    name: value.name,
    price: value.price,
  };
}

function parseClientInfo(value: unknown): BookingState['clientInfo'] {
  if (!isRecord(value)) return INITIAL_STATE.clientInfo;
  return {
    name: typeof value.name === 'string' ? value.name : '',
    email: typeof value.email === 'string' ? value.email : '',
    phone: typeof value.phone === 'string' ? value.phone : '',
    country: typeof value.country === 'string' ? value.country : '',
    requests: typeof value.requests === 'string' ? value.requests : '',
  };
}

function serializeBookingDraft(step: number, booking: BookingState): string {
  const draft: BookingDraftV1 = {
    version: BOOKING_DRAFT_VERSION,
    step,
    booking: {
      ...booking,
      date: booking.date ? booking.date.toISOString() : null,
    },
  };
  return JSON.stringify(draft);
}

function parseBookingDraft(raw: string | null): { step: number; booking: BookingState } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed)) return null;
    if (parsed.version !== BOOKING_DRAFT_VERSION || !isFiniteNumber(parsed.step)) return null;
    if (!isRecord(parsed.booking)) return null;

    const bookingRaw = parsed.booking;
    let date: Date | null = null;
    if (bookingRaw.date !== null && bookingRaw.date !== undefined) {
      if (typeof bookingRaw.date !== 'string') return null;
      const parsedDate = new Date(bookingRaw.date);
      if (Number.isNaN(parsedDate.getTime())) return null;
      date = parsedDate;
    }

    const addons = Array.isArray(bookingRaw.addons)
      ? bookingRaw.addons
          .map((addon) => parseAddon(addon))
          .filter((addon): addon is Addon => addon !== null)
      : [];

    const booking: BookingState = {
      plan: parsePlan(bookingRaw.plan),
      location: parseLocation(bookingRaw.location),
      date,
      time: typeof bookingRaw.time === 'string' ? bookingRaw.time : null,
      extraDuration: isFiniteNumber(bookingRaw.extraDuration) ? Math.max(0, bookingRaw.extraDuration) : 0,
      groupSize: isFiniteNumber(bookingRaw.groupSize)
        ? Math.min(10, Math.max(1, Math.round(bookingRaw.groupSize)))
        : 1,
      addons,
      retouchNotes: typeof bookingRaw.retouchNotes === 'string' ? bookingRaw.retouchNotes : '',
      clientInfo: parseClientInfo(bookingRaw.clientInfo),
      agreedToPolicy: bookingRaw.agreedToPolicy === true,
    };

    return {
      step: Math.floor(parsed.step),
      booking,
    };
  } catch {
    return null;
  }
}

function readBookingDraft(): { step: number; booking: BookingState } | null {
  if (typeof window === 'undefined') return null;
  return parseBookingDraft(window.sessionStorage.getItem(BOOKING_DRAFT_STORAGE_KEY));
}

function writeBookingDraft(step: number, booking: BookingState) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(BOOKING_DRAFT_STORAGE_KEY, serializeBookingDraft(step, booking));
  } catch {
    // Ignore storage errors (quota/private mode).
  }
}

function getDefaultStep(isAuthenticated: boolean, hasPlan: boolean): number {
  if (!isAuthenticated) return STEP_AUTH;
  return hasPlan ? STEP_LOCATION : STEP_PLAN;
}

function getClientInfoErrors(clientInfo: BookingState['clientInfo']): ClientInfoErrors {
  const errors: ClientInfoErrors = {};

  const name = clientInfo.name.trim();
  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Please enter at least 2 characters.';
  }

  const phone = clientInfo.phone.trim();
  if (!phone) {
    errors.phone = 'Phone number is required.';
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = 'Please enter a valid phone number.';
  }

  if (!clientInfo.country) {
    errors.country = 'Please select your country.';
  }

  return errors;
}

function isClientInfoValid(clientInfo: BookingState['clientInfo']): boolean {
  return Object.keys(getClientInfoErrors(clientInfo)).length === 0;
}

function clampStepForState(step: number, isAuthenticated: boolean, booking: BookingState): number {
  if (!isAuthenticated) return STEP_AUTH;

  let maxAllowed = STEP_PLAN;

  if (!booking.plan) {
    return Math.min(Math.max(step, STEP_PLAN), maxAllowed);
  }
  maxAllowed = STEP_LOCATION;

  if (!booking.location) {
    return Math.min(Math.max(step, STEP_PLAN), maxAllowed);
  }
  maxAllowed = STEP_DATETIME;

  if (!booking.date || !booking.time) {
    return Math.min(Math.max(step, STEP_PLAN), maxAllowed);
  }
  maxAllowed = STEP_CLIENT_INFO;

  if (isClientInfoValid(booking.clientInfo)) {
    maxAllowed = STEP_REVIEW;
  }

  return Math.min(Math.max(step, STEP_PLAN), maxAllowed);
}

export default function BookPage() {
  const { user, loading: authLoading, signIn, signUp } = useAuth();

  const [step, setStep] = useState(STEP_AUTH);
  const [booking, setBooking] = useState<BookingState>(INITIAL_STATE);
  const [locations, setLocations] = useState<Location[]>([]);
  const [addonList, setAddonList] = useState<Addon[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [clientInfoTouched, setClientInfoTouched] = useState<ClientInfoTouched>({
    name: false,
    phone: false,
    country: false,
  });

  const clientInfoErrors = getClientInfoErrors(booking.clientInfo);
  const isClientInfoStepValid = Object.keys(clientInfoErrors).length === 0;

  const hydrateFromDraft = useCallback(() => {
    if (authLoading || hasHydratedDraft) return;

    const params = new URLSearchParams(window.location.search);
    const planSlug = params.get('plan');
    const selectedPlan = planSlug ? PLANS.find((plan) => plan.slug === planSlug) ?? null : null;

    const savedDraft = readBookingDraft();
    let nextBooking = savedDraft?.booking ?? INITIAL_STATE;
    let nextStep = savedDraft?.step ?? getDefaultStep(Boolean(user), Boolean(selectedPlan));

    const hadDifferentDraftPlan =
      Boolean(selectedPlan) &&
      Boolean(savedDraft?.booking.plan) &&
      savedDraft?.booking.plan?.slug !== selectedPlan?.slug;

    if (selectedPlan) {
      const shouldResetDependentFields =
        hadDifferentDraftPlan ||
        !savedDraft?.booking.plan ||
        savedDraft.booking.plan.slug !== selectedPlan.slug;

      if (shouldResetDependentFields) {
        nextBooking = {
          ...nextBooking,
          plan: selectedPlan,
          location: null,
          date: null,
          time: null,
          extraDuration: 0,
          addons: [],
          retouchNotes: '',
          agreedToPolicy: false,
        };
        nextStep = STEP_LOCATION;
      } else {
        nextBooking = {
          ...nextBooking,
          plan: selectedPlan,
        };
        nextStep = Math.max(nextStep, STEP_LOCATION);
      }
    }

    nextBooking = {
      ...nextBooking,
      clientInfo: {
        ...nextBooking.clientInfo,
        name: nextBooking.clientInfo.name || user?.name || '',
        email: nextBooking.clientInfo.email || user?.email || '',
      },
    };

    nextStep = clampStepForState(nextStep, Boolean(user), nextBooking);
    if (user && nextStep === STEP_AUTH) {
      nextStep = clampStepForState(getDefaultStep(true, Boolean(nextBooking.plan)), true, nextBooking);
    }

    setBooking(nextBooking);
    setStep(nextStep);
    setHasHydratedDraft(true);
  }, [authLoading, hasHydratedDraft, user]);

  const syncClientInfoFromUser = useCallback(() => {
    if (authLoading || !hasHydratedDraft || !user) return;

    setBooking((prev) => {
      const nextName = prev.clientInfo.name || user.name || '';
      const nextEmail = prev.clientInfo.email || user.email || '';

      if (nextName === prev.clientInfo.name && nextEmail === prev.clientInfo.email) {
        return prev;
      }

      return {
        ...prev,
        clientInfo: {
          ...prev.clientInfo,
          name: nextName,
          email: nextEmail,
        },
      };
    });
  }, [authLoading, hasHydratedDraft, user]);

  const enforceStepBounds = useCallback(() => {
    if (authLoading || !hasHydratedDraft) return;

    setStep((currentStep) => {
      if (user && currentStep === STEP_AUTH) {
        return clampStepForState(getDefaultStep(true, Boolean(booking.plan)), true, booking);
      }

      let next = clampStepForState(currentStep, Boolean(user), booking);
      if (user && next === STEP_AUTH) {
        next = clampStepForState(getDefaultStep(true, Boolean(booking.plan)), true, booking);
      }
      return next;
    });
  }, [authLoading, hasHydratedDraft, user, booking]);

  const clearAvailableSlots = useCallback(() => {
    setAvailableSlots([]);
  }, []);

  useEffect(() => {
    Promise.all([fetchLocations(), fetchAddons()])
      .then(([loadedLocations, loadedAddons]) => {
        setLocations(loadedLocations);
        setAddonList(loadedAddons);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    hydrateFromDraft();
  }, [hydrateFromDraft]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    syncClientInfoFromUser();
  }, [syncClientInfoFromUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    enforceStepBounds();
  }, [enforceStepBounds]);

  useEffect(() => {
    if (!hasHydratedDraft) return;
    writeBookingDraft(step, booking);
  }, [hasHydratedDraft, step, booking]);

  useEffect(() => {
    if (!hasHydratedDraft) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, hasHydratedDraft]);

  useEffect(() => {
    if (!user || !booking.date || !booking.location || !booking.plan) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      clearAvailableSlots();
      return;
    }

    const { plan, location, date, time: initialTime } = booking;
    const totalMinutes = plan.duration + booking.extraDuration;
    const durationHours = Math.ceil(totalMinutes / 60);
    const dateStr = format(date, 'yyyy-MM-dd');
    const locationId = location.id;

    setSlotsLoading(true);
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_date: dateStr,
        p_location_id: locationId,
        p_plan_duration_hours: durationHours,
      });

      if (cancelled) return;

      const slots = error ? [] : ((data as string[] | null) ?? []);
      setAvailableSlots(slots);

      if (initialTime && !slots.includes(initialTime)) {
        setBooking((prev) => ({ ...prev, time: null }));
      }

      setSlotsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, booking.date, booking.location, booking.plan, booking.extraDuration, booking.time, clearAvailableSlots]);

  const nextStep = () => {
    setStep((currentStep) => clampStepForState(currentStep + 1, Boolean(user), booking));
  };

  const prevStep = () => {
    setStep((currentStep) => {
      const minStep = user ? STEP_PLAN : STEP_AUTH;
      return Math.max(currentStep - 1, minStep);
    });
  };

  const updateBooking = (updates: Partial<BookingState>) => {
    setBooking((prev) => ({ ...prev, ...updates }));
  };

  const updateClientInfo = (updates: Partial<BookingState['clientInfo']>) => {
    setBooking((prev) => ({
      ...prev,
      clientInfo: {
        ...prev.clientInfo,
        ...updates,
      },
    }));
  };

  const setClientFieldTouched = (field: keyof ClientInfoTouched) => {
    setClientInfoTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleClientInfoContinue = () => {
    if (!isClientInfoStepValid) {
      setClientInfoTouched({ name: true, phone: true, country: true });
      return;
    }
    nextStep();
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    if (authMode === 'signup') {
      if (!authName.trim()) {
        setAuthError('Please enter your name.');
        setAuthSubmitting(false);
        return;
      }
      if (authPassword.length < 8) {
        setAuthError('Password must be at least 8 characters.');
        setAuthSubmitting(false);
        return;
      }

      const { error: signUpError } = await signUp(authEmail, authPassword, authName);
      if (signUpError) {
        const msg = signUpError.toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          setAuthMode('signin');
          setAuthError('An account with that email already exists. Please sign in.');
        } else {
          setAuthError(signUpError);
        }
        setAuthSubmitting(false);
        return;
      }
    } else {
      const { error: signInError } = await signIn(authEmail, authPassword);
      if (signInError) {
        setAuthError(signInError);
        setAuthSubmitting(false);
        return;
      }
    }

    setAuthSubmitting(false);
  };

  const handleProceedToPayment = async () => {
    if (submitting) return;
    if (!booking.plan || !booking.location || !booking.date || !booking.time) {
      setSubmitError('Missing booking details.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { plan, location, date, time } = booking;
    const startHour = parseInt(time.split(':')[0], 10);

    // Forward the user's JWT so the SECURITY DEFINER RPC sees auth.uid().
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setSubmitError('Please sign in again.');
      setSubmitting(false);
      return;
    }

    let res: Response;
    try {
      res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planSlug: plan.slug,
          locationId: location.id,
          date: format(date, 'yyyy-MM-dd'),
          startHour,
          extraDurationMinutes: booking.extraDuration,
          groupSize: booking.groupSize,
          retouchNotes: booking.retouchNotes,
          addonIds: booking.addons.map((addon) => addon.id),
          clientName: booking.clientInfo.name,
          clientEmail: booking.clientInfo.email || user?.email || '',
          clientPhone: booking.clientInfo.phone,
          clientCountry: booking.clientInfo.country,
          specialRequests: booking.clientInfo.requests,
          agreedToPolicy: booking.agreedToPolicy,
        }),
      });
    } catch {
      setSubmitError('Could not reach payment service. Please try again.');
      setSubmitting(false);
      return;
    }

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setSubmitError(payload.error ?? 'Failed to start payment.');
      setSubmitting(false);
      return;
    }

    const { url } = (await res.json()) as { url?: string };
    if (!url) {
      setSubmitError('Payment session did not return a redirect URL.');
      setSubmitting(false);
      return;
    }

    // Hand off to Stripe. The booking is now held for 30 minutes.
    window.location.href = url;
  };

  const stepTitleClass = 'text-2xl md:text-3xl font-medium tracking-tight mb-7 md:mb-8';
  const actionRowClass = 'mt-8 md:mt-10 flex justify-stretch sm:justify-end';
  const actionBtnClass =
    'mobile-touch-target w-full sm:w-auto px-8 bg-black text-white rounded-full font-medium hover:bg-black/80 transition-colors';
  const actionBtnDisabledClass =
    'mobile-touch-target w-full sm:w-auto px-8 bg-black text-white rounded-full font-medium disabled:opacity-50 transition-opacity hover:bg-black/80';

  const renderStepAuth = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">Create Your Account</h2>
        <p className="text-sm text-gray-500 font-medium">You need an account to manage your booking.</p>
      </div>

      <div className="flex gap-2 p-1 bg-black/5 rounded-full w-fit">
        <button
          type="button"
          onClick={() => {
            setAuthMode('signup');
            setAuthError(null);
          }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${authMode === 'signup' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthMode('signin');
            setAuthError(null);
          }}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${authMode === 'signin' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
        >
          Log In
        </button>
      </div>

      <form onSubmit={handleAuthSubmit} className="space-y-5">
        {authMode === 'signup' && (
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Full Name</label>
            <input
              type="text"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              required
              className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-black">Email</label>
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-black">Password</label>
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            required
            minLength={authMode === 'signup' ? 8 : undefined}
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black transition-colors"
            placeholder={authMode === 'signup' ? 'Min 8 characters' : ''}
          />
        </div>

        {authError && (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">
            {authError}
          </div>
        )}

        <div className={actionRowClass}>
          <button type="submit" disabled={authSubmitting} className={actionBtnDisabledClass}>
            {authSubmitting ? 'Please wait…' : authMode === 'signup' ? 'Create Account' : 'Log In'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderStepPlans = () => (
    <div className="space-y-4">
      <h2 className={stepTitleClass}>Select a Plan</h2>
      {PLANS.map((plan) => (
        <div
          key={plan.slug}
          onClick={() => {
            updateBooking({
              plan,
              location: null,
              date: null,
              time: null,
              extraDuration: 0,
              addons: [],
              retouchNotes: '',
              agreedToPolicy: false,
            });
            nextStep();
          }}
          className="p-5 md:p-6 border border-black/10 rounded-2xl hover:bg-black/5 cursor-pointer transition-colors flex justify-between items-center group bg-white gap-4"
        >
          <div>
            <h3 className="font-medium text-xl text-black">{plan.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
            <div className="flex items-center gap-4 mt-4 text-xs font-medium text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarIcon size={14} /> {plan.duration} min
              </span>
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

  const renderStepLocation = () => (
    <div className="space-y-4">
      <h2 className={stepTitleClass}>Choose Location</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {locations.map((location) => (
          <div
            key={location.id}
            onClick={() => {
              if (location.isComingSoon) return;
              updateBooking({ location, date: null, time: null, extraDuration: 0 });
            }}
            className={`p-5 border rounded-2xl transition-all ${
              location.isComingSoon
                ? 'opacity-60 grayscale-[0.3] cursor-not-allowed bg-gray-50 border-black/5'
                : booking.location?.id === location.id
                  ? 'border-black bg-black/5 cursor-pointer'
                  : 'border-black/10 hover:bg-black/5 bg-white cursor-pointer'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="font-bold flex items-center gap-2 text-black">
                  <MapPin size={18} /> {location.name}
                  {location.isComingSoon && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap">
                      Coming Soon
                    </span>
                  )}
                </span>
                {location.isComingSoon && (
                  <span className="text-[10px] font-bold text-amber-600/80 uppercase tracking-tight">
                    Summer Season
                  </span>
                )}
              </div>
              <span className={`text-sm font-bold ${location.isComingSoon ? 'text-gray-400' : 'text-gray-500'}`}>
                {location.isComingSoon ? '—' : location.surcharge > 0 ? `+$${location.surcharge}` : 'Included'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={actionRowClass}>
        <button onClick={nextStep} disabled={!booking.location} className={actionBtnDisabledClass}>
          Continue
        </button>
      </div>
    </div>
  );

  const renderStepDateTime = () => {
    const today = startOfDay(new Date());
    const minDate = addDays(today, 2); // 48 hours notice
    const dates = Array.from({ length: 14 }, (_, index) => addDays(minDate, index));

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-2">Schedule Session</h2>
          <p className="text-sm text-gray-500 font-medium mb-6 md:mb-8">Bookings require at least 48 hours notice.</p>
        </div>

        <div>
          <h3 className="font-medium mb-4 text-black text-lg">Select Date</h3>
          <div className="flex overflow-x-auto pb-4 gap-3 snap-x hide-scrollbar">
            {dates.map((dateOption) => {
              const isSelected =
                booking.date &&
                format(booking.date, 'yyyy-MM-dd') === format(dateOption, 'yyyy-MM-dd');

              return (
                <div
                  key={dateOption.toISOString()}
                  onClick={() => updateBooking({ date: dateOption, time: null, extraDuration: 0 })}
                  className={`snap-start shrink-0 w-[5.5rem] md:w-24 p-3.5 md:p-4 border rounded-2xl cursor-pointer text-center transition-colors ${isSelected ? 'border-black bg-black text-white' : 'border-black/10 hover:bg-black/5 bg-white text-black'}`}
                >
                  <div className="text-xs uppercase mb-1 opacity-80 font-medium">{format(dateOption, 'EEE')}</div>
                  <div className="text-2xl font-medium">{format(dateOption, 'd')}</div>
                  <div className="text-xs opacity-80 mt-1 font-medium">{format(dateOption, 'MMM')}</div>
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
              <p className="text-sm text-gray-500 font-medium">
                No photographers available for this date and location. Please pick another date.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map((timeOption) => (
                  <div
                    key={timeOption}
                    onClick={() => updateBooking({ time: timeOption })}
                    className={`p-4 border rounded-2xl cursor-pointer text-center transition-colors font-medium ${booking.time === timeOption ? 'border-black bg-black/5 text-black' : 'border-black/10 hover:bg-black/5 bg-white text-gray-600'}`}
                  >
                    {timeOption}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {booking.time && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-6 border-t border-black/10">
            <h3 className="font-medium mb-4 text-black text-lg">Need more time?</h3>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-black/10 rounded-2xl bg-white gap-4">
              <div className="pr-2">
                <div className="font-medium text-black">Extend Session</div>
                <div className="text-sm text-gray-500">+$100 per 30 mins</div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateBooking({ extraDuration: Math.max(0, booking.extraDuration - 30) })}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium text-black">+{booking.extraDuration}m</span>
                <button
                  onClick={() => updateBooking({ extraDuration: booking.extraDuration + 30 })}
                  className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <div className={actionRowClass}>
          <button
            onClick={nextStep}
            disabled={!booking.date || !booking.time}
            className={actionBtnDisabledClass}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderStepGroupSize = () => (
    <div className="space-y-6">
      <h2 className={stepTitleClass}>Group Size</h2>
      <div className="p-5 md:p-6 border border-black/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 bg-white">
        <div className="flex items-start md:items-center gap-4">
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
          >
            -
          </button>
          <span className="w-8 text-center font-semibold text-xl text-black">{booking.groupSize}</span>
          <button
            onClick={() => updateBooking({ groupSize: Math.min(10, booking.groupSize + 1) })}
            className="w-10 h-10 flex items-center justify-center border border-black/10 rounded-full hover:bg-black/5 text-black transition-colors"
          >
            +
          </button>
        </div>
      </div>
      <div className={actionRowClass}>
        <button onClick={nextStep} className={actionBtnClass}>
          Continue
        </button>
      </div>
    </div>
  );

  const renderStepAddons = () => {
    const toggleAddon = (addon: Addon) => {
      const exists = booking.addons.find((existing) => existing.id === addon.id);
      if (exists) {
        updateBooking({ addons: booking.addons.filter((existing) => existing.id !== addon.id) });
      } else {
        updateBooking({ addons: [...booking.addons, addon] });
      }
    };

    const hasRetouch = booking.addons.some((addon) => addon.slug === 'retouch');

    return (
      <div className="space-y-6">
        <h2 className={stepTitleClass}>Enhance Your Session</h2>
        <div className="space-y-3">
          {addonList.map((addon) => {
            const isSelected = booking.addons.some((selectedAddon) => selectedAddon.id === addon.id);
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

        <div className={actionRowClass}>
          <button onClick={nextStep} className={actionBtnClass}>
            Continue
          </button>
        </div>
      </div>
    );
  };

  const renderStepClientInfo = () => {
    const showNameError = clientInfoTouched.name || booking.clientInfo.name.trim().length > 0;
    const showPhoneError = clientInfoTouched.phone || booking.clientInfo.phone.trim().length > 0;
    const showCountryError = clientInfoTouched.country;

    return (
      <div className="space-y-6">
        <h2 className={stepTitleClass}>Your Details</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-black">Full Name *</label>
            <input
              type="text"
              value={booking.clientInfo.name}
              onChange={(e) => updateClientInfo({ name: e.target.value })}
              onBlur={() => setClientFieldTouched('name')}
              className={`w-full p-4 border rounded-2xl bg-white focus:outline-none transition-colors ${showNameError && clientInfoErrors.name ? 'border-red-300 focus:border-red-500' : 'border-black/10 focus:border-black'}`}
              required
            />
            {showNameError && clientInfoErrors.name && (
              <p className="mt-2 text-sm text-red-600">{clientInfoErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-black">WhatsApp / Phone *</label>
              <input
                type="tel"
                value={booking.clientInfo.phone}
                onChange={(e) => updateClientInfo({ phone: e.target.value })}
                onBlur={() => setClientFieldTouched('phone')}
                className={`w-full p-4 border rounded-2xl bg-white focus:outline-none transition-colors ${showPhoneError && clientInfoErrors.phone ? 'border-red-300 focus:border-red-500' : 'border-black/10 focus:border-black'}`}
                placeholder="+1 555 123 4567"
                required
              />
              {showPhoneError && clientInfoErrors.phone && (
                <p className="mt-2 text-sm text-red-600">{clientInfoErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-black">Country *</label>
              <select
                value={booking.clientInfo.country}
                onChange={(e) => updateClientInfo({ country: e.target.value })}
                onBlur={() => setClientFieldTouched('country')}
                className={`w-full p-4 border rounded-2xl bg-white focus:outline-none appearance-none transition-colors ${showCountryError && clientInfoErrors.country ? 'border-red-300 focus:border-red-500' : 'border-black/10 focus:border-black'}`}
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
              {showCountryError && clientInfoErrors.country && (
                <p className="mt-2 text-sm text-red-600">{clientInfoErrors.country}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-black">Special Requests</label>
            <textarea
              value={booking.clientInfo.requests}
              onChange={(e) => updateClientInfo({ requests: e.target.value })}
              className="w-full p-4 border border-black/10 rounded-2xl bg-white focus:outline-none focus:border-black resize-none h-32 transition-colors"
            />
          </div>
        </div>

        {!isClientInfoStepValid && (
          <p className="text-sm text-gray-500 font-medium">Please complete required fields with valid details.</p>
        )}

        <div className={actionRowClass}>
          <button
            onClick={handleClientInfoContinue}
            disabled={!isClientInfoStepValid}
            className={actionBtnDisabledClass}
          >
            Review Booking
          </button>
        </div>
      </div>
    );
  };

  const renderStepReview = () => {
    const total = calculateTotal();

    return (
      <div className="space-y-6">
        <h2 className={stepTitleClass}>Review & Confirm</h2>

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

            {booking.addons.map((addon) => (
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
          <div
            className="text-sm text-gray-500 font-medium cursor-pointer leading-relaxed"
            onClick={() => updateBooking({ agreedToPolicy: !booking.agreedToPolicy })}
          >
            I agree to the cancellation policy: <strong className="text-black">100% refund</strong> if
            cancelled more than 48 hours before the shoot, <strong className="text-black">50% refund</strong>{' '}
            between 24 and 48 hours before, and <strong className="text-black">no refund</strong> within 24
            hours.
          </div>
        </div>

        {submitError && (
          <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">
            {submitError}
          </div>
        )}

        <div className={actionRowClass}>
          <button
            onClick={handleProceedToPayment}
            disabled={!booking.agreedToPolicy || submitting}
            className={actionBtnDisabledClass}
          >
            {submitting ? 'Redirecting…' : `Pay $${total} with Card`}
          </button>
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case STEP_AUTH:
        return renderStepAuth();
      case STEP_PLAN:
        return renderStepPlans();
      case STEP_LOCATION:
        return renderStepLocation();
      case STEP_DATETIME:
        return renderStepDateTime();
      case STEP_GROUP_SIZE:
        return renderStepGroupSize();
      case STEP_ADDONS:
        return renderStepAddons();
      case STEP_CLIENT_INFO:
        return renderStepClientInfo();
      case STEP_REVIEW:
      default:
        return renderStepReview();
    }
  };

  return (
    <main className="min-h-screen bg-[#fcfcfc] pt-24 md:pt-32 pb-20 md:pb-24 text-black selection:bg-black selection:text-white">
      <div className="w-full h-1 bg-black/5 fixed top-0 left-0 z-40">
        <motion.div
          className="h-full bg-black"
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 md:px-6">
        <div className="mb-8 md:mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step > (user ? STEP_PLAN : STEP_AUTH) && (
              <button onClick={prevStep} className="p-2.5 hover:bg-black/5 rounded-full transition-colors text-black">
                <ChevronLeft size={20} />
              </button>
            )}
            <div className="font-medium text-gray-500">
              Step {step + 1} of {TOTAL_STEPS}
            </div>
          </div>
          <Link href="/" className="text-gray-500 hover:text-black text-sm font-medium transition-colors">
            Cancel
          </Link>
        </div>

        <div className="bg-[#fcfcfc]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
