---
phase: 04-honest-failure-and-an-off-switch
reviewer: Codex independent gsd-code-reviewer
reviewed: 2026-09-11T08:22:29Z
depth: deep
review_pass: 3
review_stage: halted
reviewed_revision: 028265ed28b9fbb9c68d37a77af840bf69159421
runtime_revision: 028265e
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
  critical: 2
  warning: 1
  info: 0
  total: 3
status: issues_found
runtime_digest: f6a4e4bca9a5409e1164f0bc1622c349286a53e9a455fcc23bf08e0ca20573ad
tests_digest: 998fe146818b4ab39352b43daba817364a649bf9d88a89ba332838ff2b29edb7
tools_digest: f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323
---

# Phase 04 code review — independent pass 3

## Narrative Findings (AI reviewer)

**Review halted under the mandatory 04-19 nondecreasing-findings gate.** Packet 1 repaired CR-19-01. Packet 2 fixed the original navigation/closure and stale-diagnosis examples but independent adjacent counterexamples leave CR-19-02 and CR-19-03 open: affected actionable count **2 → 2**. WR-19-01 remains unrepaired. Current total: **2 BLOCKER + 1 WARNING**. No further repair or review broadening occurred after the stop instruction, and **04-20 must not start**.

The originally assigned scope is all extension runtime/assets, extension suites/harnesses, registries, validation/performance tools and package/config. Deep runtime/call-chain inspection and targeted rechecks are recorded here; remaining full inventory inspection and final historical mechanism conclusions were **not completed before the mandatory halt**. The frontmatter lists 17 fully read files; toolbar-popup tests and mutant changes were additionally inspected for packet rechecks. The complete per-file hash envelope below identifies source, not completeness of semantic review. There is no final full36 gate or whole-suite-green claim.

No implementation edits or commits were made. Read/Write tools are unavailable: reads used exec_command and only this report was written with apply_patch. AGENTS.md and project skill directories are absent; the configured reviewer skill query returned no skills. Current approved decisions take precedence over obsolete stack research. No packages, remote service or live UAT were used.

Immutable historical identities: pass 2 REVIEW at `1469810596704ed72b631d8409a3e77cbdddbd41`; pass 1 REVIEW at `bc25a2c`. New findings use CR-19/WR-19 IDs.

## Critical issues

### CR-19-01: Resume repaints an old ON preference before the fresh read confirms it

**Severity:** BLOCKER
**Status:** repaired and independently rechecked at 199e642; original defect evidence retained below
**File:** `/Users/mike/code/zhroma/extension/content.js:408-415`

**Issue:** onPageShow clears suspension and calls syncController while preferenceReady/preferenceEnabled still describe the previous lifetime. Starting readPreference does not invalidate readiness. A frozen document that missed an OFF event repaints ON while storage is OFF; a stalled read makes this persist indefinitely. The function's comment promises untinted until confirmation. This violates CTRL-02/03/04 and the fresh-resume contract; these preventable marker writes are outside approved native-effect limits.

**Independent reproduction:** bootAll({stored:{enabled:true}}); pagehide; freezeTab(TAB_ID); setStored('enabled',false); emitStorageChange({enabled:{oldValue:true,newValue:false}}); thaw; hold('content-read'); pageshow; settle. Observed stored=false, four priority markers, pending read=1, forbidden=[]. Releasing the read removes all markers. Independently corroborated by security reviewer.

**Fix:** Clear preference readiness before resume reconciliation; remain paused/untinted until a fresh read or newer valid change confirms. Retain generation guards. Verify stalled/failed reads, healthy ON recovery and a newer OFF while the read is held.

**Repair packet:** extension/content.js + test/extension/preference-outcome.test.js; optionally exact test/mutants/preference-outcome.mutants.json if introducing a mutant. RED must inspect markers while the read is held, not only after settlement. Amend plan ownership before editing.

### CR-19-02: An old application reply certifies a replaced document

**Severity:** BLOCKER
**Status:** partially repaired at 028265e; same-document stale diagnosis remains BLOCKER
**Files:** `/Users/mike/code/zhroma/extension/background.js:242-254`, `:369-377`

**Issue:** requestApply checks shape and request ID, but no tab/document lifetime after its await. The ID identifies an operation, not the currently visible document. setEnabled publishes applied=true/working from a document already replaced. A separate lifecycle identity is needed; ordinary projection generation cannot be reused blindly because successful apply itself invalidates status.

**Independent reproduction:** bootAll stored=false; hold content-response; flip popup true; pagehide old content; silenceContent(TAB_ID); emit tabsEvents.updated(TAB_ID,{status:'loading'}); loadContent with '<p>synthetic loading document</p>'; settle; release response. Observed stored=true, new-document markers=[], toolbar neutral/Checking, popup “Priority tinting is working”. Reply: saved=true, enabled=true, applied=true, status=working, reason=null. forbidden=[]. Security independently reproduced replacement and closure; this review independently executed replacement.

**Fix:** Bind acknowledgement to the live tab/document lifetime and discard it after navigation/closure/reused incarnation. Preserve acknowledged save separately; applied=false/unavailable when that lifetime is invalidated. Do not mistake content status invalidation for navigation.

**Repair packet:** background.js + preference-outcome.test.js, plus exact registry if needed. Positive control must preserve normal successful apply despite its own invalidation.

### CR-19-03: Popup returns a stale diagnosis after the artwork await

**Severity:** BLOCKER
**Status:** partially repaired at 028265e; stale confirmed preference remains BLOCKER
**File:** `/Users/mike/code/zhroma/extension/background.js:348-354`

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


## Final packet rechecks and remaining counterexamples

**Packet1 — CR-19-01 repaired.** RED4965287, GREEN199e642. Source now clears preferenceReady before clearing suspension and syncing. Independently executed four initial/current boolean combinations: markers=[] while read held; after release, markers exactly match fresh boolean. Independent preference-outcome+toggle: **228/228 tests**,2 files,exit0. Independently ran resume-read-readiness mutant: **KILLED1/1** after a green baseline, failing exactly [review:resume-unconfirmed-no-markers]. Failed reads/newer-OFF controls also pass in the named suite. No new packet1 defect found.

**Packet2 — original cases repaired, affected count remains2.** REDf826775, GREEN028265e. A separate tab-state lifetime now advances on loading, and requestApply validates state identity/lifetime after its wait; the original navigation probe returns saved=true, enabled=true, applied=false, unavailable. The new post-artwork generation guard refuses the original stale working diagnosis. Independent four-suite run (preference-outcome, toolbar-popup, worker-integrity, mutation-registry): **356/356 tests**,4 files,exit0,16.13s. Executor reported selected apply-document-lifetime, popup-post-action-status and pending-reopen-certainty each KILLED1/1 after clean baseline; those prove the named targets only, not the remaining outcomes below. This reviewer did not rerun those three selected mutants and does not label executor measurements independent.

### CR-19-02 remaining: same-document view mutation during captured application response

This exact bounded real-source probe was executed independently at028265e:

1. bootAll({stored:{enabled:false}}).
2. world.hold('content-response'); await flip(popup,true).
3. content.document.body.replaceChildren(); await settle().
4. world.unhold('content-response'); world.release('content-response'); await settle().
5. Inspect actual popup, toolbar and set-enabled response.

Observed:
```json
{"storage":{"enabled":true},"popup":"Priority tinting is working","action":{"icon":"icons/neutral.png","title":"Checking this view"},"reply":{"type":"set-enabled","requestId":2,"saved":true,"enabled":true,"applied":true,"status":"working","reason":null},"forbidden":[]}
```

The content document's identity has not changed, so the lifetime guard cannot reject an old diagnosis after a known DOM/view invalidation. The historical successful-application fact may still be true; its old working diagnosis is not a truthful fresh description. The sibling security reviewer independently corroborated this. This is not an already-issued native effect or ordinary post-response snapshot drift: the newer neutral state exists before the worker constructs the response.

**Concrete future fix direction, not executed:** after a valid application acknowledgement, obtain fresh bounded diagnosis with ownership checks through the new wait (same original4000ms budget). Preserve confirmed save and legitimate same-document application; refuse stale/unavailable diagnosis. An explicit amended <=5-file packet could use background.js, preference-outcome.test.js and its exact registry. Include same-document mutation, successful own invalidation, navigation/closure, stalled fresh status and budget exhaustion controls.

### CR-19-03 remaining: opposite write completes before held popup response construction

Independent bounded actual-source probe at028265e:

1. bootAll({stored:{enabled:true}}).
2. world.hold('icon',TAB_ID); const popup=loadPopup(world); await settle().
3. Await world.popupChrome.runtime.sendMessage({type:'set-enabled',requestId:888,enabled:false}); the opposing write saves and applies.
4. world.unhold('icon',TAB_ID); world.release('icon',TAB_ID); await settle().
5. Inspect storage and the first popup's checkbox/reply.

Observed:
```json
{"stored":{"enabled":false},"checked":true,"mixed":false,"copy":"No readable view is connected","oppositeReply":{"type":"set-enabled","requestId":888,"saved":true,"enabled":false,"applied":true,"status":"off","reason":null},"popupReply":{"type":"popup-status","requestId":1,"status":"unavailable","reason":null,"enabled":true},"forbidden":[]}
```

The new generation recheck fixes diagnosis but returns the pre-await boolean from line348. The competing write already settled, so pendingWrite is null and cannot mask that obsolete certainty. The popup newly confirms ON after this worker saved OFF. Returning unavailable copy does not make the confirmed checkbox truthful.

**Concrete future fix direction, not executed:** on invalidation, use a fresh bounded preference observation respecting pending-write exclusion and the existing deadline, or return enabled=null conservatively. Challenge invalidation at each await, both opposite directions, write-pending and write-settled cases, and unchanged-generation recovery. Any future packet must name background.js, toolbar-popup/preference-outcome tests and exact affected registries before edits.

**WR-19-01 remains open.** No bounded flush repair was attempted. **Obsolete registry note remains uncorrected:** test/mutants/worker-boundary.mutants.json:10 still calls requestApply's request ID its “ONLY staleness key”;028265e also validates state/lifetime. This is obsolete assurance text, not another runtime defect. Its correction was not performed after the stop gate.

**Historical guard supersession is not falsely closed.** Earlier measurements classify popup-copy-fallback and project-guard-after-preference as SURVIVED. Exact pair validation and downstream ownership checks explain potential redundancy, but this reviewer did not complete the required whole-target/survivor audit before halt. Therefore the old04-12 ANY ONE guard promise/WINDOWS20/21 remains unresolved here; no blanket mechanism-level certification is issued. Likewise current closed-tab tests may provide behavioral retention/no-paint evidence, but final04-14truth4/WINDOWS22 integrated recheck is incomplete. Partial repaired navigation acknowledgement is not substituted for that separate evidence.


## Pass-qualified disposition ledger

Dispositions below retain the initial review boundary. Items marked final-check pending remain unresolved because the run halted before Task3; no incomplete item is silently closed.

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

Convergence is blocked by2 BLOCKER and1 WARNING. The mandatory nondecreasing gate halted this run: packet2 affected findings remained2→2. No further packet is executed or authorized by this report. Remaining full inventory review, complete mutation/behavior validation and final historical mechanism judgments remain incomplete. No04-20 handoff.


## Final halted source identity

Reviewed commit and current HEAD: `028265ed28b9fbb9c68d37a77af840bf69159421`, measured 2026-09-11T08:22:29Z. Git diff against that commit over extension/test/scripts/package/config was empty. Initial identities above remain historical; frontmatter and the following inventory are the final halted source. No implementation change occurred during packet rechecks.

### runtime identity envelope — 11 tracked files

Aggregate SHA256: `f6a4e4bca9a5409e1164f0bc1622c349286a53e9a455fcc23bf08e0ca20573ad`.

| Path | SHA256 |
|---|---|
| extension/background.js | `7e867175d4d768e84bf2cac55d530a6bbebe9474639973a2a5942c1cff4a835f` |
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

### tests identity envelope — 40 tracked files

Aggregate SHA256: `998fe146818b4ab39352b43daba817364a649bf9d88a89ba332838ff2b29edb7`.

| Path | SHA256 |
|---|---|
| test/extension/chrome-harness.js | `860b61eb81917fe5c781bd5ccea95836525b76a3c6862e8357b13053d3b6e96f` |
| test/extension/diagnosis.test.js | `cc97a5ef22fd89835799ba02cf8977dbeed04277ebdb69730e0155274ea04b04` |
| test/extension/failure-seam.test.js | `af491275d2cce64aa7fcc1f88e15ed64162151251e81cdaa3ed554ed4c604676` |
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
| test/extension/preference-outcome.test.js | `c7ae022feb79a4b54f0153acf9fd614abfe8e89b10e9c57abed594a7ef878698` |
| test/extension/runtime-contract.test.js | `68520e8a51636bfdf5bf26968ce9e29cc7d87a559adaecc79c365c954e76c57f` |
| test/extension/toggle.test.js | `50ee7f41572c66c81da20911037424360669033a8c42d6e941c9bc1bfeb5ea86` |
| test/extension/toolbar-popup.test.js | `df193585e8db621e04429c05a3ed85746efaaa4b9f04ded8731c023dc720dffd` |
| test/extension/tracer-world.js | `cded53d3ebdf604074814429bee8c63c9d7f0d3dab51280cd8b20afd7bc690f6` |
| test/extension/worker-integrity.test.js | `d53636cdca136fd515084e4af02693f473d7bef51707e517f47042ddf571fd25` |
| test/fixtures/manifest.json | `48e78544bdcc0f24dabb20eab0804fa1b610aec1953e454762597a65489e22eb` |
| test/fixtures/zendesk-view-grouped-long.html | `78d403b7f530fad4fbdcbe1f1b3969c9cb0b316513e1454eaa39fac6b8758b6e` |
| test/fixtures/zendesk-view-priority-absent.html | `70ed2ad8c6d53485a1eb3addbbee8f52c24a047520591e93359ca5b3c86db930` |
| test/fixtures/zendesk-view-priority-present.html | `c0a5b18f96707c8497f22faece606c53eacce170e30781861a1f17a03a346a91` |
| test/mutants/failure-seam.mutants.json | `b974b7007f1a53e6e6c5703e62cf887559d01fc2b352bbf554bcfce64da5d04f` |
| test/mutants/locale-honesty.mutants.json | `ec3db5e3a4ffceb260bdf9abdd1094c3f5435036bf9c778070ada13bd219b5ae` |
| test/mutants/popup-recovery.mutants.json | `8c99ad01e3a9a319e18fb5e45a87dd8f3c9ef9da6625b02bd9811102465775d7` |
| test/mutants/preference-outcome.mutants.json | `7ac874576960c35381a95b0c6566248b8743623a0fcb48cf203ab42f99f9593d` |
| test/mutants/worker-boundary.mutants.json | `88162cdd020df3c34581d90c15701454c458e2c209ae6c6541c8482aea68d7c4` |
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

### tools identity envelope — 12 tracked files

Aggregate SHA256: `f7459b816951733542019ffb01d7e249ea8d97dfed0a60621e06cc70e91f3323`.

| Path | SHA256 |
|---|---|
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
| vitest.config.js | `12c74b7b191a313eb1f4b3c49a5071a48da0d91471ba07d2e2acc3ac616da571` |
