---
schema_version: 1
open_count: 3
waived_count: 0
fixed_count: 0
total_count: 3
last_updated: 2026-09-04T06:04:22.078Z
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
  }
]
````
