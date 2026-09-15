// @vitest-environment node
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { inflateSync } from 'node:zlib';
import { Window } from 'happy-dom';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { validateFixtureManifest } from '../../scripts/fixture-contract.js';
import { createChromeHarness } from './chrome-harness.js';

const root = new URL('../../extension/', import.meta.url);
const asset = (name) => readFileSync(new URL(name, root), 'utf8');
const manifest = JSON.parse(asset('manifest.json'));
const windows = [];

// The complete shipped tree, not just its top level: a directory that hides new
// files from the inventory would defeat the whole point of pinning it.
function shippedInventory(directory = root, prefix = '') {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory()
      ? shippedInventory(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`)
      : [`${prefix}${entry.name}`]))
    .sort();
}

beforeAll(async () => {
  expect((await validateFixtureManifest(fileURLToPath(new URL('../fixtures/manifest.json', import.meta.url)), {
    requireCompleteScenarioMatrix: true,
  })).fixtureCount).toBe(3);
});

afterEach(async () => {
  for (const window of windows.splice(0)) {
    window.dispatchEvent(new window.Event('pagehide'));
    await window.happyDOM.close();
  }
  vi.restoreAllMocks(); vi.useRealTimers();
});

function createDocument() {
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true, enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
  windows.push(window);
  window.document.documentElement.lang = 'en';
  window.document.body.innerHTML = readFileSync(new URL('../fixtures/zendesk-view-priority-present.html', import.meta.url), 'utf8');
  return window;
}

// Phase 4 added an action, a popup and a service worker by decision
// (04-DECISIONS.json). Phase 5 adds the publication identity by decision
// (05-CONTEXT.md D-03, D-06): the approved store title, the short description
// and the required 128px brand icon. The inventory and the manifest are
// re-pinned to that decided set — widened by exactly three named fields and one
// named file, never weakened: this is still a whole-object equality, so any
// undeclared key or unshipped file fails.
//
// `name` and `description` are the store's item name and short description, and
// their single source is release/listing.md. The version stays pinned at 0.1.0:
// the store rejects a re-upload with an unchanged version, but no upload has
// happened yet, so bumping it now would invent a release history.
test('manifest has the exact minimal MV3 isolated top-frame static injection contract', () => {
  expect(manifest).toEqual({
    manifest_version: 3,
    name: 'Zhroma — Priority Colours for Zendesk',
    version: '0.1.0',
    description: 'See ticket priorities at a glance in English Zendesk Agent Workspace views.',
    minimum_chrome_version: '106', permissions: ['storage'],
    action: { default_popup: 'popup.html', default_icon: { 32: 'icons/neutral.png' } },
    icons: { 32: 'icons/neutral.png', 128: 'icons/brand.png' },
    background: { service_worker: 'background.js' },
    content_scripts: [{ matches: ['https://*.zendesk.com/agent/*'], js: ['content.js'], css: ['zhroma.css'],
      run_at: 'document_idle', world: 'ISOLATED', all_frames: false }],
  });
  // The store's own limits, asserted rather than assumed.
  expect(manifest.name.length).toBeLessThanOrEqual(75);
  expect(manifest.description.length).toBeLessThanOrEqual(132);
  // The listing document is upstream of the manifest, not a description of it.
  const listing = readFileSync(new URL('../../release/listing.md', import.meta.url), 'utf8');
  expect(listing).toContain(manifest.name);
  expect(listing).toContain(manifest.description);
  // Stated again as explicit prohibitions, so a future widening reads as a
  // deleted assertion rather than as an edited literal.
  for (const key of ['host_permissions', 'optional_permissions', 'optional_host_permissions',
    'web_accessible_resources', 'externally_connectable', 'content_security_policy',
    'declarative_net_request', 'commands', 'devtools_page', 'chrome_url_overrides', 'side_panel']) {
    expect(Object.hasOwn(manifest, key)).toBe(false);
  }
  expect(shippedInventory()).toEqual(['background.js', 'content.js', 'icons/brand.png', 'icons/missing.png',
    'icons/neutral.png', 'icons/off.png', 'icons/unreadable.png', 'icons/working.png', 'manifest.json',
    'popup.html', 'popup.js', 'zhroma.css']);
  const declared = [...manifest.content_scripts[0].js, ...manifest.content_scripts[0].css,
    manifest.action.default_popup, manifest.background.service_worker,
    ...Object.values(manifest.action.default_icon), ...Object.values(manifest.icons)];
  for (const name of declared) {
    expect(name).toMatch(/^(icons\/)?[a-z-]+\.(js|css|html|png)$/);
    expect(realpathSync(new URL(name, root))).toBe(fileURLToPath(new URL(name, root)));
    expect(statSync(new URL(name, root)).size).toBeGreaterThan(0);
  }
});

/**
 * The pixels of one of our own PNGs. Deliberately minimal: it accepts only the
 * 8-bit RGBA, non-interlaced, unfiltered form this project writes, so a file
 * that quietly became something else fails here rather than being decoded
 * anyway. No image dependency is added for this.
 */
function decodeRgba(bytes) {
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const parts = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    if (bytes.subarray(offset + 4, offset + 8).toString('latin1') === 'IDAT') {
      parts.push(bytes.subarray(offset + 8, offset + 8 + length));
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const stride = width * 4 + 1;
  expect(raw.length).toBe(height * stride);
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    expect(raw[y * stride], `scanline ${y} filter`).toBe(0);
    raw.copy(pixels, y * width * 4, y * stride + 1, y * stride + 1 + width * 4);
  }
  return pixels;
}

const pngHeader = (bytes) => {
  expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(bytes.subarray(12, 16).toString('latin1')).toBe('IHDR');
  // 8-bit truecolour with alpha, non-interlaced. PNG only — the store rejects
  // SVG and WebP, so the format itself is part of the contract.
  expect([bytes[24], bytes[25], bytes[28]]).toEqual([8, 6, 0]);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

// Runtime-projected icons are not named in the manifest, so nothing but the
// package inventory can prove they will exist in the store zip. Pin the exact
// set, the exact bytes' shape, and that the worker projects only those five.
//
// 05-03 adds a sixth packaged PNG that is deliberately NOT one of them:
// `brand.png` is the store/manifest identity, validated separately below at its
// own size. The five diagnostic treatments keep their meanings, their bytes and
// their worker mappings untouched — a brand icon must not quietly become a
// status icon, and a status icon must not quietly become the brand.
const STATUS_ICONS = ['missing.png', 'neutral.png', 'off.png', 'unreadable.png', 'working.png'];

test('every projected status icon is a 32x32 8-bit RGBA PNG and the worker projects no other artwork', () => {
  const icons = readdirSync(new URL('icons/', root)).sort();
  // 04-04 completed the decided set of five shape treatments: the off state is
  // the fifth. 05-03 adds the brand icon alongside them, and each addition is a
  // deliberate, visible change to this pin.
  expect(icons).toEqual(['brand.png', ...STATUS_ICONS]);
  for (const name of STATUS_ICONS) {
    const bytes = readFileSync(new URL(`icons/${name}`, root));
    expect(pngHeader(bytes), name).toEqual([32, 32]);
    expect(bytes.length).toBeLessThan(8192);
  }
  const projected = [...asset('background.js').matchAll(/'(icons\/[a-z]+\.png)'/g)].map(([, path]) => path);
  expect([...new Set(projected)].sort()).toEqual(STATUS_ICONS.map((name) => `icons/${name}`));
  // Stated as its own prohibition: the worker never projects the brand icon, so
  // no runtime state can be mistaken for "Zhroma is installed".
  expect(projected).not.toContain('icons/brand.png');
});

// The store requires a 128x128 packaged icon whose artwork is roughly 96x96
// inside a 16px transparent margin, legible on light and dark backgrounds.
// The margin is the part an automated check can actually prove; legibility is
// a human judgment recorded in the plan's verification, not asserted here.
test('the brand icon is a 128x128 PNG with 96x96 of artwork inside a 16px transparent margin', () => {
  const bytes = readFileSync(new URL('icons/brand.png', root));
  expect(pngHeader(bytes)).toEqual([128, 128]);
  expect(bytes.length).toBeLessThan(65536);
  expect(manifest.icons[128]).toBe('icons/brand.png');
  // The four priority hues the mark carries are the stylesheet's own, so the
  // brand cannot drift from the tint the product paints.
  const hues = [...asset('zhroma.css').matchAll(/background-color: rgb\((\d+) (\d+) (\d+) \//g)]
    .map(([, r, g, b]) => [Number(r), Number(g), Number(b)]);
  expect(hues).toHaveLength(4);
  const pixels = decodeRgba(bytes);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const transparent = pixels[(y * 128 + x) * 4 + 3] === 0;
      if (x < 16 || x >= 112 || y < 16 || y >= 112) expect([x, y, transparent]).toEqual([x, y, true]);
    }
  }
  const present = new Set();
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 250) continue;
    for (const [hueIndex, hue] of hues.entries()) {
      if (hue.every((channel, offset) => Math.abs(pixels[index + offset] - channel) <= 6)) present.add(hueIndex);
    }
  }
  expect([...present].sort()).toEqual([0, 1, 2, 3]);
});

test.each(['success', 'unknown', 'absent', 'unsupported-language'])('every declared script executes without data channels on %s', (mode) => {
  vi.useFakeTimers();
  const window = createDocument();
  const { document } = window;
  if (mode === 'unknown') document.querySelectorAll('tbody tr')[3].children[6].textContent = 'Unknown';
  if (mode === 'absent') document.querySelector('thead tr').children[6].textContent = 'Other';
  if (mode === 'unsupported-language') document.documentElement.lang = 'fr';
  const forbiddenCalls = [];
  const deny = (name) => function () { forbiddenCalls.push(name); throw new Error('Forbidden runtime channel'); };
  const storage = new Proxy({}, { get(_target, name) { forbiddenCalls.push(`storage.${String(name)}`); throw new Error('Forbidden storage access'); } });
  // `chrome` is no longer denied wholesale — the shipped script legitimately
  // reads one boolean and sends one finite status hint. It is replaced by the
  // strict harness, which permits exactly those calls and records every other
  // Chrome surface as a violation. `browser.*` stays denied outright.
  const harness = createChromeHarness();
  const sentinels = {
    fetch: deny('fetch'), XMLHttpRequest: deny('XHR'), WebSocket: deny('WebSocket'), EventSource: deny('EventSource'),
    Worker: deny('Worker'), SharedWorker: deny('SharedWorker'), Image: deny('Image'),
    localStorage: storage, sessionStorage: storage, indexedDB: storage, caches: storage,
    chrome: harness.chrome, browser: { storage }, navigator: { sendBeacon: deny('beacon') },
    console: { log: deny('console.log'), warn: deny('console.warn'), error: deny('console.error'), info: deny('console.info') },
  };
  for (const [name, value] of Object.entries(sentinels)) Object.defineProperty(window, name, { value, configurable: true });
  const before = document.body.innerHTML;
  const context = createContext({ ...sentinels, document, window,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout,
  }, { codeGeneration: { strings: false, wasm: false } });
  const initialGlobals = Object.keys(context);
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  harness.flush();
  vi.advanceTimersByTime(15000);
  expect(forbiddenCalls).toEqual([]);
  expect(harness.violations).toEqual([]);
  expect(harness.messages.every((message) => message.type === 'status-invalidated')).toBe(true);
  expect(Object.keys(context)).toEqual(initialGlobals);
  expect(vi.getTimerCount()).toBe(0);
  const markers = [...document.querySelectorAll('[data-zhroma-priority]')];
  if (mode === 'success') {
    expect(markers.map((row) => row.getAttribute('data-zhroma-priority'))).toEqual(['Urgent', 'High', 'Normal', 'Low']);
    for (const row of markers) row.removeAttribute('data-zhroma-priority');
  } else expect(markers).toHaveLength(0);
  expect(document.body.innerHTML).toBe(before);
  // Repeat actual-source execution paths with the same fail-on-call sentinels.
  for (let i = 0; i < 30; i++) {
    window.dispatchEvent(new window.Event('pagehide'));
    document.body.innerHTML = '<main><button>Native action</button></main>';
    const native = document.body.innerHTML;
    window.dispatchEvent(new window.Event('pageshow'));
    // Drain by elapsed time rather than by "whatever happens to be pending":
    // a Priority-less view legitimately schedules a reconcile pass and then a
    // 100 ms missing-column settle timer, and both must terminate. Asserting
    // zero timers after a full drain is strictly stronger than asserting zero
    // after one generation of pending callbacks.
    vi.advanceTimersByTime(15000);
    expect(document.body.innerHTML).toBe(native);
    const button = document.querySelector('button'); const clicked = vi.fn();
    button.addEventListener('click', clicked); button.focus(); button.click();
    expect(clicked).toHaveBeenCalledOnce(); expect(document.activeElement).toBe(button);
    window.dispatchEvent(new window.Event('pagehide'));
    document.body.innerHTML = before;
    window.dispatchEvent(new window.Event('pageshow'));
    harness.flush();
    vi.advanceTimersByTime(15000);
    expect(vi.getTimerCount()).toBe(0);
  }
  expect(forbiddenCalls).toEqual([]);
  expect(harness.violations).toEqual([]);
  expect(Object.keys(context)).toEqual(initialGlobals);
});

test('runtime source remains classic, palette-free and limited to DOM reading plus marker/lifecycle writes', () => {
  const source = asset('content.js');
  expect(() => new Script(source)).not.toThrow();
  // Supporting inventory checks; behavioral sentinels and DOM assertions carry the actual proof.
  expect(source).not.toMatch(/\b(import|export|require|eval|Function|fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|postMessage)\s*[.(]/);
  expect(source).not.toMatch(/https?:|\.style\b|innerHTML|outerHTML\s*=|insertAdjacentHTML|document\.write|createElement|cssText|adoptedStyleSheets|attachShadow/);
  expect(source).not.toMatch(/#[\da-f]{3,8}\b|rgba?\s*\(|hsla?\s*\(|getBoundingClientRect|offsetHeight|offsetWidth|getComputedStyle/);
  expect(source).toMatch(/setAttribute\(PRIORITY_ATTRIBUTE, priority\)/);
});

test('ongoing writes target only the owned marker and skip unchanged values', () => {
  vi.useFakeTimers();
  const window = createDocument();
  const { document } = window;
  let deliver;
  class Observer {
    constructor(callback) { deliver = callback; }
    observe() {}
    disconnect() {}
  }
  const writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  const removals = vi.spyOn(window.Element.prototype, 'removeAttribute');
  const harness = createChromeHarness();
  new Script(asset('content.js')).runInContext(createContext({ document, window, chrome: harness.chrome, MutationObserver: Observer, setTimeout, clearTimeout }));
  harness.flush();
  vi.runOnlyPendingTimers();
  expect(writes.mock.calls).toEqual(['Urgent', 'High', 'Normal', 'Low'].map((p) => ['data-zhroma-priority', p]));
  writes.mockClear();
  deliver([{ type: 'childList', target: document.querySelector('tbody'), addedNodes: [], removedNodes: [] }]);
  vi.runOnlyPendingTimers();
  expect(writes).not.toHaveBeenCalled();
  expect(removals).not.toHaveBeenCalled();
  document.querySelector('tbody tr').children[6].textContent = '';
  deliver([{ type: 'childList', target: document.querySelector('tbody tr').children[6], addedNodes: [], removedNodes: [] }]);
  vi.runOnlyPendingTimers();
  expect(writes).not.toHaveBeenCalled();
  expect(removals.mock.calls).toEqual([['data-zhroma-priority']]);
});

function loadRules(window, css = asset('zhroma.css')) {
  const style = window.document.createElement('style');
  style.textContent = css;
  window.document.head.append(style);
  return [...style.sheet.cssRules];
}

const expectedPaint = {
  Urgent: [220, 38, 38, 0.14], High: [234, 88, 12, 0.12],
  Normal: [202, 138, 4, 0.09], Low: [22, 163, 74, 0.08],
};

test('locale selector family: four exact source heads preserve direct-cell paint rules', () => {
  // A source oracle independent of happy-dom's selector parser. The ASCII i
  // flag is a defensive convention, not a claimed Chrome behavioral kill.
  const sourceRules = [...asset('zhroma.css').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  expect(sourceRules.length, '[locale:selector-family] nonempty four-rule extraction').toBe(4);
  for (const [index, [, selector, declarations]] of sourceRules.entries()) {
    expect(selector.trim().startsWith('html[lang|="en" i] '), `[locale:selector-family] head ${index + 1}`).toBe(true);
    expect(selector.trim()).toMatch(/> td\[data-garden-id="tables\.cell"\]$/);
    expect(declarations.trim()).toMatch(/^background-color: rgb\([\d .\/]+\) !important;$/);
  }
});

test('happy-dom secondary model: four CSS rules map exact labels to alpha backgrounds and only direct ticket cells', () => {
  const window = createDocument();
  const { document } = window;
  const rules = loadRules(window);
  expect(rules).toHaveLength(4);
  const labels = [];
  const ticketRows = [...document.querySelectorAll('tbody > tr')];
  const group = document.createElement('tr');
  group.setAttribute('data-garden-id', 'tables.group_row');
  group.setAttribute('data-test-id', 'generic-table-rows-group-by');
  const groupCell = document.createElement('td'); groupCell.setAttribute('data-garden-id', 'tables.cell'); group.append(groupCell);
  document.querySelector('tbody').prepend(group);
  const nested = document.createElement('td'); nested.setAttribute('data-garden-id', 'tables.cell'); ticketRows[0].children[0].append(nested);
  ticketRows.forEach((row, i) => row.setAttribute('data-zhroma-priority', ['Urgent', 'High', 'Normal', 'Low'][i]));
  for (const rule of rules) {
    expect(rule.type).toBe(1);
    expect(rule.style.length).toBe(1);
    expect(rule.style.item(0)).toBe('background-color');
    const label = rule.selectorText.match(/data-zhroma-priority="(Urgent|High|Normal|Low)"/)?.[1];
    labels.push(label);
    const numbers = rule.style.backgroundColor.match(/[\d.]+/g).map(Number);
    expect(numbers).toEqual(expectedPaint[label]);
    const matching = [...document.querySelectorAll(rule.selectorText)];
    const target = ticketRows[['Urgent', 'High', 'Normal', 'Low'].indexOf(label)];
    expect(matching, '[locale:actual-selector-family]').toEqual([...target.children]);
    for (const excluded of [document.body.firstElementChild, document.querySelector('table'), document.querySelector('thead'), document.querySelector('th'), group, groupCell, nested]) {
      expect(excluded.matches(rule.selectorText)).toBe(false);
    }
    target.setAttribute('data-zhroma-priority', '');
    expect([...target.children].some((cell) => cell.matches(rule.selectorText))).toBe(false);
    target.removeAttribute('data-zhroma-priority');
    expect([...target.children].some((cell) => cell.matches(rule.selectorText))).toBe(false);
    target.setAttribute('data-zhroma-priority', label);
  }
  expect(labels.sort()).toEqual(['High', 'Low', 'Normal', 'Urgent']);
  for (const lang of ['fr', 'fr-CA', 'eng', 'ende', '', ' ']) {
    document.documentElement.lang = lang;
    for (const rule of rules) expect(document.querySelectorAll(rule.selectorText), lang).toHaveLength(0);
  }
  expect(asset('zhroma.css')).not.toMatch(/@|url\(|box-shadow|font|\bopacity\s*:/);
});

// CR-01: every English regional locale is a supported shell. This is the
// end-to-end proof for one of them — the detector tints and reports `working`,
// and the same shell still paints, with each declaration flagged important
// (WR-08) so the tint keeps winning against a later host stylesheet.
test('an en-GB shell tints end to end and every tint declaration is flagged important', () => {
  vi.useFakeTimers();
  const window = createDocument();
  const { document } = window;
  document.documentElement.lang = 'en-GB';
  const rules = loadRules(window);
  expect(rules).toHaveLength(4);
  const harness = createChromeHarness();
  const context = createContext({ document, window, chrome: harness.chrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  harness.flush();
  vi.advanceTimersByTime(15000);
  const ticketRows = [...document.querySelectorAll('tbody > tr')];
  expect(ticketRows.map((row) => row.getAttribute('data-zhroma-priority')))
    .toEqual(['Urgent', 'High', 'Normal', 'Low']);
  expect(harness.requestStatus()).toEqual({ type: 'status', requestId: 1, diagnosis: 'working', reason: null });
  for (const rule of rules) {
    const label = rule.selectorText.match(/data-zhroma-priority="(Urgent|High|Normal|Low)"/)?.[1];
    const target = ticketRows[['Urgent', 'High', 'Normal', 'Low'].indexOf(label)];
    expect([...document.querySelectorAll(rule.selectorText)]).toEqual([...target.children]);
    expect(rule.style.getPropertyPriority('background-color')).toBe('important');
  }
  harness.assertClean();
});

// The two encodings of the supported language family — the JavaScript
// predicate in `content.js` and the `[lang|="en" i]` selector head in
// `zhroma.css` — cannot share a constant, because this project ships no build
// step and CSS cannot import from JavaScript. The contract below is therefore
// the single place the accepted set is written down, and both encodings are
// checked against it. Any future edit to either that changes the accepted set
// fails here rather than shipping a state where the popup says `working` and
// nothing paints.
function cssAcceptsShell(lang) {
  const window = createDocument();
  const { document } = window;
  document.documentElement.lang = lang;
  const rules = loadRules(window);
  [...document.querySelectorAll('tbody > tr')]
    .forEach((row, index) => row.setAttribute('data-zhroma-priority', ['Urgent', 'High', 'Normal', 'Low'][index]));
  return rules.some((rule) => document.querySelectorAll(rule.selectorText).length > 0);
}

function scriptAcceptsShell(lang) {
  const window = createDocument();
  const { document } = window;
  document.documentElement.lang = lang;
  const harness = createChromeHarness();
  const context = createContext({ document, window, chrome: harness.chrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  harness.flush();
  vi.advanceTimersByTime(15000);
  const markers = [...document.querySelectorAll('tbody > tr')].map((row) => row.getAttribute('data-zhroma-priority'));
  return markers.join('|') === 'Urgent|High|Normal|Low';
}

test('happy-dom secondary model: JS and CSS shell agreement with documented right-padding divergence', () => {
  vi.useFakeTimers();
  const accepted = ['en', 'EN', 'en-US', 'en-GB', 'EN-gb', 'en-Latn-GB'];
  const refused = ['fr', 'fr-CA', 'eng', 'ende', '', ' ', ' en'];
  for (const lang of accepted) {
    expect([lang, cssAcceptsShell(lang), scriptAcceptsShell(lang)]).toEqual([lang, true, true]);
  }
  for (const lang of refused) {
    expect([lang, cssAcceptsShell(lang), scriptAcceptsShell(lang)]).toEqual([lang, false, false]);
  }
  // Harness fidelity divergence, recorded rather than dropped: happy-dom's `|=`
  // matches a right-padded attribute value where Chrome does not, so `'en '` is
  // excluded from the agreement assertion and covered on the JavaScript side alone.
  expect(scriptAcceptsShell('en ')).toBe(false);
  expect(cssAcceptsShell('en ')).toBe(true);
});

test('CSS rule reordering preserves hue mapping; CSS-only shade edits leave detector bytes unchanged', () => {
  const window = createDocument();
  const rules = loadRules(window);
  const sourceBefore = asset('content.js');
  const reversed = loadRules(window, rules.toReversed().map((rule) => rule.cssText).join('\n'));
  const mapping = (list) => Object.fromEntries(list.map((rule) => [rule.selectorText, rule.style.backgroundColor]));
  expect(mapping(reversed)).toEqual(mapping(rules));
  const tuned = loadRules(window, asset('zhroma.css').replace('0.14', '0.13'));
  expect(tuned[0].style.backgroundColor).not.toBe(rules[0].style.backgroundColor);
  expect(tuned[0].selectorText).toBe(rules[0].selectorText);
  expect(asset('content.js')).toBe(sourceBefore);
});

// --- the Chrome seam itself is part of the contract -------------------------

test('the strict harness admits exactly the shipped Chrome seam and refuses every other surface', () => {
  const harness = createChromeHarness();
  const probes = [
    ['chrome.tabs', () => harness.chrome.tabs],
    ['chrome.action', () => harness.chrome.action],
    ['chrome.scripting', () => harness.chrome.scripting],
    ['chrome.cookies', () => harness.chrome.cookies],
    ['chrome.webRequest', () => harness.chrome.webRequest],
    ['chrome.storage.sync', () => harness.chrome.storage.sync],
    ['chrome.storage.session', () => harness.chrome.storage.session],
    ['chrome.storage.managed', () => harness.chrome.storage.managed],
    ['chrome.storage.local.set', () => harness.chrome.storage.local.set],
    ['chrome.storage.local.remove', () => harness.chrome.storage.local.remove],
    ['chrome.runtime.connect', () => harness.chrome.runtime.connect],
    ['chrome.runtime.getURL', () => harness.chrome.runtime.getURL],
  ];
  for (const [name, probe] of probes) expect(probe, name).toThrow(/Unpermitted Chrome usage/);
  expect(harness.violations).toEqual(probes.map(([name]) => name));
  // A permitted call with an unpermitted argument shape is refused too.
  expect(() => harness.chrome.storage.local.get({ enabled: true, extra: 1 }, () => {})).toThrow();
  expect(() => harness.chrome.storage.local.get({ theme: 'dark' }, () => {})).toThrow();
  expect(() => harness.chrome.runtime.sendMessage({ type: 'status-invalidated', row: 'Urgent' })).toThrow();
  expect(() => harness.chrome.runtime.sendMessage({ type: 'anything-else' })).toThrow();
  // The one permitted read and the one permitted message stay permitted.
  expect(() => harness.chrome.storage.local.get({ enabled: true }, () => {})).not.toThrow();
  expect(() => harness.chrome.runtime.sendMessage({ type: 'status-invalidated' })).not.toThrow();
});

test('an unavailable extension context leaves the page untouched instead of defaulting the tint on', () => {
  vi.useFakeTimers();
  const window = createDocument();
  const { document } = window;
  const before = document.body.innerHTML;
  // No `chrome` at all — an extension reload, or an invalidated context. The
  // shipped script must fail closed. It must never carry a bypass that treats
  // an unreadable preference as an enabled one.
  const context = createContext({ document, window, MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  vi.advanceTimersByTime(15000);
  expect(document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  expect(document.body.innerHTML).toBe(before);
  expect(vi.getTimerCount()).toBe(0);
  expect(asset('content.js')).not.toMatch(/typeof\s+chrome\s*[!=]==?\s*['"]undefined['"]/);
});

test.each([
  ['a read that never resolves', { readMode: 'deferred' }, false],
  ['a rejected read', { readMode: 'rejected' }, true],
  ['a throwing storage API', { readMode: 'throws' }, true],
  ['a stored false', { stored: false }, true],
  ['a non-boolean stored value', { stored: 1 }, true],
])('%s writes no marker and drains every timer', (_name, options, confirm) => {
  vi.useFakeTimers();
  const window = createDocument();
  const { document } = window;
  const before = document.body.innerHTML;
  const harness = createChromeHarness(options);
  const context = createContext({ document, window, chrome: harness.chrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  if (confirm) harness.flush();
  vi.advanceTimersByTime(15000);
  expect(document.querySelectorAll('[data-zhroma-priority]')).toHaveLength(0);
  expect(document.body.innerHTML).toBe(before);
  expect(vi.getTimerCount()).toBe(0);
  harness.assertClean();
});

test('the content script reports only the finite status enum, and only to the packaged worker', () => {
  vi.useFakeTimers();
  const window = createDocument();
  const { document } = window;
  const harness = createChromeHarness();
  const context = createContext({ document, window, chrome: harness.chrome,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout });
  new Script(asset('content.js'), { filename: 'content.js' }).runInContext(context);
  harness.flush();
  vi.advanceTimersByTime(15000);
  expect(harness.messageListenerCount()).toBe(1);
  expect(harness.storageListenerCount()).toBe(1);
  const reply = harness.requestStatus();
  expect(reply).toEqual({ type: 'status', requestId: 1, diagnosis: 'working', reason: null });
  // A foreign extension id and a sender carrying a tab are both refused.
  expect(harness.requestStatus({ sender: { id: 'another-extension-id' } })).toBeUndefined();
  expect(harness.requestStatus({ sender: { id: undefined, tab: { id: 3 } } })).toBeUndefined();
  expect(harness.requestStatus({ requestId: 0 })).toBeUndefined();
  harness.assertClean();
});
