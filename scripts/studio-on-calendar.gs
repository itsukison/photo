// Private Google Apps Script, owned by studio.on.snap@gmail.com.
// Enable the Calendar v3 advanced service and set the SYNC_SECRET script
// property before running installStudioOnSync once. No web app is published.
const STUDIO_ON_CALENDARS = [
  '5a9af2029d9acf9f924d57237228993a4cd22f10f909e74e26a0488bac93158e@group.calendar.google.com',
  'ab20356bdd04b3ac14b987dec1b69808c612a2635ee9980a71794fbf8ea08173@group.calendar.google.com',
];

function installStudioOnSync() {
  if (Session.getEffectiveUser().getEmail().toLowerCase() !== 'studio.on.snap@gmail.com') throw new Error('Use the Studio ON Google account.');
  syncStudioOn();
  const existing = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'syncStudioOn');
  if (!existing.length) ScriptApp.newTrigger('syncStudioOn').timeBased().everyMinutes(5).create();
  for (const duplicate of existing.slice(1)) ScriptApp.deleteTrigger(duplicate);
  console.log('Studio ON calendar sync is installed: every 5 minutes.');
}

function syncStudioOn() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const secret = PropertiesService.getScriptProperties().getProperty('SYNC_SECRET');
    if (!secret || secret.length < 32) throw new Error('Set the dedicated SYNC_SECRET property first.');
    const timestamp = String(Date.now());
    const signature = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(timestamp, secret)).replace(/=+$/, '');
    const response = UrlFetchApp.fetch('https://www.studio-on.org/api/internal/booking-calendar', {
      method: 'get', followRedirects: false, muteHttpExceptions: true,
      headers: { 'X-Studio-On-Timestamp': timestamp, 'X-Studio-On-Signature': signature },
    });
    if (response.getResponseCode() !== 200) throw new Error('Booking feed returned HTTP ' + response.getResponseCode());
    const feed = JSON.parse(response.getContentText());
    if (feed.version !== 'studio-on-calendar-v1' || !/^\d{4}-\d{2}-\d{2}$/.test(feed.today) || !Array.isArray(feed.bookings)) throw new Error('Unexpected booking feed.');
    const ids = new Set();
    for (const record of feed.bookings) {
      if (!/^[0-9a-f-]{36}$/i.test(record.bookingId) || ids.has(record.bookingId)) throw new Error('Invalid or repeated booking identity.');
      ids.add(record.bookingId);
      if (record.active && !record.holdReason && (!STUDIO_ON_CALENDARS.includes(record.calendarId) || !record.event || record.eventId !== 'son' + record.bookingId.replace(/-/g, '').toLowerCase() || Date.parse(record.event.start.dateTime) < Date.parse(feed.today + 'T00:00:00+09:00'))) throw new Error('Invalid calendar record.');
    }
    // Read both complete calendar snapshots before mutating anything. Adopt the
    // existing backfill by its exact booking marker instead of adding a copy.
    const events = [];
    for (const calendarId of STUDIO_ON_CALENDARS) {
      let pageToken;
      do {
        const page = Calendar.Events.list(calendarId, { timeMin: feed.today + 'T00:00:00+09:00', singleEvents: true, showDeleted: false, maxResults: 2500, pageToken: pageToken });
        for (const event of page.items || []) events.push({ calendarId: calendarId, event: event });
        pageToken = page.nextPageToken;
      } while (pageToken);
    }
    const stats = { created: 0, updated: 0, moved: 0, removed: 0, unchanged: 0 };
    const errors = [];
    for (const record of feed.bookings) {
      try { reconcileStudioOnBooking(record, events, stats); }
      catch (error) { errors.push(record.reference + ': ' + String(error.message || error)); }
    }
    PropertiesService.getScriptProperties().setProperty('LAST_RUN', JSON.stringify({ at: new Date().toISOString(), stats: stats, errors: errors }));
    console.log(JSON.stringify(stats));
    if (errors.length) throw new Error(errors.join('\n'));
  } finally { lock.releaseLock(); }
}

function studioOnBookingId(event) {
  const privateId = event.extendedProperties && event.extendedProperties.private && event.extendedProperties.private.studio_on_booking_id;
  if (privateId) return privateId;
  const match = String(event.description || '').match(/(?:^|\n)Studio ON Booking ID: ([0-9a-f-]{36})\s*$/i);
  return match ? match[1] : null;
}

function studioOnEventMatches(event, wanted) {
  // Google may omit the default opaque value from its response.
  return ['summary', 'description', 'location'].every(k => event[k] === wanted[k]) &&
    (event.transparency || 'opaque') === wanted.transparency &&
    Date.parse(event.start.dateTime) === Date.parse(wanted.start.dateTime) && Date.parse(event.end.dateTime) === Date.parse(wanted.end.dateTime) &&
    !(event.attendees || []).length && !event.conferenceData && !event.hangoutLink &&
    studioOnBookingId(event) === wanted.extendedProperties.private.studio_on_booking_id &&
    event.extendedProperties && event.extendedProperties.private && event.extendedProperties.private.studio_on_sync === 'v1';
}

function reconcileStudioOnBooking(record, events, stats) {
  if (record.holdReason) throw new Error(record.holdReason);
  const found = events.filter(x => studioOnBookingId(x.event) === record.bookingId);
  if (found.length > 1) throw new Error('Multiple existing events require review; no new event was created.');
  let existing = found[0];
  if (!record.active) {
    // The feed includes cancellation/refund tombstones, never raw payment events.
    if (existing) { Calendar.Events.remove(existing.calendarId, existing.event.id, { sendUpdates: 'none' }); stats.removed++; }
    return;
  }
  if (existing && existing.calendarId !== record.calendarId) {
    existing.event = Calendar.Events.move(existing.calendarId, existing.event.id, record.calendarId, { sendUpdates: 'none' });
    existing.calendarId = record.calendarId;
    stats.moved++;
  }
  if (existing) {
    if (studioOnEventMatches(existing.event, record.event)) { stats.unchanged++; return; }
    Calendar.Events.patch(record.event, record.calendarId, existing.event.id, { sendUpdates: 'none', conferenceDataVersion: 1 });
    stats.updated++;
    return;
  }
  try {
    Calendar.Events.insert(Object.assign({ id: record.eventId }, record.event), record.calendarId, { sendUpdates: 'none', conferenceDataVersion: 1 });
    stats.created++;
  } catch (error) {
    // A deterministic Calendar event ID makes an uncertain create safe to retry.
    // Reconcile a real existing event; never generate a new/random ID on retry.
    let previous;
    try { previous = Calendar.Events.get(record.calendarId, record.eventId); }
    catch (_) { throw error; }
    if (previous.status !== 'cancelled' && studioOnBookingId(previous) !== record.bookingId) throw error;
    Calendar.Events.patch(Object.assign({ status: 'confirmed' }, record.event), record.calendarId, record.eventId, { sendUpdates: 'none', conferenceDataVersion: 1 });
    stats.updated++;
  }
}
