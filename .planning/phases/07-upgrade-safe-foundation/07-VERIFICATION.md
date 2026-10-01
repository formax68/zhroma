---
phase: 07-upgrade-safe-foundation
verified: 2026-09-28T11:58:00Z
status: human_needed
score: 5/5 roadmap success criteria verified (plan must-have truths checked against code and passing named suites; 0 failed)
covered_files:
  - .planning/phases/07-upgrade-safe-foundation/07-01-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-01-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-02-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-02-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-03-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-03-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-04-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-04-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-05-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-05-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-06-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-06-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-07-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-07-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-08-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-08-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-09-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-09-SUMMARY.md
  - DEPENDENCY-APPROVALS.md
  - extension/background.js
  - extension/content.js
  - extension/manifest.json
  - extension/options.html
  - extension/zhroma-settings.js
  - package-lock.json
  - package.json
  - scripts/baseline-source.js
  - scripts/phase-04-source.js
  - scripts/release-source.js
  - scripts/run-tint-workload.js
  - test/extension/chrome-harness.js
  - test/extension/frozen-contract.test.js
  - test/extension/parity.test.js
  - test/extension/performance-harness.test.js
  - test/extension/release-package.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/settings-module.test.js
  - test/extension/settings-queue.test.js
  - test/extension/settings-reader.test.js
  - test/extension/toolbar-popup.test.js
  - test/extension/tracer-world.js
  - test/extension/upgrade-storage.test.js
  - test/mutants/settings-foundation.mutants.json
  - test/performance/tint-workload.js
  - tsconfig.json
  - tsconfig.v1.json
  - types/zhroma.d.ts
covered_digest: "v2:sha256:1cfe93536b5575a285026d0029e55e1b8af9d3e5bab6942b3c92f447f191a873"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Decide WR-02: with a stored `enabled: false` and a settings read that has not settled, switch Zhroma on from the popup"
    expected: "0.1.0 answers `applied: true, diagnosis: working` and the popup shows 'Priority tinting is working'. The Phase 7 bytes answer `applied: true, diagnosis: neutral`, the open popup shows 'Checking this view' and does not update, and the rows tint only when the 500 ms gate opens (the toolbar then corrects itself; a freshly opened popup shows working). Reproduced by the verifier in a scratch tracer-world test. Accept this as the cost of D-09's bounded wait, or apply the reviewer's fix (`&& (!preferenceEnabled || settingsReady)` in applyPreference, plus a hang-mode handshake test) before Phase 8 edits content.js"
    why_human: "It only differs when the settings read is slow or hung, a condition 0.1.0 never had. Whether that counts as the off/on switch 'behaving as in 0.1.0' (SC 4, COMPAT-04, and the 07-06 COMPAT-04 prohibition) is a product decision"
  - test: "Confirm that D-29's same-session band replaces SC 4's literal 'about 1.3 ms'"
    expected: "07-CONTEXT.md D-29 records the replacement. The recorded samples, which the verifier recomputed, give a 30-row largest family median of 1.7 ms for the Phase 7 bytes and 1.8 ms for the 0.1.0 bytes in the same session (band 0.2 ms, passed). Both medians sit above 1.3 ms because the M4 machine and Chrome 153 differ from the Phase 3 run. Either add an override for SC 4's wording or update the ROADMAP text"
    why_human: "The ROADMAP contract text still says 'about 1.3 ms'. Only the user can accept the reinterpretation into the contract"
  - test: "Resolve the 11 judgment-tier prohibitions from the plan frontmatter (all `flagged: true`, `verification: null`)"
    expected: "The verifier's non-authoritative verdicts are in the Prohibitions table below: 9 hold on the evidence, 1 is human-attestation only (07-02 approval before install), and 1 is partly contradicted in the fault window (07-06 COMPAT-04, see WR-02)"
    why_human: "Judgment-tier prohibitions need explicit human resolution. They are never silently passed"
  - test: "Decide WR-01 and WR-06, two guards that are sound today but can be evaded later"
    expected: "WR-01: 2441c64 narrowed scripts/phase-04-source.js from a whole-file pin to judge-text slices. Today's runner has no top-level code that changes the judges (verified by grep), but a later edit could. WR-06: the frozen contract's call-shaped patterns miss `fetch.call`, scheme-relative URLs and aliased `chrome.storage`. Today's shipped code has none of these (verified by grep). Because the frozen file is never to be edited, any tightening has to happen now or needs a user decision"
    why_human: "Neither falsifies a Phase 7 truth on the current bytes. Hardening a frozen or prior-phase guard is a scope and policy choice"
---

# Phase 7: Upgrade-Safe Foundation Verification Report

**Phase Goal:** The 1.0.0 codebase can carry new settings, while an agent upgrading from 0.1.0 or installing fresh sees and keeps exactly what 0.1.0 gave them
**Verified:** 2026-09-28T11:58:00Z
**Status:** human_needed
**Re-verification:** No. This is the initial verification.

## Evidence the verifier produced itself

- `npm test` at HEAD `c02b162` exited 0: tsc strict (tsconfig.json), tsc v1 (tsconfig.v1.json), 112/112 node smoke tests, 32 Vitest files with 1441/1441 tests.
- `npm run test:mutants` at HEAD exited 0 and printed `MUTATION KILLS: 52/52 killed` (39 v1 mutants plus 13 in `test/mutants/settings-foundation.mutants.json`).
- The type check is not vacuous: a scratch tsconfig that extends the repository config and holds one JSDoc type error made `tsc` exit 1 (TS2322).
- The timed bytes are the HEAD bytes. `git diff df28338 HEAD -- extension/ scripts/run-tint-workload.js test/performance/` is empty, and the sha256 of the four served working assets equals the hashes recorded in 07-PERFORMANCE.md.
- The verifier recomputed the per-family 30-row medians from `07-PERFORMANCE-SAMPLES.json` and `07-PERFORMANCE-BASELINE-SAMPLES.json` (100 samples per family): working 1.2/1.0/0.7/0.5/1.7/0 ms, 0.1.0 1.1/1.1/0.7/0.5/1.8/0 ms. They match the report.
- WR-02 was reproduced in a scratch tracer-world test on the shipped bytes. With `settingsReadMode: 'hang'`, switching on showed popup 'Checking this view' with 0 markers. After 500 ms the four rows tinted and the toolbar went to working, but the open popup stayed on 'Checking this view'.
- `git diff 6d3ab0b -- extension/` shows 5 files changed. popup.js, popup.html, zhroma.css and icons/ are byte-identical to 0.1.0.

## Goal Achievement

### Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Light interface, default settings: the working tree paints the same row attributes, diagnoses and computed cell backgrounds as the pinned 0.1.0 blobs, across the three fixtures and the Phase 3/4 sequences, through a differential parity harness | ✓ VERIFIED | `test/extension/parity.test.js` runs 18 scenarios × 6 states (108 cases). Each side is built from its own manifest. The baseline comes only from `readBaselineSource()`, which checks the literal `6d3ab0b…` revision, the 12-name inventory, every blob's sha256 and the aggregate digest against `release/candidate.json`, and has no fallback. It compares markers, `get-status` diagnosis and reason, and `getComputedStyle(td/th).backgroundColor` at every step. Non-vacuity: the baseline traces tint, paint non-transparent backgrounds and reach working, missing and cannot-read. Negative controls (css `0.14→0.13`, Low dropped) fail the comparison. Tamper controls reject all 5 codes. Passes in the suite run |
| 2 | An upgraded install keeps its off/on setting; storage holds nothing beyond `enabled` until the agent changes a setting; no `onInstalled` writes | ✓ VERIFIED | There is no `onInstalled` or `onStartup` in extension/ (grep). `upgrade-storage.test.js` covers fresh install, 0.1.0 off and 0.1.0 on. Each goes through install or update (`previousVersion: '0.1.0'`), startup and a worker restart, and ends with `writeLog` `[]`, a byte-identical snapshot, `storageKeys` of `['enabled']`, 0 install and 0 startup listeners, and a restarted worker that only registers listeners. Re-selecting Classic answers `unchanged` and stores nothing. Four unreadable stored themes also stay byte-identical |
| 3 | No permission prompt: the manifest requests exactly `storage`, has no `host_permissions` and the same match pattern, and a frozen contract test separate from the v1.0 pins enforces this | ✓ VERIFIED | manifest.json has `permissions: ["storage"]`, one `matches` entry `https://*.zendesk.com/agent/*`, `ISOLATED`, `all_frames: false` and `minimum_chrome_version: "106"`. The only additions are `options_ui` and `zhroma-settings.js` in `js[]`, neither of which asks for a permission. `frozen-contract.test.js` was created in its own test-only commit (8e9373b) and tightened once more, test-only and additive, in 07-10 (b0ae2dc) under UAT 07 test 4 decision A (WR-06), with nothing widened. The versioned pins in `runtime-contract.test.js` are labelled separately. WR-06 is fixed by b0ae2dc |
| 4 | Default settings: priority detection, liveness through sort, refresh, view switch, pagination and scroll, the three-way diagnosis and off/on behave as 0.1.0; existing suites pass; v1 mutants still die; zero-rule timing median about 1.3 ms | ✓ VERIFIED (with a human decision on WR-02 and on the SC wording) | The parity matrix covers every named behaviour: Next and Previous, refresh body and table, sort with equal priorities, view switch, row recycling on scroll, the three diagnoses, and off/on through storage. The full suite passes and 52/52 mutants are killed on the HEAD bytes (the verifier ran both). D-02 functions in content.js and background.js are unchanged in the 6d3ab0b diff. Timing: D-29 (recorded in 07-CONTEXT.md) replaces the absolute figure with a same-session band; 1.7 ms against 0.1.0's 1.8 ms, band 0.2 ms, passed, with all budgets met. WR-02 is a 0.1.0 divergence in the handshake, but only while a settings read is unsettled (see Human Verification) |
| 5 | Any setting written through the worker settings queue lands only in `chrome.storage.local`; sync stays empty; no network request | ✓ VERIFIED | background.js `writeSetting` is the only settings write: `chrome.storage.local.set({ [key]: stored })`. No `sync` reference exists in shipped code, and grep finds no fetch, XHR, WebSocket, EventSource, sendBeacon, Image or scheme-relative URL. In tracer-world, `sync`, `session` and `managed` are recorded-deny proxies, and network globals are denied in every context. The test "after a sequence of settings operations only storage.local was written, one key per write (DATA-01)" passes with `forbidden` empty. Content-side `local.set` is a recorded forbidden channel |

**Score:** 5/5 roadmap truths verified (0 present-but-behaviour-unverified). Every behaviour-dependent truth is backed by a named test that passed in the single full-suite run.

### Plan must-have truths (merged, spot-checked beyond the suite)

| Plan | Key truths | Status | Evidence |
|------|-----------|--------|----------|
| 07-01 | Baseline reader rejections; parity matrix; frozen contract; D-06 single commit | ✓ | Code read. 8e9373b touches only test/extension/ |
| 07-02 | Exact pins; approvals recorded; smoke passes | ✓ | package.json has `typescript` 7.0.2 and `@types/chrome` 0.3.0 with no range, and no `dependencies`. DEPENDENCY-APPROVALS.md rows 11-12 and questions 3-5. `test/recon/dependency-approvals.smoke.js` is in the 112 passing tests. The approval itself is a human attestation |
| 07-03 | One frozen `Zhroma` global; theme registry; options stub; 14 RELEASE_FILES; import-failure resilience | ✓ | zhroma-settings.js L128-139 (`defineProperty`, `writable: false`, `configurable: false`). `THEME_IDS = ['zhroma-classic']`. options.html has no script and one `<p>`. RELEASE_FILES includes options.html and zhroma-settings.js. The test "with the import failing, the worker still projects the working toolbar and still saves the off switch" passes |
| 07-04 | Serial single writer, cas, unchanged skip, finite outcomes, local only | ✓ | `createQueue` (L460-594) runs one `activeJob`, awaits `job.physical` before draining the next, handles cas conflict, the D-11 skip, deadlines and `maxPending`. 17 queue tests pass |
| 07-05 | D-17 sender checks; options sender; matches agreement | ✓ | `isAgentDocument(sender.url)` in `fromContent`, and `fromOptions` compares `getURL('options.html')`. `set-setting` is admitted only from the popup or options page. Negative and positive tests pass. Route-pin restatement is in its own commit (e0f2431) |
| 07-06 | 500 ms bounded gate; failure opens it; one storage listener; D-14 path; 3 stored-theme parity states | ✓ | content.js `SETTINGS_READ_TIMEOUT_MS = 500` and `settingsReady &&` in `runnable()`. `onStorageChanged` wraps the settings handler in try/catch before `onPreferenceChanged`. The parity STATES include the three theme states |
| 07-07 | Upgrade-state proofs; 13 mutants | ✓ | upgrade-storage.test.js (above). The mutants file has 13 entries |
| 08 | Blocking strict tsc first in test:recon; nothing emitted; v1 inclusion record | ✓ | `test:recon` starts with `tsc -p tsconfig.json`. tsconfig.v1.json checks background.js. content.js and popup.js are excluded, with the reason recorded. No config or d.ts under extension/. `git status` is clean. The non-vacuity check was run by the verifier |
| 09 | Same-session D-29 timing; 52/52 on the timed bytes | ✓ | Recomputed from the samples. The timed bytes equal HEAD. Mutants were re-run at HEAD: 52/52 |

### Prohibitions (judgment tier, non-authoritative verifier verdicts; human resolution requested)

| Plan | Prohibition (short) | Verifier verdict |
|------|---------------------|------------------|
| 07-01 | Parity never compares the working tree against itself | Holds. The baseline comes only from Git blobs at the literal revision, with no working-tree fallback |
| 07-01 | Frozen contract never widened | Holds. The file has two commits: 8e9373b and the 07-10 tightening b0ae2dc, which adds rules only and deletes 0 lines |
| 07-02 | No install before a separate per-version approval | Human attestation only. The record exists, but the chronology can't be verified independently |
| 07-03 | Read, resolve and migrate never write, repair or delete | Holds. The upgrade and unreadable-theme tests show byte-identical storage, and content `set` is forbidden |
| 07-03 | No new user-visible settings text in the popup, toolbar or page | Holds for the popup, toolbar and page (byte-identical popup and css). The options stub adds one neutral line, which D-18 permits |
| 07-04 | Settings only ever written to storage.local; nothing sent anywhere | Holds |
| 07-04 | The worker never writes an unchosen setting | Holds for the shipped `theme` key. WR-03 (raw vs parsed `equal`) would break this for a normalising Phase 9/10 key |
| 07-06 | A settings fault never stops tinting beyond the bounded wait, and never changes off/on or the diagnosis | Partly contradicted inside the bounded window. WR-02 means the apply acknowledgement reports `applied: true` with a `neutral` diagnosis while rows are held back, and an open popup is left on 'Checking this view'. Tinting itself is bounded at 500 ms |
| 07-06 | The content script never sends a settings value, key or status | Holds. The only content → worker message is `{type:'status-invalidated'}` |
| 07-08 | Type checking never changes what ships | Holds |
| 07-09 | Timing and mutation results only against the measured bytes | Holds. Hashes and bytes equal HEAD, and the verifier re-ran the mutants on HEAD |

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `scripts/baseline-source.js` | ✓ VERIFIED | Exports `BASELINE_REVISION`, `CANDIDATE_PATH`, `BaselineSourceError`, `readBaselineSource`. Used by parity.test.js and run-tint-workload.js |
| `test/extension/parity.test.js` | ✓ VERIFIED | 108 matrix cases plus controls |
| `test/extension/frozen-contract.test.js` | ✓ VERIFIED | Contains `optional_host_permissions`. The walker covers the whole extension/ tree |
| `test/extension/runtime-contract.test.js` | ✓ VERIFIED | Versioned header plus the "Chrome API allowlist" section |
| `extension/zhroma-settings.js` | ✓ VERIFIED | `// @ts-check`, 604 lines, registry, queue. Loaded first in `content_scripts[0].js` and by `importScripts` |
| `extension/options.html` | ✓ VERIFIED | Static, one `<p>`, no script |
| `extension/manifest.json` | ✓ VERIFIED | `options_ui`, `["zhroma-settings.js", "content.js"]`, version `0.1.0` |
| `extension/background.js` | ✓ VERIFIED | Guarded `importScripts('zhroma-settings.js')` first, `createQueue(`, `'set-setting'`, `isAgentDocument(sender.url)`, `getURL(OPTIONS_PATH)` |
| `extension/content.js` | ✓ VERIFIED | `SETTINGS_READ_TIMEOUT_MS = 500`, `Zhroma?.settings`, `settingsReady &&` |
| `test/extension/settings-{module,queue,reader}.test.js`, `upgrade-storage.test.js` | ✓ VERIFIED | Substantive, and they pass |
| `test/mutants/settings-foundation.mutants.json` | ✓ VERIFIED | 13 entries, all killed in the verifier's run |
| `tsconfig.json`, `tsconfig.v1.json`, `types/zhroma.d.ts` | ✓ VERIFIED | Repository root only, `noEmit` |
| `07-PERFORMANCE.md` and samples | ✓ VERIFIED | Recomputed |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| parity.test.js | baseline-source.js | `readBaselineSource()` feeds the baseline side | WIRED |
| baseline-source.js | release/candidate.json | revision, assets and digest cross-check | WIRED |
| manifest.json | zhroma-settings.js | first in `content_scripts[0].js` | WIRED |
| background.js | zhroma-settings.js | `importScripts` then `globalThis.Zhroma?.settings`, then `createQueue` | WIRED |
| background.js | chrome.storage.local | `writeSetting` is the single primitive | WIRED |
| content.js | zhroma-settings.js | `registry.keys` / `resolve` / `defaultOf` | WIRED |
| content.js | runnable() | `settingsReady &&` | WIRED |
| background.js | options.html | `fromOptions` → `getURL('options.html')` | WIRED |
| package.json | tsconfig.json | `test:recon` starts with tsc | WIRED |
| run-tint-workload.js | baseline-source.js | `--source baseline` | WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| content.js settingsState | `theme` | `chrome.storage.local.get(['theme'])` → `registry.resolve` | Yes. Phase 7 deliberately does nothing visible with it (D-14) | ✓ FLOWING (internal only by design) |
| background.js settings queue | stored form | `registry.encode` → `storage.local.set` | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Whole suite green | `npm test` | exit 0; 112 node + 1441 vitest | ✓ PASS |
| Every registered mutant dies | `npm run test:mutants` | `MUTATION KILLS: 52/52 killed` | ✓ PASS |
| Type check blocks on error | scratch tsconfig extending the repo config | exit 1, TS2322 | ✓ PASS |
| Timed bytes = HEAD bytes | `git diff df28338 HEAD -- extension/ …` + shasum | empty diff, hashes equal | ✓ PASS |
| WR-02 handshake during gate | scratch tracer-world test, `settingsReadMode: 'hang'` | popup 'Checking this view', 0 markers until 500 ms | ⚠ divergence (fault window only) |
| Chrome timing re-run | n/a | headless Chrome cannot launch in the sandbox; the recorded samples were used | ? SKIP |

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists, and no plan declares one.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| COMPAT-01 | 07-01, 03, 06, 09 | Fresh 1.0.0 install paints tints identical to 0.1.0 (light, default, no rules) | ✓ SATISFIED | SC 1 parity harness |
| COMPAT-02 | 07-03, 04, 07 | Upgrade keeps off/on; nothing new stored until a change | ✓ SATISFIED | SC 2 upgrade-storage proofs |
| COMPAT-03 | 07-01, 03, 04 | No permission beyond `storage` | ✓ SATISFIED | SC 3 frozen contract and manifest |
| COMPAT-04 | 07-01…09 | Every verified 0.1.0 behaviour unchanged with default settings | ✓ SATISFIED (WR-02 decision pending) | SC 4 |
| DATA-01 | 07-04, 06, 07 | Settings only in `chrome.storage.local`; never synced or sent | ✓ SATISFIED | SC 5 |

No orphaned requirements. REQUIREMENTS.md maps exactly these five IDs to Phase 7, and each appears in at least one plan.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (phase files) | — | TBD/FIXME/XXX | none found | — |
| extension/content.js | 446-461, 386-393 | WR-02: `applyPreference` returns `applied: true` while `settingsReady` is false, because `pauseController()` returns true when there is nothing to clear | ⚠️ Warning | Apply handshake differs from 0.1.0 during the ≤500 ms gate window |
| scripts/phase-04-source.js | 137-168, 229-231 | WR-01: whole-file pin narrowed to text slices, which top-level code can bypass (a deviation outside 07-09's files_modified, recorded in the SUMMARY) | ✅ Fixed (07-11, bfd364c, 029f031, b9067c1, 6da90dc) | Weakens a Phase 5 evidence guard. Sound for today's bytes |
| test/extension/frozen-contract.test.js | 69-71, 95 | WR-06: call-shaped network, sync and remote patterns can be evaded | ✅ Fixed (07-10, b0ae2dc) | The frozen file is meant never to change, so any gap is permanent unless tightened now |
| extension/zhroma-settings.js | 342, 356, 406-408, 217-218, 528 | WR-03/04/05, IN-02: latent defects for future normalising, CAS or object-default keys | ⚠️ Warning (latent) | No effect with today's single exact-match `theme` key. They will surface with the Phase 9/10 keys that D-15 promises need no queue or reader change |
| extension/content.js | 18-21, 536 | IN-01: a hung read leaves status `default`, not `unreadable` | ℹ️ Info | Internal status only in Phase 7 (D-12). Matters when Phase 8 shows wording |
| extension/background.js | 106 | IN-03: `set-setting` for an unregistered key gets no reply | ℹ️ Info | No caller sends one in Phase 7 |

### Human Verification Required

#### 1. WR-02: the apply handshake during the settings gate

**Test:** Start with stored `enabled: false`. While the content settings read has not settled (hung, or slower than the preference read), switch Zhroma on from the popup.
**Expected:** Decide whether the current behaviour is acceptable. The page answers `applied: true, diagnosis: neutral`. The open popup shows 'Checking this view' and stays there. Rows tint at the 500 ms bound, and the toolbar then corrects itself. 0.1.0 answered `working` at once. The alternative is the reviewer's one-line fix plus a hang-mode handshake test.
**Why human:** This only happens in a fault condition 0.1.0 did not have. Whether it breaks "off/on behaves as in 0.1.0" is a product call.

#### 2. SC 4 wording against D-29

**Test:** Read 07-CONTEXT.md D-29 and 07-PERFORMANCE.md.
**Expected:** Accept the same-session band (1.7 ms against 0.1.0's 1.8 ms on the same machine, passed) as meeting "about 1.3 ms". Then either add an override to this file or amend the ROADMAP text. A suggested override:

```yaml
overrides:
  - must_have: "the zero-rule timing median stays at about 1.3 ms"
    reason: "D-29: absolute medians drift across machines and Chrome builds; same-session 0.1.0 vs Phase 7 comparison (1.8 vs 1.7 ms, band 0.2 ms) passed"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

**Why human:** Only the user can accept a reinterpretation of the ROADMAP contract.

#### 3. Judgment-tier prohibitions (11)

**Test:** Review the Prohibitions table above.
**Expected:** Confirm or overturn each verdict. Pay particular attention to the 07-02 approval attestation and to the 07-06 COMPAT-04 item that WR-02 touches.
**Why human:** These are judgment-tier and flagged, so the verifier's verdict is not authoritative.

#### 4. WR-01 and WR-06: guards that hold today but can be evaded later

**Test:** Decide whether to harden the Phase 4 judge pin (run the pinned judges in a fresh VM context) and the frozen-contract patterns (bare identifiers, scheme-relative URLs, aliased storage) now, while the frozen file can still be tightened without a new decision.
**Expected:** A recorded decision: fix now, or defer with the reason logged in the review disposition, the backlog or `.planning/WINDOWS.md` (D-31).
**Why human:** Neither falsifies a Phase 7 truth on the current bytes. This is scope and policy.

### Gaps Summary

No must-have failed. The goal is met on the current bytes:

- The settings layer exists and is wired end to end: module, worker queue, reader, gate and change listener.
- A fresh or upgraded install keeps exactly 0.1.0's storage and painting. The differential harness proves it against pinned blobs, and the upgrade-state proofs show nothing is written.
- The permission surface is frozen by a separate test.
- Settings writes are local-only, and there is no network surface.

The status is `human_needed`, not `passed`, for four reasons:

1. **WR-02** is a real, reproduced divergence from 0.1.0's apply handshake, confined to the bounded settings-gate window.
2. **SC 4's literal "about 1.3 ms"** is met only through the locked D-29 reinterpretation, which the ROADMAP text does not yet reflect.
3. **Eleven judgment-tier prohibitions** are flagged and need human resolution.
4. **Two warnings (WR-01, WR-06)** loosen or leave gaps in guards that stay sound on today's bytes but could be evaded by later edits.

The latent settings-module defects (WR-03/04/05, IN-01/02/03) do not affect Phase 7. They should be fixed before or during Phase 8/9, because D-15 promises that later keys need no queue or reader change.

---

_Verified: 2026-09-28T11:58:00Z_
_Verifier: Claude (gsd-verifier)_

## Gap closure (07-10 to 07-12, 2026-10-01)

This note was appended by plan 07-12. It does not change the status, score or any truth above; re-verification owns those.

- **G-07-4b (WR-06)** was closed by 07-10 in b0ae2dc, a single test-only commit to `test/extension/frozen-contract.test.js` (166 lines added, 0 deleted) under UAT 07 test 4 decision A. It adds identifier-level network and sync rules over string-aware comment-stripped scripts, a scheme-relative rule over raw text, and negative controls.
- **G-07-4a (WR-01)** was closed by 07-11 in bfd364c (failing test), 029f031 (the adapter), b9067c1 (M1-M5 controls) and 6da90dc (the live-acceptance repoint). The historical Phase 3 and Phase 4 timing verdicts are now decided by the pinned judges, run in a fresh null-prototype `node:vm` context on in-context-parsed JSON. The text equality is kept as a tripwire.
- The two fixes are separate: no commit after 2441c64 touches both the frozen file and a WR-01 file.
- The full suite passed on the final bytes: `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm run test:recon` exited 0, with both tsc configs clean, 112/112 node smoke tests and 1455/1455 Vitest tests. The 07-12 gap-closure gate printed `GAP_CLOSURE_GATE_OK`.
- `git diff --name-only df28338 HEAD -- extension` is empty, so extension/ is unchanged since the timed source. No file under test/mutants/ names any of the changed test files. The 52/52 mutation record and the D-29 timing therefore still describe the shipped bytes (D-25).
- 07-REVIEW-DISPOSITION.md now records WR-01 and WR-06 as `fixed`, and the open count is 8.
- Re-verification owns the status and score.
