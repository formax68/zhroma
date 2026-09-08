// @vitest-environment node
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { createContext, Script } from 'node:vm';
import { Window } from 'happy-dom';
import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { validateFixtureManifest } from '../../scripts/fixture-contract.js';

const root = new URL('../../extension/', import.meta.url);
const asset = (name) => readFileSync(new URL(name, root), 'utf8');
const manifest = JSON.parse(asset('manifest.json'));
const windows = [];

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

test('manifest has the exact minimal MV3 isolated top-frame static injection contract', () => {
  expect(manifest).toEqual({
    manifest_version: 3, name: 'Zhroma', version: '0.1.0', permissions: ['storage'],
    content_scripts: [{ matches: ['https://*.zendesk.com/agent/*'], js: ['content.js'], css: ['zhroma.css'],
      run_at: 'document_idle', world: 'ISOLATED', all_frames: false }],
  });
  expect(readdirSync(root).sort()).toEqual(['content.js', 'manifest.json', 'zhroma.css']);
  for (const name of [...manifest.content_scripts[0].js, ...manifest.content_scripts[0].css]) {
    expect(name).toMatch(/^[a-z-]+\.(js|css)$/);
    expect(realpathSync(new URL(name, root))).toBe(fileURLToPath(new URL(name, root)));
    expect(asset(name).length).toBeGreaterThan(0);
  }
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
  const sentinels = {
    fetch: deny('fetch'), XMLHttpRequest: deny('XHR'), WebSocket: deny('WebSocket'), EventSource: deny('EventSource'),
    Worker: deny('Worker'), SharedWorker: deny('SharedWorker'), Image: deny('Image'),
    localStorage: storage, sessionStorage: storage, indexedDB: storage, caches: storage,
    chrome: { storage }, browser: { storage }, navigator: { sendBeacon: deny('beacon') },
    console: { log: deny('console.log'), warn: deny('console.warn'), error: deny('console.error'), info: deny('console.info') },
  };
  for (const [name, value] of Object.entries(sentinels)) Object.defineProperty(window, name, { value, configurable: true });
  const before = document.body.innerHTML;
  const context = createContext({ ...sentinels, document, window,
    MutationObserver: window.MutationObserver, setTimeout, clearTimeout,
  }, { codeGeneration: { strings: false, wasm: false } });
  const initialGlobals = Object.keys(context);
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  vi.advanceTimersByTime(15000);
  expect(forbiddenCalls).toEqual([]);
  expect(Object.keys(context)).toEqual(initialGlobals);
  expect(vi.getTimerCount()).toBe(0);
  const markers = [...document.querySelectorAll('[data-zhroma-priority]')];
  if (mode === 'success') {
    expect(markers.map((row) => row.getAttribute('data-zhroma-priority'))).toEqual(['Urgent', 'High', 'Normal', 'Low']);
    for (const row of markers) row.removeAttribute('data-zhroma-priority');
  } else expect(markers).toHaveLength(0);
  expect(document.body.innerHTML).toBe(before);
});

test('runtime source remains classic, palette-free and limited to DOM reading plus marker/lifecycle writes', () => {
  const source = asset('content.js');
  expect(() => new Script(source)).not.toThrow();
  // Supporting inventory checks; behavioral sentinels and DOM assertions carry the actual proof.
  expect(source).not.toMatch(/\b(import|export|require|eval|Function|fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|postMessage)\s*[.(]/);
  expect(source).not.toMatch(/https?:|\.style\b|innerHTML|outerHTML\s*=|insertAdjacentHTML|document\.write|createElement|cssText|adoptedStyleSheets|attachShadow/);
  expect(source).not.toMatch(/#[\da-f]{3,8}\b|rgba?\s*\(|hsla?\s*\(|getBoundingClientRect|offsetHeight|offsetWidth|getComputedStyle/);
  expect(source.match(/\.setAttribute\(/g)).toHaveLength(2);
  expect(source.match(/\.removeAttribute\(/g)).toHaveLength(1);
  expect(source).toMatch(/setAttribute\(PRIORITY_ATTRIBUTE, priority\)/);
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

test('four CSS rules map exact labels to alpha backgrounds and only direct ticket cells', () => {
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
    expect(matching).toEqual([...target.children]);
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
  document.documentElement.lang = 'en-US';
  for (const rule of rules) expect(document.querySelectorAll(rule.selectorText)).toHaveLength(0);
  expect(asset('zhroma.css')).not.toMatch(/@|url\(|box-shadow|font|\bopacity\s*:/);
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
