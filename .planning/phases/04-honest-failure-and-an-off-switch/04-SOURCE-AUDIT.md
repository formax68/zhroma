# Phase 04 Source Audit and Execution Map

## Planning status

Six plans; six sequential waves because the extension contexts and tests share files. 04-01 is the explicit decision-only prerequisite; 04-02 contains the first production tracer across content, worker, toolbar and popup; 04-06 integrates inherited regressions/workload before 04-03 expands diagnoses, 04-04 adds off/on and 04-05 reaches final-source evidence and blocking human verification.

Level 2 research completed in 04-RESEARCH.md before planning. Existing source paths were grounded in git ls-files; newly planned paths are labelled in each plan's artifacts section. No project agent skills or graph were configured. Calibration returned factor 1, sample_count 0, confidence low. No dependencies, package installation, network, schema changes or operational Zendesk edits are planned.

Phase 3 remains human_needed 28/34 with eleven source-bound passed checks and nine pending after its user-requested UAT skip. Phase 4 human checks are new and pending, not designated skipped. The final blocking checkpoint:human-verify in nonautonomous 04-05 reaches all sixteen observations after automated preparation. Deferral leaves execution paused with human_needed; it does not resume Phase 3 UAT.

## Multi-source coverage audit

| Source | ID | Required outcome/constraint | Plan/tasks | Status |
|---|---|---|---|---|
| GOAL | Phase04 | See status, certain missing hint, control tint without uninstalling | 02-1,03-1/2,04-1/2,05-1/3 | COVERED |
| REQ | FAIL-01 | Three distinct diagnoses | 02-1,03-1/2 | COVERED |
| REQ | FAIL-02 | Hint only on certain missing column | 03-1,05-1/3 | COVERED |
| REQ | FAIL-03 | Unsupported locale never claims missing | 03-1/2,05-1/3 | COVERED |
| REQ | FAIL-05 | Toolbar icon exposes diagnosis | 01-1,03-2,05-1/3 | COVERED |
| REQ | CTRL-02 | Popup off/on | 01-2/3,04-1/2,05-1/3 | COVERED |
| REQ | CTRL-03 | Default-on boolean survives restart | 02-1,04-1/2,05-1/3 | COVERED |
| REQ | CTRL-04 | Current tint removed without refresh | 04-1/2,05-1/3 | COVERED |
| CONTEXT | D-01 | Header + row witness + quiet interval; waiting not proof | 03-1 | COVERED |
| CONTEXT | D-02 | Blank is working with honest nuance | 02-1,03-1 | COVERED |
| CONTEXT | D-03 | Popup-only hint; no page diagnostic; costly reversal | 03-1/2,04-2 | COVERED |
| CONTEXT | D-04 | Shared unreadable icon; evidence-based reason copy | 03-1/2 | COVERED |
| CONTEXT | D-05 | Frozen storage permission/static match | 02-1,06-1,03-2 | COVERED |
| CONTEXT | D-06 | One boolean, no ticket payload/network/build | 02-1,06-1,04-1/2 | COVERED |
| CONTEXT | D-07 | CSS-only tint palette and owned attribute | 06-1,03-2 | COVERED |
| CONTEXT | D-08 | Exact English labels and shell | 02-1,03-1 | COVERED |
| CONTEXT | D-09 | Mutation discovery, no route hooks | 02-1,06-1,03-1 | COVERED |
| CONTEXT | D-10 | Persistent preference separate from lifecycle pause | 02-1,04-1/2 | COVERED |
| CONTEXT | D-11 | Status panel and one switch only | 01-3,04-1/2 | COVERED |
| CONTEXT | Open toolbar choice | Explicit choice before artwork implementation | 01-1 | COVERED by checkpoint |
| CONTEXT | Open toggle choice | Scope, storage area and runnable/frozen propagation | 01-2 | COVERED by checkpoint |
| CONTEXT | Open popup choice | Five messages/help/nonreceiver boundary | 01-3 | COVERED by checkpoint |
| RESEARCH | State separation | Diagnosis, readiness, preference and lifecycle independent | 02-1,03-1,04-1 | COVERED |
| RESEARCH | Quiet window | 100 ms finite confirmation, fresh DOM, one timer, no self-churn | 03-1 | COVERED |
| RESEARCH | Worker lifecycle | Top-level listeners, reconstructible state, no keepalive | 02-1,03-2,04-2 | COVERED |
| RESEARCH | Sender/schema security | Extension/frame/document validation and bounded primitives | 02-1,04-1 | COVERED |
| RESEARCH | Stale messages | Generation after awaits, per-tab serialization, current-frame requery | 02-1,03-2,04-2 | COVERED |
| RESEARCH | Navigation/closure | Invalidate/requery only; cleanup per-tab state | 03-2,04-2 | COVERED |
| RESEARCH | Chrome compatibility | documentId raises floor to Chrome106; literal-true async listeners | 02-1 | COVERED |
| RESEARCH | Startup races | Listener before read; false/error != absence | 02-1,06-1,04-1/2 | COVERED |
| RESEARCH | Preference ordering | Desired boolean writer; current application acknowledgement | 04-1/2 | COVERED |
| RESEARCH | Native failure | Working/cleanup requires real success; bounded permanent-failure limit | 03-1,04-1/2 | COVERED |
| RESEARCH | Strict privacy harness | Actual scripts in separate contexts, exact API allowance | 02-1,06-1,04-2 | COVERED |
| RESEARCH | Historical source | Bind Phase3 original record before runtime edits | 02-1 | COVERED |
| RESEARCH | Tests/discovery | Existing wildcard includes new tests; preserve corpus/packages | 06-1 | COVERED |
| RESEARCH | Final validation | Separate automated, browser, review/security and human claims | 06-2,05-1/2/3 | COVERED |

No source item is omitted. The three open product areas are in scope despite appearing beneath a Deferred Ideas heading; context explicitly authorizes checkpoint planning. Actually out-of-phase items remain excluded: Phase3 completion/live backlog, store publication/privacy policy/submission, custom palettes/treatments/dark mode/additional locales.

## Dependency graph

| Plan | Needs | Creates | Checkpoint | Wave |
|---|---|---|---|---|
| 04-01 | Context/research | Three actual product choices | Three decision gates | 1 |
| 04-02 | Confirmed choices; original Phase3 revision | Complete supported status tracer and preserved history | none | 2 |
| 04-06 | 04-02 preference/status contract | Strict inherited suites and browser workload | none | 3 |
| 04-03 | Integrated current-document status seam | Certain three-way diagnosis/icons | none | 4 |
| 04-04 | Diagnosis/status seam | Persistent switch and race-safe application | none | 5 |
| 04-05 | Final runtime bytes | Source-bound evidence and actual human observations | Final blocking human verification | 6 |

04-02 retains the approved single ten-file tracer exception. Its former Tasks 2 and 3 are preserved as 04-06 Tasks 1 and 2 across six test/workload files. The focused 04-02 verification does not claim inherited suites pass before 04-06 adaptation. No same-wave file overlap exists.

## Spec-less edge coverage: flagged assumptions

The edge engine returned applicable=7, resolved=0, unresolved=7. These are engine findings, not invented predicates. No row is marked resolved by the existence of a plan.

| Requirement | Engine category | Engine status | Explicit flagged assumption | Planned investigation |
|---|---|---|---|---|
| FAIL-01 | unclassified | unresolved | Three-state product semantics need actual behavioral and visual verification | 03,05 |
| FAIL-02 | unclassified | unresolved | Certainty may be undermined by real mount timing | 03-1,05-1/3 |
| FAIL-03 | unclassified | unresolved | Unsupported/missing language presentation needs evidence | 03-1,05-1/3 |
| FAIL-05 | unclassified | unresolved | Distinct artwork must be recognizable in browser | 01-1,03-2,05-1/3 |
| CTRL-02 | unclassified | unresolved | Popup interaction must reflect authoritative intent | 04,05 |
| CTRL-03 | unclassified | unresolved | Real browser restart is not established by context recreation | 04-2,05-1/3 |
| CTRL-04 | unclassified | unresolved | Real visual cleanup cannot be established only by marker checks | 04-1,05-1/3 |

## Prohibition recall and precision

Adversarial raw candidates covered: false missing-column blame, ambiguous loading wording, language blame, alarmist failure copy, coercive re-enable prompting, hidden switch, stale reads, wrong-tab status, ticket logging, telemetry, injected HTML, persisted diagnosis, fabricated browser passes, mistaken UAT consent, overwritten historical records, and unauthorized view editing. Routine state races/timer/DOM hygiene go to behavioral tests and review; security/injection/data-retention canon goes to $gsd-secure-phase rather than duplicate prohibitions.

Three bespoke candidates survive: diagnosis must not blame the agent; off must not pressure re-enable; untested behavior must not become claimed acceptance or consent. They were passed through projectProhibitions from the installed probe-core.cjs and authored verbatim as descriptor-less unresolved must_haves.prohibitions in 04-05. They dispose as flagged-unverified, with no fabricated check_kind/check_target/check_rule/fixtures. Equality: 7 surfaced edges = 7 flagged assumptions; 3 kept prohibitions = 3 projected items.

## Contribution results

API coverage detector and final-scope declaration are recorded in COVERAGE.md. No external service is integrated: Chrome platform APIs coordinate the extension locally. Assumption-delta scan returned detected:false with no signals. Schema scan found no schema-relevant files, so no push task. Security enforcement is ASVS level1 with high/critical blocking; every plan has trust boundaries and a STRIDE register. Package legitimacy install gate is inapplicable because there are no installs.

## Evidence boundary

Raw projected tokens are 9k/34k/30k/34k/22k/14k (plan IDs 01/02/03/04/05/06); factor1 and low calibration confidence apply. Plans require independent verification after implementation. New Phase4 checks are initially pending and reached at the final blocking checkpoint; Phase3's user-requested skip is preserved exactly. No live observation, package consent or product choice has been manufactured.
