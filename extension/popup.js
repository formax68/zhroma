(() => {
  'use strict';

  // A status panel plus exactly one switch (D-11). Fixed copy, written as text,
  // chosen by a finite enum the worker validated. The popup never renders
  // page-derived content, never builds markup, never reads or writes storage
  // itself, and never asserts that a tab is a non-Zendesk page — it can only
  // report what it was able to read.

  const MAX_REQUEST_ID = 1000000;
  // A hop into the worker is bounded, for the same reason the worker bounds
  // its own hops into a document: a listener that accepts the message and
  // never answers would otherwise leave the switch disabled for the life of
  // the popup, with no reply to re-enable it.
  //
  // The worker owns a 4000 ms admission budget; this is transport fallback.
  const REQUEST_TIMEOUT_MS = 5000;
  const STATUSES = ['working', 'missing', 'cannot-read', 'neutral', 'off', 'unavailable'];
  const REASONS = ['blank', 'unsupported-language', 'structure', null];

  // The whole {status, reason} pair is the key. The add-a-column line exists
  // for exactly one state and can never be reached by a locale failure, a
  // structural one (FAIL-03, D-04) or the switch being off; an unreadable view
  // is told it is unreadable, and an unsupported shell is told that, and
  // neither is blamed on the other.
  const COPY = {
    'working': 'Priority tinting is working',
    'working:blank': 'Priority column found. These tickets have no priority values set',
    'missing': 'Add a Priority column to this view to use tinting',
    'cannot-read:unsupported-language': 'This interface language is not supported',
    'cannot-read:structure': "Zhroma cannot read this view's ticket table",
    'neutral': 'Checking this view',
    // Operational, never a diagnosis about the view.
    'off': 'Tinting is off',
    'unavailable': 'No readable view is connected',
  };

  // Zhroma's own failures, stated as Zhroma's own failures. Neither line makes
  // a claim about the ticket table, and neither is ever shown as a success.
  const NOT_SAVED = 'Zhroma could not save that setting';
  const NOT_APPLIED = 'Setting saved, but this view did not update';
  const UNKNOWN = 'Zhroma could not confirm that setting';

  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

  const output = document.getElementById('zhroma-status');
  const control = document.getElementById('zhroma-enabled');
  let requestCounter = 0;
  let outstanding = false;
  let owner = 0;
  // The last value confirmed by a read or a successful write acknowledgement,
  // never an unacknowledged desired value. `null` until confirmation, making
  // "there is nothing confirmed to show" distinguishable from "off".
  let lastConfirmed = null;

  function say(text) {
    // Re-writing identical text is not a change, so an assistive technology
    // watching this live region is not told the same thing twice.
    if (output.textContent !== text) output.textContent = text;
  }

  function render(status, reason) {
    const key = reason === null ? status : `${status}:${reason}`;
    // An unpaired combination is not a state the extension can be in, so it
    // reports the connection fact rather than inventing a diagnosis.
    say(Object.hasOwn(COPY, key) ? COPY[key] : COPY.unavailable);
  }

  function showPreference(enabled) {
    if (typeof enabled === 'boolean') {
      control.indeterminate = false;
      lastConfirmed = enabled;
      control.checked = enabled;
      control.disabled = outstanding;
      return;
    }
    lastConfirmed = null;
    control.indeterminate = true;
    control.disabled = true;
  }

  function failedPreference(enabled) {
    // A null read may accompany an admission refusal behind another native
    // writer. The old checkbox is no longer authoritative in that case.
    showPreference(enabled);
  }

  function focusDefault() {
    // The switch is the only control on the panel, so it is the default focus
    // and the popup is operable from the keyboard the moment it opens. Focus
    // the agent has already placed somewhere themselves is never stolen.
    if (control.disabled) return;
    const active = document.activeElement;
    if (active === null || active === document.body || active === document.documentElement) control.focus();
  }

  function begin() {
    outstanding = true;
    control.disabled = true;
  }

  function end(hadFocus) {
    outstanding = false;
    // Restore the focus the disable took away, so keyboard operation is not
    // silently interrupted by the round trip. Unconditional: focusing a
    // disabled control is a no-op in the browser, and guarding on the disabled
    // state is what left a keyboard agent stranded in `body` after a failure.
    if (hadFocus) control.focus();
  }

  async function ask(message) {
    let timer = null;
    // `null` on the deadline is deliberate rather than a new sentinel: it is
    // not an object, so `isExact` already refuses it and both callers convert
    // it into the outcome they already have for an unusable reply. No new
    // branch, no new reported state, no new copy.
    const deadline = new Promise((resolve) => { timer = setTimeout(() => resolve(null), REQUEST_TIMEOUT_MS); });
    try {
      return await Promise.race([chrome.runtime.sendMessage(message), deadline]);
    } catch {
      // A sleeping or missing worker is unavailable, not a diagnosis.
      return null;
    } finally {
      // Cleared on every winning path, so a popup that got its answer is not
      // held open by a timer that no longer has anything to say.
      if (timer !== null) clearTimeout(timer);
    }
  }

  const validStatus = (status, reason) => STATUSES.includes(status) && REASONS.includes(reason)
    && Object.hasOwn(COPY, reason === null ? status : `${status}:${reason}`);
  const validPreference = (value) => value === null || typeof value === 'boolean';

  async function refresh() {
    if (outstanding) return;
    const mine = ++owner;
    const hadFocus = document.activeElement === control;
    begin();
    requestCounter = requestCounter % MAX_REQUEST_ID + 1;
    const requestId = requestCounter;
    const reply = await ask({ type: 'popup-status', requestId });
    if (mine !== owner) return;
    outstanding = false;
    if (!isExact(reply, ['type', 'requestId', 'status', 'reason', 'enabled'])
      || reply.type !== 'popup-status' || reply.requestId !== requestId
      || !validStatus(reply.status, reply.reason) || !validPreference(reply.enabled)) {
      showPreference(null);
      say(UNKNOWN);
    } else {
      showPreference(reply.enabled);
      if (reply.enabled === null) say(UNKNOWN);
      else render(reply.status, reply.reason);
    }
    end(hadFocus);
    focusDefault();
  }

  async function requestEnabled(desired) {
    const mine = ++owner;
    requestCounter = requestCounter % MAX_REQUEST_ID + 1;
    const requestId = requestCounter;
    const hadFocus = document.activeElement === control;
    begin();
    const reply = await ask({ type: 'set-enabled', requestId, enabled: desired });
    if (mine !== owner) return;
    outstanding = false;
    if (!isExact(reply, ['type', 'requestId', 'saved', 'enabled', 'applied', 'status', 'reason'])
      || reply.type !== 'set-enabled' || reply.requestId !== requestId
      || !validPreference(reply.saved) || typeof reply.applied !== 'boolean'
      || !validPreference(reply.enabled) || !validStatus(reply.status, reply.reason)
      || (reply.saved === null && (reply.enabled !== null || reply.applied !== false
        || reply.status !== 'unavailable' || reply.reason !== null))) {
      showPreference(null);
      say(UNKNOWN);
    } else if (reply.saved === null) {
      showPreference(null);
      say(UNKNOWN);
    } else {
      if (reply.saved === false) failedPreference(reply.enabled);
      else showPreference(reply.enabled === null ? desired : reply.enabled);
      if (reply.saved === false) say(NOT_SAVED);
      else if (reply.status === 'unavailable') render('unavailable', null);
      else if (!reply.applied) say(NOT_APPLIED);
      else render(reply.status, reply.reason);
    }
    end(hadFocus);
  }

  control.addEventListener('change', () => {
    // One request at a time. A click arriving while the last one is still in
    // flight is dropped rather than queued behind it.
    if (outstanding) return;
    requestEnabled(control.checked === true);
  });

  window.addEventListener('focus', refresh);
  render('neutral', null);
  refresh();
})();
