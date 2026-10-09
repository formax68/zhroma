// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { EXTENSION_ID, POPUP_URL, closeWindows, createWorld, loadContent, loadWorker, markers, settle } from './tracer-world.js';

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });
const envelope = id => ({ v: 1, id });
const themeChange = id => ({ theme: { newValue: envelope(id) } });

// Probe real browser seams rather than a reimplementation of the controller.
// Native MutationObserver supplies its own target/subtree/filter semantics.
function probe({ window, document, context }) {
  const counts = { queries: 0, reads: 0, stamps: 0, properties: [] };
  const observers = [], listeners = [], paints = [];
  const NativeObserver = window.MutationObserver;
  context.MutationObserver = class {
    constructor(callback) {
      this.active = false;
      this.deliveries = [];
      this.native = new NativeObserver(records => {
        this.deliveries.push(records.map(({ target, type, attributeName }) => ({ target, type, attributeName })));
        callback(records);
      });
      observers.push(this);
    }
    observe(target, options) { this.target = target; this.options = options; this.active = true; this.native.observe(target, options); }
    disconnect() { this.active = false; this.native.disconnect(); }
  };
  for (const target of [window, document]) {
    const add = target.addEventListener.bind(target);
    target.addEventListener = (type, listener, options) => { listeners.push({ target, type, listener }); return add(type, listener, options); };
  }
  for (const target of [document, ...document.querySelectorAll('*')]) {
    for (const method of ['querySelector', 'querySelectorAll']) {
      const original = target[method].bind(target);
      target[method] = selector => { counts.queries++; return original(selector); };
    }
  }
  for (const cell of document.querySelectorAll('td,th')) {
    let proto = cell;
    while (!Object.getOwnPropertyDescriptor(proto, 'textContent')) proto = Object.getPrototypeOf(proto);
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'textContent');
    Object.defineProperty(cell, 'textContent', { configurable: true,
      get() { counts.reads++; return descriptor.get.call(this); },
      set(value) { descriptor.set.call(this, value); },
    });
  }
  for (const method of ['setAttribute', 'removeAttribute']) {
    const original = window.Element.prototype[method];
    window.Element.prototype[method] = function(name, value) {
      if (name === 'data-zhroma-priority') {
        counts.stamps++;
        if (method === 'setAttribute') paints.push({ priority: value, tint: document.documentElement.style.getPropertyValue(`--zhroma-priority-${value.toLowerCase()}`) });
      }
      return original.call(this, name, value);
    };
  }
  const style = document.documentElement.style;
  const setProperty = style.setProperty.bind(style);
  style.setProperty = (name, value, priority) => { counts.properties.push([name, value]); return setProperty(name, value, priority); };
  const reset = () => { counts.queries = 0; counts.reads = 0; counts.stamps = 0; counts.properties.length = 0; };
  return { counts, observers, listeners, paints, reset };
}

function load(world, options = {}) {
  let observed;
  const content = loadContent(world, { ...options, beforeScripts(args) {
    observed = probe(args);
    options.beforeScripts?.(args);
  } });
  return { ...content, probe: observed };
}

function expectPalette(content, id, mode) {
  const { colour, themes } = content.context.Zhroma;
  const variant = themes.resolve(id, mode);
  for (const priority of themes.priorityOrder) {
    const tint = variant.slots[variant.priorities[priority]];
    expect(content.document.documentElement.style.getPropertyValue(`--zhroma-priority-${priority.toLowerCase()}`)).toBe(colour.emitRgba(tint.rgb, tint.alpha));
  }
}
function expectNoRowWork(content) {
  expect(content.probe.counts.queries, 'no table query or gratuitous reconcile').toBe(0);
  expect(content.probe.counts.reads, 'no Priority/header read').toBe(0);
  expect(content.probe.counts.stamps, 'no marker write or removal').toBe(0);
}

for (const mode of ['immediate', 'deferred', 'rejected', 'rejected-with-values', 'throws', 'hang']) {
  test(`dark startup ${mode} settings observes mode before its first row paint`, async () => {
    const world = createWorld({ stored: { theme: envelope('zhroma-catppuccin') }, settingsReadMode: mode });
    const content = load(world, { dataTheme: 'dark' });
    await settle();
    if (['deferred', 'hang'].includes(mode)) {
      expect(content.probe.paints).toEqual([]);
      await new Promise(resolve => setTimeout(resolve, 520));
      await settle();
      expect(content.probe.paints.map(paint => paint.tint)).toEqual([
        'rgb(220 38 38 / 0.3)', 'rgb(234 88 12 / 0.3)', 'rgb(202 138 4 / 0.3)', 'rgb(22 163 74 / 0.3)',
      ]);
      content.probe.reset();
      if (mode === 'deferred') { world.flushSettingsReads(); await settle(); expectNoRowWork(content); }
    }
    const id = ['immediate', 'deferred'].includes(mode) ? 'zhroma-catppuccin' : 'zhroma-classic';
    expectPalette(content, id, 'dark');
    expect(content.probe.paints).toHaveLength(4);
    if (!['deferred', 'hang'].includes(mode)) {
      expect(content.probe.paints.map(paint => paint.tint)).toEqual(content.context.Zhroma.themes.priorityOrder.map(priority => {
        const variant = content.context.Zhroma.themes.resolve(id, 'dark');
        const tint = variant.slots[variant.priorities[priority]];
        return content.context.Zhroma.colour.emitRgba(tint.rgb, tint.alpha);
      }));
    }
    expect(world.writeLog).toEqual([]); expect(world.forbidden).toEqual([]);
  });
}

test('exact marker and latest batch delivery change only properties with no feedback or debounce', async () => {
  const world = createWorld({ stored: { theme: envelope('zhroma-catppuccin') } });
  const content = load(world, { dataTheme: 'light', beforeScripts({ window }) {
    window.matchMedia = () => { throw new Error('OS preference cannot choose appearance'); };
  } });
  await settle();
  const root = content.document.documentElement;
  const appearance = content.probe.observers.find(observer => observer.target === root);
  expect(appearance.options).toEqual({ attributes: true, attributeFilter: ['data-theme'] });
  const before = markers(content.document);
  content.probe.reset();
  root.setAttribute('data-theme', 'dark');
  // Happy DOM delivers native observer records before this timer. Production
  // must resolve the current marker in that delivery, without its own delay.
  await new Promise(resolve => setTimeout(resolve, 0));
  expectPalette(content, 'zhroma-catppuccin', 'dark');
  expectNoRowWork(content);
  expect(content.probe.counts.properties.length).toBeGreaterThan(0);
  const deliveries = appearance.deliveries.length;
  content.probe.reset();
  root.setAttribute('data-theme', 'light'); root.setAttribute('data-theme', 'dark'); root.setAttribute('data-theme', 'light');
  await settle(); expectPalette(content, 'zhroma-catppuccin', 'light'); expectNoRowWork(content);
  expect(appearance.deliveries.length).toBe(deliveries + 1);
  for (const marker of ['light', '', 'DARK', 'Dark', ' dark', 'dark ', '1', 'unknown', null]) {
    content.probe.reset();
    if (marker === null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', marker);
    await settle(); expectPalette(content, 'zhroma-catppuccin', 'light'); expectNoRowWork(content);
    expect(content.probe.counts.properties).toEqual([]);
  }
  content.probe.reset();
  root.style.setProperty('--host-test', '1'); content.document.body.setAttribute('data-theme', 'dark');
  root.setAttribute('data-color-scheme', 'dark'); root.classList.add('dark');
  await settle(); expectNoRowWork(content); expect(content.probe.counts.properties).toEqual([['--host-test', '1']]);
  expect(markers(content.document)).toEqual(before); expect(world.forbidden).toEqual([]);
});

test('theme changes emit only differing numeric properties and duplicate effective choices do no work', async () => {
  const world = createWorld(); const content = load(world, { dataTheme: 'light' }); await settle();
  const root = content.document.documentElement;
  // A host/CSSOM value already equal to the next canonical value needs no
  // extra emission even though the effective identity changes.
  root.style.setProperty('--zhroma-priority-urgent', 'rgb(220 38 38 / 0.3)');
  const before = new Map(Array.from({ length: root.style.length }, (_, i) => [root.style.item(i), root.style.getPropertyValue(root.style.item(i))]));
  content.probe.reset(); root.setAttribute('data-theme', 'dark'); await settle();
  expectNoRowWork(content);
  expect(content.probe.counts.properties.length).toBeGreaterThan(0);
  for (const [name, value] of content.probe.counts.properties) expect(value, name).not.toBe(before.get(name));
  content.probe.reset(); world.emitStorageChange(themeChange('zhroma-classic')); root.setAttribute('data-theme', 'dark'); await settle();
  expectNoRowWork(content); expect(content.probe.counts.properties).toEqual([]);
});

test('visibility return and repeated bfcache restores resynchronise mode before paint with bounded observers/listeners', async () => {
  const world = createWorld({ stored: { theme: envelope('zhroma-catppuccin') } });
  const content = load(world, { dataTheme: 'light' }); await settle();
  const { document, window } = content;
  Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
  document.hidden = true; document.dispatchEvent(new window.Event('visibilitychange')); await settle();
  expect(markers(document)).toEqual([]);
  document.documentElement.setAttribute('data-theme', 'dark');
  document.hidden = false; document.dispatchEvent(new window.Event('visibilitychange')); await settle();
  expectPalette(content, 'zhroma-catppuccin', 'dark'); expect(markers(document)).toHaveLength(4);
  for (const mode of ['light', 'dark', 'light', 'dark']) {
    window.dispatchEvent(new window.Event('pagehide'));
    expect(content.probe.observers.every(observer => !observer.active)).toBe(true);
    expect(markers(document)).toEqual([]);
    const deliveryCount = content.probe.observers.reduce((n, observer) => n + observer.deliveries.length, 0);
    document.documentElement.setAttribute('data-theme', mode); await settle();
    expect(content.probe.observers.reduce((n, observer) => n + observer.deliveries.length, 0)).toBe(deliveryCount);
    world.setReadMode('deferred', 'content');
    const paintStart = content.probe.paints.length;
    window.dispatchEvent(new window.Event('pageshow')); window.dispatchEvent(new window.Event('pageshow'));
    expectPalette(content, 'zhroma-catppuccin', mode); expect(markers(document)).toEqual([]);
    world.flushReads(); await settle();
    expect(markers(document)).toHaveLength(4);
    const paints = content.probe.paints.slice(paintStart);
    for (const paint of paints) expect(paint.tint).toBe(document.documentElement.style.getPropertyValue(`--zhroma-priority-${paint.priority.toLowerCase()}`));
    expect(content.probe.observers).toHaveLength(2);
    expect(content.probe.observers.filter(observer => observer.active)).toHaveLength(2);
  }
  expect(content.probe.listeners.filter(({ type }) => ['pagehide', 'pageshow', 'visibilitychange'].includes(type))).toHaveLength(3);
  expect(world.storageListenerCount()).toBe(1); expect(world.forbidden).toEqual([]);
});

test('palette emission faults never prevent initial preference listener or restore/off handling', async () => {
  const world = createWorld(); let fail = true;
  const content = load(world, { dataTheme: 'dark', beforeScripts({ document }) {
    const style = document.documentElement.style; const set = style.setProperty.bind(style);
    style.setProperty = (...args) => { if (fail) throw new Error('host CSSOM fault'); return set(...args); };
  } });
  await settle();
  expect(markers(content.document)).toHaveLength(4);
  fail = false; world.emitStorageChange(themeChange('zhroma-catppuccin')); await settle();
  expectPalette(content, 'zhroma-catppuccin', 'dark');
  fail = true; content.window.dispatchEvent(new content.window.Event('pagehide'));
  content.document.documentElement.setAttribute('data-theme', 'light');
  content.window.dispatchEvent(new content.window.Event('pageshow')); await settle();
  expect(markers(content.document)).toHaveLength(4);
  world.emitStorageChange({ enabled: { newValue: false }, ...themeChange('zhroma-classic') }); await settle();
  expect(markers(content.document)).toEqual([]); expect(world.forbidden).toEqual([]);
});

const popupSender = { id: EXTENSION_ID, url: POPUP_URL };
const saveTheme = (world, id, requestId = 80) => world.sendToWorker({ type: 'set-setting', requestId, key: 'theme', value: id }, popupSender);
const status = (world, tabId = 7) => world.workerChrome.tabs.sendMessage(tabId, { type: 'get-status', requestId: 81 }, { frameId: 0 });
const fixtureFile = name => readFileSync(new URL(`../fixtures/${name}.html`, import.meta.url), 'utf8');

for (const readMode of ['immediate', 'deferred', 'rejected-with-values', 'hang']) test(`restore ${readMode} settings uses current dark mode before tint and keeps late settings property-only`, async () => {
  const world = createWorld({ stored: { theme: envelope('zhroma-catppuccin') } });
  const content = load(world, { dataTheme: 'light' }); await settle();
  content.window.dispatchEvent(new content.window.Event('pagehide'));
  world.setStored('theme', envelope('zhroma-nord')); world.setSettingsReadMode(readMode, 'content');
  content.document.documentElement.setAttribute('data-theme', 'dark');
  const start = content.probe.paints.length;
  content.window.dispatchEvent(new content.window.Event('pageshow')); await settle();
  const id = readMode === 'immediate' ? 'zhroma-nord' : readMode === 'rejected-with-values' ? 'zhroma-classic' : 'zhroma-catppuccin';
  expectPalette(content, id, 'dark');
  const paints = content.probe.paints.slice(start); expect(paints).toHaveLength(4);
  for (const paint of paints) expect(paint.tint).toBe(content.document.documentElement.style.getPropertyValue(`--zhroma-priority-${paint.priority.toLowerCase()}`));
  if (readMode === 'deferred') {
    content.probe.reset(); world.flushSettingsReads(); await settle();
    expectPalette(content, 'zhroma-nord', 'dark'); expectNoRowWork(content);
  }
  expect(world.writeLog).toEqual([]); expect(world.forbidden).toEqual([]);
});

test('one real worker save reaches two supported modes, an off sibling and a no-view sibling without row work', async () => {
  const world = createWorld({ stored: { enabled: false } }); loadWorker(world);
  world.openTab(11); const off = load(world, { tabId: 11, dataTheme: 'dark' }); await settle();
  // Model an off document that missed an enable event while frozen, then
  // resumed execution without a bfcache restore. Its local enable generation
  // remains independent of theme events, exactly as the real controller does.
  world.freezeTab(11);
  await world.sendToWorker({ type: 'set-enabled', requestId: 82, enabled: true }, popupSender);
  expect(world.getStored('enabled')).toBe(true);
  world.thawTab(11);
  const light = load(world, { dataTheme: 'light' });
  world.openTab(9); const dark = load(world, { tabId: 9, dataTheme: 'dark' });
  world.openTab(12); const noView = load(world, { tabId: 12, html: '', dataTheme: 'light' });
  await settle();
  expect(markers(light.document)).toHaveLength(4); expect(markers(dark.document)).toHaveLength(4);
  expect(markers(off.document)).toEqual([]); expect(markers(noView.document)).toEqual([]);
  const diagnoses = await Promise.all([7, 9, 11, 12].map(tabId => status(world, tabId)));
  const events = []; world.workerChrome.storage.onChanged.addListener(changes => events.push(changes));
  const writes = world.writeLog.length;
  const actions = world.actionLog.length;
  for (const content of [light, dark, off, noView]) content.probe.reset();
  expect(await saveTheme(world, 'zhroma-nord')).toMatchObject({ outcome: 'saved' }); await settle();
  expect(world.writeLog.slice(writes)).toEqual([{ theme: envelope('zhroma-nord') }]);
  expect(events).toEqual([{ theme: { newValue: envelope('zhroma-nord') } }]);
  expect(JSON.stringify(world.getStored('theme'))).toBe('{"v":1,"id":"zhroma-nord"}');
  for (const [content, mode] of [[light, 'light'], [dark, 'dark'], [off, 'dark'], [noView, 'light']]) {
    expectPalette(content, 'zhroma-nord', mode); expectNoRowWork(content);
  }
  expect(world.actionLog.length).toBe(actions);
  expect(await Promise.all([7, 9, 11, 12].map(tabId => status(world, tabId)))).toEqual(diagnoses);
  expect(markers(off.document)).toEqual([]); expect(markers(noView.document)).toEqual([]);
  expect(world.forbidden).toEqual([]);
});

test('newer worker theme event beats held startup read and emits no reread or repair write', async () => {
  const world = createWorld({ stored: { theme: envelope('zhroma-catppuccin') } });
  world.setSettingsReadMode('deferred', 'content');
  const content = load(world, { dataTheme: 'dark' }); await settle();
  expect(world.pendingSettingsReadCount()).toBe(1); expect(markers(content.document)).toEqual([]);
  loadWorker(world);
  expect(await saveTheme(world, 'zhroma-solarized')).toMatchObject({ outcome: 'saved' }); await settle();
  expectPalette(content, 'zhroma-solarized', 'dark');
  world.flushSettingsReads(); await settle();
  expectPalette(content, 'zhroma-solarized', 'dark'); expect(markers(content.document)).toHaveLength(4);
  expect(world.settingsReadCount('content')).toBe(1);
  expect(world.writeLog).toEqual([{ theme: envelope('zhroma-solarized') }]); expect(world.forbidden).toEqual([]);
});

test('older suspended startup read cannot overwrite a newer restored snapshot delivered first', async () => {
  const world = createWorld({ stored: { theme: envelope('zhroma-catppuccin') } }); loadWorker(world);
  world.setSettingsReadMode('deferred', 'content');
  const content = load(world, { dataTheme: 'light' }); await settle();
  content.window.dispatchEvent(new content.window.Event('pagehide')); world.freezeTab(7);
  expect(await saveTheme(world, 'zhroma-nord')).toMatchObject({ outcome: 'saved' });
  world.thawTab(7); content.document.documentElement.setAttribute('data-theme', 'dark');
  content.window.dispatchEvent(new content.window.Event('pageshow')); await settle();
  expect(world.pendingSettingsReadCount()).toBe(2);
  world.releaseSettingsRead(1); await settle();
  expectPalette(content, 'zhroma-nord', 'dark'); expect(markers(content.document)).toHaveLength(4);
  content.probe.reset(); world.releaseSettingsRead(0); await settle();
  expectPalette(content, 'zhroma-nord', 'dark'); expectNoRowWork(content);
  expect(content.probe.counts.properties).toEqual([]);
  expect(world.writeLog).toEqual([{ theme: envelope('zhroma-nord') }]); expect(world.forbidden).toEqual([]);
});

test('newer enable and theme generations beat stale restored snapshots independently', async () => {
  const world = createWorld({ stored: { enabled: true, theme: envelope('zhroma-catppuccin') } }); loadWorker(world);
  const content = load(world, { dataTheme: 'dark' }); await settle();
  content.window.dispatchEvent(new content.window.Event('pagehide'));
  world.setReadMode('deferred', 'content'); world.setSettingsReadMode('deferred', 'content');
  content.window.dispatchEvent(new content.window.Event('pageshow')); await settle();
  expect(world.pendingReadCount()).toBe(1); expect(world.pendingSettingsReadCount()).toBe(1);
  expect(await saveTheme(world, 'zhroma-dracula')).toMatchObject({ outcome: 'saved' });
  world.setStored('enabled', false); world.emitStorageChange({ enabled: { newValue: false } });
  await settle(); content.probe.reset();
  world.flushReads(); world.flushSettingsReads(); await settle();
  expectPalette(content, 'zhroma-dracula', 'dark'); expectNoRowWork(content);
  expect(content.probe.counts.properties).toEqual([]); expect(markers(content.document)).toEqual([]);
  expect(world.getStored('enabled')).toBe(false);
  expect(world.getStored('theme')).toEqual(envelope('zhroma-dracula'));
  expect(world.writeLog).toEqual([{ theme: envelope('zhroma-dracula') }]); expect(world.forbidden).toEqual([]);
});

test('removal restores Classic, corrupt/future/unknown settings preserve bytes, unrelated deliveries do nothing', async () => {
  const world = createWorld({ stored: { theme: envelope('zhroma-nord') } });
  const content = load(world, { dataTheme: 'unknown' }); await settle();
  expectPalette(content, 'zhroma-nord', 'light');
  for (const [changes, area] of [[themeChange('zhroma-dracula'), 'sync'], [{ futureKey: { newValue: true } }, 'local']]) {
    content.probe.reset(); world.emitStorageChange(changes, area); await settle();
    expectPalette(content, 'zhroma-nord', 'light'); expectNoRowWork(content); expect(content.probe.counts.properties).toEqual([]);
  }
  for (const raw of [{ v: 99, id: 'zhroma-nord' }, { v: 1, id: 'unknown' }, { v: 1, id: 'zhroma-nord', extra: true }, null, 'zhroma-nord']) {
    world.setStored('theme', raw); content.probe.reset();
    world.emitStorageChange({ theme: { newValue: raw } }); await settle();
    expectPalette(content, 'zhroma-classic', 'light'); expectNoRowWork(content);
    expect(world.getStored('theme')).toEqual(raw); expect(world.writeLog).toEqual([]);
  }
  world.emitStorageChange(themeChange('zhroma-nord')); await settle(); content.probe.reset();
  world.emitStorageChange({ theme: { oldValue: envelope('zhroma-nord') } }); await settle();
  expectPalette(content, 'zhroma-classic', 'light'); expectNoRowWork(content);
  expect(world.writeLog).toEqual([]); expect(world.forbidden).toEqual([]);
});

for (const scenario of [
  { name: 'English regional', lang: 'en-GB', diagnosis: 'working', reason: null, count: 4 },
  { name: 'unsupported locale', lang: 'fr', diagnosis: 'cannot-read', reason: 'unsupported-language', count: 0 },
  { name: 'subframe', frame: true, diagnosis: 'cannot-read', reason: 'structure', count: 0 },
  { name: 'unsafe topology', mutate: document => document.querySelector('td').colSpan = 2, diagnosis: 'cannot-read', reason: 'structure', count: 0 },
  { name: 'Priority absent', html: fixtureFile('zendesk-view-priority-absent'), diagnosis: 'missing', reason: null, count: 0 },
  { name: 'Priority blank', mutate: document => { for (const row of document.querySelectorAll('tbody tr')) row.children[6].textContent = ' '; }, diagnosis: 'working', reason: 'blank', count: 0 },
]) test(`saved palette preserves ${scenario.name} admission and Priority-only diagnosis`, async () => {
  const world = createWorld(); loadWorker(world);
  const content = load(world, { dataTheme: 'dark', ...(scenario.html ? { html: scenario.html } : {}), beforeScripts({ document, window }) {
    document.documentElement.lang = scenario.lang ?? 'en'; scenario.mutate?.(document);
    if (scenario.frame) Object.defineProperty(window, 'top', { value: {}, configurable: true });
  } });
  await new Promise(resolve => setTimeout(resolve, 150)); await settle();
  const before = await status(world);
  expect(before).toMatchObject({ diagnosis: scenario.diagnosis, reason: scenario.reason });
  expect(markers(content.document)).toHaveLength(scenario.count);
  content.probe.reset();
  expect(await saveTheme(world, 'zhroma-colourblind-safe')).toMatchObject({ outcome: 'saved' }); await settle();
  expectPalette(content, 'zhroma-colourblind-safe', 'dark'); expectNoRowWork(content);
  expect(await status(world)).toEqual(before); expect(markers(content.document)).toHaveLength(scenario.count);
  expect(world.forbidden).toEqual([]);
});

for (const name of ['zendesk-rules-dark-table', 'zendesk-view-grouped-long']) test(`dark ${name} preserves direct-cell, group, head, sticky and native-state ownership`, async () => {
  const world = createWorld(); loadWorker(world);
  const content = load(world, { html: fixtureFile(name), dataTheme: 'dark', beforeScripts({ document }) {
    const row = document.querySelector('tr[data-garden-id="tables.row"]');
    if (name === 'zendesk-view-grouped-long') {
      // This historical shape fixture retains redacted priority stand-ins.
      // Seed recognized values as its existing parity/group guardians do.
      for (const ticket of document.querySelectorAll('tr[data-garden-id="tables.row"]')) ticket.children[6].textContent = 'Low';
    }
    row.style.backgroundColor = 'rgb(36, 44, 51)'; row.style.outline = '2px solid rgb(216, 220, 222)'; row.setAttribute('aria-selected', 'true');
    document.querySelector('thead').style.position = 'sticky';
  } });
  await settle();
  expect(markers(content.document).length).toBeGreaterThan(0);
  const body = content.document.body.innerHTML;
  const css = [...content.document.styleSheets].flatMap(sheet => [...sheet.cssRules]);
  expect(css).toHaveLength(4);
  for (const rule of css) {
    expect(rule.selectorText).toMatch(/> tbody.*> tr.*> td/s);
    expect(rule.selectorText).not.toMatch(/hover|focus|selected|group_row|thead/);
    expect(rule.style.length).toBe(1); expect(rule.style.item(0)).toBe('background-color');
  }
  content.probe.reset();
  expect(await saveTheme(world, 'zhroma-gruvbox')).toMatchObject({ outcome: 'saved' }); await settle();
  expectNoRowWork(content); expect(content.document.body.innerHTML).toBe(body);
  expect(content.document.querySelectorAll('thead [data-zhroma-priority], tr[data-garden-id="tables.group_row"][data-zhroma-priority]')).toHaveLength(0);
  expect(content.document.querySelector('thead').style.position).toBe('sticky');
  expect(world.forbidden).toEqual([]);
});
