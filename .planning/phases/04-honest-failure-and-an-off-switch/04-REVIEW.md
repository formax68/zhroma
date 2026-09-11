---
phase: 04-honest-failure-and-an-off-switch
reviewer: Codex independent gsd-code-reviewer
reviewed: 2026-09-11T08:15:00Z
depth: deep
review_pass: 3
review_stage: task1-initial-findings
reviewed_revision: 832926ea274005d36444677717df41d9c570a21b
runtime_revision: 3ad8a58
files_reviewed: 17
files_reviewed_list:
  - extension/background.js
  - extension/content.js
  - extension/manifest.json
  - extension/popup.html
  - extension/popup.js
  - extension/zhroma.css
  - scripts/run-tint-workload.js
  - scripts/verify-locale-rendering.js
  - scripts/verify-mutation-kills.js
  - test/extension/chrome-harness.js
  - test/extension/tracer-world.js
  - test/extension/preference-outcome.test.js
  - test/extension/mutation-gate.test.js
  - test/extension/mutation-registry.test.js
  - test/extension/performance-harness.test.js
  - test/extension/phase-04-live-acceptance.test.js
  - test/extension/toggle.test.js
findings:
  critical: 3
  warning: 1
  info: 0
  total: 4
status: issues_found
runtime_digest: 4900709ee11e97dc5ed25845635d7d4313af56dea667acfbd4b9874fe25343d4
tests_digest: 0f51d2878520604e6a3e229de0d858db9c70249b2ed3ff72ba14b28fc324efd1
tools_digest: f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323
---

# Phase 04 code review — independent pass 3

## Narrative Findings (AI reviewer)

Task 1 found three incorrect runtime outcomes and one test-reliability defect. All four remain open. This initial report enables the bounded repair loop; it is not a completed final-source review or permission to start 04-20. Task 3 must finish the remaining suite/tool inventory inspection, recheck every repair, record per-file final identities and finish historical dispositions. The listed files were directly read; the larger digest inventory is an identity envelope, not a claim that hashing constitutes review.

No implementation edits or commits were made. Read/Write tools are unavailable: reads used exec_command and only this report was written with apply_patch. AGENTS.md and project skill directories are absent; the configured reviewer skill query returned no skills. Current approved decisions take precedence over obsolete stack research. No packages, remote service or live UAT were used.

Immutable historical identities: pass 2 REVIEW at `1469810596704ed72b631d8409a3e77cbdddbd41`; pass 1 REVIEW at `bc25a2c`. New findings use CR-19/WR-19 IDs.

## Critical issues

### CR-19-01: Resume repaints an old ON preference before the fresh read confirms it

**Severity:** BLOCKER
**Status:** open
**File:** `/Users/mike/code/zhroma/extension/content.js:408-414`

**Issue:** onPageShow clears suspension and calls syncController while preferenceReady/preferenceEnabled still describe the previous lifetime. Starting readPreference does not invalidate readiness. A frozen document that missed an OFF event repaints ON while storage is OFF; a stalled read makes this persist indefinitely. The function's comment promises untinted until confirmation. This violates CTRL-02/03/04 and the fresh-resume contract; these preventable marker writes are outside approved native-effect limits.

**Independent reproduction:** bootAll({stored:{enabled:true}}); pagehide; freezeTab(TAB_ID); setStored('enabled',false); emitStorageChange({enabled:{oldValue:true,newValue:false}}); thaw; hold('content-read'); pageshow; settle. Observed stored=false, four priority markers, pending read=1, forbidden=[]. Releasing the read removes all markers. Independently corroborated by security reviewer.

**Fix:** Clear preference readiness before resume reconciliation; remain paused/untinted until a fresh read or newer valid change confirms. Retain generation guards. Verify stalled/failed reads, healthy ON recovery and a newer OFF while the read is held.

**Repair packet:** extension/content.js + test/extension/preference-outcome.test.js; optionally exact test/mutants/preference-outcome.mutants.json if introducing a mutant. RED must inspect markers while the read is held, not only after settlement. Amend plan ownership before editing.

### CR-19-02: An old application reply certifies a replaced document

**Severity:** BLOCKER
**Status:** open
**Files:** `/Users/mike/code/zhroma/extension/background.js:242-251`, `:365-374`

**Issue:** requestApply checks shape and request ID, but no tab/document lifetime after its await. The ID identifies an operation, not the currently visible document. setEnabled publishes applied=true/working from a document already replaced. A separate lifecycle identity is needed; ordinary projection generation cannot be reused blindly because successful apply itself invalidates status.

**Independent reproduction:** bootAll stored=false; hold content-response; flip popup true; pagehide old content; silenceContent(TAB_ID); emit tabsEvents.updated(TAB_ID,{status:'loading'}); loadContent with '<p>synthetic loading document</p>'; settle; release response. Observed stored=true, new-document markers=[], toolbar neutral/Checking, popup “Priority tinting is working”. Reply: saved=true, enabled=true, applied=true, status=working, reason=null. forbidden=[]. Security independently reproduced replacement and closure; this review independently executed replacement.

**Fix:** Bind acknowledgement to the live tab/document lifetime and discard it after navigation/closure/reused incarnation. Preserve acknowledged save separately; applied=false/unavailable when that lifetime is invalidated. Do not mistake content status invalidation for navigation.

**Repair packet:** background.js + preference-outcome.test.js, plus exact registry if needed. Positive control must preserve normal successful apply despite its own invalidation.

### CR-19-03: Popup returns a stale diagnosis after the artwork await

**Severity:** BLOCKER
**Status:** open
**File:** `/Users/mike/code/zhroma/extension/background.js:339-350`

**Issue:** popupStatus checks generation before awaiting applyAction, but never afterward. A known invalidation during the wait leaves toolbar reconciliation healthy while the newly returned popup tuple claims working. The native artwork residual permits already-issued effects; it does not authorize constructing a stale fresh JavaScript reply.

**Independent reproduction:** boot stored=true; hold icon for TAB_ID; load another actual popup; settle; content.body.replaceChildren(); settle; release icon. Final toolbar neutral/Checking, popup working, popup-status reply {requestId:1,status:'working',reason:null,enabled:true}; forbidden=[].

**Fix:** Recheck identity/generation after the artwork await. On invalidation report existing unavailable operation state, preserving only valid preference evidence. Cover icon/title waits, competing popup/preference operations and unchanged-generation positive controls.

**Repair packet:** background.js + toolbar-popup.test.js + exact affected mutant registry if needed. May share one at-most-five-file packet with CR-19-02.

## Warnings

### WR-19-01: Chrome harness flush() spins forever on reentrant deliveries

**Severity:** WARNING
**Status:** open; inherited pass 1 IN-07 drain half
**File:** `/Users/mike/code/zhroma/test/extension/chrome-harness.js:168-175`

**Issue:** Unbounded synchronous while(pending.length) means a callback that queues another read blocks the test worker's event loop. Its asynchronous test timeout cannot report the regression.

**Independent reproduction:** child process: const h=createChromeHarness(); const cb=()=>h.chrome.storage.local.get({enabled:true},cb); cb(); h.flush(). Parent timeout=1000ms returned status=null, signal=SIGTERM, error=ETIMEDOUT. No hung process remained.

**Fix:** Finite per-flush delivery cap and a stable explicit error. Finite multi-generation drains must pass; endless requeue must fail synchronously. Read-count accounting itself is now repaired: reads increment before a synchronous API throw.

**Repair packet:** chrome-harness.js plus one explicitly owned reliability suite or runtime-contract.test.js. No shipped byte change required.

## Direct controls and verification

Independent prescribed command: preference-outcome.test.js + mutation-gate.test.js: **234 tests / 2 files passed**, exit0, 3.87s. These four counterexamples are outside those assertions; green suites do not close them.

Independent actual-source storage→content→popup traces:

| Start/request | Read | Stored/checkbox | Markers | Result |
|---|---|---|---|---|
| true→false | worker/content rejected | false/false, enabled, not mixed | none | saved=true, enabled=null, applied=false, saved/not-applied copy |
| false→true | worker/content rejected | true/true, enabled, not mixed | none | same truthful tuple/copy |
| true→false | independently stored/read opposite true | true/true | four priorities | saved=true, enabled=true, applied=true, working |
| false→true | independently stored/read opposite false | false/false | none | saved=true, enabled=false, applied=true, off |

Whole stored objects and forbidden channels were checked; no extra key or forbidden channel appeared. Pass2 CR-01 is repaired.

Independent mutation controls built a fresh temporary minimal repository using the current runner: green baseline + intended assertion mutation KILLED; equivalent green mutant SURVIVED; a preceding differently labelled assertion inside the intended test GATE_ERROR/intended-assertion-not-proven. Scratch files removed. The full33 gate remains executor/final-recheck evidence, not a total this reviewer independently ran.

## Pass-qualified disposition ledger

Initial dispositions below require completion in Task3; existing findings are not erased by renumbering.

| Pass2 | Disposition |
|---|---|
| CR-01 | Repaired; four independent joint traces above. |
| WR-01 | Reason-only normalization implemented; full locale/evidence inspection pending final recheck. |
| WR-02 | 4000ms arrival budget, 32 admission bound and callback exclusion present; focused behavioral suite passes; new lifecycle defects remain above. |
| WR-03 | Sequential-budget behavioral test now runs, constant comparison secondary. |
| WR-04 | Runner repaired; independent green/intended/unrelated controls discriminate. |
| WR-05 | Default-discovered registry suite uses shared validator; final registry inventory inspection pending. |
| WR-06 | Exact four-head CSS source guard and separate Chrome synthetic report exist; final source/Chrome evidence inspection pending. |
| IN-01 | Current-contract supersession: obsolete promise queue/rejection branch removed. |
| IN-02 | Human-evidence/validation correction explicitly owned by04-20. Scope lacks html_lang_variants; current non-English slot accepts en-GB by rejecting only bare en. Must repair and negatively test before UAT; not accepted here. |
| IN-03 | Opening/focus/change ownership implemented and exercised; downstream CR-19-03 remains separate. |
| IN-04 | Retain defensive source convention; redundant CSS i flag is no claimed behavioral protection. |
| IN-05 | Unimplemented type-check suggestion, no new packages authorized, no tsc claimed. |

| Pass1 | Disposition |
|---|---|
| CR-01 | Raw English-family support retained; final locale check pending. |
| WR-01 | Mechanism supersession pending exact registry/survivor inspection; CR-19-03 is still open. |
| WR-02 | Exact key/type/id/pair guards present; worker-integrity recheck pending. |
| WR-03 | lastError guards present; failed-with-values controls exercised. |
| WR-04 | Whole-operation budgets implemented, native side-effect lifetime distinct. |
| WR-05 | Exact pair encodings retained; full taxonomy review pending. |
| WR-06 | Write exclusion present; behavioral closed-tab retention recheck pending; CR-19-02 is distinct false acknowledgement. |
| WR-07 | Save/read precedence repaired; keyboard human judgment pending. |
| WR-08 | Four important declarations preserved. |
| WR-09 | Strict enabled/disabled/dormant modes exist; final same-identity seven-run evidence04-20. |
| WR-10 | Forbidden channels recorded outside catch; final independent tripwire check pending. |
| IN-01 | Defensive subframe guard retained; all_frames=false primary scope, no individual guard kill promised. |
| IN-02 | Carry compatibility qualification:106–110 implicit isolated world versus explicit world111+. |
| IN-03 | Accepted Phase4 32px artwork choice; store dimensions Phase5/out of scope. |
| IN-04 | Intentional identity-only tab query; neighbor/retention final check pending. |
| IN-05 | Request-time snapshot limitation retained; CR-19-03 is not ordinary snapshot lag. |
| IN-06 | Same unimplemented type-check suggestion as pass2 IN-05. |
| IN-07 | Read-count repaired; flush remains WR-19-01. |
| IN-08 | Hardcoded predecessor revision persists; provenance recheck/correction04-20. |
| IN-09 | Pure inspection argument retained; naming alone does not cause a bug. |

WINDOWS1–7: prior-phase history/out of scope. WINDOWS8–10: inherited fixes, final integration check pending. WINDOWS11: two strings authentically ratified. WINDOWS12: SDK accepted-risk-kind incompatibility, not runtime repair. WINDOWS13: known stale byte binding, reserved04-20. WINDOWS14: saved/not-applied copy directly reached above. WINDOWS15: fresh final-source measurements04-20. WINDOWS16: behavioral4000/5000 deadlines. WINDOWS17: focus sensitivity final mutant inspection pending. WINDOWS18: erroneous toggle oracle repaired by joint traces. WINDOWS19: current-build no-pressure judgment pending. WINDOWS20/21 and04-12 ANY ONE promise: final independently justified mechanism supersession required, no fictitious kills. WINDOWS22/04-14truth4: final behavioral retention/no-paint recheck required after worker repairs.

Canonical requirement-status correction39bcfcc stays repaired; historic requirements-completed arrays cannot promote it. Fourteen archived observations are not rebound. Seventeen live slots/ACK-04-01 remain pending. AR-04-01 covers only language-icon-copy/structure-copy and is accepted risk, not evidence. Phase3 stays human_needed (28/34;11 passed/9 pending). Seven edge classifications and current prohibition judgments remain unresolved. No Phase4 requirement becomes Complete.

## Source identity and next gate

Initial HEAD832926ea274005d36444677717df41d9c570a21b; runtime last changed3ad8a58. Independently computed aggregates agree with security: runtime11, tests40, tools12 as frontmatter.

Algorithm: sorted git-tracked paths in extension/, test/, scripts/ plus package.json/package-lock.json/vitest.config.js; SHA256 each byte stream; aggregate SHA256 of concatenated '<hash>  <path>\n'. Final per-file hashes and aggregates must be refreshed after all fixes; initial identities never attest future changes.

Convergence is blocked by3 BLOCKER and1 WARNING. Amend bounded packets before edits, retain RED/GREEN and independently recheck each. Task3 still owes remaining integrated inventory review, full behavior/mutation verification and final historical mechanism judgments before04-20.
