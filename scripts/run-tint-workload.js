import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdtemp, rm, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir, cpus, platform, release, arch } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { validateFixtureManifest } from './fixture-contract.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OPERATIONS = ['edit', 'reorder', 'body', 'table', 'invalid-repair', 'unrelated'];
const ASSETS = ['manifest.json', 'content.js', 'zhroma.css'];
const requireValue = (condition, message) => { if (!condition) throw new Error(message); };
const finite = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
export function parseArguments(args) {
  const result = { size: 30, mode: 'enabled', smoke: false, headed: false, profile: false };
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i]; requireValue(!seen.has(key), `Duplicate flag ${key}`); seen.add(key);
    if (['--smoke', '--headed', '--profile'].includes(key)) result[key.slice(2)] = true;
    else if (['--size', '--mode', '--output'].includes(key)) {
      const value = args[++i]; requireValue(value && !value.startsWith('--'), `Missing value for ${key}`);
      result[key.slice(2)] = key === '--size' ? Number(value) : value;
    } else throw new Error(`Unsupported flag ${key}`);
  }
  requireValue([30, 200, 1000].includes(result.size), 'Size must be 30, 200 or 1000');
  requireValue(['enabled', 'disabled', 'dormant'].includes(result.mode), 'Mode must be enabled, disabled or dormant');
  requireValue(!(result.smoke && result.profile), 'Smoke and profile must be separate runs');
  return result;
}
export function summarizeSamples(samples) {
  requireValue(Array.isArray(samples) && samples.length > 0, 'Empty samples');
  for (const s of samples) {
    requireValue(Array.isArray(s.segments) && finite(s.totalCpu) && finite(s.latency) && Number.isInteger(s.writes) && s.writes >= 0, 'Incomplete sample');
    requireValue(s.segments.every((p) => ['observer', 'timer', 'lifecycle'].includes(p.category) && finite(p.cpu)), 'Invalid callback segment');
    const total = s.segments.reduce((n, p) => n + p.cpu, 0);
    requireValue(Math.abs(total - s.totalCpu) < 0.000001 && s.callbacks === s.segments.length, 'Incorrect total callback CPU/count');
    requireValue(s.passes === s.segments.filter((p) => p.category === 'timer').length, 'Missing timer callbacks');
  }
  const values = samples.map((s) => s.totalCpu).sort((a, b) => a - b);
  const latency = samples.map((s) => s.latency).sort((a, b) => a - b);
  const quantile = (array, p) => array[Math.ceil(array.length * p) - 1];
  return { count: values.length, median: quantile(values, 0.5), p95: quantile(values, 0.95), max: values.at(-1), latencyMedian: quantile(latency, 0.5),
    observerCpu: samples.reduce((n, s) => n + s.segments.filter((p) => p.category === 'observer').reduce((sum, p) => sum + p.cpu, 0), 0),
    timerCpu: samples.reduce((n, s) => n + s.segments.filter((p) => p.category === 'timer').reduce((sum, p) => sum + p.cpu, 0), 0),
    callbacks: samples.reduce((n, s) => n + s.callbacks, 0), passes: samples.reduce((n, s) => n + s.passes, 0), writes: samples.reduce((n, s) => n + s.writes, 0) };
}
export function validateWorkloadReport(run) {
  requireValue([30, 200, 1000].includes(run.size) && ['enabled', 'disabled', 'dormant'].includes(run.mode), 'Invalid run scope');
  // Only the dormant mode is required to declare a runtime. Enabled and
  // disabled runs — including Phase 3's historical samples, which predate the
  // field entirely — validate exactly as they always have.
  if (run.mode === 'dormant') requireValue(run.runtime === 'loaded', 'Dormant run must report a loaded runtime');
  requireValue(run.warmups === 10 && run.measured === 100, 'Incomplete protocol');
  requireValue(run.operations && Object.keys(run.operations).length === 6 && OPERATIONS.every((op) => Object.hasOwn(run.operations, op)), 'Incomplete operation matrix');
  let failed = false;
  for (const op of OPERATIONS) {
    const samples = run.operations[op]; requireValue(samples.length === 100, 'Incomplete sample matrix');
    const metrics = summarizeSamples(samples);
    // A loaded controller that declines to act must cost nothing observable.
    // No timing budget applies: the claim dormancy makes is zero work, not a
    // fast amount of it.
    if (run.mode === 'dormant') requireValue(metrics.callbacks === 0 && metrics.writes === 0, 'Extension callbacks in dormant run');
    else if (run.mode === 'disabled') requireValue(metrics.callbacks === 0 && metrics.writes === 0, 'Extension callbacks in disabled control');
    else {
      if (op !== 'unrelated') requireValue(samples.every((s) => s.passes > 0 && s.segments.some((p) => p.category === 'observer')), 'Missing extension callback categories');
      if (metrics.max >= 16 || (run.size === 30 && metrics.median >= 2)) failed = true;
    }
  }
  return failed ? 'gaps_found' : 'passed';
}
export function mergeReport(previous, identity, key, run) {
  requireValue(!previous || JSON.stringify(previous.identity) === JSON.stringify(identity), 'Refusing stale/mixed source or environment identity; use a new output file');
  const report = previous || { schema_version: 1, identity, runs: {} };
  // A repeat is retained instead of silently deleting an earlier slow sample.
  requireValue(!Object.hasOwn(report.runs, key), 'Run already exists; retain it and choose a new output file for a repeat');
  report.runs[key] = run;
  const keys = [30, 200, 1000].flatMap((size) => ['enabled', 'disabled'].map((mode) => `${size}-${mode}`));
  report.timingStatus = keys.every((k) => report.runs[k])
    ? keys.some((k) => validateWorkloadReport(report.runs[k]) === 'gaps_found') ? 'gaps_found' : 'passed' : 'incomplete';
  return report;
}
async function connectCdp(url) {
  const ws = new WebSocket(url); const pending = new Map(); const listeners = new Map(); let id = 0;
  await new Promise((resolveOpen, reject) => {
    const timer = setTimeout(() => reject(new Error('CDP connection timeout')), 10000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolveOpen(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
  });
  ws.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id); pending.delete(message.id); clearTimeout(waiter.timer);
      if (message.error) waiter.reject(new Error(`${waiter.method}: ${message.error.message}`)); else waiter.resolve(message.result);
    } else for (const listener of listeners.get(message.method) || []) listener(message.params);
  });
  ws.addEventListener('close', () => { for (const waiter of pending.values()) { clearTimeout(waiter.timer); waiter.reject(new Error('CDP disconnected')); } pending.clear(); });
  return {
    send(method, params = {}, sessionId, timeoutMs = 60000) {
      return new Promise((resolveCommand, reject) => {
        const requestId = ++id;
        const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method}: command timeout`)); }, timeoutMs);
        pending.set(requestId, { resolve: resolveCommand, reject, timer, method });
        ws.send(JSON.stringify({ id: requestId, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    },
    on(method, callback) { if (!listeners.has(method)) listeners.set(method, new Set()); listeners.get(method).add(callback); return () => listeners.get(method).delete(callback); },
    close() { ws.close(); },
  };
}
function snapshotCounts(snapshot) {
  const fields = snapshot.snapshot.meta.node_fields; const stride = fields.length;
  const ni = fields.indexOf('name'); const di = fields.indexOf('detachedness');
  let detachedRows = 0; let rowNodes = 0;
  for (let i = 0; i < snapshot.nodes.length; i += stride) {
    const name = snapshot.strings[snapshot.nodes[i + ni]];
    if (/HTMLTableRowElement|^<tr\b/i.test(name)) { rowNodes++; if (di >= 0 && snapshot.nodes[i + di] === 2) detachedRows++; }
  }
  return { rowNodes, detachedRows: di >= 0 ? detachedRows : null, hasDetachedness: di >= 0 };
}
async function runProfile(cdp, send, evaluate) {
  const events = [];
  const offTrace = cdp.on('Tracing.dataCollected', ({ value }) => events.push(...value));
  let resolveTrace; const done = new Promise((resolveDone) => { resolveTrace = resolveDone; });
  const offDone = cdp.on('Tracing.tracingComplete', resolveTrace);
  await send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline,disabled-by-default-devtools.timeline.stack,blink.user_timing', transferMode: 'ReportEvents' });
  await evaluate('window.tintWorkload.run({profile:true})');
  await send('Tracing.end');
  await Promise.race([done, delay(15000).then(() => { throw new Error('Trace completion timeout'); })]);
  offTrace(); offDone();
  const layout = events.filter((event) => event.name === 'Layout');
  const attributed = layout.filter((event) => JSON.stringify(event.args).includes('/extension/content.js'));
  const callbackMarkers = events.filter((event) => event.name.startsWith('zhroma-callback-')).length;
  // Stack absence is inconclusive. Retain no raw trace in repository artifacts.
  const layoutResult = { status: attributed.length ? 'gaps_found' : 'human_needed', attributedForcedLayouts: attributed.length || null,
    layoutEvents: layout.length, callbackMarkers, reason: 'Automatic stack scan alone cannot rule out missing synchronous attribution; inspect --headed DevTools trace.' };
  events.length = 0;
  await send('HeapProfiler.enable');
  async function heap() {
    await evaluate('window.tintWorkload.resting()'); await send('HeapProfiler.collectGarbage');
    let chunks = [];
    const off = cdp.on('HeapProfiler.addHeapSnapshotChunk', ({ chunk }) => chunks.push(chunk));
    try { await send('HeapProfiler.takeHeapSnapshot', { reportProgress: false }); const counts = snapshotCounts(JSON.parse(chunks.join(''))); chunks = []; return counts; }
    finally { off(); chunks = []; }
  }
  const before = await heap(); const resources = await evaluate('window.tintWorkload.switches()'); const after = await heap();
  return { profile: true, ...resources, layout: layoutResult,
    retention: { status: 'human_needed', before, after, reason: 'Post-GC snapshots collected; aggregate counts do not establish extension-controller retainer attribution. Requires DevTools retainer inspection.' },
    status: attributed.length ? 'gaps_found' : 'human_needed' };
}
export async function runWorkload(options) {
  requireValue(typeof WebSocket === 'function', 'Use installed Node with built-in WebSocket (Node 22+); no package installation required');
  const chromeBin = process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  try { await access(chromeBin, constants.X_OK); } catch { throw new Error('Installed Chrome not executable; set CHROME_BIN to an existing Chrome executable'); }
  await validateFixtureManifest(join(root, 'test/fixtures/manifest.json'), { requireCompleteScenarioMatrix: true });
  const routes = new Map();
  for (const path of ['test/performance/tint-workload.html', 'test/performance/tint-workload.js', 'test/fixtures/zendesk-view-priority-present.html', ...ASSETS.map((name) => `extension/${name}`)]) routes.set(`/${path}`, await readFile(join(root, path)));
  const hashes = Object.fromEntries(ASSETS.map((name) => [name, createHash('sha256').update(routes.get(`/extension/${name}`)).digest('hex')]));
  const server = createServer((request, response) => {
    const path = new URL(request.url, 'http://127.0.0.1').pathname;
    const data = routes.get(path);
    if (request.method !== 'GET' || !data) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { 'Content-Type': path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html', 'Cache-Control': 'no-store' }); response.end(data);
  });
  let profileDir; let child; let cdp; let targetId;
  try {
    await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
    profileDir = await mkdtemp(join(tmpdir(), 'zhroma-tint-'));
    child = spawn(chromeBin, [`--user-data-dir=${profileDir}`, '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', ...(options.headed ? [] : ['--headless=new']), 'about:blank'], { stdio: ['ignore', 'ignore', 'ignore'] });
    let spawnError; child.on('error', (error) => { spawnError = error; });
    let portInfo;
    for (let i = 0; i < 200; i++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) throw new Error('Isolated Chrome exited before CDP became ready');
      try { portInfo = (await readFile(join(profileDir, 'DevToolsActivePort'), 'utf8')).trim().split('\n'); break; } catch { await delay(50); }
    }
    requireValue(portInfo && /^\d+$/.test(portInfo[0]) && portInfo[1].startsWith('/devtools/browser/'), 'Chrome CDP startup timeout');
    cdp = await connectCdp(`ws://127.0.0.1:${portInfo[0]}${portInfo[1]}`);
    const version = await cdp.send('Browser.getVersion');
    ({ targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' }));
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
    const send = (method, params, timeoutMs) => cdp.send(method, params, sessionId, timeoutMs);
    const evaluate = async (expression, timeoutMs) => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, timeoutMs);
      requireValue(!result.exceptionDetails, `Workload failed: ${result.exceptionDetails?.exception?.description || result.exceptionDetails?.text}`);
      return result.result.value;
    };
    await send('Page.enable'); await send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const origin = `http://127.0.0.1:${server.address().port}`;
    await send('Page.navigate', { url: `${origin}/test/performance/tint-workload.html?size=${options.size}&mode=${options.mode}&profile=${options.profile}` });
    for (let i = 0; i < 200; i++) { if (await evaluate('Boolean(window.tintWorkload)')) break; if (i === 199) throw new Error('Workload page load timeout'); await delay(25); }
    const identity = { hashes, browser: version.product, revision: version.revision, os: `${platform()} ${release()} ${arch()}`, cpu: cpus()[0]?.model || 'unknown', cpuThrottle: 1, headed: options.headed,
      harnessHash: createHash('sha256').update(await readFile(fileURLToPath(import.meta.url))).update(routes.get('/test/performance/tint-workload.js')).digest('hex') };
    // The six-operation matrix includes 660 batches and real settling delays.
    // Keep it bounded separately from individual setup/profile CDP commands.
    const result = options.profile ? await runProfile(cdp, send, evaluate) : await evaluate(`window.tintWorkload.run(${JSON.stringify({ smoke: options.smoke })})`, 180000);
    result.timestamp = new Date().toISOString();
    if (!options.profile) {
      result.metrics = Object.fromEntries(Object.entries(result.operations).map(([key, samples]) => [key, summarizeSamples(samples)]));
      result.status = options.smoke ? 'smoke_passed' : validateWorkloadReport(result);
      if (options.smoke && options.mode === 'enabled') requireValue(result.metrics.edit.callbacks > 0, 'Smoke missing extension callbacks');
      // The claim the dormant mode exists to make, asserted rather than assumed.
      if (options.smoke && options.mode === 'dormant') {
        requireValue(result.runtime === 'loaded', 'Dormant smoke did not load the runtime');
        requireValue(result.metrics.edit.callbacks === 0 && result.metrics.edit.writes === 0, 'Dormant smoke recorded extension callbacks or writes');
        requireValue(result.resources.observers === 0 && result.resources.pendingTimers === 0, 'Dormant smoke retained observers or pending timers');
      }
    }
    if (options.output) {
      const output = resolve(options.output); let previous;
      try { previous = JSON.parse(await readFile(output, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      const key = `${options.size}-${options.mode}${options.profile ? '-profile' : options.smoke ? '-smoke' : ''}`;
      const merged = mergeReport(previous, identity, key, result);
      await writeFile(output, `${JSON.stringify(merged, null, 2)}\n`);
    }
    return { identity, result };
  } finally {
    if (cdp) {
      if (targetId) await cdp.send('Target.closeTarget', { targetId }).catch(() => {});
      await cdp.send('Browser.close').catch(() => {}); cdp.close();
    }
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill('SIGTERM');
      await Promise.race([new Promise((resolveExit) => child.once('exit', resolveExit)), delay(3000)]);
      if (child.exitCode === null && child.signalCode === null) { child.kill('SIGKILL'); await new Promise((resolveExit) => child.once('exit', resolveExit)); }
    }
    server.closeAllConnections(); await new Promise((resolveClose) => server.close(resolveClose));
    if (profileDir) await rm(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2)); const { identity, result } = await runWorkload(options);
    console.log(options.smoke ? 'TINT WORKLOAD SMOKE: passed' : `TINT WORKLOAD: ${result.status}`);
    console.log(JSON.stringify({ identity, status: result.status, metrics: result.metrics, ...(options.profile ? { profile: result } : {}) }, null, 2));
    if (result.status === 'gaps_found') process.exitCode = 1;
  } catch (error) { console.error(`TINT WORKLOAD ERROR: ${error.message}`); process.exitCode = 1; }
}
