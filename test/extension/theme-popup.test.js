// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { CONTENT_URL, DOCUMENT_ID, EXTENSION_ID, POPUP_URL, TAB_ID, bootAll, closeWindows, createWorld, loadContent, loadPopup, loadWorker, optionsSender, settle, statusText } from './tracer-world.js';

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });
const sender = { id: EXTENSION_ID, url: POPUP_URL };
const selected = popup => popup.document.querySelector('input[name="zhroma-theme"]:checked')?.value;
const themeText = popup => popup.document.getElementById('zhroma-theme-status').textContent;
const reads = world => world.traffic.filter(entry => entry.direction === 'to-worker' && entry.payload.type === 'get-theme').length;
async function choose(popup, id = 'zhroma-catppuccin') {
  const radio = popup.document.querySelector(`input[value="${id}"]`);
  radio.checked = true;
  radio.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await settle(); await settle();
}
async function timedBoot() {
  vi.useFakeTimers();
  const world = createWorld({ portCloseMs: 20000 }); loadWorker(world); loadContent(world);
  await vi.advanceTimersByTimeAsync(150);
  const popup = loadPopup(world); await vi.advanceTimersByTimeAsync(150);
  return { world, popup };
}

test('uncertain native writer stays unconfirmed until explicit Check theme after landing', async () => {
  const { world, popup } = await timedBoot();
  const before = reads(world); world.setWriteMode('deferred');
  const radio = popup.document.querySelector('input[value="zhroma-catppuccin"]');
  radio.checked = true; radio.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await vi.advanceTimersByTimeAsync(4100);
  expect(themeText(popup)).toBe('Theme could not be confirmed');
  expect(selected(popup)).toBe('zhroma-classic');
  expect(reads(world) - before).toBe(1);
  const check = popup.document.getElementById('zhroma-check-theme');
  expect(check?.hidden).toBe(false);
  await vi.advanceTimersByTimeAsync(10000);
  expect(reads(world) - before).toBe(1);
  world.flushWrites(); await vi.advanceTimersByTimeAsync(150);
  expect(themeText(popup)).toBe('Theme could not be confirmed');
  check.click(); await vi.advanceTimersByTimeAsync(150);
  expect(selected(popup)).toBe('zhroma-catppuccin');
  expect(check.hidden).toBe(true);
  expect(world.writeLog).toHaveLength(1);
});

for (const raw of [null, { v: 99, id: 'future' }, { v: 1, id: 'unknown' }, { v: 1, id: 'x'.repeat(10000) }, 'malformed']) {
  test(`corrupt ${JSON.stringify(raw).slice(0, 45)} preserves bytes and separates fallback from Priority`, async () => {
    const { world, popup } = await bootAll({ stored: { theme: raw } });
    expect(selected(popup)).toBe('zhroma-classic');
    expect(themeText(popup)).toBe('Your saved theme could not be read. Using Classic.');
    expect(statusText(popup.document)).toBe('Priority tinting is working');
    await choose(popup, 'zhroma-classic');
    expect(world.getStored('theme')).toEqual(raw); expect(world.writeLog).toEqual([]);
    expect(world.forbidden).toEqual([]);
  });
}

test('absent theme is silent; pending and failed saves retain confirmed checked state and keyboard focus', async () => {
  const { world, popup } = await bootAll();
  expect(themeText(popup)).toBe('');
  world.setWriteMode('deferred');
  const radio = popup.document.querySelector('input[value="zhroma-catppuccin"]'); radio.focus();
  await choose(popup);
  expect(selected(popup)).toBe('zhroma-classic');
  expect(themeText(popup)).toBe('Saving theme');
  await choose(popup, 'zhroma-nord');
  expect(world.pendingWriteCount()).toBe(1);
  world.flushWrites(); await settle(); await settle();
  expect(selected(popup)).toBe('zhroma-catppuccin');
  expect(popup.document.activeElement).toBe(radio);
  world.setWriteMode('rejected'); await choose(popup, 'zhroma-nord');
  expect(selected(popup)).toBe('zhroma-catppuccin');
  expect(themeText(popup)).toBe('Theme could not be saved. Try again.');
  expect(statusText(popup.document)).toBe('Priority tinting is working');
});

for (const invalid of [null, { type: 'set-setting', requestId: 0, outcome: 'saved', revision: null },
  { type: 'set-setting', outcome: 'saved', revision: null, extra: true },
  { type: 'set-setting', outcome: 'saved', revision: 1 }, { type: 'set-setting', outcome: 'unknown', revision: null }]) {
  test(`malformed or unknown ACK ${JSON.stringify(invalid)} gets exactly one readback`, async () => {
    const { world, popup } = await bootAll(); const send = world.popupChrome.runtime.sendMessage.bind(world.popupChrome.runtime);
    vi.spyOn(world.popupChrome.runtime, 'sendMessage').mockImplementation(message => {
      if (message.type === 'set-setting') return Promise.resolve(invalid && { requestId: message.requestId, ...invalid });
      return send(message);
    });
    const before = reads(world); await choose(popup);
    expect(reads(world) - before).toBe(1);
    expect(selected(popup)).toBe('zhroma-classic');
    expect(themeText(popup)).not.toMatch(/saved|applied/i);
    expect(world.writeLog).toEqual([]);
  });
}

test('failed initial read confirms no selection and permits a later explicit choice', async () => {
  const world = createWorld({ settingsReadMode: 'rejected' }); loadWorker(world); const popup = loadPopup(world);
  await settle(); await settle();
  expect(selected(popup)).toBeUndefined(); expect(themeText(popup)).toBe('Theme could not be confirmed');
  expect(popup.document.getElementById('zhroma-check-theme')?.hidden).toBe(false);
  expect([...popup.document.querySelectorAll('input[name="zhroma-theme"]')].every(r => !r.disabled)).toBe(true);
  world.setSettingsReadMode('immediate'); await choose(popup);
  expect(selected(popup)).toBe('zhroma-catppuccin');
});

test('timeout before write issuance performs no late replay and settled readback resolves current storage', async () => {
  const { world, popup } = await timedBoot(); world.setSettingsReadMode('deferred', 'worker');
  const radio = popup.document.querySelector('input[value="zhroma-catppuccin"]');
  radio.checked = true; radio.dispatchEvent(new popup.window.Event('change', { bubbles: true }));
  await vi.advanceTimersByTimeAsync(4100);
  world.setSettingsReadMode('immediate', 'worker'); world.flushSettingsReads(); await vi.advanceTimersByTimeAsync(150);
  expect(world.writeLog).toEqual([]); expect(selected(popup)).toBe('zhroma-classic');
  expect(themeText(popup)).toBe('Theme could not be saved. Try again.');
});

test('held old popup response cannot replace a newer explicit confirmed choice', async () => {
  const { world, popup } = await timedBoot(); world.hold('popup-response');
  popup.window.dispatchEvent(new popup.window.Event('focus')); await vi.advanceTimersByTimeAsync(5100);
  world.unhold('popup-response');
  const radio = popup.document.querySelector('input[value="zhroma-nord"]'); radio.checked = true;
  radio.dispatchEvent(new popup.window.Event('change', { bubbles: true })); await vi.advanceTimersByTimeAsync(150);
  expect(selected(popup)).toBe('zhroma-nord'); expect(themeText(popup)).toBe('Theme saved');
  world.release('popup-response'); await vi.advanceTimersByTimeAsync(150);
  expect(selected(popup)).toBe('zhroma-nord'); expect(themeText(popup)).toBe('Theme saved');
});

test('off and disconnected save persists across popup, worker and content restart without applied claim', async () => {
  const { world, popup } = await bootAll({ stored: { enabled: false } });
  world.disconnectContent(); await choose(popup, 'zhroma-nord');
  expect(world.getStored('enabled')).toBe(false); expect(themeText(popup)).toBe('Theme saved');
  expect(statusText(popup.document)).toBe('Tinting is off');
  world.terminateWorker(); loadWorker(world); loadContent(world);
  const reopened = loadPopup(world); await settle(); await settle();
  expect(selected(reopened)).toBe('zhroma-nord'); expect(world.writeLog).toHaveLength(1);
  expect(world.forbidden).toEqual([]);
});

test('sender and exact request refusals cannot read or write settings; unknown ID is rejected', async () => {
  const world = createWorld(); loadWorker(world);
  const contentSender = { id: EXTENSION_ID, url: CONTENT_URL, frameId: 0, documentId: DOCUMENT_ID, tab: { id: TAB_ID } };
  for (const refused of [contentSender, optionsSender(), { ...sender, id: 'forged' }, { ...sender, url: `${POPUP_URL}?forged` }, { ...sender, tab: { id: TAB_ID } }]) {
    expect(await world.sendToWorker({ type: 'get-theme', requestId: 30 }, refused)).toBeInstanceOf(Error);
  }
  for (const message of [{ type: 'get-theme', requestId: 31, extra: true }, { type: 'get-theme', requestId: 1000001 },
    { type: 'set-setting', requestId: 32, key: 'theme', value: 'zhroma-nord', revision: 0 },
    { type: 'set-setting', requestId: 33, key: 'theme', value: 'zhroma-nord', extra: true }]) {
    expect(await world.sendToWorker(message, sender)).toBeInstanceOf(Error);
  }
  expect(await world.sendToWorker({ type: 'set-setting', requestId: 34, key: 'theme', value: 'unknown' }, contentSender)).toBeInstanceOf(Error);
  expect(world.settingsReadCount('worker')).toBe(0); expect(world.writeLog).toEqual([]);
  expect(await world.sendToWorker({ type: 'set-setting', requestId: 35, key: 'theme', value: 'unknown' }, sender))
    .toEqual({ type: 'set-setting', requestId: 35, outcome: 'rejected', revision: null });
  expect(world.settingsReadCount('worker')).toBe(0); expect(world.writeLog).toEqual([]);
});

for (const payload of [{ confirmed: false, value: 'zhroma-classic', status: null },
  { confirmed: true, value: 'unknown', status: 'stored' }, { confirmed: true, value: 'zhroma-nord', status: 'default' },
  { confirmed: true, value: 'zhroma-classic', status: 'missing' }, { confirmed: true, value: 'zhroma-classic', status: 'stored', extra: true },
  { confirmed: true, value: 'zhroma-classic', status: 'stored', requestId: 0 }]) {
  test(`malformed read reply ${JSON.stringify(payload)} never fabricates a saved selection`, async () => {
    const world = createWorld(); loadWorker(world);
    const send = world.popupChrome.runtime.sendMessage.bind(world.popupChrome.runtime);
    vi.spyOn(world.popupChrome.runtime, 'sendMessage').mockImplementation(message => message.type === 'get-theme'
      ? Promise.resolve({ type: 'get-theme', requestId: message.requestId, ...payload }) : send(message));
    const popup = loadPopup(world); await settle(); await settle();
    expect(selected(popup)).toBeUndefined(); expect(themeText(popup)).toBe('Theme could not be confirmed');
    expect(world.writeLog).toEqual([]);
  });
}

test('disconnected enabled view can save a theme while retaining connection copy', async () => {
  const world = createWorld(); loadWorker(world); const popup = loadPopup(world); await settle(); await settle();
  expect(statusText(popup.document)).toBe('No readable view is connected');
  await choose(popup, 'zhroma-nord');
  expect(statusText(popup.document)).toBe('No readable view is connected');
  expect(themeText(popup)).toBe('Theme saved'); expect(world.getStored('enabled')).toBeUndefined();
});
