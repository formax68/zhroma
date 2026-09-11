---
phase: 04-honest-failure-and-an-off-switch
plan: "18"
subsystem: mutation-verification
tags: [vitest, mutation-testing, tdd, filesystem-containment, regression-gates]
status: complete
completed: 2026-09-11
duration: 19min
duration_basis: First verified RED commit through task closeout; context loading excluded
requires:
  - phase: 04-16
    provides: Integrated preference/lifecycle runtime and historical assertion targets
  - phase: 04-17
    provides: Malformed-English diagnosis and browser-qualified selector contract
provides:
  - Fail-closed mutation adjudication with clean-copy baseline and exact named assertion evidence
  - Default-discovered registry source/suite/metadata drift checks
  - Measured inventory of 23 retained historical and 10 new behavioral counterexamples
affects: [04-19, 04-20]
tech-stack:
  added: []
  patterns: [structured Vitest JSON adjudication, unhandled-error sidecar, disposable-source mutation runs]
key-files:
  created:
    - test/extension/mutation-gate.test.js
    - test/extension/mutation-registry.test.js
    - test/mutants/preference-outcome.mutants.json
    - test/mutants/locale-honesty.mutants.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-18-MEASUREMENTS.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-18-TASK1-RED.json
    - .planning/phases/04-honest-failure-and-an-off-switch/04-18-TASK3-RED.json
  modified:
    - scripts/verify-mutation-kills.js
    - test/extension/failure-seam.test.js
    - test/extension/toolbar-popup.test.js
    - test/extension/preference-outcome.test.js
    - test/extension/runtime-contract.test.js
    - test/mutants/failure-seam.mutants.json
    - test/mutants/popup-recovery.mutants.json
    - test/mutants/worker-boundary.mutants.json
    - test/mutants/worker-staleness.mutants.json
    - test/mutants/worker-lifecycle.mutants.json
key-decisions:
  - A failed child process earns no kill without an executed named intended assertion after a green disposable baseline
  - Retire two measured redundant historical sites without counting their survival as kills
  - Keep joint mechanism coverage distinct from claims about each redundant guard
  - Preserve pending requirement and source-bound human acceptance states
requirements-completed: []
requirements-addressed: [CTRL-02, CTRL-03, CTRL-04, FAIL-01, FAIL-03, FAIL-05]
verification_status: retained-mutation-gate-passed-independent-review-pending
plan_head_before: 84d64766b07fbb62dcbf6800293615a606825a33
actuals:
  tokens: 55319
  tasks: 3
  commits: 5
  basis: ceil(221273 realized diff characters / 4), including raw measurement evidence; commits measured before summary metadata commit
coverage:
  - id: D1
    description: Mutation runner rejects false-green process, report, baseline, path and identity cases
    verification:
      - kind: integration
        ref: test/extension/mutation-gate.test.js
        status: pass
    human_judgment: false
  - id: D2
    description: Default registry checks every retained source literal and declared target
    verification:
      - kind: unit
        ref: test/extension/mutation-registry.test.js
        status: pass
    human_judgment: false
  - id: D3
    description: Historical and new behavioral mutations have exact intended failure evidence
    verification:
      - kind: integration
        ref: npm --prefix . run test:mutants; 04-18-MEASUREMENTS.json
        status: pass
    human_judgment: false
---

# Phase 4 Plan 18: Honest mutation evidence Summary

**A clean-copy Vitest baseline and exact assertion evidence now gate 33 retained behavioral mutation kills, with two redundant historical sites explicitly superseded.**

All three tasks are complete. This developer-tool result does not complete Phase 4 acceptance: all seven requirement states remain pending/gaps, Phase 3 remains `human_needed`, and independent review plus final source binding remain 04-19/04-20 work.

## Task commits and execution order

| Task | Commit | Result |
|---|---|---|
| 1 RED | 1bb57cd | Real nonexistent-suite fixture reproduced false `1/1 killed`, runner exit 0 |
| 1 GREEN | dc9857e | Structured adjudication; 32 initial controls passed; tracer rerun passed |
| 3 RED | c7700a1 | Required outcome IDs absent; undeclared test name wrongly accepted |
| 2 | 99c0822 | 25 historical IDs measured individually; 23 retained and two explicitly superseded |
| 3 GREEN | 40816db | Default registry guard, ten new counterexamples, scoped oracle repairs, complete measurement artifact |

Task 3 RED preparation ran while Task 2's independent disposable measurements were in flight. Neither GREEN implementation preceded its own verified RED. No packages, remote publication, worktree changes, or shipped extension edits occurred. Shared STATE/ROADMAP/REQUIREMENTS bookkeeping is owned by the parent orchestrator.

## Verification

- Installed Vitest 4.1.11 JSON reporter interfaces and `onTestRunEnd` signature were inspected locally. A real reporter process established `fullName`, suite path, statuses and assertion failure messages.
- Initial actual-source target baseline: **399/399** across seven suites. After scoped oracle work: **323/323** across failure-seam, toolbar-popup, preference-outcome and runtime-contract.
- Final focused runner plus default registry tests: **43/43**. Controls include real green/intended-red and equivalent-green mutation processes, real missing-suite, parse/import failures, copy-specific baseline failure, unrelated assertion failure, declared-but-unexecuted test identity, and injected malformed/empty reports, skips, unhandled errors, signal, timeout and spawn failure.
- Full `npm --prefix . run test:mutants`: **33/33 KILLED, exit 0**, zero retained survivors and zero retained gate errors.
- Every retained ID also ran through `node scripts/verify-mutation-kills.js --only ID` with exit 0. Initial errors/survivors and later remeasurements are preserved.
- `npm test`: **65/65 Node smoke checks; 902 passed and one failed of 903 Vitest tests**, exit 1. The sole failure is `phase-04-live-acceptance.test.js > the repository record binds to every current shipped byte and reports its actual status`, caused by the already-known Phase 4 source-binding mismatch. This run preceded the final two additional runner control tests; those two subsequently passed in the 43-test focused run. Do not infer a later full-suite count.
- `git diff --check` passed; no shipped extension diff and no tracked file deletion. No new skipped tests, stubs or unrun plan verification remain.

The default `npm test` wildcard discovers `mutation-registry.test.js` without changing package.json or vitest.config.js. Its cheap conservative declaration check is not proof of runtime test execution: exact reporter identity is established only by the clean baseline.

## Runner contract and trust boundaries

Registry validation requires nonempty arrays, unique bounded IDs, nonempty find literals, positive counts, replacement differences, exact expected_failure metadata, existing canonical source/suite paths, declared test names and assertion markers. Traversal, absolute paths, linked dependency/Git targets, and source/suite symlinks are refused before any mutation write.

Each invocation executes the selected suite union unmutated inside its disposable configuration before awarding any kill. Each mutant then runs its exact declared test name in a fresh copy. The JSON reporter and a generated `onTestRunEnd` sidecar independently establish assertions and absence of unhandled runner errors. Missing, duplicate, skipped or unloaded target tests; inconsistent counts; failed baselines; signals; timeouts; unreadable reports; non-assertion errors; and unrelated additional failures are rejected. A stable marker must occur on the first AssertionError message line, never merely somewhere in a stack.

Target filtering is explicit: these are selected behavioral counterexamples, not a claim that every suite remains green under each mutation. Full clean selected suites run at baseline; any additional failed assertion present in a mutated run is rejected unless declared. No acceptance byte pin, default registry test or runner test is an extension mutant target.

Scratch trees are removed in finally. The real .git and node_modules targets are symlinked and not removed. The filesystem and child-process surfaces were already included in threats T-04G3-14 through T-04G3-17; no new shipped trust boundary was introduced.

## Historical 25: measured initial and final dispositions

| ID | Initial individual result | Final disposition |
|---|---|---|
| worker-lasterror | KILLED | KILLED individually and in final full run |
| content-lasterror | KILLED | KILLED individually and in final full run |
| worker-status-unbounded | KILLED | KILLED individually and in final full run |
| worker-apply-unbounded | GATE_ERROR | KILLED individually and in final full run |
| worker-status-frameid | KILLED | KILLED individually and in final full run |
| worker-apply-frameid | KILLED | KILLED individually and in final full run |
| popup-ask-unbounded | KILLED | KILLED individually and in final full run |
| popup-no-revert | KILLED | KILLED individually and in final full run |
| popup-stays-disabled | KILLED | KILLED individually and in final full run |
| popup-focus-guard | KILLED | KILLED individually and in final full run |
| request-id-echo | KILLED | KILLED individually and in final full run |
| status-reply-gate | KILLED | KILLED individually and in final full run |
| diagnosis-pairing | KILLED | KILLED individually and in final full run |
| popup-valid-gate | KILLED | KILLED individually and in final full run |
| popup-copy-fallback | SURVIVED | Superseded redundant site; not a kill |
| preference-serialization | KILLED | KILLED individually and in final full run |
| tabs-onremoved-listener | KILLED | KILLED individually and in final full run |
| tabs-onremoved-delete | KILLED | KILLED individually and in final full run |
| project-guard-after-status | GATE_ERROR | KILLED individually and in final full run |
| project-guard-after-preference | SURVIVED | Superseded redundant site; not a kill |
| apply-action-guard | KILLED | KILLED individually and in final full run |
| popup-status-guard | GATE_ERROR | KILLED individually and in final full run |
| project-queue | GATE_ERROR | KILLED individually and in final full run |
| generation-counter | KILLED | KILLED individually and in final full run |
| status-catch-reports-unavailable | KILLED | KILLED individually and in final full run |

The initial historical run produced **19 KILLED, 2 SURVIVED and 4 GATE_ERROR**. The four gate errors were correct rejections of mismatched attribution, not kills:

- `worker-apply-unbounded`: the outer 4000 ms operation deadline now answers even without the 2000 ms hop bound. The original “reply exists” marker no longer discriminates. Moved its label to the existing hop-timing assertion `elapsed < bound() * 2`; remeasurement failed at 4004 ms versus <4000, and the full run at 4003 ms. The narrower hop-budget property is proven; the removed claim that the whole worker would never answer is not retained.
- `project-guard-after-status`: the first pending-read count still matched; after one flush, the removed guard dispatched a stale extra read. Moved the marker to the existing zero-pending-read assertion after that flush. Remeasurement: expected 1 to be 0.
- `popup-status-guard`: the copy assertion failed before the checkbox assertion. Moved the label to the existing ratified connection-copy assertion. Remeasurement: unknown-setting copy instead of no-readable-view copy; confirmed preference remains asserted afterward.
- `project-queue`: the already-named no-stale-artwork assertion fired before the final-icon assertion. The shared joint assertion now carries both distinct generation-counter and project-queue markers. Neither the expected outcome nor assertion order was weakened.

### Explicit supersessions and mechanism limits

- **popup-copy-fallback — measured SURVIVED.** Exact status/reason pair validation prevents the fallback from becoming an independently observable behavior. Removed from retained registry; `popup-valid-gate` proves malformed worker replies are refused. This is not a kill and not an implementation repair.
- **project-guard-after-preference — measured SURVIVED.** The downstream applyAction and native ownership/generation guards prevent stale painting even without that intermediate recheck. Removed from retained registry; `generation-counter` plus `apply-action-guard` fence the full observable mechanism. The redundant clause remains in runtime; no individual-guard kill is claimed.
- WINDOWS20/21 remain mechanism-level limitations. The obsolete promise-chain preference rejection branch was removed by 04-16; `preference-serialization` retains its stable ID and now removes the active native writer guard to reproduce two writes in flight.
- Closed-tab listener/delete IDs now fail live worker Map-retention assertions (2 versus 1 and 3 versus 2), not source-shape registration/body checks. Both retained entries are behavioral. No source-shape kill is counted as runtime behavior.
- **pending-reopen-certainty** initially SURVIVED removal of its single read mask because final reply masking independently enforced uncertainty. Its retained mutation removes the pending-write masking mechanism throughout popupStatus; it fails the fresh popup's mixed-checkbox assertion. Individual redundant masking guards are not claimed killed.
- **expired-request-dispatch** removes the two jointly redundant parts of expired-job exclusion (dequeue and dispatch refusal). The joint queue test observes 32 writes instead of only the original one. This is mechanism coverage, not proof that either redundant clause fails alone.
- **popup-stale-refresh** tests the refresh/change admission exclusion, which prevents overlapping ownership; its target also verifies delayed old response recovery. The owner-counter checks behind Promise.race are not advertised as independently killed.

## Final measured inventory

All following entries are `kind: behavioral`, each individually KILLED and again KILLED in the complete 33-entry gate. Suite paths below are relative to `test/extension/`. Exact metadata, find/replace text, initial attempts, remeasurements, full stdout, source hashes and default-suite output live in **04-18-MEASUREMENTS.json**.

| ID | Suite | Exact full test name | Assertion marker | Full-run observed first failure line |
|---|---|---|---|---|
| worker-lasterror | failure-seam.test.js | a read that fails while still delivering values leaves the worker preference unconfirmed | `[mutant:worker-lasterror]` | AssertionError: [mutant:worker-lasterror]: expected true to be null // Object.is equality |
| content-lasterror | failure-seam.test.js | a read that fails while still delivering values leaves the content script dormant | `[mutant:content-lasterror]` | AssertionError: [mutant:content-lasterror]: expected [ 'Urgent', 'High', 'Normal', 'Low' ] to deeply equal [] |
| worker-status-unbounded | failure-seam.test.js | a top frame that never answers get-status is unavailable for that tab alone | `[mutant:worker-status-unbounded]` | AssertionError: [mutant:worker-status-unbounded]: expected null not to be null |
| worker-apply-unbounded | failure-seam.test.js | a top frame that never answers apply-preference costs one bounded wait, not the off switch | `[mutant:worker-apply-unbounded]` | AssertionError: [mutant:worker-apply-unbounded]: expected 4003 to be less than 4000 |
| worker-status-frameid | failure-seam.test.js | a top frame that never answers get-status is unavailable for that tab alone | `[mutant:worker-status-frameid]` | AssertionError: [mutant:worker-status-frameid]: expected [ …(3) ] to deeply equal [] |
| worker-apply-frameid | failure-seam.test.js | a top frame that never answers apply-preference costs one bounded wait, not the off switch | `[mutant:worker-apply-frameid]` | AssertionError: [mutant:worker-apply-frameid]: expected [ Array(1) ] to deeply equal [] |
| malformed-english-blame | diagnosis.test.js | malformed English shell: underscore English reports structure across content, worker and popup | `[locale:malformed-english-reason]` | AssertionError: [locale:malformed-english-reason] underscore English: expected 'This interface language is not suppor…' to be 'Zhroma cannot read this view\'s ticke…' // Object.is equality |
| selector-family-regression | runtime-contract.test.js | happy-dom secondary model: four CSS rules map exact labels to alpha backgrounds and only direct ticket cells | `[locale:actual-selector-family]` | AssertionError: [locale:actual-selector-family]: expected [] to deeply equal [ Array(16) ] |
| popup-ask-unbounded | popup-recovery.test.js | a worker that never answers set-enabled costs one bounded wait and the ratified line | `[mutant:popup-ask-unbounded]` | AssertionError: [mutant:popup-ask-unbounded]: expected null not to be null |
| popup-no-revert | popup-recovery.test.js | a reply reporting the save failed returns the switch to the value storage still holds | `[mutant:popup-no-revert]` | AssertionError: [mutant:popup-no-revert]: expected false to be true // Object.is equality |
| popup-stays-disabled | popup-recovery.test.js | a reply reporting the save failed returns the switch to the value storage still holds | `[mutant:popup-stays-disabled]` | AssertionError: [mutant:popup-stays-disabled]: expected true to be false // Object.is equality |
| popup-focus-guard | popup-recovery.test.js | a keyboard agent gets the switch back after a failed save | `[mutant:popup-focus-guard]` | AssertionError: [mutant:popup-focus-guard]: expected HTMLBodyElement{ …(49) } to be HTMLInputElement{ …(2), …(58) } // Object.is equality |
| confirmed-write-revert | preference-outcome.test.js | joint table true write=immediate read=rejected apply=success | `[outcome:confirmed-write-checkbox]` | AssertionError: [outcome:confirmed-write-checkbox]: expected true to be false // Object.is equality |
| write-timeout-as-failure | preference-outcome.test.js | native deferred from true remains unknown through expiry and fresh recovery | `[outcome:false-timeout-failure]` | AssertionError: [outcome:false-timeout-failure]: expected false to be null // Object.is equality |
| timeout-releases-writer | preference-outcome.test.js | a fresh request after observation expiry cannot overlap the still-issued native write | `[outcome:post-timeout-write-exclusion]` | AssertionError: [outcome:post-timeout-write-exclusion]: expected 2 to be 1 // Object.is equality |
| expired-request-dispatch | preference-outcome.test.js | admission overflow in an opposite popup never confirms an obsolete position | `[outcome:expired-request-dispatch]` | AssertionError: [outcome:expired-request-dispatch]: expected [ { enabled: false }, …(31) ] to deeply equal [ { enabled: false } ] |
| popup-stale-refresh | preference-outcome.test.js | opening refresh excludes changes and captured late reply cannot overwrite fresh recovery | `[outcome:opening-refresh-excludes-change]` | AssertionError: [outcome:opening-refresh-excludes-change]: expected [ { enabled: false } ] to deeply equal [] |
| whole-request-deadline | preference-outcome.test.js | sequential waits spend one arrival budget rather than renewing every hop | `[outcome:sequential-budget]` | AssertionError: [outcome:sequential-budget]: expected undefined to be defined |
| pending-reopen-certainty | preference-outcome.test.js | native callback-held from true remains unknown through expiry and fresh recovery | `[outcome:pending-reopen-mixed]` | AssertionError: [outcome:pending-reopen-mixed]: expected false to be true // Object.is equality |
| late-action-reconciliation | toolbar-popup.test.js | late native icon preserves exclusion and reconciles newest projection | `[outcome:late-native-reconciled]` | AssertionError: [outcome:late-native-reconciled] icon: expected { icon: 'icons/working.png', …(1) } to deeply equal { icon: 'icons/neutral.png', …(1) } |
| request-id-echo | worker-integrity.test.js | an apply reply carrying a request id that is not the one minted is not an outcome, and the popup says so | `[mutant:request-id-echo]` | AssertionError: [mutant:request-id-echo]: expected 'Tinting is off' to be 'No readable view is connected' // Object.is equality |
| status-reply-gate | worker-integrity.test.js | a status reply carrying an extra member beyond the four the gate names is refused, and the tab reports the connection fact | `[mutant:status-reply-gate]` | AssertionError: [mutant:status-reply-gate]: expected { icon: 'icons/working.png', …(1) } to deeply equal { icon: 'icons/neutral.png', …(1) } |
| diagnosis-pairing | worker-integrity.test.js | an unpaired combination leaves a clean fallback, never a half-written toolbar | `[mutant:diagnosis-pairing]` | AssertionError: [mutant:diagnosis-pairing]: expected { icon: 'icons/missing.png', …(1) } to deeply equal { icon: 'icons/neutral.png', …(1) } |
| popup-valid-gate | worker-integrity.test.js | a set-enabled reply carrying an out-of-set status is refused, and the popup claims nothing | `[mutant:popup-valid-gate]` | AssertionError: [mutant:popup-valid-gate]: expected 'No readable view is connected' to be 'Zhroma could not confirm that setting' // Object.is equality |
| preference-serialization | toolbar-popup.test.js | two popups asking for opposite values are serialized, and neither inverts the other | `[mutant:preference-serialization]` | AssertionError: [mutant:preference-serialization] 2 preference writes in flight at once: expected 2 to be less than 2 |
| tabs-onremoved-listener | toolbar-popup.test.js | closure during held icon releases entries and forbids stale follow-on paint | `[mutant:tabs-onremoved-listener]` | AssertionError: [mutant:tabs-onremoved-listener]: expected 2 to be 1 // Object.is equality |
| tabs-onremoved-delete | toolbar-popup.test.js | repeated create-close cycles and reused ids cannot retain or resurrect a dead tab | `[mutant:tabs-onremoved-delete]` | AssertionError: [mutant:tabs-onremoved-delete]: expected 3 to be 2 // Object.is equality |
| project-guard-after-status | toolbar-popup.test.js | a superseded status reply is discarded before the preference is ever read | `[mutant:project-guard-after-status]` | AssertionError: [mutant:project-guard-after-status]: expected 1 to be +0 // Object.is equality |
| apply-action-guard | toolbar-popup.test.js | a generation bump between the icon and the title write stops the superseded title | `[mutant:apply-action-guard]` | AssertionError: [mutant:apply-action-guard]: expected [ { tabId: 7, …(1) } ] to deeply equal [] |
| popup-status-guard | toolbar-popup.test.js | a superseded popup projection reports the connection line and still shows the confirmed preference | `[mutant:popup-status-guard]` | AssertionError: [mutant:popup-status-guard]: expected 'Zhroma could not confirm that setting' to be 'No readable view is connected' // Object.is equality |
| project-queue | toolbar-popup.test.js | a slow earlier reply cannot repaint over a newer projection | `[mutant:project-queue]` | AssertionError: [mutant:generation-counter] [mutant:project-queue]: expected [ { tabId: 7, …(1) }, …(1) ] to deeply equal [] |
| generation-counter | toolbar-popup.test.js | a slow earlier reply cannot repaint over a newer projection | `[mutant:generation-counter]` | AssertionError: [mutant:generation-counter] [mutant:project-queue]: expected [ { tabId: 7, …(1) }, …(1) ] to deeply equal [] |
| status-catch-reports-unavailable | toolbar-popup.test.js | no receiver reads as unavailable and never as a diagnosis about the view | `[mutant:status-catch-reports-unavailable]` | AssertionError: [mutant:status-catch-reports-unavailable]: expected { icon: 'icons/working.png', …(1) } to deeply equal { icon: 'icons/neutral.png', …(1) } |

`selector-family-regression` changes the actual paint family from English to French across all four CSS heads; it does not remove the optional i flag. Its behavioral observation is the **secondary happy-dom selector model** losing English direct-cell matches. This is not a mutation run in Chrome. 04-17's separately recorded real Chrome 16/16 rendering observations retain their own scope and provenance.

## Scoped plan adjustments

1. **[Rule 3 — blocking prerequisite attribution]** Completed already-authorized 04-16 historical marker discrimination at the four sites above. No expected outcome was changed. Added the stable late-native-reconciliation marker for its exact generated test identity. Files: failure-seam.test.js, toolbar-popup.test.js; commit 99c0822.
2. **[Rule 2 — missing critical counterexample]** Added the independently fresh request after observation expiry while the original native write remains issued. Existing tests had queued requests expiring before they could expose premature release. The new case observes two physical writes under the release mutation and one on real source. File: preference-outcome.test.js; commit 40816db.
3. **[Rule 3 — assertion attribution]** Added explicit response existence before dereferencing the sequential-budget result, so a missed deadline is a named assertion failure rather than a TypeError; added the actual CSS match marker to the existing secondary-model assertion. Files: preference-outcome.test.js, runtime-contract.test.js; commit 40816db.
4. Prepared Task 3 RED during slow Task 2 measurement to use independent waiting time. Its implementation was still authorized only after its own RED_EVIDENCE_OK.

## TDD Gate Compliance

- Task 1 record: **04-18-TASK1-RED.json**, verdict `RED_EVIDENCE_OK`; the exact missing-suite assertion failed on false runner exit 0. An earlier import experiment caused a URL/load error and was discarded as invalid RED before any implementation.
- Task 3 record: **04-18-TASK3-RED.json**, verdict `RED_EVIDENCE_OK`; missing outcome IDs and acceptance of undeclared test names failed on intended assertions.
- RED commits preceded each corresponding GREEN commit. No separate refactor commit was necessary.

## Review handoff and remaining gates

04-19 can review the runner, all 33 named behavioral failures, the two superseded historical survivors, scoped oracle adjustments, and explicit model boundaries from the preserved JSON artifact. 04-20 owns final source/performance binding and authentic human observations. Existing ACK-04-01 and AR-04-01 remain separate; neither has been promoted by automated success. No live acceptance file, requirement checkbox, Phase 3 result, STATE.md or ROADMAP.md was changed by this executor.

No open implementation blocker remains in this plan. Independent review and the known acceptance-binding failure remain explicit downstream gates.

## Self-Check: PASSED

All created artifacts exist, all five task commits resolve, the measured 33-result inventory matches the retained registry, and git diff --check passes. Shipped extension files are unchanged by this plan. Shared bookkeeping is reserved for the parent orchestrator.
