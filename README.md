# @ Studio ON — Tokyo Photoshoot Booking

A Next.js web app for **@ Studio ON**, a cinematic photography studio in Tokyo. Visitors browse session packages, pick a location, date, group size and add-ons, then pay securely through Stripe. Bookings, availability and pricing are backed by Supabase (Postgres + Auth).

## Tech stack

- **Next.js 15** (App Router, React 19) + **TypeScript**
- **Tailwind CSS 4** for styling, **GSAP** / **motion** for animation
- **Supabase** — Postgres, Auth, and `SECURITY DEFINER` RPCs for booking logic
- **Stripe Checkout** for payments (+ webhook to confirm bookings)

## How it works

1. **Browse** — The homepage (`/`) and plan pages (`/plan/[slug]`) list the session packages. Plan content lives in [`lib/plans.ts`](lib/plans.ts) (hardcoded, customer-facing) and is also read from the Supabase `plans` table via [`lib/data.ts`](lib/data.ts).
2. **Book** — `/book` is a multi-step flow ([`app/book/BookClient.tsx`](app/book/BookClient.tsx)): account → plan → location → date/time → group size → add-ons → details → review.
3. **Pay** — `POST /api/checkout` calls the `create_pending_booking` RPC, which **re-computes the authoritative total server-side**, holds the slot for 30 minutes, and creates a Stripe Checkout Session. Client-side totals are display-only and never trusted.
4. **Confirm** — `POST /api/webhooks/stripe` flips the booking to paid once Stripe confirms payment.

### Pricing model

Each plan has a base price, a strikethrough "original" price (marketing), and a per-plan **additional-person** rate charged for each person beyond the first.

| Plan | Slug | Base | Was | +Each extra person |
| --- | --- | --- | --- | --- |
| Tokyo Quick Shot | `quick` | $70 | $90 | +$50 |
| Full Portrait Session | `portrait` | $100 | $130 | +$55 |
| Fish Eye Session | `fisheye` | $150 | $190 | +$60 |
| Signature Session | `signature` | $190 | $240 | +$65 |
| Couple / Proposal Session | `couple` | $300 | $380 | included |

Total = base + location surcharge + extra time ($100 / 30 min) + extra people (per-plan rate) + add-ons.

Lenses are colour-coded in the UI so customers can tell sessions apart at a glance: **Portrait → bright yellow**, **Fish Eye → mint**.

The price composition is defined in three places that must stay in sync:

- [`lib/plans.ts`](lib/plans.ts) — hardcoded customer-facing plans (homepage, `/book`, sitemap).
- Supabase `plans` table (columns `price`, `extra_person_price`, …) — the **source of truth the server charges against**, used by the `create_pending_booking` RPC.
- [`lib/pricing.ts`](lib/pricing.ts) — a client-side mirror of the RPC's math for the review screen.

> ⚠️ When changing prices, update the Supabase `plans` row, `lib/plans.ts`, and the enriched maps in `lib/data.ts` together. The `create_pending_booking` RPC is the only authority on what Stripe charges.

## Project structure

```
app/
  page.tsx              Homepage
  plan/[id]/            Plan detail pages
  book/                 Booking flow + success/cancelled screens
  locations/            Location landing pages (SEO)
  about/, commercial-law/, profile/
  api/
    checkout/           Create pending booking + Stripe session
    webhooks/stripe/    Confirm bookings on payment
    bookings/[id]/      Cancel / reschedule / policy
    events/             Lightweight booking-funnel analytics
components/             Gallery, Navbar, Footer, FAQ, etc.
lib/                    plans, pricing, data, supabase clients, seo
```

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` with the variables below.
3. Start the dev server:
   ```bash
   npm run dev
   ```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase key used to load staff recipients and email delivery state |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the Stripe webhook |
| `NEXT_PUBLIC_BASE_URL` | Public origin used for Stripe success/cancel URLs (optional; falls back to the request origin) |
| `RESEND_API_KEY` | Server-only Resend API key for paid-booking notifications |
| `RESEND_FROM_EMAIL` | Sender address on a Resend-verified domain |
| `RESEND_FROM_NAME` | Sender display name (optional; defaults to `@ Studio ON`) |
| `RESEND_REPLY_TO_EMAIL` | Reply-to address (optional; defaults to the sender address) |

To exercise the webhook locally, forward Stripe events:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Booking confirmation emails

Once Stripe marks a booking paid, the app sends a confirmation to the customer
and a detailed notification to each active Membercheck worker. Delivery state is
stored in `booking_email_notifications`, so webhook retries and the success-page
fallback do not resend messages that were already delivered. Apply the Supabase
migrations before deploying this feature.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
