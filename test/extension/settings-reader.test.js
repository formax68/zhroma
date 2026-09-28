// @vitest-environment node
//
// The content-script settings reader and the settingsReady gate (07-06, D-09,
// D-13, D-14).
//
// The content script reads the registry keys once at startup, alongside and
// separately from the `enabled` read. Priority tinting waits for that read to
// settle, success or failure, and never longer than SETTINGS_READ_TIMEOUT_MS.
// Any failure means every setting is its default, so the page paints exactly
// as 0.1.0 does. Settings never leave the isolated world that read them
// (DATA-01), and the `enabled` path keeps its v1 behaviour (D-02).
//
// Two doubles drive the shipped bytes: the strict Chrome harness (fake timers,
// one FIFO) for the time bound and the failure shapes, and the tracer world
// (three real contexts) for the gate, the off switch and the round trips.
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, expect, test, vi } from 'vitest';
import { SETTINGS_CONTRACT, createChromeHarness } from './chrome-harness.js';
import {
  COPY, EXTENSION_ID, ICON, POPUP_URL, TAB_ID, closeWindows, createWorld, loadContent, loadPopup, loadWorker, markers, settle,
  statusText, wait,
} from './tracer-world.js';

const windows = [];
const asset = (name) => readFileSync(new URL(`../../extension/${name}`, import.meta.url), 'utf8');
const fixture = (name = 'priority-present') => readFileSync(new URL(`../fixtures/zendesk-view-${name}.html`, import.meta.url), 'utf8');
const LABELS = ['Urgent', 'High', 'Normal', 'Low'];
const CLASSIC = 'zhroma-classic';
const STORED_CLASSIC = Object.freeze({ v: 1, id: CLASSIC });
const NEWER = Object.freeze({ v: 99, id: 'from-a-newer-version' });
// The reconcile pass plus the missing-column settle, as the v1 suites use it.
const SETTLE_MS = 100;

afterEach(async () => {
  for (const window of windows.splice(0)) {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.close();
  }
  vi.restoreAllMocks();
  vi.useRealTimers();
  await closeWindows();
});

// --- the strict Chrome harness, with fake timers ------------------------------

// The manifest's scripts in manifest order, as Chrome injects them. Nothing is
// delivered until the test flushes the harness.
function loadPage({ scripts = JSON.parse(asset('manifest.json')).content_scripts[0].js, ...harnessOptions } = {}) {
  if (!vi.isFakeTimers()) vi.useFakeTimers();
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
  windows.push(window);
  const { document } = window;
  Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  document.documentElement.lang = 'en';
  document.body.innerHTML = fixture();
  const observers = [];
  class StartupObserver {
    constructor(callback) { this.callback = callback; this.active = false; observers.push(this); }
    observe() { this.active = true; }
    disconnect() { this.active = false; }
  }
  const harness = createChromeHarness(harnessOptions);
  const context = createContext({ document, window, chrome: harness.chrome, MutationObserver: StartupObserver, setTimeout, clearTimeout });
  for (const path of scripts) new Script(asset(path), { filename: path }).runInContext(context);
  return { document, window, harness, observers };
}

// --- agreement: one contract, three copies ------------------------------------

test('the settings contract agrees with the shipped registry, with content.js and with the tracer read', async () => {
  const bare = createContext({});
  new Script(asset('zhroma-settings.js'), { filename: 'zhroma-settings.js' }).runInContext(bare);
  expect(SETTINGS_CONTRACT.keys.length).toBeGreaterThanOrEqual(1);
  expect([...bare.Zhroma.settings.registry.keys]).toEqual([...SETTINGS_CONTRACT.keys]);
  const source = asset('content.js');
  expect(source).toContain(`SETTINGS_READ_TIMEOUT_MS = ${SETTINGS_CONTRACT.timeoutMs}`);
  // The reader uses the same area as the off switch, and only that area.
  expect(source).toContain(`PREFERENCE_AREA = '${SETTINGS_CONTRACT.area}'`);
  expect(source).not.toMatch(/chrome\.storage\.(sync|session|managed)/u);

  // The tracer's content settings read asks for exactly the same keys.
  const world = createWorld();
  const local = world.contentChromeFor(TAB_ID).storage.local;
  const get = local.get;
  const asked = [];
  local.get = (keys, callback) => { if (Array.isArray(keys)) asked.push([...keys]); return get(keys, callback); };
  loadWorker(world);
  loadContent(world);
  await settle();
  expect(asked).toEqual([[...SETTINGS_CONTRACT.keys]]);
  expect(world.settingsReadCount('content')).toBe(1);
  expect(world.forbidden).toEqual([]);
});

test('the harness admits exactly the settings read and records every other array or string form', () => {
  const harness = createChromeHarness({ settingsStored: { theme: STORED_CLASSIC, other: true } });
  const seen = [];
  expect(() => harness.chrome.storage.local.get(['theme'], (values) => seen.push(values))).not.toThrow();
  expect(harness.settingsReadCount()).toBe(1);
  expect(harness.settingsPendingCount()).toBe(1);
  // The v1 counters still count only the enabled read (A6).
  expect(harness.readCount()).toBe(0);
  expect(harness.pendingCount()).toBe(0);
  harness.assertClean();
  expect(harness.flush()).toBe(1);
  // Only the keys asked for and stored, and a copy the caller cannot reach through.
  expect(seen).toEqual([{ theme: STORED_CLASSIC }]);
  seen[0].theme.v = 7;
  harness.chrome.storage.local.get(['theme'], (values) => seen.push(values));
  harness.flush();
  expect(seen[1]).toEqual({ theme: STORED_CLASSIC });

  const probes = [[['theme', 'x'], '["theme","x"]'], [['enabled'], '["enabled"]'], [[], '[]'], ['theme', '"theme"']];
  for (const [keys] of probes) expect(() => harness.chrome.storage.local.get(keys, () => {})).toThrow(/Unpermitted Chrome usage/);
  expect(harness.violations).toEqual(probes.map(([, shown]) => `chrome.storage.local.get(${shown})`));
  expect(harness.settingsReadCount()).toBe(2);
});

test('the harness settings modes answer as Chrome does, and an unknown mode is refused', () => {
  const answers = [];
  for (const mode of ['rejected', 'rejected-with-values']) {
    const harness = createChromeHarness({ settingsReadMode: mode, settingsStored: { theme: STORED_CLASSIC } });
    harness.chrome.storage.local.get(['theme'], (values) => {
      answers.push([mode, values, harness.chrome.runtime.lastError?.message]);
    });
    harness.flush();
  }
  expect(answers).toEqual([
    ['rejected', undefined, 'Storage read failed'],
    ['rejected-with-values', { theme: STORED_CLASSIC }, 'Storage read failed'],
  ]);
  const throwing = createChromeHarness({ settingsReadMode: 'throws' });
  expect(() => throwing.chrome.storage.local.get(['theme'], () => {})).toThrow('Storage unavailable');
  const hung = createChromeHarness({ settingsReadMode: 'hang' });
  hung.chrome.storage.local.get(['theme'], () => { throw new Error('a hung read must never answer'); });
  expect(hung.settingsPendingCount()).toBe(0);
  expect(hung.flush()).toBe(0);
  expect(hung.settingsReadCount()).toBe(1);
  const stored = createChromeHarness();
  stored.setSettingsStored('theme', NEWER);
  stored.chrome.storage.local.get(['theme'], (values) => answers.push(values));
  stored.clearSettingsStored('theme');
  stored.chrome.storage.local.get(['theme'], (values) => answers.push(values));
  stored.flush();
  expect(answers.slice(2)).toEqual([{ theme: NEWER }, {}]);
  expect(() => createChromeHarness({ settingsReadMode: 'optimistic' })).toThrow(/Unknown settingsReadMode/);
});

// --- the gate and its time bound ----------------------------------------------

test('a hung settings read holds rows untinted for at most the time bound, then tints and leaves no timer', () => {
  const page = loadPage({ settingsReadMode: 'hang' });
  // The preference is confirmed; only the settings read is outstanding.
  page.harness.flush();
  expect(page.harness.readCount()).toBe(1);
  expect(page.harness.settingsReadCount()).toBe(1);
  vi.advanceTimersByTime(SETTINGS_CONTRACT.timeoutMs - 1);
  expect(markers(page.document), '[mutant:settings-gate-required]').toEqual([]);
  expect(page.harness.requestStatus()).toMatchObject({ diagnosis: 'neutral', reason: null });
  vi.advanceTimersByTime(1);
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markers(page.document), '[mutant:settings-gate-bound]').toEqual(LABELS);
  expect(page.harness.requestStatus()).toMatchObject({ diagnosis: 'working', reason: null });
  expect(vi.getTimerCount(), '[mutant:settings-gate-bound]').toBe(0);
  page.harness.assertClean();
});

test.each(['rejected', 'rejected-with-values', 'throws'])('a %s settings read tints with no wait', (settingsReadMode) => {
  const page = loadPage({ settingsReadMode, settingsStored: { theme: NEWER } });
  page.harness.flush();
  // Well inside the time bound: a failed read must not be waited out.
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markers(page.document), '[mutant:settings-failure-opens-gate]').toEqual(LABELS);
  expect(vi.getTimerCount(), '[mutant:settings-failure-opens-gate]').toBe(0);
  expect(page.harness.settingsReadCount()).toBe(1);
  page.harness.assertClean();
});

test.each([
  ['absent', undefined],
  ['null', null],
  ['an empty object', {}],
  ['a bare string', CLASSIC],
  ['an unknown id', { v: 1, id: 'nope' }],
  ['a newer version', NEWER],
  ['the stored Classic form', STORED_CLASSIC],
])('a stored theme of %s tints exactly as 0.1.0 does, and nothing is written', (_label, theme) => {
  const page = loadPage({ settingsStored: theme === undefined ? {} : { theme } });
  page.harness.flush();
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markers(page.document)).toEqual(LABELS);
  expect(page.harness.requestStatus()).toMatchObject({ diagnosis: 'working', reason: null });
  expect(vi.getTimerCount()).toBe(0);
  expect(page.harness.settingsReadCount()).toBe(1);
  // The harness has no write member: any storage write would be a violation.
  page.harness.assertClean();
});

test('content.js loaded on its own issues no settings read and tints as 0.1.0 does', () => {
  const page = loadPage({ scripts: ['content.js'], settingsReadMode: 'hang' });
  page.harness.flush();
  vi.advanceTimersByTime(SETTLE_MS);
  expect(markers(page.document)).toEqual(LABELS);
  expect(page.harness.settingsReadCount()).toBe(0);
  expect(vi.getTimerCount()).toBe(0);
  page.harness.assertClean();
});

// --- the tracer world: three real contexts -------------------------------------

// Nothing the content script sends or answers carries a setting, a key or a
// status (DATA-01). Only the popup's own set-setting exchange names a key.
function expectNoSettingsTraffic(world) {
  const leaked = world.traffic.filter(({ payload }) => payload?.type !== 'set-setting')
    .filter(({ payload }) => /theme|zhroma-classic|from-a-newer-version|unreadable/u.test(JSON.stringify(payload) ?? ''));
  expect(leaked).toEqual([]);
}

test('the first tint waits for the settings read even when the preference is already confirmed', async () => {
  const world = createWorld({ stored: { enabled: true, theme: STORED_CLASSIC } });
  world.setSettingsReadMode('deferred', 'content');
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect(world.settingsReadCount('content')).toBe(1);
  expect(world.pendingSettingsReadCount()).toBe(1);
  expect(markers(content.document), '[mutant:settings-gate-required]').toEqual([]);
  world.flushSettingsReads();
  await settle();
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  expect(world.writeLog).toEqual([]);
  expectNoSettingsTraffic(world);
  expect(world.forbidden).toEqual([]);
});

test('content.js loaded on its own in the tracer world tints with no settings read', async () => {
  const world = createWorld({ stored: { enabled: true } });
  world.setSettingsReadMode('hang', 'content');
  loadWorker(world);
  const content = loadContent(world, { scripts: ['content.js'] });
  await settle();
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.settingsReadCount('content')).toBe(0);
  expect(world.forbidden).toEqual([]);
});

test.each(['immediate', 'deferred', 'rejected', 'rejected-with-values', 'throws', 'hang'])(
  'a stored false stays dormant whatever the settings read does (%s)',
  async (mode) => {
    const world = createWorld({ stored: { enabled: false, theme: NEWER } });
    world.setSettingsReadMode(mode, 'content');
    loadWorker(world);
    const content = loadContent(world);
    await settle();
    world.flushSettingsReads();
    if (mode === 'hang') await wait(SETTINGS_CONTRACT.timeoutMs + 50);
    await settle();
    expect(markers(content.document)).toEqual([]);
    expect(world.action(TAB_ID)).toEqual({ icon: ICON.off, title: COPY.off });
    expect(world.getStored('theme')).toEqual(NEWER);
    expect(world.writeLog).toEqual([]);
    expectNoSettingsTraffic(world);
    expect(world.forbidden).toEqual([]);
  },
);

test('the settings read never opens a document whose preference is unconfirmed', async () => {
  const world = createWorld({ stored: { enabled: true } });
  world.setReadMode('deferred', 'content');
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  // The settings read has landed and opened its gate; the preference has not.
  expect(world.settingsReadCount('content')).toBe(1);
  expect(world.pendingReadCount()).toBe(1);
  expect(markers(content.document)).toEqual([]);
  expect(world.action(TAB_ID)?.icon ?? ICON.neutral).toBe(ICON.neutral);
  world.flushReads();
  await settle();
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.forbidden).toEqual([]);
});

test('a pagehide and pageshow round trip re-reads settings and restores the markers', async () => {
  const world = createWorld({ stored: { enabled: true, theme: STORED_CLASSIC } });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.settingsReadCount('content')).toBe(1);
  content.window.dispatchEvent(new content.window.Event('pagehide'));
  await settle();
  expect(markers(content.document)).toEqual([]);
  content.window.dispatchEvent(new content.window.Event('pageshow'));
  await settle();
  expect(world.settingsReadCount('content')).toBe(2);
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.writeLog).toEqual([]);
  expectNoSettingsTraffic(world);
  expect(world.forbidden).toEqual([]);
});

// --- the change listener and the D-14 end-to-end path ---------------------------

const POPUP_SENDER = Object.freeze({ id: EXTENSION_ID, url: POPUP_URL });
const themeMessage = (requestId) => ({ type: 'set-setting', requestId, key: 'theme', value: CLASSIC });
const PRIORITY_ATTRIBUTE = 'data-zhroma-priority';

// Every setAttribute or removeAttribute of the priority marker, on any element
// of this window, from the moment the spy is installed.
function spyOnMarkerWrites(window) {
  const writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  const removals = vi.spyOn(window.Element.prototype, 'removeAttribute');
  return () => [...writes.mock.calls, ...removals.mock.calls].filter(([name]) => name === PRIORITY_ATTRIBUTE);
}

test('a theme saved through the worker over an unreadable stored theme reaches the page and changes nothing visible (D-14)', async () => {
  const world = createWorld({ stored: { enabled: true, theme: NEWER } });
  // Observe what the content script's one storage listener is handed.
  const onChanged = world.contentChromeFor(TAB_ID).storage.onChanged;
  const addListener = onChanged.addListener;
  const delivered = [];
  onChanged.addListener = (listener) => addListener((changes, areaName) => {
    delivered.push({ changes: structuredClone(changes), areaName });
    return listener(changes, areaName);
  });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  const shown = statusText(popup.document);
  const markerWrites = spyOnMarkerWrites(content.window);
  // A re-evaluation would re-inspect the table; the change must not.
  const scans = vi.spyOn(content.document, 'querySelectorAll');

  const answer = await world.sendToWorker(themeMessage(41), POPUP_SENDER);
  await settle();

  expect(answer).toEqual({ type: 'set-setting', requestId: 41, outcome: 'saved', revision: null });
  expect(world.getStored('theme')).toEqual(STORED_CLASSIC);
  expect(world.writeLog).toEqual([{ theme: STORED_CLASSIC }]);
  // The change reached the content script's listener, in the local area.
  expect(delivered).toEqual([{ changes: { theme: { oldValue: NEWER, newValue: STORED_CLASSIC } }, areaName: 'local' }]);
  // ...and it re-evaluated no row: not one marker was written or removed.
  expect(markerWrites()).toEqual([]);
  expect(scans).not.toHaveBeenCalled();
  expect(markers(content.document)).toEqual(LABELS);
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.working, title: COPY.working });
  expect(statusText(popup.document)).toBe(shown);
  expect(world.settingsReadCount('content')).toBe(1);
  expect(world.storageListenerCount()).toBeGreaterThanOrEqual(1);
  expectNoSettingsTraffic(world);
  expect(world.forbidden).toEqual([]);
});

test('a theme change in another area, an unrelated key and a removed theme change nothing visible', () => {
  const page = loadPage({ settingsStored: { theme: STORED_CLASSIC } });
  page.harness.flush();
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markers(page.document)).toEqual(LABELS);
  const sent = page.harness.messages.length;
  const markerWrites = spyOnMarkerWrites(page.window);
  page.harness.emitChange({ theme: { oldValue: STORED_CLASSIC, newValue: NEWER } }, 'sync');
  page.harness.emitChange({ somethingElse: { newValue: false } });
  page.harness.emitChange({ theme: { oldValue: STORED_CLASSIC } });
  page.harness.emitChange({ theme: { oldValue: STORED_CLASSIC, newValue: NEWER } });
  page.harness.emitChange(null);
  page.harness.emitChange([]);
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markerWrites()).toEqual([]);
  expect(markers(page.document)).toEqual(LABELS);
  expect(page.harness.messages).toHaveLength(sent);
  expect(page.harness.requestStatus()).toMatchObject({ diagnosis: 'working', reason: null });
  expect(page.harness.settingsReadCount()).toBe(1);
  expect(vi.getTimerCount()).toBe(0);
  page.harness.assertClean();
});

test('a settings change that throws on access still lets the off switch through', () => {
  const page = loadPage();
  page.harness.flush();
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markers(page.document)).toEqual(LABELS);
  // emitChange hands the object over as it is, uncloned, getter and all.
  const changes = {
    get theme() { throw new Error('unreadable change'); },
    enabled: { oldValue: true, newValue: false },
  };
  page.harness.setStored(false);
  expect(() => page.harness.emitChange(changes)).not.toThrow();
  vi.advanceTimersByTime(SETTLE_MS);
  page.harness.flush();
  expect(markers(page.document)).toEqual([]);
  expect(page.observers.filter((observer) => observer.active)).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
  page.harness.assertClean();
});

test('the content script still registers exactly one storage listener in both doubles', async () => {
  const page = loadPage();
  expect(page.harness.storageListenerCount()).toBe(1);
  page.harness.flush();
  page.harness.assertClean();
  // The tracer world runs on real time.
  vi.useRealTimers();
  const world = createWorld();
  loadContent(world);
  await settle();
  expect(world.storageListenerCount()).toBe(1);
  expect(world.forbidden).toEqual([]);
});
