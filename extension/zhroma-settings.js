// @ts-check
// Zhroma shared settings module.
//
// A shared classic script: no import, no export, one global named `Zhroma`.
// It is pure. It touches no page, no extension API and no storage, and it
// starts no timer. It only describes which settings exist, what their stored
// form looks like, and how a stored value resolves to the value in effect.
//
// It is loaded three ways, always before the code that uses it: first in the
// manifest's content_scripts[0].js, by the worker's importScripts as that
// file's first statement, and by a script tag in extension pages.
//
// Every stored value is untrusted input. Any version of Zhroma, or corruption,
// may have written it. Resolving a value never writes, repairs or deletes it:
// an unreadable value resolves to the default and stays exactly as stored
// until the agent saves that setting (D-08, D-10).
(() => {
  'use strict';

  /**
   * How a resolved setting was obtained. A finite internal fact with no
   * user-visible text in Phase 7 (D-12).
   * @typedef {'default' | 'stored' | 'unreadable'} SettingStatus
   */

  /**
   * One registered setting. Adding a key means adding one of these and its
   * tests, with no change to the reader or the queue (D-15).
   * @typedef {object} SettingEntry
   * @property {string} key Storage key, `^[a-z][A-Za-z0-9]{0,31}$`, never `enabled`.
   * @property {number} version Current schema version of the stored form, a positive integer.
   * @property {boolean} cas Whether the stored form carries a `rev` for compare-and-swap (D-16).
   * @property {number} maxBytes Largest accepted stored form, in UTF-8 bytes of its JSON.
   * @property {unknown} defaultValue The value in effect when the key is absent or unreadable.
   * @property {(payload: Record<string, unknown>) => unknown} parse Returns the effective value for a
   *   payload (the stored form without `v`, and without `rev` for cas keys), or undefined to reject it.
   * @property {(value: any) => Record<string, unknown>} fields Returns a fresh payload for a value.
   * @property {Record<string, (stored: Record<string, unknown>) => Record<string, unknown>>} migrations
   *   Keyed by the version migrated FROM; each returns the stored form at the next version.
   */

  /**
   * A resolved setting. Always a fresh frozen object.
   * @typedef {object} Resolved
   * @property {unknown} value The value in effect.
   * @property {SettingStatus} status How the value was obtained.
   * @property {number} revision The stored `rev` for cas keys when valid, otherwise 0.
   */

  /**
   * @typedef {object} Registry
   * @property {readonly string[]} keys Registered keys, sorted.
   * @property {(key: unknown) => boolean} has
   * @property {(key: string) => boolean} cas
   * @property {(key: string) => unknown} defaultOf
   * @property {(key: string, present: boolean, raw?: unknown) => Resolved} resolve
   * @property {(key: string, value: unknown) => unknown} parseValue
   * @property {(key: string, value: unknown, revision?: number) => Record<string, unknown> | undefined} encode
   * @property {(key: string, a: unknown, b: unknown) => boolean} equal
   */

  const root = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (globalThis));
  const NAMESPACE = 'Zhroma';

  /** @type {Record<string, unknown>} */
  let namespace;
  if (Object.hasOwn(root, NAMESPACE)) {
    const existing = root[NAMESPACE];
    if (existing === null || typeof existing !== 'object') return;
    namespace = /** @type {Record<string, unknown>} */ (existing);
  } else {
    namespace = {};
    Object.defineProperty(root, NAMESPACE, { value: namespace, enumerable: true, writable: false, configurable: false });
  }
  // Loaded twice (a page listing it twice, a worker importing it again):
  // the first load wins and nothing changes.
  if (Object.hasOwn(namespace, 'settings')) return;

  /** @type {readonly SettingStatus[]} */
  const STATUSES = Object.freeze(/** @type {SettingStatus[]} */ (['default', 'stored', 'unreadable']));
  // Phase 7 ships exactly one theme, the 0.1.0 palette. Phase 8 extends this.
  const THEME_IDS = Object.freeze(['zhroma-classic']);
  const KEY_PATTERN = /^[a-z][A-Za-z0-9]{0,31}$/;
  // The off switch keeps its own key, boolean and path. It is never folded
  // into the settings registry (D-02).
  const RESERVED_KEYS = Object.freeze(['enabled']);
  const ENVELOPE_KEYS = Object.freeze(['v', 'rev']);

  /** @param {unknown} value @returns {value is Record<string, unknown>} */
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  /** @param {unknown} value @param {readonly string[]} keys */
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
  // A plain data object from any realm: its prototype is null or a root
  // prototype. Arrays, dates, maps and class instances are refused.
  /** @param {unknown} value @returns {value is Record<string, unknown>} */
  const isPlain = (value) => {
    if (!isObject(value)) return false;
    const proto = Object.getPrototypeOf(value);
    return proto === null || Object.getPrototypeOf(proto) === null;
  };
  /** @param {unknown} value @returns {value is number} */
  const isPositiveInteger = (value) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;

  // UTF-8 length of a string, counted by hand with language built-ins only.
  // JSON.stringify escapes lone surrogates, so its output is well formed.
  /** @param {string} text */
  function utf8Length(text) {
    let bytes = 0;
    for (let index = 0; index < text.length; index += 1) {
      const code = text.charCodeAt(index);
      if (code < 0x80) bytes += 1;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff && index + 1 < text.length) {
        const next = text.charCodeAt(index + 1);
        if (next >= 0xdc00 && next <= 0xdfff) { bytes += 4; index += 1; } else bytes += 3;
      } else bytes += 3;
    }
    return bytes;
  }

  // JSON text of a value, or undefined when it has none or cannot be encoded.
  /** @param {unknown} value @returns {string | undefined} */
  function jsonOf(value) {
    try {
      const text = JSON.stringify(value);
      return typeof text === 'string' ? text : undefined;
    } catch {
      return undefined;
    }
  }

  // A fresh null-prototype object holding `source`'s own keys minus `omit`.
  // Defined, never assigned, so an own `__proto__` key stays an own key and
  // can never become a prototype.
  /** @param {Record<string, unknown>} source @param {readonly string[]} omit */
  function ownCopy(source, omit) {
    /** @type {Record<string, unknown>} */
    const copy = Object.create(null);
    for (const key of Object.keys(source)) {
      if (omit.includes(key)) continue;
      Object.defineProperty(copy, key, { value: source[key], enumerable: true, writable: true, configurable: true });
    }
    return copy;
  }

  /** @param {string} message @returns {never} */
  const refuse = (message) => { throw new TypeError(`Zhroma settings: ${message}`); };

  /**
   * Validate `entries` and build a frozen registry over private copies of them.
   * @param {readonly SettingEntry[]} entries
   * @returns {Registry}
   */
  function define(entries) {
    if (!Array.isArray(entries)) refuse('entries must be an array');
    /** @type {Record<string, SettingEntry>} */
    const table = Object.create(null);
    for (const candidate of /** @type {readonly unknown[]} */ (entries)) {
      if (!isPlain(candidate)) refuse('an entry must be a plain object');
      const entry = /** @type {Record<string, unknown>} */ (candidate);
      const { key, version, cas, maxBytes, parse, fields, migrations } = entry;
      if (typeof key !== 'string' || !KEY_PATTERN.test(key)) refuse('invalid key');
      const name = /** @type {string} */ (key);
      if (RESERVED_KEYS.includes(name)) refuse(`reserved key ${name}`);
      if (Object.hasOwn(table, name)) refuse(`duplicate key ${name}`);
      if (!isPositiveInteger(version)) refuse(`${name}: version must be a positive integer`);
      if (typeof cas !== 'boolean') refuse(`${name}: cas must be a boolean`);
      if (!isPositiveInteger(maxBytes)) refuse(`${name}: maxBytes must be a positive integer`);
      if (typeof parse !== 'function') refuse(`${name}: parse must be a function`);
      if (typeof fields !== 'function') refuse(`${name}: fields must be a function`);
      if (!isPlain(migrations)) refuse(`${name}: migrations must be a plain object`);
      const steps = /** @type {Record<string, unknown>} */ (migrations);
      /** @type {SettingEntry['migrations']} */
      const ownSteps = Object.create(null);
      for (const from of Object.keys(steps)) {
        const number = Number(from);
        if (String(number) !== from || !isPositiveInteger(number) || number > /** @type {number} */ (version) - 1) {
          refuse(`${name}: migration from ${from} is outside 1 to ${/** @type {number} */ (version) - 1}`);
        }
        if (typeof steps[from] !== 'function') refuse(`${name}: migration from ${from} must be a function`);
        ownSteps[from] = /** @type {SettingEntry['migrations'][string]} */ (steps[from]);
      }
      /** @type {SettingEntry} */
      const record = Object.freeze({
        key: name,
        version: /** @type {number} */ (version),
        cas: /** @type {boolean} */ (cas),
        maxBytes: /** @type {number} */ (maxBytes),
        defaultValue: entry.defaultValue,
        parse: /** @type {SettingEntry['parse']} */ (parse),
        fields: /** @type {SettingEntry['fields']} */ (fields),
        migrations: Object.freeze(ownSteps),
      });
      const payload = payloadOf(record, record.defaultValue);
      if (payload === undefined) refuse(`${name}: the default value has no valid fields`);
      const parsed = safeParse(record, /** @type {Record<string, unknown>} */ (payload));
      if (parsed === undefined || !sameFields(record, parsed, record.defaultValue)) {
        refuse(`${name}: the default value does not survive parse(fields(default))`);
      }
      table[name] = record;
    }
    // Every entry must also encode within its own size cap.
    const registry = build(table);
    for (const key of registry.keys) {
      if (registry.encode(key, registry.defaultOf(key), 1) === undefined) refuse(`${key}: the default value cannot be stored`);
    }
    return registry;
  }

  // The fields of `value` as a fresh JSON-round-tripped payload, or undefined
  // when `fields` throws, returns something that is not a plain data object,
  // or claims an envelope key.
  /** @param {SettingEntry} entry @param {unknown} value @returns {Record<string, unknown> | undefined} */
  function payloadOf(entry, value) {
    let produced;
    try { produced = entry.fields(value); } catch { return undefined; }
    if (!isPlain(produced)) return undefined;
    if (ENVELOPE_KEYS.some((key) => Object.hasOwn(produced, key))) return undefined;
    const text = jsonOf(produced);
    if (text === undefined) return undefined;
    const copy = JSON.parse(text);
    if (!isPlain(copy) || Object.keys(copy).length !== Object.keys(produced).length) return undefined;
    return ownCopy(copy, []);
  }

  /** @param {SettingEntry} entry @param {Record<string, unknown>} payload */
  function safeParse(entry, payload) {
    try { return entry.parse(payload); } catch { return undefined; }
  }

  /** @param {SettingEntry} entry @param {unknown} a @param {unknown} b */
  function sameFields(entry, a, b) {
    const left = payloadOf(entry, a);
    const right = payloadOf(entry, b);
    return left !== undefined && right !== undefined && jsonOf(left) === jsonOf(right);
  }

  /** @param {Record<string, SettingEntry>} table @returns {Registry} */
  function build(table) {
    const keys = Object.freeze(Object.keys(table).sort());

    /** @param {unknown} key */
    const has = (key) => typeof key === 'string' && Object.hasOwn(table, key);
    /** @param {string} key */
    const entryOf = (key) => (has(key) ? table[key] : refuse(`unknown key ${String(key)}`));

    /** @param {unknown} value @param {SettingStatus} status @param {number} revision @returns {Resolved} */
    const resolved = (value, status, revision) => Object.freeze({ value, status, revision });

    /**
     * The value in effect for `key`. `present` says whether storage holds the
     * key at all; `raw` is what it holds. Never mutates or returns `raw`.
     * @param {string} key @param {boolean} present @param {unknown} [raw] @returns {Resolved}
     */
    function resolve(key, present, raw) {
      const entry = entryOf(key);
      if (present !== true) return resolved(entry.defaultValue, 'default', 0);
      const unreadable = resolved(entry.defaultValue, 'unreadable', 0);
      // Anything that throws while inspecting the stored value is unreadable too.
      try { return inspect(entry, raw, unreadable); } catch { return unreadable; }
    }

    /** @param {SettingEntry} entry @param {unknown} raw @param {Resolved} unreadable @returns {Resolved} */
    function inspect(entry, raw, unreadable) {
      if (!isPlain(raw)) return unreadable;
      // Symbol or non-enumerable own keys are not stored data.
      if (Reflect.ownKeys(raw).length !== Object.keys(raw).length) return unreadable;
      const text = jsonOf(raw);
      if (text === undefined || utf8Length(text) > entry.maxBytes) return unreadable;
      // Work on a deep copy from here on, so nothing below can touch `raw`.
      let current = JSON.parse(text);
      if (!isPlain(current) || Object.keys(current).length !== Object.keys(raw).length) return unreadable;
      const version = current.v;
      if (!isPositiveInteger(version) || version > entry.version) return unreadable;
      const rev = entry.cas && isPositiveInteger(current.rev) ? current.rev : 0;
      // Older forms migrate in memory, one step at a time. The migrated form
      // is written only when the agent next saves this setting (D-10).
      for (let from = version; from < entry.version; from += 1) {
        const step = Object.hasOwn(entry.migrations, String(from)) ? entry.migrations[String(from)] : undefined;
        if (step === undefined) return unreadable;
        let next;
        try { next = step(current); } catch { return unreadable; }
        if (!isPlain(next) || next.v !== from + 1) return unreadable;
        const nextText = jsonOf(next);
        if (nextText === undefined) return unreadable;
        current = JSON.parse(nextText);
        if (!isPlain(current)) return unreadable;
      }
      const payload = ownCopy(current, entry.cas ? ENVELOPE_KEYS : ['v']);
      const value = safeParse(entry, payload);
      if (value === undefined) return unreadable;
      return resolved(value, 'stored', rev);
    }

    /**
     * The effective value `value` would have if stored, or undefined when it is not valid.
     * @param {string} key @param {unknown} value
     */
    function parseValue(key, value) {
      const entry = entryOf(key);
      const payload = payloadOf(entry, value);
      return payload === undefined ? undefined : safeParse(entry, payload);
    }

    /**
     * A fresh stored form for `value`: `v`, then `rev` for cas keys, then the
     * fields. Undefined when the value is invalid, the revision is not a
     * positive integer for a cas key, or the form exceeds the size cap.
     * @param {string} key @param {unknown} value @param {number} [revision]
     * @returns {Record<string, unknown> | undefined}
     */
    function encode(key, value, revision) {
      const entry = entryOf(key);
      const parsed = parseValue(key, value);
      if (parsed === undefined) return undefined;
      if (entry.cas && !isPositiveInteger(revision)) return undefined;
      const payload = payloadOf(entry, parsed);
      if (payload === undefined) return undefined;
      /** @type {Record<string, unknown>} */
      const stored = {};
      const put = (/** @type {string} */ name, /** @type {unknown} */ item) => {
        Object.defineProperty(stored, name, { value: item, enumerable: true, writable: true, configurable: true });
      };
      put('v', entry.version);
      if (entry.cas) put('rev', revision);
      for (const name of Object.keys(payload)) put(name, payload[name]);
      const text = jsonOf(stored);
      if (text === undefined || utf8Length(text) > entry.maxBytes) return undefined;
      // What is written must be exactly what a read accepts.
      if (resolve(key, true, stored).status !== 'stored') return undefined;
      return stored;
    }

    /**
     * Whether two values have the same stored fields. Choosing the value
     * already in effect writes nothing (D-11).
     * @param {string} key @param {unknown} a @param {unknown} b
     */
    function equal(key, a, b) {
      return sameFields(entryOf(key), a, b);
    }

    return Object.freeze({
      keys,
      has,
      cas: (/** @type {string} */ key) => entryOf(key).cas,
      defaultOf: (/** @type {string} */ key) => entryOf(key).defaultValue,
      resolve,
      parseValue,
      encode,
      equal,
    });
  }

  /** @type {readonly SettingEntry[]} */
  const ENTRIES = Object.freeze([
    // The one real key in Phase 7 (D-14). Stored as `{ v: 1, id: 'zhroma-classic' }`.
    // Last writer wins: only the popup will write it.
    Object.freeze({
      key: 'theme',
      version: 1,
      cas: false,
      maxBytes: 128,
      defaultValue: 'zhroma-classic',
      parse: (/** @type {Record<string, unknown>} */ payload) => (
        isExact(payload, ['id']) && typeof payload.id === 'string' && THEME_IDS.includes(payload.id) ? payload.id : undefined),
      fields: (/** @type {unknown} */ value) => ({ id: value }),
      migrations: Object.freeze({}),
    }),
  ]);

  Object.defineProperty(namespace, 'settings', {
    value: Object.freeze({ STATUSES, THEME_IDS, ENTRIES, define, registry: define(ENTRIES) }),
    enumerable: true,
    writable: false,
    configurable: false,
  });
})();
