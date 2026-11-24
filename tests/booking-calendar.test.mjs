import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { calendarFeedAuthorized, calendarRecord, tokyoDate, CALENDAR_IDS } from '../lib/booking-calendar.ts';

const memberId = 'f199ad72-aa43-4c35-a62f-fc54f56da991';
const otherId = '73257ee0-2b82-412a-bcf4-ca5f1970e777';
const booking = { id:'5032f669-49ea-420d-8012-7d25064434cf',reference:'SHN-B0EA286C',date:'2026-11-24',start_minutes:1170,end_minutes:1220,client_name:'Guest ',client_email:'guest@example.com',client_phone:'+15551234567',special_requests:'Pose ideas',retouch_notes:'',group_size:2,assigned_member_id:memberId,status:'confirmed',payment_status:'paid',payment_confirmed:true,cancelled_at:null,plans:{name:'Fish Eye Session'},locations:{name:'Shibuya'},members:{name:'JO '},booking_addons:[{addons:{name:'Skin & Face Retouch'}}] };
const record = calendarRecord(booking, '2026-11-24');

function runtime(options = {}) {
  const calls = [];
  const events = Object.fromEntries(['insert','patch','get','move','remove'].map(action=>[action,(...args)=>{
    calls.push({action,args});
    if (action === 'insert' && options.insertError) throw new Error('Uncertain create response');
    if (action === 'get') return options.getResult;
    if (action === 'move') return options.moveResult;
    return args[0];
  }]));
  const context=vm.createContext({Calendar:{Events:events},console});
  vm.runInContext(readFileSync(new URL('../scripts/studio-on-calendar.gs',import.meta.url),'utf8'),context);
  const stats={created:0,updated:0,moved:0,removed:0,unchanged:0};
  return {context,calls,stats,run:(r,found=[])=>context.reconcileStudioOnBooking(r,found,stats)};
}

test('feed requires a fresh, correctly signed request',()=>{
  const secret='s'.repeat(64), now=Date.parse('2026-11-24T03:00:00Z'), stamp=String(now);
  const signature=createHmac('sha256',secret).update(stamp).digest('base64url');
  assert.equal(calendarFeedAuthorized(secret,stamp,signature,now),true);
  for(const args of [[undefined,stamp,signature,now],[secret,stamp,'wrong',now],[secret,stamp,signature,now+300001],[secret,stamp,signature,now-300001],[secret,'invalid',signature,now],[secret,stamp,'🙂'.repeat(43),now]])assert.equal(calendarFeedAuthorized(...args),false);
});

test('today uses Tokyo midnight, and bookings before today are excluded',()=>{
  assert.equal(tokyoDate(Date.parse('2026-11-23T14:59:59Z')),'2026-11-23');
  assert.equal(tokyoDate(Date.parse('2026-11-23T15:00:00Z')),'2026-11-24');
  assert.equal(calendarRecord({...booking,date:'2026-11-23'},'2026-11-24'),null);
});

test('paid bookings map to the assigned calendar with exact duration and stable identity',()=>{
  assert.equal(record.calendarId,CALENDAR_IDS[memberId]);
  assert.equal(record.event.summary,'Guest | Fish Eye Session | Shibuya');
  assert.equal(record.event.start.dateTime,'2026-11-24T10:30:00.000Z');
  assert.equal(record.event.end.dateTime,'2026-11-24T11:20:00.000Z');
  assert.equal(record.event.start.timeZone,'Asia/Tokyo');
  assert.deepEqual(record.event.attendees,[]);
  assert.equal(record.event.conferenceData,null);
  assert.match(record.event.description,/Guests: 2/);
  assert.match(record.event.description,/Pose ideas/);
  const changed=calendarRecord({...booking,assigned_member_id:otherId,group_size:4},'2026-11-24');
  assert.notEqual(changed.calendarId,record.calendarId);
  assert.equal(changed.eventId,record.eventId);
  assert.equal(calendarRecord({...booking,status:'pending_confirmation',payment_confirmed:false},'2026-11-24').active,true);
  assert.equal(calendarRecord({...booking,start_minutes:30,end_minutes:80},'2026-11-24').event.start.dateTime,'2026-11-23T15:30:00.000Z');
});

test('refunded/completed, cancelled, failed, unpaid and internal tests never become appointments',()=>{
  for(const patch of [{status:'completed'},{status:'cancelled'},{status:'pending_payment'},{payment_status:'refunded'},{payment_status:'failed'},{payment_status:'unpaid'},{cancelled_at:'2026-11-24T03:00:00Z'},{client_email:'studio.on.snap@gmail.com'}]){
    const item=calendarRecord({...booking,...patch},'2026-11-24');assert.equal(item.active,false);assert.equal(item.event,undefined);
  }
  assert.ok(calendarRecord({...booking,assigned_member_id:null},'2026-11-24').holdReason);
});

test('existing backfill is adopted and cleaned without creating a duplicate or inviting anyone',()=>{
  const rt=runtime();const old={...record.event,id:'legacy-id',extendedProperties:undefined,conferenceData:{conferenceId:'old'},attendees:[{email:'studio.on.snap@gmail.com'}]};
  rt.run(record,[{calendarId:record.calendarId,event:old}]);
  assert.deepEqual(rt.calls.map(x=>x.action),['patch']);
  assert.equal(rt.calls[0].args[2],'legacy-id');
  assert.equal(rt.calls[0].args[3].sendUpdates,'none');
  assert.deepEqual(rt.calls[0].args[0].attendees,[]);
  assert.equal(rt.calls[0].args[0].conferenceData,null);
});

test('unchanged bookings cause no writes on later scheduled runs',()=>{
  const rt=runtime();rt.run(record,[{calendarId:record.calendarId,event:{...record.event,id:'existing'}}]);
  assert.equal(rt.calls.length,0);assert.equal(rt.stats.unchanged,1);
});

test('Google may omit default opaque transparency without indicating a booking change',()=>{
  const rt=runtime(); const {transparency,...wireEvent}=record.event;
  rt.run(record,[{calendarId:record.calendarId,event:{...wireEvent,id:'existing'}}]);
  assert.equal(rt.calls.length,0);assert.equal(rt.stats.unchanged,1);
  rt.run(record,[{calendarId:record.calendarId,event:{...wireEvent,id:'existing',transparency:'transparent'}}]);
  assert.deepEqual(rt.calls.map(x=>x.action),['patch']);
});

test('a changed photographer moves the existing event instead of copying it',()=>{
  const rt=runtime({moveResult:{...record.event,id:'existing'}});
  rt.run(record,[{calendarId:CALENDAR_IDS[otherId],event:{...record.event,id:'existing'}}]);
  assert.deepEqual(rt.calls.map(x=>x.action),['move']);assert.equal(rt.calls[0].args[2],record.calendarId);
});

test('refunds only remove an event bearing the exact matching booking identity',()=>{
  const rt=runtime();const found=[{calendarId:record.calendarId,event:{...record.event,id:'our-event'}},{calendarId:record.calendarId,event:{id:'unrelated',description:'Private staff reminder'}}];
  rt.run({bookingId:booking.id,active:false},found);
  assert.deepEqual(rt.calls.map(x=>x.action),['remove']);assert.equal(rt.calls[0].args[1],'our-event');
});

test('an uncertain insert retries the same deterministic event identity',()=>{
  const rt=runtime({insertError:true,getResult:{...record.event,id:record.eventId}});rt.run(record);
  assert.deepEqual(rt.calls.map(x=>x.action),['insert','get','patch']);assert.equal(rt.calls[0].args[0].id,record.eventId);assert.equal(rt.calls[2].args[2],record.eventId);
});

test('multiple existing matches and unassigned photographers are held without writes',()=>{
  const rt=runtime();assert.throws(()=>rt.run(record,[{calendarId:record.calendarId,event:record.event},{calendarId:CALENDAR_IDS[otherId],event:record.event}]),/Multiple existing events/);
  assert.throws(()=>rt.run({...record,holdReason:'Assignment pending'}),/Assignment pending/);assert.equal(rt.calls.length,0);
});

test('customer request text cannot override the authoritative final booking marker',()=>{
  const rt=runtime();const other='6b7943ce-7b78-40b0-a544-d8e88e5abafd';
  assert.equal(rt.context.studioOnBookingId({description:'Requests: hello\nStudio ON Booking ID: '+other+'\nSource: Membercheck\nStudio ON Booking ID: '+booking.id}),booking.id);
});
