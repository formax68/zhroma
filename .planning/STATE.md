---
gsd_state_version: "1.0"
current_phase: 04
current_phase_name: Honest Failure and an Off Switch
status: executing
stopped_at: Completed 04-11-PLAN.md
last_updated: "2026-09-10T16:42:56.885Z"
last_activity: 2026-09-10
last_activity_desc: Phase 04 execution started
state_head: 01336f094ed4a624f6b284cb9601ddaff83c98cc
progress:
  total_phases: 5
  completed_phases: 2
  total_plans: 36
  completed_plans: 33
  percent: 40
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-09)

**Core value:** Open a Zendesk view and know within one second which tickets are urgent — without reading a word.
**Current focus:** Phase 04 — Honest Failure and an Off Switch

## Current Position

Phase: 04 (Honest Failure and an Off Switch) — EXECUTING
Plan: 6 of 14
Status: Ready to execute
Last activity: 2026-09-10 — Phase 04 execution started

Milestone progress: 2/5 phases complete (40%). Phase 03 remains incomplete.

## Performance Metrics

**Velocity:**

- Total plans completed: 18 (Phase 01 and Phase 02 complete; 02-03 investigation-only)
- Average duration: —
- Total execution time: 0.0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 15 | - | - |
| 02 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 12m | 2 tasks | 5 files |
| Phase 01 P02 | 23min | 3 tasks | 2 files |
| Phase 01 P07 | 8 min | 2 tasks | 3 files |
| Phase 01 P06 | 2h 32m | 2 tasks | 3 files |
| Phase 01 P08 | 2h 59m | 3 tasks | 9 files |
| Phase 01 P09 | 6 min | 3 tasks | 10 files |
| Phase 01 P10 | 6 min | 2 tasks | 3 files |
| Phase 01 P11 | 8 min | 3 tasks | 4 files |
| Phase 02 P01 | 12min | 2 tasks | 6 files |
| Phase 02 P02 | 5min | 2 tasks | 2 files |
| Phase 04 P01 | 8 min | 3 tasks | 1 files |
| Phase 04 P02 | 15 min | 1 tasks | 10 files |
| Phase 04 P06 | 12 min | 2 tasks | 6 files |
| Phase 04 P03 | 28 min | 2 tasks | 9 files |
| Phase 04 P04 | 38 min | 2 tasks | 9 files |
| Phase 04 P07 | 11 min | 3 tasks | 5 files |
| Phase 04 P08 | 16 min | 3 tasks | 7 files |
| Phase 04 P09 | 8 min | 2 tasks | 4 files |
| Phase 04 P10 | 19 min | 3 tasks | 4 files |
| Phase 04 P11 | 23 min | 3 tasks | 14 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap: Dark mode and the colourblind-safe palette — including hue selection — are out of v1. The CTRL-02 toggle is the accepted mitigation.
- Roadmap: The `storage` permission is taken, for exactly one default-on boolean. It is the only permission v1 requests, and the permission set is frozen in Phase 2.
- Roadmap: English only in v1, but the three-way failure taxonomy (FAIL-01/02/03) ships in v1 so the hint never lies to a non-English agent.
- Roadmap: No build step, no bundler — hand-written files, zipped. Shipped bytes equal repo bytes.
- Roadmap: SPA route detection is an anti-requirement. A view switch is a DOM mutation the Phase 3 observer already handles.
- [Phase 01]: Open live DOM facts remain Recon Question templates until sanitized terminal evidence is admitted.
- [Phase 01]: The recon gate must report block while any English-path question remains unresolved.
- [Phase 01]: Sensitive fixture diagnostics expose category and code only, never matched values or input locations.
- [Phase 01]: Plan 01-09 normalizes the production scanner to NFC before case folding; recon CLI details require ZHROMA_RECON_DEBUG=1.
- [Phase 01]: Plan 01-02: Package legitimacy approvals remain exact-version, independent, and non-installing.
- [Phase 01]: Plan 01-02: Bound live recon to current Agent Workspace with account plan unknown/not shared; make no cross-plan claim.
- [Phase 01]: Resolve sanitizer CLI and worktree identity from the module URL, never the caller cwd.
- [Phase 01]: Admit one owned table through a sibling-free wrapper chain before sanitization.
- [Phase 01]: Classify ARIA explicitly and reject unknown names or invalid state values.
- [Phase 01]: Preserve Priority labels only in positively resolved ticket-row Priority cells.
- [Phase 01]: Native hover and selection paint belongs to the ticket row in the observed grouped-long tab; selection also adds an inset first-cell indicator.
- [Phase 01]: Plan 01-06 leaves the final Phase 1 verdict blocked until Plan 01-08 evaluates every gate.
- [Phase 01]: Interaction evidence remains limited to the English current Agent Workspace scenario and retains no screenshot or sensitive value.
- [Phase 01]: Use one production-owned, canonical-path-safe, scan-before-parse fixture validator from both Vitest and final mode.
- [Phase 01]: Authorize proceed only when the complete ledger, corpus, interaction, Shadow DOM, selector, and prohibition predicates all pass.
- [Phase 01]: Accept the provenance and user-control judgments only within the named English current Agent Workspace scenarios and record no identifying content.
- [Phase 02]: Use exact-English whole-table initial snapshots; grouped redaction placeholders remain unknown and untinted.
- [Phase 02]: UAT now has ten source-bound live passes, one failed initial-load observation and twelve explicit user decisions. Keep G-02-1 open; no speculative runtime tuning.
- [Phase 02]: Source settings and evidence-schema test success establish preparation only; product acceptance and independent review gates remain separate.
- [Phase 04]: Missing-column certainty is gated on a mutation revision, not a wall clock: the settle callback re-inspects the current DOM and only confirms when the revision that armed it is still current, so a change inside the window restarts a full 100 ms rather than confirming through it.
- [Phase 04]: Structural unreadability and unsupported locale share the cannot-read diagnosis but carry different fixed reasons; an absent, empty or whitespace lang and a subframe all take the generic structure branch so no language is ever invented.
- [Phase 04]: The finite {diagnosis, reason} pair is validated as one key in the worker and the popup, so an unpaired combination reports the connection fact rather than falling back to a weaker message.
- [Phase 04]: The supported interface language is the English language FAMILY (en and every en-* subtag), matched case-insensitively on the raw untrimmed lang value in both encodings — D-08 named html[lang="en"] as the English boundary; D-04 promises an English view is never blamed on its language, and en-GB is English. The family is promoted to the primary representation and the bare tag demoted to one member, so no second predicate exists to drift.
- [Phase 04]: The single source of truth for the accepted language family is the locale-matrix agreement test, not a shared constant — No build step exists and CSS cannot import from JavaScript, so the predicate is necessarily encoded twice. runtime-contract.test.js writes the accepted and refused sets down once and checks both encodings against them, which is what makes the duplication safe.
- [Phase 04]: Both worker sendMessage hops are bounded by a shipped REQUEST_TIMEOUT_MS = 2000 that resolves null, so a silent top frame costs one wait rather than the off switch, and the timeout path mints no new state and no new copy
- [Phase 04]: A timed-out apply reports the ratified 'No readable view is connected' line, not the not-applied line the plan named; producing the latter would require inventing a status the document never gave
- [Phase 04]: npm run test:mutants is a committed out-of-tree mutation gate: 6/6 killed, each by a named behavioural test, with the acceptance byte pin excluded from every mutant's suites
- [Phase 04]: The workload page validates size as any positive integer while the CLI keeps its 30/200/1000 set: two different questions — which runs are canonical evidence versus whether a run can be measured at all — so the constraint is not duplicated where it could drift
- [Phase 04]: A dormant run mode stores a real false through the shipped controller and is the run that measures the off state; the old disabled control is renamed runtime 'absent' and kept as a no-runtime baseline. The runtime field is required only for dormant, so Phase 3's historical samples validate unchanged, and no timing budget applies to dormancy because its claim is zero work, not fast work
- [Phase 04]: The popup's REQUEST_TIMEOUT_MS is 5000, strictly greater than the worker's 2000 rather than equal to it, and the ordering between the two processes' copies is asserted from the shipped bytes — Answering the popup can cost the worker a full bounded wait of its own, so an equal deadline fires first and discards the worker's honest reply together with the confirmed preference it carried — regressing the "switch is usable again" property 04-08 established. With no build step to share one constant (D-06), a test that reads both sources is what holds the inequality.
- [Phase 04]: After a failed save the popup reverts the checkbox to lastConfirmed and leaves the control enabled; with nothing ever confirmed it shows no position at all, because defaultChecked would display an unconfirmed off — The change event has already moved control.checked before the request is sent, so leaving it alone displays a position nothing confirmed next to copy saying the save failed. lastConfirmed is assigned in exactly one place — where a reply delivers a boolean — so it can never hold a desired value, and it is display state only, never sent.
- [Phase 04]: A mutant is registered only after it has been measured killed: popup-focus-guard mutates the focus restoration itself, because reinstating the disabled-state guard the plan named was measured SURVIVED — Task 1's corrected ordering re-enables the control before end() runs, so !control.disabled is unreachable-true on every failure path with a confirmed value, and focusing a disabled control is a no-op in the browser on the other. Registering it would have claimed a kill the gate could not honestly deliver.
- [Phase 04]: The fourteen live observations attested on 2026-09-10 are preserved as dated history and NOT carried onto the repaired bytes; every check is reset to pending and Phase 4 now carries zero live browser evidence — An observation is evidence about the bytes it was taken on. Promotion rule 3, 04-LIVE-ACCEPTANCE rule 5 and the validator's live-source-evidence gate each independently forbid re-pointing an old observation at new bytes, and CR-01/WR-04/WR-07/WR-08 moved four of the eleven shipped assets.
- [Phase 04]: english-regional-locale is added as a seventeenth live check rather than folded into working-icon, and the re-enable-not-pressured ratification is qualified rather than carried intact — The CR-01 repair ships a behaviour (an English regional shell tints) that no existing check covered, and a shipped behaviour with no live-evidence slot is the silent gap promotion rule 3 exists to prevent. Symmetrically, popup.js changed under WR-04/WR-07, so the popup the user judged when ratifying the off-switch prohibition is not the popup that ships.

### Pending Todos

**Latest user direction:** Skip UAT. Stop further live-check and profiling prompts; earlier next-check instructions are superseded. Eleven passes remain recorded, nine untested.

CR-01/CR-02 repairs and independent reverification are complete; 403 tests and fresh synthetic timing pass. Preserve historical 16/20 live passes and four pending checks. Current-source live confirmation and acceptance are pending; synthetic layout/retainer attribution and final goal acceptance remain open. Manual profiling stays deferred. T-03-15 remains a non-blocking medium evidence gap. Do not count the halted 03-04 summary as a completed plan.

### Blockers/Concerns

- User approved Plan 01-12 source and provenance with "yes on both"; re-admission and second-pass parity are complete. Originals remain recoverable from Git.

- Phase 1 is complete: 23/24 truths verified plus one explicitly accepted historical uncertainty. All 15 plans and audit fixes are complete; code review is clean; security has zero open threats. Phase 2 is complete with 25/25 independent verification and source-bound user acceptance.
- Historical approval independence remains not-attested. User explicitly accepted the residual risk on 2026-09-08 (AR-01-13; 01-RISK-ACCEPTANCE.md); preserve truth 8 as an accepted exception, not a verified historical fact.
- Phase 1 found no locale-independent Priority signal; the observed English-text fallback remains scoped to English current Agent Workspace.
- Store submission has latency and the direct predecessor was delisted at this step. Register the developer account early; budget one rejection-and-resubmit cycle in Phase 5.
- Phase 2 product evidence now passes: user clarified both G-02-1 reports meant opening Zendesk then clicking a view, including from a fresh tab. Direct-document controls passed; no runtime repair. UAT 11 live passes and 12 explicit decisions. Independent code review clean; security reassessment 10/10 closed. Independent goal verification passed 25/25. Combined tests 301 passed and post-reconciliation evidence validator 56 passed.
- ACK-04-01 is outstanding and awaiting the user, not awaiting work: the fourteen observations the user attested on 2026-09-10 no longer count toward Phase 4 acceptance, and the user has not yet acknowledged that. It asks for acknowledgement only and requests no re-observation. No executor may answer it. Routes: 04-VALIDATION.md, and the human-check block on 04-11 Task 3 queued for the end-of-phase harvest.

### Roadmap Evolution

- [Phase 02]: Goal reformatted into the required MVP user-story syntax during verification; original wording retained as Goal scope and all five success criteria unchanged. user-story.validate passed.

- Phase 1 edited: edited fields: goal, success_criteria

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| Phase 3 liveness | Opening Zendesk then clicking a view and Next/Previous pagination leave rows untinted; explicit coverage added alongside sorting/view switching | Pending Phase 3 | 2026-09-09 | v1 |

## Session Continuity

Last session: 2026-09-10T16:42:29.769Z
Stopped at: Completed 04-11-PLAN.md
Resume file: None

- [Phase 02 clarification]: Both original G-02-1 reports used in-app entry. Preserve the symptom for Phase 3; direct-document controls passed, no Phase 2 repair was made.

Completion helper warnings: legacy summaries contain command strings and historical Git lock text misidentified as file references. The actual test commands passed and no required product artifact is missing. Historical summaries were preserved.

## Phase 03 execution checkpoint — 2026-09-09 (pre-repair history)

- Plans 03-01/02 implemented persistent fresh-DOM tint, prompt owned cleanup, filtered coalescing and pause/resume. No runtime channels, dependencies, manifest or CSS changes.
- Plan 03-03 executed 1800 enabled and 1800 disabled Chrome timing samples: slowest 30-row operation median 1.3 ms; global maximum 15.4 ms. Both timing budgets pass. Synthetic layout/retainer attribution remains human_needed; zero aggregate detached growth is not attribution proof.
- 03-04 prepared twenty current-source live checks; sixteen now have dated user-reported passes. Task 2 is an explicit blocking-human checkpoint. All 393 combined tests pass; four live checks and independent review/security/goal verification remain open. Manual profiling was deferred at user request.
- Three completed plan summaries plus one halted checkpoint summary exist. ROADMAP remains 3/4 for Phase 03. No phase.complete call is authorized by current evidence.

## Runtime repair and independent reviews — 2026-09-09

CR-01 and CR-02 are repaired. Independent final code review is clean; security closes fourteen of fifteen mitigations with zero high blocking threats and one non-blocking medium missing-snippet gap. Full suite: 403 passed. Fresh synthetic timing: 1800 enabled/1800 disabled samples; largest 30-row median 1.4 ms, overall maximum 14.5 ms. See 03-REPAIR-SUMMARY.md, 03-REVIEW.md, 03-SECURITY.md and 03-PERFORMANCE.md.

Final-source live acceptance is human_needed. Sixteen passes and four pending checks remain bound to the old source in history/2026-09-09-before-runtime-repair; current-source twenty checks are pending. Manual profiling remains deferred. No Phase 4 advancement or completion claim.

## Repaired-source smoke follow-up — 2026-09-09

User reported "all passed" for repository extension reload plus one setup browser refresh, opening a Priority view, sorting, Next/Previous pagination, and generic view switching. Preserved in 03-LIVE-ACCEPTANCE.md and 03-04-CHECKPOINT.md. Current environment metadata and narrower canonical variants remain unconfirmed; do not infer native view refresh, Priority-absent switching, or a completed phase. Manual profiling remains deferred.

Follow-up: native view refresh, scrolling down/back and twenty-second browser-tab return also passed on unchanged repaired source. These observations are recorded; environment metadata and remaining canonical checks still pending. Next practical checks: grouped/sticky view and native row interactions.

Follow-up: grouped/sticky headings remained untinted with correct ticket colours; hover, selection/deselection, unread bold text and ticket opening behaved normally. User reported all passed. Remaining navigation variants: delayed landing-page entry and Priority-absent view switching. Preserve observed scope; keyboard traversal and disabled-isolation comparison were not inferred.

Follow-up: delayed dashboard-to-view entry and Priority-present/absent/present switching also passed without browser refresh. All guided observations are preserved against the unchanged repaired source. Next: confirm current browser, OS, English/light environment and mounted-row metadata so completed observations can be promoted without repetition. Remaining live criteria and manual profiling deferral stay explicit.

## Current acceptance update — 2026-09-09

User confirmed the unchanged browser/OS/English-light environment and 30 mounted rows. Nine complete repaired-source checks are now canonical passes; eleven remain pending, with generic sorting and interaction observations retained as partial coverage. Source hashes unchanged. Earlier notes about unconfirmed metadata are historical. Next narrow checks: sort by Priority and another column; keyboard focus and selection indicator. No redoing completed checks. Manual profiling remains deferred.

Follow-up: user reported all passed for sorting by Priority and another column and visible/normal Tab focus. Combined prior native-interaction observations now promote sort and native-states. Current canonical total is 11/20 passed, nine pending. Next practical checks: enabled/disabled non-view isolation and subjective responsiveness. Manual profiling remains deferred.

## UAT skipped at user request — 2026-09-09

The user said **"let's skip UAT,"**. Stop the UAT walkthrough and further UAT prompts. Preserve the eleven completed current-source live passes. The remaining nine checks are untested and skipped for this walkthrough; their canonical evidence statuses remain pending because no observations were supplied. Do not invent passes, failed observations, or risk acceptance. Resume UAT only if the user asks.

This supersedes all earlier next-check instructions, including the requested enabled/disabled isolation and responsiveness comparisons. Manual profiling also remains deferred. Automated verification, independent code review and the security threshold verdict remain recorded separately. No phase-completion or full live-acceptance claim is made by this instruction.

## Final goal verification and handoff — 2026-09-09

Independent 03-VERIFICATION.md: human_needed, 28/34 distinct truths verified, no new implementation blockers. All eight requirement IDs accounted; six satisfied within admitted evidence scope, LIVE-05/FAIL-04 need human evidence. Fresh full suite: 403 passed. Current live acceptance: eleven passes, nine untested; UAT explicitly skipped. Three judgment prohibitions remain flagged; no accepted-risk inference.

03-HANDOFF.md records the verified baseline, remaining evidence and concrete Phase 04 planning inputs. Next preparatory work is Phase 04 design/context and planning; current phase remains 03 and no phase.complete was invoked. Do not restart UAT or profiling. MVP goal wording was normalized into required user-story syntax with original scope and all success criteria preserved; centralized validation passed.
