---
schema_version: 1
open_count: 10
waived_count: 0
fixed_count: 0
total_count: 10
last_updated: 2026-09-10T05:32:58.028Z
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
| 8 | 04 | unrun-verify | test/extension/runtime-contract.test.js |  | 6 of 9 tests fail: readdirSync asset inventory, manifest deep-equal and the throwing chrome.storage Proxy all predate the Phase 4 surfaces. Deliberate contract change ordered in 04-06; not adapted here. | open |  | 2026-09-10T05:32:57.876Z |  |
| 9 | 04 | unrun-verify | test/extension/initial-tint.test.js |  | 59 of 60 tests fail: the VM context supplies no chrome, so the content script stays fail-closed unconfirmed and never tints. Chrome-mock harness adaptation ordered in 04-06. | open |  | 2026-09-10T05:32:57.952Z |  |
| 10 | 04 | unrun-verify | test/extension/persistent-tint.test.js |  | 66 of 68 tests fail: same missing chrome mock plus the one-active-observer assertion, which must assert zero while unconfirmed. Harness adaptation ordered in 04-06. | open |  | 2026-09-10T05:32:58.028Z |  |

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
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T05:32:57.876Z",
    "resolved_at": null
  },
  {
    "id": 9,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "test/extension/initial-tint.test.js",
    "line": null,
    "description": "59 of 60 tests fail: the VM context supplies no chrome, so the content script stays fail-closed unconfirmed and never tints. Chrome-mock harness adaptation ordered in 04-06.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T05:32:57.952Z",
    "resolved_at": null
  },
  {
    "id": 10,
    "kind": "unrun-verify",
    "phase": "04",
    "file": "test/extension/persistent-tint.test.js",
    "line": null,
    "description": "66 of 68 tests fail: same missing chrome mock plus the one-active-observer assertion, which must assert zero while unconfirmed. Harness adaptation ordered in 04-06.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-09-10T05:32:58.028Z",
    "resolved_at": null
  }
]
````
