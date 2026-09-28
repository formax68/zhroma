// @vitest-environment node
//
// The shared settings module (07-03, D-08 to D-15): one frozen global, a key
// registry with exactly one shipped key, a resolver that treats every stored
// value as untrusted input and never writes it back, and the loaders that put
// the module first in the content world and the worker, the way Chrome does.
import { createContext, Script } from 'node:vm';
import { afterEach, expect, test, vi } from 'vitest';
import {
  COPY, ICON, NAMESPACE, TAB_ID, asset, closeWindows, control, createWorld, flip, loadContent, loadPopup, loadWorker,
  markers, settle,
} from './tracer-world.js';

afterEach(async () => { vi.useRealTimers(); await closeWindows(); });

const SOURCE = asset('zhroma-settings.js');
const bare = () => createContext({}, { codeGeneration: { strings: false, wasm: false } });
function load(context = bare()) {
  new Script(SOURCE, { filename: 'zhroma-settings.js' }).runInContext(context);
  return context;
}
const settingsOf = (context) => context[NAMESPACE].settings;
// Copy a value out of the module's realm so equality checks compare data only.
const plain = (value) => JSON.parse(JSON.stringify(value));
function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const key of Reflect.ownKeys(value)) deepFreeze(value[key]);
    Object.freeze(value);
  }
  return value;
}

// --- the namespace ---------------------------------------------------------

test('loading the shipped file adds exactly one global, Zhroma, bound non-writable and non-configurable', () => {
  const context = bare();
  const before = Object.keys(context);
  load(context);
  expect(Object.keys(context)).toEqual([...before, NAMESPACE]);
  expect(NAMESPACE).toBe('Zhroma');
  const binding = Object.getOwnPropertyDescriptor(context, NAMESPACE);
  expect([binding.enumerable, binding.writable, binding.configurable]).toEqual([true, false, false]);
  const member = Object.getOwnPropertyDescriptor(context[NAMESPACE], 'settings');
  expect([member.enumerable, member.writable, member.configurable]).toEqual([true, false, false]);
  // The namespace stays extensible so later shared files attach their own
  // members the same way; `settings` itself is frozen all the way down.
  expect(Object.isExtensible(context[NAMESPACE])).toBe(true);
  const settings = settingsOf(context);
  expect(Object.keys(settings).sort()).toEqual(['ENTRIES', 'STATUSES', 'THEME_IDS', 'define', 'registry']);
  for (const value of [settings, settings.STATUSES, settings.THEME_IDS, settings.ENTRIES, settings.ENTRIES[0],
    settings.ENTRIES[0].migrations, settings.registry, settings.registry.keys]) expect(Object.isFrozen(value)).toBe(true);
  expect(() => new Script("'use strict'; Zhroma = {};").runInContext(context)).toThrow();
  expect(() => new Script("'use strict'; Zhroma.settings = {};").runInContext(context)).toThrow();
  expect(() => new Script("'use strict'; delete Zhroma.settings;").runInContext(context)).toThrow();
  expect(settingsOf(context)).toBe(settings);
});

test('evaluating the file twice changes nothing and throws nothing', () => {
  const context = load();
  const settings = settingsOf(context);
  const keys = Object.keys(context);
  expect(() => load(context)).not.toThrow();
  expect(Object.keys(context)).toEqual(keys);
  expect(settingsOf(context)).toBe(settings);
});

test('an existing namespace from an earlier shared file is reused, not replaced', () => {
  const context = bare();
  const earlier = { colour: Object.freeze({}) };
  Object.defineProperty(context, NAMESPACE, { value: earlier, enumerable: true, writable: false, configurable: false });
  load(context);
  expect(context[NAMESPACE]).toBe(earlier);
  expect(Object.keys(earlier)).toEqual(['colour', 'settings']);
  expect([...settingsOf(context).registry.keys]).toEqual(['theme']);
});

test('the source is a pure classic script: @ts-check first, no module syntax, no page, extension API, storage or timer', () => {
  expect(SOURCE.split('\n')[0]).toBe('// @ts-check');
  expect(() => new Script(SOURCE)).not.toThrow();
  expect(SOURCE).not.toMatch(/^\s*(import|export)\b/mu);
  expect(SOURCE).not.toMatch(/\b(import|require|eval|Function|importScripts)\s*\(/u);
  expect(SOURCE).not.toMatch(/\b(document|window|chrome|browser|localStorage|sessionStorage|indexedDB|caches|navigator)\s*[.[(]/u);
  expect(SOURCE).not.toMatch(/\b(setTimeout|setInterval|requestAnimationFrame|queueMicrotask|fetch|XMLHttpRequest|WebSocket|EventSource)\b/u);
  // Only language built-ins: these are absent from a bare context.
  expect(SOURCE).not.toMatch(/\b(URL|TextEncoder|structuredClone)\b/u);
  expect(SOURCE).not.toMatch(/Object\.assign|\.\.\.\s*(raw|value|payload|entry|current)\b/u);
  for (const word of ["'zhroma-classic'", 'STATUSES', 'define', 'registry', '@typedef']) expect(SOURCE).toContain(word);
});

// --- the shipped registry --------------------------------------------------

test('the shipped registry holds exactly the theme key, Classic only, with no rules or identity key (D-13 to D-15)', () => {
  const settings = settingsOf(load());
  const { registry } = settings;
  expect([...registry.keys]).toEqual(['theme']);
  expect([...settings.STATUSES]).toEqual(['default', 'stored', 'unreadable']);
  expect([...settings.THEME_IDS]).toEqual(['zhroma-classic']);
  expect(settings.ENTRIES).toHaveLength(1);
  const [theme] = settings.ENTRIES;
  expect([theme.key, theme.version, theme.cas, theme.maxBytes, theme.defaultValue])
    .toEqual(['theme', 1, false, 128, 'zhroma-classic']);
  expect(Object.keys(theme.migrations)).toEqual([]);
  for (const key of ['rules', 'identity', 'enabled', '__proto__', 'toString', 'constructor', 1, null]) {
    expect(registry.has(key), String(key)).toBe(false);
  }
  expect(registry.has('theme')).toBe(true);
  expect(registry.cas('theme')).toBe(false);
  expect(registry.defaultOf('theme')).toBe('zhroma-classic');
  expect(() => registry.resolve('rules', false)).toThrow(/unknown key/);
  expect(() => registry.encode('enabled', true)).toThrow(/unknown key/);
});

test('an absent theme resolves to Classic by default, and the stored Classic form resolves as stored', () => {
  const { registry } = settingsOf(load());
  const absent = registry.resolve('theme', false);
  expect(plain(absent)).toEqual({ value: 'zhroma-classic', status: 'default', revision: 0 });
  expect(Object.isFrozen(absent)).toBe(true);
  const raw = deepFreeze({ v: 1, id: 'zhroma-classic' });
  const stored = registry.resolve('theme', true, raw);
  expect(plain(stored)).toEqual({ value: 'zhroma-classic', status: 'stored', revision: 0 });
  expect(Object.isFrozen(stored)).toBe(true);
  expect(stored).not.toBe(raw);
  expect(raw).toEqual({ v: 1, id: 'zhroma-classic' });
});

const REJECTED = [
  ['null', null],
  ['a bare string', 'zhroma-classic'],
  ['a number', 1],
  ['an empty object', {}],
  ['a missing id', { v: 1 }],
  ['an unknown id', { v: 1, id: 'zhroma-dark' }],
  ['a non-string id', { v: 1, id: ['zhroma-classic'] }],
  ['an extra key', { v: 1, id: 'zhroma-classic', extra: true }],
  ['an extra key holding undefined', { v: 1, id: 'zhroma-classic', extra: undefined }],
  ['a rev on a key without compare-and-swap', { v: 1, rev: 1, id: 'zhroma-classic' }],
  ['an own __proto__ key', JSON.parse('{"v":1,"id":"zhroma-classic","__proto__":{}}')],
  ['a missing v', { id: 'zhroma-classic' }],
  ['v of 0', { v: 0, id: 'zhroma-classic' }],
  ['v of 1.5', { v: 1.5, id: 'zhroma-classic' }],
  ["v of '1'", { v: '1', id: 'zhroma-classic' }],
  ['a newer v', { v: 2, id: 'zhroma-classic' }],
  ['an oversized value', { v: 1, id: 'zhroma-classic'.repeat(12) }],
  ['an array', [{ v: 1, id: 'zhroma-classic' }]],
  ['a date', new Date(0)],
  ['a non-enumerable extra key', Object.defineProperty({ v: 1, id: 'zhroma-classic' }, 'hidden', { value: 1 })],
];

test.each(REJECTED)('%s resolves to the Classic default as unreadable, without touching the stored value', (_name, raw) => {
  const { registry } = settingsOf(load());
  const before = JSON.stringify(raw);
  const result = registry.resolve('theme', true, raw);
  expect(plain(result)).toEqual({ value: 'zhroma-classic', status: 'unreadable', revision: 0 });
  expect(Object.isFrozen(result)).toBe(true);
  expect(JSON.stringify(raw)).toBe(before);
  // A deep-frozen copy resolves the same way, wherever cloning keeps every own key.
  if (raw !== null && typeof raw === 'object' && !(raw instanceof Date)) {
    const copy = structuredClone(raw);
    if (Reflect.ownKeys(copy).length === Reflect.ownKeys(raw).length) {
      expect(plain(registry.resolve('theme', true, deepFreeze(copy)))).toEqual(plain(result));
    }
  }
});

test('an own __proto__ key never becomes a prototype and never reaches the parse function as anything but a key', () => {
  const settings = settingsOf(load());
  const seen = [];
  const probe = {
    key: 'probe', version: 1, cas: false, maxBytes: 128, defaultValue: 'a', migrations: {},
    parse: (payload) => { seen.push([Object.getPrototypeOf(payload), Object.keys(payload)]); return Object.keys(payload).length === 1 ? payload.id : undefined; },
    fields: (value) => ({ id: value }),
  };
  const registry = settings.define([probe]);
  seen.length = 0;
  const raw = JSON.parse('{"v":1,"id":"a","__proto__":{"id":"b"}}');
  expect(registry.resolve('probe', true, raw).status).toBe('unreadable');
  expect(seen).toEqual([[null, ['id', '__proto__']]]);
  expect(Object.getPrototypeOf(raw)).toBe(Object.prototype);
});

// --- versions, migration and compare-and-swap (D-10, D-16) ------------------

function noteEntry(migrate = (old) => ({ v: 2, rev: old.rev, text: old.body })) {
  return {
    key: 'note', version: 2, cas: true, maxBytes: 256, defaultValue: '',
    parse: (payload) => (Object.keys(payload).length === 1 && typeof payload.text === 'string' ? payload.text : undefined),
    fields: (value) => ({ text: value }),
    migrations: { 1: migrate },
  };
}

test('adding a key is one entry: define accepts an injected entry next to the shipped ones', () => {
  const settings = settingsOf(load());
  const registry = settings.define([...settings.ENTRIES, noteEntry()]);
  expect([...registry.keys]).toEqual(['note', 'theme']);
  expect(registry.cas('note')).toBe(true);
  expect(plain(registry.resolve('theme', false))).toEqual({ value: 'zhroma-classic', status: 'default', revision: 0 });
  expect(plain(registry.resolve('note', false))).toEqual({ value: '', status: 'default', revision: 0 });
  // The shipped registry is untouched.
  expect([...settings.registry.keys]).toEqual(['theme']);
});

test('an older stored version migrates in memory only, and the stored object is left unchanged', () => {
  const settings = settingsOf(load());
  const migrate = vi.fn((old) => ({ v: 2, rev: old.rev, text: old.body }));
  const registry = settings.define([noteEntry(migrate)]);
  const raw = deepFreeze({ v: 1, rev: 3, body: 'hello' });
  expect(plain(registry.resolve('note', true, raw))).toEqual({ value: 'hello', status: 'stored', revision: 3 });
  expect(migrate).toHaveBeenCalledOnce();
  expect(migrate.mock.calls[0][0]).not.toBe(raw);
  expect(raw).toEqual({ v: 1, rev: 3, body: 'hello' });
  // A migration that mutates what it is given still cannot reach the stored value.
  const mutating = settings.define([noteEntry((old) => { old.body = 'changed'; delete old.rev; return { v: 2, text: 'x' }; })]);
  const open = { v: 1, rev: 2, body: 'kept' };
  expect(mutating.resolve('note', true, open).status).toBe('stored');
  expect(open).toEqual({ v: 1, rev: 2, body: 'kept' });
});

test('a newer stored version is unreadable and is never migrated down', () => {
  const settings = settingsOf(load());
  const migrate = vi.fn();
  const registry = settings.define([noteEntry(migrate)]);
  const raw = deepFreeze({ v: 3, rev: 5, text: 'from the future' });
  expect(plain(registry.resolve('note', true, raw))).toEqual({ value: '', status: 'unreadable', revision: 0 });
  expect(migrate).not.toHaveBeenCalled();
  expect(raw).toEqual({ v: 3, rev: 5, text: 'from the future' });
});

test.each([
  ['throws', () => { throw new Error('broken'); }],
  ['returns the wrong version', (old) => ({ v: 3, rev: old.rev, text: old.body })],
  ['returns no version', (old) => ({ text: old.body })],
  ['returns an array', () => [2]],
  ['returns a value parse rejects', (old) => ({ v: 2, rev: old.rev, text: 7 })],
])('a migration that %s leaves the value unreadable', (_name, migrate) => {
  const registry = settingsOf(load()).define([noteEntry(migrate)]);
  expect(plain(registry.resolve('note', true, { v: 1, rev: 1, body: 'x' })))
    .toEqual({ value: '', status: 'unreadable', revision: 0 });
});

test('a missing migration step leaves the value unreadable', () => {
  const entry = { ...noteEntry(), version: 3, migrations: { 2: (old) => ({ v: 3, rev: old.rev, text: old.text }) } };
  const registry = settingsOf(load()).define([entry]);
  expect(registry.resolve('note', true, { v: 1, rev: 1, body: 'x' }).status).toBe('unreadable');
  expect(plain(registry.resolve('note', true, { v: 2, rev: 4, text: 'y' }))).toEqual({ value: 'y', status: 'stored', revision: 4 });
});

test('the revision comes from a valid rev on compare-and-swap keys, and is otherwise 0', () => {
  const registry = settingsOf(load()).define([noteEntry()]);
  expect(registry.resolve('note', true, { v: 2, rev: 9, text: 'a' }).revision).toBe(9);
  for (const rev of [0, -1, 1.5, '9', null]) {
    expect(plain(registry.resolve('note', true, { v: 2, rev, text: 'a' })), String(rev)).toEqual({ value: 'a', status: 'stored', revision: 0 });
  }
  expect(registry.resolve('note', true, { v: 2, text: 'a' }).revision).toBe(0);
});

test('the size cap counts UTF-8 bytes of the stored JSON, including astral characters', () => {
  const registry = settingsOf(load()).define([noteEntry()]);
  // `{"v":2,"rev":1,"text":""}` is 25 bytes; the cap is 256.
  const form = (text) => ({ v: 2, rev: 1, text });
  expect(registry.resolve('note', true, form('é'.repeat(115))).status).toBe('stored'); // 255 bytes
  expect(registry.resolve('note', true, form('é'.repeat(116))).status).toBe('unreadable'); // 257 bytes, 141 chars
  expect(registry.resolve('note', true, form('\u{1F600}'.repeat(57))).status).toBe('stored'); // 253 bytes
  expect(registry.resolve('note', true, form('\u{1F600}'.repeat(58))).status).toBe('unreadable'); // 257 bytes
  expect(registry.resolve('note', true, form('a'.repeat(231))).status).toBe('stored'); // 256 bytes
  expect(registry.resolve('note', true, form('a'.repeat(232))).status).toBe('unreadable');
});

// --- define rejects malformed entries --------------------------------------

const base = () => noteEntry();
test.each([
  ['a non-array', () => base()],
  ['a non-object entry', () => ['theme']],
  ['the reserved key enabled', () => [{ ...base(), key: 'enabled' }]],
  ['a duplicate key', () => [base(), base()]],
  ['an upper-case key', () => [{ ...base(), key: 'Note' }]],
  ['a key starting with a digit', () => [{ ...base(), key: '1note' }]],
  ['a key with a dash', () => [{ ...base(), key: 'my-note' }]],
  ['a key of 33 characters', () => [{ ...base(), key: `n${'a'.repeat(32)}` }]],
  ['a non-string key', () => [{ ...base(), key: 7 }]],
  ['version 0', () => [{ ...base(), version: 0 }]],
  ['version 1.5', () => [{ ...base(), version: 1.5 }]],
  ["version '2'", () => [{ ...base(), version: '2' }]],
  ['a non-boolean cas', () => [{ ...base(), cas: 'yes' }]],
  ['maxBytes 0', () => [{ ...base(), maxBytes: 0 }]],
  ['a fractional maxBytes', () => [{ ...base(), maxBytes: 10.5 }]],
  ['a missing parse function', () => [{ ...base(), parse: undefined }]],
  ['a missing fields function', () => [{ ...base(), fields: 'text' }]],
  ['missing migrations', () => [{ ...base(), migrations: undefined }]],
  ['a migration from 0', () => [{ ...base(), migrations: { 0: () => ({}) } }]],
  ['a migration from the current version', () => [{ ...base(), migrations: { 2: () => ({}) } }]],
  ['a non-integer migration key', () => [{ ...base(), migrations: { '1.0': () => ({}) } }]],
  ['a non-function migration', () => [{ ...base(), migrations: { 1: 'up' } }]],
  ['a default that parse rejects', () => [{ ...base(), defaultValue: 7 }]],
  ['a default that fields cannot express', () => [{ ...base(), fields: () => ({ v: 1 }) }]],
  ['a default larger than the cap', () => [{ ...base(), maxBytes: 8 }]],
])('define throws a TypeError for %s', (_name, make) => {
  const { define } = settingsOf(load());
  let error;
  try { define(make()); } catch (caught) { error = caught; }
  expect(error?.name).toBe('TypeError');
  expect(error?.message).toMatch(/^Zhroma settings: /);
});

// --- encode, parseValue and equal ------------------------------------------

test('encode builds a fresh stored form in the order v, rev, fields, and refuses anything a read would not accept', () => {
  const settings = settingsOf(load());
  const { registry } = settings;
  const classic = registry.encode('theme', 'zhroma-classic');
  expect(Object.keys(classic)).toEqual(['v', 'id']);
  expect(plain(classic)).toEqual({ v: 1, id: 'zhroma-classic' });
  expect(registry.encode('theme', 'zhroma-classic')).not.toBe(classic);
  expect(registry.resolve('theme', true, classic).status).toBe('stored');
  for (const value of ['zhroma-dark', '', null, undefined, 1, { id: 'zhroma-classic' }]) {
    expect(registry.encode('theme', value), String(value)).toBeUndefined();
  }
  const notes = settings.define([noteEntry()]);
  const stored = notes.encode('note', 'hi', 4);
  expect(Object.keys(stored)).toEqual(['v', 'rev', 'text']);
  expect(plain(stored)).toEqual({ v: 2, rev: 4, text: 'hi' });
  for (const revision of [undefined, 0, 1.5, '4']) expect(notes.encode('note', 'hi', revision), String(revision)).toBeUndefined();
  expect(notes.encode('note', 'a'.repeat(300), 1)).toBeUndefined();
});

test('parseValue returns the effective value or undefined, and equal compares stored fields', () => {
  const { registry } = settingsOf(load());
  expect(registry.parseValue('theme', 'zhroma-classic')).toBe('zhroma-classic');
  for (const value of ['zhroma-dark', null, 7, ['zhroma-classic']]) expect(registry.parseValue('theme', value)).toBeUndefined();
  expect(registry.equal('theme', 'zhroma-classic', 'zhroma-classic')).toBe(true);
  expect(registry.equal('theme', 'zhroma-classic', 'zhroma-dark')).toBe(false);
});

// --- the module in the content world and the worker ------------------------

test('the content world and the worker both load the module first, as Chrome does, with nothing forbidden', async () => {
  const world = createWorld();
  const worker = loadWorker(world);
  const content = loadContent(world);
  await settle();
  expect([...content.context[NAMESPACE].settings.registry.keys]).toEqual(['theme']);
  expect([...worker.context[NAMESPACE].settings.registry.keys]).toEqual(['theme']);
  expect(Object.keys(content.context)).toEqual([...content.before, NAMESPACE]);
  expect(Object.keys(worker.context)).toEqual([...worker.before, NAMESPACE]);
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.forbidden).toEqual([]);
});

test('the worker double refuses to import anything but a packaged top-level script', () => {
  const world = createWorld();
  const worker = loadWorker(world);
  for (const path of ['background.js', '../content.js', 'icons/brand.png', 'https://a.test/x.js', 'missing.js']) {
    expect(() => worker.context.importScripts(path), path).toThrow();
  }
  expect(world.forbidden).toEqual([
    'importScripts background.js', 'importScripts ../content.js', 'importScripts icons/brand.png',
    'importScripts https://a.test/x.js', 'importScripts missing.js',
  ]);
  expect(() => loadWorker(createWorld(), { imports: 'sometimes' })).toThrow(/Unknown import mode/);
});

test('with the import failing, the worker still projects the working toolbar and still saves the off switch', async () => {
  const world = createWorld();
  const worker = loadWorker(world, { imports: 'throws' });
  expect(Object.hasOwn(worker.context, NAMESPACE)).toBe(false);
  const content = loadContent(world);
  await settle();
  const popup = loadPopup(world);
  await settle();
  await settle();
  expect(markers(content.document)).toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(world.action()).toEqual({ icon: 'icons/working.png', title: COPY.working });
  await flip(popup, false);
  expect(world.getStored('enabled')).toBe(false);
  expect(control(popup.document).checked).toBe(false);
  expect(markers(content.document)).toEqual([]);
  expect(world.action(TAB_ID)).toEqual({ icon: ICON.off, title: COPY.off });
  expect(world.forbidden).toEqual([]);
});
