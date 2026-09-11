# Phase 04 gap-closure coverage and current contract

## 04-19 initial independent review — 2026-09-11

Independent code and security reviews of 832926e found CR-19-01 (stale ON on
page restore), CR-19-02 (old-document application acknowledgement), CR-19-03
(stale popup diagnosis after native artwork await), and WR-19-01 (unbounded
test-harness drain). All remain open pending bounded RED/GREEN repair and
independent recheck. The required two-suite run passed 234 tests despite these
counterexamples. Canonical REVIEW preserves pass 2 at 1469810596704ed72b631d8409a3e77cbdddbd41
and pass 1 at bc25a2c. No prior canonical Phase 4 SECURITY report existed.

The full independent security register has 82 entries: three current technical
high blockers, four high evidence/human threats explicitly deferred to 04-20,
and twelve existing accept dispositions whose canonical log needs a presence
recheck. None of the approved native/epoch limits waives the three new defects.
04-12's ANY ONE guard promise is superseded by independently justified observable
mechanism coverage; excluded redundant sites remain survivors, not kills.
04-14 now has behavioral retained-entry/committed-paint evidence, subject to the
worker repair recheck. No requirement, edge classifier or human judgment closes.

Planning baseline: `0cc45c38f8fc1c38cfa2a522890385d21a66de64`, 2026-09-11.
This is the append-only 04-15–04-20 plan ledger. **COVERED means planned, not repaired or accepted.** Execution must add direct evidence and an independent disposition before changing that status. Old plans, summaries and attributed observations remain immutable history.

The causal evidence is in `04-FAILURE-ANALYSIS.md`: both directions of successful-write/failed-read contradict storage while 38 targeted tests pass; an indefinitely parked read blocks both requests; and a nonexistent mutant suite is reported killed with runner exit 0. The local repair, weak oracle and premature acceptance-binding patterns explain why another set of narrow test edits would be insufficient. No plan can guarantee there will never be another defect.

## Execution sequence and ownership

| Plan | Wave / needs | Concrete output | Gate |
|---|---|---|---|
| 04-15 | 13 / executed 04-14 | Both-direction confirmed-save fix and full preference contract | Actual unknown-state product decision after useful preparation |
| 04-17 | 13 / executed 04-14 | Malformed-English honesty and actual Chrome synthetic selector evidence | No live evidence claim |
| 04-16 | 14 / 04-15 | Admission deadlines, raw-write exclusion, finite consumers, late effects and lifecycle tests | Exactly the 04-15 attributed choice |
| 04-18 | 15 / 04-16,04-17 | Fail-closed mutation gate, assertion-backed registries and cheap default-suite integrity check | Clean baseline plus named intended failure |
| 04-19 | 16 / 04-18 | Independent code/security review and scoped local repair/recheck packets | At most three cycles; stop on nondecreasing findings or contract conflict |
| 04-20 | 17 / converged 04-19 | Final binding, validation-tool review, one human harvest and canonical reconciliation | Genuine human evidence; waived/unavailable stays pending |

04-15 and 04-17 share no modified files. Shared runtime, harness and registry edits run sequentially thereafter. 04-16 supplies the protocol consumers and exact assertion labels before 04-18 adjudicates mutants. 04-19's report-only initial scope expands only through an explicit pre-edit amendment naming the concrete finding and at-most-five-file repair packet, including any exact registry path. This is a local integration procedure within this execution round, not an automatic new gap round or permission for unrelated work. If its real scope exceeds the sizing gate, re-slice the concrete packets locally and amend 04-20's dependencies before proceeding.

## Complete preference outcome oracle

Let P be the last confirmed preference and D the newly requested desired boolean. Every relevant row runs for P=true,D=false and P=false,D=true. The observable oracle joins native dispatch/commit/callback, actual stored value, reply identity, control certainty, fixed copy, current-document markers/application acknowledgement, and next-request behavior. Tests never infer storage from checkbox state alone.

| Native write evidence | Read-back evidence | Application / connection | Required displayed outcome | Independent falsification |
|---|---|---|---|---|
| Acknowledged successful D | Reads D | Current document acknowledges completed application | Confirmed D; current finite diagnosis or off copy | Stored D, checkbox D and markers agree; positive control both directions |
| Acknowledged successful D | Read fails, malformed, absent callback or unavailable | Unconfirmed | Use acknowledged D, never stale P or failed-save copy. Use ratified not-applied copy for explicit negative application; retain unavailable only for genuinely unavailable document evidence | CR-01 reproduction must fail on old source and pass after 04-15; application and connection facts select the truthful existing path |
| Acknowledged successful D | Reads an opposite boolean | Any | Display the fresh returned boolean as the later confirmed preference, not old P from memory; successful write remains acknowledged | Split write and independently controlled read values; fresh readable boolean takes precedence without claiming it equals requested D |
| Acknowledged successful D | Reads D | Negative, malformed, silent or absent receiver | Preserve saved D; explicit negative application uses ratified not-applied copy, genuinely unavailable document retains unavailable, and malformed/silent reply never proves successful application | Application/connection precedence follows actual finite evidence; stale apply reply never confirms current document |
| Definite write failure/throw before commit | Fresh readable value | No successful apply | Confirm that readable preference; exact ratified failed-save copy; recoverable control | Zero successful write, readable checkbox and keyboard focus assertions |
| Definite write failure | Failed or malformed read | No successful apply | Use only still-valid previously confirmed evidence; never assert unconfirmed desired intent; preserve truthful failure and recovery | Both directions; no confirmed fallback on initial unconfirmed open |
| Never started because expired/overloaded | Any | Not dispatched | Finite not-started outcome; no later write from that expired request | Queue admission clock, native write count and delayed drain assertion |
| Issued, callback not settled, before or after physical commit | Old P, committed D, failure or no read | Any | Unknown saved outcome; no definite checkbox claim; approved indeterminate disabled state/copy | Both commit-before-callback and callback-after-deadline; fresh popupStatus still enabled:null |
| Transport timeout / malformed response | No authoritative result | Unknown | Unknown, never proof that saving failed | Popup fallback copy plus late-response ownership and subsequent fresh confirmation |
| Physical write settles after caller timeout | Fresh subsequent read | New explicit request may proceed | Fresh bounded confirmation can recover; old response cannot overwrite newer display | Opposite request after settlement, ordered commits and distinct response generations |
| Worker terminates with issued operation pending | New worker can only read current stored boolean | Old native commit may still land | No cross-epoch transaction-order guarantee; eventual fresh observation is evidence only | Preserve native effects, suppress dead JS, assert zero new dead-epoch API dispatch |

04-15 writes `04-PREFERENCE-CONTRACT.md` before its decision checkpoint. Its existing evidence precedence is fixed: use a fresh returned boolean when present, otherwise acknowledged desired value after a successful write; a failed read cannot undo that acknowledgement. The narrow checkpoint concerns only unknown-setting presentation and native-stall/worker-epoch limits, not opposite-readable-value semantics. No executor invents copy or interprets timeout as cancellation. The proposal preserves original strings on truthful paths and adds “Zhroma could not confirm that setting” for uncertainty, a mixed disabled native checkbox and fresh bounded reopen/focus recovery. Consent is pending at planning time. A forever-pending native write prevents another physical write within that worker; neither reading a value nor closing/reopening the popup clears that exclusion. AR-04-01 does not cover this new residual.

The operation-wide request budget includes arrival, queue admission and every asynchronous stage. No finite popup-greater-than-one-hop inequality bounds an unlimited backlog. Event-originated projection also has its own absolute budget; abandonable read/status observation cannot retain the per-tab queue forever. Native setIcon/setTitle operations retain physical ownership until actual settlement, followed by current-generation reconciliation. A caller deadline does not cancel a native side effect. The tests distinguish these two lifetimes explicitly.

## Current review pass 2 findings

Reference: canonical `04-REVIEW.md` at planning baseline, incremental since `bc25a2c`. IDs in this table never mean the same-numbered pass 1 finding.

| Finding | Current disposition / evidence | Planned task | Independent adversarial acceptance |
|---|---|---|---|
| CR-01 successful write followed by failed read reports opposite preference and failed save | OPEN; actual-source bidirectional probe in FAILURE-ANALYSIS | 15.1;16.1–2;19 review | Both initial values; inspect storage, checkbox, copy, markers and retry jointly; named confirmed-write mutation fails intended assertion |
| WR-01 malformed English blamed as unsupported | OPEN; raw `' en'`, `'en '`, `' en-GB '`, `'en_US'` examples | 17.1 | Every example yields structural uncertainty and zero tint; no raw paint-set broadening; genuine non-English control |
| WR-02 unbounded storage/query queue | OPEN; parked read produces no worker reply at 5500ms | 16.1–3 | Park each await independently, include queue admission/overflow and event projection; truthful reply, no overlapping native write, late recovery |
| WR-03 local constant comparison overclaims total deadline | OPEN; old test checks 5000>2000 only | 16.2;18.3 | Actual popup/worker/content timing across sequential waits and backlog; named whole-operation failure |
| WR-04 runner treats execution failure as kill | OPEN; nonexistent suite reproduced 1/1 killed exit0 | 18.1;19.1 | Missing suite, zero tests, parse/import error, spawn error, timeout/signal, malformed JSON and unrelated assertion all fail gate; real intended assertion alone kills |
| WR-05 normal test command does not validate registry | OPEN; default test script bypasses CLI | 18.2–3 | Wildcard-discovered registry suite rejects stale literal/count/path/duplicate/unsafe entry on in-memory controls; no expensive mutant subprocess in default path |
| WR-06 happy-dom cannot prove Chrome language selector | OPEN; right-padded English diverges | 17.1–2 | Exact nonempty four-rule source check plus real Chrome synthetic computed-style/diagnosis matrix; unavailable browser is non-zero, never pass |
| IN-01 unreachable serializePreference rejection handler | PENDING technical disposition | 16.3 | Remove or accurately document unreachable branch; test actual rejection recovery rather than an impossible branch kill |
| IN-02 primary acceptance scope omits supplemental locale contexts | PENDING evidence-schema correction | 20.1 | Exact scope.html_lang='en' and scope.html_lang_variants=['en','en-*','non-English']; no fabricated observation; regional English cannot satisfy non-English slot |
| IN-03 refresh has no in-flight ownership guard | OPEN race surface | 16.1–2 | Focus/open/change overlap and late stale response cannot overwrite current request; busy state clears truthfully |
| IN-04 redundant CSS i flag | RETAIN defensive source convention; not behavioral protection | 17.1;18.2;19.3 | Reviewer distinguishes exact-source contract from browser behavior; deleting redundant flag is never claimed as behavioral kill |
| IN-05 no prescribed tsc/JSDoc tooling | CARRIED unmet tooling suggestion, no new packages authorized | 19.3 | Report explicitly that tsc did not run; independent review determines whether any concrete correctness defect needs repair within installed tooling. No fabricated type-safety pass |

## Historical review pass 1 findings

Reference: `git show bc25a2c:.planning/phases/04-honest-failure-and-an-off-switch/04-REVIEW.md`; repairs recorded in 04-07–04-14 summaries. “Previously repaired” is not fresh certification after this round changes shared code.

| Finding | Historical evidence / current disposition | Plan coverage | Independent recheck or reason |
|---|---|---|---|
| CR-01 English regional locales refused | 04-07 raw en/en-* fix retained | 17;19 | Supported family + exact English labels; actual Chrome synthetic agreement |
| WR-01 stale repaint oracle cannot fail | 04-12 response-side hold and guards; two individual sites redundant | 16.3;18.2;19 | Late captured response and native-action completion; explicit mechanism supersession for WINDOWS20/21 |
| WR-02 request-id/shape guards untested | 04-13 targeted assertions/registry | 16.2;18.2 | Wrong id/pair/type/extra-field refusal including new saved:null consumer contract |
| WR-03 lastError not exercised | 04-08 rejected-with-values seam | 16.2;18.2 | Value object plus lastError must remain failure; intended assertion uniquely identified |
| WR-04 silent document wedges writer | 04-08/10 local bounds incomplete | 16.1–3 | Whole request and projection budgets, raw side-effect exclusion and late content callback generation |
| WR-05 diagnosis/reason pairing untested | 04-13 five-encoding agreement | 16.2;18.2;19 | Exact pairs and clean fallback survive enum changes; no stale icon under mismatched title |
| WR-06 serialization/closed-tab blind spots | 04-14 serialization fixed; closed-tab claim still unmet | 16.3;18.2;19 | Physical pending-write count; no recreated closed-tab entry; attempted versus committed paint and neighbour isolation |
| WR-07 failed-save UI/focus | 04-10 lastConfirmed repair introduced pass2 CR-01 | 15;16.2;20.2 | Full joint outcome matrix and actual keyboard judgment; no expected-value copy of observed defect |
| WR-08 CSS priority | 04-07 four important declarations | 17.1;19 | Preserve declaration/source and host-style dominance positive controls |
| WR-09 workload mode and no-extension baseline | 04-09 strict mode/dormant seam | 17.2;19;20.1 | Invalid mode non-zero; dormant loads real confirmed-off runtime; seven fresh same-identity runs |
| WR-10 fake assertion swallowed by production catch | 04-08 external forbidden array | 16.1;19 | Record forbidden API violations outside catch; injected contract breach must fail test |
| IN-01 defensive subframe guard unreachable with all_frames:false | Retain defense, no false individual-guard kill | 19.1 | Confirm manifest/frame boundary; redundant mechanism labelled honestly |
| IN-02 world key newer than Chrome106 floor | CARRIED compatibility qualification; ISOLATED default on106–110, explicit key111+ | 19.1 | Reviewer preserves actual compatibility claim; no unsupported assertion that world declaration enforces106 |
| IN-03 only32px icons | Accepted recorded Phase4 artwork choice; store sizes Phase5 | 19.3;20.2 | Current distinct-icon visual acceptance; no scope expansion to store assets |
| IN-04 worker reacts to all tabs | Intentional permission-constrained identity-only handshake | 16.3;19.1 | No URL/title reads or leakage; neighbour isolation and bounded projection resources |
| IN-05 popup snapshot can lag settled toolbar | CARRIED presentation limitation; reopen/focus refresh in current source | 16.1–2;19.1 | Reviewer tests settle-after-popup and assesses request-time snapshot against real requirement. Any actual false outcome uses local repair packet; no unsupported claim of continuous subscription |
| IN-06 absent type-safety mechanism | Same as pass2 IN-05 | 19.3 | No new package install or invented tsc execution |
| IN-07 chrome-harness read count/drain hygiene | PENDING independent current-source assessment | 19.1–2 | Count dispatch attempts honestly; adversarial requeue must terminate with bounded failure. If still unsafe, explicitly amend a local chrome-harness/test packet before repair |
| IN-08 predecessor revision literal not independently derived | PENDING evidence-provenance check | 20.1;20.3 | Compare Phase3 predecessor identity to its own preserved record/Git evidence, not duplicate literals; preserve Phase3 status and observations |
| IN-09 document parameter shadows global | Retain existing pure inspection argument; naming-only suggestion | 19.1 | Current fresh-DOM/lifecycle tests establish behavior; no unrelated rename solely for style |

## WINDOWS and verification-history dispositions

| Entry / artifact | Current finding | Planned disposition and independent acceptance |
|---|---|---|
| WINDOWS1–7 | Prior phases, including stale historic metadata | Out of this runtime repair; preserve records and Phase3 human_needed. Do not silently close them |
| WINDOWS8–10 | Historical inherited harness failures | Previously fixed in04-06; 19/20 full default suite must confirm current integration, no new repair claimed |
| WINDOWS11 | Operational copy ratification table/JSON disagreement | UAT21 genuinely ratified the two strings; preserve correct paths in15/16. 20.3 reconcile current ledger representations with that evidence, no new consent invented |
| WINDOWS12 | AR-04-01 and SDK accepted-risk kind incompatibility | Preserve authentic two-scenario waiver and honest status; do not expand it or treat it as live evidence. 20.3 maintains consistent ledger representation without unrelated CLI repair |
| WINDOWS13 | Runtime byte binding stale after repairs | Expected interim only; 20.1 final binding after19 review. No phase-wide green while it fails |
| WINDOWS14 | Saved application failure copy unreachable due unavailable precedence | 15/16 outcome table must make copy truthful; 19 directly tests silent/negative apply, not a made-up diagnosis. Current disclosure alone does not close it |
| WINDOWS15 | Mixed performance identity | Historical04-11 regenerated; upcoming new source needs fresh seven-run output20.1. Preserve existing archive and prior committed sample identity |
| WINDOWS16 | Popup5000 vs proposed2000 | Retain transport fallback5000;16 proves4000 admission deadline and every wait. Numeric comparison is secondary evidence |
| WINDOWS17 | Focus-guard mutant replaced unreachable disabled guard | Keep actual discriminating focus-restoration assertion;18 labels evidence kind and independent19 recheck. No impossible syntax-specific promise |
| WINDOWS18 | Toggle test changed outside former scope and asserted bad result | 15/16 explicitly own all affected consumer tests; both-direction storage/UI oracle rejects that false expectation |
| WINDOWS19 | No-pressure ratification predates popup repair | Existing judgment retained qualified;20.2 genuine current-build judgment or flagged-unverified remains |
| WINDOWS20/21;04-12 truth1 | ANY ONE guard deletion cannot all be observed | 16.3/18.2 measure current mechanism;19 independently justifies a narrow current-contract supersession against FAIL-05/staleness or leaves unresolved. Preserve old plan and survivor evidence; disclosure is not mitigation |
| WINDOWS22;04-14 truth4 | Closed-tab projection recreates state and attempts paint | 16.3 repairs ownership and faithful Chrome refusal model; retention/committed-paint assertions required.19 judges old truth against real requirement; source-shape cleanup cannot count as behavioral proof |
| VERIFICATION requirement-status finding | Stale: already corrected39bcfcc | Do not repeat repair.20 adds negative promotion guard and post-bookkeeping check; all seven currently unchecked, five Gaps Found/two Pending |
| Old requirements-completed arrays | Executed summaries overstate acceptance | Preserve immutable history;19/20 consume canonical evidence and guard automatic re-promotion |
| Fourteen old live attestations | Preserved under history/2026-09-10-before-review-repair | Never rebind to new hashes;20.2 needs authentic ACK-04-01 and genuinely new observations |
| Seventeen current live slots | All current-source pending at baseline |20 after runtime, independent reviews and final binding. Waived two remain pending; other unavailable scenarios do not inherit waiver |
| AR-04-01 | language-icon-copy and structure-copy accepted risk only | Preserve exact scope and human_needed; no fabricated passes, new transaction-limit consent is separate15 checkpoint |
| Phase3 acceptance/profiling | human_needed28/34;11passed9pending; user deferred live work | Preserve existing boundary; no Phase4 test/summary upgrades it |

## Multi-source coverage audit

| Source | Item | Current interpretation / plan coverage | Status |
|---|---|---|---|
| GOAL | ROADMAP Phase04 user story and retained original outcome |15/16 trustworthy control,17 honest diagnosis,19 review,20 visible/live evidence | COVERED |
| REQ | FAIL-01 | Three product diagnoses plus ratified operational states;17/19/20 | COVERED; evidence pending |
| REQ | FAIL-02 | Certain missing-column popup hint;17 regression of D01/D02,19 direct review,20 missing/settle observation | COVERED; evidence pending |
| REQ | FAIL-03 | No false missing/language claim;17 malformed/raw-family truth,19 review,20 AR waiver remains separate | COVERED; waived live slots pending |
| REQ | FAIL-05 | Distinct icon and accurate current-tab projection;16.3/17/19/20 | COVERED; evidence pending |
| REQ | CTRL-02 | Truthful popup switch across known/unknown outcomes;15/16/18/19/20 | COVERED; decision/live gates pending |
| REQ | CTRL-03 | Default-on sole boolean, restart/read/lifecycle truth;16/19/20 | COVERED; native epoch limit explicit |
| REQ | CTRL-04 | Immediate current-view off/application acknowledgment;15/16/19/20 | COVERED; actual visual cleanup pending |
| CONTEXT | D-01 | Header/row witness plus100ms quiet interval, no early missing claim;17.1/19.1/20.2 | COVERED, retained |
| CONTEXT | D-02 | Blank is working with honest popup nuance;17.1/19/20.2 | COVERED, retained |
| CONTEXT | D-03 | Popup-only hint, no page diagnostic;17/19 privacy review/20.2 | COVERED, retained |
| CONTEXT | D-04 | Shared cannot-read icon, evidence-based language versus structure;17.1 | COVERED |
| CONTEXT | D-05 | Storage-only permission, exact Zendesk static match, no new permission;16/19 | COVERED, retained |
| CONTEXT | D-06 | Exactly one boolean, no ticket data/network/telemetry/build;16/18/19 | COVERED, retained |
| CONTEXT | D-07 | CSS-only four-color palette and owned attribute;17.1/19 | COVERED, retained |
| CONTEXT | D-08 | Later recorded raw en/en-* source contract and exact English labels;17/19/20. Old bare-en wording explicitly superseded by04-07 evidence | COVERED |
| CONTEXT | D-09 | Mutation-driven discovery, no route hooks |16.3/17/19 | COVERED, retained |
| CONTEXT | D-10 | Persistent user preference independent of pause/freeze |16.2–3/19/20 | COVERED |
| CONTEXT | D-11 | Status panel and one switch; no settings page |15 checkpoint/16/19/20 | COVERED |
| CONTEXT | Old unresolved toolbar/toggle/popup choices | Ratified04-DECISIONS distinct-icons/global-local/concise-no-link; preserve actual evidence |15/16/17/19/20, not reopened |
| RESEARCH | Separate evidence, preference, readiness, lifecycle and presentation | Full joint outcome table and oneboolean model |15/16/19 COVERED |
| RESEARCH | Quiet window/fresh DOM/no churn | Existing100ms mechanism and negative cases retained |17/19/20 COVERED |
| RESEARCH | Disposable worker/current-frame adapter | Exact sender/frame/id/pair gates; no persisted diagnosis or keepalive |16/18/19 COVERED |
| RESEARCH | Stale replies, navigation and closure | Absolute observation budgets, late-native reconciliation, epoch-faithful harness |16.3/18/19 COVERED |
| RESEARCH | Startup/read errors and desired-value serialization | Failures not absence; physical writes excluded until callback; generation-aware content reads |15/16/18/19 COVERED |
| RESEARCH | Native failure/cleanup truth | Acknowledged save versus current application, no cancellation fiction |15/16/19/20 COVERED |
| RESEARCH | Strict privacy harness / finite enums | Violations outside catch; exact allowed APIs and finite reply extension |16/18/19 COVERED |
| RESEARCH | Chrome compatibility | Keep106 documentId floor; qualify world-key enforcement per historicalIN02 |19 COVERED |
| RESEARCH | Existing stack/wildcard/discovery | Installed Vitest/happy-dom, Node/CDP only; new test files auto-discovered |17/18/19 COVERED |
| RESEARCH | Historical source and final validation | Immutable history, final review before binding/UAT, separate technical and human gates |19/20 COVERED |

Actually excluded: store publication, privacy-policy/submission work, extra icon sizes for the store, additional language-label support, palettes/treatments/dark mode, options pages, Phase3's human backlog, new package installs and new external services. These exclusions come from recorded phase boundaries or the current explicit installed-packages constraint, not planner difficulty judgments.

The old RESEARCH Open Questions are superseded for gap planning as follows: question1's three product choices were actually ratified in04-DECISIONS, so they are not reopened; question2's real Chrome action/multi-tab/visual evidence is the04-20 human gate, with Phase3 untouched; question3's permanent native attribute-removal failure remains a disclosed platform limit, and16/19 must prove failed cleanup never receives a successful application acknowledgement. The old architectural table's “Popup writes” recommendation is also superseded by the shipped worker-only preference writer. Popup requests intent, worker alone calls local.set, content observes/applies, and Chrome storage owns the boolean. No new source of truth is introduced.

## Seven spec-less flagged assumptions

Fresh `/tmp/zhroma-gap-edge-probe.json`: applicable7, resolved0, unresolved7; each item has verification/resolution/reason=null. These exact classifications stay unresolved at planning time. A test plan is not classifier resolution.

| Requirement | Category | Status | Explicit assumption / planned evidence |
|---|---|---|---|
| FAIL-01 | unclassified | unresolved | Three-state semantics need actual behavioral and visual evidence;17/19/20 |
| FAIL-02 | unclassified | unresolved | Real mount timing may defeat certainty;17 preserved settle cases,19 challenge,20 live missing/settle |
| FAIL-03 | unclassified | unresolved | Unsupported/malformed language presentation needs evidence;17 synthetic proof and20 still-pending waived live cases |
| FAIL-05 | unclassified | unresolved | Artwork distinguishability is a browser/user judgment;16 technical projection and20 observation |
| CTRL-02 | unclassified | unresolved | Popup must reflect authoritative intent under every outcome;15 decision,16 matrix,20 judgment |
| CTRL-03 | unclassified | unresolved | VM recreation is not real browser restart;16 epoch limits and20 actual restart checks |
| CTRL-04 | unclassified | unresolved | Marker removal alone does not prove real visual cleanup;16 joint oracle and20 live observation |

## Prohibitions and authority

The three original04-05 bespoke prohibition statements are copied verbatim into04-20 must_haves.prohibitions with status unresolved and no invented check_kind/check_target/check_rule. Existing UAT18–20 judgments are authentic history, not blanket current-byte acceptance. WINDOWS19 specifically qualifies the no-pressure judgment after popup changes.20.2 may resolve a current judgment only from the user's actual response; otherwise flagged-unverified remains. No-prompt/no-ticket-data security checks continue separately.

The three additional04-11 warnings (language-family honesty, unconfirmed preference, overclaimed tests) are technically covered by17,15/16 and18/19 respectively. Their historic must-haves are not silently marked resolved;20 independent goal verification cites actual evidence and any residual/native limits.

## Active planner contributions and discovery

The active planner contributions in `/tmp/zhroma-plan-pre.json` were consumed verbatim: API coverage, assumption delta, schema gate and security. Existing `COVERAGE.md` declares no external-service integration; local Chrome platform calls do not create a new service API scope. Assumption-delta detected:false, so no advisory identity-model checkpoint is fabricated. No ORM/schema files or pushes are in scope. ASVS1 high/critical block is represented in every plan; no dependency install means no package-install legitimacy checkpoint.

Research is skipped for --gaps because existing RESEARCH/PATTERNS and the current source-bound platform analysis provide the needed context; no new library is selected. UI gate returned block:false without UI-SPEC; no UI spec is invented. Drift prechecks passed. Calibration factor1/sample_count0/confidence low. MVP/tracer/reversibility enabled and coarse granularity respected through six bounded concern plans. Project and installed planner instructions were read; no project skill/graph added.

## Final exit ledger to fill during execution

| Gate | Evidence required | Baseline status |
|---|---|---|
| Runtime outcome truth | Both-direction joint table, every wait/admission stage, physical late-effect and epoch controls | OPEN |
| Mutation sensitivity | Green control; intended assertion failures; execution faults rejected; default registry check | OPEN |
| Independent code/security | Whole integrated source plus concrete counterexamples and rechecks | OPEN |
| Final validator/tool review | Negative controls and exact validation-only diff reviewed before UAT | OPEN |
| Source/timing binding | Final reviewed recursive11 assets and7 measured synthetic runs | PENDING final source |
| Human acceptance | Genuine loaded-source confirmation and observed check rows |17 pending at baseline |
| Accepted risk | Existing AR-04-01 two live scenarios, separate proposed native-limit decision | AR exists; new decision pending |
| ACK-04-01 | User's actual acknowledgement of preserved-but-invalidated14 attestations | PENDING |
| Canonical bookkeeping | Evidence-supported requirement fields after SDK updates; independent goal verdict | Existing correction preserved; final guard pending |

Final reporting must state technical completion, independent review, human observations, accepted risks and unresolved items separately. If independent review finds a new counterexample, repair/retest within the bounded local loop or report the concrete blocker. Neither reaching the end of a plan nor exhausting a review-cycle bound permits an all-clear.
