---
phase: 04-honest-failure-and-an-off-switch
plan: "20"
technical_tests: passed
browser_timing: passed
independent_code_review: technical-clear-for-evidence
security_asvs_level1: technical-clear-four-final-evidence-threats-open
validation_tool_review: independently-passed-for-task-2
goal_verification: pending-task-3
human_acceptance: human_needed
historic_reset_acknowledgement: acknowledged
overall: human_needed
---

# Phase 04 Final Validation Inventory

Technical preparation is separate from human acceptance. Six live checks passed and eleven remain pending. Source loading and ACK-04-01 were confirmed on 2026-09-11. No canonical requirement was promoted.

## Source and recoverable provenance

Before evidence edits, all eleven recursive shipped assets matched both reviewed
commit `255ba31e2b25f7b8c5bde8a3900fb93151594f50` and 04-19-MEASUREMENTS.json.
SHA256 of sorted hash/path lines:
`46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065`.
No runtime, package, tool or harness byte changed in Task1. Source-derived settings
remain settle100ms, enabled preference key, local area and minimum Chrome106.

Pre-update committed revision: **70ad1e5**. Exact prior evidence paths relative to
this phase directory: 04-LIVE-ACCEPTANCE.md, 04-PERFORMANCE-SAMPLES.json,
04-PERFORMANCE.md and 04-VALIDATION.md. Read their former contents with
`git show 70ad1e5:PATH`; they were not overwritten in Git or presented as final
source observations. The five-file history/2026-09-10-before-review-repair/
directory remains byte-identical, including its README and fourteen attributed
observations.

Phase3 has separate runtime repair identity
`382cc881334aa7edf2103150bd8fe663236b6357` and later observation-record identity
`3979fb0730c6f778ddd31ad5ec89cfa997b79cc5`. The validator derives the record
commit from Git, compares its complete contents with disk, derives the last runtime
commit at that observation revision and checks all three prior asset hashes.
Matching two hardcoded literals would not establish this relationship. Phase3
remains human_needed,28/34 truths,eleven live passes/nine pending,UAT skipped by
user. Its files and observations remain unchanged.

## Gate inventory

| Gate | Current result | Evidence / remaining work |
|---|---|---|
| Full default tests | passed |Final cycle3:65 smoke checks and994 Vitest tests across22 files,exit0; former binding failure gone. |
| Acceptance/promotion validator | passed |Final94 tests passed in executor and independent reviewer runs; actual status human_needed. |
| Complete mutation gate | passed |39/39 intended behavioral kills,exit0; actual structured assertion evidence retained. |
| Actual Chrome synthetic timing | passed |Seven runs,4200 measurements,one final identity; maximum13.600ms,largest30-row median1.300ms. |
| Independent runtime code review | technical clear |04-REVIEW.md has zero runtime blockers/plan19 actionable findings; two inherited validator issues assigned Task1. |
| Independent security | technical clear; final evidence threats open |04-SECURITY.md:66 mitigated,12 documented accepted,four high deferred T-04G3-21..24; zero technical threats. |
| Independent validator/evidence review | passed for Task2 |04-20-VALIDATOR-REVIEW.md,cycle3:4→2→0 findings;21 direct negative controls refused and2 legitimate completion controls accepted. |
| Independent goal verification | pending Task3 |No old SUMMARY or technical result supplies this verdict. |
| Human acceptance | human_needed |Six passed of 17; source confirmed 2026-09-11 with attributed environment. Eleven remain pending. |

## Promotion contract and counterexamples

1. Any pending or failed live check blocks overall human passed.
2. Any flagged-unverified prohibition blocks overall passed.
3. Changed shipped bytes invalidate source-dependent acceptance. Old attestations
   remain attached to their original bytes.
4. Missing timing makes acceptance incomplete; failed timing makes gaps_found.
   All six enabled/disabled runs plus loaded dormant are required. Harness identity
   is bound alongside the three measured runtime assets.
5. Canonical checked boxes and Complete rows require mapped current observations,
   technical-test readiness, independent code/security readiness, actual reset
   acknowledgement and resolved prohibition judgments. Both canonical forms must
   agree. Pending/Gaps Found remain legal without those inputs. Historical
   requirements-completed metadata is never an input to the pure guard.

The primary walkthrough uses bare en. Exact ordered scope descriptors are
["en","en-*","non-English"]; these are scope, not observations. English tags in any
case, including regional tags, cannot satisfy language-icon-copy. A genuine
regional English tag is required for english-regional-locale. Strict
null/live/date/privacy evidence fields remain enforced.

| Requirement | Required current live checks |
|---|---|
| FAIL-01 |working-icon,blank-copy,missing-icon-hint,language-icon-copy,structure-copy,navigation-status,english-regional-locale |
| FAIL-02 |missing-icon-hint,missing-settle-transition |
| FAIL-03 |language-icon-copy,structure-copy,english-regional-locale |
| FAIL-05 |working-icon,missing-icon-hint,language-icon-copy,structure-copy,navigation-status,worker-restart |
| CTRL-02 |off-clears,on-restores,popup-keyboard |
| CTRL-03 |restart-off,restart-on,cross-tab-preference,frozen-resume,worker-restart |
| CTRL-04 |off-clears,on-restores,nonreceiver-status |

The existing suite exercises every mapped missing-check counterexample,
in-memory false checkbox/Complete claims, absent technical/ACK inputs, complete
positive controls, exact scope order, both locale directions, wrong source/harness
identity and false/missing dormant evidence. Actual REQUIREMENTS is guarded on
every default run. Tests never write claims to disk or consume old summary
completion metadata.

TDD: locale regressions failed before implementation (new scope was refused;
en-GB incorrectly satisfied the non-English scenario). Canonical regressions then
failed for false checked/Complete claims. Both measured normalized TAP records
returned RED_EVIDENCE_OK before implementation. Vitest nests leaf TAP and omits
Node's summary footer; normalization preserves leaf names/results and appends
actual measured counts. Raw outputs are retained in 04-20-MEASUREMENTS.json.
No failed module load was accepted as RED.

Independent review cycle1 found four actionable issues: missing unreadable-state
observations for FAIL-01/FAIL-05, technical readiness accepting stale review
identities, hypothetical controls tied to current unchecked requirements, and
malformed regional tags accepted as genuine language evidence. Seven direct
counterexamples failed intentionally; normalized evidence returned RED_EVIDENCE_OK.
The narrow repair adds both unreadable observations to those requirements,
binds both review digests and committed inventories to current shipped bytes,
normalizes only hypothetical document copies, and validates raw well-formed
BCP47 tags through Intl.getCanonicalLocales. Explicit independent mapping oracles
prevent implementation omissions from deleting their own tests. AR-04-01 remains
two pending waived observations and cannot promote FAIL-01/FAIL-03/FAIL-05.

Independent cycle2 reduced four findings to two same-ID residuals: contradictory
duplicate metadata could still satisfy readiness, and a positive test assumed
the actual ACK would forever stay outstanding. Nine duplicate-metadata controls
failed before repair and returned RED_EVIDENCE_OK. The final repair counts every
relevant key before checking its single value, including quoted/invalid duplicate
values. ACK controls now use explicit in-memory outstanding and acknowledged
documents; the actual-file guard permits either honest state without forcing
future observations or acknowledgements to stay pending. Final review cycle3 is
required before Task2. No runtime/tool/harness change occurred in either repair.

## ACK-04-01 — acknowledged

On 2026-09-11 the assistant asked the user to confirm the repaired build was loaded and that the earlier fourteen observations apply only to the old build. The user's direct response was "pass", also answering the working-state check. This records their affirmative acknowledgement in context, without rewriting their words. The historical fourteen observations remain bound to their original source; none is transferred to this build. AR-04-01 retains only its two originally waived, still-pending scenarios.

## Prohibitions and seven edge classifications

All three prohibition IDs remain flagged-unverified. Existing qualified user
ratifications remain in LIVE-ACCEPTANCE disposition text, including genuine
untested-is-not-consent ratification with its UAT citation. Current no-blame and
no-pressure judgments require the actual user's response. No automated descriptor
is fabricated for these product judgments.

| Requirement | Unclassified assumption | Status |
|---|---|---|
| FAIL-01 |Three-state semantics need actual behavioral and visual evidence |unresolved |
| FAIL-02 |Real mount timing may defeat certainty |unresolved |
| FAIL-03 |Unsupported/malformed language presentation needs evidence |unresolved |
| FAIL-05 |Artwork distinguishability is a browser/user judgment |unresolved |
| CTRL-02 |Popup must reflect authoritative intent under every outcome |unresolved |
| CTRL-03 |VM recreation is not real browser restart |unresolved |
| CTRL-04 |Marker removal alone does not prove visual cleanup |unresolved |

Phase3 profiling stays deferred. Layout/retainer attribution was not taken.
Approved native-write and worker-epoch uncertainty limits remain distinct from
unobserved scenarios. No package install, remote publication or live account
interaction occurred. Shared STATE/ROADMAP/REQUIREMENTS/WINDOWS remain outside
Task1 ownership; Task3 reconciliation has not run.

## Independent final recheck — 2026-09-11

Reviewer: independent gsd-code-reviewer
`/root/phase04_plan20/validator_review`. Final cycle3 verdict:
**pass_for_task_2_human_checkpoint**, zero blockers and zero warnings. Finding
counts decreased4→2→0. The report preserves every original finding and recheck.

The exact reviewed five-file diff from70ad1e5, before this appraisal metadata,
has SHA256 `9abf9a910f5eb36140a7d862920194412cad42284820e08fdad67e89ccdd32f4`.
Validator bytes: `534ef7de8c882c82e11b923d3a3c016c4857ac8c95f47969688642322a4c4ca7`.
All five reviewed per-file hashes are in 04-20-VALIDATOR-REVIEW.md. The reviewed
version of this document before appraisal is retained in 04-20-MEASUREMENTS.json
so the snapshot remains reconstructable after these result-only updates.

Independent results:94/94 tests,21 direct negative controls rejected,2 legitimate
Complete/ACK positive controls accepted. Runtime11/11,Phase3 three-asset Git
provenance,history5/5 and all seven timing runs remain verified. Executor final
default:65 smoke+994 Vitest,exit0. Full39 mutation kills and seven Chrome runs
remain valid: their runtime,tool,harness and registry inputs did not change during
the validation-only repair cycles. Mandatory actual-Chrome smoke also passed.

Task1 preparation is complete. **Task2 is blocking-human.** No current browser
loading, observation, product judgment or ACK has been supplied. Four final
evidence/security threats remain qualified by the actual human/goal gates;
this validation review does not rewrite canonical SECURITY or award Phase4 passed.
