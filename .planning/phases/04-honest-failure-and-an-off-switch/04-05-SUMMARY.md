---
phase: 04-honest-failure-and-an-off-switch
plan: "05"
subsystem: testing
tags: [acceptance-record, vitest, chrome-extension, sha256, workload-harness, uat]
provenance: reconstructed-from-commits
reconstructed_by: "04-11"
reconstructed_on: 2026-09-10

requires:
  - phase: 04-04
    provides: "The persisted off/on intent, the popup switch and the refresh-free apply path this plan measured and prepared for observation"
  - phase: 03-the-tint-survives-everything
    provides: "The inherited 2 ms / 16 ms timing budget, validateWorkloadReport, and the strict-acceptance validator shape this plan applied to Phase 4"
provides:
  - "test/extension/phase-04-live-acceptance.test.js — a strict current-source acceptance validator with a complete recursive eleven-asset binding"
  - "04-LIVE-ACCEPTANCE.md — sixteen stable check ids, an operation checklist, and one canonical JSON record whose disposition is computed"
  - "04-VALIDATION.md — the five-gate inventory and the four promotion rules"
  - "04-PERFORMANCE-SAMPLES.json and 04-PERFORMANCE.md — six-run final-source synthetic timing on the then-current bytes"
affects: [04-11, 04-12, 04-13, 04-14, 05 store submission]

actuals:
  tokens: null
  tasks: 3
  commits: 4
  note: "Not measured — this record was reconstructed after the fact by 04-11 and no execution telemetry survives. A fabricated number would be worse than an absent one."

tech-stack:
  added: []
  patterns:
    - "Recursive complete asset binding: hash every packaged file, not a representative three, so a changed worker or PNG cannot ride along under an unchanged content.js digest"
    - "Computed disposition: the record states a status and the validator recomputes it, so an asserted status that disagrees with the evidence is a test failure"
    - "Descriptor-less prohibitions are carried in the record as flagged-unverified rather than closed, and a green suite cannot dispose of them"

key-files:
  created:
    - test/extension/phase-04-live-acceptance.test.js
    - .planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-VALIDATION.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE.md
    - .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json
  modified: []

key-decisions:
  - "The asset inventory is recursive and complete — eleven files across two directories — rather than the flat three Phase 3 hashed"
  - "The three descriptor-less product prohibitions are carried in the canonical record as flagged-unverified; passed is unreachable while any is unresolved"
  - "Phase 3's real counts are read from Phase 3's own file at validation time, so Phase 4 cannot quietly restate a predecessor status nobody re-established"
  - "A pending check may carry no metadata at all; only an observed check may carry metadata, and only confirmed metadata"

patterns-established:
  - "Prepare-then-observe: an automated suite validates the SHAPE of an acceptance record and can never become the observation it is preparing for"
  - "Timing output is directed only at the current phase's samples file, and the runner refuses a mixed identity or an existing run key"

requirements-completed: []

coverage:
  - id: D1
    description: "A strict Phase 4 acceptance validator binds the record to the complete recursive eleven-asset extension/ inventory and rejects a forged pass, a missing or duplicated check, a duplicated JSON member, a mixed or stale hash set, a laundered prior-source status and synthetic evidence described as live"
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#rejects %s while passed is claimed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Sixteen stable live check ids exist with observable steps and expected results, all initialized pending, with the overall disposition computed as human_needed"
    verification:
      - kind: unit
        ref: "test/extension/phase-04-live-acceptance.test.js#the repository record binds to every current shipped byte and reports its actual status"
        status: pass
        note: "Passing against the then-current bytes. Re-established by 04-11 against the repaired bytes; see the closing note below."
    human_judgment: false
  - id: D3
    description: "Six-run final-source synthetic timing inside the inherited Phase 3 budget, with Phase 3's own records untouched"
    verification:
      - kind: integration
        ref: "node scripts/run-tint-workload.js --size {30,200,1000} --mode {enabled,disabled} --output …/04-PERFORMANCE-SAMPLES.json"
        status: pass
        note: "Superseded by 04-11's seven-run regeneration on repaired bytes; the original samples are preserved in history/2026-09-10-before-review-repair/."
    human_judgment: false
  - id: D4
    description: "The blocking human checkpoint at Task 3 was actually reached and executed against a live browser, rather than being self-awarded by a green suite"
    verification: []
    human_judgment: true
    rationale: "The checkpoint's whole content is a person looking at a browser. It was satisfied by the UAT session in 04-UAT.md, whose fourteen attested observations 04-11 subsequently preserved as history against the pre-repair revision."

duration: unknown
completed: 2026-09-10
status: complete
---

# Phase 04 Plan 05: Bind final-source evidence and reach blocking browser acceptance — Summary

**This is a completion record reconstructed from committed artifacts by plan 04-11 on
2026-09-10. It is not a first-hand execution report.** The executor that ran 04-05
halted at the plan's `autonomous: false` blocking human checkpoint (Task 3) without
writing a summary — the same pattern Phase 3's `03-04` produced — so no contemporaneous
account exists. Everything below is derived from the four commits the plan left behind,
from `04-VALIDATION.md` and `04-UAT.md`, and from the **preserved history copy** of
`04-LIVE-ACCEPTANCE.md` at
`history/2026-09-10-before-review-repair/04-LIVE-ACCEPTANCE.md` rather than from the
live file, which 04-11 rewrote. Where a fact could not be derived from a committed
artifact, it is recorded as unknown rather than estimated.

**What shipped: a strict, completely-bound Phase 4 acceptance validator, a sixteen-check
pending acceptance matrix, a five-gate validation inventory with four promotion rules,
and six-run final-source synthetic timing inside the inherited budget.**

## Provenance — the commits this record is derived from

| Commit | Subject | Task |
|---|---|---|
| `75bb8b6` | `test(04-05): add the failing current-source Phase 4 acceptance validator` | Task 1 (RED) |
| `1c60b91` | `test(04-05): escape the JSON tokenizer control-character range as source text` | Task 1 |
| `4678d17` | `docs(04-05): bind a complete pending Phase 4 acceptance matrix to current bytes` | Task 1 (GREEN) |
| `f86592e` | `docs(04-05): recheck timing and package boundaries on final Phase 4 source` | Task 2 |

Task 3 was a `checkpoint:human-verify` with `gate="blocking-human"`. It was satisfied by
the UAT session recorded in `04-UAT.md` and committed as:

| Commit | Subject |
|---|---|
| `d2fd80a` | `test(04): complete UAT - 50 passed, 0 issues, 3 blocked` |
| `3da98e9` | `docs(04): record 14 live observations and user ratifications from UAT` |
| `9a099d5` | `docs(04): formalize AR-04-01 FAIL-03 waiver and close WINDOWS entry 11` |

## Accomplishments

- **A strict current-source acceptance validator.** `test/extension/phase-04-live-acceptance.test.js`
  binds the record to the **complete recursive** `extension/` inventory — eleven files
  across two directories, including the service worker, the popup document and every
  PNG — so a changed worker or icon cannot ride along under an unchanged `content.js`
  digest. It parses exactly one canonical JSON record, rejects duplicate JSON members by
  tokenizing before `JSON.parse` can silently discard them, derives the recorded settings
  from `content.js` literals rather than accepting transcribed ones, and **computes** the
  disposition instead of reading it.
- **A sixteen-check pending acceptance matrix.** `04-LIVE-ACCEPTANCE.md` carries stable
  ids covering diagnosis and toolbar (`working-icon`, `blank-copy`, `missing-icon-hint`,
  `missing-settle-transition`, `language-icon-copy`, `structure-copy`), the off switch
  (`off-clears`, `on-restores`, `restart-off`, `restart-on`, `cross-tab-preference`,
  `frozen-resume`) and connection honesty and lifecycle (`nonreceiver-status`,
  `navigation-status`, `worker-restart`, `popup-keyboard`), each with observable steps,
  an expected result and the decisions it is evidence for.
- **Three descriptor-less prohibitions carried, not closed.** `no-agent-blame`,
  `re-enable-not-pressured` and `untested-is-not-consent` are held in the record as
  `flagged-unverified`, and `passed` is mechanically unreachable while any is unresolved.
- **Phase 3 stated, not restated.** The validator reads Phase 3's real counts from Phase
  3's own file at validation time — `human_needed`, eleven passes, nine pending, zero
  failures — so a later edit that quietly promotes the predecessor fails this phase's
  test rather than passing unnoticed.
- **Six-run final-source synthetic timing.** 3600 measured operations at sizes 30, 200
  and 1000 in both enabled and disabled mode, `timingStatus: passed`, with Phase 3's own
  records untouched.

## 04-05's four `must_haves.truths` — met or not

| # | Truth | Verdict |
|---|---|---|
| 1 | Every Phase 4 browser acceptance item is bound to every current shipped asset and retains pending status until observed. | **Met.** The recursive eleven-asset binding and the `live-source-evidence` gate make a pending check with metadata unrepresentable. |
| 2 | Automated behavior, browser timing, independent review/security and human acceptance remain separate verdicts. | **Met.** `04-VALIDATION.md` keeps five gates in five fields; only the first two were awarded, and the overall verdict stayed `human_needed`. |
| 3 | Execution reaches a blocking human checkpoint for all sixteen current-source Phase 4 observations; deferred or failed observations block human acceptance. | **Met, with two deferrals.** The checkpoint was reached and executed as the `04-UAT.md` session: fourteen observed and attested, two deferred (`language-icon-copy`, `structure-copy`) and held `pending` under `limitations.unavailable_scenarios`. The record's disposition stayed `human_needed`, which is exactly what a deferral is supposed to produce. |
| 4 | Current-source synthetic workload satisfies inherited timing budgets without overwriting Phase 3 history. | **Met.** Worst 30-row median 1.300 ms against a 2 ms ceiling, worst enabled batch 13.900 ms against a 16 ms ceiling, `--output` directed only at this phase's file. |

## The three prohibition judgments it carried as unresolved

All three came from `projectProhibitions` with no fabricated `check_kind`, `check_target`,
`check_rule` or fixtures, and all three left 04-05 unresolved:

| id | Statement | Why automation cannot close it |
|---|---|---|
| `no-agent-blame` | The diagnosis must not blame an agent or imply they caused an unsupported or malformed view. | Tests prove the copy is finite, fixed and branched on actual evidence. Whether it reads as help or as accusation is a judgment about a reader. |
| `re-enable-not-pressured` | The off switch must not pressure the agent to re-enable tinting or imply that off is an error. | Absence of felt pressure is not a machine-checkable property. |
| `untested-is-not-consent` | Untested browser behavior must not be presented as observed acceptance or consent. | The validator enforces the mechanical half. The remaining half is how the record is read and reported. |

The user ratified all three at the checkpoint (`04-UAT.md` tests 18–20). Their `status`
fields were deliberately **not** promoted: the validator asserts the repository record
carries all three as `flagged-unverified` as a guard against an executor self-ratifying
them, and relaxing that guard is a user decision rather than a side effect of running
UAT. Each ratification is recorded in its `disposition` text instead.

## What this plan did not establish

- **FAIL-03 has no live evidence.** Its only two live checks were both deferred and both
  stayed `pending`. The user waived them on 2026-09-10 as accepted residual risk
  **AR-04-01** (`04-RISK-ACCEPTANCE.md`). A waiver permits progression; it is not an
  observation and it cannot promote the record.
- **Layout and retainer attribution were not taken.** No `--profile` run was executed,
  so they are recorded as *not-taken*, never as zero. Phase 3's manual profiling remains
  deferred at the user's request.
- **Independent code review, the ASVS level 1 security verdict and phase goal
  verification** all remained `not-performed`. None is self-awardable.

## Issues Encountered

The JSON tokenizer in the validator initially embedded a literal control-character range;
`1c60b91` escaped it as source text. No other issue is recoverable from the committed
artifacts.

## Deviations from Plan

Not recoverable. No contemporaneous deviation log was written, and a deviation list
inferred from a diff would be a guess presented as a record. What **is** certain from the
plan's own shape is that the executor stopped at the Task 3 blocking checkpoint rather
than completing the plan — which is the plan working as designed, not a deviation.

## Live observations claimed by this summary

**None.** Every live observation belonging to Phase 4 was recorded by the `04-UAT.md`
session and, on 2026-09-10, preserved by plan 04-11 at
`history/2026-09-10-before-review-repair/04-LIVE-ACCEPTANCE.md`. This document asserts no
observation of its own and does not restate AR-04-01 as evidence.

## Closing note — this describes 04-05, not the current record

The independent code review (`04-REVIEW.md`) subsequently found CR-01, WR-04, WR-07 and
WR-08. Repairing them changed four of the eleven shipped assets — `content.js`,
`zhroma.css`, `background.js` and `popup.js` — which under `04-VALIDATION.md` promotion
rule 3 invalidated the binding this plan established. Plan 04-11 therefore
**re-established** 04-05's acceptance and timing artifacts against the repaired bytes:
seventeen checks, all `pending`, zero live evidence, and fresh seven-run timing samples.

So this summary describes **what 04-05 delivered**, against the bytes that shipped when it
ran. It is not a description of the current state of the acceptance record. For that, read
`04-LIVE-ACCEPTANCE.md` and `04-11-SUMMARY.md`.

---
*Phase: 04-honest-failure-and-an-off-switch*
*Plan 05 — record reconstructed by 04-11 on 2026-09-10*
