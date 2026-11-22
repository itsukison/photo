import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmationIneligibility, renderBookingConfirmation, normalizeResendSender, deliverClaimedEmail } from '../lib/booking-confirmation.ts';

const now = Date.parse('2026-11-22T05:00:00Z');
const booking = {
  id: 'booking-1', reference: 'SHN-NEW', client_email: 'guest@example.com',
  date: '2026-11-27', start_minutes: 1230, end_minutes: 1280, group_size: 3,
  status: 'pending_confirmation', payment_status: 'paid', total_price: 270,
  stripe_payment_intent_id: 'pi_new', sessionName: 'Fish Eye Session', locationName: 'Shibuya',
  addons: [], requests: [],
};
const payment = { id: 'pi_new', created: 1795315971, status: 'succeeded', currency: 'usd', amountReceived: 27000, bookingId: 'booking-1', reference: 'SHN-NEW', kind: 'booking', paid: true, refunded: false, disputed: false, billingEmail: 'guest@example.com' };

test('only a later, matching, paid booking is eligible', () => {
  assert.equal(confirmationIneligibility(booking, payment, now), null);
  for (const patch of [{created:1795315970},{created:1795315969},{kind:'reschedule_fee'},{bookingId:'another'},{reference:'other'},{id:'pi_other'},{status:'processing'},{paid:false},{refunded:true},{disputed:true},{amountReceived:26900},{currency:'jpy'},{billingEmail:'another@example.com'}]) {
    assert.ok(confirmationIneligibility(booking, {...payment,...patch}, now), JSON.stringify(patch));
  }
  for (const patch of [{reference:'SHN-BD06CAA6'}, {payment_status:'refunded'}, {status:'cancelled'}, {status:'expired'}, {locationName:'Unknown'}, {client_email:'invalid'}, {group_size:0}, {date:'2026-11-21'}, {end_minutes:1230}]) {
    assert.ok(confirmationIneligibility({...booking,...patch}, payment, now), JSON.stringify(patch));
  }
});

test('verified Checkout discounts are accepted and unrelated questions are held', () => {
  assert.equal(confirmationIneligibility(booking,{...payment,amountReceived:24000,amountExpected:24000,amountBeforeDiscount:27000},now),null);
  assert.ok(confirmationIneligibility(booking,{...payment,amountReceived:24000,amountExpected:24000,amountBeforeDiscount:28000},now));
  assert.equal(confirmationIneligibility({...booking,requests:['Can you help us with posing?', 'What outfits should we wear?']},payment,now),null);
  assert.equal(confirmationIneligibility({...booking,requests:['When will all edited photos be delivered?']},payment,now),'customer-question-needs-review');
});

test('customer template matches the approved typography, details and optional sections', () => {
  const plain = renderBookingConfirmation(booking);
  assert.equal(plain.subject, 'Studio ON - Tokyo Photoshoot Booking Confirmation — SHN-NEW');
  assert.match(plain.html, /font-family:Arial,Helvetica,sans-serif;font-size:12px/);
  assert.match(plain.text, /November 27, 2026/);
  assert.match(plain.text, /8:30 PM – 9:20 PM \(50min\)/);
  assert.match(plain.text, /Number of Guests: 3 people/);
  assert.match(plain.text, /Hachiko Statue/);
  assert.match(plain.text, /WhatsApp 1–2 days before the session/);
  assert.doesNotMatch(plain.text, /add-ons|noted your requests|For posing|For outfits/);
  assert.doesNotMatch(plain.html, /<table|border-radius|font-size:16px/);
  const noted = renderBookingConfirmation({...booking, addons:['Skin & Face Retouch'], requests:['Pose ideas for me, my boyfriend, and my mom.', 'Outfit suggestions in advance.', '<script>bad</script>']});
  assert.match(noted.text, /✅ Skin & Face Retouch/);
  assert.ok(noted.text.indexOf('• Outfit suggestions') < noted.text.indexOf('For posing,'));
  assert.ok(noted.text.indexOf('• <script>') < noted.text.indexOf('For outfits,'));
  assert.match(noted.html, /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.doesNotMatch(noted.html, /<script>/);
  const shinjuku=renderBookingConfirmation({...booking,locationName:'Shinjuku',group_size:1});
  assert.match(shinjuku.text,/1 person/);
  assert.match(shinjuku.text,/Right below the cat board building/);
  assert.doesNotMatch(shinjuku.text,/Hachiko/);
});

test('different bookings stay separate even for the same customer and identical message bodies', () => {
  const first = renderBookingConfirmation(booking);
  const second = renderBookingConfirmation({...booking, id:'booking-2', reference:'SHN-SECOND'});
  assert.notEqual(first.subject, second.subject);
  assert.notEqual(first.headers['X-Entity-Ref-ID'], second.headers['X-Entity-Ref-ID']);
  assert.equal(first.html, second.html, 'identical guidance should not make different reservations share a conversation');
  for (const content of [first, second]) {
    assert.deepEqual(Object.keys(content.headers), ['X-Entity-Ref-ID']);
    assert.doesNotMatch(content.html, /<blockquote|gmail_quote|gmail_attr|In-Reply-To|References:/i);
    assert.match(content.text, /Looking forward to meeting you and creating amazing photos together!/);
    assert.match(content.text, /TikTok: @studio.on.snap/);
  }
  const retry = renderBookingConfirmation(booking);
  assert.equal(retry.subject, first.subject);
  assert.deepEqual(retry.headers, first.headers, 'retries must keep the same provider idempotency payload');
});

test('both existing Vercel sender formats produce exactly one mailbox', () => {
  assert.equal(normalizeResendSender('hello@example.com'),'Studio ON <hello@example.com>');
  assert.equal(normalizeResendSender('Studio ON <hello@example.com>'),'Studio ON <hello@example.com>');
  assert.equal(normalizeResendSender('"Studio ON <hello@example.com>"'),'Studio ON <hello@example.com>');
  for(const value of [undefined,'bad','x@example.com\r\nBcc: other@example.com','Studio <ON <x@example.com>>']) assert.throws(()=>normalizeResendSender(value));
});

function fixture(overrides={}) {
  const calls=[];
  const deps={
    claim:async()=>({id:'notification-1',token:'claim-1'}),
    send:async()=>{calls.push('send');return {ok:true,status:200,id:'receipt-1'};},
    sent:async()=>{calls.push('sent');},
    rejected:async()=>{calls.push('rejected');},
    uncertain:async()=>{calls.push('held');},
    ...overrides,
  };
  return {deps,calls};
}
test('an already claimed or sent reservation produces zero provider calls', async()=>{
  const {deps,calls}=fixture({claim:async()=>null});
  assert.equal(await deliverClaimedEmail(deps),'skipped');
  assert.deepEqual(calls,[]);
});
test('successful delivery stores its receipt',async()=>{
  const {deps,calls}=fixture();assert.equal(await deliverClaimedEmail(deps),'sent');assert.deepEqual(calls,['send','sent']);
});
test('timeouts and lost database receipts are held permanently, never marked retryable',async()=>{
  for(const overrides of [{send:async()=>{throw Error('connection lost');}},{sent:async()=>{throw Error('database unavailable');}}]){
    const {deps,calls}=fixture(overrides);await assert.rejects(deliverClaimedEmail(deps));assert.ok(calls.includes('held'));assert.ok(!calls.includes('rejected'));
  }
});
test('only explicit rejections can be retried; 5xx and malformed success remain held',async()=>{
  for(const [result,expected] of [[{ok:false,status:422},'rejected'],[{ok:false,status:500},'held'],[{ok:false,status:409},'held'],[{ok:true,status:200},'held']]){
    const {deps,calls}=fixture({send:async()=>result});await assert.rejects(deliverClaimedEmail(deps));assert.deepEqual(calls,[expected]);
  }
});
