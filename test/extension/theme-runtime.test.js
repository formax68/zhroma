// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { closeWindows, createWorld, loadContent, loadWorker, markers, settle } from './tracer-world.js';

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
