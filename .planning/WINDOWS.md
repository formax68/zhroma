---
schema_version: 1
open_count: 15
waived_count: 1
fixed_count: 6
total_count: 22
last_updated: 2026-09-11T13:55:00.000Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 01 | deviation | scripts/sanitize-fixture.js |  | Removed the caller-cwd dependency from worktree discovery | open |  | 2026-09-04T06:04:21.943Z |  |
| 2 | 01 | deviation | test/recon/sanitize-fixture.test.js |  | Kept the unsafe-attribute regression inside valid table markup | open |  | 2026-09-04T06:04:22.010Z |  |
| 3 | 01 | deviation | .planning/STATE.md |  | Corrected the out-of-order state position after the SDK advance | open |  | 2026-09-04T06:04:22.078Z |  |
| 4 | 01 | deviation | test/recon/interaction-evidence.smoke.js |  | Decoupled blocked-state coverage from the advancing repository interaction ledger | open |  | 2026-09-04T08:24:35.232Z |  |
| 5 | 01 | deviation | test/recon/recon-gate.smoke.js | 242 | Repository final-gate smoke assertion hard-coded the pre-attestation block verdict. | open |  | 2026-09-04T11:29:35.167Z |  |
| 6 | 01 | deviation | .planning/STATE.md |  | Corrected stale last-plan STATE fields after the SDK update. | open |  | 2026-09-04T11:32:32.566Z |  |
| 7 | 02 | unrun-verify | .planning/phases/02-first-tint-on-a-real-view/02-LIVE-ACCEPTANCE.md |  | End-of-phase live product gate has eleven pending observations; authentic appearance and source loading remain human_needed. | open |  | 2026-09-08T12:22:33.410Z |  |
| 8 | 04 | unrun-verify | test/extension/runtime-contract.test.js |  | 6 of 9 tests fail: readdirSync asset inventory, manifest deep-equal and the throwing chrome.storage Proxy all predate the Phase 4 surfaces. Deliberate contract change ordered in 04-06; not adapted here. | fixed |  | 2026-09-10T05:32:57.876Z | 2026-09-10T05:51:04.409Z |
| 9 | 04 | unrun-verify | test/extension/initial-tint.test.js |  | 59 of 60 tests fail: the VM context supplies no chrome, so the content script stays fail-closed unconfirmed and never tints. Chrome-mock harness adaptation ordered in 04-06. | fixed |  | 2026-09-10T05:32:57.952Z | 2026-09-10T05:51:04.489Z |
| 10 | 04 | unrun-verify | test/extension/persistent-tint.test.js |  | 66 of 68 tests fail: same missing chrome mock plus the one-active-observer assertion, which must assert zero while unconfirmed. Harness adaptation ordered in 04-06. | fixed |  | 2026-09-10T05:32:58.028Z | 2026-09-10T05:51:04.566Z |
| 11 | 04 | deviation | extension/popup.js |  | Two operational copy strings added beyond the 04-01 decided set ('Zhroma could not save that setting', 'Setting saved, but this view did not update'); the plan mandates finite honest failure text and the decided set contained none. Needs user ratification before ship. | fixed | Ratified by the user at the Phase 4 UAT checkpoint on 2026-09-10 (04-UAT.md test 21). Both operational copy strings accepted; the three product diagnoses remain three. | 2026-09-10T06:49:17.218Z | 2026-09-10T10:56:00.000Z |
| 12 | 04 | accepted-risk | .planning/phases/04-honest-failure-and-an-off-switch/04-RISK-ACCEPTANCE.md |  | AR-04-01: FAIL-03 ships with automated coverage and zero live browser evidence. Its only two live checks (language-icon-copy, structure-copy) were unobservable and are waived by the user as accepted residual risk. Both remain status: pending in 04-LIVE-ACCEPTANCE.md; the record stays human_needed. Not evidence, not carried to later phases, and not a basis for describing non-English behaviour as verified. | accepted | User waiver 2026-09-10, verbatim: "waive the pendings one from FAIL-03" | 2026-09-10T10:58:00.000Z |  |
| 13 | 04 | deviation | test/extension/phase-04-live-acceptance.test.js |  | Acceptance byte pin fails: 04-07 changed extension/content.js and extension/zhroma.css, so 04-LIVE-ACCEPTANCE.md no longer binds the shipped bytes. Expected intermediate state under 04-VALIDATION.md promotion rule 3; re-establishment is 04-11's work, not a re-point. | fixed | Final 04-20 acceptance validator now binds the current shipped bytes to the reviewed runtime identity and passes 94/94 while computing human_needed; no old observation was re-pointed. | 2026-09-10T15:06:00.000Z | 2026-09-11T13:55:00.000Z |
| 14 | 04 | deviation | test/extension/failure-seam.test.js |  | Timeout path asserts the ratified 'No readable view is connected' line, not the plan's named not-applied line: a timed-out apply yields outcome null, so setEnabled reports status 'unavailable' and popup.js renders that branch before the applied branch. Producing NOT_APPLIED would require inventing a status the document never reported. | open |  | 2026-09-10T15:31:12.000Z |  |
| 15 | 04 | deviation | .planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json |  | 04-09 changed both files behind identity.harnessHash (f889a9eb -> 285074ea), so mergeReport now refuses the recorded six-run file as a mixed identity. Expected intermediate state declared in 04-09; the file is preserved as history and 04-11 regenerates it against final source. | fixed | Final 04-20 performance samples were regenerated against one reviewed source/environment/harness identity; seven Chrome runs passed and the mixed-identity interim state is preserved only as history. | 2026-09-10T15:45:00.000Z | 2026-09-11T13:55:00.000Z |
| 16 | 04 | deviation | extension/popup.js |  | The popup's REQUEST_TIMEOUT_MS ships at 5000, not the 2000 the plan named: answering the popup can cost the worker a full bounded wait of its own, so an equal deadline cut off the worker's honest reply and the confirmed preference it carried, regressing failure-seam's 'the switch is usable again'. The ordering between the two processes' copies is asserted from the shipped bytes. | open |  | 2026-09-10T16:10:00.000Z |  |
| 17 | 04 | deviation | test/mutants/popup-recovery.mutants.json |  | popup-focus-guard mutates the focus restoration itself, not the disabled-state guard 04-10 Task 3 named. Reinstating that guard was measured SURVIVED (0/1 killed): the corrected ordering re-enables the control before end() runs, so the guard is unreachable and cannot be load-bearing. | open |  | 2026-09-10T16:10:00.000Z |  |
| 18 | 04 | deviation | test/extension/toggle.test.js |  | A file outside the plan's files_modified was edited: 'a rejected read after a write refuses to claim a preference it could not confirm' asserted the control is taken out of service, which is the defect WR-07 reports. Rewritten to the corrected contract (revert to the last confirmed value, stay operable). | open |  | 2026-09-10T16:10:00.000Z |  |
| 19 | 04 | deviation | .planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md |  | The re-enable-not-pressured ratification is qualified rather than carried intact as the plan directed: popup.js changed under WR-04/WR-07, so the popup the user judged at the 2026-09-10 checkpoint is not byte-identical to the one that ships. The repair added no copy and no prompt, but whether the repaired failed-save path still reads as unpressured is a judgment nobody has made against the new bytes. Status stays flagged-unverified; the qualification is recorded in the judgment's own disposition text. | open |  | 2026-09-10T16:35:00.000Z |  |
| 20 | 04 | unmet-truth | .planning/phases/04-honest-failure-and-an-off-switch/04-12-PLAN.md |  | must_haves truth 1 claims removing ANY ONE of the worker's generation guards turns the suite red. Measured false for two of the seven named sites: requestStatus's catch-branch guard and its post-await recheck are each redundant with the recheck BOTH callers (project, popupStatus) perform immediately afterwards, with no macrotask able to interleave, so deleting either alone changes no observable behaviour. Five sites plus the per-tab queue are individually fenced; the redundant pair is fenced only at mechanism level by the generation-counter mutant. | open |  | 2026-09-10T17:05:00.000Z |  |
| 21 | 04 | deviation | test/mutants/worker-staleness.mutants.json |  | The registry does not carry the plan's status-catch-guard and status-post-await-guard ids: both were MEASURED SURVIVED against the enriched suite (see entry 20 for why they cannot be killed individually). They are replaced by generation-counter (the mechanism-level fence that does reach them) and status-catch-reports-unavailable (which fences the reporting half of the catch branch and says so). project-queue is expressed as `state.queue = Promise.resolve().then(...)` rather than the plan's IIFE: same collapse of serialization, one literal, parse-clean. A fourth harness control, setResponseDelay(ms), was added beyond the three the plan named because a construction-time queue cannot target a reply that is only reachable mid-test. | open |  | 2026-09-10T17:05:00.000Z |  |
| 22 | 04 | unmet-truth | .planning/phases/04-honest-failure-and-an-off-switch/04-14-PLAN.md |  | must_haves truth 4 claims a projection for a closed tab "neither throws nor paints". Measured false for the paint half: after chrome.tabs.onRemoved has released the entry, project() mints a fresh generation via stateFor, sendMessage rejects, and requestStatus's catch reports the connection fact — so applyAction writes icons/neutral.png and 'No readable view is connected' against the dead tab id. The tracer's action double does not model Chrome refusing an action write for a closed tab, and making it do so would change a harness this plan does not own. The test asserts the honest form instead: the projection resolves without throwing, every write it makes is scoped to the closed tab, it is the operational connection state and never a diagnosis, and the living neighbour's toolbar is untouched. Truth 3's closed-tab cleanup guard is also source-shape only, as the plan's own <closed_tab_cleanup_constraint> states. | open |  | 2026-09-10T18:05:00.000Z |  |

````json
[
  {
    "id": 1,
    "kind": "deviation",
    "phase": "01",
    "file": "scripts/sanitize-fixture.js",
    "line": null,
    "description": "Removed the caller-cwd dependency from worktree discovery",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T06:04:21.943Z",
    "resolved_at": null
  },
  {
    "id": 2,
    "kind": "deviation",
    "phase": "01",
    "file": "test/recon/sanitize-fixture.test.js",
    "line": null,
    "description": "Kept the unsafe-attribute regression inside valid table markup",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T06:04:22.010Z",
    "resolved_at": null
  },
  {
    "id": 3,
    "kind": "deviation",
    "phase": "01",
    "file": ".planning/STATE.md",
    "line": null,
    "description": "Corrected the out-of-order state position after the SDK advance",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T06:04:22.078Z",
    "resolved_at": null
  },
  {
    "id": 4,
    "kind": "deviation",
    "phase": "01",
    "file": "test/recon/interaction-evidence.smoke.js",
    "line": null,
    "description": "Decoupled blocked-state coverage from the advancing repository interaction ledger",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T08:24:35.232Z",
    "resolved_at": null
  },
  {
    "id": 5,
    "kind": "deviation",
    "phase": "01",
    "file": "test/recon/recon-gate.smoke.js",
    "line": 242,
    "description": "Repository final-gate smoke assertion hard-coded the pre-attestation block verdict.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T11:29:35.167Z",
    "resolved_at": null
  },
  {
    "id": 6,
    "kind": "deviation",
    "phase": "01",
    "file": ".planning/STATE.md",
    "line": null,
    "description": "Corrected stale last-plan STATE fields after the SDK update.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-04T11:32:32.566Z",
    "resolved_at": null
  },
  {
    "id": 7,
    "kind": "unrun-verify",
    "phase": "02",
    "file": ".planning/phases/02-first-tint-on-a-real-view/02-LIVE-ACCEPTANCE.md",
    "line": null,
    "description": "End-of-phase live product gate has eleven pending observations; authentic appearance and source loading remain human_needed.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-08T12:22:33.410Z",
    "resolved_at": null
  },
  {
    "id": 8,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "test/extension/runtime-contract.test.js",
    "line": null,
    "description": "6 of 9 tests fail: readdirSync asset inventory, manifest deep-equal and the throwing chrome.storage Proxy all predate the Phase 4 surfaces. Deliberate contract change ordered in 04-06; not adapted here.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-10T05:32:57.876Z",
    "resolved_at": "2026-09-10T05:51:04.409Z"
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "test/extension/initial-tint.test.js",
    "line": null,
    "description": "59 of 60 tests fail: the VM context supplies no chrome, so the content script stays fail-closed unconfirmed and never tints. Chrome-mock harness adaptation ordered in 04-06.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-10T05:32:57.952Z",
    "resolved_at": "2026-09-10T05:51:04.489Z"
  },
  {
    "id": 10,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "test/extension/persistent-tint.test.js",
    "line": null,
    "description": "66 of 68 tests fail: same missing chrome mock plus the one-active-observer assertion, which must assert zero while unconfirmed. Harness adaptation ordered in 04-06.",
    "status": "fixed",
    "reason": "",
    "recorded_at": "2026-09-10T05:32:58.028Z",
    "resolved_at": "2026-09-10T05:51:04.566Z"
  },
  {
    "id": 11,
    "kind": "deviation",
    "phase": "04",
    "file": "extension/popup.js",
    "line": null,
    "description": "Two operational copy strings added beyond the 04-01 decided set ('Zhroma could not save that setting', 'Setting saved, but this view did not update'); the plan mandates finite honest failure text and the decided set contained none. Needs user ratification before ship.",
    "status": "fixed",
    "reason": "Ratified by the user at the Phase 4 UAT checkpoint on 2026-09-10 (04-UAT.md test 21). Both operational copy strings accepted; the three product diagnoses remain three.",
    "recorded_at": "2026-09-10T06:49:17.218Z",
    "resolved_at": "2026-09-10T10:56:00.000Z"
  },
  {
    "id": 12,
    "kind": "accepted-risk",
    "phase": "04",
    "file": ".planning/phases/04-honest-failure-and-an-off-switch/04-RISK-ACCEPTANCE.md",
    "line": null,
    "description": "AR-04-01: FAIL-03 ships with automated coverage and zero live browser evidence. Its only two live checks (language-icon-copy, structure-copy) were unobservable and are waived by the user as accepted residual risk. Both remain status: pending in 04-LIVE-ACCEPTANCE.md; the record stays human_needed. Not evidence, not carried to later phases, and not a basis for describing non-English behaviour as verified.",
    "status": "accepted",
    "reason": "User waiver 2026-09-10, verbatim: \"waive the pendings one from FAIL-03\"",
    "recorded_at": "2026-09-10T10:58:00.000Z",
    "resolved_at": null
  },
  {
    "id": 13,
    "kind": "deviation",
    "phase": "04",
    "file": "test/extension/phase-04-live-acceptance.test.js",
    "line": null,
    "description": "Acceptance byte pin fails: 04-07 changed extension/content.js and extension/zhroma.css, so 04-LIVE-ACCEPTANCE.md no longer binds the shipped bytes. Expected intermediate state under 04-VALIDATION.md promotion rule 3; re-establishment is 04-11's work, not a re-point.",
    "status": "fixed",
    "reason": "Final 04-20 acceptance validator now binds the current shipped bytes to the reviewed runtime identity and passes 94/94 while computing human_needed; no old observation was re-pointed.",
    "recorded_at": "2026-09-10T15:06:00.000Z",
    "resolved_at": "2026-09-11T13:55:00.000Z"
  },
  {
    "id": 14,
    "kind": "deviation",
    "phase": "04",
    "file": "test/extension/failure-seam.test.js",
    "line": null,
    "description": "Timeout path asserts the ratified 'No readable view is connected' line, not the plan's named not-applied line: a timed-out apply yields outcome null, so setEnabled reports status 'unavailable' and popup.js renders that branch before the applied branch. Producing NOT_APPLIED would require inventing a status the document never reported.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T15:31:12.000Z",
    "resolved_at": null
  },
  {
    "id": 15,
    "kind": "deviation",
    "phase": "04",
    "file": ".planning/phases/04-honest-failure-and-an-off-switch/04-PERFORMANCE-SAMPLES.json",
    "line": null,
    "description": "04-09 changed both files behind identity.harnessHash (f889a9eb -> 285074ea), so mergeReport now refuses the recorded six-run file as a mixed identity. Expected intermediate state declared in 04-09; the file is preserved as history and 04-11 regenerates it against final source.",
    "status": "fixed",
    "reason": "Final 04-20 performance samples were regenerated against one reviewed source/environment/harness identity; seven Chrome runs passed and the mixed-identity interim state is preserved only as history.",
    "recorded_at": "2026-09-10T15:45:00.000Z",
    "resolved_at": "2026-09-11T13:55:00.000Z"
  },
  {
    "id": 16,
    "kind": "deviation",
    "phase": "04",
    "file": "extension/popup.js",
    "line": null,
    "description": "The popup's REQUEST_TIMEOUT_MS ships at 5000, not the 2000 the plan named: answering the popup can cost the worker a full bounded wait of its own, so an equal deadline cut off the worker's honest reply and the confirmed preference it carried, regressing failure-seam's 'the switch is usable again'. The ordering between the two processes' copies is asserted from the shipped bytes.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:10:00.000Z",
    "resolved_at": null
  },
  {
    "id": 17,
    "kind": "deviation",
    "phase": "04",
    "file": "test/mutants/popup-recovery.mutants.json",
    "line": null,
    "description": "popup-focus-guard mutates the focus restoration itself, not the disabled-state guard 04-10 Task 3 named. Reinstating that guard was measured SURVIVED (0/1 killed): the corrected ordering re-enables the control before end() runs, so the guard is unreachable and cannot be load-bearing.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:10:00.000Z",
    "resolved_at": null
  },
  {
    "id": 18,
    "kind": "deviation",
    "phase": "04",
    "file": "test/extension/toggle.test.js",
    "line": null,
    "description": "A file outside the plan's files_modified was edited: 'a rejected read after a write refuses to claim a preference it could not confirm' asserted the control is taken out of service, which is the defect WR-07 reports. Rewritten to the corrected contract (revert to the last confirmed value, stay operable).",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:10:00.000Z",
    "resolved_at": null
  },
  {
    "id": 19,
    "kind": "deviation",
    "phase": "04",
    "file": ".planning/phases/04-honest-failure-and-an-off-switch/04-LIVE-ACCEPTANCE.md",
    "line": null,
    "description": "The re-enable-not-pressured ratification is qualified rather than carried intact as the plan directed: popup.js changed under WR-04/WR-07, so the popup the user judged at the 2026-09-10 checkpoint is not byte-identical to the one that ships. The repair added no copy and no prompt, but whether the repaired failed-save path still reads as unpressured is a judgment nobody has made against the new bytes. Status stays flagged-unverified; the qualification is recorded in the judgment's own disposition text.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T16:35:00.000Z",
    "resolved_at": null
  },
  {
    "id": 20,
    "kind": "unmet-truth",
    "phase": "04",
    "file": ".planning/phases/04-honest-failure-and-an-off-switch/04-12-PLAN.md",
    "line": null,
    "description": "must_haves truth 1 claims removing ANY ONE of the worker's generation guards turns the suite red. Measured false for two of the seven named sites: requestStatus's catch-branch guard and its post-await recheck are each redundant with the recheck BOTH callers (project, popupStatus) perform immediately afterwards, with no macrotask able to interleave, so deleting either alone changes no observable behaviour. Five sites plus the per-tab queue are individually fenced; the redundant pair is fenced only at mechanism level by the generation-counter mutant.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T17:05:00.000Z",
    "resolved_at": null
  },
  {
    "id": 21,
    "kind": "deviation",
    "phase": "04",
    "file": "test/mutants/worker-staleness.mutants.json",
    "line": null,
    "description": "The registry does not carry the plan's status-catch-guard and status-post-await-guard ids: both were MEASURED SURVIVED against the enriched suite (see entry 20 for why they cannot be killed individually). They are replaced by generation-counter (the mechanism-level fence that does reach them) and status-catch-reports-unavailable (which fences the reporting half of the catch branch and says so). project-queue is expressed as `state.queue = Promise.resolve().then(...)` rather than the plan's IIFE: same collapse of serialization, one literal, parse-clean. A fourth harness control, setResponseDelay(ms), was added beyond the three the plan named because a construction-time queue cannot target a reply that is only reachable mid-test.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T17:05:00.000Z",
    "resolved_at": null
  },
  {
    "id": 22,
    "kind": "unmet-truth",
    "phase": "04",
    "file": ".planning/phases/04-honest-failure-and-an-off-switch/04-14-PLAN.md",
    "line": null,
    "description": "must_haves truth 4 claims a projection for a closed tab \"neither throws nor paints\". Measured false for the paint half: after chrome.tabs.onRemoved has released the entry, project() mints a fresh generation via stateFor, sendMessage rejects, and requestStatus's catch reports the connection fact — so applyAction writes icons/neutral.png and 'No readable view is connected' against the dead tab id. The tracer's action double does not model Chrome refusing an action write for a closed tab, and making it do so would change a harness this plan does not own. The test asserts the honest form instead: the projection resolves without throwing, every write it makes is scoped to the closed tab, it is the operational connection state and never a diagnosis, and the living neighbour's toolbar is untouched. Truth 3's closed-tab cleanup guard is also source-shape only, as the plan's own <closed_tab_cleanup_constraint> states.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T18:05:00.000Z",
    "resolved_at": null
  }
]
````
