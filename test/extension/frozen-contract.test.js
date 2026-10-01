// @vitest-environment node
//
// FROZEN CONTRACT (07-01, COMPAT-03, D-01, D-26, D-27).
//
// Later phases never edit this file. It guards the promises Zhroma made to the
// store and to its users: one permission, one narrow match pattern, nothing
// exposed to pages or other extensions, no network, no remote code, no sync
// storage and stylesheets that load nothing. Widening anything guarded here is
// not a test edit: it needs a new user decision first.
//
// The versioned v1.0 pins (the manifest deep-equal, the file inventory, the
// hues, the Chrome API allowlist) live in runtime-contract.test.js, where each
// one may be retired or restated in its own commit with a written reason.
//
// Every check runs over the tree a recursive walker discovers, never a hand
// list, so a file added later is covered without touching this file. Every
// pattern is proven, inside its own test, to catch a synthetic violation.
//
// Tightened once more in 07-10, before Phase 7 closed, under UAT 07 test 4
// decision A (WR-06). The tightening adds identifier-level rules over
// comment-stripped scripts and a scheme-relative rule over raw text, on top of
// the call-shaped rules below, which still run unchanged. Nothing was widened,
// and later phases still never edit this file.
import { readFileSync, readdirSync } from 'node:fs';
import { URL } from 'node:url';
import { expect, test } from 'vitest';

const root = new URL('../../extension/', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');

function discover(directory = root, prefix = '') {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory()
      ? discover(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`]))
    .sort();
}

const inventory = discover();
const manifest = JSON.parse(read('manifest.json'));
const withExtension = (...extensions) => inventory.filter((name) => extensions.some((ext) => name.endsWith(ext)));
const scripts = withExtension('.js');
const pages = withExtension('.html');
const stylesheets = withExtension('.css');

test('the walker discovers the shipped tree it guards', () => {
  expect(inventory).toContain('manifest.json');
  expect(scripts.length).toBeGreaterThan(0);
  expect(inventory.every((name) => !name.startsWith('/') && !name.split('/').includes('..'))).toBe(true);
});

test('the permission surface is exactly storage and one Agent Workspace match (D-01)', () => {
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions).toEqual(['storage']);
  for (const key of ['host_permissions', 'optional_permissions', 'optional_host_permissions']) {
    expect(Object.hasOwn(manifest, key), key).toBe(false);
  }
  expect(manifest.content_scripts).toHaveLength(1);
  const [entry] = manifest.content_scripts;
  expect(entry.matches).toEqual(['https://*.zendesk.com/agent/*']);
  expect(entry.all_frames).toBe(false);
  expect(entry.world).toBe('ISOLATED');
  expect(Object.hasOwn(entry, 'exclude_matches') || Object.hasOwn(entry, 'include_globs')).toBe(false);
  expect(Object.hasOwn(entry, 'match_about_blank') || Object.hasOwn(entry, 'match_origin_as_fallback')).toBe(false);
  expect(manifest.minimum_chrome_version).toBe('106');
});

test('nothing is exposed to pages or other extensions, CSP is never relaxed and the store owns updates', () => {
  for (const key of ['web_accessible_resources', 'externally_connectable', 'content_security_policy', 'update_url']) {
    expect(Object.hasOwn(manifest, key), key).toBe(false);
  }
});

// Calls, not words: a comment that names an API is not a use of it.
const NETWORK_CALL = /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\b/u;
const REMOTE_CODE = /\beval\s*\(|\bnew\s+Function\s*\(|\bimport\s*\(/u;
const REMOTE_REFERENCE = /\b(?:https?|wss?):\/\//iu;

test('no shipped script or page opens a network channel or evaluates remote code (D-27)', () => {
  for (const violation of [
    "fetch('/x')", 'window.fetch (url)', 'new XMLHttpRequest()', 'XMLHttpRequest()', 'new WebSocket(u)',
    'WebSocket(u)', 'new EventSource(u)', 'EventSource(u)', 'navigator.sendBeacon(u, d)', 'new WebSocket',
  ]) expect(violation, violation).toMatch(NETWORK_CALL);
  for (const violation of ['eval(code)', 'new Function("return 1")', "import('./x.js')", 'await import (u)']) {
    expect(violation, violation).toMatch(REMOTE_CODE);
  }
  for (const violation of ['"http://a.test"', "'https://a.test/x.js'", 'ws://a.test', 'WSS://a.test']) {
    expect(violation, violation).toMatch(REMOTE_REFERENCE);
  }
  expect('// prose may say fetch, WebSocket or eval without calling them').not.toMatch(NETWORK_CALL);
  expect('// prose may say fetch, WebSocket or eval without calling them').not.toMatch(REMOTE_CODE);

  for (const name of [...scripts, ...pages]) {
    const source = read(name);
    expect(source, name).not.toMatch(NETWORK_CALL);
    expect(source, name).not.toMatch(REMOTE_CODE);
  }
  for (const name of [...scripts, ...pages, ...stylesheets]) expect(read(name), name).not.toMatch(REMOTE_REFERENCE);
});

const SYNC_AREA = /\bstorage\s*(?:\?\.|\.)\s*sync\b|\bstorage\s*(?:\?\.)?\s*\[\s*(['"`])sync\1\s*\]/u;

test('no shipped script or page touches the sync storage area (DATA-01)', () => {
  for (const violation of [
    'chrome.storage.sync.set({})', 'chrome.storage .sync', 'chrome.storage?.sync', "chrome.storage['sync']",
    'chrome.storage["sync"].get()', 'chrome.storage[`sync`]',
  ]) expect(violation, violation).toMatch(SYNC_AREA);
  expect('chrome.storage.local.get({})').not.toMatch(SYNC_AREA);

  for (const name of [...scripts, ...pages]) expect(read(name), name).not.toMatch(SYNC_AREA);
});

const STYLE_LOAD = /url\s*\(|@import\b/iu;
const styleBlocks = (html) => [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/giu)].map(([, css]) => css);

test('stylesheets and page style blocks load nothing (D-26)', () => {
  for (const violation of ['a { background: url(x.png) }', 'a { background: URL( "x.png") }', '@import "x.css";']) {
    expect(violation, violation).toMatch(STYLE_LOAD);
  }
  expect(styleBlocks('<style>a{b:c}</style><p>x</p><STYLE media="x">d{e:url(f)}</STYLE>'))
    .toEqual(['a{b:c}', 'd{e:url(f)}']);
  expect('a { background-color: rgb(1 2 3 / 0.1) }').not.toMatch(STYLE_LOAD);

  for (const name of stylesheets) expect(read(name), name).not.toMatch(STYLE_LOAD);
  for (const name of pages) {
    for (const block of styleBlocks(read(name))) expect(block, name).not.toMatch(STYLE_LOAD);
  }
});

/**
 * Every `importScripts(...)` call in `source`, as its trimmed argument list.
 * The call shape (the name, optional whitespace, an opening parenthesis) is
 * what counts, so a comment that names the function is not a call. The
 * argument text stops at the first closing parenthesis, which makes any
 * computed argument fail the strict name check below rather than slip past it.
 */
function importScriptsArguments(source) {
  return [...source.matchAll(/\bimportScripts\s*\(([^)]*)\)?/gu)]
    .map(([, args]) => args.split(',').map((arg) => arg.trim()));
}

const PACKAGED_SCRIPT = /^'([a-z-]+\.js)'$/u;

function importScriptsViolations(files, readFile, serviceWorker, known) {
  const violations = [];
  for (const name of files) {
    const calls = importScriptsArguments(readFile(name));
    if (calls.length > 0 && name !== serviceWorker) violations.push(`${name}: importScripts outside the worker`);
    for (const args of calls) {
      for (const arg of args) {
        const match = PACKAGED_SCRIPT.exec(arg);
        if (!match) violations.push(`${name}: ${arg}`);
        else if (!known.includes(match[1])) violations.push(`${name}: ${match[1]} is not packaged`);
      }
    }
  }
  return violations;
}

test('importScripts loads only quoted, packaged, relative scripts, and only from the worker (D-26)', () => {
  expect(importScriptsArguments("// the worker never calls importScripts today\nimportScripts('a.js', 'b-c.js');"))
    .toEqual([["'a.js'", "'b-c.js'"]]);
  const synthetic = {
    'worker.js': "importScripts('https://a.test/x.js'); importScripts('../up.js'); importScripts(name);"
      + " importScripts('missing.js'); importScripts(\"double.js\"); importScripts('ok.js');",
    'page.js': "importScripts('ok.js');",
    'ok.js': '',
  };
  expect(importScriptsViolations(Object.keys(synthetic), (name) => synthetic[name], 'worker.js', Object.keys(synthetic)))
    .toEqual([
      "worker.js: 'https://a.test/x.js'", "worker.js: '../up.js'", 'worker.js: name',
      'worker.js: missing.js is not packaged', 'worker.js: "double.js"',
      'page.js: importScripts outside the worker',
    ]);

  const serviceWorker = manifest.background?.service_worker;
  expect(importScriptsViolations([...scripts, ...pages], read, serviceWorker, inventory)).toEqual([]);
});

// Names, not calls (07-10, WR-06). The call-shaped rules above miss any
// indirection between a name and its call: fetch.call, Reflect.apply, bracket
// access, aliasing, destructuring, optional and tagged calls, the comma
// operator. The rules below ban the names themselves, over script text with
// its comments removed, so prose comments stay legal and code does not.
//
// What these rules cannot reach:
// - computed or concatenated names, such as 'fe' + 'tch';
// - escape sequences in identifiers or strings;
// - URLs assembled at run time from page data;
// - regex literals containing a quote, /* or //, which this lexer-free
//   stripper can mis-pair.
// By design:
// - prose inside template literals is scanned whole, so it must avoid the
//   banned words;
// - comparing a storage area name with the string 'sync' trips the sync rule
//   (compare with 'local' instead);
// - a string that begins with two slashes trips the scheme-relative rule.
const NETWORK_NAMES = [
  'fetch', 'fetchLater', 'XMLHttpRequest', 'WebSocket', 'WebSocketStream', 'EventSource', 'sendBeacon',
  'WebTransport', 'RTCPeerConnection',
];
const BANNED_NAMES = [...NETWORK_NAMES, 'sync'];
// fetchLater and WebSocketStream are listed on their own: a word boundary does
// not split fetchLater into fetch.
const NETWORK_NAME = /\b(?:fetch|fetchLater|XMLHttpRequest|WebSocket|WebSocketStream|EventSource|sendBeacon|WebTransport|RTCPeerConnection)\b/u;
const SYNC_NAME = /\bsync\b/u;
// A backtick, quote, opening parenthesis, equals sign or comma; optional
// whitespace; two slashes; then a character that is neither whitespace nor a
// slash. Runs on RAW text only: the stripper blanks string contents.
const SCHEME_RELATIVE = /[`'"(=,]\s*\/\/[^\s/]/u;

// Strings come before comment openers, so '/*' and '//' inside a quoted string
// never start a comment. Quoted strings are one line and honour escapes.
const LEXEME = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\[\s\S])*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu;

/**
 * `source` with its comments removed, in one string-aware pass. A quoted
 * string whose whole text is a banned name is kept, so `window['fetch']` and
 * `Reflect.get(chrome.storage, "sync")` stay visible; every other quoted string
 * is blanked to its two quotes, so prose in a string is not code. A template
 * literal is kept whole and scanned whole, which fails closed. A block comment
 * becomes whitespace that keeps its newlines; a line comment becomes nothing.
 */
function codeOf(source) {
  return source.replace(LEXEME, (lexeme) => {
    const opener = lexeme[0];
    if (opener === "'" || opener === '"') return BANNED_NAMES.includes(lexeme.slice(1, -1)) ? lexeme : `${opener}${opener}`;
    if (opener === '`') return lexeme;
    if (lexeme.startsWith('/*')) return lexeme.replace(/[^\n]/gu, ' ');
    return '';
  });
}

// Copied verbatim from content.js and background.js: shipped prose that names
// a banned word and must stay legal.
const SHIPPED_PROSE = [
  '// An invalidation hint and nothing more: the worker must fetch a fresh',
  '// sync, session or managed, and never anything the agent did not choose.',
];
const CLEAN_CODE = [
  '// prose may say fetch, WebSocket or eval without calling them',
  ...SHIPPED_PROSE,
  "const note = 'Settings never sync to other devices';",
  'const note = "We do not fetch anything";',
  '/* fetch WebSocket sync */ const a = 1;',
  'syncController(true);',
  'async function load() {}',
];

test('the comment stripper is string-aware and removes the shipped comments (07-10)', () => {
  for (const [source, code] of [
    ["window['fetch'](u);", "window['fetch'](u);"],
    ['Reflect.get(chrome.storage, "sync");', 'Reflect.get(chrome.storage, "sync");'],
    ["const t = 'Settings never sync to other devices';", "const t = '';"],
    ['const t = "a \\" b";', 'const t = "";'],
    ["const t = 'it\\'s';", "const t = '';"],
    ['const t = `a ${b} // c /* d */`;', 'const t = `a ${b} // c /* d */`;'],
    ['x; // line comment\ny;', 'x; \ny;'],
    ['y; /* two\nlines */ z;', `y; ${' '.repeat(6)}\n${' '.repeat(8)} z;`],
    ["'/*'; fetch(u); '*/'", "''; fetch(u); ''"],
    ["'//'; fetch(u)", "''; fetch(u)"],
  ]) expect(codeOf(source), source).toBe(code);

  expect(scripts.some((name) => {
    const source = read(name);
    const code = codeOf(source);
    return code !== source && code.length < source.length;
  })).toBe(true);
});

test('no shipped script names a network API outside its comments (D-27, WR-06)', () => {
  for (const violation of [
    'fetch.call(null, u)', 'fetch.apply(null, [u])', 'Reflect.apply(fetch, null, [u])', "window['fetch'](u)",
    'globalThis["fetch"](u)', 'const f = fetch; f(u)', 'const { fetch: f } = globalThis', 'fetch.bind(null)(u)',
    'navigator.sendBeacon.call(navigator, u)', 'Reflect.construct(WebSocket, [u])',
    'const X = XMLHttpRequest; new X()', 'new WebTransport(u)', 'new RTCPeerConnection()', 'fetch`u`',
    '(0, fetch)(u)', 'fetch?.(u)', 'fetchLater(u)', 'new WebSocketStream(u)', 'window[`fetch`](u)',
    'const t = `${fetch(u)}`;', "'/*'; fetch(u); '*/'", "'//'; fetch(u)",
  ]) expect(codeOf(violation), violation).toMatch(NETWORK_NAME);
  for (const clean of CLEAN_CODE) expect(codeOf(clean), clean).not.toMatch(NETWORK_NAME);

  for (const name of scripts) expect(codeOf(read(name)), name).not.toMatch(NETWORK_NAME);
});

test('no shipped script names the sync storage area outside its comments (DATA-01, WR-06)', () => {
  for (const violation of [
    'const { sync } = chrome.storage', 'const s = chrome.storage; s.sync.get()',
    "const { ['sync']: a } = chrome.storage", 'Reflect.get(chrome.storage, "sync")',
    'const { storage: st } = chrome; st.sync', "chrome['storage'].sync", 'chrome.storage /* c */ .sync',
    'chrome.storage[`sync`]',
  ]) expect(codeOf(violation), violation).toMatch(SYNC_NAME);
  for (const clean of CLEAN_CODE) expect(codeOf(clean), clean).not.toMatch(SYNC_NAME);

  for (const name of scripts) expect(codeOf(read(name)), name).not.toMatch(SYNC_NAME);
});

test('no shipped script, page or stylesheet holds a scheme-relative URL (D-27, WR-06)', () => {
  for (const violation of [
    "new Image().src = '//t.example/p.gif'", 'new Image().src = "//t.example/p.gif"',
    'new Image().src = `//t.example/p.gif`', '<img src="//t.example/p.gif">', '<img src=//t.example/p.gif>',
    "el.style.background = 'url(//t.example/p.gif)'", '<p style="background:url(//t.example/p.gif)">',
    '<img srcset="a.png 1x, //t.example/b.png 2x">', "@import '//t.example/x.css';",
    'a { background: url(//t.example/p.gif) }',
  ]) expect(violation, violation).toMatch(SCHEME_RELATIVE);
  for (const clean of ['// a comment', '/* block */', 'a / b / c', 'const r = /\\/\\//u;', "const s = 'a//';"]) {
    expect(clean, clean).not.toMatch(SCHEME_RELATIVE);
  }

  for (const name of [...scripts, ...pages, ...stylesheets]) expect(read(name), name).not.toMatch(SCHEME_RELATIVE);
});

const STYLE_IMAGE_SET = /image-set\s*\(/iu;

/** The value of every `style` attribute in `html`: double-quoted, single-quoted or unquoted. */
function styleAttributes(html) {
  return [...html.matchAll(/[\s"'/]style\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/giu)]
    .map(([, double, single, bare]) => double ?? single ?? bare);
}

test('stylesheets, page style blocks and page style attributes load nothing (D-26, WR-06)', () => {
  expect(styleAttributes('<p style="a:b">x</p><div STYLE=\'c:d\'></div><span style=e:f>y</span><i data-style="g">'))
    .toEqual(['a:b', 'c:d', 'e:f']);
  for (const violation of ['a { background: image-set("p.png" 1x) }', '-webkit-image-set("//t/p.png" 1x)']) {
    expect(violation, violation).toMatch(STYLE_IMAGE_SET);
  }
  expect('a { background-color: rgb(1 2 3 / 0.1) }').not.toMatch(STYLE_IMAGE_SET);
  expect(styleAttributes('<p style="background:url(//t.example/p.gif)">')[0]).toMatch(STYLE_LOAD);

  for (const name of stylesheets) expect(read(name), name).not.toMatch(STYLE_IMAGE_SET);
  for (const name of pages) {
    const html = read(name);
    for (const block of styleBlocks(html)) expect(block, name).not.toMatch(STYLE_IMAGE_SET);
    for (const value of styleAttributes(html)) {
      expect(value, name).not.toMatch(STYLE_LOAD);
      expect(value, name).not.toMatch(STYLE_IMAGE_SET);
    }
  }
});
