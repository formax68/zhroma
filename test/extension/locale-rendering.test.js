// @vitest-environment node
// Unit evidence only. The separate CLI invocation supplies real Chrome evidence.
import { spawnSync } from 'node:child_process';
import { expect, test } from 'vitest';
import { parseArguments, validateLocaleReport, runLocaleRendering, connectCdp, waitForChrome } from '../../scripts/verify-locale-rendering.js';

const accepted = ['en', 'EN', 'en-GB', 'en-US', 'EN-gb', 'en-Latn-GB'];
const languages = ['fr', 'fr-CA', 'de'];
const malformed = ['', ' ', ' en', 'en ', ' en-GB ', 'en_US', null];
const report = () => ({ scope: 'real-Chrome synthetic rendering', browser: 'Chrome/140.0.0.0',
  cases: [...accepted, ...languages, ...malformed].map((lang) => {
    const works = accepted.includes(lang);
    return { lang, selectorMatches: works ? [16, 16, 16, 16] : [0, 0, 0, 0],
      cssPaintedCells: works ? 64 : 0,
      paintedCells: works ? 64 : 0, markers: works ? 4 : 0,
      paletteMatches: works ? [16, 16, 16, 16] : [0, 0, 0, 0],
      diagnosis: works ? 'working' : 'cannot-read', reason: works ? null : languages.includes(lang) ? 'unsupported-language' : 'structure' };
  }) });

test('locale rendering refuses empty evidence instead of reporting a skipped pass', () => {
  expect(() => validateLocaleReport({ ...report(), cases: [] }), '[locale:empty-evidence]').toThrow(/matrix/);
});
test('locale rendering accepts the complete finite expected matrix', () => {
  expect(validateLocaleReport(report())).toBe('passed');
});
test.each([
  ['missing case', (r) => r.cases.pop()],
  ['duplicate case', (r) => { r.cases[1] = r.cases[0]; }],
  ['wrong markers', (r) => { r.cases[0].markers = 0; }],
  ['malformed English blame', (r) => { r.cases[12].reason = 'unsupported-language'; }],
  ['no CSS selector extraction', (r) => { r.cases[0].selectorMatches = []; }],
  ['wrong computed palette', (r) => { r.cases[0].paletteMatches[0] = 0; }],
  ['nonfinite counts', (r) => { r.cases[0].paintedCells = NaN; }],
  ['nonfinite reason', (r) => { r.cases[0].reason = NaN; }],
  ['CSS paints a refused shell', (r) => { r.cases[12].cssPaintedCells = 64; }],
  ['missing version', (r) => { delete r.browser; }],
  ['live scope claim', (r) => { r.scope = 'live Zendesk acceptance'; }],
  ['unexpected payload', (r) => { r.cases[0].pageText = 'must not be retained'; }],
])('locale rendering rejects %s', (_name, mutate) => {
  const value = report(); mutate(value);
  expect(() => validateLocaleReport(value)).toThrow();
});
test('smoke uses the same matrix without output persistence', () => {
  expect(parseArguments(['--smoke'])).toEqual({ smoke: true });
  expect(parseArguments([])).toEqual({ smoke: false });
  expect(parseArguments(['--output', '/tmp/locale.json'])).toEqual({ smoke: false, output: '/tmp/locale.json' });
});

test('Chrome startup timeout propagates as failure', async () => {
  const missing = async () => { throw Object.assign(new Error('missing'), { code: 'ENOENT' }); };
  await expect(waitForChrome('/unused', { exitCode: null, signalCode: null }, { timeoutMs: 5, read: missing })).rejects.toThrow(/startup timeout/);
});
test('Chrome exit or malformed endpoint cannot become browser evidence', async () => {
  await expect(waitForChrome('/unused', { exitCode: 1, signalCode: null })).rejects.toThrow(/exited/);
  await expect(waitForChrome('/unused', { exitCode: null, signalCode: null }, { read: async () => '1234\nhttps://external.example' })).rejects.toThrow(/Malformed/);
});
test('CDP connection timeout closes the owned socket and propagates failure', async () => {
  let closed = false;
  class SilentSocket extends EventTarget { close() { closed = true; } }
  await expect(connectCdp('ws://127.0.0.1:1234/devtools/browser/synthetic', { timeoutMs: 5, Socket: SilentSocket })).rejects.toThrow(/connection timeout/);
  expect(closed).toBe(true);
});
test('CDP refuses a nonlocal endpoint before creating a socket', async () => {
  class UnexpectedSocket { constructor() { throw new Error('Socket must not be constructed'); } }
  await expect(connectCdp('wss://remote.example/devtools/browser/id', { Socket: UnexpectedSocket })).rejects.toThrow(/isolated loopback/);
});
test.each([['--skip'], ['--smoke', '--smoke'], ['--output'], ['--smoke', '--output', 'report.json'], ['--url', 'https://example.com']])('invalid CLI arguments fail closed: %j', (...args) => {
  expect(() => parseArguments(args)).toThrow();
});
test('unavailable Chrome execution fails rather than returning synthetic success', async () => {
  await expect(runLocaleRendering({ smoke: true }, { chromeBin: '/nonexistent/zhroma-chrome' })).rejects.toThrow(/Chrome.*executable/);
});
test('missing shipped source fails before starting Chrome', async () => {
  await expect(runLocaleRendering({ smoke: true }, { root: '/nonexistent/zhroma-source' })).rejects.toThrow(/ENOENT|source/);
});
test('CLI propagates missing browser failure with nonzero exit and no pass line', () => {
  const result = spawnSync(process.execPath, ['scripts/verify-locale-rendering.js', '--smoke'], {
    encoding: 'utf8', env: { ...process.env, CHROME_BIN: '/nonexistent/zhroma-chrome' }, timeout: 5000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toMatch(/LOCALE RENDERING ERROR:/);
  expect(result.stdout).not.toContain('LOCALE RENDERING: passed');
});
