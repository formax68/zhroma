# Phase 04 gap-plan check — 04-15 through 04-20

## VERIFICATION PASSED

**Reviewed:** 2026-09-11
**Reviewer:** independent `gap_checker` agent, not the planner
**Scope:** six new gap-closure plans, 16 tasks, and `04-GAP-CLOSURE-COVERAGE.md`
**Remaining issues:** 0 blockers, 0 warnings, 0 info

This is pre-execution plan verification. It does not certify the current implementation, mark a requirement complete, supply a security verdict, or replace human acceptance. Phase 04's current `gaps_found` remains valid until execution produces new evidence. Phase 03's separate `human_needed` is preserved.

The plans address the underlying failure pattern: they specify a joint outcome oracle, separate response deadlines from native side-effect lifetime, test the mutation gate's own failure modes, and place independent integrated review before renewed source binding and UAT. No plan can guarantee that execution or review will discover no further defect; the local repair loop is bounded and cannot turn exhaustion into a pass.

## Goal and requirement coverage

The ROADMAP user story requires trustworthy visible status and control without uninstalling. Its four original success criteria remain authoritative: distinguish working/missing states and hint, avoid false missing claims for unsupported language, clear/restore tint through the switch, and persist either preference through a real browser restart.

| Requirement | Executable coverage in this set | Evidence boundary |
|---|---|---|
| FAIL-01 | 17.1–2 locale/diagnosis controls; 19 independent review; 20 visual checks | Synthetic rendering is not live tenant observation |
| FAIL-02 | 17.1 retains missing-column certainty/blank distinction; 19 direct review; 20 missing/settle walkthrough | Real mount timing remains a human evidence item |
| FAIL-03 | 17.1 all four malformed English examples and genuine non-English controls; 17.2 Chrome matrix; 19/20 | AR-04-01's two waived scenarios stay pending |
| FAIL-05 | 16.3 event projection recovery, action ownership and tab lifecycle; 17/19/20 | Icon recognizability still needs the user |
| CTRL-02 | 15 confirmed-write fix and decision; 16 full transaction/consumer matrix; 18 sensitivity; 19/20 | Unknown presentation requires the explicit 15 checkpoint |
| CTRL-03 | 16 write exclusion, expiry, reopen and faithful worker epochs; 19/20 | VM recreation does not prove actual browser restart |
| CTRL-04 | 15/16 joint storage, checkbox, copy, markers and application assertions; 19/20 | Marker assertions do not substitute for visual cleanup |

All seven ROADMAP IDs occur in new-plan `requirements` frontmatter and have concrete tasks. Relevant PROJECT requirements are retained: honest popup-only missing-column hint, English current Agent Workspace boundary, privacy, zero configuration, and no scope expansion into publication or Phase 03's live backlog. The supplied decision-coverage result is 11/11; actions and the ledger preserve D-01 through D-11, including recorded later English-family interpretation and existing product ratifications.

## Plan structure, dependencies and sizing

| Plan | Tasks | Files | Wave | Depends on | Estimate / budget |
|---|---:|---:|---:|---|---:|
| 04-15 | 2 | 6 | 13 | executed 04-14 | 26,000 / 100,000 |
| 04-16 | 3 | 10 | 14 | 04-15 | 38,000 / 100,000 |
| 04-17 | 2 | 5 | 13 | executed 04-14 | 24,000 / 100,000 |
| 04-18 | 3 | 10 | 15 | 04-16, 04-17 | 31,000 / 100,000 |
| 04-19 | 3 | 4 initially | 16 | 04-18 | 34,000 / 100,000 |
| 04-20 | 3 | 11 | 17 | 04-19 | 32,000 / 100,000 |

Installed `query verify.plan-structure` returned valid, zero errors and zero warnings for all six plans. Every task has files, action, verify and done; tracer and checkpoint types are recognized by the installed validator. The dependency graph is acyclic. The sole same-wave pair, 15/17, has disjoint write ownership and no specific undeclared shared mutable prerequisite. Subsequent shared runtime, harness, test and registry work is ordered.

The 10/11-file totals were reviewed as sizing risk indicators rather than automatic proof of context exhaustion. Plan 16's sequential task surfaces are 4/5/5 files with substantial reuse around one transaction contract; Plan 18's are 2/5/3, including five existing registry JSON files totaling 240 lines. Plan 20 modifies one test suite and evidence/status documents in 5/3/5-file tasks. No task requires a ten-file implementation change. Plan 19 must name each concrete repair packet and its at-most-five-file ownership before editing; cumulative growth triggers local re-slicing and updated dependencies. There is no demonstrated context-budget violation requiring an artificial split.

All six `estimate-check --calibrated` calls returned `over_budget:false`. **These estimates are not project-calibrated:** confidence is low, sample_count is zero, factor is one and calibration_applied is false. The task/file assessment remains necessary; the estimates are not measured execution cost.

## Contract and evidence checks

- **Transaction truth:** acknowledged write, readable preference, application acknowledgement and connection evidence remain separate. Both directions are required. A fresh returned boolean takes precedence; otherwise acknowledged desired value survives a failed read. Unknown write/transport outcome cannot become a definite failed save. The ledger now agrees with Plans 15/16 on these rules and on application-copy precedence.
- **Whole-operation bounds:** request deadlines begin at admission, include queue time and each awaited stage, and reject overload/expired work without delayed dispatch. Native writes remain excluded until physical settlement. Independent event-triggered projections receive their own budget, so an abandonable old read cannot wedge later healthy toolbar work.
- **Late effects and lifetimes:** physical action serialization survives caller expiry; current-state reconciliation follows settlement. Worker recreation preserves issued native effects while suppressing dead JavaScript callbacks, timers and new API dispatch. Neither mechanism claims durable cross-worker transaction isolation under the one-boolean constraint.
- **Protocol consumers and privacy:** nullable `saved` is coordinated with exact popup and legacy test consumers. Invalid sender/frame/id/pair/type/extra-field checks remain required. No package, permission, persistent key, network call or page diagnostic is added.
- **Mutation assurance:** Plan 18 requires a green disposable baseline, actual named target execution, exact intended assertion evidence and explicit rejection of load/parse/spawn/timeout/signal/empty-report/unrelated-failure cases. Default discovery checks registry drift. Behavioral, source-shape and redundant-mechanism evidence remain distinct.
- **Review sequence:** Plan 19 requires independent whole-source code/security review, direct counterexamples, concrete bounded repairs and independent rechecks. At most three cycles are allowed, with early stop on nondecreasing findings or contract conflict. Plan 20 cannot begin while a blocker remains.
- **Final binding:** Plan 20 checks reviewed shipped identity, prepares seven same-identity synthetic timing runs, and independently reviews its validation-only changes before UAT. Its reset uses the actual strict schema: top-level `loaded_from_repository:false`, `source_confirmed_on:null`, and the existing environment object with every member null. Later runtime changes return to review and rebinding.
- **Acceptance and status:** old observations and summaries remain history. ACK-04-01 requires the actual user's answer. AR-04-01 cannot expand to transaction residuals or create passes. The canonical promotion guard runs after executor bookkeeping; requirements cannot become complete from old summary metadata. Seven unclassified edge assumptions and the three judgment prohibitions retain honest unresolved dispositions until appropriate evidence exists.

The coverage ledger accounts for all 12 current pass-2 findings, the historical pass-1 findings, WINDOWS dispositions, obsolete 04-12 individual-guard promises, and 04-14 closed-tab claims. Each has an executable task or a reasoned preserved boundary. Plan 19 must independently justify any mechanism-level supersession; disclosure alone does not close the old requirement.

## Remaining verification dimensions

| Dimension | Result |
|---|---|
| Requirement/task coverage, key links, must-haves derivation | PASS; outcome-to-task-to-evidence wiring is explicit |
| Context compliance and scope reduction | PASS; no locked decision is silently reduced; the new decision is an execution gate |
| Architectural responsibility | PASS against current contract; content owns DOM/application, worker writes/projects, popup requests/renders, storage persists |
| Cross-plan data contracts | PASS after the ledger and evidence-schema corrections below |
| Review incorporation | PASS; current and historical actionable findings are visible to execution through tasks and ledger |
| AGENTS.md | SKIPPED: no root AGENTS.md; no project skills or configured agent skills found |
| Configured project conventions | Existing installed stack and workflow retained; unimplemented type checking is explicitly carried, never reported run |
| Research resolution | Historical questions explicitly superseded in the current ledger: ratified choices, planned human evidence, and disclosed native cleanup limit; none is disguised as completed acceptance |
| Pattern compliance | Existing actual-source VM, strict Chrome/forbidden-channel, lifecycle, local Chrome/CDP and historical evidence patterns are referenced and preserved; no new library pattern is invented |
| Nyquist 8a–8e | SKIPPED: `workflow.nyquist_validation:false`; VALIDATION exists |
| Failing directions / path resolvability | Supplied probes status ok, readError null, no severity issues; 21 commands belong to plans 15–20 |
| Verify-command format | No new-plan swallowed-error comparison, tree-output anchor or unsupported hard-coded test-count assertion found |

The old RESEARCH responsibility table's popup-write recommendation is explicitly superseded by the current worker-only writer; it is not authority to reintroduce a second writer. Historical research questions about observation remain human gates, not new unresolved implementation choices.

## Findings resolved during this planning review

| Original finding | Severity when raised | Final resolution |
|---|---|---|
| Event-originated project reads had no explicit deadline outside popup admission | BLOCKER | 16.3 now requires an independent absolute projection budget and same-tab recovery while the old read/status remains parked |
| Worker recreation could preserve an immortal old VM or incorrectly cancel native effects | WARNING | 16.3 now requires epoch-specific suppression of dead JavaScript while retaining native commits and proving no new dead-epoch API calls |
| Plan 20 named a nonexistent confirmation field; reset shorthand did not match strict environment schema | WARNING | 20.1 now names existing top-level confirmation fields and preserves the exact environment object with null members |
| New ledger contradicted executable plans on opposite-readable values and application copy, and expanded the decision checkpoint | BLOCKER | Ledger now uses fresh-readable-boolean/acknowledged-desired precedence, separates negative application from unavailable evidence, and limits the checkpoint to genuinely unknown presentation/native limits |

These are resolved planning defects, not implementation repairs. No production code, tests, canonical phase status or existing historical artifact was modified by this checker; only this report was written. This check used static plan/source inspection and installed planning validators, not an application run or a fresh behavioral certification.

```yaml
issues: []
```

The six plans are suitable to enter execution in their declared waves. Plan 15's actual unknown-state decision and Plan 20's attributed human checkpoint remain mandatory at their stated positions. Planning acceptance does not bypass either gate.
