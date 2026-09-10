(() => {
  'use strict';

  // A status panel plus exactly one switch (D-11). Fixed copy, written as text,
  // chosen by a finite enum the worker validated. The popup never renders
  // page-derived content, never builds markup, never reads or writes storage
  // itself, and never asserts that a tab is a non-Zendesk page — it can only
  // report what it was able to read.

  const MAX_REQUEST_ID = 1000000;
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

  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

  const output = document.getElementById('zhroma-status');
  const control = document.getElementById('zhroma-enabled');
  let requestCounter = 0;
  let outstanding = false;
  // The last value STORAGE reported back, never a value anyone hoped for.
  // `null` until a reply has actually delivered a boolean, which is what makes
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
      lastConfirmed = enabled;
      control.checked = enabled;
      control.disabled = outstanding;
      return;
    }
    // Nothing read the preference back. The `change` has already moved the
    // control to the desired value, so leaving it alone would display a
    // position nothing confirmed next to copy saying the save failed. Return
    // it to the last value storage did confirm, and leave it operable so a
    // retry is possible without reopening the panel.
    if (typeof lastConfirmed === 'boolean') {
      control.checked = lastConfirmed;
      control.disabled = false;
      return;
    }
    // Nothing has ever been confirmed, so there is genuinely no position to
    // show: leave the control where it is and take it out of service rather
    // than moving it to a value nobody has confirmed. `defaultChecked` is not
    // that value — the checkbox ships unchecked, so reverting to it after a
    // failed attempt to turn tinting ON would display an unconfirmed OFF.
    control.disabled = true;
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
    try {
      return await chrome.runtime.sendMessage(message);
    } catch {
      // A sleeping or missing worker is unavailable, not a diagnosis.
      return null;
    }
  }

  const validStatus = (status, reason) => STATUSES.includes(status) && REASONS.includes(reason);
  const validPreference = (value) => value === null || typeof value === 'boolean';

  async function refresh() {
    requestCounter = requestCounter % MAX_REQUEST_ID + 1;
    const requestId = requestCounter;
    const reply = await ask({ type: 'popup-status', requestId });
    if (!isExact(reply, ['type', 'requestId', 'status', 'reason', 'enabled'])
      || reply.type !== 'popup-status' || reply.requestId !== requestId
      || !validStatus(reply.status, reply.reason) || !validPreference(reply.enabled)) {
      render('unavailable', null);
      showPreference(null);
      return;
    }
    showPreference(reply.enabled);
    render(reply.status, reply.reason);
    focusDefault();
  }

  async function requestEnabled(desired) {
    requestCounter = requestCounter % MAX_REQUEST_ID + 1;
    const requestId = requestCounter;
    const hadFocus = document.activeElement === control;
    begin();
    // The desired value is sent outright. Never "invert whatever the control
    // last showed": a stale reading would flip the agent's intent.
    const reply = await ask({ type: 'set-enabled', requestId, enabled: desired });
    if (!isExact(reply, ['type', 'requestId', 'saved', 'enabled', 'applied', 'status', 'reason'])
      || reply.type !== 'set-enabled' || reply.requestId !== requestId
      || typeof reply.saved !== 'boolean' || typeof reply.applied !== 'boolean'
      || !validPreference(reply.enabled) || !validStatus(reply.status, reply.reason)) {
      // Nothing legible came back, so nothing may be claimed in either
      // direction: the preference is unknown and the page state is unknown.
      // The request is released BEFORE the revert, so the control the revert
      // re-enables is not disabled again by `control.disabled = outstanding`.
      outstanding = false;
      showPreference(null);
      say(NOT_SAVED);
      end(hadFocus);
      return;
    }
    outstanding = false;
    showPreference(reply.enabled);
    // Three separate facts, reported separately. Persistence is not
    // application, and a connection failure is neither.
    if (!reply.saved || reply.enabled === null) say(NOT_SAVED);
    else if (reply.status === 'unavailable') render('unavailable', null);
    else if (!reply.applied) say(NOT_APPLIED);
    else render(reply.status, reply.reason);
    end(hadFocus);
  }

  control.addEventListener('change', () => {
    // One request at a time. A click arriving while the last one is still in
    // flight is dropped rather than queued behind it.
    if (outstanding) return;
    requestEnabled(control.checked === true);
  });

  render('neutral', null);
  refresh();
})();
