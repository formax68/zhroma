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
