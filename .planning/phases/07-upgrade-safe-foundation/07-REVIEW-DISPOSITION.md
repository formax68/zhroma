---
phase: 07
review: 07-REVIEW.md
titles: json
findings:
  - id: WR-01
    severity: warning
    disposition: open
    title: "The Phase 4 judge-text pin can be bypassed by top-level code outside the pinned slices"
  - id: WR-02
    severity: warning
    disposition: skipped
    title: "`apply-preference` acknowledges `applied: true` while the settings gate is still holding the tint back"
  - id: WR-03
    severity: warning
    disposition: open
    title: "`equal()` compares the raw requested value, not its parsed form, so a no-op save writes and bumps the CAS revision"
  - id: WR-04
    severity: warning
    disposition: open
    title: "A CAS stored form with a missing or corrupt `rev` resolves as `stored`, not `unreadable`"
  - id: WR-05
    severity: warning
    disposition: open
    title: "`defaultValue` is shared by reference and never frozen, despite \"private copies\""
  - id: WR-06
    severity: warning
    disposition: open
    title: "The frozen-contract network and remote patterns can be evaded, and the file can never be edited"
  - id: IN-01
    severity: info
    disposition: open
    title: "A hung settings read leaves every status at `'default'`, not `'unreadable'`"
  - id: IN-02
    severity: info
    disposition: open
    title: "A stored CAS revision at `Number.MAX_SAFE_INTEGER` makes that key unsaveable"
  - id: IN-03
    severity: info
    disposition: open
    title: "With the module loaded, a `set-setting` for an unregistered key gets no reply at all"
  - id: IN-04
    severity: info
    disposition: open
    title: "The dependency approvals do not list the transitive packages the two approved packages brought in"
  - id: IN-05
    severity: info
    disposition: open
    title: "The `typecheck` script duplicates the two tsc commands inside `test:recon`"
open: 10
total: 11
recorded: 2026-09-28T11:48:54.689Z
---

# Phase 07: Code Review Disposition

| Finding | Severity | Disposition | Source |
|---------|----------|-------------|--------|
| WR-01 | warning | open | - |
| WR-02 | warning | skipped | UAT 07 test 1 (2026-09-30): accepted as the cost of D-09's bounded 500 ms wait; the popup may read 'Checking this view' until reopened when the settings read is slow or hung |
| WR-03 | warning | open | - |
| WR-04 | warning | open | - |
| WR-05 | warning | open | - |
| WR-06 | warning | open | - |
| IN-01 | info | open | - |
| IN-02 | info | open | - |
| IN-03 | info | open | - |
| IN-04 | info | open | - |
| IN-05 | info | open | - |

Dispositions: `open` (recorded, not yet triaged), `fixed`, `skipped`, `deferred`.
Set `deferred` by hand and put the reason in the Source cell; both are preserved. A `|` in the reason is kept as prose and escaped on the next run.
Re-running the gate keeps every row it can. A row the current review no longer reports is kept and its Source cell flagged, so a finding does not leave this record silently. ONE exception: when a finding id is REUSED by a different finding, the earlier decision cannot keep a row — the id is taken — and it is dropped. A RECORDED decision (anything but `open`) is named on the console when that happens; a row still at `open` is replaced silently, because `open` records no decision to lose.
