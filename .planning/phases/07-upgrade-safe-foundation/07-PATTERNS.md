# Phase 7: Upgrade-Safe Foundation - Pattern Map

**Mapped:** 2026-09-28
**Files analyzed:** 27 (11 new, 16 modified)
**Analogs found:** 25 / 27 (2 have no analog in the repo: `tsconfig.json` and the shared-namespace mechanism itself)

Every analog path below is git-tracked (checked with `git ls-files`). The `.gsd/` tree is untracked and was not used.

Baseline check done while mapping: `git show 6d3ab0b:extension/{content.js,zhroma.css,manifest.json,background.js}` hash to the `release/candidate.json` sha256 prefixes `c9e83c83…`, `8eb5da85…`, `5cf11d9a…` and `0f48bb10…`. `git ls-tree -r --name-only 6d3ab0b -- extension` lists exactly the 12 `RELEASE_FILES`. `extension/` has not changed since `79863ae`.

Measured while mapping (scratch script, nothing written to the repo): happy-dom 20.13.1 `window.getComputedStyle(cell).backgroundColor` does resolve `zhroma.css` rules injected as a `<style>`. It returns `"rgb(220 38 38 / 0.14)"` for an Urgent cell and `""` for an untinted one. So the parity harness can compare computed backgrounds directly.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `extension/zhroma-settings.js` (NEW, shared IIFE + settings module) | utility / model | transform (pure validate/migrate) | `extension/background.js` L1-2, L73-76, L109-121; `extension/content.js` L441-468 | role-match (no shared global exists yet) |
| `extension/options.html` (NEW, static stub) | component (page) | none (static) | `extension/popup.html` | exact |
| `extension/manifest.json` (MOD: `content_scripts.js[]` gains the shared file first; add `options_ui`) | config | n/a | itself; the STACK.md §1 manifest delta | exact |
| `extension/background.js` (MOD: `importScripts` first, settings queue, D-17 sender checks) | service (worker) | event-driven, single-writer queue | itself: `preferenceQueue`/`admitPreference`/`drainPreferences` L64-71, L143-182; `fromContent`/`fromPopup` L405-414 | exact |
| `extension/content.js` (MOD: settings reader, change listener, `settingsReady` gate) | controller (content) | event-driven (storage read + onChanged) | itself: `readPreference`/`applyPreference`/`onPreferenceChanged` L421-468; `runnable()` L351-353 | exact |
| `scripts/release-source.js` (MOD: `RELEASE_FILES`) | config / utility | file-I/O | itself L27-44 | exact |
| `scripts/baseline-source.js` (NEW, pinned `6d3ab0b` blob reader) | utility | file-I/O (git blobs) | `scripts/phase-04-source.js` | exact |
| `test/extension/frozen-contract.test.js` (NEW, frozen invariants) | test | static source/manifest checks | `test/extension/runtime-contract.test.js` L64-102; `test/extension/toolbar-popup.test.js` L257-299, L323-334 | exact |
| `test/extension/runtime-contract.test.js` (MOD: becomes the versioned v1.0 pins) | test | static + DOM | itself | exact |
| `test/extension/parity.test.js` (NEW, differential 0.1.0 parity harness) | test | batch (two runtimes side by side) | `test/extension/persistent-tint.test.js` L34-95 (loader), L197-277 (mutation sequences); `runtime-contract.test.js` L310-374 (CSS paint model) | role-match |
| `test/extension/settings-module.test.js` (NEW) | test | transform | `test/extension/mutation-registry.test.js` (pure `test.each` rejection table); `chrome-harness.js` `PREFERENCE_CONTRACT` L26-37 | role-match |
| `test/extension/settings-queue.test.js` (NEW: worker queue, CAS, D-17 senders) | test | event-driven | `test/extension/failure-seam.test.js` L55-125; `preference-outcome.test.js` L265-277 | exact |
| `test/extension/settings-reader.test.js` (NEW: content reader, gate, onChanged) | test | event-driven | `test/extension/toolbar-popup.test.js` L345-404 | exact |
| `test/extension/upgrade-storage.test.js` (NEW: COMPAT-02, DATA-01 local-only) | test | CRUD (storage state) | `preference-outcome.test.js` L265-277 (`writeLog`, `snapshot()`); `tracer-world.js` `storageKeys()` L498 | exact |
| `test/extension/chrome-harness.js` (MOD: admit the settings read seam) | test double | request-response | itself L120-142 | exact |
| `test/extension/tracer-world.js` (MOD: load shared file, admit `importScripts`, content sender `url`, options sender) | test double | request-response | itself L230-252, L559-608 | exact |
| `test/extension/toolbar-popup.test.js` (MOD: manifest/inventory/global pins) | test | static | itself L257-299, L946-956 | exact |
| `test/extension/release-package.test.js` (MOD: inventory count) | test | file-I/O | itself L63-76 | exact |
| `test/mutants/settings-foundation.mutants.json` (NEW) | config (mutant registry) | batch | `test/mutants/worker-boundary.mutants.json` | exact |
| `test/performance/tint-workload.js` (MOD: load `content_scripts.js[]` in order, seam admits the settings read) | test harness (browser page) | streaming (timed) | itself L38-85, L178-195 | exact |
| `scripts/run-tint-workload.js` (MOD: serve the new assets, optionally serve the `6d3ab0b` bytes) | utility (CLI) | file-I/O + batch | itself L14, L157-160; `scripts/phase-04-source.js` `blob()` | exact |
| `tsconfig.json` (NEW, repo root, dev-only) | config | n/a | none | **no analog** |
| `package.json` (MOD: `typescript`, `@types/chrome`, typecheck step inside `npm test`) | config | n/a | itself | exact |
| `package-lock.json` (MOD) | config | n/a | generated by npm | n/a |
| `DEPENDENCY-APPROVALS.md` (MOD: two new rows + verbatim answers) | docs / record | n/a | itself | exact |
| `test/recon/dependency-approvals.smoke.js` (NO CHANGE expected) | test | static | itself | guards the rows automatically |
| `types/zhroma.d.ts` (OPTIONAL NEW, non-shipped typedefs) | config (types) | n/a | none (STACK.md §1 suggests it) | no analog |

**File layout recommendation (Claude's discretion):** use a flat `extension/zhroma-settings.js`, the ARCHITECTURE.md L85/L104 layout. The frozen/versioned manifest-name regex at `runtime-contract.test.js` L98 is `/^(icons\/)?[a-z-]+\.(js|css|html|png)$/`. It accepts `zhroma-settings.js` and `options.html` but **rejects `lib/settings.js`**. A flat layout keeps that assertion unchanged. The looser regex at `toolbar-popup.test.js` L283 accepts either layout.

---

## Pattern Assignments

### `extension/zhroma-settings.js` (utility, pure transform) — NEW

**Analogs:** `extension/background.js`, `extension/content.js` (the IIFE and validator idioms), and STACK.md §6 (the namespace idiom).

**IIFE header** (`background.js` L1-2, the same in `content.js` L1-2 and `popup.js` L1-2):
```js
(() => {
  'use strict';
```

**Shared-namespace idiom.** Nothing in the repo does this yet; the source is `.planning/research/STACK.md` L278-286:
```js
  const lib = (globalThis.ZhromaLib ??= {});   // ??= is Chrome 85+
  if (lib.colour) return;                       // idempotent if loaded twice
  // …
  lib.colour = Object.freeze({ parseHex, composite, … });
})();
```
Apply it as one frozen global (for example `globalThis.Zhroma`, holding `settings`) and freeze each sub-object. The runtime contract forbids DOM writes, so this file must not reference `document`, `chrome` or storage. It is pure.

**Shape-validator idiom to reuse** (`background.js` L73-76; a copy lives in `popup.js` L43-45):
```js
  const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
  const isExact = (value, keys) => isObject(value)
    && Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
```
Use `Object.hasOwn` and rebuild fresh objects from whitelisted keys. Never spread or `Object.assign` input (STACK.md §5, "Parse, don't validate").

**Absence-means-default semantics to mirror** (`background.js` L109-121). A failure is `null`, never absence:
```js
  // Reads answer with the value storage actually holds, never with the value
  // anyone hoped for. `null` means unconfirmed — a failure, never absence.
  function readPreference() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get({ [PREFERENCE_KEY]: true }, (values) => {
          if (chrome.runtime.lastError) { resolve(null); return; }
          const value = isObject(values) ? values[PREFERENCE_KEY] : undefined;
          resolve(typeof value === 'boolean' ? value : null);
        });
      } catch { resolve(null); }
    });
  }
```
The settings module differs on purpose (D-08/D-09). An unreadable value (invalid, unknown or newer `v`, or a read failure) resolves to the **default** plus a finite per-key status such as `'default' | 'stored' | 'unreadable'` (D-12). It must never write back.

**Finite-vocabulary constant style** (`background.js` L22-27): `const PREFERENCE_KEY = 'enabled'; const DIAGNOSES = [...]`. Keep the registry as frozen literals so agreement tests can grep them.

**Registry sketch.** D-13/D-14/D-15 require that adding a key is one entry plus one validator. The STACK.md §4 shape is `theme: { v: 1, id: 'zhroma-classic' }`, with the Phase 7 enum `['zhroma-classic']` only.

**Type checking:** start the file with `// @ts-check` and JSDoc `@typedef` (D-21; STACK.md §1 says use `@typedef`, not `@enum`).

---

### `extension/options.html` (static stub page) — NEW

**Analog:** `extension/popup.html` (all 21 lines):
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Zhroma — priority tinting status</title>
<style>
  /* Layout only. The product palette lives in zhroma.css and nowhere else. */
  body { … font: 0.875rem/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
</style>
</head>
<body>
<h1>Zhroma</h1>
…
<script src="popup.js"></script>
</body>
</html>
```
D-18 requires one line of neutral text, no `innerHTML`, no network and no script that writes storage. The simplest form has **no `<script>` at all**, which leaves nothing to add to `RELEASE_FILES` beyond `options.html`. Keep the popup's system-font stack. The existing check at `toolbar-popup.test.js` L333 also applies: `expect(asset(POPUP_PATH)).not.toMatch(/<script(?![^>]*\ssrc=)/i)` means there can be no inline script (MV3 CSP).

---

### `extension/manifest.json` (config) — MODIFIED

**Current** (24 lines): `content_scripts[0].js` is `["content.js"]` and there is no `options_ui`.

**Target delta** (STACK.md L91, L97):
```json
  "options_ui": { "page": "options.html", "open_in_tab": true },
  …
  "js": ["zhroma-settings.js", "content.js"],
```
`version` stays `"0.1.0"` (D-19). `permissions`, `matches`, `world`, `all_frames` and `minimum_chrome_version` do not change (D-01). `background` stays classic, with no `"type": "module"`, so `importScripts` works.

---

### `extension/background.js` (worker, single-writer queue) — MODIFIED

**First statement** (ARCHITECTURE.md L529: "It must be the first statement, before any listener registration"):
```js
importScripts('zhroma-settings.js');
(() => {
  'use strict';
```

**Queue pattern to copy for the settings queue** (L64-71 state, L143-182 admit/drain). This is the v1 single writer:
```js
  const preferenceQueue = [];
  let activePreference = null;
  let pendingWrite = null;
  let writeEpoch = 0;
  …
  function admitPreference(requestId, desired, sendResponse) {
    const job = { requestId, desired, expires: Date.now() + WORKER_REQUEST_TIMEOUT_MS, … answered: false, raw: null };
    if (preferenceQueue.length + (activePreference === null ? 0 : 1) >= MAX_PENDING_PREFERENCES) {
      sendResponse(preferenceReply(job));
      return;
    }
    job.answer = () => { if (job.answered) return; job.answered = true; clearTimeout(job.timer); sendResponse(preferenceReply(job)); };
    job.timer = setTimeout(() => { job.expired = true; /* splice out */ job.answer(); }, WORKER_REQUEST_TIMEOUT_MS);
    preferenceQueue.push(job);
    drainPreferences();
  }

  async function drainPreferences() {
    if (activePreference !== null) return;
    const job = preferenceQueue.shift();
    if (job === undefined) return;
    activePreference = job;
    try {
      if (!job.expired && Date.now() < job.expires) await setEnabled(job);
    } finally {
      job.answer();
      if (job.raw !== null) await job.raw;   // the raw callback owns the writer even after expiry
      activePreference = null;
      drainPreferences();
    }
  }
```
The `enabled` path stays byte-for-byte as it is (D-02). Build a **separate** `settingsQueue`/`activeSetting` pair and do not fold it into this one (ARCHITECTURE.md Anti-pattern 7). If the two share a single physical writer, keep the invariant that `Math.max(...world.writeObservations) === 1` (`preference-outcome.test.js` L277).

**Write primitive to copy** (L125-133). Only `chrome.storage.local`, only the one key being set:
```js
  function writePreference(enabled) {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.set({ [PREFERENCE_KEY]: enabled }, () => {
          resolve(!chrome.runtime.lastError);
        });
      } catch { resolve(false); }
    });
  }
```
D-11: before writing, read the current effective value and skip the write when it equals the desired value. On a fresh install, re-selecting Classic writes nothing. CAS (D-16) is a per-key registry flag: compare the expected revision against the stored value's revision inside the drained job, never outside the queue.

**Bounded waits** (L85-93, `bounded(start, expires, cap)`). Reuse them for every settings hop.

**Sender predicates to extend** (L405-414):
```js
  const fromContent = (sender) => isObject(sender)
    && sender.id === chrome.runtime.id
    && sender.frameId === 0
    && typeof sender.documentId === 'string' && sender.documentId.length > 0
    && isObject(sender.tab) && Number.isInteger(sender.tab.id);

  const fromPopup = (sender) => isObject(sender)
    && sender.id === chrome.runtime.id
    && sender.tab === undefined
    && sender.url === chrome.runtime.getURL(POPUP_PATH);
```
D-17: `fromContent` must also require that `sender.url` is a `https://<sub>.zendesk.com/agent/…` document. Parse it with `new URL(...)` and check `protocol === 'https:'`, a hostname ending `.zendesk.com` and `pathname.startsWith('/agent/')`. Wrap the parse in try/catch, and note that the worker must not parse *tab* URLs for routing (L439-440 comment). Add `fromOptions` by the same pattern as `fromPopup` with `OPTIONS_PATH = 'options.html'`. Note that an options page opened in a tab **does** carry `sender.tab`, so it cannot copy `sender.tab === undefined`. Pin that difference in a test.

**Dispatch pattern** (L416-437). Exact-shape message gates, with `return true` for an async reply:
```js
    if (isExact(message, ['type', 'requestId', 'enabled']) && message.type === 'set-enabled'
      && isRequestId(message.requestId) && typeof message.enabled === 'boolean' && fromPopup(sender)) {
      admitPreference(message.requestId, message.enabled, sendResponse);
      return true;
    }
    return undefined;
```
Add the settings message (for example `'set-setting'`, carrying `key` and `value` plus an optional `revision`) as another `isExact` branch. Do **not** reorder the existing three branches: 27 of the 39 registered mutants `find` literal text in `background.js` (see Shared Patterns: Mutant registry).

**No `onInstalled` listener** (D-04). The absence is itself asserted (see `upgrade-storage.test.js`).

---

### `extension/content.js` (content controller, storage reader) — MODIFIED

**Reader pattern to copy with its own generation counter** (L438-456):
```js
  function readPreference(done) {
    preferenceGeneration += 1;
    const generation = preferenceGeneration;
    const finish = (value) => {
      const applied = applyPreference(value, generation, done !== undefined);
      if (done !== undefined) done(applied);
    };
    try {
      chrome.storage.local.get({ [PREFERENCE_KEY]: true }, (values) => {
        if (chrome.runtime.lastError) { finish(null); return; }
        finish(values ? values[PREFERENCE_KEY] : null);
      });
    } catch { finish(null); }
  }
```
The settings reader is a **separate** read: its own `settingsGeneration`, its own `get({ theme: <absent-sentinel or default> })`, and resolution through the shared module's validator. Per D-09 a failure resolves to defaults and still sets `settingsReady = true`.

**Change-listener pattern** (L458-468):
```js
  function onPreferenceChanged(changes, areaName) {
    if (areaName !== PREFERENCE_AREA) return;
    if (changes === null || typeof changes !== 'object' || !Object.hasOwn(changes, PREFERENCE_KEY)) return;
    preferenceGeneration += 1;
    const change = changes[PREFERENCE_KEY];
    const value = change !== null && typeof change === 'object' && Object.hasOwn(change, 'newValue')
      ? change.newValue : true;
    applyPreference(value, preferenceGeneration);
  }
```
The settings handler compares old and new effective values. Where nothing visible changes (Classic to Classic in Phase 7) it must **not** call `syncController`/re-evaluate rows (D-14: "no row re-evaluation").

**Gate location** (L351-353):
```js
  function runnable() {
    return preferenceReady && preferenceEnabled && !suspended && !document.hidden;
  }
```
Add `&& settingsReady`. The time bound (D-09) is a single `setTimeout` that forces `settingsReady = true` with defaults. It must be cleared on settle, so that `vi.getTimerCount() === 0` still holds in every drain assertion (for example `runtime-contract.test.js` L236, L264, L534).

**Registration order** (L551-556). Register listeners before the read:
```js
      chrome.storage.onChanged.addListener(onPreferenceChanged);
      chrome.runtime.onMessage.addListener(onRuntimeMessage);
      readPreference();
```
**Listener-count pins:** `toolbar-popup.test.js` L349 and `runtime-contract.test.js` L549 assert `storageListenerCount() === 1`. Either register **one** storage listener that dispatches to both handlers, which keeps those v1 assertions unchanged, or change the assertions in their own commit with a reason (D-25).

**Sender check** (L481-482) stays as it is: the worker message has no tab.

**Namespace access:** read the shared global once at IIFE top. The content script must still fail closed on a missing `chrome` (`runtime-contract.test.js` L498-513), and it must not use `typeof chrome` checks (L512 forbids them).

---

### `scripts/release-source.js` (inventory) — MODIFIED

**Pattern** (L21-44). Add each new file with a dated rationale comment, in sorted order:
```js
export const RELEASE_FILES = Object.freeze([
  'background.js',
  'content.js',
  // 05-03: the store's required 128px brand icon. It is a packaged byte, so it
  // belongs here in the same reviewed commit that added it — …
  'icons/brand.png',
  …
  'manifest.json',
  'popup.html',
  'popup.js',
  'zhroma.css',
]);
```
Add `'options.html'` and `'zhroma-settings.js'`, each with a `// 07-xx:` comment in the same style.

---

### `scripts/baseline-source.js` (pinned 0.1.0 blob reader) — NEW

**Analog:** `scripts/phase-04-source.js` (209 lines). Copy the structure wholesale.

**Header/imports/error class** (L1-33):
```js
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export class Phase04SourceError extends Error {
  constructor(code, options) { super(code, options); this.name = 'Phase04SourceError'; this.code = code; }
}
export const REPOSITORY_ROOT = fileURLToPath(new URL('..', import.meta.url));
export const DIGEST_PREFIX = 'extension/';
const SHA256 = /^[0-9a-f]{64}$/u;
const REVISION = /^[0-9a-f]{40}$/u;
function reject(condition, code, options) {
  if (!condition) throw new Phase04SourceError(`PHASE04_SOURCE_REJECTED ${code}`, options);
}
```

**Git helpers** (L69-85):
```js
function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, { cwd: REPOSITORY_ROOT, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
  } catch (cause) { if (allowFailure) return null; throw new …('… missing-revision', { cause }); }
}
function blob(revision, path) {
  const bytes = git(['show', `${revision}:${path}`], { allowFailure: true });
  reject(bytes !== null, 'phase-04-missing-revision');
  return bytes;
}
```

**Inventory and hash cross-check** (L152-168). Swap `05-BASELINE.json` for `release/candidate.json` (`source_git_revision`, `source.assets[{name,size,sha256}]`, `source.digest`):
```js
  const tracked = git(['ls-tree', '-r', '--name-only', baseline.runtime_revision, '--', 'extension'], { allowFailure: true });
  reject(tracked !== null, 'phase-04-missing-revision');
  const trackedNames = tracked.toString('utf8').trim().split('\n').filter(Boolean).sort();
  reject(trackedNames.length === names.length
    && names.every((name, index) => trackedNames[index] === `${DIGEST_PREFIX}${name}`), 'phase-04-inventory-mismatch');
  const files = {};
  for (const name of names) {
    const bytes = blob(baseline.runtime_revision, `${DIGEST_PREFIX}${name}`);
    reject(sha256(bytes) === baseline.assets[name], 'phase-04-asset-mismatch');
    files[name] = bytes;
  }
  const digest = sha256(names.map((name) => `${baseline.assets[name]}  ${DIGEST_PREFIX}${name}\n`).join(''));
  reject(digest === baseline.digest, 'phase-04-digest-mismatch');
```
Also pin the revision as a literal constant (`6d3ab0b10e9419a5c1077e59e468977c00d59d4a`) **and** require that it equals `candidate.json`'s `source_git_revision`, so rewriting either one fails. Cache the result as L137/L207 do, and keep the `options.baseline` tamper seam (L146-150) so negative controls can prove the rejections. `digestOf` in `scripts/release-source.js` L138-141 is the shared digest convention and can be imported instead of re-derived. Do not reuse `readWorkingCopy`'s refusal to read `extension/` (L58-67). The harness reads the working tree through the existing `asset()` helpers and reads the baseline only through this module.

---

### `test/extension/frozen-contract.test.js` (frozen invariants) — NEW

**Analog:** `test/extension/runtime-contract.test.js` L1-13 (header) and L86-90 (prohibited keys); `toolbar-popup.test.js` L257-262 and L286-299.

**Header/imports** (`runtime-contract.test.js` L1-13):
```js
// @vitest-environment node
import { readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { Script } from 'node:vm';
import { expect, test } from 'vitest';

const root = new URL('../../extension/', import.meta.url);
const asset = (name) => readFileSync(new URL(name, root), 'utf8');
const manifest = JSON.parse(asset('manifest.json'));
```

**Permission surface as explicit prohibitions** (`runtime-contract.test.js` L84-90):
```js
  // Stated again as explicit prohibitions, so a future widening reads as a
  // deleted assertion rather than as an edited literal.
  for (const key of ['host_permissions', 'optional_permissions', 'optional_host_permissions',
    'web_accessible_resources', 'externally_connectable', 'content_security_policy', …]) {
    expect(Object.hasOwn(manifest, key)).toBe(false);
  }
```
**Permission and match pins** (`toolbar-popup.test.js` L258-266):
```js
  expect(manifest.permissions).toEqual(['storage']);
  expect(manifest.content_scripts).toEqual([{ matches: ['https://*.zendesk.com/agent/*'], … world: 'ISOLATED', all_frames: false }]);
  expect(manifest.minimum_chrome_version).toBe('106');
```
In the frozen file, assert only the D-01 fields: `matches`, `world`, `all_frames`, `permissions` and `minimum_chrome_version`. Do **not** deep-equal `content_scripts[0].js`, because later phases add files. That deep-equal lives in the versioned file.

**Network-API ban over every shipped JS file** (`toolbar-popup.test.js` L323-331 regex, extended with `EventSource` and `sendBeacon` per D-27):
```js
    expect(source).not.toMatch(/\b(eval|Function|fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB)\s*[.(]/);
```
Iterate over **the discovered inventory** (the `shippedInventory()` walker, `runtime-contract.test.js` L18-24), not a hand list. A file added later is then covered automatically, which is what makes this suite "frozen".

Add these invariants:
- `not.toMatch(/storage\.sync/)` on every shipped `.js`/`.html`;
- `not.toMatch(/url\(/)` on every shipped `.css` (today `runtime-contract.test.js` L373 checks only `zhroma.css`);
- every `importScripts(` argument is a quoted relative packaged path, for example `/importScripts\(\s*'[a-z-]+\.js'(\s*,\s*'[a-z-]+\.js')*\s*\)/`, and resolves inside `extension/`.

**Remote-reference check** (`toolbar-popup.test.js` L296-298):
```js
  for (const name of ['content.js', 'background.js', 'popup.js', 'popup.html']) {
    expect(asset(name)).not.toMatch(/https?:\/\/|@import|url\(\s*['"]?https?:/);
  }
```
Caution: `background.js` gains a D-17 host check, so the literal `zendesk.com` will appear. Build that check without a `https://` literal (for example `url.protocol === 'https:'`), or scope this regex so the frozen suite does not have to be edited later.

D-06: this file lands in its own commit, with no feature code, as the first commit of the split.

---

### `test/extension/runtime-contract.test.js` (versioned v1.0 pins) — MODIFIED

Keep this filename. `test/mutants/locale-honesty.mutants.json` L26-30 targets its suite and test name `'happy-dom secondary model: four CSS rules map exact labels to alpha backgrounds and only direct ticket cells'`. Renaming the file breaks `validateRegistry` (`scripts/verify-mutation-kills.js` `safeFile(repositoryRoot, suite)`).

Pins that must change in Phase 7, each with a written reason in the commit that changes it (D-25/D-26):
- L64-76 manifest deep-equal: add `options_ui: { page: 'options.html', open_in_tab: true }`, and set `content_scripts[0].js` to `['zhroma-settings.js', 'content.js']`.
- L91-93 `shippedInventory()` literal: add `options.html` and `zhroma-settings.js`.
- L94-96 `declared` list: add `manifest.options_ui.page`.
- L201-269 "every declared script executes…": already loops `manifest.content_scripts[0].js` (L229), so it picks up the shared file automatically. But `expect(Object.keys(context)).toEqual(initialGlobals)` (L235, L268) **will fail** because the shared file adds exactly one global. Restate it as `toEqual([...initialGlobals, '<NamespaceName>'])`.
- L271-279 "runtime source remains classic, palette-free…" reads only `content.js`. Add the same assertions for `zhroma-settings.js`. The runtime contract says the shared file adds no DOM writes.
- L470-496 strict-harness probe: L490 asserts `expect(() => harness.chrome.storage.local.get({ theme: 'dark' }, () => {})).toThrow();`. The harness must now admit the exact settings read shape. Keep the negative with an invalid value, and admit only the exact decided `get` shape.
- L538-557: `storageListenerCount()).toBe(1)` (see the `content.js` note).

---

### `test/extension/parity.test.js` (differential parity harness) — NEW

**Loader analog:** `test/extension/persistent-tint.test.js` L34-95 (`loadRuntimeFixture`). Parameterise it by a **source provider**, `(name) => string`. Use `asset` for the working tree and `(name) => baseline.files[name].toString('utf8')` for `6d3ab0b`.

The key lines to copy are L48-53 (CSS injection from the manifest) and L69-72 (JS in manifest order):
```js
  const manifest = JSON.parse(asset('manifest.json'));
  for (const path of manifest.content_scripts[0].css) {
    const style = document.createElement('style');
    style.textContent = asset(path);
    document.head.append(style);
  }
  …
  const harness = createChromeHarness(preference);
  const context = createContext({ document, window, chrome: harness.chrome, MutationObserver: StartupObserver, setTimeout, clearTimeout });
  for (const path of manifest.content_scripts[0].js) new Script(asset(path), { filename: path }).runInContext(context);
  if (confirmPreference) harness.flush();
```
Each side must read **its own** `manifest.json`. The baseline manifest lists only `content.js` and the working-tree manifest lists the shared file first.

**Window factory** (the same in every suite; `runtime-contract.test.js` L40-50):
```js
  const window = new Window({ settings: {
    enableJavaScriptEvaluation: false, disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true, enableImageFileLoading: false,
    navigation: { disableMainFrameNavigation: true, disableChildFrameNavigation: true, disableChildPageNavigation: true },
  } });
```

**Mutation sequences to replay on both sides.** Copy the operations and do not import them:
- `persistent-tint.test.js` L197-211 (Next/Previous/refresh body/refresh table);
- L213-231 (group insert/reorder);
- L232-242 (empty/group-only);
- L243-258 (sort);
- L259-277 (rapid present/absent/present);
- `toolbar-popup.test.js` L762-799 (visibility/bfcache round trips, Phase 4).

**Three observables per step:**
1. row attributes: `markers(document)` (`persistent-tint.test.js` L14);
2. diagnosis: `harness.requestStatus()` (`chrome-harness.js` L187-193, which returns `{type:'status', requestId, diagnosis, reason}`);
3. computed cell backgrounds: `[...row.children].map((cell) => window.getComputedStyle(cell).backgroundColor)`. This was verified to work in happy-dom 20.13.1 (see the header).

**Upgrade-state matrix** (D-24): `createChromeHarness({})`, `createChromeHarness({ stored: false })` and `createChromeHarness({ stored: true })`. `stored` is the `enabled` value, per `chrome-harness.js` L52. The working-tree side needs the extended harness, which must also answer the settings read as absent.

**Fixture gate** (`beforeAll`, `persistent-tint.test.js` L16-20):
```js
beforeAll(async () => {
  expect((await validateFixtureManifest(fileURLToPath(new URL('../fixtures/manifest.json', import.meta.url)), {
    requireCompleteScenarioMatrix: true,
  })).fixtureCount).toBe(3);
});
```
This covers the three fixtures: `zendesk-view-priority-present.html`, `zendesk-view-priority-absent.html` and `zendesk-view-grouped-long.html`.

**Teardown** (`persistent-tint.test.js` L22-29): dispatch `pagehide`, then `await window.happyDOM.close()`, `vi.restoreAllMocks()`, `vi.useRealTimers()`.

Add a negative control: make a one-character edit to an in-memory copy of the working-tree `zhroma.css` (as `runtime-contract.test.js` L462 does with `.replace('0.14', '0.13')`) and assert the harness reports a difference. Without it, a harness that compares nothing would pass.

---

### `test/extension/settings-module.test.js` (pure unit tests) — NEW

**Analog for the table-driven rejection style:** `test/extension/mutation-registry.test.js` L30-40:
```js
test.each([
  ['renamed suite', (entry) => { entry.suites = ['renamed.test.js']; }],
  ['stale source literal', (entry) => { entry.find = 'old implementation'; }],
  …
])('%s is rejected by the shared validator', (_name, change) => {
  const entry = item(); change(entry);
  expect(() => validateRegistry([entry], fixture()), '[registry:source-identity-required]').toThrow();
});
```
Load the shipped file the way every suite loads shipped bytes: `new Script(asset('zhroma-settings.js'), { filename }).runInContext(createContext({}, { codeGeneration: { strings: false, wasm: false } }))`, then read the one global off the context. Assert that it is frozen and that it is the **only** new key on the context.

Cover: absent → default; invalid → default plus `unreadable`; newer `v` → default plus `unreadable`, never migrated down; older `v` → migrated in memory; a `__proto__` own key; unknown keys rejected; and "adding a key = one entry" (inject a test-only key through whatever seam the module exposes for D-16).

**Agreement-test pattern** for any constant duplicated between the module and a test double or `content.js`/`background.js` (`toolbar-popup.test.js` L972-994):
```js
  const source = asset('content.js');
  expect(source).toContain(`PREFERENCE_KEY = '${PREFERENCE_CONTRACT.key}'`);
  expect(source).toContain(`PREFERENCE_AREA = '${PREFERENCE_CONTRACT.area}'`);
  …
  for (const value of [...PREFERENCE_CONTRACT.diagnoses, ...PREFERENCE_CONTRACT.reasons]) {
    if (value === null) continue;
    for (const name of ['content.js', 'background.js']) expect(asset(name), `${name} ${value}`).toContain(`'${value}'`);
  }
```
Add a `SETTINGS_CONTRACT` next to `PREFERENCE_CONTRACT` in `chrome-harness.js` (L26-37) and anchor it to the shipped literals in the same way.

---

### `test/extension/settings-queue.test.js` (worker queue, CAS, D-17) — NEW

**Analog:** `test/extension/failure-seam.test.js` L24-60, L93-125.

**Imports and sender constant:**
```js
import { afterEach, expect, test, vi } from 'vitest';
import { COPY, EXTENSION_ID, POPUP_URL, TAB_ID, asset, closeWindows, createWorld, loadContent, loadWorker, settle } from './tracer-world.js';
afterEach(async () => { vi.useRealTimers(); await closeWindows(); });
const POPUP_SENDER = Object.freeze({ id: EXTENSION_ID, url: POPUP_URL });
```
**Direct worker drive** (L120-125):
```js
  const first = world.sendToWorker({ type: 'set-enabled', requestId: 1, enabled: false }, POPUP_SENDER);
  const second = world.sendToWorker({ type: 'set-enabled', requestId: 2, enabled: true }, POPUP_SENDER);
  const { value: replies } = await within(Promise.all([first, second]), CEILING * 2);
  expect(world.getStored('enabled')).toBe(true);
  expect(world.forbidden).toEqual([]);
```
**Ordering and no-overlap assertions** (`preference-outcome.test.js` L265-277):
```js
  expect(world.writeLog, '[outcome:arrival-order]').toEqual(values.map((enabled) => ({ enabled })));
  expect(world.snapshot()).toEqual({ enabled: false });
  expect(Math.max(...world.writeObservations), '[outcome:physical-write-overlap]').toBe(1);
```
**Hold/release primitives for race construction:** `world.setWriteMode('deferred')`, `world.flushWrites()`, `commitWrites()`, `releaseWriteCallbacks()` (`tracer-world.js` L483-486, L500).

**D-17 negatives.** Mirror `runtime-contract.test.js` L552-555 for the content side:
```js
  expect(harness.requestStatus({ sender: { id: 'another-extension-id' } })).toBeUndefined();
  expect(harness.requestStatus({ sender: { id: undefined, tab: { id: 3 } } })).toBeUndefined();
```
On the worker side, send `status-invalidated` and the settings message with these senders: a content sender whose `url` is `https://evil.example/agent/`, `http://x.zendesk.com/agent/` and `https://x.zendesk.com/hc/`; an extension page in a tab (`tab` set, `url` = options URL) trying a content-only message; and a popup-shaped sender with the options URL. Each must get no reply and cause no write.

Put `[mutant:<id>]` assertion markers on each guard assertion (the `failure-seam.test.js` L107-108 style) so D-30 mutants can target them.

---

### `test/extension/settings-reader.test.js` (content reader and gate) — NEW

**Analog:** `test/extension/toolbar-popup.test.js` L345-404. Copy the `bootAll`/`createWorld`/`loadContent` + `emitStorageChange` + `flushReads` style:
```js
test('a late enabling read cannot override a newer stored false', async () => {
  const world = createWorld({ stored: null, readMode: 'deferred' });
  loadWorker(world);
  const content = loadContent(world);
  await settle();
  world.emitStorageChange({ enabled: { oldValue: true, newValue: false } });
  await settle();
  world.flushReads();
  await settle();
  expect(markers(content.document)).toEqual([]);
});

test('an unrelated key or a foreign storage area never changes the preference', async () => {
  const { world, content } = await bootAll();
  world.emitStorageChange({ somethingElse: { newValue: false } });
  world.emitStorageChange({ enabled: { newValue: false } }, 'sync');
  …
});
```
Per-owner read modes separate the content read from the worker read: `world.setReadMode('rejected', 'content')` (`tracer-world.js` L499). The `settingsReady` time bound needs fake timers. Use the `timedBoot`/`vi.advanceTimersByTimeAsync` style from `preference-outcome.test.js` L260-262, and finish with `expect(vi.getTimerCount()).toBe(0)`.

Assert "no row re-evaluation on a theme change" with a spy on `Element.prototype.setAttribute`/`removeAttribute`. That is the `runtime-contract.test.js` L291-307 pattern:
```js
  const writes = vi.spyOn(window.Element.prototype, 'setAttribute');
  …
  expect(writes).not.toHaveBeenCalled();
```

**Gotcha:** `toolbar-popup.test.js` L362 asserts `world.pendingReadCount()).toBe(2)`. The new settings read makes that 3. It is a v1 assertion, so change it in its own commit with a reason (D-25).

---

### `test/extension/upgrade-storage.test.js` (COMPAT-02, DATA-01) — NEW

**Analogs:** `preference-outcome.test.js` (`world.writeLog`, `world.snapshot()`) and `popup-recovery.test.js` L172 (`expect(world.snapshot()).toEqual({ enabled: false })`).

Assertions to build:
- `bootAll({ stored: { enabled: false } })` → after settle, `world.snapshot()` equals `{ enabled: false }` and `world.writeLog` equals `[]`;
- `bootAll({ stored: null })` → `world.storageKeys()` equals `[]`;
- `bootAll({ stored: { enabled: true } })` → `world.snapshot()` equals `{ enabled: true }`.

Simulate install and update. The tracer world has no `runtime.onInstalled`, so assert `asset('background.js')` does not match `/onInstalled/`. Also make `workerChrome.runtime` reject an `onInstalled` access (see the `tracer-world.js` modification below).

Local-only: the tracer's worker chrome has no `storage.sync` member (`tracer-world.js` L441), so any `sync` access throws a TypeError that the worker swallows. Add a recorded `sync` deny (`denyStore('worker chrome.storage.sync')`, the L193 pattern) so `world.forbidden` catches it.

---

### `test/extension/chrome-harness.js` (strict double) — MODIFIED

**Current read gate** (L120-128). It admits only `{enabled: true}`:
```js
    get(defaults, callback) {
      const keys = defaults === null || typeof defaults !== 'object' || Array.isArray(defaults) ? null : Object.keys(defaults);
      if (keys === null || keys.length !== 1 || keys[0] !== PREFERENCE_CONTRACT.key
        || defaults[PREFERENCE_CONTRACT.key] !== true) {
        fail(`chrome.storage.local.get(${JSON.stringify(defaults) ?? String(defaults)})`);
      }
```
Add a second, exact admitted shape for the settings read (from a new `SETTINGS_CONTRACT`), with its own stored-value option (for example `settingsStored`) and its own `readMode`. The `enabled` branch must stay byte-identical, so v1 suites keep their meaning. Update the header comment list (L7-12) of admitted seams. This is "admitted deliberately" per CONTEXT §code_context.

---

### `test/extension/tracer-world.js` (three-context double) — MODIFIED

- **`loadContent`** (L559-576). It currently runs only `content.js` (L574). Change it to iterate `JSON.parse(asset('manifest.json')).content_scripts[0].js`, as `persistent-tint.test.js` L69 does. The `before` snapshot (L573) is taken before the scripts run, so `toolbar-popup.test.js` L954's "no leaked global" will see the namespace. Restate that assertion as `[...before, NAMESPACE]` in its own commit.
- **`loadWorker`** (L578-592). L582 sets `importScripts: world.deny('importScripts')`. Replace it with an admitting `importScripts(...paths)` that accepts only paths in the packaged inventory and evaluates `asset(path)` into the same context. Anything else is recorded in `forbidden`. It must be synchronous, as `importScripts` is.
- **Content sender** (L238). It is currently `{ id, frameId: 0, documentId, tab: { id } }`. Add `url: 'https://acme.zendesk.com/agent/filters/1'` (a synthetic tenant, never real) so D-17's URL check passes for the real content path. Any fixture-token rules in `TICKET_TOKENS` (L67; the list includes `'zendesk'` and `'http'`) apply to *messages and responses*, not senders. Confirm that `toolbar-popup.test.js` L554-573's leak scan does not read `sender`.
- **Options sender:** add `OPTIONS_PATH = 'options.html'`, `OPTIONS_URL`, and a helper sender `{ id, url: OPTIONS_URL, tab: { id: OTHER_TAB_ID }, frameId: 0 }` next to `POPUP_URL` (L29-30).
- **Worker storage** (L441). Add a `sync` deny next to `local` for DATA-01 (see above).

---

### `test/extension/toolbar-popup.test.js` (v1 pins) — MODIFIED

Pins that change (each in a reasoned commit):
- L263-266 `content_scripts` deep-equal: the `js` array now has the shared file first.
- L276-285 declared list: add `manifest.options_ui.page`.
- L286 `readdirSync(root)` literal: add `options.html` and `zhroma-settings.js`.
- L323-331 "shipped JavaScript carries no colour value…": the hand list `['content.js', 'background.js', 'popup.js']`. Add `zhroma-settings.js`.
- L946-956 global-leak test (see `tracer-world.js`).
- L362 `pendingReadCount()` equals 2 (see `settings-reader.test.js`).

24 registered mutants target this suite's test names. Rename no test.

---

### `test/extension/release-package.test.js` — MODIFIED

L63-67. The name says "eleven-file" but the count asserts 12:
```js
test('reads the complete eleven-file release source inventory with sizes, hashes and an aggregate digest', () => {
  const source = readReleaseSource(extensionDirectory);
  expect(source.assets.map((asset) => asset.name)).toEqual([...RELEASE_FILES].sort());
  expect(source.assets).toHaveLength(12);
```
Change it to 14, the number of files `RELEASE_FILES` gains. Note that `release/candidate.json` still describes the 0.1.0 rc-01 bytes. `scripts/verify-release.js` L121-126 will correctly report `shipped-source-stale` against it after Phase 7. That is expected; do not "fix" the record. Phase 11 cuts a new candidate.

---

### `test/mutants/settings-foundation.mutants.json` — NEW

**Analog:** `test/mutants/worker-boundary.mutants.json`. Entry shape (L2-17):
```json
  {
    "id": "request-id-echo",
    "file": "extension/background.js",
    "find": "reply.type === type && reply.requestId === requestId",
    "replace": "reply.type === type",
    "suites": ["test/extension/worker-integrity.test.js"],
    "note": "…why this guard matters…",
    "expected_failure": {
      "suite": "test/extension/worker-integrity.test.js",
      "test": "<exact test name>",
      "assertion": "[mutant:request-id-echo]",
      "kind": "behavioral"
    },
    "count": 1
  }
```
Validator constraints (`scripts/verify-mutation-kills.js` `validateRegistry`):
- `id` matches `/^[a-z0-9][a-z0-9-]{0,79}$/` and is unique across all registry files;
- `find` occurs exactly `count` times;
- the target suite must not be `mutation-gate`, `mutation-registry` or `phase-04-live-acceptance`;
- the `assertion` marker string must appear in the suite source;
- the test name must match a declaration.

D-30 candidates:
- `fromContent` URL clause;
- `fromOptions` URL clause;
- settings-queue `activeSetting !== null` early return (ordering);
- CAS revision compare;
- "skip write when equal" (D-11);
- `settingsReady` time-bound clear;
- `storage.local` → `storage.sync` swap.

Register an entry only after `npm run test:mutants -- --only <id>` measures it killed (`scripts/verify-mutation-kills.js` `runCli`, `--only`).

---

### `test/performance/tint-workload.js` + `scripts/run-tint-workload.js` (D-29 timing) — MODIFIED

- `scripts/run-tint-workload.js` L14: `const ASSETS = ['manifest.json', 'content.js', 'zhroma.css'];`. Add the shared file. L159 serves `extension/<name>` from disk. For the `6d3ab0b` comparison run, add a flag (for example `--source baseline`) that serves `readBaselineSource().files[name]` from the new `scripts/baseline-source.js` instead of `readFile`. The recorded `hashes` (L160) then bind each run to its bytes.
- `test/performance/tint-workload.js` L185 injects exactly one `<script src="/extension/content.js">`. Inject `content_scripts[0].js` in manifest order: fetch `/extension/manifest.json`, then append the scripts sequentially and await each `onload`.
- The seam's `storage.local.get` (L73-79) already fills any requested key from `store` or the defaults, so the settings read works unchanged. `confirmPreference()` fires on the first `get` callback. Make it wait for both reads, or the run will time a controller still gated on `settingsReady`.
- `test/extension/performance-harness.test.js` covers `parseArguments`/`validateWorkloadReport`. Extend `parseArguments` and its tests if a flag is added (L18-31 pattern: duplicate-flag and unknown-flag rejection).

---

### `tsconfig.json` (repo root, dev-only) — NEW, no analog

No tsconfig exists in the repo. Constraints from CONTEXT:
- D-20: `noEmit`, with nothing under `extension/`;
- D-21: new shared files are `// @ts-check`; v1 files are included only if they pass unmodified, and each excluded file is listed in the config with a reason;
- D-22: blocking inside `npm test`.

Suggested keys: `"compilerOptions": { "allowJs": true, "checkJs": false, "noEmit": true, "target": "ES2022", "lib": ["ES2022", "DOM", "WebWorker"?], "types": ["chrome"], "strict": false }`, with `"include"` naming files explicitly. `checkJs: false` combined with per-file `// @ts-check` is what lets v1 files be included or excluded without byte edits. JSON has no comments, so a reason field needs a `tsconfig.json`-legal alternative. `tsc` accepts JSONC comments in tsconfig, so `//` comments are legal there.

---

### `package.json` — MODIFIED

Current (18 lines):
```json
  "scripts": {
    "test": "npm run test:recon",
    "test:recon": "node --test test/recon/*.smoke.js && node node_modules/vitest/vitest.mjs run --config vitest.config.js",
    "test:mutants": "node scripts/verify-mutation-kills.js"
  },
  "devDependencies": { "happy-dom": "20.13.1", "vitest": "4.1.11" }
```
Add `typescript` and `@types/chrome` at **exact** versions, with no `^` (the existing entries are exact). Add a `typecheck` script (`node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json`, following the direct-`node` invocation style of `test:recon`) and chain it inside `test`. Note: `release/candidate.json` `automated_checks[0].command` runs `npm --prefix . run test:recon`, not `npm test`. To make the release command type-check too, chain the typecheck into `test:recon`. That is a choice for the planner to record.

---

### `DEPENDENCY-APPROVALS.md` — MODIFIED

Table row format (L7-10) and the per-question verbatim block (L12-20):
```md
| package | approved-version | approval-basis | attestation-state | attested-on |
| --- | --- | --- | --- | --- |
| vitest | 4.1.11 | Developer answered "yes" to approval of this exact version before installation | attested | 2026-09-05 |
…
1. Did you approve `vitest@4.1.11` as that exact version before it was installed?

   > yes
```
`test/recon/dependency-approvals.smoke.js` L17-38 automatically enforces:
- a row for **every** devDependency;
- the version equal to both `package.json` and `package-lock.json`;
- a 5-column row with a closed state and an ISO date.

So the rows must land in the same commit as the install. Keep the existing "Independence" section's verbatim quote (L30) byte-identical, because L40-45 assert it.

---

## Shared Patterns

### Classic IIFE, no modules
**Source:** `extension/background.js` L1-2 / L461; `content.js` L1-2 / L561.
**Apply to:** `zhroma-settings.js`, and any stub script.
Every shipped JS file is `(() => { 'use strict'; … })();`. Tests assert `expect(() => new Script(source)).not.toThrow()` (`runtime-contract.test.js` L273; `toolbar-popup.test.js` L330), so no `import`/`export` is allowed.

### Chrome callback error handling
**Source:** `background.js` L111-121, L125-133; `content.js` L448-455.
**Apply to:** every new storage call (worker settings write and read, content settings read).
```js
    try {
      chrome.storage.local.get({ … }, (values) => {
        if (chrome.runtime.lastError) { finish(null); return; }
        finish(values ? values[KEY] : null);
      });
    } catch { finish(null); }
```
Both doubles model `'rejected-with-values'` (the callback receives values **and** `lastError`). The `lastError` check is load-bearing, so test that mode (`chrome-harness.js` L43-51; `tracer-world.js` L281-286).

### Generation counters to drop stale replies
**Source:** `content.js` L421-423 (`if (generation !== preferenceGeneration) return false;`); `background.js` L104-105, L276 (`invalidate`, `generationOf`, `owns`).
**Apply to:** the content settings reader (its own counter) and any worker settings projection.

### Exact-shape message validation
**Source:** `background.js` L73-76 (`isExact`), L416-437 (dispatch); `content.js` L470-476 (`isRequest`).
**Apply to:** every new message type in both directions. Reply shapes are exact too (`background.js` L228, `isExact(reply, [...])`).

### Strict test doubles record rather than throw
**Source:** `chrome-harness.js` L14-18, L62-65 (`fail` records and throws); `tracer-world.js` L380-387 (recorded, never thrown, because the worker swallows throws).
**Apply to:** every new seam admitted in the doubles (settings read, `importScripts`, options sender, `sync` deny). End each test with `harness.assertClean()` or `expect(world.forbidden).toEqual([])`.

### Evidence binds to bytes; historical bytes come from pinned blobs
**Source:** `scripts/phase-04-source.js` (whole file); `scripts/release-source.js` L137-141 (`digestOf`).
**Apply to:** `scripts/baseline-source.js`, the parity test and the D-29 timing run.

### Inventory is explicit and edited in the same reviewed commit
**Source:** `scripts/release-source.js` L21-44; `runtime-contract.test.js` L91-93; `toolbar-popup.test.js` L286-289; `release-package.test.js` L66-67.
**Apply to:** the `options.html` + `zhroma-settings.js` commit. All four places change together.

### Mutant registry is literal-text coupled
**Source:** `scripts/verify-mutation-kills.js` `assertFindCounts`/`validateRegistry`; `test/extension/mutation-registry.test.js` L17-20 runs `validateRegistry` on every `npm test`.
**Apply to:** every edit of `background.js` (27 mutants), `popup.js` (7), `content.js` (3), `zhroma.css` (1) and `chrome-harness.js` (1). An edit that changes or duplicates a registered `find` literal fails `mutation-registry.test.js` immediately. Before editing, grep `test/mutants/*.json` for the lines you touch. D-25 also requires all 39 v1 mutants to stay killed: run `npm run test:mutants` after the feature commits.

### Tests read planning paths
**Source:** `phase-04-live-acceptance.test.js` (via `scripts/phase-04-source.js` `BASELINE_PATH`); `phase-05-release-smoke.test.js`.
**Apply to:** do not move `.planning/phases/**` or `release/candidate.json`. The new baseline reader should read `release/candidate.json` and nothing under `.planning/`, which keeps it immune (Retrospective lesson 4).

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `tsconfig.json` | config | n/a | The repo has never had TypeScript tooling. Use the D-20/D-21 constraints and STACK.md §1 (TS 7 JS checking: `@typedef`, not `@enum`). |
| Shared-namespace mechanism in `zhroma-settings.js` | utility | transform | No shipped file exposes a global today, and three tests assert that no global is added (`runtime-contract.test.js` L235/L268; `toolbar-popup.test.js` L954). Use the STACK.md §6 idiom, then restate those three assertions to "exactly one declared global". |
| `types/zhroma.d.ts` (optional) | types | n/a | Optional. JSDoc `@typedef` inside `zhroma-settings.js` is enough. |

## Planner Watch-List (v1 assertions that Phase 7 bytes will break)

Each item is a v1 assertion. Per D-25/D-26, change each one only in its own commit with a written reason.

1. `runtime-contract.test.js` L64-76, L91-93: manifest deep-equal and inventory.
2. `runtime-contract.test.js` L235, L268 and `toolbar-popup.test.js` L954: global-leak equality (the namespace).
3. `runtime-contract.test.js` L490: `get({ theme: 'dark' })` must throw. Restate it once the harness admits the settings read.
4. `runtime-contract.test.js` L549 and `toolbar-popup.test.js` L349: `storageListenerCount() === 1`. These are avoidable if one listener dispatches both handlers.
5. `toolbar-popup.test.js` L263-266, L286: `content_scripts` deep-equal and `readdirSync` inventory.
6. `toolbar-popup.test.js` L362: `pendingReadCount() === 2`.
7. `release-package.test.js` L67: `toHaveLength(12)`.
8. `tracer-world.js` L582: `importScripts` is denied. Admit packaged paths only.
9. `tracer-world.js` L238: the content sender has no `url`. D-17 needs one.
10. `test/performance/tint-workload.js` L185: loads only `content.js`.

## Metadata

**Analog search scope:** `extension/`, `scripts/`, `test/extension/`, `test/mutants/`, `test/performance/`, `test/recon/dependency-approvals.smoke.js`, `release/candidate.json`, `DEPENDENCY-APPROVALS.md`, `package.json`, `vitest.config.js`, and `.planning/research/{STACK,ARCHITECTURE,SUMMARY}.md` (for layout and namespace guidance only).
**Files scanned:** 34
**Pattern extraction date:** 2026-09-28
