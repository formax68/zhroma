---
phase: 04-honest-failure-and-an-off-switch
reviewer: Codex independent gsd-code-reviewer
reviewed: 2026-09-11T09:13:01.858Z
depth: deep
review_pass: 3
review_stage: final_attempt_2
reviewed_revision: 255ba31e2b25f7b8c5bde8a3900fb93151594f50
runtime_revision: 31ed0716a0da44a3004bb961c6d89fa1f9836bd9
files_reviewed: 65
files_reviewed_list:
  - extension/background.js
  - extension/content.js
  - extension/icons/missing.png
  - extension/icons/neutral.png
  - extension/icons/off.png
  - extension/icons/unreadable.png
  - extension/icons/working.png
  - extension/manifest.json
  - extension/popup.html
  - extension/popup.js
  - extension/zhroma.css
  - package-lock.json
  - package.json
  - scripts/fixture-contract.js
  - scripts/interaction-evidence.js
  - scripts/run-tint-workload.js
  - scripts/sanitize-fixture.js
  - scripts/sanitized-output-contract.js
  - scripts/sensitive-patterns.js
  - scripts/verify-locale-rendering.js
  - scripts/verify-mutation-kills.js
  - scripts/verify-recon-gate.js
  - test/extension/chrome-harness.js
  - test/extension/diagnosis.test.js
  - test/extension/failure-seam.test.js
  - test/extension/harness-reliability.test.js
  - test/extension/initial-tint.test.js
  - test/extension/live-acceptance.test.js
  - test/extension/locale-rendering.test.js
  - test/extension/mutation-gate.test.js
  - test/extension/mutation-registry.test.js
  - test/extension/performance-harness.test.js
  - test/extension/persistent-tint.test.js
  - test/extension/phase-03-live-acceptance.test.js
  - test/extension/phase-04-live-acceptance.test.js
  - test/extension/popup-recovery.test.js
  - test/extension/preference-outcome.test.js
  - test/extension/runtime-contract.test.js
  - test/extension/toggle.test.js
  - test/extension/toolbar-popup.test.js
  - test/extension/tracer-world.js
  - test/extension/worker-integrity.test.js
  - test/fixtures/manifest.json
  - test/fixtures/zendesk-view-grouped-long.html
  - test/fixtures/zendesk-view-priority-absent.html
  - test/fixtures/zendesk-view-priority-present.html
  - test/mutants/failure-seam.mutants.json
  - test/mutants/harness-reliability.mutants.json
  - test/mutants/locale-honesty.mutants.json
  - test/mutants/popup-recovery.mutants.json
  - test/mutants/preference-outcome.mutants.json
  - test/mutants/worker-boundary.mutants.json
  - test/mutants/worker-lifecycle.mutants.json
  - test/mutants/worker-staleness.mutants.json
  - test/performance/tint-workload.html
  - test/performance/tint-workload.js
  - test/recon/corpus-provenance.test.js
  - test/recon/dependency-approvals.smoke.js
  - test/recon/fixture-contract.test.js
  - test/recon/interaction-evidence.smoke.js
  - test/recon/recon-gate.smoke.js
  - test/recon/sanitize-fixture.test.js
  - test/recon/sanitized-output-contract.test.js
  - test/recon/sensitive-patterns.smoke.js
  - vitest.config.js
findings:
  critical: 0
  warning: 2
  info: 0
  total: 2
plan19_actionable_findings: 0
deferred_findings: 2
runtime_blockers: 0
status: issues_found
technical_verdict: clear_for_04_20_evidence_work
runtime_digest: 46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065
tests_digest: a48ee5a0fdfd6d7792879d22c557fceb34b8a221d23833d1c7f2e90bbd49fb66
tools_digest: f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323
---

# Phase 04 independent code review — final pass 3

## Narrative Findings (AI reviewer)

**All four pass-3 repair findings are closed on the reviewed source. Plan 19 has zero remaining actionable findings and no identified runtime blocker.** The two warnings counted above are existing, explicitly deferred acceptance-validator defects (pass-2 IN-02 and pass-1 IN-08), owned by 04-20. They are not new repair-cycle findings and are not fixed by this verdict. Hence the overall report remains `issues_found`, with a qualified technical-clear handoff to evidence work, rather than a claim that the whole phase or default suite passed.

The final reviewed code identity is **255ba31e2b25f7b8c5bde8a3900fb93151594f50**. The later 783b5a1 commit records measurements only. Runtime last changed at 31ed071. Independently recomputed final hashes cover 11 runtime/assets, 42 test/fixture/registry files and 12 tool/package/config files. The complete path inventory is in frontmatter and all per-file hashes are recorded below and in [04-19-MEASUREMENTS.json](04-19-MEASUREMENTS.json).

Review covered the integrated content/worker/popup call chains, lifecycle ownership, DOM diagnosis and marker effects, permission and data boundaries, actual-source harness behavior and assertions, mutation runner and registries, synthetic locale/performance tooling, acceptance validators and supporting corpus/package inventory. Older recon tests were assessed as supporting corpus/provenance checks, not reclassified as Phase-4 runtime or live evidence. No test total, source grep, historical summary or binary digest alone is treated as semantic proof. Browser rendering and live acceptance remain separate; no live UAT, package installation, remote service, source/test/tool edit or commit was performed by this reviewer.

Project AGENTS.md and project skill directories were absent. The configured reviewer skill query returned no project skills; the GSD reviewer workflow/bootstrap supplied the review boundary. Current approved decisions take precedence over obsolete stack recommendations. Read/Write tools were unavailable; reads used exec_command and only this report was written with apply_patch.

## Repair findings and independent rechecks

| Finding | Classification | Final disposition |
|---|---|---|
| CR-19-01 | BLOCKER, repaired | Resume clears preference readiness before reconciliation; independently closed at 199e642. |
| CR-19-02 | BLOCKER, repaired | Separate document lifetime plus fresh bounded diagnosis reject old-document and same-document stale outcomes; independently closed at 31ed071. |
| CR-19-03 | BLOCKER, repaired | Post-action generation check plus write epoch prevent stale diagnosis and stale confirmed checkbox; independently closed at 31ed071. |
| WR-19-01 | WARNING, repaired | Finite callback-delivery budget reports endless requeue without wedging the test worker; independently closed at 255ba31. |

### CR-19-01 — restored content could repaint an obsolete ON preference

**File:** `/Users/mike/code/zhroma/extension/content.js:408`.

Original independent trace: boot ON; pagehide/freeze; persist OFF and emit change while frozen; thaw; hold content-read; pageshow. Before repair storage was false while four priority markers reappeared and one read remained pending. A stalled read could preserve that stale paint. This was preventable content JavaScript, not an approved native-effect residual.

RED4965287 and GREEN199e642 added `preferenceReady = false` before clearing suspension and syncing. Independent four-way initial/current-boolean probes now produce no markers while the resumed read is held, then exactly the fresh boolean's markers after release. The preference-outcome/toggle run passed **228/228**; `resume-read-readiness` independently produced **KILLED 1/1**, at `[review:resume-unconfirmed-no-markers]`, after a green baseline. Failed reads and a newer OFF defeating a held resumed ON are covered. No further repair is proposed.

### CR-19-02 — a captured application acknowledgement could return a stale diagnosis

**Files:** `/Users/mike/code/zhroma/extension/background.js:242`, `:257`, `:379`.

Original trace: boot OFF; hold content-response; request ON; hide old document; emit loading and attach a replacement; release the captured apply response. Before the lifetime repair, storage was true, replacement markers were empty, toolbar was Checking, but the popup newly reported working with `saved:true,enabled:true,applied:true,status:working`. Packet 2 added state/lifetime ownership and fixed navigation, closure and reused tab IDs.

The first recheck found the remaining same-document case: while the successful application reply was held, replace the body with an empty view. At028265e the response still reported working although the current document and toolbar were already neutral. Historical application success did not certify the old diagnosis.

Attempt 2 now obtains a fresh status after a successful apply acknowledgement. It checks the same tab-state object/document lifetime after that wait, and the status handshake checks projection generation. At most two observations allow a queued own-apply invalidation; both spend the original admission deadline. An unavailable or repeatedly invalidated observation yields no current application confirmation.

Independent final trace in **both directions**: hold application reply, remove the table, release into another held fresh-status response, introduce a second complete-event invalidation, then release. Results were `saved:true,enabled:true,applied:true,status:neutral` with Checking for ON, and `saved:true,enabled:false,applied:true,status:off` for OFF; markers were empty and forbidden channels absent. Responsive and held fresh-status cases pass the durable **response elapsed <=4000 ms** assertions. Normal successful own invalidation remains a positive control; navigation/closure/reuse remain refused. `apply-fresh-diagnosis` independently produced **KILLED 1/1** at `[review:apply-current-diagnosis]`. No further repair is proposed.

### CR-19-03 — waits could turn old popup observations into newly confirmed state

**File:** `/Users/mike/code/zhroma/extension/background.js:361`.

Original trace: boot ON; hold icon; open another popup; remove the content table; release icon. The toolbar recovered to neutral but the popup newly returned working. Packet 2's post-action generation recheck fixed this diagnosis case.

The next independent counterexample completed an opposing OFF write while the first popup's icon awaited. At028265e the first reply returned `status:unavailable,enabled:true` after this worker had saved and applied OFF. `pendingWrite` was already null, so it did not invalidate the captured boolean.

Attempt 2 records a worker-local write epoch when popupStatus begins and advances it whenever a write is issued. It checks that epoch after asynchronous waits, including unavailable-tab/read branches, and conservatively returns nullable uncertainty when a write intervened. This is an ephemeral ownership marker, not another persisted setting.

Independent final icon/title probes, each in **both directions**, completed the opposite save before releasing the wait. All four returned `enabled:null`, a mixed disabled control and the approved unknown line; storage held the completed opposite boolean. Forbidden channels were empty. The durable tests also cover readable/neutral views, physical callback settlement and fresh-focus recovery. `popup-write-epoch` independently produced **KILLED 1/1** at `[review:post-wait-preference-certainty]`. No further repair is proposed.

### WR-19-01 — an endless reentrant Chrome delivery could hang the harness

**File:** `/Users/mike/code/zhroma/test/extension/chrome-harness.js:168`.

Original independent child probe queued a read whose callback queued itself and called flush. The unbounded synchronous drain required supervisor termination: status null, SIGTERM, ETIMEDOUT at1000ms. An ordinary asynchronous Vitest timeout could not interrupt that event loop.

Final flush has a default1000 delivery budget, validates positive integer caps before delivery, processes FIFO and throws a stable limit error with undispatched work preserved. Independent cap-one/reentrant probe produced seen=[1], pending=2 on error; a later cap-two flush produced [1,2,3], pending=0. A separate throwing-callback control preserved the next callback and delivered it on a later flush.

Independent harness/runtime-contract/registry run: **34/34**. `harness-drain-bound` independently **KILLED 1/1**: the mutated child timed out with status null, which failed `[harness:bounded-drain]`; timeout is not green. `request-id-echo` independently **KILLED 1/1**. The registry note now accurately separates request identity, document lifetime and fresh diagnosis. Read-attempt counting already increments before synchronous API failure. No further repair is proposed.

## Deferred warnings — existing 04-20 ownership

### Pass-2 IN-02 — locale evidence can certify the wrong language scenario

**Classification:** WARNING; deferred to04-20, unimplemented.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:56`, `:204`.

The fixed scope still requires bare `html_lang:en` and has no `html_lang_variants` representation, while the non-English check only excludes the exact string `en`. Thus `en-GB` can occupy the supposed non-English slot, despite being supported by the runtime. The regional check alone does not correct the opposite slot. This weakens acceptance evidence, not the current runtime's raw language predicate.

**Fix:** In04-20, make scope/observed language variants explicit, reject the entire English primary-subtag family in non-English evidence, and add negative controls for en-GB/en-US/mixed-case English and inconsistent scope. Preserve unavailable language observations and AR-04-01 as accepted risk, never fabricated live proof.

### Pass-1 IN-08 — predecessor metadata has unverified fixed literals

**Classification:** WARNING; deferred to04-20, unimplemented.
**File:** `/Users/mike/code/zhroma/test/extension/phase-04-live-acceptance.test.js:145`.

priorSourceFacts reads predecessor status/counts but hardcodes its revision, verification fraction and UAT execution description. Equality against that object cannot independently validate those hardcoded facts if the predecessor artifacts change.

**Fix:** In04-20, verify/bind those facts to the actual predecessor artifacts and immutable revision, with negative tests for contradictory revision/count/status claims. Keep the legitimate archived Phase2/3 source hashes pinned; do not rebind their observations to current runtime.

These two warnings predate this repair cycle. The known stale Phase4 shipped-byte record is a separate expected evidence-binding task, not a newly discovered runtime failure.

## Integrated semantic assessment

Content inspects the current candidate and commits markers in one synchronous turn. It refuses ambiguous/malformed topology, unknown nonempty priorities and unsupported/malformed shells; missing-column certainty needs a valid row witness and unchanged quiet window. Group rows are excluded from paint without hiding nested foreign topology. Observer delivery removes invalidated markers before deferred positive work; marker-copy adoption and owned-row release cover replacement and detachment. Permanent native removal failure remains an approved disclosed limitation and does not receive a successful apply acknowledgement. Paused/hidden/frozen lifecycle and resumed fresh-read readiness remain distinct inputs.

The worker is the only preference writer. Admission is bounded at32 and every request gets its own4000ms arrival deadline, including queue time; expiry does not release an issued native writer. The raw callback retains exclusion, including after the requester has received uncertainty. A queued expired request does not dispatch later. Readback, successful save and application are separate facts; readable opposite values take precedence over requested intent. A reopened popup while a writer remains physically unresolved stays unconfirmed. The popup's5000ms transport fallback is separate and cannot turn a timeout into definite failed saving.

Every worker observation/action wait was traced through its caller: activeTab/liveTab, raw write, worker preference read, apply acknowledgement, fresh status and optional one retry, projection read/status, and icon/title continuation. Deadline checks prevent new work after expiry; state/lifetime checks reject replaced documents; generation checks reject invalidated observations and stale follow-on artwork. Already-issued native effects are not described as cancelled. Per-tab action ownership survives observation expiry and reconciles afterward; other tabs remain independent.

The strict tracer separates delivery delay from captured-response delay; otherwise a supposed stale-response test would recompute fresh content and prove nothing. It distinguishes write commit from callback settlement, attempted action from committed action, tab numeric ID from native target incarnation, and old worker native effects from dead JavaScript dispatch. The model is synthetic and finite, not a guarantee of every Chrome scheduling choice. Two-popup/two-tab/window/no-current-window, frozen/resume, closed/reused-tab and recovery tests exercise the observable contract.

Runtime boundaries admit fixed protocol shapes, request IDs, sender identities and paired diagnosis/reason values. Payloads carry no DOM, ticket text, URL, language string or raw error. Popup output uses fixed textContent and its single switch; it never accesses storage. Content writes only reserved marker attributes. The manifest stays top-frame isolated static injection with storage permission only. Five local32px PNG alpha silhouettes encode check, column-plus, question, ring and power shapes; byte/shape checks do not replace the pending human judgment of distinguishability at toolbar size.

Synthetic locale tooling validates an exact16-case matrix and independent CSS selector/paint counts, refuses missing browser/source/empty evidence, and owns a fresh loopback Chrome/profile rather than attaching to a user's browser. Runtime raw en/en-* gating is separate from trimmed/underscore normalization used only to choose refusal reason. CSS maintains four direct-cell background declarations; the redundant ASCII i flag is a defensive source convention, not claimed behavioral mutation sensitivity. Current-source real Chrome locale/performance measurements belong to04-20.

Performance workload uses strict enabled/disabled/dormant modes: disabled loads no runtime, dormant loads it with stored false. These are not interchangeable evidence. Timing validation checks operation/sample shapes and same-source/environment merging; six enabled/disabled size runs and the extra dormant case do not substitute for human layout/retention inspection. Supporting sanitization/corpus tools parse inertly, constrain paths and admitted structure, scrub text/reference attributes and emit value-free rejection codes. Fixture and package inventories remain test/developer-only; no tool is shipped.

## Independent outcomes and verification attribution

The original successful-write/failed-read joint traces were independently executed in both directions through actual shipped worker/content/popup, not mocked presentation:

| Start/request | Observation | Whole storage / checkbox | Markers | Complete outcome |
|---|---|---|---|---|
| true→false | worker/content read rejected | {enabled:false}; false, enabled, not mixed | none | saved=true, enabled=null, applied=false; saved/not-applied copy |
| false→true | worker/content read rejected | {enabled:true}; true, enabled, not mixed | none | saved=true, enabled=null, applied=false; saved/not-applied copy |
| true→false | readable opposite true | {enabled:true}; true | four priorities | saved=true, enabled=true, applied=true, working |
| false→true | readable opposite false | {enabled:false}; false | none | saved=true, enabled=false, applied=true, off |

Forbidden channels were empty. These validate the pass-2 CR-01 fix and preserve the distinction between read failure and absent-key default. The repaired worker's new fresh status is reached only after applied=true, so rejected content reads retain that failure path.

Independent runs across this review:
- Initial prescribed preference-outcome/mutation-gate:234/234.
- Packet1 preference-outcome/toggle:228/228 plus resume mutant1/1.
- Original packet2 four suites:356/356, which did **not** catch the adjacent remaining defects. Their limitations are retained below.
- Attempt2 packetA four suites:368/368,16.35s; both new mutants separately intended-killed.
- Attempt2 packetB three suites:34/34; harness-drain-bound and request-id-echo separately intended-killed.
- Final targeted behavioral lifecycle/privacy recheck:12 passed,114 deliberately unselected, across toolbar-popup/runtime-contract. Includes five held-stage closures, repeated create/close/reuse, reused-incarnation pending paint, neighbour/dead-event retention, three terminated-worker native-effect cases and strict-harness tripwire behavior.

Executor full evidence, inspected in04-19-MEASUREMENTS.json and **not mislabelled as an independent rerun**:
- Full registry:39 unique intended behavioral kills out of39, exit0.
- Prescribed six suites:423/423, exit0.
- Default npm test:65/65 Node smoke;941/942 Vitest. The sole failure is the known Phase4 live-record binding to current shipped bytes. **The default suite is not all green.**

Independent runner controls earlier in this same review used a disposable minimal repository: clean intended mutation KILLED, equivalent green mutant SURVIVED, and an unrelated differently labelled failure in the intended test GATE_ERROR/intended-assertion-not-proven. The runner source/tools digest is unchanged. Process error/signal, missing/invalid report, runner errors, skipped/missing target, suite load failure and non-assertion failure cannot satisfy the kill predicate. Registry schema/find-count checks run in the default suite. No external package or tsc run is claimed.

## Historical mutation promises and closed-tab truth

**04-12 ANY ONE is superseded narrowly, not retroactively fulfilled.** The old plan required each generation guard independently killed. Equivalent redundant guards cannot all satisfy that promise. The current requirement is observable correctness under invalidation, not mutation sensitivity of every syntactic clause.

Independent final remeasurement with the exact historical04-18 entries and current runner yielded:
- `popup-copy-fallback`: **SURVIVED**. Both popup response paths require validStatus, including COPY pair membership, before calling render. Other render calls use fixed legal neutral/unavailable pairs. Therefore the malformed pair used by the historical target never reaches the fallback it deletes. The incoming validation/pairing mechanism is the relevant boundary; registry popup-valid-gate/diagnosis-pairing and malformed-reply tests target it. No individual fallback kill is claimed.
- `project-guard-after-preference`: **SURVIVED**. After this guard, bounded dispatch and applyAction/drainActions recheck the same ownership and expiry before issuing native effects. Removing one upstream repeated check cannot produce a stale committed paint while those downstream checks hold. Generation mechanism mutation, action-between-writes mutation, stale-response tests and current ownership controls test observable refusal. No single-site kill is claimed.

This supersession is justified against FAIL-05 and the freshness contract: no known-invalidated fresh status or newly dispatched stale action may be certified; already-issued native work retains the explicitly approved limit. RequestApply now has its own lifetime and fresh-diagnosis checks. The registry's repaired request-ID note says that accurately. The old comment at worker-integrity.test.js:104 and some historical test comments still use “ONLY”/every-site wording; they are obsolete explanatory text and confer no assurance. This report does not rely on them or count them as a new runtime defect.

**04-14 closed-tab truth now has behavioral evidence.** The final targeted run directly measures retained WorkerMap entries, not source registration text: closing one of two tabs leaves one; repeated create-close cycles return to baseline; dead activation cannot retain a new entry. Held query/read/status/icon/title release adds no committed paint; the neighbour remains unchanged. A previously issued native paint is rejected for the removed target incarnation even if its numeric ID is reused. The model keeps actionAttempts separate from actionLog. Old04-14 results that “painted the dead tab” came from a double that accepted such native writes; they are preserved as historical unmet evidence, not reused as proof. Current behavioral tests plus removal-listener/deletion mechanism mutants replace the old source-shape-only promise. This is synthetic no-committed-paint/retention evidence, not live Chrome attestation.

## Pass-qualified historical disposition ledger

| Pass2 ID | Final disposition |
|---|---|
| CR-01 | Repaired; independent failed-read and readable-opposite whole-outcome traces above. |
| WR-01 | Repaired raw language/refusal-reason separation; locale runtime tests and separate synthetic Chrome mechanism reviewed. Current-source browser evidence remains04-20. |
| WR-02 | Repaired bounded admission, one arrival deadline and raw-callback exclusion; subsequent pass3 lifecycle/certainty defects also repaired. Native effects are not cancellation guarantees. |
| WR-03 | Repaired behavioral sequential-budget coverage; constant comparison is only secondary. |
| WR-04 | Repaired fail-closed runner; independent green/intended/unrelated-failure controls discriminate. |
| WR-05 | Repaired default-discovered registry checks share schema/path/find-count validator; final39-entry gate recorded. |
| WR-06 | Repaired four-head direct-cell source oracle and independent Chrome selector/paint mechanism; no redundant-i behavioral kill claimed. |
| IN-01 | Current-contract supersession: obsolete promise queue/rejection branch removed; raw callback owns writer lifetime. |
| IN-02 | Deferred WARNING above; locale evidence schema/context defect remains04-20. |
| IN-03 | Repaired opening/focus/change ownership; fresh-write-epoch certainty now also checked across waits. |
| IN-04 | Defensive CSS source convention retained; no individual i-flag mutation assurance. |
| IN-05 | Unimplemented type-check suggestion; no new dependency or tsc claimed. |

| Pass1 ID | Final disposition |
|---|---|
| CR-01 | Repaired English-family runtime/CSS support; raw malformed shell remains refused. |
| WR-01 | Current-contract mechanism supersession justified above; individual survivor history retained. CR-19-02/03 repairs close newly found freshness gaps. |
| WR-02 | Repaired exact shape/type/request/pair boundaries; malformed reply and taxonomy mapping assertions reviewed and independently run. |
| WR-03 | Repaired lastError handling; failed-with-values positive/negative controls are behavioral. |
| WR-04 | Repaired bounded observation paths; native work remains physically owned after observation timeout. |
| WR-05 | Repaired finite pair consistency and accepted pair rendering; unreachable fallback survivor correctly excluded. |
| WR-06 | Repaired physical-write serialization and behavioral closed-tab retention/no-committed-paint evidence. |
| WR-07 | Repaired save/read precedence, failed-save retry and modelled focus restoration; human keyboard judgment still pending. |
| WR-08 | Four !important background declarations retained; native visual precedence remains live acceptance. |
| WR-09 | Repaired strict workload modes and loaded-off distinction; final same-identity timing/profile work04-20. |
| WR-10 | Repaired recorded forbidden-channel tripwires outside production catches; explicit refusal controls reviewed/executed. |
| IN-01 | Defensive subframe guard retained; all_frames=false is primary injection scope, no individual guard kill invented. |
| IN-02 | Compatibility qualification retained:106–110 implicit isolation; explicit world from111 onward. No changed support promise inferred. |
| IN-03 | Approved32px Phase4 artwork retained; store packaging dimensions belong toPhase5. Human recognition remains pending. |
| IN-04 | Intentional identity-only tab query; neighbour isolation and retained-entry behavior now directly measured. |
| IN-05 | Request-time snapshot limitation retained. Known invalidation before reply construction is repaired, not excused by snapshot lag. |
| IN-06 | Same unimplemented type-check suggestion as pass2 IN-05. |
| IN-07 | Both halves repaired: failed API attempts counted; bounded flush now independently rechecked as WR-19-01. |
| IN-08 | Deferred WARNING above; predecessor metadata provenance correction04-20. |
| IN-09 | Pure inspection argument retained; naming preference alone is not a defect. |

WINDOWS1–7 remain prior-phase history. WINDOWS8–10 inherited failure/boundary/recovery fixes are technically rechecked. WINDOWS11 preserves authentically ratified copy. WINDOWS12 remains accepted-risk-kind/validator incompatibility owned by04-20, not runtime remediation. WINDOWS13 is the known stale-byte binding failure. WINDOWS14's saved/not-applied copy is directly reached by both failed-read traces. WINDOWS15 final-source measurements remain04-20. WINDOWS16 has behavioral4000/5000 budget evidence. WINDOWS17 has a platform-focus model and named behavioral mutant rather than happy-dom default-focus vacuity. WINDOWS18's erroneous toggle oracle is replaced by full joint outcomes. WINDOWS19's current-build no-pressure judgment remains pending. WINDOWS20/21 and04-12 truth1 receive the narrow mechanism supersession above, not fabricated individual kills. WINDOWS22/04-14 truth4 has current behavioral retention/no-committed-paint evidence as qualified above.

Canonical requirement-status correction39bcfcc remains repaired; historical requirements-completed arrays cannot promote current requirements. All seven Phase4 requirements retain their actual gap/pending state. Seven edge classifications and current prohibition judgments remain pending. Fourteen archived observations are not rebound. Seventeen live slots and ACK-04-01 remain pending. AR-04-01 applies only to language-icon-copy/structure-copy, as accepted risk rather than evidence. Phase3 remains human_needed,28/34,11 passed/9 pending and skipped-by-user UAT. No waiver is invented and the approved04-15 unknown/native/epoch choices are not reopened.

## Preserved halt and resumed-attempt history

Initial review HEAD832926ea274005d36444677717df41d9c570a21b, runtime3ad8a58, found3 BLOCKERs and1 WARNING. Historical pass2 REVIEW is preserved at1469810596704ed72b631d8409a3e77cbdddbd41 and pass1 atbc25a2c.

The first attempt **correctly halted** at028265ed28b9fbb9c68d37a77af840bf69159421 when packet2 affected actionable findings stayed **2→2**. Its green356 tests did not establish convergence. The halted review/summary are preserved in Git (halted summary08ab51a); their outstanding-counterexample observations remain valid descriptions of that source. They are superseded as current status only by the expressly authorized second attempt recorded in8f77223.

Attempt2 packetA: RED51bbaac measured11 intended failures/315 passes, GREEN31ed071, independent affected count **2→0**. PacketB: REDe2a3edc measured3 intended failures/1 pass, GREEN255ba31, independent affected count **1→0**. The original halt was neither ignored nor relabelled successful. The current source may proceed to04-20 evidence correction/binding and human gates; this report does not authorize publication or mark the phase complete.

## Final source identity

SHA256 per tracked file; each aggregate hashes sorted lines `<hash>  <path>\n`. The independent final recomputation agrees with both security and04-19-MEASUREMENTS. Runtime11: `46090012ab1a8ebd265273c327b214afbed0321a2fa149ab801ce8c205891065`. Tests42: `a48ee5a0fdfd6d7792879d22c557fceb34b8a221d23833d1c7f2e90bbd49fb66`. Tools12: `f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323`.

| File | SHA256 |
|---|---|
| extension/background.js | `0f48bb105cdb1edd2aa6b68a6732dba1217502de015670097adbb3eb120d6428` |
| extension/content.js | `c9e83c837e4933827853a03bc9d7b63f308f403d679a8dc5c34701a6792b3126` |
| extension/icons/missing.png | `68a032b0500b1ae062a455e3b1bdbf20db8dd71c8d16dee1461e6f3dbf5e8fa0` |
| extension/icons/neutral.png | `a13c2447cb31526e666a4e050451228480a6221efcee673a6fd30ac2d943f9d4` |
| extension/icons/off.png | `c1289da1a9235cba4ddb0f8bcd85ca90e355ce89ddf3c24340c6409205198638` |
| extension/icons/unreadable.png | `1131af46ac5cc421e7e951a4de067566c9a31bbfa032787f5346fb6db8e30c3a` |
| extension/icons/working.png | `28fc0380a220982d523d39564123933db92e8d492100cd690c0dd333200845bb` |
| extension/manifest.json | `dafa656a55a1b69b42d4aa6490101e593bc9eea36afe35feacf34f7090b768e5` |
| extension/popup.html | `4c621c9d92fd21130dc2cafbf5bcaf705a98993c53eb755a53011a381729ad7c` |
| extension/popup.js | `3e7cac0ebed5141f617af5fb919a6a0c41df6efad2ccbb27076fc7af012ea938` |
| extension/zhroma.css | `8eb5da85190bbada5c2f4c6d9a84c068fd988c46ebe2995c1bba9242f2b726c0` |
| package-lock.json | `424c9711251f2b4f092f346975c08dcf0a26f4f277a221feae3c2ea9b33d50f7` |
| package.json | `41d6e6695bb5ae2e3ec54f76aaadd96f01a445721e750ce4b0fbb0124b4e807c` |
| scripts/fixture-contract.js | `a7c5521deeb9a0726bb890e949eda7cee96fcf1009345733c9d7b81afa2d80d2` |
| scripts/interaction-evidence.js | `a1dbf2e9d352382e4b074ee379b42a01c78f0f88285b357a62911c60f1d591e6` |
| scripts/run-tint-workload.js | `0c9f019f32b8b4fdc4cac8045b28eac31de0fe6db3597cd58eddf5f9d2da9de7` |
| scripts/sanitize-fixture.js | `7791b051d24b96a83b25060f2c634b398567101309efdad787f2d8d4bbf68a5b` |
| scripts/sanitized-output-contract.js | `19493681990386a2239bf63f846f48d50f8d8a9a30a32320ae8f83e20d78f259` |
| scripts/sensitive-patterns.js | `59d7465534d4efbfb9d02af5f98172e1fe38ed50c7545711c9339e1a028e1778` |
| scripts/verify-locale-rendering.js | `8125bfeab4b97e64924183fba9db57b676059bb196cb33e5afe6e151bf0ac768` |
| scripts/verify-mutation-kills.js | `b01aced5d9278cec734dc3bd50861bafaf9b2dc1b93d43702e57a616353a66d5` |
| scripts/verify-recon-gate.js | `ff31d5b806f65be004fc10c2f22cfd121c088693177c1e81155237d6837a2aff` |
| test/extension/chrome-harness.js | `5a6e15b49757eb581481ad40215a912ccb78747a8f5f48f0cd0dc5db46b24b32` |
| test/extension/diagnosis.test.js | `cc97a5ef22fd89835799ba02cf8977dbeed04277ebdb69730e0155274ea04b04` |
| test/extension/failure-seam.test.js | `af491275d2cce64aa7fcc1f88e15ed64162151251e81cdaa3ed554ed4c604676` |
| test/extension/harness-reliability.test.js | `17fb3e6d5fa967a304773da03919374c28ccba6fdbc4a022dc5d13ed204437ae` |
| test/extension/initial-tint.test.js | `630b51016cccab5c706fe2e5286a901bd7518134fc598f8991db881eb8fda77c` |
| test/extension/live-acceptance.test.js | `b3c98da426db35277dbfa28e9de3e7f7fd6989ae852a9af9bc2dcee0e3125264` |
| test/extension/locale-rendering.test.js | `480d4a3c145b3018be2e58f1a146f7eff90e5f0c4bd8f7f2284d69b0ed47a1ec` |
| test/extension/mutation-gate.test.js | `c1b7ccea5fbb3f9e3d9278e6cb94c5b30fc738506c6c1be3ec14c06294b9bac5` |
| test/extension/mutation-registry.test.js | `9657b4dace4444c6dc71baecd2787741201af053783124fd9118cae7e4c17aad` |
| test/extension/performance-harness.test.js | `73508edc36a8dab12aeec6cca243cbed555a34e730961e300080d8828adf1b01` |
| test/extension/persistent-tint.test.js | `3127a5b98f09b254bd832cf4ea792ab2cf2d20299cc22e2cb51ec20e4c3853d7` |
| test/extension/phase-03-live-acceptance.test.js | `b45537ce8bfc588f3c32cc176a9def1ee1bac302e19e8be4564eb6a1b004071b` |
| test/extension/phase-04-live-acceptance.test.js | `3e40300ea3d9f984c401666dcb3e382ef29df8244125039095cea46c4754179a` |
| test/extension/popup-recovery.test.js | `9975300d5da8b23183f36b3bedd8cd897752878bc56ecc70bbb03a4bf2a142af` |
| test/extension/preference-outcome.test.js | `5a21a04c629a31eccce02674b465ee392f6497c07e4e15f46e26f432c8a70d68` |
| test/extension/runtime-contract.test.js | `68520e8a51636bfdf5bf26968ce9e29cc7d87a559adaecc79c365c954e76c57f` |
| test/extension/toggle.test.js | `50ee7f41572c66c81da20911037424360669033a8c42d6e941c9bc1bfeb5ea86` |
| test/extension/toolbar-popup.test.js | `e46b254637ee140aa57320f71f2c477674b6419ae9d5c0996c88944731005772` |
| test/extension/tracer-world.js | `cded53d3ebdf604074814429bee8c63c9d7f0d3dab51280cd8b20afd7bc690f6` |
| test/extension/worker-integrity.test.js | `d53636cdca136fd515084e4af02693f473d7bef51707e517f47042ddf571fd25` |
| test/fixtures/manifest.json | `48e78544bdcc0f24dabb20eab0804fa1b610aec1953e454762597a65489e22eb` |
| test/fixtures/zendesk-view-grouped-long.html | `78d403b7f530fad4fbdcbe1f1b3969c9cb0b316513e1454eaa39fac6b8758b6e` |
| test/fixtures/zendesk-view-priority-absent.html | `70ed2ad8c6d53485a1eb3addbbee8f52c24a047520591e93359ca5b3c86db930` |
| test/fixtures/zendesk-view-priority-present.html | `c0a5b18f96707c8497f22faece606c53eacce170e30781861a1f17a03a346a91` |
| test/mutants/failure-seam.mutants.json | `b974b7007f1a53e6e6c5703e62cf887559d01fc2b352bbf554bcfce64da5d04f` |
| test/mutants/harness-reliability.mutants.json | `217989548a134c2ae8c84f8f0dcfd38b909739a8a4f7f014e5f06f368ee3ebef` |
| test/mutants/locale-honesty.mutants.json | `ec3db5e3a4ffceb260bdf9abdd1094c3f5435036bf9c778070ada13bd219b5ae` |
| test/mutants/popup-recovery.mutants.json | `8c99ad01e3a9a319e18fb5e45a87dd8f3c9ef9da6625b02bd9811102465775d7` |
| test/mutants/preference-outcome.mutants.json | `7cc74dc5acbafcd619309c8e0a3e2aa939391f7a8e45bcc215f45cd98a2ceef3` |
| test/mutants/worker-boundary.mutants.json | `08e4cc47bc947454b7050a37471cbb6533910350783a5c3a85b603ed0c02040a` |
| test/mutants/worker-lifecycle.mutants.json | `270ee0b3cadb7e26bde9ba0f2af476d1756bed0b2142f66bb38439c2e4e80651` |
| test/mutants/worker-staleness.mutants.json | `39fe4c0e248a898002757c8e20a9791b81b4aa602d68a46c56db3fec32b6d700` |
| test/performance/tint-workload.html | `9dcdee64e0cf8f01d1ce97ce516e352bd157fbc76a26f807be5242cc1c2ec47c` |
| test/performance/tint-workload.js | `a83a40fc6979fea93eee228f0c04dcf75548282f7723a474ad8e074577516f30` |
| test/recon/corpus-provenance.test.js | `b2cacaf08a31c223451d4b6ad748e01adc25d8788c22993c0df4a1b65ed319b6` |
| test/recon/dependency-approvals.smoke.js | `15f8bb3373c70a384279ef0f602c4329691019ec40ef4c5caa86e1187765a046` |
| test/recon/fixture-contract.test.js | `95a55153c8ec6aee4c96b7aeff7144545b9ff400a90eb6b4a0ef2ff88b24dae5` |
| test/recon/interaction-evidence.smoke.js | `ad5ff3e361432fe98f82992cadfff942ea0a1766f33b123596efb8abdb889fce` |
| test/recon/recon-gate.smoke.js | `4ad7f378566e7824c9c64094aea1eb03399f7429c25a6d070aa1a9e3719f3636` |
| test/recon/sanitize-fixture.test.js | `8de572f5156cb3386793ab61c48e7825e1aeb25d5654a5767312528844f99047` |
| test/recon/sanitized-output-contract.test.js | `09b5f1e41e577b071c251944cf40617ccf8ff0eb81cef254a957aa1f68f5ae50` |
| test/recon/sensitive-patterns.smoke.js | `e01c33c9739fb04c290a26e586f9679980523972a136676e80770dfa887db145` |
| vitest.config.js | `12c74b7b191a313eb1f4b3c49a5071a48da0d91471ba07d2e2acc3ac616da571` |

_Independent reviewer; final technical and evidence verdicts deliberately separate. No current all-green, live-attested, type-checked or phase-complete claim._
