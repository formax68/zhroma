# Phase 8: Themes That Follow Dark Mode - Pattern Map

**Mapped:** 2026-10-08
**Files analyzed:** 19 proposed new/modified paths; new suite names are recommendations.
**Analogs found:** 17 / 19; no existing numerical colour validator or browser pixel oracle.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `extension/zhroma-colour.js` (new) | utility | transform | `extension/zhroma-settings.js` | role-match; module shell only |
| `extension/zhroma-themes.js` (new) | model | transform | `extension/zhroma-settings.js` | role-match; frozen registry only |
| `extension/zhroma-settings.js` | model/service | request-response | same file | exact |
| `extension/background.js` | controller | request-response | same file | exact |
| `extension/content.js` | controller | event-driven | same file | exact |
| `extension/zhroma.css` | component | transform | same file | exact |
| `extension/popup.html` | component | event-driven | same file | exact |
| `extension/popup.js` | controller | request-response | same file | exact |
| `extension/manifest.json` | config | batch | same file | exact |
| `types/zhroma.d.ts` | config | transform | same file | exact |
| `scripts/release-source.js` | utility | file-I/O | same file | exact |
| `test/extension/tracer-world.js` | utility | event-driven | same file | exact |
| `test/extension/chrome-harness.js` | utility | event-driven | same file | exact; change only if needed |
| `test/extension/theme-colour.test.js` (new) | test | transform | none | numerical oracle required |
| `test/extension/theme-runtime.test.js` (new) | test | event-driven | `test/extension/parity.test.js` | role-match |
| `test/extension/theme-popup.test.js` (new) | test | request-response | `test/extension/settings-queue.test.js` | role-match |
| `test/extension/settings-queue.test.js` | test | request-response | same file | exact |
| `test/extension/runtime-contract.test.js` | test | batch | same file | exact |
| Chrome painted-colour comparison (new artifact; path TBD) | test | transform | none | independent browser evidence required |

## Pattern Assignments

### Shared numerical and palette modules

**Analog:** `extension/zhroma-settings.js:125-148` for both new modules; classic scripts, no imports/exports, pure built-ins, `// @ts-check` plus JSDoc, one additive namespace.
```javascript
const root = /** @type {Record<string, unknown>} */ (/** @type {unknown} */ (globalThis));
const NAMESPACE = 'Zhroma';
// Existing namespace is reused; a non-object namespace makes initialization stop.
Object.defineProperty(root, NAMESPACE, { value: namespace, enumerable: true, writable: false, configurable: false });
if (Object.hasOwn(namespace, 'settings')) return;
const THEME_IDS = Object.freeze(['zhroma-classic']);
```
These are selected statements from the shell, not a standalone initialization block. Substitute each module's own member guard. Deep-freeze nested palette arrays/objects; `Object.freeze` on the outer registry alone is insufficient. Extend `types/zhroma.d.ts:12-23` with JSDoc-derived optional members; verify declaration names because its comments flag `skipLibCheck` as a silent-any risk.

**Validation/error pattern:** `extension/zhroma-settings.js:155-169,188-196` uses exact own-key checks, finite type constraints and caught encoding failures. Colour parsing must additionally reject non-finite/out-of-range RGB and alpha; accept numerical data, never arbitrary CSS strings. No existing RGB/Oklab/CVD implementation is an analog: use research equations and independent golden vectors. Keep simulation/report machinery developer-only. Package attribution with accepted palette data.

### Settings enum and effective-value no-op

**Analog:** `extension/zhroma-settings.js:423-435,523-530`; preserve the theme envelope, primitive default, last-writer-wins behavior and 128-byte cap. Derive IDs from accepted palettes or test registry agreement.
```javascript
if (current.status !== 'unreadable' && registry.equal(key, current.value, value)) {
  answer(job, 'unchanged');
  return;
}
```
**Required deviation:** this current guard permits a write when corrupt storage resolves to Classic and Classic is reselected. After validation and successful storage read, compare the effective value for the theme key even when status is unreadable. Return `unchanged`, retain corrupt bytes, emit no event. Preserve generic CAS behavior and unknown-after-issued-write semantics.

**Test analog:** `test/extension/settings-queue.test.js:18-26,38-73`.
```javascript
const CLASSIC = 'zhroma-classic';
const STORED_CLASSIC = Object.freeze({ v: 1, id: CLASSIC });
const themeMessage = (requestId, value = CLASSIC) => ({ type: 'set-setting', requestId, key: 'theme', value });
const reply = (requestId, outcome, revision = null) => ({ type: 'set-setting', requestId, outcome, revision });
```
The current test at lines 38-54 expressly expects corrupt Classic fallback to be overwritten; replace that expectation with `unchanged` plus byte preservation. Add a real change from corrupt fallback to another accepted ID, and explicit return to Classic. Exercise direct worker requests, not just the UI guard.

### Worker read protocol and bounded writes

**Analog:** `extension/background.js:424-465,496-538`.
```javascript
chrome.storage.local.get([key], (values) => {
  if (chrome.runtime.lastError || !isObject(values)) unconfirmed();
  else resolve({ ok: true, present: Object.hasOwn(values, key), raw: values[key] });
});
const fromPopup = (sender) => isObject(sender)
  && sender.id === chrome.runtime.id
  && sender.tab === undefined
  && sender.url === chrome.runtime.getURL(POPUP_PATH);
```
Add an exact-shape theme read request/reply using this sender check and a bounded response. Keep storage writes exclusively in `settingsQueue`; popup never acquires storage access. Failed read is not absence. New handlers must answer admitted requests even if the shared module failed. Worker imports remain synchronous packaged classic scripts; palette ID validation must work without document APIs.

### Content appearance lifecycle and property emission

**Analog:** `extension/content.js:421-439,495-558`; generation-guarded settings resolution and restoration lifecycle.
```javascript
settingsGenerations.set(key, settingsGenerations.get(key) + 1);
settingsState.set(key, resolveSetting(key, changes[key], 'newValue'));
```
These lines are the existing storage event seam at 555-556. Consume the resolved theme after initial landing and changes; guard late reads with the same generations. Add a separate observer on `document.documentElement`, `{ attributes: true, attributeFilter: ['data-theme'] }`, never the broad row observer at 401. Inspect before tinting, reconnect/resynchronise after pagehide/pageshow, and resynchronise on visibility return if disconnected. Recognised dark means dark; missing/unknown means selected-theme light. OS media queries do not select appearance.

Deduplicate effective theme/mode, emit only finite numeric custom properties, and do not call `syncController`, schedule reconcile, read priority cells or restamp rows for palette-only changes. Root style writes must not trigger the marker observer. Readiness and the off switch remain independent. If restoration changes mode, update properties before restored rows paint.

**CSS analog:** `extension/zhroma.css:1-27` owns only priority cell backgrounds. Retain exact Classic-light literals as `var()` fallbacks: `rgb(220 38 38 / 0.14)`, `rgb(234 88 12 / 0.12)`, `rgb(202 138 4 / 0.09)`, `rgb(22 163 74 / 0.08)`. Do not add hover/selected/focus/sticky-header overrides, box shadows or stripes.

### Popup control and production loading

**Analogs:** `extension/popup.js:53-57,113-129,160-188` for owned request IDs, bounded transport and confirmed switch state; `extension/popup.html:19` for packaged script tags. Build native radios in a fieldset, independent pending/confirmed theme state and a separate finite theme status. Restore confirmed radio while saving, allow one save in flight, validate reply schemas and ignore stale owners. Unknown after issuance gets one bounded readback; unresolved state says “Theme could not be confirmed”. Saved is not evidence of view application.

Share palette resolution/composition with Light/Dark previews; label priority order once, hide decorative swatches from accessibility APIs, preserve enable/status controls, provide non-colour selection and visible keyboard focus. No connected view and disabled tinting still permit saving.

**Loader seam:** `test/extension/tracer-world.js:668-686,728-740`.
```javascript
for (const path of scripts) new Script(asset(path), { filename: path }).runInContext(context);
// Current popup loader:
new Script(asset('popup.js'), { filename: 'popup.js' }).runInContext(context);
```
Use the first pattern to execute scripts extracted from actual packaged popup HTML in order; the second would omit new shared modules. Preserve forbidden network/storage sentinels and disabled dynamic code generation. Update manifest, worker and popup dependency order together. `scripts/release-source.js:27-50` pins every packaged file; add both modules explicitly, restating corresponding versioned runtime pins in a separate contract commit.

## Shared Patterns and Test Seams

- **Classic parity:** `test/extension/parity.test.js:28-39,62-76` reads frozen Git baseline bytes and each side's own manifest. Keep default/light markers, diagnoses and cell backgrounds equal. Do not repin the baseline to new output. Its observer double at 68-80 tracks options but currently broadcasts mutation records; distinguish root attributes from table mutations when adding appearance tests.
- **Contracts:** `test/extension/runtime-contract.test.js:53-64` separates restatable inventory/manifest/hue/API pins from immutable `test/extension/frozen-contract.test.js` invariants. Preserve storage-only permission, Zendesk match, Chrome 106, no runtime dependencies, build step, network or telemetry. Do not edit frozen tests to admit themes.
- **Runtime tests:** extend actual-byte harnesses for dark startup, unknown-marker selected-light fallback, two-tab propagation, off state, stale reads, hide/show and bfcache. Count priority reads, marker writes and reconcile work across palette switches; a correct final screenshot alone cannot prove no row evaluation.
- **Numerical tests:** fixed baseline vectors, alpha endpoints/layer order, non-finite rejection, independent Oklab/CVD golden vectors, duplicate-priority failure and all accepted preset/mode/native-state combinations. Classic-light exception stays scoped to literal equality plus every frozen floor; no new preset inherits it.
- **Browser evidence:** compare real flattened Chrome pixels with model outputs and popup previews; happy-dom computed RGBA does not establish source-over composition. Keep unresolved attribution, rejected presets, live unobserved checks and Phase 6/7 findings explicit. This map does not close any prior review or human acceptance state.

## No Analog Found

| File/Artifact | Reason |
|---|---|
| Numerical colour gate implementation | Existing settings utilities offer module/validation structure only; no perceptual/composition oracle exists. |
| Chrome painted-colour comparison | DOM simulation and parity are not a browser pixel oracle; use the research model plus independent Chrome evidence. |

## Metadata

**Analog search scope:** tracked `extension/`, `test/extension/`, `scripts/` and `types/`; no local project AGENTS.md or skill directories were found. All named existing analog paths were verified by `git ls-files`; no install/runtime mirror is referenced.
**Strong anchors:** shared settings, content lifecycle, worker validation, tracer loaders and parity tests. Additional contracts are boundary evidence, not alternative implementations.
**Pattern extraction date:** 2026-10-08. Proposed files are planning recommendations; source was not modified and tests were not run for this documentation-only task.
