---
phase: 08-themes-that-follow-dark-mode
plan: "01"
subsystem: ui
tags: [chrome-mv3, themes, colour, oklab, settings, popup, tracer]
requires:
  - phase: 07-upgrade-safe-foundation
    provides: Validated local theme envelope and bounded single-writer queue
  - phase: 06-live-dom-recon-2
    provides: Admitted dark table, root appearance marker and measured native paints
provides:
  - Frozen Classic and Catppuccin two-mode eight-slot palette records
  - Finite numeric colour arithmetic and shared composited previews
  - Confirmed popup theme choices through the existing queue to root-only cell paint
  - Separate versioned representation pins and preserved baseline/frozen contracts
affects: [08-02, 08-03, 08-04, 08-05, 09-colouring-rules]
tech-stack:
  added: []
  patterns: [pure-classic-scripts, numeric-root-properties, confirmed-choice-owner, exact-worker-read-protocol]
key-files:
  created: [extension/zhroma-colour.js, extension/zhroma-themes.js, test/extension/theme-colour.test.js, test/extension/theme-tracer.test.js]
  modified: [extension/zhroma-settings.js, extension/background.js, extension/content.js, extension/zhroma.css, extension/manifest.json, extension/popup.html, extension/popup.js, scripts/release-source.js, types/zhroma.d.ts, tsconfig.json, test/extension/tracer-world.js, test/extension/settings-queue.test.js, test/extension/runtime-contract.test.js, test/extension/parity.test.js, test/extension/toolbar-popup.test.js, test/mutants/settings-foundation.mutants.json]
key-decisions:
  - "Retain Catppuccin Latte/Mocha RGB and semantic priority slots; tune alpha only against measured native states."
  - "Theme equality compares the effective fallback even when stored data is unreadable; other-key/CAS behavior stays intact."
  - "The parity negative control mutates the effective Classic registry alpha rather than its overridden CSS fallback."
  - "Saved means persisted; uncertain issued writes receive exactly one bounded readback, never a retry write or applied claim."
requirements-completed: [DARK-01, DARK-02, DARK-03, DARK-05, THEME-01, THEME-02, THEME-03, THEME-05, THEME-06, THEME-07]
coverage:
  - id: D1
    description: "Classic/Catppuccin arithmetic meets the numerical gate on measured light/dark native states, with exact pinned Classic light floors."
    verification:
      - kind: unit
        ref: test/extension/theme-colour.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: "Actual packaged popup/worker/content source saves one theme envelope, paints four priorities and reopens on the confirmed choice in both modes."
    verification:
      - kind: integration
        ref: test/extension/theme-tracer.test.js
        status: pass
      - kind: integration
        ref: test/extension/settings-queue.test.js
        status: pass
    human_judgment: false
  - id: D3
    description: "Versioned dependency order/inventory and numeric representation are explicit; historical baseline, permission/network and Chrome API contracts remain intact."
    verification:
      - kind: integration
        ref: test/extension/runtime-contract.test.js
        status: pass
      - kind: integration
        ref: test/extension/parity.test.js
        status: pass
      - kind: integration
        ref: test/extension/frozen-contract.test.js
        status: pass
    human_judgment: false
actuals:
  tokens: 18324
  tasks: 2
  commits: 3
commits: 3
plan_head_before: b7388405f9393a1929e17cd7f3a65ea0f5323983
duration: 18min
completed: 2026-10-08
status: complete
---

# Phase 8 Plan 1: Confirmed Theme Tracer Summary

**Classic and licensed Catppuccin choices persist through the real popup/worker queue and recolour existing priority cells via numeric root properties in both Zendesk modes.**

## Performance

- First recorded test start: 2026-10-08T13:55:51Z
- Completed: 2026-10-08T14:13:32Z
- Tasks: 2
- Files changed: 20 implementation/test/config files; this summary is separate.
- Actual tokens: 73,295 realized diff characters / 4, rounded up to 18,324; not harness usage. Three task commits measured from the persisted plan ledger before this summary commit.

## Accomplishments

- Added pure finite RGB/alpha emission, encoded-sRGB source-over, shared previews, WCAG contrast and original Oklab distance. No packages or runtime APIs were added.
- Bundled deeply frozen Classic and Catppuccin records, each with eight slots and complete priority mapping in both modes. Catppuccin has unchanged Latte/Mocha RGB, the complete MIT notice, pinned source/licence hashes and documented slot aliases/strength tuning.
- Connected initial settings and the existing guarded listener to twelve root custom properties. Initial dark properties precede the first priority stamp. The separate root observer uses only exact `data-theme="dark"`; other/missing values use the selected theme's light variant. Tests measure zero table-text reads and priority restamps on mode/theme changes.
- Added exact, popup-only `get-theme` reads under the worker deadline. Native radios display composited Light/Dark previews, checked selection and focus styling. Pending saves retain the confirmed choice, concurrent attempts are refused, failures have finite independent copy and uncertainty gets one bounded readback. The existing enable setting and Priority status stay independent.
- Effective Classic reselection preserves unreadable stored data and emits no storage event. Selecting Catppuccin and explicitly returning to Classic each writes the existing version-1 envelope once.

## Task Commits

1. Task 1 RED — `35f8864` — `test(08-01): prove missing popup-to-palette tracer`. One actual-source test failed on the missing packaged branded radio, an intentional assertion failure rather than a load error.
2. Task 1 GREEN — `b7bfe0e` — `feat(08-01): connect confirmed themes to both-mode priority paint`.
3. Task 2 — `09798c9` — `test(08-01): restate shared palette representation pins`. Explicit Why rationale records inventory, script order, generalized namespace, numeric representation, parity-control and mutation-literal changes.

The tracer feedback gate was rerun successfully after the production commit before proceeding with Task 2. No task commit deleted a tracked file.

## Verification

- Required Task 1 command: all five named suites executed; **206/206 passed** across tracer, colour, settings queue, pinned parity and frozen contracts.
- `npm --prefix . run typecheck`: **passed**, including both new shared modules, with no emit.
- Post-production tracer feedback rerun: **206/206 passed** and typecheck passed.
- Required Task 2 command: all nine named suites executed; **576/576 passed** across parity, frozen/runtime contracts, settings queue, toolbar/popup, recovery, preference outcomes, worker integrity and mutation registry.
- `node scripts/verify-mutation-kills.js --only settings-skip-unchanged`: **1/1 killed** by its original named behavioral guardian and `[mutant:settings-skip-unchanged]` assertion.
- All 119 parity tests, including the corrected non-vacuous negative controls, pass. Immutable baseline revision remains `6d3ab0b10e9419a5c1077e59e468977c00d59d4a`; `frozen-contract.test.js` was not modified.

Numerical minima over all three measured native states (original Oklab distance ×100):

| Palette/mode | Text contrast | Priority pair | Tint/untinted | Native transition |
|---|---:|---:|---:|---:|
| Classic light | 8.55213991 | 1.93536053 | 3.06081581 | 3.40709488 |
| Classic dark | 6.31359161 | 4.72941628 | 10.33193452 | 2.40821953 |
| Catppuccin light | 8.93128252 | 3.03746977 | 2.28760708 | 3.22202270 |
| Catppuccin dark | 6.74083482 | 3.21653005 | 3.50057946 | 3.33482405 |

Classic light uses only its exact immutable per-pair/state and per-priority/untinted floors, recalculated from pinned baseline bytes with the permitted 1e-6 tolerance. All other combinations use contrast ≥4.5, every pair ≥3, every tint/untinted ≥2 and both native transitions ≥2. The independent fixed RGB/Oklab/contrast vectors and duplicate-priority negative control pass.

Catppuccin light priority alphas are .10/.06/.18/.12; dark .14/.06/.14/.10. A deterministic .02 grid over .06–.40 tested unchanged source RGB against all state constraints and selected the lowest total passing alpha in iteration order. No slot remap, derived hue or CVD claim was needed. The other Classic slots are documented original Zhroma data.

Primary source custody was reverified read-only: Catppuccin commit `d09787dd98ca6fba08af5ef2ae94a7e09f17daca`, README SHA256 `6f5151cdd4fe3e94dac978a9b88444c888698af37ff8e654088cd043d33411b2`, LICENSE SHA256 `814096d2c34cc216c624738a49356f32b7237733b4f7edb0685f4e50ef5074ba`. Downloaded bytes stayed outside the repository.

## Decisions Made

- Numeric root properties carry palette changes; literal CSS fallbacks remain exact and selectors/native states remain unchanged.
- The theme-only unreadable-equality exception follows D-05, without altering other-key or CAS semantics.
- A saved acknowledgement establishes persistence only. Unknown writes may land later; one readback is a snapshot, not proof that a native in-flight write cannot subsequently settle.
- The immutable network scan rejects remote URL strings even in source comments. Bundled custody records identify the repository/commit/hash without loading or embedding protocol URLs.

## Deviations from Plan

### Auto-fixed blocking representation checks

**1. [Rule 3 — Blocking] Parity negative control targeted an overridden fallback.**
- Found during Task 1 verification: 118/119 parity tests passed; changing fallback alpha no longer changes paint because resolved root properties win.
- Updated undeclared `test/extension/parity.test.js` only to mutate the effective Classic registry alpha .14→.13. The unchanged behavioral oracle observes different cell backgrounds, with identical markers; pinned baseline bytes remain untouched.
- Orchestrator explicitly authorized this scope extension. Committed in the separate Task 2 test-only rationale commit `09798c9`.

**2. [Rule 3 — Blocking] Duplicate packaging/namespace pins and mutation source literal were stale.**
- Task 2's prescribed inherited run exposed four representation pins in undeclared `test/extension/toolbar-popup.test.js` and a stale no-op-guard literal in undeclared `test/mutants/settings-foundation.mutants.json`.
- Restated exact asset/load-order/namespace pins and the finite popup tag inventory, preserving source/permission/network/API guards and every load-bearing test name. RGB-call extraction now has a word boundary so `emitRgba` cannot falsely count as a raw `rgb` literal.
- Aligned the mutant find literal only; measured its original behavioral guardian killed before committing. Orchestrator explicitly authorized both scope extensions. Commit `09798c9`.

The actual-source popup loader now follows packaged HTML script order; content loader also injects the declared CSS and supports a pre-script paint-order probe. It uses happy-dom's native observer filtering rather than an additional broad observer double; root-only delivery and zero row reads/restamps are observed directly.

## Issues Encountered

- Strict checking needed an explicit RGB tuple construction and a captured narrowed colour API; both are annotation/representation fixes in Task 1.
- A golden composition vector differs by floating-point rounding (`224.61999999999998` versus `224.62`); comparison uses 10 decimal places. Acceptance floors were not lowered or repinned.
- Sandbox-limited downloads required an approved read-only network escalation; hashes matched. Normal commits ran hooks with approved `.git` access, without `--no-verify`.

## Known Stubs

None introduced in this plan. The pre-existing Phase 10 options-page stub remains unchanged and is outside this tracer's deliverables.

## Next Plan Readiness and Evidence Limits

- Shared colour/theme APIs, two accepted numerical palette records, persistent selection and inherited contracts are ready for catalog and lifecycle expansion.
- This is source-bound simulated integration and numerical evidence, not a flattened Chrome pixel oracle or new live Zendesk/human acceptance. Browser/native-state checks belong to the later Phase 8 plans; catalog and CVD capabilities are not complete here. Requirement IDs above identify this plan's assigned coverage, not a completed phase or independent human attestation.
- Phase 6 retains custody follow-up and six outstanding human-verification items. Its consumer `proceed` gate does not close those gaps. Phase 7's existing review dispositions and future CAS-key obligations remain unchanged.
- Shared STATE/ROADMAP/REQUIREMENTS updates are delegated to the orchestrator to preserve pre-existing edits. Unrelated `.DS_Store`, `.gsd/`, release walkthrough, custody closeout, research cache and shared planning-state files were neither modified nor committed by this executor.
- Full phase regression/mutation gates remain scheduled in 08-05; no global phase pass is claimed from the targeted runs here.

## Self-Check: PASSED

All four created implementation/test files exist; all twenty changed implementation/test/config paths are present. Commits `35f8864`, `b7bfe0e` and `09798c9` exist on `codex/phase08-themes`. The scoped stub/security scan found no unimplemented goal or new trust boundary beyond the plan's exact theme protocol and numeric property surface.
