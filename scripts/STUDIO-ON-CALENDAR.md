Studio ON calendar sync runs in a private Apps Script project owned by
studio.on.snap@gmail.com. Its time trigger runs every five minutes, including
while the owner's computer is off. Booking confirmation email delivery is
independent and remains real time.

The Vercel route `/api/internal/booking-calendar` is read only. A fresh HMAC
signature using the dedicated BOOKING_CALENDAR_SYNC_SECRET is required. The
script stores the matching key as the SYNC_SECRET script property; never put
the key in source control, a URL, or logs. The database service key never
leaves the booking server.

Install `studio-on-calendar.gs` and the accompanying Apps Script manifest in
the private project, set the signing-key property, then run
`installStudioOnSync` as the Studio ON account. The owner must approve the
Google consent screen. No public web app, paid provider, or local Codex task
is needed. Inspect LAST_RUN and the Google trigger's execution log to verify.

The feed includes today in Tokyo and all later dates. Paid confirmed and
pending-confirmation bookings are active. Membercheck's completed status
means refunded, per the owner, and is excluded along with cancellations,
unpaid bookings, and internal test bookings. Supplementary Stripe payments
do not create a new booking and therefore never create a new event.

Calendars are mapped by the assigned member UUID. JO and Hamin Yang have
separate calendars. Unassigned/unmapped photographers are held for review.
Titles show customer, session, and location. Existing backfill events are
adopted by their exact final booking marker, then tagged with private booking
metadata. New events use a deterministic Google event ID. Scheduled runs
skip identical events, move events when the photographer changes, and update
times/details. Refunds/cancellations remove only future managed events.

The script never invites guests, sends calendar emails, creates Meet links,
or writes to the primary Studio ON calendar. No email workflow is invoked.
To stop only calendar sync, remove this project's syncStudioOn time trigger.
