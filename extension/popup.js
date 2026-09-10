(() => {
  'use strict';

  // A status panel. Fixed copy, written as text, chosen by a finite enum the
  // worker validated. The popup never renders page-derived content, never
  // builds markup, and never asserts that a tab is a non-Zendesk page — it can
  // only report what it was able to read.

  const MAX_REQUEST_ID = 1000000;
  const STATUSES = ['working', 'neutral', 'unavailable'];
  const REASONS = ['blank', null];

  const COPY = {
    'working': 'Priority tinting is working',
    'working:blank': 'Priority column found. These tickets have no priority values set',
    'neutral': 'Checking this view',
    'unavailable': 'No readable view is connected',
  };

  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));

  const output = document.getElementById('zhroma-status');
  let requestCounter = 0;

  function render(status, reason) {
    const key = reason === null ? status : `${status}:${reason}`;
    output.textContent = COPY[key] ?? COPY[status] ?? COPY.unavailable;
  }

  async function refresh() {
    requestCounter = requestCounter % MAX_REQUEST_ID + 1;
    const requestId = requestCounter;
    let reply;
    try {
      reply = await chrome.runtime.sendMessage({ type: 'popup-status', requestId });
    } catch {
      // A sleeping or missing worker is unavailable, not a diagnosis.
      render('unavailable', null);
      return;
    }
    if (!isExact(reply, ['type', 'requestId', 'status', 'reason'])
      || reply.type !== 'popup-status' || reply.requestId !== requestId
      || !STATUSES.includes(reply.status) || !REASONS.includes(reply.reason)) {
      render('unavailable', null);
      return;
    }
    render(reply.status, reply.reason);
  }

  render('neutral', null);
  refresh();
})();
