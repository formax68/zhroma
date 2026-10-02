---
phase: 07-upgrade-safe-foundation
verified: 2026-10-02T02:40:21Z
status: passed
score: 5/5 roadmap success criteria verified, plus 2/2 gap-closure truths (G-07-4a, G-07-4b); 0 failed, 0 behaviour-unverified
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
  - .planning/phases/07-upgrade-safe-foundation/07-10-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-10-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-11-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-11-SUMMARY.md
  - .planning/phases/07-upgrade-safe-foundation/07-12-PLAN.md
  - .planning/phases/07-upgrade-safe-foundation/07-12-SUMMARY.md
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
  - test/extension/phase-03-live-acceptance.test.js
  - test/extension/phase-04-live-acceptance.test.js
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
covered_digest: "v2:sha256:ce0a1b5e8e2125c352d2a3f792e8d339ff871c2a018eaeb241a608ebc31a49e0"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 5/5 roadmap success criteria verified (4 human decisions pending)
  previous_verified: 2026-09-28T11:58:00Z
  uat: "07-UAT.md: tests 1-3 passed with recorded decisions (WR-02 accepted; SC 4 ROADMAP text restated per D-29; 11 prohibitions confirmed); test 4 raised G-07-4a and G-07-4b"
  gaps_closed:
    - "G-07-4a (WR-01): historical Phase 3 and Phase 4 timing verdicts are decided by the pinned judge slices from Git, executed in a fresh null-prototype node:vm context on in-context-parsed JSON (07-11: bfd364c, 029f031, b9067c1, 6da90dc)"
    - "G-07-4b (WR-06): the frozen contract catches evasive network calls, scheme-relative URLs and aliased or destructured sync access, each with negative controls; additive only (07-10: b0ae2dc)"
  human_items_resolved:
    - "WR-02 apply handshake during the settings gate: accepted by the user as the cost of D-09 (UAT test 1, decision A; disposition `skipped`)"
    - "SC 4 'about 1.3 ms' vs D-29: ROADMAP SC 4 text now states the D-29 same-session rule (UAT test 2, decision B; commit 66b799c)"
    - "11 judgment-tier prohibitions: all confirmed by the user, including the 07-02 approval attestation and the 07-06 COMPAT-04 exception confined to the 500 ms window (UAT test 3, decision A)"
    - "WR-01 and WR-06: user chose to fix both now (UAT test 4, decision A); both fixed and verified below"
  gaps_remaining: []
  regressions: []
---

# Phase 7: Upgrade-Safe Foundation Verification Report

**Phase Goal:** The 1.0.0 codebase can carry new settings, while an agent upgrading from 0.1.0 or installing fresh sees and keeps exactly what 0.1.0 gave them
**Verified:** 2026-10-02T02:40:21Z at HEAD `3cf5150`
**Status:** passed
**Re-verification:** Yes. This follows UAT (07-UAT.md) and the gap-closure plans 07-10, 07-11 and 07-12.

## Evidence the verifier produced itself

- **Full suite at HEAD `3cf5150`:** `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm test` exited 0. Both tsc configs ran clean (no `error TS`), node smoke passed 112/112, and Vitest passed 32 files with 1455/1455 tests. The single full run was saved to a scratch log and grepped.
- **Mutation kills:** `npm run test:mutants` exited 0 and printed `MUTATION KILLS: 52/52 killed`. Afterwards `git status` showed only the untracked files the user already had.
- **Gap-closure files run on their own:** a verbose Vitest run of `frozen-contract`, `performance-harness`, `phase-04-live-acceptance` and `phase-03-live-acceptance` passed 4 files with 184 tests. All five new WR-06 tests and all nine new WR-01 tests (pinned verdicts, M1-M4 tripwire blindness, M1 liveness, M2-M4 liveness, M5 liveness, re-import guard) are named passes.
- **The 07-11 one-liner:** run independently, it printed `PINNED_JUDGES_PASSED_13`. All 7 Phase 4 runs and all 6 non-profile Phase 3 runs returned `passed` from `readPhase04Source().judges`.
- **The 07-12 gate:** run independently under bash, it printed `GAP_CLOSURE_GATE_OK`:
  - exactly one commit after 8e9373b touches the frozen file (b0ae2dc);
  - no WR-01 commit (bfd364c, 029f031, b9067c1, 6da90dc, df28338) touches the frozen file;
  - `git diff --name-only df28338 HEAD -- extension` is empty;
  - no mutant registry names a changed test file.
- **Independent adversarial check (scratch script in $TMPDIR, beyond the planned M1-M5):** the following were patched in the host realm at the same time: `Math.max`, `Number.isFinite`, `Array.prototype.reduce`, `Array.prototype.filter` and host `JSON.parse`, plus `Object.prototype.JSON`, `Object.prototype.Math` and `Object.prototype.Number` were planted. The pinned judges still returned the honest verdicts (`ok` passed, an 18 ms `slow` run gaps_found). The returned judge object is frozen. Passing an object instead of JSON text is refused with `phase-04-timing-judge-input`.
- **Scope since UAT:** `git diff --name-only 602368f HEAD -- extension scripts test types tsconfig*.json package*.json` lists exactly the five gap-closure files. Nothing under extension/ moved, so the parity, upgrade, timing (D-29, timed source df28338) and mutation evidence still describe the shipped bytes.

## Goal Achievement

### Observable Truths (ROADMAP success criteria, current wording)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Light interface, default settings: the working tree paints the same row attributes, diagnoses and computed cell backgrounds as the pinned 0.1.0 blobs, across the three fixtures and the Phase 3/4 sequences, through a differential parity harness | ✓ VERIFIED (regression) | `test/extension/parity.test.js` is unchanged since the initial verification and passed in the full run. Its baseline comes only from `readBaselineSource()` (pinned 6d3ab0b blobs, cross-checked against release/candidate.json, no fallback). extension/ is unchanged since df28338 |
| 2 | An install upgraded from 0.1.0 keeps its off/on setting; storage holds nothing beyond `enabled` until the agent changes a setting; no `onInstalled` writes | ✓ VERIFIED (regression) | Grep finds no `onInstalled` or `onStartup` in extension/. `upgrade-storage.test.js` passed in the full run. The only `storage.local.set` calls are background.js:138 (the v1 `enabled` preference) and :442 (`writeSetting`) |
| 3 | No permission prompt: the manifest requests exactly `storage`, no `host_permissions`, same match pattern; a frozen contract test separate from the v1.0 pins enforces this | ✓ VERIFIED | manifest.json: `permissions: ["storage"]`, no `host_permissions` or `optional_host_permissions`, one match `https://*.zendesk.com/agent/*`, `ISOLATED`, `all_frames: false`, version `0.1.0`. `frozen-contract.test.js` has exactly two commits: 8e9373b, then b0ae2dc with 166 lines added and 0 deleted. The original 7 tests still pass alongside the 5 added ones. `runtime-contract.test.js` is untouched by the gap closure |
| 4 | Default settings: priority detection, liveness through sort, refresh, view switch, pagination and scroll, the three-way diagnosis and off/on behave as 0.1.0; existing suites pass; v1 mutants still die; the zero-rule 30-row median stays within 10% or 0.2 ms of the 0.1.0 bytes in the same session, with the existing budgets passing (D-29) | ✓ VERIFIED | The parity matrix covers every named behaviour. The full suite passes, and the verifier's own `npm run test:mutants` run gave 52/52. The ROADMAP now states the D-29 rule (66b799c). 07-PERFORMANCE.md records 1.7 ms against 1.8 ms (band 0.2 ms, passed) on the timed source df28338, and the extension/ bytes still equal it. The WR-02 fault-window divergence was accepted by the user (UAT test 1, decision A) as a recorded exception to D-09. The historical Phase 3/4 timing verdicts that the existing suites rely on are now decided by the pinned judges (G-07-4a below) |
| 5 | Any setting written through the worker settings queue lands only in `chrome.storage.local`; sync stays empty; no network request | ✓ VERIFIED | `writeSetting` → `chrome.storage.local.set` (background.js:442) is the only settings write. The new identifier-level rules in `frozen-contract.test.js` (NETWORK_NAME and SYNC_NAME over comment-stripped scripts, SCHEME_RELATIVE over raw scripts, pages and stylesheets) find nothing in any shipped file. The tracer-world DATA-01 test passed in the full run |

**Score:** 5/5 roadmap truths verified (0 present-but-behaviour-unverified).

### Gap-closure truths (re-verification focus, full 3-level check)

| Gap | Truth | Status | Evidence |
|-----|-------|--------|----------|
| G-07-4a (WR-01) | Historical Phase 3/4 timing samples are judged by the pinned judge code, not by the working copy of scripts/run-tint-workload.js | ✓ VERIFIED | **Exists:** `buildTimingJudges` in scripts/phase-04-source.js does three things. It runs `timingJudgeSource(...)` de-exported, creates `createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } })`, and parses the JSON text with the context's own `JSON.parse`. It returns a frozen host wrapper.<br>**Substantive:** `readPhase04Source()` takes the runner from `blob(observation_revision, TIMING_JUDGE_PATH)` and keeps the `phase-04-timing-judge-changed` tripwire. `judges: buildTimingJudges(pinnedRunner)` is part of the frozen result. `readFileSync(` appears exactly once.<br>**Wired:** phase-04-live-acceptance.test.js:350 calls `OBSERVED_SOURCE.judges.validateWorkloadReport(JSON.stringify(run))`. phase-03-live-acceptance.test.js:18/135 does the same through `readPhase04Source().judges`. Neither file imports the runner (grep: the only mention is a comment). A guard test enforces this.<br>**Behaviour:** the M1-M5 liveness and immunity tests pass by name, and the verifier's broader patch set did not move a verdict |
| G-07-4b (WR-06) | The frozen contract catches evasive network calls, quoted and unquoted scheme-relative URLs, and aliased or destructured sync access, each proven by a negative control | ✓ VERIFIED | b0ae2dc adds four things. `codeOf` is a string-aware lexeme pass: strings are matched before comment openers, banned-name literals are kept, other quoted strings are blanked and templates are kept whole. It is proven on exact outputs, including `'/*'; fetch(u); '*/'`, and on a shipped script. `NETWORK_NAME` has 22 violation controls, `SYNC_NAME` has 8 and `SCHEME_RELATIVE` has 10. `STYLE_IMAGE_SET` and `styleAttributes` cover style loads. The clean controls (the two shipped comments verbatim, prose strings, `syncController`, `async`) pass. The documented limits are in the file. All five tests pass, and every shipped script, page and stylesheet passes every new rule |

### Plan must-have truths (07-01 to 07-09: regression; 07-10 to 07-12: full)

| Plan | Key truths | Status | Evidence |
|------|-----------|--------|----------|
| 07-01 to 07-09 | As in the initial verification | ✓ (regression) | No file in their scope changed after UAT except the two live-acceptance tests, the harness test and the adapter, all of which are covered by 07-11. The full suite and 52/52 mutants pass at HEAD |
| 07-10 | Additive, single test-only commit with a `Why:` body; not bundled with WR-01; extension/ unchanged; runtime-contract unchanged; documented limits | ✓ | `git show --stat b0ae2dc`: one file, +166/-0. The body starts with `Why:`. The gate shows no shared commit with WR-01 |
| 07-11 | Pinned judges in a null-prototype VM; JSON-text inputs; M1-M5 live; live-acceptance repointed in its own commit; one `readFileSync(`; no new dependency; Phase 4 `human_needed` 14/3, Phase 3 `human_needed` 11/9 unchanged | ✓ | 029f031 touches only the adapter, b9067c1 only the harness test, and 6da90dc only the three test files (its body starts with `Why:`). package.json is untouched (`node:vm` is a built-in). The live-acceptance verdict tests pass unchanged |
| 07-12 | Final-bytes gate; disposition WR-01/WR-06 `fixed` with existing commits and `open: 8`; VERIFICATION/STATE statements refreshed | ✓ | The gate output is above. In 07-REVIEW-DISPOSITION.md both rows read `fixed`, `open: 8`, and every cited sha resolves with `git cat-file -e`. STATE.md lines 190 and 206 describe the post-fix state |

### Prohibitions (judgment tier)

The initial verification raised 11 flagged judgment-tier prohibitions. All 11 were resolved by the user in UAT test 3 (decision A, 2026-09-30):

- 9 verdicts were upheld.
- 07-02: the user attested to the order of approval and install.
- 07-06 COMPAT-04: accepted as an exception confined to the 500 ms settings window.

Plans 07-10 to 07-12 declare no prohibitions. None is outstanding.

The UAT carried a note forward: "the worker never writes an unchosen setting" holds for `theme` only, and WR-03 must be fixed before a normalising Phase 9/10 key lands. It is recorded under Anti-Patterns as latent.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `scripts/phase-04-source.js` | ✓ VERIFIED | `buildTimingJudges` is exported and `judges` is part of the frozen result. The import builds no context and runs no git, because both happen lazily in `readPhase04Source` |
| `test/extension/performance-harness.test.js` | ✓ VERIFIED | The pinned-verdict test, M1-M5 controls with `finally` restores and no `expect` inside a patch window, and the re-import guard |
| `test/extension/phase-04-live-acceptance.test.js` | ✓ VERIFIED | Calls the judges at L350. No runner import |
| `test/extension/phase-03-live-acceptance.test.js` | ✓ VERIFIED | Imports `readPhase04Source`. Calls the judges at L135 |
| `test/extension/frozen-contract.test.js` | ✓ VERIFIED | `codeOf`, NETWORK_NAME, SYNC_NAME, SCHEME_RELATIVE, STYLE_IMAGE_SET, styleAttributes. Additive only |
| Phase 7 settings layer (zhroma-settings.js, background.js queue, content.js reader and gate, options.html, manifest.json) | ✓ VERIFIED (regression) | Byte-identical to the timed source df28338 |
| 07-REVIEW-DISPOSITION.md | ✓ VERIFIED | WR-01 and WR-06 `fixed`, WR-02 `skipped`, 8 open |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| scripts/phase-04-source.js | git blob `<observation_revision>:scripts/run-tint-workload.js` | `blob()` → `timingJudgeSource` → `Script.runInContext(createContext(Object.create(null), …))` | WIRED |
| phase-04-live-acceptance.test.js | phase-04-source.js | `OBSERVED_SOURCE.judges.validateWorkloadReport(JSON.stringify(run))` | WIRED |
| phase-03-live-acceptance.test.js | phase-04-source.js | `readPhase04Source().judges` | WIRED |
| frozen-contract.test.js | extension/ | `discover()` feeds `scripts`, `pages` and `stylesheets` into every new rule | WIRED |
| (initial-verification links: parity → baseline-source, manifest → zhroma-settings.js, background → queue → storage.local, content → registry and `settingsReady` gate, options sender check, test:recon → tsc) | — | unchanged code | WIRED (regression) |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| Phase 3/4 live-acceptance timing verdict | `validateWorkloadReport` result | recorded `0[34]-PERFORMANCE-SAMPLES.json` runs → JSON text → pinned judges from Git | Yes: 13 real recorded runs, all `passed` | ✓ FLOWING |
| content.js settingsState / background.js queue | `theme` | storage.local → `registry.resolve` / `registry.encode` → storage.local | Yes (internal only by design, D-14) | ✓ FLOWING (unchanged) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Whole suite green | `env GSD_FIXTURE_MANIFEST=test/fixtures/manifest.json npm test` | exit 0; tsc ×2 clean; 112/112 node; 1455/1455 Vitest (32 files) | ✓ PASS |
| Every registered mutant dies | `npm run test:mutants` | `MUTATION KILLS: 52/52 killed` | ✓ PASS |
| Pinned judges pass all 13 historical runs | the 07-11 `PINNED_JUDGES_PASSED_13` one-liner | printed | ✓ PASS |
| Gap-closure separation and bytes gate | the 07-12 gate under bash | `GAP_CLOSURE_GATE_OK` | ✓ PASS |
| Host-realm patches cannot reach the pinned judges | scratch script, 5 built-in patches plus 3 Object.prototype plants | verdicts unchanged; judge frozen; non-string refused | ✓ PASS |
| Chrome timing re-run | n/a | not repeated. extension/ equals the timed source df28338, so D-29's recorded same-session result stands | ? SKIP (not needed) |

### Probe Execution

Step 7c: SKIPPED. No `scripts/*/tests/probe-*.sh` exists, and no plan declares one.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| COMPAT-01 | 07-01, 03, 06, 09 | Fresh 1.0.0 install paints tints identical to 0.1.0 (light, default, no rules) | ✓ SATISFIED | SC 1 |
| COMPAT-02 | 07-03, 04, 07 | Upgrade keeps off/on; nothing new stored until a change | ✓ SATISFIED | SC 2 |
| COMPAT-03 | 07-01, 03, 04 | No permission beyond `storage` | ✓ SATISFIED | SC 3 |
| COMPAT-04 | 07-01…09, 11, 12 | Every verified 0.1.0 behaviour unchanged with default settings | ✓ SATISFIED | SC 4. The WR-02 exception was accepted in UAT test 1 |
| DATA-01 | 07-04, 06, 07, 10, 12 | Settings only in `chrome.storage.local`; never synced or sent | ✓ SATISFIED | SC 5 and the 07-10 tightening |

There are no orphaned requirements. REQUIREMENTS.md maps exactly these five IDs to Phase 7, each appears in at least one plan's `requirements`, and all five are marked Complete.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| the 5 gap-closure files | — | TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER | none found (grep exit 1) | — |
| scripts/phase-04-source.js | — | WR-01 | ✅ Fixed (07-11) | Verified above |
| test/extension/frozen-contract.test.js | — | WR-06 | ✅ Fixed (07-10) | Verified above |
| extension/content.js | 386-393, 446-461 | WR-02: `applied: true` with diagnosis `neutral` during the 500 ms gate | ℹ️ Accepted (UAT test 1, disposition `skipped`) | A recorded exception to D-09. Not a gap |
| extension/zhroma-settings.js | 217-218, 342, 356, 406-408, 528 | WR-03/04/05, IN-02: latent defects for future normalising, CAS or object-default keys | ⚠️ Warning (latent, open in the disposition ledger) | No effect with today's single `theme` key. Must be fixed before the Phase 9/10 keys that D-15 says need no queue or reader change |
| extension/content.js, extension/background.js | 18-21, 536; 106 | IN-01, IN-03 | ℹ️ Info (open) | Internal only in Phase 7 |
| test/extension/frozen-contract.test.js | 186-198 | Documented rule limits (computed names, escapes, run-time URLs, regex literals) | ℹ️ Info | Stated in the file by design. A lexer-free approach cannot close them |

### Advisory (New Scope, Unevidenced)

None. The re-verification raised no new-scope finding. The execute:post code-review gate was skipped for 07-10 to 07-12 by recorded user decision (STATE.md line 211, 3cf5150). That decision is not treated as a gap, and `/gsd-code-review 07` remains an optional follow-up.

### Human Verification Required

None. Every item the initial verification routed to a human was resolved in 07-UAT.md:

- tests 1-3 passed with recorded decisions;
- test 4's decision A produced G-07-4a and G-07-4b, which are now closed and verified from code and tests above.

Nothing in the gap closure is human-only.

### Gaps Summary

There are no gaps. The phase goal holds on the current bytes:

- The settings layer is present and wired end to end.
- A fresh or upgraded install keeps exactly 0.1.0's storage and painting, as proven against pinned blobs.
- The permission surface is frozen by a separate test, which is now tightened against indirection.
- Settings writes are local-only, with no network surface.

Both UAT gaps are closed with real code:

- **WR-01:** the historical timing verdicts come from the pinned Git judges, executed in an isolated realm.
- **WR-06:** the frozen contract bans names over comment-stripped code and scheme-relative URLs over raw text.

Each fix has live negative controls, and the two fixes landed in separate commits.

Bookkeeping for the orchestrator: 07-UAT.md still has frontmatter `status: diagnosed`, and its G-07-4a and G-07-4b entries still read `status: failed`. Those are the UAT's own records, which this verifier did not edit. The latent WR-03/04/05 defects stay open in the disposition ledger for Phase 8/9.

---

_Verified: 2026-10-02T02:40:21Z_
_Verifier: Claude (gsd-verifier)_
