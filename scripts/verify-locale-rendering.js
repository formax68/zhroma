// Developer-only, built-in Node APIs. Never attaches to an existing browser.
import { spawn } from 'node:child_process';
import { access, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { isDeepStrictEqual } from 'node:util';
import { validateFixtureManifest } from './fixture-contract.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SCOPE = 'real-Chrome synthetic rendering';
const ACCEPTED = ['en', 'EN', 'en-GB', 'en-US', 'EN-gb', 'en-Latn-GB'];
const OTHER_LANGUAGES = ['fr', 'fr-CA', 'de'];
const MATRIX = [...ACCEPTED, ...OTHER_LANGUAGES, '', ' ', ' en', 'en ', ' en-GB ', 'en_US', null];
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const equal = isDeepStrictEqual;

export function parseArguments(args) {
  const options = { smoke: false }; const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    requireValue(!seen.has(flag), `Duplicate flag ${flag}`); seen.add(flag);
    if (flag === '--smoke') options.smoke = true;
    else if (flag === '--output') {
      const value = args[++i];
      requireValue(typeof value === 'string' && value.length > 0 && !value.startsWith('--'), 'Missing --output path');
      options.output = value;
    } else throw new Error(`Unsupported flag ${flag}`);
  }
  requireValue(!(options.smoke && options.output), 'Smoke cannot persist a report');
  return options;
}

export function validateLocaleReport(report) {
  requireValue(report?.scope === SCOPE && /^(?:HeadlessChrome|Chrome)\/\d+(?:\.\d+)+$/.test(report?.browser ?? '')
    && equal(Object.keys(report).sort(), ['browser', 'cases', 'scope']), 'Invalid synthetic scope/browser version');
  requireValue(Array.isArray(report.cases) && report.cases.length === MATRIX.length, 'Incomplete locale matrix');
  for (const [index, lang] of MATRIX.entries()) {
    const works = ACCEPTED.includes(lang);
    const expected = { lang, selectorMatches: works ? [16, 16, 16, 16] : [0, 0, 0, 0],
      cssPaintedCells: works ? 64 : 0,
      paintedCells: works ? 64 : 0, markers: works ? 4 : 0,
      paletteMatches: works ? [16, 16, 16, 16] : [0, 0, 0, 0],
      diagnosis: works ? 'working' : 'cannot-read', reason: works ? null : OTHER_LANGUAGES.includes(lang) ? 'unsupported-language' : 'structure' };
    const actual = report.cases[index];
    requireValue(actual && equal(Object.keys(actual).sort(), Object.keys(expected).sort())
      && Object.keys(expected).every((key) => equal(actual[key], expected[key])), `Locale matrix mismatch at case ${index + 1}`);
  }
  return 'passed';
}

// Exported only for unit checks of failure propagation, not a shipped surface.
export async function connectCdp(url, { timeoutMs = 3000, Socket = WebSocket } = {}) {
  requireValue(/^ws:\/\/127\.0\.0\.1:\d+\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(url), 'CDP endpoint must belong to the isolated loopback browser');
  const ws = new Socket(url); const pending = new Map(); let sequence = 0;
  const rejectPending = () => {
    for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('CDP disconnected')); }
    pending.clear();
  };
  ws.addEventListener('close', rejectPending);
  try {
    await new Promise((resolveOpen, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection timeout')), timeoutMs);
      ws.addEventListener('open', () => { clearTimeout(timer); resolveOpen(); }, { once: true });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
      ws.addEventListener('close', () => { clearTimeout(timer); reject(new Error('CDP disconnected')); }, { once: true });
    });
  } catch (error) { ws.close(); throw error; }
  ws.addEventListener('message', ({ data }) => {
    let message;
    try { message = JSON.parse(data); } catch { rejectPending(); ws.close(); return; }
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id); clearTimeout(waiter.timer);
    if (message.error) waiter.reject(new Error(`${waiter.method}: CDP command failed`));
    else waiter.resolve(message.result);
  });
  return {
    send(method, params = {}, sessionId) {
      return new Promise((resolveCommand, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method}: command timeout`)); }, timeoutMs);
        pending.set(id, { resolve: resolveCommand, reject, timer, method });
        try { ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })); }
        catch (error) { clearTimeout(timer); pending.delete(id); reject(error); }
      });
    },
    close() { rejectPending(); ws.close(); },
  };
}

export async function waitForChrome(profileDir, child, { timeoutMs = 10000, read = readFile } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    requireValue(child.exitCode === null && child.signalCode === null, 'Isolated Chrome exited before CDP became ready');
    let info;
    try { info = (await read(join(profileDir, 'DevToolsActivePort'), 'utf8')).trim().split('\n'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (info) {
      requireValue(/^\d+$/.test(info[0]) && Number(info[0]) > 0 && Number(info[0]) <= 65535
        && /^\/devtools\/browser\/[a-zA-Z0-9-]+$/.test(info[1]), 'Malformed Chrome CDP endpoint');
      return `ws://127.0.0.1:${info[0]}${info[1]}`;
    }
    await delay(Math.min(50, Math.max(1, deadline - Date.now())));
  }
  throw new Error('Chrome CDP startup timeout');
}

// Runs only in a labelled synthetic localhost document. The seam exposes the
// one persisted boolean and finite status request, with no real user storage.
function installHarness() {
  let listener;
  const seam = {
    runtime: { id: 'zhroma-locale-synthetic', lastError: undefined,
      onMessage: { addListener(value) { listener = value; } },
      sendMessage(_message, callback) { setTimeout(() => callback?.(), 0); },
    },
    storage: { onChanged: { addListener() {} }, local: {
      get(defaults, callback) {
        if (JSON.stringify(defaults) !== '{"enabled":true}') throw new Error('Unexpected preference read');
        setTimeout(() => callback({ enabled: true }), 0);
      },
    } },
  };
  Object.defineProperty(window, 'chrome', { value: seam, configurable: true });
  window.localeSnapshot = () => {
    let status;
    listener?.({ type: 'get-status', requestId: 1 }, { id: seam.runtime.id }, (value) => { status = value; });
    // Await the asynchronous preference read before disturbing this document.
    if (!status || !['working', 'cannot-read'].includes(status.diagnosis)) return null;
    const rules = [...document.styleSheets[0].cssRules];
    if (rules.length !== 4 || !rules.every((rule) => rule.type === CSSRule.STYLE_RULE)) throw new Error('Missing four CSS rules');
    const cells = [...document.querySelectorAll('tbody > tr > td')];
    const backgrounds = cells.map((cell) => getComputedStyle(cell).backgroundColor);
    const palette = ['rgba(220, 38, 38, 0.14)', 'rgba(234, 88, 12, 0.12)', 'rgba(202, 138, 4, 0.09)', 'rgba(22, 163, 74, 0.08)'];
    const observed = { lang: document.documentElement.getAttribute('lang'),
      paintedCells: backgrounds.filter((color) => color !== 'rgba(0, 0, 0, 0)').length,
      markers: document.querySelectorAll('[data-zhroma-priority]').length,
      paletteMatches: palette.map((color) => backgrounds.filter((actual) => actual === color).length),
      diagnosis: status?.diagnosis, reason: status?.reason };
    // Probe CSS with known markers independently of the source's refusal. A
    // zero count caused only by absent runtime markers proves nothing about
    // language selector behavior, especially the happy-dom right-padding gap.
    window.dispatchEvent(new Event('pagehide'));
    [...document.querySelectorAll('tbody > tr')].forEach((row, index) => {
      row.setAttribute('data-zhroma-priority', ['Urgent', 'High', 'Normal', 'Low'][index]);
    });
    observed.selectorMatches = rules.map((rule) => document.querySelectorAll(rule.selectorText).length);
    observed.cssPaintedCells = cells.filter((cell) => getComputedStyle(cell).backgroundColor !== 'rgba(0, 0, 0, 0)').length;
    return observed;
  };
}

export async function runLocaleRendering(options, settings = {}) {
  const root = settings.root ?? ROOT;
  // Read/validate all source before launching anything. No missing file is a skip.
  const fixture = await readFile(join(root, 'test/fixtures/zendesk-view-priority-present.html'), 'utf8');
  const content = await readFile(join(root, 'extension/content.js'));
  const css = await readFile(join(root, 'extension/zhroma.css'));
  await validateFixtureManifest(join(root, 'test/fixtures/manifest.json'), { requireCompleteScenarioMatrix: true });
  const chromeBin = settings.chromeBin ?? process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try { await access(chromeBin, constants.X_OK); } catch { throw new Error('Installed Chrome not executable; set CHROME_BIN to an existing Chrome executable'); }
  requireValue(typeof WebSocket === 'function', 'Node built-in WebSocket required');
  requireValue(options && typeof options.smoke === 'boolean' && !(options.smoke && options.output), 'Invalid smoke/output options');
  const routes = new Map([
    ['/content.js', ['text/javascript', content]], ['/zhroma.css', ['text/css', css]],
    ['/harness.js', ['text/javascript', `(${installHarness.toString()})();`]],
    ...MATRIX.map((lang, index) => [`/case-${index}`, ['text/html', `<!doctype html><html${lang === null ? '' : ` lang="${lang}"`}><head><meta charset="utf-8"><title>Zhroma synthetic locale rendering</title><link rel="stylesheet" href="/zhroma.css"></head><body>${fixture}<script src="/harness.js"></script><script src="/content.js"></script></body></html>`]]),
  ]);
  const server = createServer((request, response) => {
    const route = routes.get(request.url);
    if (request.method !== 'GET' || !route) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': route[0], 'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" });
    response.end(route[1]);
  });
  let profileDir; let child; let cdp; let watchdog;
  const deadline = Date.now() + 45000;
  try {
    await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
    profileDir = await mkdtemp(join(tmpdir(), 'zhroma-locale-'));
    child = spawn(chromeBin, [`--user-data-dir=${profileDir}`, '--remote-debugging-port=0', '--no-first-run',
      '--no-default-browser-check', '--disable-background-networking', '--disable-component-update',
      '--disable-sync', '--headless=new', 'about:blank'], { stdio: 'ignore' });
    let spawnError;
    child.on('error', (error) => { spawnError = error; });
    watchdog = setTimeout(() => { cdp?.close(); child.kill('SIGTERM'); }, 45000);
    const endpoint = await waitForChrome(profileDir, child);
    if (spawnError) throw spawnError;
    cdp = await connectCdp(endpoint);
    const version = await cdp.send('Browser.getVersion');
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params) => cdp.send(method, params, sessionId);
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      requireValue(!result?.exceptionDetails && result?.result, 'Synthetic page evaluation failed');
      return result.result.value;
    };
    await send('Page.enable');
    const cases = [];
    for (let index = 0; index < MATRIX.length; index++) {
      requireValue(Date.now() < deadline, 'Locale matrix timeout');
      const path = `/case-${index}`;
      await send('Page.navigate', { url: `http://127.0.0.1:${server.address().port}${path}` });
      let snapshot;
      const caseDeadline = Math.min(deadline, Date.now() + 2000);
      while (Date.now() < caseDeadline) {
        snapshot = await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete' && typeof window.localeSnapshot === 'function' ? window.localeSnapshot() : null`);
        if (snapshot && ['working', 'cannot-read'].includes(snapshot.diagnosis)) break;
        await delay(25);
      }
      requireValue(snapshot && ['working', 'cannot-read'].includes(snapshot.diagnosis), `Unexecuted locale case ${index + 1}`);
      cases.push(snapshot);
    }
    const report = { scope: SCOPE, browser: version.product, cases };
    validateLocaleReport(report);
    if (options.output) {
      const output = resolve(options.output);
      // Keep shipped bytes read-only and preserve any previous evidence file.
      const extension = join(root, 'extension');
      requireValue(output !== extension && !output.startsWith(`${extension}/`), 'Report cannot overwrite shipped assets');
      await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    }
    return report;
  } finally {
    clearTimeout(watchdog);
    cdp?.close();
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await Promise.race([new Promise((done) => child.once('exit', done)), delay(1500)]);
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await Promise.race([new Promise((done) => child.once('exit', done)), delay(1500)]);
      }
    }
    server.closeAllConnections(); await new Promise((done) => server.close(done));
    if (profileDir) await rm(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = await runLocaleRendering(parseArguments(process.argv.slice(2)));
    console.log('LOCALE RENDERING: passed');
    console.log(JSON.stringify(report, null, 2));
  } catch (error) { console.error(`LOCALE RENDERING ERROR: ${error.message}`); process.exitCode = 1; }
}
